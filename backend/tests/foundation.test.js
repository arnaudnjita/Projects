const request = require('supertest')

const database = require('../src/config/database')
database.testDatabaseConnection = vi.fn().mockResolvedValue(true)

const app = require('../src/app')

describe('backend foundation', () => {
  it('returns API metadata from GET /api', async () => {
    const response = await request(app).get('/api').expect(200)

    expect(response.body).toEqual({
      success: true,
      data: {
        name: 'CultivaX API',
        version: '0.1.0',
      },
    })
  })

  it('returns consistent 404 errors', async () => {
    const response = await request(app).get('/api/not-real').expect(404)

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found: GET /api/not-real',
      },
    })
  })

  it('sets security and request id headers', async () => {
    const response = await request(app).get('/api').expect(200)

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(response.headers['x-request-id']).toBeTruthy()
  })

  it('allows configured frontend origin with credentials', async () => {
    const response = await request(app)
      .get('/api')
      .set('Origin', 'http://localhost:5173')
      .expect(200)

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(response.headers['access-control-allow-credentials']).toBe('true')
  })

  it('does not allow unconfigured origins', async () => {
    const response = await request(app)
      .get('/api')
      .set('Origin', 'http://example.test')
      .expect(200)

    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })
})
