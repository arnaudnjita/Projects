const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')

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

const contactClickRateLimiter = rateLimit({
  keyGenerator(req) {
    if (process.env.NODE_ENV === 'test' && req.get('x-test-rate-limit-key')) {
      return `test:${req.get('x-test-rate-limit-key')}`
    }

    return ipKeyGenerator(req.ip)
  },
  legacyHeaders: false,
  limit: process.env.NODE_ENV === 'test' ? 3 : 60,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many contact attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
})

module.exports = {
  authRateLimiter,
  contactClickRateLimiter,
  globalRateLimiter,
}
