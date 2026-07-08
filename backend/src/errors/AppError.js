class AppError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'AppError'
    this.code = options.code || 'APP_ERROR'
    this.fields = options.fields
    this.isOperational = true
    this.statusCode = options.statusCode || 500
  }
}

class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super(message, {
      code: 'NOT_FOUND',
      statusCode: 404,
    })
  }
}

module.exports = {
  AppError,
  NotFoundError,
}
