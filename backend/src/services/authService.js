const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const env = require('../config/env')
const { withTransaction } = require('../config/database')
const { AppError } = require('../errors/AppError')
const mailService = require('./mailService')
const passwordResetTokenRepository = require('../repositories/passwordResetTokenRepository')
const userRepository = require('../repositories/userRepository')
const { normalizePhoneNumber } = require('../utils/phone')
const { toPublicUser } = require('../utils/userMapper')

const invalidCredentialsError = new AppError('Invalid phone/email or password.', {
  code: 'INVALID_CREDENTIALS',
  statusCode: 401,
})
const passwordResetGenericMessage =
  'If an account with that email exists, a password reset link has been sent.'

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase()
  return email === '' ? null : email
}

function validatePasswordPolicy(password) {
  return typeof password === 'string' && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

function buildResetUrl(token) {
  const resetUrl = new URL('/reset-password', env.appBaseUrl)
  resetUrl.searchParams.set('token', token)
  return resetUrl.toString()
}

function signAuthToken(user) {
  return jwt.sign(
    {
      role: user.role,
      userId: user.user_id ?? user.userId,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  )
}

function verifyAuthToken(token) {
  return jwt.verify(token, env.jwt.secret)
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    secure: env.cookie.secure,
  }
}

async function registerUser(input) {
  const normalizedPhone = normalizePhoneNumber(input.phone)
  const normalizedEmail = normalizeEmail(input.email)

  if (!normalizedPhone) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'phone', message: 'Enter a valid phone number.' }],
      statusCode: 422,
    })
  }

  if (!validatePasswordPolicy(input.password)) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [
        {
          field: 'password',
          message: 'Password must be at least 8 characters and include a letter and a number.',
        },
      ],
      statusCode: 422,
    })
  }

  const existingPhoneUser = await userRepository.findUserByPhone(normalizedPhone)
  if (existingPhoneUser) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'phone', message: 'That phone number is already registered.' }],
      statusCode: 422,
    })
  }

  if (normalizedEmail) {
    const existingEmailUser = await userRepository.findUserByEmail(normalizedEmail)
    if (existingEmailUser) {
      throw new AppError('Please check the highlighted fields.', {
        code: 'VALIDATION_ERROR',
        fields: [{ field: 'email', message: 'That email address is already registered.' }],
        statusCode: 422,
      })
    }
  }

  const passwordHash = await bcrypt.hash(input.password, 12)

  const user = await withTransaction(async (connection) => {
    const createdUser = await userRepository.createUser(
      {
        email: normalizedEmail,
        location: input.location.trim(),
        name: input.name.trim(),
        passwordHash,
        phone: normalizedPhone,
        role: input.role,
      },
      connection,
    )

    if (input.role === 'farmer') {
      await userRepository.createFarmerProfile(
        {
          farmLocation: input.location.trim(),
          userId: createdUser.user_id,
        },
        connection,
      )
    }

    return createdUser
  })

  return {
    token: signAuthToken(user),
    user: toPublicUser(user),
  }
}

async function loginUser(input) {
  const identifier = String(input.identifier || '').trim()
  const normalizedEmail = normalizeEmail(identifier)
  const normalizedPhone = normalizePhoneNumber(identifier)

  let user = null

  if (normalizedPhone) {
    user = await userRepository.findUserByPhone(normalizedPhone)
  } else if (normalizedEmail) {
    user = await userRepository.findUserByEmail(normalizedEmail)
  }

  if (!user) {
    throw invalidCredentialsError
  }

  const passwordMatches = await bcrypt.compare(input.password || '', user.password_hash)

  if (!passwordMatches) {
    throw invalidCredentialsError
  }

  return {
    token: signAuthToken(user),
    user: toPublicUser(user),
  }
}

async function getCurrentUser(userId) {
  const user = await userRepository.findUserById(userId)

  if (!user) {
    throw new AppError('Authentication is required.', {
      code: 'UNAUTHENTICATED',
      statusCode: 401,
    })
  }

  return toPublicUser(user)
}

async function forgotPassword(input) {
  const email = normalizeEmail(input.email)

  if (!email) {
    return { message: passwordResetGenericMessage }
  }

  const user = await userRepository.findUserByEmail(email)

  if (!user || !user.email) {
    return { message: passwordResetGenericMessage }
  }

  const plainToken = generateResetToken()
  const tokenHash = hashResetToken(plainToken)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

  await withTransaction(async (connection) => {
    await passwordResetTokenRepository.invalidateUnusedTokensForUser(user.user_id, connection)
    await passwordResetTokenRepository.createPasswordResetToken(
      {
        expiresAt,
        tokenHash,
        userId: user.user_id,
      },
      connection,
    )
  })

  await mailService.sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    resetUrl: buildResetUrl(plainToken),
  })

  return { message: passwordResetGenericMessage }
}

async function resetPassword(input) {
  if (!validatePasswordPolicy(input.password)) {
    throw new AppError('Please check the highlighted fields.', {
      code: 'VALIDATION_ERROR',
      fields: [
        {
          field: 'password',
          message: 'Password must be at least 8 characters and include a letter and a number.',
        },
      ],
      statusCode: 422,
    })
  }

  const tokenHash = hashResetToken(String(input.token || '').trim())

  await withTransaction(async (connection) => {
    const resetToken = await passwordResetTokenRepository.findUsableTokenByHash(tokenHash, connection)

    if (!resetToken) {
      throw new AppError('Password reset link is invalid or expired.', {
        code: 'INVALID_RESET_TOKEN',
        statusCode: 400,
      })
    }

    const passwordHash = await bcrypt.hash(input.password, 12)
    await userRepository.updatePasswordHash(resetToken.user_id, passwordHash, connection)
    await passwordResetTokenRepository.markTokenUsed(resetToken.password_reset_token_id, connection)
    await passwordResetTokenRepository.invalidateUnusedTokensForUser(resetToken.user_id, connection)
  })

  return { passwordReset: true }
}

module.exports = {
  forgotPassword,
  getCookieOptions,
  getCurrentUser,
  hashResetToken,
  loginUser,
  normalizeEmail,
  registerUser,
  resetPassword,
  signAuthToken,
  verifyAuthToken,
}
