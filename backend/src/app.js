const cookieParser = require('cookie-parser')
const cors = require('cors')
const express = require('express')
const helmet = require('helmet')

const env = require('./config/env')
const apiRoutes = require('./routes/apiRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const errorHandler = require('./middleware/errorHandler')
const notFoundHandler = require('./middleware/notFoundHandler')
const requestContext = require('./middleware/requestContext')
const requestLogger = require('./middleware/requestLogger')
const { globalRateLimiter } = require('./middleware/rateLimiters')

const app = express()
const allowedOrigins = new Set([env.frontendUrl])

app.use(helmet())
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(null, false)
    },
  }),
)
app.use(globalRateLimiter)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))
app.use(cookieParser())
app.use(requestContext)
app.use(requestLogger(env))

app.use('/uploads', uploadRoutes)
app.use('/api', apiRoutes)

app.use(notFoundHandler)
app.use(errorHandler(env))

module.exports = app
