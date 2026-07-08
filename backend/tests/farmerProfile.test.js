const request = require('supertest')

const app = require('../src/app')
const env = require('../src/config/env')
const { pool } = require('../src/config/database')

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}@profile.test`
}

function uniqueCameroonPhone() {
  return `+2376${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
}

function extractCookie(response) {
  return response.headers['set-cookie']?.find((cookie) => cookie.startsWith(`${env.cookie.name}=`))
}

async function cleanupProfileUsers() {
  await pool.execute(`DELETE FROM users WHERE email LIKE ?`, ['%@profile.test'])
}

async function registerUser(role, overrides = {}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: uniqueEmail(role),
      location: 'Buea',
      name: `${role} Profile User`,
      password: 'Password1',
      passwordConfirmation: 'Password1',
      phone: uniqueCameroonPhone(),
      role,
      ...overrides,
    })
    .expect(201)

  return {
    cookie: extractCookie(response),
    user: response.body.data.user,
  }
}

describe('farmer profile backend', () => {
  beforeEach(async () => {
    await cleanupProfileUsers()
  })

  afterAll(async () => {
    await cleanupProfileUsers()
  })

  it('returns the authenticated farmer profile without private fields', async () => {
    const farmer = await registerUser('farmer', {
      email: uniqueEmail('get-farmer'),
      location: 'Muea',
      name: 'Green Farm',
    })

    const response = await request(app)
      .get('/api/farmers/me/profile')
      .set('Cookie', farmer.cookie)
      .expect(200)

    expect(response.body.data.profile).toMatchObject({
      accountLocation: 'Muea',
      email: farmer.user.email,
      farmLocation: 'Muea',
      name: 'Green Farm',
      phone: farmer.user.phone,
      profilePhotoUrl: null,
    })
    expect(response.body.data.profile.password_hash).toBeUndefined()
    expect(response.body.data.profile.farmer_profile_id).toBeUndefined()
  })

  it('lets a farmer update account and farm profile fields in one request', async () => {
    const farmer = await registerUser('farmer')

    const response = await request(app)
      .put('/api/farmers/me/profile')
      .set('Cookie', farmer.cookie)
      .send({
        accountLocation: 'Bokwango',
        bio: 'Growing fresh vegetables for Buea buyers.',
        farmLocation: 'Mile 16',
        name: 'Updated Farm Name',
        phone: '6 11 22 33 44',
        produceSpecialty: 'Vegetables',
        profilePhotoUrl: '/uploads/profile-photos/farmer-test.webp',
        whatsappPhone: '6 55 66 77 88',
      })
      .expect(200)

    expect(response.body.data.profile).toMatchObject({
      accountLocation: 'Bokwango',
      bio: 'Growing fresh vegetables for Buea buyers.',
      farmLocation: 'Mile 16',
      name: 'Updated Farm Name',
      phone: '+237611223344',
      produceSpecialty: 'Vegetables',
      profilePhotoUrl: '/uploads/profile-photos/farmer-test.webp',
      whatsappPhone: '+237655667788',
    })
  })

  it('blocks buyers from farmer profile routes', async () => {
    const buyer = await registerUser('buyer')

    const response = await request(app)
      .get('/api/farmers/me/profile')
      .set('Cookie', buyer.cookie)
      .expect(403)

    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects duplicate account phone updates', async () => {
    const farmer = await registerUser('farmer')
    const otherFarmer = await registerUser('farmer')

    const response = await request(app)
      .put('/api/farmers/me/profile')
      .set('Cookie', farmer.cookie)
      .send({ phone: otherFarmer.user.phone })
      .expect(422)

    expect(response.body.error.fields).toContainEqual({
      field: 'phone',
      message: 'That phone number is already registered.',
    })
  })

  it('rejects unsupported fields, invalid phones, and unsafe profile photo URLs', async () => {
    const farmer = await registerUser('farmer')

    const unsupported = await request(app)
      .put('/api/farmers/me/profile')
      .set('Cookie', farmer.cookie)
      .send({ admin: true })
      .expect(422)
    expect(unsupported.body.error.fields).toContainEqual({
      field: 'admin',
      message: 'This field is not supported.',
    })

    const invalidPhone = await request(app)
      .put('/api/farmers/me/profile')
      .set('Cookie', farmer.cookie)
      .send({ whatsappPhone: '123' })
      .expect(422)
    expect(invalidPhone.body.error.fields).toContainEqual({
      field: 'whatsappPhone',
      message: 'Enter a valid WhatsApp phone number.',
    })

    const unsafePhoto = await request(app)
      .put('/api/farmers/me/profile')
      .set('Cookie', farmer.cookie)
      .send({ profilePhotoUrl: 'https://example.com/photo.png' })
      .expect(422)
    expect(unsafePhoto.body.error.fields).toContainEqual({
      field: 'profilePhotoUrl',
      message: 'Profile photo URL must be an internal uploaded image path.',
    })
  })
})
