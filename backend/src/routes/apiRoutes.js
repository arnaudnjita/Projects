const express = require('express')
const { getApiInfo } = require('../controllers/apiController')
const authRoutes = require('./authRoutes')
const farmerProfileRoutes = require('./farmerProfileRoutes')
const healthRoutes = require('./healthRoutes')

const router = express.Router()

router.get('/', getApiInfo)
router.use('/auth', authRoutes)
router.use('/farmers', farmerProfileRoutes)
router.use('/', healthRoutes)

module.exports = router
