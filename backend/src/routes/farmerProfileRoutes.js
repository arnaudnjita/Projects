const express = require('express')
const farmerProfileController = require('../controllers/farmerProfileController')
const { requireAuth, requireRole } = require('../middleware/authMiddleware')
const asyncHandler = require('../utils/asyncHandler')
const { updateFarmerProfileValidator } = require('../validators/farmerProfileValidators')

const router = express.Router()

router.use(requireAuth, requireRole('farmer'))
router.get('/me/profile', asyncHandler(farmerProfileController.getMyProfile))
router.put('/me/profile', updateFarmerProfileValidator, asyncHandler(farmerProfileController.updateMyProfile))

module.exports = router
