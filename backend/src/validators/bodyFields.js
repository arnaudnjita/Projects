const { AppError } = require('../errors/AppError')

function rejectUnsupportedFields(allowedFields) {
  const allowed = new Set(allowedFields)

  return (req, _res, next) => {
    const unsupportedFields = Object.keys(req.body || {}).filter((field) => !allowed.has(field))

    if (unsupportedFields.length > 0) {
      next(
        new AppError('Please check the highlighted fields.', {
          code: 'VALIDATION_ERROR',
          fields: unsupportedFields.map((field) => ({
            field,
            message: 'This field is not supported.',
          })),
          statusCode: 422,
        }),
      )
      return
    }

    next()
  }
}

module.exports = {
  rejectUnsupportedFields,
}
