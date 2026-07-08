const { pool } = require('../config/database')

function publicProductSelect() {
  return `SELECT
    p.product_id,
    p.name,
    p.description,
    p.price,
    p.unit,
    p.quantity_available,
    p.status,
    p.created_at,
    c.category_id,
    c.name AS category_name,
    u.user_id AS farmer_user_id,
    u.name AS farmer_name,
    u.phone AS farmer_phone,
    u.location AS farmer_account_location,
    fp.farm_location,
    fp.produce_specialty,
    fp.whatsapp_phone,
    fp.profile_photo_url
  FROM products p
  INNER JOIN categories c ON c.category_id = p.category_id
  INNER JOIN users u ON u.user_id = p.farmer_user_id
  INNER JOIN farmer_profiles fp ON fp.user_id = u.user_id`
}

async function listPublicProducts(filters, connection = pool) {
  const conditions = ['p.status = ?']
  const values = ['active']
  const limit = Number(filters.limit)
  const offset = Number(filters.offset)

  if (filters.search) {
    conditions.push('(p.name LIKE ? OR p.description LIKE ?)')
    values.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  if (filters.categoryId) {
    conditions.push('p.category_id = ?')
    values.push(filters.categoryId)
  }

  if (filters.location) {
    conditions.push('(u.location LIKE ? OR fp.farm_location LIKE ?)')
    values.push(`%${filters.location}%`, `%${filters.location}%`)
  }

  if (filters.minPrice !== null) {
    conditions.push('p.price >= ?')
    values.push(filters.minPrice)
  }

  if (filters.maxPrice !== null) {
    conditions.push('p.price <= ?')
    values.push(filters.maxPrice)
  }

  const whereClause = conditions.join(' AND ')

  const [rows] = await connection.execute(
    `${publicProductSelect()}
     WHERE ${whereClause}
     ORDER BY ${filters.sortSql}, p.product_id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    values,
  )

  const [[countRow]] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM products p
     INNER JOIN users u ON u.user_id = p.farmer_user_id
     INNER JOIN farmer_profiles fp ON fp.user_id = u.user_id
     WHERE ${whereClause}`,
    values,
  )

  return {
    rows,
    total: Number(countRow.total || 0),
  }
}

async function listRecentPublicProducts(limit, connection = pool) {
  const safeLimit = Number(limit)
  const [rows] = await connection.execute(
    `${publicProductSelect()}
     WHERE p.status = 'active'
     ORDER BY p.created_at DESC, p.product_id DESC
     LIMIT ${safeLimit}`,
  )

  return rows
}

async function findPublicProductById(productId, connection = pool) {
  const [rows] = await connection.execute(
    `${publicProductSelect()}
     WHERE p.product_id = ? AND p.status IN ('active', 'sold_out')
     LIMIT 1`,
    [productId],
  )

  return rows[0] || null
}

async function listActiveProductsByIds(productIds, connection = pool) {
  if (productIds.length === 0) {
    return []
  }

  const placeholders = productIds.map(() => '?').join(', ')
  const [rows] = await connection.execute(
    `${publicProductSelect()}
     WHERE p.status = 'active' AND p.product_id IN (${placeholders})`,
    productIds,
  )

  return rows
}

async function listImagesForProducts(productIds, connection = pool) {
  if (productIds.length === 0) {
    return []
  }

  const placeholders = productIds.map(() => '?').join(', ')
  const [rows] = await connection.execute(
    `SELECT product_image_id, product_id, image_url, sort_order
     FROM product_images
     WHERE product_id IN (${placeholders})
     ORDER BY product_id ASC, sort_order ASC, product_image_id ASC`,
    productIds,
  )

  return rows
}

module.exports = {
  findPublicProductById,
  listActiveProductsByIds,
  listImagesForProducts,
  listPublicProducts,
  listRecentPublicProducts,
}
