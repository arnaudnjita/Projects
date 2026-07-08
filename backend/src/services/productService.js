const { withTransaction } = require('../config/database')
const { AppError, NotFoundError } = require('../errors/AppError')
const categoryRepository = require('../repositories/categoryRepository')
const productRepository = require('../repositories/productRepository')
const imageStorageService = require('./imageStorageService')
const { parsePagination } = require('../utils/pagination')
const { parseAllowedSort } = require('../utils/sort')

const allowedStatuses = new Set(['active', 'sold_out', 'inactive'])
const sortAllowList = {
  newest: 'p.created_at DESC',
  oldest: 'p.created_at ASC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
}

function toNumber(value, field, { min = 0, positive = false } = {}) {
  const number = Number(value)

  if (!Number.isFinite(number) || number < min || (positive && number <= 0)) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field, message: `${field} must be a valid ${positive ? 'positive' : 'non-negative'} number.` }],
      statusCode: 422,
    })
  }

  return number
}

function parseJsonArray(value, field) {
  if (value === undefined || value === null || value === '') {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      throw new Error('Not an array')
    }

    return parsed
  } catch {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field, message: `${field} must be a valid JSON array.` }],
      statusCode: 422,
    })
  }
}

function imageUrlToThumbnailUrl(imageUrl) {
  return imageUrl.replace(/\.webp$/i, '-thumb.webp')
}

function mapImage(image) {
  return {
    imageUrl: image.image_url,
    productImageId: image.product_image_id,
    sortOrder: image.sort_order,
    thumbnailUrl: imageUrlToThumbnailUrl(image.image_url),
  }
}

function mapProduct(product, images = []) {
  return {
    category: {
      categoryId: product.category_id,
      name: product.category_name,
    },
    createdAt: product.created_at,
    description: product.description,
    images: images.map(mapImage),
    name: product.name,
    price: Number(product.price),
    productId: product.product_id,
    quantityAvailable: Number(product.quantity_available),
    status: product.status,
    unit: product.unit,
    updatedAt: product.updated_at,
  }
}

async function validateCategory(categoryId, connection) {
  const category = await categoryRepository.findCategoryById(categoryId, connection)

  if (!category) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'categoryId', message: 'Choose a valid category.' }],
      statusCode: 422,
    })
  }
}

function normalizeProductInput(input, currentProduct = null) {
  const quantityAvailable =
    input.quantityAvailable === undefined
      ? Number(currentProduct?.quantity_available)
      : toNumber(input.quantityAvailable, 'quantityAvailable')
  const statusInput = input.status || currentProduct?.status || (quantityAvailable === 0 ? 'sold_out' : 'active')
  const status = quantityAvailable === 0 && statusInput === 'active' ? 'sold_out' : statusInput

  if (!allowedStatuses.has(status)) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'status', message: 'Status must be active, sold_out, or inactive.' }],
      statusCode: 422,
    })
  }

  if (status === 'active' && quantityAvailable === 0) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'status', message: 'A product with zero quantity cannot be active.' }],
      statusCode: 422,
    })
  }

  return {
    categoryId:
      input.categoryId === undefined ? Number(currentProduct?.category_id) : Number(input.categoryId),
    description:
      input.description === undefined ? currentProduct?.description || null : String(input.description || '').trim() || null,
    name: input.name === undefined ? currentProduct?.name : String(input.name).trim(),
    price: input.price === undefined ? Number(currentProduct?.price) : toNumber(input.price, 'price'),
    quantityAvailable,
    status,
    unit: input.unit === undefined ? currentProduct?.unit : String(input.unit).trim(),
  }
}

async function storeUploadedProductImages(files) {
  const storedImages = []

  try {
    for (const file of files) {
      storedImages.push(await imageStorageService.storeProductImage(file))
    }

    return storedImages
  } catch (error) {
    await cleanupStoredImages(storedImages)
    throw error
  }
}

async function cleanupStoredImages(images) {
  await Promise.allSettled(images.map((image) => imageStorageService.deleteStoredFiles(image)))
}

async function cleanupImageRows(images) {
  await Promise.allSettled(images.map((image) => imageStorageService.deleteStoredFileByPublicUrl(image.image_url)))
}

async function createProduct(farmerUserId, input, files) {
  if (!files || files.length === 0) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'images', message: 'Add at least one product image.' }],
      statusCode: 422,
    })
  }

  const productInput = normalizeProductInput(input)
  const storedImages = await storeUploadedProductImages(files)

  try {
    const product = await withTransaction(async (connection) => {
      await validateCategory(productInput.categoryId, connection)
      const productId = await productRepository.createProduct(
        {
          ...productInput,
          farmerUserId,
        },
        connection,
      )

      await productRepository.addProductImages(
        productId,
        storedImages.map((image, index) => ({
          imageUrl: image.publicUrl,
          sortOrder: index,
        })),
        connection,
      )

      return getProductForFarmer(farmerUserId, productId, connection)
    })

    return product
  } catch (error) {
    await cleanupStoredImages(storedImages)
    throw error
  }
}

async function getProductForFarmer(farmerUserId, productId, connection) {
  const product = await productRepository.findProductByIdForFarmer(productId, farmerUserId, connection)

  if (!product) {
    throw new NotFoundError('Product was not found.')
  }

  const images = await productRepository.listProductImages(productId, connection)
  return mapProduct(product, images)
}

async function listProductsForFarmer(farmerUserId, query) {
  const pagination = parsePagination(query)
  const filters = {
    ...pagination,
    search: query.search ? String(query.search).trim() : null,
    sortSql: parseAllowedSort(query.sort || 'newest', sortAllowList, 'newest'),
    status: allowedStatuses.has(query.status) ? query.status : null,
  }
  const result = await productRepository.listProductsForFarmer(farmerUserId, filters)
  const images = await productRepository.listProductImagesForFarmer(result.rows.map((product) => product.product_id))
  const imagesByProduct = images.reduce((grouped, image) => {
    const productImages = grouped.get(image.product_id) || []
    productImages.push(image)
    grouped.set(image.product_id, productImages)
    return grouped
  }, new Map())
  const counts = await productRepository.getDashboardCounts(farmerUserId)

  return {
    counts,
    meta: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: result.total,
    },
    products: result.rows.map((product) => mapProduct(product, imagesByProduct.get(product.product_id) || [])),
  }
}

async function updateProduct(farmerUserId, productId, input, files) {
  const storedImages = await storeUploadedProductImages(files || [])
  let removedImages = []

  try {
    const product = await withTransaction(async (connection) => {
      const currentProduct = await productRepository.findProductByIdForFarmer(productId, farmerUserId, connection)

      if (!currentProduct) {
        throw new NotFoundError('Product was not found.')
      }

      const productInput = normalizeProductInput(input, currentProduct)
      await validateCategory(productInput.categoryId, connection)

      const deleteImageIds = parseJsonArray(input.deleteImageIds, 'deleteImageIds').map(Number)
      const imageSortOrders = parseJsonArray(input.imageSortOrders, 'imageSortOrders').map((image) => ({
        productImageId: Number(image.productImageId),
        sortOrder: Number(image.sortOrder),
      }))

      removedImages = await productRepository.deleteImagesByIds(productId, deleteImageIds, connection)

      const remainingImages = await productRepository.listProductImages(productId, connection)
      if (remainingImages.length + storedImages.length === 0) {
        throw new AppError('Please check the highlighted fields.', {
          code: 'VALIDATION_ERROR',
          fields: [{ field: 'images', message: 'A product must have at least one image.' }],
          statusCode: 422,
        })
      }

      if (remainingImages.length + storedImages.length > imageStorageService.maxProductImageCount) {
        throw new AppError('Please check the highlighted fields.', {
          code: 'VALIDATION_ERROR',
          fields: [
            {
              field: 'images',
              message: `A product can have no more than ${imageStorageService.maxProductImageCount} images.`,
            },
          ],
          statusCode: 422,
        })
      }

      await productRepository.updateProduct(productId, farmerUserId, productInput, connection)
      await productRepository.updateImageSortOrders(productId, imageSortOrders, connection)
      await productRepository.addProductImages(
        productId,
        storedImages.map((image, index) => ({
          imageUrl: image.publicUrl,
          sortOrder: remainingImages.length + index,
        })),
        connection,
      )

      return getProductForFarmer(farmerUserId, productId, connection)
    })

    await cleanupImageRows(removedImages)
    return product
  } catch (error) {
    await cleanupStoredImages(storedImages)
    throw error
  }
}

async function updateQuantity(farmerUserId, productId, quantityValue) {
  const quantityAvailable = toNumber(quantityValue, 'quantityAvailable')

  return withTransaction(async (connection) => {
    const currentProduct = await productRepository.findProductByIdForFarmer(productId, farmerUserId, connection)

    if (!currentProduct) {
      throw new NotFoundError('Product was not found.')
    }

    const status = quantityAvailable === 0 ? 'sold_out' : currentProduct.status
    await productRepository.updateQuantity(productId, farmerUserId, quantityAvailable, status, connection)
    return getProductForFarmer(farmerUserId, productId, connection)
  })
}

async function updateStatus(farmerUserId, productId, status) {
  if (!allowedStatuses.has(status)) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'status', message: 'Status must be active, sold_out, or inactive.' }],
      statusCode: 422,
    })
  }

  return withTransaction(async (connection) => {
    const currentProduct = await productRepository.findProductByIdForFarmer(productId, farmerUserId, connection)

    if (!currentProduct) {
      throw new NotFoundError('Product was not found.')
    }

    if (status === 'active' && Number(currentProduct.quantity_available) === 0) {
      throw new AppError('Please check the highlighted fields.', {
        code: 'VALIDATION_ERROR',
        fields: [{ field: 'status', message: 'A product with zero quantity cannot be active.' }],
        statusCode: 422,
      })
    }

    await productRepository.updateStatus(productId, farmerUserId, status, connection)
    return getProductForFarmer(farmerUserId, productId, connection)
  })
}

async function deleteProduct(farmerUserId, productId) {
  const result = await withTransaction(async (connection) => {
    const currentProduct = await productRepository.findProductByIdForFarmer(productId, farmerUserId, connection)

    if (!currentProduct) {
      throw new NotFoundError('Product was not found.')
    }

    return productRepository.deleteProduct(productId, farmerUserId, connection)
  })

  await cleanupImageRows(result.images)
  return { deleted: true }
}

module.exports = {
  createProduct,
  deleteProduct,
  getProductForFarmer,
  listProductsForFarmer,
  updateProduct,
  updateQuantity,
  updateStatus,
}
