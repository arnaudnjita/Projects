const csrfService = require('../services/csrfService')
const { sendSuccess } = require('../utils/apiResponse')

function getCsrfToken(_req, res) {
  return sendSuccess(res, {
    csrfToken: csrfService.createCsrfToken(),
    expiresInSeconds: Math.floor(csrfService.csrfTokenTtlMs / 1000),
  })
}

module.exports = {
  getCsrfToken,
}
