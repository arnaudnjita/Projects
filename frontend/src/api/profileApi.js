import apiClient, { unwrapData } from './apiClient'

export async function getFarmerProfile() {
  const response = await apiClient.get('/farmers/me/profile')
  return unwrapData(response)
}

export async function updateFarmerProfile(payload) {
  const response = await apiClient.put('/farmers/me/profile', payload)
  return unwrapData(response)
}

export async function uploadFarmerProfilePhoto(formData) {
  const response = await apiClient.post('/farmers/me/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrapData(response)
}
