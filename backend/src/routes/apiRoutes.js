const express = require('express')
const { getApiInfo } = require('../controllers/apiController')
const authRoutes = require('./authRoutes')
const healthRoutes = require('./healthRoutes')

const router = express.Router()

router.get('/', getApiInfo)
router.use('/auth', authRoutes)
router.use('/', healthRoutes)

module.exports = router
