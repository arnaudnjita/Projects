const mysql = require('mysql2/promise')
const env = require('./env')

const pool = mysql.createPool({
  connectionLimit: 10,
  database: env.database.name,
  dateStrings: true,
  decimalNumbers: false,
  host: env.database.host,
  namedPlaceholders: true,
  password: env.database.password,
  port: env.database.port,
  queueLimit: 0,
  timezone: 'Z',
  user: env.database.user,
  waitForConnections: true,
})

async function testDatabaseConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    return rows?.[0]?.ok === 1
  } catch {
    return false
  }
}

async function closeDatabasePool() {
  await pool.end()
}

async function withTransaction(callback) {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

module.exports = {
  closeDatabasePool,
  pool,
  testDatabaseConnection,
  withTransaction,
}
