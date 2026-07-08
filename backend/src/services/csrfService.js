const crypto = require('crypto')

const env = require('../config/env')

const csrfTokenTtlMs = 2 * 60 * 60 * 1000

function signTokenPayload(payload) {
  return crypto.createHmac('sha256', env.jwt.secret).update(payload).digest('base64url')
}

function createCsrfToken(now = Date.now()) {
  const nonce = crypto.randomBytes(24).toString('base64url')
  const payload = `${now}.${nonce}`
  return `${payload}.${signTokenPayload(payload)}`
}

function verifyCsrfToken(token, now = Date.now()) {
  if (!token || typeof token !== 'string') {
    return false
  }

  const parts = token.split('.')

  if (parts.length !== 3) {
    return false
  }

  const [timestamp, nonce, signature] = parts
  const issuedAt = Number(timestamp)

  if (!Number.isFinite(issuedAt) || !nonce || now - issuedAt > csrfTokenTtlMs || issuedAt > now + 60_000) {
    return false
  }

  const expectedSignature = signTokenPayload(`${timestamp}.${nonce}`)
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

module.exports = {
  createCsrfToken,
  csrfTokenTtlMs,
  verifyCsrfToken,
}
