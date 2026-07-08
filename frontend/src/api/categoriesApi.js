import apiClient, { unwrapData } from './apiClient'

export async function listCategories() {
  const response = await apiClient.get('/categories')
  return unwrapData(response)
}
