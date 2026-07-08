const express = require('express')
const request = require('supertest')

const errorHandler = require('../src/middleware/errorHandler')

function createErrorApp(error) {
  const app = express()

  app.get('/boom', (_req, _res, next) => {
    next(error)
  })
  app.use((req, _res, next) => {
    req.id = 'test-request-id'
    next()
  })
  app.use(errorHandler({ nodeEnv: 'production' }))

  return app
}

describe('error handler', () => {
  it('translates duplicate key errors safely', async () => {
    const response = await request(createErrorApp({ code: 'ER_DUP_ENTRY' }))
      .get('/boom')
      .expect(409)

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'DUPLICATE_VALUE',
        message: 'A record with that value already exists.',
      },
    })
  })

  it('translates foreign key errors safely', async () => {
    const response = await request(createErrorApp({ code: 'ER_NO_REFERENCED_ROW_2' }))
      .get('/boom')
      .expect(409)

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'The request references related data that cannot be used.',
      },
    })
  })

  it('does not expose stack traces in production', async () => {
    const response = await request(createErrorApp(new Error('Sensitive stack detail')))
      .get('/boom')
      .expect(500)

    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong.',
      },
    })
  })
})
