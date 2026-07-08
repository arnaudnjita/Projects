import apiClient, { unwrapData } from './apiClient'

export async function recordContactClick(productId) {
  const response = await apiClient.post(`/products/${productId}/contact-click`)
  return unwrapData(response)
}
