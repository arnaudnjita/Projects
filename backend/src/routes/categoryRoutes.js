const express = require('express')
const categoryController = require('../controllers/categoryController')
const asyncHandler = require('../utils/asyncHandler')

const router = express.Router()

router.get('/', asyncHandler(categoryController.listCategories))

module.exports = router
