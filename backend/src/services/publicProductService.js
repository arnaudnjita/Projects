const { AppError, NotFoundError } = require('../errors/AppError')
const publicProductRepository = require('../repositories/publicProductRepository')
const { parsePagination } = require('../utils/pagination')
const { parseAllowedSort } = require('../utils/sort')

const sortAllowList = {
  newest: 'p.created_at DESC',
  oldest: 'p.created_at ASC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
}

function parseOptionalNumber(value, field) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field, message: `${field} must be a valid non-negative number.` }],
      statusCode: 422,
    })
  }

  return number
}

function parseCategoryId(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const categoryId = Number(value)

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'categoryId', message: 'Choose a valid category.' }],
      statusCode: 422,
    })
  }

  return categoryId
}

function imageUrlToThumbnailUrl(imageUrl) {
  return imageUrl.replace(/\.webp$/i, '-thumb.webp')
}

function groupImages(images) {
  return images.reduce((grouped, image) => {
    const productImages = grouped.get(image.product_id) || []
    productImages.push(image)
    grouped.set(image.product_id, productImages)
    return grouped
  }, new Map())
}

function mapFarmer(product) {
  return {
    accountLocation: product.farmer_account_location,
    farmLocation: product.farm_location || product.farmer_account_location,
    farmerId: product.farmer_user_id,
    name: product.farmer_name,
    phone: product.farmer_phone,
    profilePhotoUrl: product.profile_photo_url,
    specialty: product.produce_specialty,
    whatsappPhone: product.whatsapp_phone || product.farmer_phone,
  }
}

function mapCardProduct(product, images = []) {
  const primaryImage = images[0] || null

  return {
    category: {
      categoryId: product.category_id,
      name: product.category_name,
    },
    createdAt: product.created_at,
    farmer: mapFarmer(product),
    imageCount: images.length,
    name: product.name,
    price: Number(product.price),
    productId: product.product_id,
    quantityAvailable: Number(product.quantity_available),
    status: product.status,
    thumbnailUrl: primaryImage ? imageUrlToThumbnailUrl(primaryImage.image_url) : null,
    unit: product.unit,
  }
}

function mapDetailProduct(product, images = []) {
  return {
    ...mapCardProduct(product, images),
    description: product.description,
    images: images.map((image) => ({
      imageUrl: image.image_url,
      productImageId: image.product_image_id,
      sortOrder: image.sort_order,
      thumbnailUrl: imageUrlToThumbnailUrl(image.image_url),
    })),
  }
}

function buildFilters(query) {
  const pagination = parsePagination(query)
  const minPrice = parseOptionalNumber(query.minPrice, 'minPrice')
  const maxPrice = parseOptionalNumber(query.maxPrice, 'maxPrice')
  const sort = query.sort || 'newest'

  if (!Object.prototype.hasOwnProperty.call(sortAllowList, sort)) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'sort', message: 'Sort must be newest, oldest, price_asc, or price_desc.' }],
      statusCode: 422,
    })
  }

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'minPrice', message: 'Minimum price cannot be greater than maximum price.' }],
      statusCode: 422,
    })
  }

  return {
    ...pagination,
    categoryId: parseCategoryId(query.categoryId ?? query.category),
    location: query.location ? String(query.location).trim() : null,
    maxPrice,
    minPrice,
    search: query.search ? String(query.search).trim() : null,
    sortSql: parseAllowedSort(sort, sortAllowList, 'newest'),
  }
}

async function listPublicProducts(query) {
  const filters = buildFilters(query)
  const result = await publicProductRepository.listPublicProducts(filters)
  const images = await publicProductRepository.listImagesForProducts(result.rows.map((product) => product.product_id))
  const imagesByProduct = groupImages(images)

  return {
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: result.total,
    },
    products: result.rows.map((product) => mapCardProduct(product, imagesByProduct.get(product.product_id) || [])),
  }
}

async function listRecentProducts(limitValue = 6) {
  const limit = Number(limitValue || 6)
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 20 ? limit : 6
  const products = await publicProductRepository.listRecentPublicProducts(safeLimit)
  const images = await publicProductRepository.listImagesForProducts(products.map((product) => product.product_id))
  const imagesByProduct = groupImages(images)

  return products.map((product) => mapCardProduct(product, imagesByProduct.get(product.product_id) || []))
}

async function getPublicProductDetail(productId) {
  const product = await publicProductRepository.findPublicProductById(productId)

  if (!product) {
    throw new NotFoundError('Product was not found.')
  }

  const images = await publicProductRepository.listImagesForProducts([product.product_id])
  return mapDetailProduct(product, images)
}

function parseCompareIds(value) {
  const ids = String(value || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  const numericIds = ids.map(Number)
  const uniqueIds = [...new Set(numericIds)]

  if (
    ids.length < 2 ||
    ids.length > 4 ||
    uniqueIds.length !== ids.length ||
    numericIds.some((id) => !Number.isInteger(id) || id < 1)
  ) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'ids', message: 'Compare requires two to four unique numeric product IDs.' }],
      statusCode: 422,
    })
  }

  return numericIds
}

async function compareProducts(idsValue) {
  const ids = parseCompareIds(idsValue)
  const products = await publicProductRepository.listActiveProductsByIds(ids)
  const byId = new Map(products.map((product) => [Number(product.product_id), product]))
  const missingIds = ids.filter((id) => !byId.has(id))

  if (missingIds.length > 0) {
    throw new AppError('Some products are unavailable for comparison.', {
      code: 'PRODUCTS_UNAVAILABLE',
      fields: [{ field: 'ids', message: `Unavailable product IDs: ${missingIds.join(', ')}` }],
      statusCode: 404,
    })
  }

  const images = await publicProductRepository.listImagesForProducts(ids)
  const imagesByProduct = groupImages(images)

  return ids.map((id) => mapCardProduct(byId.get(id), imagesByProduct.get(id) || []))
}

module.exports = {
  compareProducts,
  getPublicProductDetail,
  listPublicProducts,
  listRecentProducts,
}
