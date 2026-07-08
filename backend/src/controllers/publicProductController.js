const publicProductService = require('../services/publicProductService')
const { sendSuccess } = require('../utils/apiResponse')

async function listProducts(req, res) {
  const result = await publicProductService.listPublicProducts(req.query)
  return sendSuccess(res, { products: result.products }, { meta: result.meta })
}

async function listRecentProducts(req, res) {
  return sendSuccess(res, {
    products: await publicProductService.listRecentProducts(req.query.limit),
  })
}

async function getProductDetail(req, res) {
  return sendSuccess(res, {
    product: await publicProductService.getPublicProductDetail(Number(req.params.productId)),
  })
}

async function compareProducts(req, res) {
  return sendSuccess(res, {
    products: await publicProductService.compareProducts(req.query.ids),
  })
}

module.exports = {
  compareProducts,
  getProductDetail,
  listProducts,
  listRecentProducts,
}
