const env = require('../config/env')
const database = require('../config/database')

async function getHealth(_req, res) {
  const databaseAvailable = await database.testDatabaseConnection()
  const httpStatus = databaseAvailable ? 200 : 503

  res.status(httpStatus).json({
    data: {
      application: env.appName,
      database: databaseAvailable ? 'ok' : 'unavailable',
      environment: env.nodeEnv,
      status: databaseAvailable ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    },
  })
}

module.exports = {
  getHealth,
}
