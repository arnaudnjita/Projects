const express = require('express')
const { getHealth } = require('../controllers/healthController')

const router = express.Router()

router.get('/health', (req, res, next) => {
  Promise.resolve(getHealth(req, res)).catch(next)
})

module.exports = router
