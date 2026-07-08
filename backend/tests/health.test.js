const request = require('supertest')

const database = require('../src/config/database')
database.testDatabaseConnection = vi.fn()

const app = require('../src/app')

describe('GET /api/health', () => {
  it('returns healthy API and database metadata', async () => {
    database.testDatabaseConnection.mockResolvedValue(true)

    const response = await request(app).get('/api/health').expect(200)

    expect(response.body).toEqual({
      success: true,
      data: {
        application: 'CultivaX',
        database: 'ok',
        environment: expect.any(String),
        status: 'ok',
        timestamp: expect.any(String),
      },
    })
    expect(Date.parse(response.body.data.timestamp)).not.toBeNaN()
  })

  it('returns 503 when the database is unavailable', async () => {
    database.testDatabaseConnection.mockResolvedValue(false)

    const response = await request(app).get('/api/health').expect(503)

    expect(response.body.data).toMatchObject({
      application: 'CultivaX',
      database: 'unavailable',
      status: 'degraded',
    })
    expect(response.body.success).toBe(true)
  })
})
