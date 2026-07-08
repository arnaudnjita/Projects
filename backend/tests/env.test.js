const { buildEnv } = require('../src/config/env')

const validSource = {
  APP_BASE_URL: 'http://localhost:5173',
  COOKIE_NAME: 'cultivax_session',
  DB_HOST: '127.0.0.1',
  DB_NAME: 'cultivax',
  DB_PASSWORD: 'secret_password',
  DB_PORT: '3306',
  DB_USER: 'cultivax_user',
  FRONTEND_URL: 'http://localhost:5173',
  JWT_EXPIRES_IN: '7d',
  JWT_SECRET: 'secret_jwt_value_32_chars_minimum',
  MAX_UPLOAD_MB: '5',
  NODE_ENV: 'test',
  PORT: '5000',
  SMTP_FROM: 'CultivaX <test@example.com>',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PASS: 'smtp_password',
  SMTP_PORT: '587',
  SMTP_USER: 'smtp_user',
}

describe('buildEnv', () => {
  it('converts numeric and boolean values predictably', () => {
    const env = buildEnv({
      ...validSource,
      COOKIE_SECURE: 'true',
      SMTP_SECURE: 'false',
    })

    expect(env.port).toBe(5000)
    expect(env.database.port).toBe(3306)
    expect(env.maxUploadMb).toBe(5)
    expect(env.cookie.secure).toBe(true)
    expect(env.smtp.secure).toBe(false)
  })

  it('fails clearly when required variables are missing without secret values', () => {
    const invalidSource = {
      ...validSource,
      DB_PASSWORD: '',
      JWT_SECRET: '',
    }

    expect(() => buildEnv(invalidSource)).toThrow(
      /Missing required environment variables: DB_PASSWORD, JWT_SECRET/,
    )

    try {
      buildEnv(invalidSource)
    } catch (error) {
      expect(error.message).not.toContain(validSource.DB_PASSWORD)
      expect(error.message).not.toContain(validSource.JWT_SECRET)
    }
  })

  it('rejects weak or placeholder JWT secrets', () => {
    expect(() => buildEnv({ ...validSource, JWT_SECRET: 'short-secret' })).toThrow(/JWT_SECRET must be at least 32 characters/)
    expect(() => buildEnv({ ...validSource, JWT_SECRET: 'replace_with_a_long_random_secret' })).toThrow(
      /JWT_SECRET must be changed from the example value/,
    )
  })
})
