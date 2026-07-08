const express = require('express')
const { param } = require('express-validator')
const publicProductController = require('../controllers/publicProductController')
const asyncHandler = require('../utils/asyncHandler')
const { throwIfValidationFailed } = require('../utils/validation')

const router = express.Router()

function validateRequest(req, _res, next) {
  try {
    throwIfValidationFailed(req)
    next()
  } catch (error) {
    next(error)
  }
}

router.get('/', asyncHandler(publicProductController.listProducts))
router.get('/recent', asyncHandler(publicProductController.listRecentProducts))
router.get('/compare', asyncHandler(publicProductController.compareProducts))
router.get(
  '/:productId',
  param('productId').isInt({ min: 1 }).withMessage('Product ID must be valid.'),
  validateRequest,
  asyncHandler(publicProductController.getProductDetail),
)

module.exports = router
