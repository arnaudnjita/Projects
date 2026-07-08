const { AppError } = require('../errors/AppError')
const { sendError } = require('../utils/apiResponse')

function translateDatabaseError(err) {
  if (err?.code === 'ER_DUP_ENTRY') {
    return new AppError('A record with that value already exists.', {
      code: 'DUPLICATE_VALUE',
      statusCode: 409,
    })
  }

  if (
    err?.code === 'ER_NO_REFERENCED_ROW_2' ||
    err?.code === 'ER_ROW_IS_REFERENCED_2' ||
    err?.code === 'ER_NO_REFERENCED_ROW' ||
    err?.code === 'ER_ROW_IS_REFERENCED'
  ) {
    return new AppError('The request references related data that cannot be used.', {
      code: 'INVALID_REFERENCE',
      statusCode: 409,
    })
  }

  return null
}

function errorHandler(env) {
  return (err, req, res, _next) => {
    const translatedError = translateDatabaseError(err)
    const appError =
      translatedError ||
      (err instanceof AppError
        ? err
        : new AppError('Something went wrong.', {
            code: 'INTERNAL_ERROR',
            statusCode: 500,
          }))

    const errorBody = {
      code: appError.code,
      message: appError.message,
    }

    if (appError.fields) {
      errorBody.fields = appError.fields
    }

    if (env.nodeEnv !== 'production' && !appError.isOperational) {
      errorBody.requestId = req.id
    }

    if (env.nodeEnv !== 'production' && !translatedError && !(err instanceof AppError)) {
      console.error({
        error: err.message,
        requestId: req.id,
        stack: err.stack,
      })
    }

    sendError(res, errorBody, appError.statusCode)
  }
}

module.exports = errorHandler
