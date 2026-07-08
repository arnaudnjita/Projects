const { AppError } = require('../errors/AppError')
const env = require('../config/env')
const authService = require('../services/authService')
const userRepository = require('../repositories/userRepository')
const { toPublicUser } = require('../utils/userMapper')

function getTokenFromRequest(req) {
  return req.cookies?.[env.cookie.name]
}

async function attachUserFromToken(req, required) {
  const token = getTokenFromRequest(req)

  if (!token) {
    if (required) {
      throw new AppError('Authentication is required.', {
        code: 'UNAUTHENTICATED',
        statusCode: 401,
      })
    }

    return null
  }

  try {
    const payload = authService.verifyAuthToken(token)
    const user = await userRepository.findUserById(payload.userId)

    if (!user) {
      throw new Error('User not found')
    }

    req.user = toPublicUser(user)
    return req.user
  } catch {
    if (required) {
      throw new AppError('Authentication is required.', {
        code: 'UNAUTHENTICATED',
        statusCode: 401,
      })
    }

    return null
  }
}

async function requireAuth(req, _res, next) {
  try {
    await attachUserFromToken(req, true)
    next()
  } catch (error) {
    next(error)
  }
}

function requireRole(role) {
  return (req, _res, next) => {
    if (!req.user) {
      next(
        new AppError('Authentication is required.', {
          code: 'UNAUTHENTICATED',
          statusCode: 401,
        }),
      )
      return
    }

    if (req.user.role !== role) {
      next(
        new AppError('You do not have permission to access this resource.', {
          code: 'FORBIDDEN',
          statusCode: 403,
        }),
      )
      return
    }

    next()
  }
}

async function optionalAuth(req, _res, next) {
  try {
    await attachUserFromToken(req, false)
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireRole,
}
