import axios from 'axios'
import { apiBaseUrl } from './apiConfig'

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
})

let csrfToken = ''
let csrfTokenPromise = null

function isBrowserRuntime() {
  return typeof window !== 'undefined'
}

function isUnsafeMethod(method = 'get') {
  return ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase())
}

async function getCsrfToken() {
  if (csrfToken) {
    return csrfToken
  }

  csrfTokenPromise ||= axios
    .get(`${apiBaseUrl}/csrf`, {
      timeout: 15_000,
      withCredentials: true,
    })
    .then((response) => {
      csrfToken = response.data?.data?.csrfToken || ''
      return csrfToken
    })
    .finally(() => {
      csrfTokenPromise = null
    })

  return csrfTokenPromise
}

export class ApiError extends Error {
  constructor(message, { code = 'API_ERROR', fields = undefined, status = 0 } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.fields = fields
    this.status = status
  }
}

function normalizeApiError(error) {
  if (error.response?.data?.error) {
    const apiError = error.response.data.error
    return new ApiError(apiError.message || 'Request failed.', {
      code: apiError.code,
      fields: apiError.fields,
      status: error.response.status,
    })
  }

  if (error.response) {
    return new ApiError('Request failed.', {
      code: 'HTTP_ERROR',
      status: error.response.status,
    })
  }

  if (error.request) {
    return new ApiError('The server could not be reached.', {
      code: 'NETWORK_ERROR',
      status: 0,
    })
  }

  return new ApiError('Request setup failed.', {
    code: 'REQUEST_ERROR',
    status: 0,
  })
}

apiClient.interceptors.request.use(async (config) => {
  if (isBrowserRuntime() && isUnsafeMethod(config.method)) {
    const token = await getCsrfToken()
    config.headers = config.headers || {}
    config.headers['X-CSRF-Token'] = token
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error?.code === 'CSRF_TOKEN_INVALID') {
      csrfToken = ''
    }

    return Promise.reject(normalizeApiError(error))
  },
)

export function unwrapData(response) {
  return response.data?.data ?? {}
}

export default apiClient
