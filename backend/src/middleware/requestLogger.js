const SENSITIVE_KEYS = ['authorization', 'cookie', 'password', 'password_hash', 'token', 'jwt']

function redactObject(value) {
  if (!value || typeof value !== 'object' || Buffer.isBuffer(value)) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(redactObject)
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      const lowerKey = key.toLowerCase()

      if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
        return [key, '[redacted]']
      }

      return [key, redactObject(nestedValue)]
    }),
  )
}

function requestLogger(env) {
  return (req, res, next) => {
    if (env.nodeEnv !== 'development') {
      next()
      return
    }

    const startedAt = Date.now()

    res.on('finish', () => {
      const safeBody = req.is('multipart/form-data') ? '[multipart omitted]' : redactObject(req.body)
      console.log({
        body: safeBody,
        durationMs: Date.now() - startedAt,
        method: req.method,
        path: req.originalUrl,
        requestId: req.id,
        statusCode: res.statusCode,
      })
    })

    next()
  }
}

module.exports = requestLogger
