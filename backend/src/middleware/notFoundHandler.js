const { NotFoundError } = require('../errors/AppError')

function notFoundHandler(req, _res, next) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`))
}

module.exports = notFoundHandler
