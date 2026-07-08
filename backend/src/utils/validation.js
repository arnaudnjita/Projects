const { validationResult } = require('express-validator')
const { AppError } = require('../errors/AppError')

function formatValidationFields(errors) {
  return errors.array().map((error) => ({
    field: error.path || error.param,
    message: error.msg,
  }))
}

function throwIfValidationFailed(req) {
  const result = validationResult(req)

  if (!result.isEmpty()) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: formatValidationFields(result),
      statusCode: 422,
    })
  }
}

module.exports = {
  formatValidationFields,
  throwIfValidationFailed,
}
