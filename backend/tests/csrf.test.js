const request = require('supertest')

const app = require('../src/app')

describe('CSRF and origin protection', () => {
  it('issues signed CSRF tokens without exposing secrets', async () => {
    const response = await request(app).get('/api/csrf').set('Origin', 'http://localhost:5173').expect(200)

    expect(response.body).toMatchObject({
      success: true,
      data: {
        expiresInSeconds: expect.any(Number),
      },
    })
    expect(response.body.data.csrfToken).toMatch(/^\d+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    expect(response.text).not.toContain(process.env.JWT_SECRET)
  })

  it('rejects browser unsafe requests without a CSRF token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ identifier: 'buyer@example.com', password: 'Password1' })
      .expect(403)

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Security token is missing or expired. Please refresh the page and try again.',
      },
    })
  })

  it('allows browser unsafe requests with a valid CSRF token to reach normal validation', async () => {
    const csrfResponse = await request(app).get('/api/csrf').set('Origin', 'http://localhost:5173').expect(200)

    await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrfResponse.body.data.csrfToken)
      .send({ identifier: 'buyer@example.com', password: 'Password1' })
      .expect(401)
  })

  it('rejects disallowed browser origins before route handling', async () => {
    const response = await request(app).get('/api').set('Origin', 'http://evil.example').expect(403)

    expect(response.body.error.code).toBe('ORIGIN_NOT_ALLOWED')
  })
})
