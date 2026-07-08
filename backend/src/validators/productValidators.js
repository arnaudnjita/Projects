const { body, param } = require('express-validator')

const productIdParam = [param('productId').isInt({ min: 1 }).withMessage('Product ID must be valid.')]

const productCreateValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 160 }).withMessage('Name is too long.'),
  body('categoryId').isInt({ min: 1 }).withMessage('Choose a valid category.'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a valid non-negative number.'),
  body('unit').trim().notEmpty().withMessage('Unit is required.').isLength({ max: 40 }).withMessage('Unit is too long.'),
  body('quantityAvailable').isFloat({ min: 0 }).withMessage('Quantity must be a valid non-negative number.'),
  body('status').optional().isIn(['active', 'sold_out', 'inactive']).withMessage('Status must be active, sold_out, or inactive.'),
]

const productUpdateValidator = [
  ...productIdParam,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.').isLength({ max: 160 }).withMessage('Name is too long.'),
  body('categoryId').optional().isInt({ min: 1 }).withMessage('Choose a valid category.'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Description is too long.'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a valid non-negative number.'),
  body('unit').optional().trim().notEmpty().withMessage('Unit cannot be empty.').isLength({ max: 40 }).withMessage('Unit is too long.'),
  body('quantityAvailable').optional().isFloat({ min: 0 }).withMessage('Quantity must be a valid non-negative number.'),
  body('status').optional().isIn(['active', 'sold_out', 'inactive']).withMessage('Status must be active, sold_out, or inactive.'),
]

const quantityValidator = [
  ...productIdParam,
  body('quantityAvailable').isFloat({ min: 0 }).withMessage('Quantity must be a valid non-negative number.'),
]

const statusValidator = [
  ...productIdParam,
  body('status').isIn(['active', 'sold_out', 'inactive']).withMessage('Status must be active, sold_out, or inactive.'),
]

module.exports = {
  productCreateValidator,
  productIdParam,
  productUpdateValidator,
  quantityValidator,
  statusValidator,
}
