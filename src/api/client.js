import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
const UPLOAD_TOKEN_KEY = 'lr_upload_token'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

export function getUploadToken() {
  return sessionStorage.getItem(UPLOAD_TOKEN_KEY) || ''
}

export function setUploadToken(token) {
  if (token) sessionStorage.setItem(UPLOAD_TOKEN_KEY, token)
  else sessionStorage.removeItem(UPLOAD_TOKEN_KEY)
}

export function clearUploadToken() {
  sessionStorage.removeItem(UPLOAD_TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const uploadToken = getUploadToken()
  if (uploadToken) {
    config.headers['X-LR-Upload-Token'] = uploadToken
    // Prefer magic link over JWT when present
    delete config.headers.Authorization
    return config
  }
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    // Magic-link sessions do not refresh JWT
    if (getUploadToken()) {
      return Promise.reject(error)
    }
    if (error.response?.status === 401 && !original._retry) {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        clearTokens()
        return Promise.reject(error)
      }
      original._retry = true
      try {
        refreshing =
          refreshing ||
          axios.post(`${API_BASE}/api/auth/refresh/`, { refresh })
        const { data } = await refreshing
        refreshing = null
        localStorage.setItem('access_token', data.access)
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh)
        }
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (refreshError) {
        refreshing = null
        clearTokens()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('auth_user')
}

export function getErrorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (typeof data === 'object') {
    const first = Object.values(data)[0]
    if (Array.isArray(first)) return first[0]
    if (typeof first === 'string') return first
  }
  return fallback
}
