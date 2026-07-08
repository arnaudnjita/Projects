const env = require('../config/env')
const database = require('../config/database')
const { sendSuccess } = require('../utils/apiResponse')

async function getHealth(_req, res) {
  const databaseAvailable = await database.testDatabaseConnection()
  const httpStatus = databaseAvailable ? 200 : 503

  return sendSuccess(
    res,
    {
      application: env.appName,
      database: databaseAvailable ? 'ok' : 'unavailable',
      environment: env.nodeEnv,
      status: databaseAvailable ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    },
    { statusCode: httpStatus },
  )
}

module.exports = {
  getHealth,
}
