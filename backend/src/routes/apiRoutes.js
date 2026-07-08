const express = require('express')
const { getApiInfo } = require('../controllers/apiController')
const csrfController = require('../controllers/csrfController')
const authRoutes = require('./authRoutes')
const farmerProfileRoutes = require('./farmerProfileRoutes')
const healthRoutes = require('./healthRoutes')
const categoryRoutes = require('./categoryRoutes')
const productRoutes = require('./productRoutes')
const publicProductRoutes = require('./publicProductRoutes')

const router = express.Router()

router.get('/', getApiInfo)
router.get('/csrf', csrfController.getCsrfToken)
router.use('/auth', authRoutes)
router.use('/categories', categoryRoutes)
router.use('/farmer', productRoutes)
router.use('/farmers', farmerProfileRoutes)
router.use('/products', publicProductRoutes)
router.use('/', healthRoutes)

module.exports = router
