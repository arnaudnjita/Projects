const fs = require('fs/promises')
const path = require('path')
const request = require('supertest')
const sharp = require('sharp')

const app = require('../src/app')
const env = require('../src/config/env')
const { pool } = require('../src/config/database')
const imageStorageService = require('../src/services/imageStorageService')

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}@upload.test`
}

function uniqueCameroonPhone() {
  return `+2376${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
}

function extractCookie(response) {
  return response.headers['set-cookie']?.find((cookie) => cookie.startsWith(`${env.cookie.name}=`))
}

function pathFromPublicUrl(publicUrl) {
  const relativePath = publicUrl.replace('/uploads/', '')
  return path.join(imageStorageService.uploadRoot, relativePath)
}

async function makeImageBuffer() {
  return sharp({
    create: {
      background: '#123F2D',
      channels: 3,
      height: 40,
      width: 40,
    },
  })
    .png()
    .toBuffer()
}

async function cleanupUploadUsers() {
  const [rows] = await pool.execute(
    `SELECT fp.profile_photo_url
     FROM farmer_profiles fp
     INNER JOIN users u ON u.user_id = fp.user_id
     WHERE u.email LIKE ? AND fp.profile_photo_url IS NOT NULL`,
    ['%@upload.test'],
  )

  for (const row of rows) {
    await imageStorageService.deleteStoredFileByPublicUrl(row.profile_photo_url)
  }

  await pool.execute(`DELETE FROM users WHERE email LIKE ?`, ['%@upload.test'])
}

async function registerUser(role) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: uniqueEmail(role),
      location: 'Buea',
      name: `${role} Upload User`,
      password: 'Password1',
      passwordConfirmation: 'Password1',
      phone: uniqueCameroonPhone(),
      role,
    })
    .expect(201)

  return {
    cookie: extractCookie(response),
    user: response.body.data.user,
  }
}

describe('profile image uploads', () => {
  beforeEach(async () => {
    await cleanupUploadUsers()
  })

  afterAll(async () => {
    await cleanupUploadUsers()
  })

  it('uploads a valid profile image and stores WebP files', async () => {
    const farmer = await registerUser('farmer')
    const imageBuffer = await makeImageBuffer()

    const response = await request(app)
      .post('/api/farmers/me/profile/photo')
      .set('Cookie', farmer.cookie)
      .attach('image', imageBuffer, {
        contentType: 'image/png',
        filename: 'profile.png',
      })
      .expect(200)

    const publicUrl = response.body.data.profile.profilePhotoUrl
    expect(publicUrl).toMatch(/^\/uploads\/profile-photos\/profile-.*\.webp$/)

    const fullPath = pathFromPublicUrl(publicUrl)
    const thumbPath = fullPath.replace(/\.webp$/i, '-thumb.webp')
    await expect(fs.access(fullPath)).resolves.toBeUndefined()
    await expect(fs.access(thumbPath)).resolves.toBeUndefined()
  })

  it('rejects invalid MIME and corrupted image files', async () => {
    const farmer = await registerUser('farmer')

    const invalidMime = await request(app)
      .post('/api/farmers/me/profile/photo')
      .set('Cookie', farmer.cookie)
      .attach('image', Buffer.from('not an image'), {
        contentType: 'text/plain',
        filename: 'profile.txt',
      })
      .expect(422)

    expect(invalidMime.body.error.fields).toContainEqual({
      field: 'image',
      message: 'Only JPEG, PNG, and WebP images are allowed.',
    })

    const corrupted = await request(app)
      .post('/api/farmers/me/profile/photo')
      .set('Cookie', farmer.cookie)
      .attach('image', Buffer.from('not really a jpeg'), {
        contentType: 'image/jpeg',
        filename: 'profile.jpg',
      })
      .expect(422)

    expect(corrupted.body.error.fields).toContainEqual({
      field: 'image',
      message: 'The uploaded file could not be decoded as an image.',
    })
  })

  it('rejects oversized and unauthorized uploads', async () => {
    const farmer = await registerUser('farmer')
    const oversized = Buffer.alloc(env.maxUploadMb * 1024 * 1024 + 1)

    const oversizedResponse = await request(app)
      .post('/api/farmers/me/profile/photo')
      .set('Cookie', farmer.cookie)
      .attach('image', oversized, {
        contentType: 'image/png',
        filename: 'large.png',
      })
      .expect(413)

    expect(oversizedResponse.body.error.fields).toContainEqual({
      field: 'image',
      message: `Image must be ${env.maxUploadMb}MB or smaller.`,
    })

    await request(app)
      .post('/api/farmers/me/profile/photo')
      .attach('image', await makeImageBuffer(), {
        contentType: 'image/png',
        filename: 'profile.png',
      })
      .expect(401)
  })

  it('deletes superseded profile images after successful update', async () => {
    const farmer = await registerUser('farmer')
    const firstImage = await makeImageBuffer()
    const secondImage = await makeImageBuffer()

    const firstResponse = await request(app)
      .post('/api/farmers/me/profile/photo')
      .set('Cookie', farmer.cookie)
      .attach('image', firstImage, {
        contentType: 'image/png',
        filename: 'first.png',
      })
      .expect(200)
    const firstPath = pathFromPublicUrl(firstResponse.body.data.profile.profilePhotoUrl)

    await request(app)
      .post('/api/farmers/me/profile/photo')
      .set('Cookie', farmer.cookie)
      .attach('image', secondImage, {
        contentType: 'image/png',
        filename: 'second.png',
      })
      .expect(200)

    await expect(fs.access(firstPath)).rejects.toThrow()
  })
})
