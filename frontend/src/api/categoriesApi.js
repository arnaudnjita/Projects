import apiClient, { unwrapData } from './apiClient'

export async function listCategories(options = {}) {
  const response = await apiClient.get('/categories', { signal: options.signal })
  return unwrapData(response)
}
