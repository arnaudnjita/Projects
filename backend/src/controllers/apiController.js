const env = require('../config/env')
const { sendSuccess } = require('../utils/apiResponse')

function getApiInfo(_req, res) {
  return sendSuccess(res, {
    name: `${env.appName} API`,
    version: '0.1.0',
  })
}

module.exports = {
  getApiInfo,
}
