const request = require('supertest')
const sharp = require('sharp')

const app = require('../src/app')
const env = require('../src/config/env')
const { pool } = require('../src/config/database')
const imageStorageService = require('../src/services/imageStorageService')

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}@market.test`
}

function uniqueCameroonPhone() {
  return `+2376${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
}

function extractCookie(response) {
  return response.headers['set-cookie']?.find((cookie) => cookie.startsWith(`${env.cookie.name}=`))
}

async function makeImageBuffer(color = '#F28C28') {
  return sharp({
    create: {
      background: color,
      channels: 3,
      height: 56,
      width: 56,
    },
  })
    .png()
    .toBuffer()
}

async function getCategories() {
  const [rows] = await pool.execute(`SELECT category_id, name FROM categories ORDER BY category_id LIMIT 3`)

  if (rows.length < 2) {
    throw new Error('Seed at least two categories before running marketplace tests.')
  }

  return rows
}

async function cleanupMarketplaceUsers() {
  const [imageRows] = await pool.execute(
    `SELECT pi.image_url
     FROM product_images pi
     INNER JOIN products p ON p.product_id = pi.product_id
     INNER JOIN users u ON u.user_id = p.farmer_user_id
     WHERE u.email LIKE ?`,
    ['%@market.test'],
  )

  await pool.execute(
    `DELETE p
     FROM products p
     INNER JOIN users u ON u.user_id = p.farmer_user_id
     WHERE u.email LIKE ?`,
    ['%@market.test'],
  )
  await pool.execute(`DELETE FROM users WHERE email LIKE ?`, ['%@market.test'])

  for (const row of imageRows) {
    await imageStorageService.deleteStoredFileByPublicUrl(row.image_url)
  }
}

async function registerFarmer(location = 'Buea Town') {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: uniqueEmail('farmer'),
      location,
      name: `${location} Farmer`,
      password: 'Password1',
      passwordConfirmation: 'Password1',
      phone: uniqueCameroonPhone(),
      role: 'farmer',
    })
    .expect(201)

  return {
    cookie: extractCookie(response),
    user: response.body.data.user,
  }
}

async function registerBuyer(location = 'Buea Town') {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: uniqueEmail('buyer'),
      location,
      name: `${location} Buyer`,
      password: 'Password1',
      passwordConfirmation: 'Password1',
      phone: uniqueCameroonPhone(),
      role: 'buyer',
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
  const [category] = await getCategories()
  const requestBuilder = attachProductFields(request(app).post('/api/farmer/products').set('Cookie', cookie), {
    categoryId: category.category_id,
    description: 'Fresh produce from Buea municipality.',
    name: 'Market Tomatoes',
    price: '1200',
    quantityAvailable: '10',
    unit: 'basket',
    ...overrides,
  })

  for (let index = 0; index < imageCount; index += 1) {
    requestBuilder.attach('images', await makeImageBuffer(index === 0 ? '#F28C28' : '#123F2D'), {
      contentType: 'image/png',
      filename: `market-product-${index}.png`,
    })
  }

  return requestBuilder.expect(201)
}

async function getContactClickLogs(productId) {
  const [rows] = await pool.execute(
    `SELECT contact_click_log_id, product_id, buyer_user_id, clicked_at
     FROM contact_click_logs
     WHERE product_id = ?
     ORDER BY contact_click_log_id ASC`,
    [productId],
  )

  return rows
}

async function tableExists(tableName) {
  const [rows] = await pool.execute(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName],
  )

  return rows.length > 0
}

describe('public marketplace product browsing and comparison', () => {
  beforeEach(async () => {
    await cleanupMarketplaceUsers()
  })

  afterAll(async () => {
    await cleanupMarketplaceUsers()
  })

  it('allows public access and returns only safe active product fields', async () => {
    const farmer = await registerFarmer('Molyko')
    const created = await createProduct(farmer.cookie, { name: 'Public Tomato Basket' })

    const response = await request(app).get('/api/products').expect(200)
    const product = response.body.data.products.find((item) => item.productId === created.body.data.product.productId)
    const bodyText = JSON.stringify(response.body)

    expect(product).toMatchObject({
      farmer: {
        accountLocation: 'Molyko',
        name: 'Molyko Farmer',
        phone: farmer.user.phone,
      },
      imageCount: 1,
      name: 'Public Tomato Basket',
      status: 'active',
    })
    expect(product.thumbnailUrl).toContain('-thumb.webp')
    expect(response.body.meta.total).toBeGreaterThanOrEqual(1)
    expect(bodyText).not.toContain('password_hash')
    expect(bodyText).not.toContain(farmer.user.email)
    expect(bodyText).not.toContain('jwt')
  })

  it('searches, filters, combines filters, and treats injection-like input as data', async () => {
    const categories = await getCategories()
    const molykoFarmer = await registerFarmer('Molyko')
    const greatSoppoFarmer = await registerFarmer('Great Soppo')

    const tomato = await createProduct(molykoFarmer.cookie, {
      categoryId: categories[0].category_id,
      description: 'Red cooking tomatoes',
      name: 'Ruby Tomatoes',
      price: '1500',
    })
    await createProduct(greatSoppoFarmer.cookie, {
      categoryId: categories[1].category_id,
      description: 'Yellow plantain bunches',
      name: 'Plantain Bunch',
      price: '3000',
    })

    const search = await request(app).get('/api/products?search=Ruby').expect(200)
    expect(search.body.data.products.map((product) => product.productId)).toContain(tomato.body.data.product.productId)

    const category = await request(app).get(`/api/products?category=${categories[0].category_id}`).expect(200)
    expect(category.body.data.products.every((product) => product.category.categoryId === categories[0].category_id)).toBe(
      true,
    )

    const location = await request(app).get('/api/products?location=Molyko').expect(200)
    expect(location.body.data.products.every((product) => product.farmer.accountLocation === 'Molyko')).toBe(true)

    const price = await request(app).get('/api/products?minPrice=1000&maxPrice=2000').expect(200)
    expect(price.body.data.products.every((product) => product.price >= 1000 && product.price <= 2000)).toBe(true)

    const combined = await request(app)
      .get(`/api/products?search=Ruby&category=${categories[0].category_id}&location=Molyko&minPrice=1000&maxPrice=2000`)
      .expect(200)
    expect(combined.body.data.products).toHaveLength(1)
    expect(combined.body.data.products[0].name).toBe('Ruby Tomatoes')

    const injected = await request(app).get("/api/products?search=Ruby%' OR 1=1 --").expect(200)
    expect(injected.body.data.products).toHaveLength(0)
  })

  it('supports every marketplace sort option and validates invalid ranges or sort values', async () => {
    const farmer = await registerFarmer('Bokwai')
    await createProduct(farmer.cookie, { name: 'Cheap Beans', price: '500' })
    await createProduct(farmer.cookie, { name: 'Premium Pepper', price: '2500' })

    const priceAsc = await request(app).get('/api/products?sort=price_asc&pageSize=2').expect(200)
    expect(priceAsc.body.data.products[0].price).toBeLessThanOrEqual(priceAsc.body.data.products[1].price)

    const priceDesc = await request(app).get('/api/products?sort=price_desc&pageSize=2').expect(200)
    expect(priceDesc.body.data.products[0].price).toBeGreaterThanOrEqual(priceDesc.body.data.products[1].price)

    await request(app).get('/api/products?sort=newest').expect(200)
    await request(app).get('/api/products?sort=oldest').expect(200)

    await request(app).get('/api/products?minPrice=2000&maxPrice=1000').expect(422)
    await request(app).get('/api/products?sort=price;DROP TABLE products').expect(422)
  })

  it('returns recent active listings and public product details, with sold-out visible and inactive hidden', async () => {
    const farmer = await registerFarmer('Bonduma')
    const active = await createProduct(farmer.cookie, { name: 'Recent Pineapple' }, 2)
    const soldOut = await createProduct(farmer.cookie, { name: 'Sold Out Yam', quantityAvailable: '0' })
    const inactive = await createProduct(farmer.cookie, { name: 'Hidden Pepper' })

    await request(app)
      .patch(`/api/farmer/products/${inactive.body.data.product.productId}/status`)
      .set('Cookie', farmer.cookie)
      .send({ status: 'inactive' })
      .expect(200)

    const recent = await request(app).get('/api/products/recent?limit=3').expect(200)
    expect(recent.body.data.products).toHaveLength(1)
    expect(recent.body.data.products[0].productId).toBe(active.body.data.product.productId)

    const activeDetail = await request(app).get(`/api/products/${active.body.data.product.productId}`).expect(200)
    expect(activeDetail.body.data.product.images).toHaveLength(2)
    expect(activeDetail.body.data.product.farmer).toMatchObject({
      accountLocation: 'Bonduma',
      farmLocation: 'Bonduma',
      name: 'Bonduma Farmer',
    })

    const soldOutDetail = await request(app).get(`/api/products/${soldOut.body.data.product.productId}`).expect(200)
    expect(soldOutDetail.body.data.product.status).toBe('sold_out')

    await request(app).get(`/api/products/${inactive.body.data.product.productId}`).expect(404)
  })

  it('compares two to four active products in requested order and validates unavailable IDs', async () => {
    const farmer = await registerFarmer('Muea')
    const first = await createProduct(farmer.cookie, { name: 'Compare Cassava', price: '700' })
    const second = await createProduct(farmer.cookie, { name: 'Compare Maize', price: '900' })
    const inactive = await createProduct(farmer.cookie, { name: 'Compare Hidden', price: '1100' })

    await request(app)
      .patch(`/api/farmer/products/${inactive.body.data.product.productId}/status`)
      .set('Cookie', farmer.cookie)
      .send({ status: 'inactive' })
      .expect(200)

    const firstId = first.body.data.product.productId
    const secondId = second.body.data.product.productId
    const inactiveId = inactive.body.data.product.productId

    const response = await request(app).get(`/api/products/compare?ids=${secondId},${firstId}`).expect(200)
    expect(response.body.data.products.map((product) => product.productId)).toEqual([secondId, firstId])
    expect(response.body.data.products[0]).toMatchObject({
      category: expect.any(Object),
      farmer: expect.objectContaining({ accountLocation: 'Muea' }),
      name: 'Compare Maize',
      unit: 'basket',
    })

    await request(app).get(`/api/products/compare?ids=${firstId}`).expect(422)
    await request(app).get(`/api/products/compare?ids=${firstId},${firstId}`).expect(422)
    await request(app).get('/api/products/compare?ids=abc,2').expect(422)
    await request(app).get(`/api/products/compare?ids=${firstId},${inactiveId}`).expect(404)
  })

  it('logs guest contact clicks with a null buyer ID', async () => {
    const farmer = await registerFarmer('Likoko')
    const created = await createProduct(farmer.cookie, { name: 'Guest Contact Tomato' })
    const productId = created.body.data.product.productId

    const response = await request(app)
      .post(`/api/products/${productId}/contact-click`)
      .set('x-test-rate-limit-key', 'guest-contact')
      .expect(201)

    expect(response.body.data.contactClick).toMatchObject({ logged: true })

    const logs = await getContactClickLogs(productId)
    expect(logs).toHaveLength(1)
    expect(logs[0].buyer_user_id).toBeNull()
  })

  it('logs a buyer contact click with the buyer ID and treats farmers as guests', async () => {
    const farmer = await registerFarmer('Mile 16')
    const buyer = await registerBuyer('Clerks Quarter')
    const created = await createProduct(farmer.cookie, { name: 'Buyer Contact Yam' })
    const productId = created.body.data.product.productId

    await request(app)
      .post(`/api/products/${productId}/contact-click`)
      .set('Cookie', buyer.cookie)
      .set('x-test-rate-limit-key', 'buyer-contact')
      .expect(201)

    await request(app)
      .post(`/api/products/${productId}/contact-click`)
      .set('Cookie', farmer.cookie)
      .set('x-test-rate-limit-key', 'farmer-contact')
      .expect(201)

    const logs = await getContactClickLogs(productId)
    expect(Number(logs[0].buyer_user_id)).toBe(buyer.user.userId)
    expect(logs[1].buyer_user_id).toBeNull()
  })

  it('treats an invalid optional-auth JWT as a guest contact click', async () => {
    const farmer = await registerFarmer('Sandpit')
    const created = await createProduct(farmer.cookie, { name: 'Invalid Token Contact Pepper' })
    const productId = created.body.data.product.productId

    await request(app)
      .post(`/api/products/${productId}/contact-click`)
      .set('Cookie', `${env.cookie.name}=not-a-valid-token`)
      .set('x-test-rate-limit-key', 'invalid-token-contact')
      .expect(201)

    const logs = await getContactClickLogs(productId)
    expect(logs).toHaveLength(1)
    expect(logs[0].buyer_user_id).toBeNull()
  })

  it('rejects contact clicks for missing or inactive products', async () => {
    const farmer = await registerFarmer('Wotutu')
    const inactive = await createProduct(farmer.cookie, { name: 'Inactive Contact Beans' })

    await request(app)
      .patch(`/api/farmer/products/${inactive.body.data.product.productId}/status`)
      .set('Cookie', farmer.cookie)
      .send({ status: 'inactive' })
      .expect(200)

    await request(app)
      .post('/api/products/999999999/contact-click')
      .set('x-test-rate-limit-key', 'missing-contact')
      .expect(404)

    await request(app)
      .post(`/api/products/${inactive.body.data.product.productId}/contact-click`)
      .set('x-test-rate-limit-key', 'inactive-contact')
      .expect(404)
  })

  it('rate limits repeated contact clicks without creating order or message tables', async () => {
    const farmer = await registerFarmer('Upper Farms')
    const created = await createProduct(farmer.cookie, { name: 'Rate Limited Plantain' })
    const productId = created.body.data.product.productId
    const key = `rate-limit-${productId}`

    await request(app).post(`/api/products/${productId}/contact-click`).set('x-test-rate-limit-key', key).expect(201)
    await request(app).post(`/api/products/${productId}/contact-click`).set('x-test-rate-limit-key', key).expect(201)
    await request(app).post(`/api/products/${productId}/contact-click`).set('x-test-rate-limit-key', key).expect(201)

    const limited = await request(app)
      .post(`/api/products/${productId}/contact-click`)
      .set('x-test-rate-limit-key', key)
      .expect(429)

    expect(limited.body.error.code).toBe('RATE_LIMITED')
    expect(await tableExists('orders')).toBe(false)
    expect(await tableExists('messages')).toBe(false)
  })
})
