const rateLimit = require('express-rate-limit')

const globalRateLimiter = rateLimit({
  legacyHeaders: false,
  limit: 100,
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
})

const authRateLimiter = rateLimit({
  legacyHeaders: false,
  limit: process.env.NODE_ENV === 'test' ? 1000 : 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
})

module.exports = {
  authRateLimiter,
  globalRateLimiter,
}
