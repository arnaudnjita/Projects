const { pool } = require('../config/database')

function baseProductSelect() {
  return `SELECT
    p.product_id,
    p.farmer_user_id,
    p.category_id,
    c.name AS category_name,
    p.name,
    p.description,
    p.price,
    p.unit,
    p.quantity_available,
    p.status,
    p.created_at,
    p.updated_at
  FROM products p
  INNER JOIN categories c ON c.category_id = p.category_id`
}

async function createProduct(product, connection = pool) {
  const [result] = await connection.execute(
    `INSERT INTO products
       (farmer_user_id, category_id, name, description, price, unit, quantity_available, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.farmerUserId,
      product.categoryId,
      product.name,
      product.description,
      product.price,
      product.unit,
      product.quantityAvailable,
      product.status,
    ],
  )

  return result.insertId
}

async function updateProduct(productId, farmerUserId, product, connection = pool) {
  const [result] = await connection.execute(
    `UPDATE products
     SET category_id = ?,
         name = ?,
         description = ?,
         price = ?,
         unit = ?,
         quantity_available = ?,
         status = ?
     WHERE product_id = ? AND farmer_user_id = ?`,
    [
      product.categoryId,
      product.name,
      product.description,
      product.price,
      product.unit,
      product.quantityAvailable,
      product.status,
      productId,
      farmerUserId,
    ],
  )

  return result.affectedRows
}

async function findProductByIdForFarmer(productId, farmerUserId, connection = pool) {
  const [rows] = await connection.execute(
    `${baseProductSelect()}
     WHERE p.product_id = ? AND p.farmer_user_id = ?
     LIMIT 1`,
    [productId, farmerUserId],
  )

  return rows[0] || null
}

async function listProductsForFarmer(farmerUserId, filters, connection = pool) {
  const values = [farmerUserId]
  const conditions = ['p.farmer_user_id = ?']
  const limit = Number(filters.limit)
  const offset = Number(filters.offset)

  if (filters.status) {
    conditions.push('p.status = ?')
    values.push(filters.status)
  }

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)')
    values.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  const [rows] = await connection.execute(
    `${baseProductSelect()}
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${filters.sortSql}
     LIMIT ${limit} OFFSET ${offset}`,
    values,
  )

  const [[countRow]] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM products p
     WHERE ${conditions.join(' AND ')}`,
    values,
  )

  return {
    rows,
    total: Number(countRow.total || 0),
  }
}

async function getDashboardCounts(farmerUserId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT status, COUNT(*) AS count
     FROM products
     WHERE farmer_user_id = ?
     GROUP BY status`,
    [farmerUserId],
  )

  return rows.reduce(
    (counts, row) => ({
      ...counts,
      [row.status]: Number(row.count),
    }),
    { active: 0, inactive: 0, sold_out: 0 },
  )
}

async function addProductImages(productId, images, connection = pool) {
  for (const image of images) {
    await connection.execute(
      `INSERT INTO product_images (product_id, image_url, sort_order)
       VALUES (?, ?, ?)`,
      [productId, image.imageUrl, image.sortOrder],
    )
  }
}

async function listProductImages(productId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT product_image_id, product_id, image_url, sort_order
     FROM product_images
     WHERE product_id = ?
     ORDER BY sort_order ASC, product_image_id ASC`,
    [productId],
  )

  return rows
}

async function listProductImagesForFarmer(productIds, connection = pool) {
  if (productIds.length === 0) {
    return []
  }

  const placeholders = productIds.map(() => '?').join(', ')
  const [rows] = await connection.execute(
    `SELECT pi.product_image_id, pi.product_id, pi.image_url, pi.sort_order
     FROM product_images pi
     WHERE pi.product_id IN (${placeholders})
     ORDER BY pi.product_id ASC, pi.sort_order ASC, pi.product_image_id ASC`,
    productIds,
  )

  return rows
}

async function deleteImagesByIds(productId, imageIds, connection = pool) {
  if (imageIds.length === 0) {
    return []
  }

  const placeholders = imageIds.map(() => '?').join(', ')
  const [rows] = await connection.execute(
    `SELECT product_image_id, image_url
     FROM product_images
     WHERE product_id = ? AND product_image_id IN (${placeholders})`,
    [productId, ...imageIds],
  )

  await connection.execute(
    `DELETE FROM product_images
     WHERE product_id = ? AND product_image_id IN (${placeholders})`,
    [productId, ...imageIds],
  )

  return rows
}

async function updateImageSortOrders(productId, imageSortOrders, connection = pool) {
  for (const image of imageSortOrders) {
    await connection.execute(
      `UPDATE product_images
       SET sort_order = ?
       WHERE product_id = ? AND product_image_id = ?`,
      [image.sortOrder, productId, image.productImageId],
    )
  }
}

async function updateQuantity(productId, farmerUserId, quantityAvailable, status, connection = pool) {
  const [result] = await connection.execute(
    `UPDATE products
     SET quantity_available = ?, status = ?
     WHERE product_id = ? AND farmer_user_id = ?`,
    [quantityAvailable, status, productId, farmerUserId],
  )

  return result.affectedRows
}

async function updateStatus(productId, farmerUserId, status, connection = pool) {
  const [result] = await connection.execute(
    `UPDATE products
     SET status = ?
     WHERE product_id = ? AND farmer_user_id = ?`,
    [status, productId, farmerUserId],
  )

  return result.affectedRows
}

async function deleteProduct(productId, farmerUserId, connection = pool) {
  const images = await listProductImages(productId, connection)
  const [result] = await connection.execute(
    `DELETE FROM products
     WHERE product_id = ? AND farmer_user_id = ?`,
    [productId, farmerUserId],
  )

  return {
    deleted: result.affectedRows > 0,
    images,
  }
}

module.exports = {
  addProductImages,
  createProduct,
  deleteImagesByIds,
  deleteProduct,
  findProductByIdForFarmer,
  getDashboardCounts,
  listProductImages,
  listProductImagesForFarmer,
  listProductsForFarmer,
  updateImageSortOrders,
  updateProduct,
  updateQuantity,
  updateStatus,
}
