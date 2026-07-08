const crypto = require('crypto')

function requestContext(req, res, next) {
  const requestId = req.get('x-request-id') || crypto.randomUUID()

  req.id = requestId
  res.setHeader('x-request-id', requestId)
  next()
}

module.exports = requestContext
