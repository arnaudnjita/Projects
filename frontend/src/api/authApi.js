import apiClient, { unwrapData } from './apiClient'

export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me')
  return unwrapData(response)
}

export async function login(payload) {
  const response = await apiClient.post('/auth/login', payload)
  return unwrapData(response)
}

export async function register(payload) {
  const response = await apiClient.post('/auth/register', payload)
  return unwrapData(response)
}

export async function logout() {
  const response = await apiClient.post('/auth/logout')
  return unwrapData(response)
}

export async function forgotPassword(payload) {
  const response = await apiClient.post('/auth/forgot-password', payload)
  return unwrapData(response)
}

export async function resetPassword(payload) {
  const response = await apiClient.post('/auth/reset-password', payload)
  return unwrapData(response)
}
