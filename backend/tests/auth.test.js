const express = require('express')
const request = require('supertest')

const app = require('../src/app')
const env = require('../src/config/env')
const { pool } = require('../src/config/database')
const { requireAuth, requireRole } = require('../src/middleware/authMiddleware')
const errorHandler = require('../src/middleware/errorHandler')
const requestContext = require('../src/middleware/requestContext')

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}@example.com`
}

function uniqueCameroonPhone() {
  return `+2376${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
}

function extractCookie(response) {
  return response.headers['set-cookie']?.find((cookie) => cookie.startsWith(`${env.cookie.name}=`))
}

function createRoleTestApp() {
  const testApp = express()
  testApp.use(express.json())
  testApp.use(require('cookie-parser')())
  testApp.use(requestContext)
  testApp.get('/farmer-only', requireAuth, requireRole('farmer'), (_req, res) => {
    res.json({ success: true, data: { allowed: true } })
  })
  testApp.use(errorHandler(env))
  return testApp
}

async function cleanupTestUsers() {
  await pool.execute(`DELETE FROM users WHERE email LIKE ?`, ['%@example.com'])
}

describe('auth endpoints', () => {
  beforeEach(async () => {
    await cleanupTestUsers()
  })

  afterAll(async () => {
    await cleanupTestUsers()
  })

  it('registers a farmer and creates a farmer profile', async () => {
    const phone = uniqueCameroonPhone()
    const email = uniqueEmail('farmer')

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        location: 'Buea',
        name: 'Farmer Test',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone,
        role: 'farmer',
      })
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.user).toMatchObject({
      email,
      location: 'Buea',
      name: 'Farmer Test',
      phone,
      role: 'farmer',
    })
    expect(response.body.data.user.password_hash).toBeUndefined()
    expect(extractCookie(response)).toContain(`${env.cookie.name}=`)

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM farmer_profiles
       WHERE user_id = ?`,
      [response.body.data.user.userId],
    )
    expect(Number(rows[0].count)).toBe(1)
  })

  it('registers a buyer without creating a farmer profile', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail('buyer'),
        location: 'Molyko',
        name: 'Buyer Test',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone: uniqueCameroonPhone(),
        role: 'buyer',
      })
      .expect(201)

    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM farmer_profiles
       WHERE user_id = ?`,
      [response.body.data.user.userId],
    )
    expect(Number(rows[0].count)).toBe(0)
  })

  it('rejects unsupported registration fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail('extra-field'),
        isAdmin: true,
        location: 'Molyko',
        name: 'Extra Field',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone: uniqueCameroonPhone(),
        role: 'buyer',
      })
      .expect(422)

    expect(response.body.error.fields).toContainEqual({
      field: 'isAdmin',
      message: 'This field is not supported.',
    })
  })

  it('rejects duplicate phone numbers with a field error', async () => {
    const phone = uniqueCameroonPhone()

    const payload = {
      email: uniqueEmail('phone-one'),
      location: 'Buea',
      name: 'Phone One',
      password: 'Password1',
      passwordConfirmation: 'Password1',
      phone,
      role: 'buyer',
    }

    await request(app).post('/api/auth/register').send(payload).expect(201)

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...payload, email: uniqueEmail('phone-two'), name: 'Phone Two' })
      .expect(422)

    expect(response.body.error.fields).toContainEqual({
      field: 'phone',
      message: 'That phone number is already registered.',
    })
  })

  it('rejects duplicate emails with a field error', async () => {
    const email = uniqueEmail('duplicate')

    const payload = {
      email,
      location: 'Buea',
      name: 'Email One',
      password: 'Password1',
      passwordConfirmation: 'Password1',
      phone: uniqueCameroonPhone(),
      role: 'buyer',
    }

    await request(app).post('/api/auth/register').send(payload).expect(201)

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...payload, phone: uniqueCameroonPhone(), name: 'Email Two' })
      .expect(422)

    expect(response.body.error.fields).toContainEqual({
      field: 'email',
      message: 'That email address is already registered.',
    })
  })

  it('rejects invalid role, invalid phone, and weak passwords', async () => {
    const invalidRole = await request(app)
      .post('/api/auth/register')
      .send({
        location: 'Buea',
        name: 'Invalid Role',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone: uniqueCameroonPhone(),
        role: 'admin',
      })
      .expect(422)
    expect(invalidRole.body.error.fields).toContainEqual({
      field: 'role',
      message: 'Role must be farmer or buyer.',
    })

    const invalidPhone = await request(app)
      .post('/api/auth/register')
      .send({
        location: 'Buea',
        name: 'Invalid Phone',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone: '123',
        role: 'buyer',
      })
      .expect(422)
    expect(invalidPhone.body.error.fields).toContainEqual({
      field: 'phone',
      message: 'Enter a valid phone number.',
    })

    const weakPassword = await request(app)
      .post('/api/auth/register')
      .send({
        location: 'Buea',
        name: 'Weak Password',
        password: 'password',
        passwordConfirmation: 'password',
        phone: uniqueCameroonPhone(),
        role: 'buyer',
      })
      .expect(422)
    expect(weakPassword.body.error.fields[0].field).toBe('password')
  })

  it('logs in by email and phone and rejects wrong passwords generically', async () => {
    const email = uniqueEmail('login')
    const phone = uniqueCameroonPhone()

    await request(app)
      .post('/api/auth/register')
      .send({
        email,
        location: 'Buea',
        name: 'Login User',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone,
        role: 'buyer',
      })
      .expect(201)

    await request(app)
      .post('/api/auth/login')
      .send({ identifier: email.toUpperCase(), password: 'Password1' })
      .expect(200)

    await request(app)
      .post('/api/auth/login')
      .send({ identifier: phone, password: 'Password1' })
      .expect(200)

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ identifier: email, password: 'WrongPassword1' })
      .expect(401)

    expect(wrongPassword.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid phone/email or password.',
      },
    })
  })

  it('returns current user and clears cookie on logout', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail('me'),
        location: 'Buea',
        name: 'Me User',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone: uniqueCameroonPhone(),
        role: 'buyer',
      })
      .expect(201)

    const cookie = extractCookie(registerResponse)

    const meResponse = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200)
    expect(meResponse.body.data.user).toMatchObject({
      name: 'Me User',
      role: 'buyer',
    })

    const logoutResponse = await request(app).post('/api/auth/logout').set('Cookie', cookie).expect(200)
    expect(logoutResponse.body).toEqual({
      success: true,
      data: { loggedOut: true },
    })
    expect(extractCookie(logoutResponse)).toContain(`${env.cookie.name}=;`)
  })

  it('returns 401 for current user without a valid cookie', async () => {
    const response = await request(app).get('/api/auth/me').expect(401)

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
      },
    })
  })

  it('allows farmers and blocks buyers on farmer-only role protection', async () => {
    const farmerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail('role-farmer'),
        location: 'Buea',
        name: 'Role Farmer',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone: uniqueCameroonPhone(),
        role: 'farmer',
      })
      .expect(201)

    const buyerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail('role-buyer'),
        location: 'Buea',
        name: 'Role Buyer',
        password: 'Password1',
        passwordConfirmation: 'Password1',
        phone: uniqueCameroonPhone(),
        role: 'buyer',
      })
      .expect(201)

    const roleApp = createRoleTestApp()
    await request(roleApp).get('/farmer-only').set('Cookie', extractCookie(farmerResponse)).expect(200)

    const denied = await request(roleApp)
      .get('/farmer-only')
      .set('Cookie', extractCookie(buyerResponse))
      .expect(403)
    expect(denied.body.error.code).toBe('FORBIDDEN')
  })
})
