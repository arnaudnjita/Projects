const app = require('./app')
const { closeDatabasePool, testDatabaseConnection } = require('./config/database')
const env = require('./config/env')

let server
let isShuttingDown = false

async function shutdown(signal) {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.log(`${signal} received. Shutting down ${env.appName} API.`)

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
    }
  } finally {
    await closeDatabasePool()
  }
}

async function startServer() {
  const databaseAvailable = await testDatabaseConnection()

  if (!databaseAvailable) {
    throw new Error('Database connection check failed. Verify DB_* environment variables and MySQL availability.')
  }

  server = app.listen(env.port, () => {
    console.log(`${env.appName} API listening on port ${env.port}`)
  })

  process.on('SIGINT', () => {
    shutdown('SIGINT')
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error.message)
        process.exit(1)
      })
  })

  process.on('SIGTERM', () => {
    shutdown('SIGTERM')
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error.message)
        process.exit(1)
      })
  })

  return server
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}

module.exports = {
  shutdown,
  startServer,
}
