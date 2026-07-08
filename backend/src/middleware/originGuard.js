const { AppError } = require('../errors/AppError')

function createOriginGuard(allowedOrigins) {
  const origins = new Set(allowedOrigins)

  return (req, _res, next) => {
    const origin = req.get('origin')

    if (origin && !origins.has(origin)) {
      next(
        new AppError('Origin is not allowed.', {
          code: 'ORIGIN_NOT_ALLOWED',
          statusCode: 403,
        }),
      )
      return
    }

    next()
  }
}

module.exports = createOriginGuard
