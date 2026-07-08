const env = require('../config/env')
const authService = require('../services/authService')
const { sendSuccess } = require('../utils/apiResponse')
const { throwIfValidationFailed } = require('../utils/validation')

function setAuthCookie(res, token) {
  res.cookie(env.cookie.name, token, authService.getCookieOptions())
}

function clearAuthCookie(res) {
  res.clearCookie(env.cookie.name, authService.getCookieOptions())
}

async function register(req, res) {
  throwIfValidationFailed(req)
  const result = await authService.registerUser(req.body)

  setAuthCookie(res, result.token)
  return sendSuccess(res, { user: result.user }, { statusCode: 201 })
}

async function login(req, res) {
  throwIfValidationFailed(req)
  const result = await authService.loginUser(req.body)

  setAuthCookie(res, result.token)
  return sendSuccess(res, { user: result.user })
}

function logout(_req, res) {
  clearAuthCookie(res)
  return sendSuccess(res, { loggedOut: true })
}

async function me(req, res) {
  return sendSuccess(res, { user: await authService.getCurrentUser(req.user.userId) })
}

async function forgotPassword(req, res) {
  throwIfValidationFailed(req)
  return sendSuccess(res, await authService.forgotPassword(req.body))
}

async function resetPassword(req, res) {
  throwIfValidationFailed(req)
  return sendSuccess(res, await authService.resetPassword(req.body))
}

module.exports = {
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
}
