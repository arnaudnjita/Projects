const productService = require('../services/productService')
const { sendSuccess } = require('../utils/apiResponse')
const { throwIfValidationFailed } = require('../utils/validation')

async function createProduct(req, res) {
  throwIfValidationFailed(req)
  const product = await productService.createProduct(req.user.userId, req.body, req.files || [])
  return sendSuccess(res, { product }, { statusCode: 201 })
}

async function listProducts(req, res) {
  const result = await productService.listProductsForFarmer(req.user.userId, req.query)
  return sendSuccess(res, { counts: result.counts, products: result.products }, { meta: result.meta })
}

async function getProduct(req, res) {
  throwIfValidationFailed(req)
  return sendSuccess(res, {
    product: await productService.getProductForFarmer(req.user.userId, Number(req.params.productId)),
  })
}

async function updateProduct(req, res) {
  throwIfValidationFailed(req)
  return sendSuccess(res, {
    product: await productService.updateProduct(req.user.userId, Number(req.params.productId), req.body, req.files || []),
  })
}

async function updateQuantity(req, res) {
  throwIfValidationFailed(req)
  return sendSuccess(res, {
    product: await productService.updateQuantity(req.user.userId, Number(req.params.productId), req.body.quantityAvailable),
  })
}

async function updateStatus(req, res) {
  throwIfValidationFailed(req)
  return sendSuccess(res, {
    product: await productService.updateStatus(req.user.userId, Number(req.params.productId), req.body.status),
  })
}

async function deleteProduct(req, res) {
  throwIfValidationFailed(req)
  return sendSuccess(res, await productService.deleteProduct(req.user.userId, Number(req.params.productId)))
}

module.exports = {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  updateQuantity,
  updateStatus,
}
