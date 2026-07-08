const express = require('express')
const { getHealth } = require('../controllers/healthController')
const asyncHandler = require('../utils/asyncHandler')

const router = express.Router()

router.get('/health', asyncHandler(getHealth))

module.exports = router
