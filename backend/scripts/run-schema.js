const fs = require('fs/promises')
const path = require('path')
const mysql = require('mysql2/promise')

const env = require('../src/config/env')

const schemaPath = path.join(__dirname, '..', 'src', 'config', 'schema.sql')

const resetStatements = [
  'DROP TABLE IF EXISTS password_reset_tokens',
  'DROP TABLE IF EXISTS contact_click_logs',
  'DROP TABLE IF EXISTS product_images',
  'DROP TABLE IF EXISTS products',
  'DROP TABLE IF EXISTS categories',
  'DROP TABLE IF EXISTS farmer_profiles',
  'DROP TABLE IF EXISTS users',
]

function shouldReset() {
  return process.argv.includes('--reset')
}

async function createConnection() {
  return mysql.createConnection({
    database: env.database.name,
    host: env.database.host,
    multipleStatements: true,
    password: env.database.password,
    port: env.database.port,
    timezone: 'Z',
    user: env.database.user,
  })
}

async function run() {
  if (shouldReset()) {
    if (env.nodeEnv === 'production' || process.env.ALLOW_DB_RESET !== 'true') {
      throw new Error('Refusing database reset. Set ALLOW_DB_RESET=true outside production to continue.')
    }
  }

  const sql = await fs.readFile(schemaPath, 'utf8')
  const connection = await createConnection()

  try {
    if (shouldReset()) {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0')
      for (const statement of resetStatements) {
        await connection.query(statement)
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1')
      console.log(`Reset schema objects in database ${env.database.name}.`)
    }

    await connection.query(sql)
    console.log(`Applied schema to database ${env.database.name}.`)
  } finally {
    await connection.end()
  }
}

run().catch((error) => {
  console.error(`Schema failed: ${error.message}`)
  process.exit(1)
})
