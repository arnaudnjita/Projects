require('dotenv').config()

const REQUIRED_KEYS = [
  'NODE_ENV',
  'PORT',
  'FRONTEND_URL',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'COOKIE_NAME',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'APP_BASE_URL',
  'MAX_UPLOAD_MB',
]

function readRequiredString(source, key, errors) {
  const value = source[key]

  if (value === undefined || value === null || String(value).trim() === '') {
    errors.push(`${key} is required`)
    return ''
  }

  return String(value).trim()
}

function readRequiredNumber(source, key, errors, options = {}) {
  const rawValue = readRequiredString(source, key, errors)

  if (!rawValue) {
    return 0
  }

  const value = Number(rawValue)
  const min = options.min ?? Number.NEGATIVE_INFINITY
  const max = options.max ?? Number.POSITIVE_INFINITY

  if (!Number.isFinite(value) || value < min || value > max) {
    errors.push(`${key} must be a number between ${min} and ${max}`)
    return 0
  }

  return value
}

function readBoolean(source, key, defaultValue = false) {
  const rawValue = source[key]

  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    return defaultValue
  }

  return ['1', 'true', 'yes', 'on'].includes(String(rawValue).trim().toLowerCase())
}

function buildEnv(source = process.env) {
  const errors = []
  const missingKeys = REQUIRED_KEYS.filter((key) => {
    const value = source[key]
    return value === undefined || value === null || String(value).trim() === ''
  })

  if (missingKeys.length > 0) {
    errors.push(`Missing required environment variables: ${missingKeys.join(', ')}`)
  }

  const nodeEnv = readRequiredString(source, 'NODE_ENV', errors)
  const port = readRequiredNumber(source, 'PORT', errors, { min: 1, max: 65535 })
  const frontendUrl = readRequiredString(source, 'FRONTEND_URL', errors)
  const dbPort = readRequiredNumber(source, 'DB_PORT', errors, { min: 1, max: 65535 })
  const smtpPort = readRequiredNumber(source, 'SMTP_PORT', errors, { min: 1, max: 65535 })
  const maxUploadMb = readRequiredNumber(source, 'MAX_UPLOAD_MB', errors, {
    min: 1,
    max: 100,
  })

  if (errors.length > 0) {
    throw new Error(`Invalid backend configuration. ${errors.join('; ')}`)
  }

  return Object.freeze({
    appName: 'CultivaX',
    appBaseUrl: readRequiredString(source, 'APP_BASE_URL', errors),
    cookie: {
      name: readRequiredString(source, 'COOKIE_NAME', errors),
      secure: readBoolean(source, 'COOKIE_SECURE', nodeEnv === 'production'),
    },
    database: {
      host: readRequiredString(source, 'DB_HOST', errors),
      name: readRequiredString(source, 'DB_NAME', errors),
      password: readRequiredString(source, 'DB_PASSWORD', errors),
      port: dbPort,
      user: readRequiredString(source, 'DB_USER', errors),
    },
    frontendUrl,
    jwt: {
      expiresIn: readRequiredString(source, 'JWT_EXPIRES_IN', errors),
      secret: readRequiredString(source, 'JWT_SECRET', errors),
    },
    maxUploadMb,
    nodeEnv,
    allowDevResetTokenLogging: readBoolean(source, 'ALLOW_DEV_RESET_TOKEN_LOGGING', false),
    port,
    uploadRoot: String(source.UPLOAD_ROOT || 'uploads').trim(),
    smtp: {
      from: readRequiredString(source, 'SMTP_FROM', errors),
      host: readRequiredString(source, 'SMTP_HOST', errors),
      pass: readRequiredString(source, 'SMTP_PASS', errors),
      port: smtpPort,
      secure: readBoolean(source, 'SMTP_SECURE', smtpPort === 465),
      user: readRequiredString(source, 'SMTP_USER', errors),
    },
  })
}

module.exports = {
  ...buildEnv(),
  buildEnv,
}
