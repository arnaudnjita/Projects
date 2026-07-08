const crypto = require('crypto')
const request = require('supertest')

const app = require('../src/app')
const { pool } = require('../src/config/database')
const mailService = require('../src/services/mailService')

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}@reset.test`
}

function uniqueCameroonPhone() {
  return `+2376${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function extractTokenFromResetUrl(resetUrl) {
  return new URL(resetUrl).searchParams.get('token')
}

async function cleanupResetUsers() {
  await pool.execute(`DELETE FROM users WHERE email LIKE ?`, ['%@reset.test'])
}

async function registerResetUser(email, password = 'Password1') {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      location: 'Buea',
      name: 'Reset User',
      password,
      passwordConfirmation: password,
      phone: uniqueCameroonPhone(),
      role: 'buyer',
    })
    .expect(201)

  return response.body.data.user
}

async function getLatestResetToken(userId) {
  const [rows] = await pool.execute(
    `SELECT password_reset_token_id, token_hash, expires_at, used_at
     FROM password_reset_tokens
     WHERE user_id = ?
     ORDER BY password_reset_token_id DESC
     LIMIT 1`,
    [userId],
  )

  return rows[0] || null
}

describe('password reset', () => {
  let sendPasswordResetEmailSpy

  beforeEach(async () => {
    await cleanupResetUsers()
    sendPasswordResetEmailSpy = vi.spyOn(mailService, 'sendPasswordResetEmail').mockResolvedValue()
  })

  afterEach(() => {
    sendPasswordResetEmailSpy.mockRestore()
  })

  afterAll(async () => {
    await cleanupResetUsers()
  })

  it('returns the same generic response for existing and non-existing email', async () => {
    const email = uniqueEmail('generic')
    await registerResetUser(email)

    const existing = await request(app).post('/api/auth/forgot-password').send({ email }).expect(200)
    const missing = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: uniqueEmail('missing') })
      .expect(200)

    expect(existing.body).toEqual(missing.body)
    expect(existing.body.data.message).toBe(
      'If an account with that email exists, a password reset link has been sent.',
    )
    expect(sendPasswordResetEmailSpy).toHaveBeenCalledTimes(1)
  })

  it('stores only a SHA-256 token hash', async () => {
    const email = uniqueEmail('hash')
    const user = await registerResetUser(email)

    await request(app).post('/api/auth/forgot-password').send({ email }).expect(200)

    const resetUrl = sendPasswordResetEmailSpy.mock.calls[0][0].resetUrl
    const plainToken = extractTokenFromResetUrl(resetUrl)
    const storedToken = await getLatestResetToken(user.userId)

    expect(storedToken.token_hash).toBe(hashToken(plainToken))
    expect(storedToken.token_hash).not.toBe(plainToken)
    expect(storedToken.token_hash).toHaveLength(64)
  })

  it('resets the password with a valid token and allows login with the new password', async () => {
    const email = uniqueEmail('valid')
    await registerResetUser(email, 'OldPassword1')

    await request(app).post('/api/auth/forgot-password').send({ email }).expect(200)
    const token = extractTokenFromResetUrl(sendPasswordResetEmailSpy.mock.calls[0][0].resetUrl)

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        password: 'NewPassword1',
        passwordConfirmation: 'NewPassword1',
        token,
      })
      .expect(200)

    await request(app)
      .post('/api/auth/login')
      .send({ identifier: email, password: 'NewPassword1' })
      .expect(200)

    await request(app)
      .post('/api/auth/login')
      .send({ identifier: email, password: 'OldPassword1' })
      .expect(401)
  })

  it('rejects expired, used, invalid, and mismatched reset attempts', async () => {
    const email = uniqueEmail('reject')
    const user = await registerResetUser(email)
    const expiredPlainToken = 'expired-token'
    const usedPlainToken = 'used-token'

    await pool.execute(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MINUTE))`,
      [user.userId, hashToken(expiredPlainToken)],
    )
    await pool.execute(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE), UTC_TIMESTAMP())`,
      [user.userId, hashToken(usedPlainToken)],
    )

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        password: 'NewPassword1',
        passwordConfirmation: 'NewPassword1',
        token: expiredPlainToken,
      })
      .expect(400)

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        password: 'NewPassword1',
        passwordConfirmation: 'NewPassword1',
        token: usedPlainToken,
      })
      .expect(400)

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        password: 'NewPassword1',
        passwordConfirmation: 'NewPassword1',
        token: 'invalid-token',
      })
      .expect(400)

    const mismatch = await request(app)
      .post('/api/auth/reset-password')
      .send({
        password: 'NewPassword1',
        passwordConfirmation: 'DifferentPassword1',
        token: 'any-token',
      })
      .expect(422)

    expect(mismatch.body.error.fields).toContainEqual({
      field: 'passwordConfirmation',
      message: 'Password confirmation must match password.',
    })
  })
})
