const express = require('express')
const authController = require('../controllers/authController')
const { requireAuth } = require('../middleware/authMiddleware')
const { authRateLimiter } = require('../middleware/rateLimiters')
const asyncHandler = require('../utils/asyncHandler')
const {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
} = require('../validators/authValidators')

const router = express.Router()

router.post('/register', authRateLimiter, registerValidator, asyncHandler(authController.register))
router.post('/login', authRateLimiter, loginValidator, asyncHandler(authController.login))
router.post('/forgot-password', authRateLimiter, forgotPasswordValidator, asyncHandler(authController.forgotPassword))
router.post('/reset-password', authRateLimiter, resetPasswordValidator, asyncHandler(authController.resetPassword))
router.post('/logout', requireAuth, authController.logout)
router.get('/me', requireAuth, asyncHandler(authController.me))

module.exports = router
