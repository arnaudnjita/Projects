const fs = require('fs/promises')
const path = require('path')
const mysql = require('mysql2/promise')

const env = require('../src/config/env')

const seedPath = path.join(__dirname, '..', 'src', 'config', 'seed.sql')

async function run() {
  const sql = await fs.readFile(seedPath, 'utf8')
  const connection = await mysql.createConnection({
    database: env.database.name,
    host: env.database.host,
    multipleStatements: true,
    password: env.database.password,
    port: env.database.port,
    timezone: 'Z',
    user: env.database.user,
  })

  try {
    await connection.query(sql)
    console.log(`Seeded reference data in database ${env.database.name}.`)
  } finally {
    await connection.end()
  }
}

run().catch((error) => {
  console.error(`Seed failed: ${error.message}`)
  process.exit(1)
})
