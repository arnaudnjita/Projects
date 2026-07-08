const fs = require('fs/promises')
const path = require('path')
const request = require('supertest')
const sharp = require('sharp')

const app = require('../src/app')
const env = require('../src/config/env')
const { pool } = require('../src/config/database')
const imageStorageService = require('../src/services/imageStorageService')

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}@product.test`
}

function uniqueCameroonPhone() {
  return `+2376${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
}

function extractCookie(response) {
  return response.headers['set-cookie']?.find((cookie) => cookie.startsWith(`${env.cookie.name}=`))
}

function pathFromPublicUrl(publicUrl) {
  return path.join(imageStorageService.uploadRoot, publicUrl.replace('/uploads/', ''))
}

async function makeImageBuffer(color = '#F28C28') {
  return sharp({
    create: {
      background: color,
      channels: 3,
      height: 48,
      width: 48,
    },
  })
    .png()
    .toBuffer()
}

async function getCategoryId() {
  const [rows] = await pool.execute(`SELECT category_id FROM categories ORDER BY category_id LIMIT 1`)

  if (!rows[0]) {
    throw new Error('Seed categories before running product tests.')
  }

  return rows[0].category_id
}

async function cleanupProductUsers() {
  const [imageRows] = await pool.execute(
    `SELECT pi.image_url
     FROM product_images pi
     INNER JOIN products p ON p.product_id = pi.product_id
     INNER JOIN users u ON u.user_id = p.farmer_user_id
     WHERE u.email LIKE ?`,
    ['%@product.test'],
  )

  await pool.execute(
    `DELETE p
     FROM products p
     INNER JOIN users u ON u.user_id = p.farmer_user_id
     WHERE u.email LIKE ?`,
    ['%@product.test'],
  )
  await pool.execute(`DELETE FROM users WHERE email LIKE ?`, ['%@product.test'])

  for (const row of imageRows) {
    await imageStorageService.deleteStoredFileByPublicUrl(row.image_url)
  }
}

async function registerUser(role) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: uniqueEmail(role),
      location: 'Buea',
      name: `${role} Product User`,
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

function attachProductFields(testRequest, fields) {
  for (const [key, value] of Object.entries(fields)) {
    testRequest.field(key, String(value))
  }

  return testRequest
}

async function createProduct(cookie, overrides = {}, imageCount = 1) {
  const categoryId = await getCategoryId()
  const requestBuilder = attachProductFields(request(app).post('/api/farmer/products').set('Cookie', cookie), {
    categoryId,
    description: 'Fresh produce from Buea.',
    name: 'Fresh Tomatoes',
    price: '1200',
    quantityAvailable: '10',
    unit: 'basket',
    ...overrides,
  })

  for (let index = 0; index < imageCount; index += 1) {
    requestBuilder.attach('images', await makeImageBuffer(index === 0 ? '#F28C28' : '#123F2D'), {
      contentType: 'image/png',
      filename: `product-${index}.png`,
    })
  }

  return requestBuilder.expect(201)
}

describe('category and farmer product management', () => {
  beforeEach(async () => {
    await cleanupProductUsers()
  })

  afterAll(async () => {
    await cleanupProductUsers()
  })

  it('lists public categories', async () => {
    const response = await request(app).get('/api/categories').expect(200)

    expect(response.body.data.categories.length).toBeGreaterThan(0)
    expect(response.body.data.categories[0]).toHaveProperty('categoryId')
  })

  it('creates products with one and multiple images', async () => {
    const farmer = await registerUser('farmer')

    const oneImage = await createProduct(farmer.cookie, { name: 'One Image Product' }, 1)
    expect(oneImage.body.data.product.images).toHaveLength(1)
    expect(oneImage.body.data.product.status).toBe('active')

    const multiImage = await createProduct(farmer.cookie, { name: 'Multi Image Product' }, 2)
    expect(multiImage.body.data.product.images).toHaveLength(2)
  })

  it('rejects no-image creation and invalid category', async () => {
    const farmer = await registerUser('farmer')
    const categoryId = await getCategoryId()

    await attachProductFields(request(app).post('/api/farmer/products').set('Cookie', farmer.cookie), {
      categoryId,
      name: 'No Image',
      price: '100',
      quantityAvailable: '1',
      unit: 'kg',
    })
      .expect(422)
      .expect((response) => {
        expect(response.body.error.fields).toContainEqual({
          field: 'images',
          message: 'Add at least one product image.',
        })
      })

    const invalidCategoryRequest = attachProductFields(
      request(app).post('/api/farmer/products').set('Cookie', farmer.cookie),
      {
        categoryId: '999999',
        name: 'Invalid Category',
        price: '100',
        quantityAvailable: '1',
        unit: 'kg',
      },
    )
    invalidCategoryRequest.attach('images', await makeImageBuffer(), {
      contentType: 'image/png',
      filename: 'invalid-category.png',
    })

    await invalidCategoryRequest
      .expect(422)
      .expect((response) => {
        expect(response.body.error.fields).toContainEqual({
          field: 'categoryId',
          message: 'Choose a valid category.',
        })
      })
  })

  it('enforces ownership and denies buyer access', async () => {
    const farmer = await registerUser('farmer')
    const otherFarmer = await registerUser('farmer')
    const buyer = await registerUser('buyer')
    const created = await createProduct(farmer.cookie)
    const productId = created.body.data.product.productId

    await request(app).get(`/api/farmer/products/${productId}`).set('Cookie', otherFarmer.cookie).expect(404)
    await request(app).get('/api/farmer/products').set('Cookie', buyer.cookie).expect(403)
  })

  it('lists products with counts, filters, search, sort, and pagination', async () => {
    const farmer = await registerUser('farmer')
    await createProduct(farmer.cookie, { name: 'Red Tomato', status: 'active' }, 1)
    await createProduct(farmer.cookie, { name: 'Dry Beans', quantityAvailable: '0' }, 1)

    const response = await request(app)
      .get('/api/farmer/products?status=active&search=Tomato&sort=price_desc&page=1&pageSize=10')
      .set('Cookie', farmer.cookie)
      .expect(200)

    expect(response.body.data.counts.active).toBe(1)
    expect(response.body.data.counts.sold_out).toBe(1)
    expect(response.body.data.products).toHaveLength(1)
    expect(response.body.meta.total).toBe(1)
  })

  it('edits fields and adds/removes images', async () => {
    const farmer = await registerUser('farmer')
    const created = await createProduct(farmer.cookie, {}, 2)
    const product = created.body.data.product
    const removedImage = product.images[0]

    const updateRequest = attachProductFields(
      request(app).put(`/api/farmer/products/${product.productId}`).set('Cookie', farmer.cookie),
      {
        deleteImageIds: JSON.stringify([removedImage.productImageId]),
        imageSortOrders: JSON.stringify([{ productImageId: product.images[1].productImageId, sortOrder: 0 }]),
        name: 'Updated Produce',
        price: '1500',
      },
    )
    updateRequest.attach('images', await makeImageBuffer('#0B2E20'), {
      contentType: 'image/png',
      filename: 'new-product.png',
    })

    const response = await updateRequest.expect(200)
    expect(response.body.data.product.name).toBe('Updated Produce')
    expect(response.body.data.product.price).toBe(1500)
    expect(response.body.data.product.images).toHaveLength(2)
    await expect(fs.access(pathFromPublicUrl(removedImage.imageUrl))).rejects.toThrow()
  })

  it('handles quantity-to-zero and status rules', async () => {
    const farmer = await registerUser('farmer')
    const created = await createProduct(farmer.cookie)
    const productId = created.body.data.product.productId

    const zero = await request(app)
      .patch(`/api/farmer/products/${productId}/quantity`)
      .set('Cookie', farmer.cookie)
      .send({ quantityAvailable: 0 })
      .expect(200)
    expect(zero.body.data.product.status).toBe('sold_out')

    await request(app)
      .patch(`/api/farmer/products/${productId}/status`)
      .set('Cookie', farmer.cookie)
      .send({ status: 'active' })
      .expect(422)

    await request(app)
      .patch(`/api/farmer/products/${productId}/status`)
      .set('Cookie', farmer.cookie)
      .send({ status: 'inactive' })
      .expect(200)

    const increased = await request(app)
      .patch(`/api/farmer/products/${productId}/quantity`)
      .set('Cookie', farmer.cookie)
      .send({ quantityAvailable: 5 })
      .expect(200)
    expect(increased.body.data.product.status).toBe('inactive')
  })

  it('deletes products and cleans up image files', async () => {
    const farmer = await registerUser('farmer')
    const created = await createProduct(farmer.cookie)
    const product = created.body.data.product
    const imagePath = pathFromPublicUrl(product.images[0].imageUrl)

    await request(app).delete(`/api/farmer/products/${product.productId}`).set('Cookie', farmer.cookie).expect(200)
    await request(app).get(`/api/farmer/products/${product.productId}`).set('Cookie', farmer.cookie).expect(404)
    await expect(fs.access(imagePath)).rejects.toThrow()
  })
})
