const express = require('express')
const productController = require('../controllers/productController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')
const { productImagesUpload } = require('../middleware/uploadMiddleware')
const asyncHandler = require('../utils/asyncHandler')
const {
  productCreateValidator,
  productIdParam,
  productUpdateValidator,
  quantityValidator,
  statusValidator,
} = require('../validators/productValidators')

const router = express.Router()

router.use(requireAuth, requireRole('farmer'))
router.post('/products', productImagesUpload, productCreateValidator, asyncHandler(productController.createProduct))
router.get('/products', asyncHandler(productController.listProducts))
router.get('/products/:productId', productIdParam, asyncHandler(productController.getProduct))
router.put('/products/:productId', productImagesUpload, productUpdateValidator, asyncHandler(productController.updateProduct))
router.patch('/products/:productId/quantity', quantityValidator, asyncHandler(productController.updateQuantity))
router.patch('/products/:productId/status', statusValidator, asyncHandler(productController.updateStatus))
router.delete('/products/:productId', productIdParam, asyncHandler(productController.deleteProduct))

module.exports = router
