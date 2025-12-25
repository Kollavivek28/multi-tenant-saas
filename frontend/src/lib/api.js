import axios from 'axios'
import { clearSession, getStoredToken } from './storage'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL,
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession()
      window.dispatchEvent(new CustomEvent('mts:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export const unwrap = (response) => response.data.data

export const handleApiError = (error) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message
  }
  return 'Unexpected error'
}
