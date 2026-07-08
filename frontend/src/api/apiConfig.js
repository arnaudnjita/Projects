export const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || '/api'

export function getApiOrigin() {
  try {
    const fallbackOrigin = typeof window === 'undefined' ? 'http://localhost:5000' : window.location.origin
    return new URL(apiBaseUrl, fallbackOrigin).origin
  } catch {
    return ''
  }
}
