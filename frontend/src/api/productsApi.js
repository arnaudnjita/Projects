import apiClient, { unwrapData } from './apiClient'

export async function listProducts(params = {}, options = {}) {
  const response = await apiClient.get('/products', { params, signal: options.signal })
  return {
    ...unwrapData(response),
    meta: response.data?.meta,
  }
}

export async function listRecentProducts(params = {}, options = {}) {
  const response = await apiClient.get('/products/recent', { params, signal: options.signal })
  return unwrapData(response)
}

export async function getProduct(productId, options = {}) {
  const response = await apiClient.get(`/products/${productId}`, { signal: options.signal })
  return unwrapData(response)
}

export async function compareProducts(ids, options = {}) {
  const response = await apiClient.get('/products/compare', {
    params: { ids: Array.isArray(ids) ? ids.join(',') : ids },
    signal: options.signal,
  })
  return unwrapData(response)
}

export async function listFarmerProducts(params = {}, options = {}) {
  const response = await apiClient.get('/farmer/products', { params, signal: options.signal })
  return {
    ...unwrapData(response),
    meta: response.data?.meta,
  }
}

export async function getFarmerProduct(productId) {
  const response = await apiClient.get(`/farmer/products/${productId}`)
  return unwrapData(response)
}

export async function createFarmerProduct(formData) {
  const response = await apiClient.post('/farmer/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrapData(response)
}

export async function updateFarmerProduct(productId, formData) {
  const response = await apiClient.put(`/farmer/products/${productId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return unwrapData(response)
}

export async function updateFarmerProductQuantity(productId, quantityAvailable) {
  const response = await apiClient.patch(`/farmer/products/${productId}/quantity`, { quantityAvailable })
  return unwrapData(response)
}

export async function updateFarmerProductStatus(productId, status) {
  const response = await apiClient.patch(`/farmer/products/${productId}/status`, { status })
  return unwrapData(response)
}

export async function deleteFarmerProduct(productId) {
  const response = await apiClient.delete(`/farmer/products/${productId}`)
  return unwrapData(response)
}
