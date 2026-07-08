const { AppError } = require('../errors/AppError')
const csrfService = require('../services/csrfService')

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

function csrfProtection(req, _res, next) {
  if (safeMethods.has(req.method) || !req.get('origin')) {
    next()
    return
  }

  const token = req.get('x-csrf-token')

  if (!csrfService.verifyCsrfToken(token)) {
    next(
      new AppError('Security token is missing or expired. Please refresh the page and try again.', {
        code: 'CSRF_TOKEN_INVALID',
        statusCode: 403,
      }),
    )
    return
  }

  next()
}

module.exports = csrfProtection
