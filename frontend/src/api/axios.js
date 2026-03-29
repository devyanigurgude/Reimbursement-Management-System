import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL
// Default to same-origin so Vite's dev proxy can forward `/api` without CORS.
// Set `VITE_API_BASE_URL` only when you want to bypass the proxy (e.g. prod).
const baseURL = typeof configuredBaseUrl === 'string' ? configuredBaseUrl : ''

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`

  // Let Axios set the correct multipart boundary automatically.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

export default api
