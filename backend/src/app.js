const cookieParser = require('cookie-parser')
const cors = require('cors')
const express = require('express')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const env = require('./config/env')
const healthRoutes = require('./routes/healthRoutes')

const app = express()

app.use(helmet())
app.use(
  cors({
    credentials: true,
    origin: env.frontendUrl,
  }),
)
app.use(
  rateLimit({
    legacyHeaders: false,
    limit: 100,
    standardHeaders: true,
    windowMs: 15 * 60 * 1000,
  }),
)
app.use(express.json())
app.use(cookieParser())

app.use('/api', healthRoutes)

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong.',
    },
  })
})

module.exports = app
