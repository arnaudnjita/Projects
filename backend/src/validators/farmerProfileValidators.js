const { body } = require('express-validator')
const { AppError } = require('../errors/AppError')

const allowedProfileFields = new Set([
  'accountLocation',
  'bio',
  'farmLocation',
  'name',
  'phone',
  'produceSpecialty',
  'whatsappPhone',
])

function rejectUnsupportedProfileFields(req, _res, next) {
  const unsupportedFields = Object.keys(req.body || {}).filter((field) => !allowedProfileFields.has(field))

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

const updateFarmerProfileValidator = [
  rejectUnsupportedProfileFields,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.').isLength({ max: 120 }).withMessage('Name is too long.'),
  body('accountLocation')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Account location cannot be empty.')
    .isLength({ max: 160 })
    .withMessage('Account location is too long.'),
  body('farmLocation')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Farm location cannot be empty.')
    .isLength({ max: 160 })
    .withMessage('Farm location is too long.'),
  body('produceSpecialty')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 160 })
    .withMessage('Produce specialty is too long.'),
  body('bio').optional({ nullable: true }).trim().isLength({ max: 1000 }).withMessage('Bio is too long.'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
  body('whatsappPhone').optional({ nullable: true }).trim(),
]

module.exports = {
  updateFarmerProfileValidator,
}
