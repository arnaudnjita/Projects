const { pool } = require('../config/database')

async function listCategories(connection = pool) {
  const [rows] = await connection.execute(
    `SELECT category_id, name, description
     FROM categories
     ORDER BY name ASC`,
  )

  return rows
}

async function findCategoryById(categoryId, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT category_id, name, description
     FROM categories
     WHERE category_id = ?
     LIMIT 1`,
    [categoryId],
  )

  return rows[0] || null
}

module.exports = {
  findCategoryById,
  listCategories,
}
