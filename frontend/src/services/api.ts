import axios from 'axios'

// En desarrollo el proxy de Vite redirige /api a localhost:8080;
// en producción nginx hace el proxy al servicio backend.
const api = axios.create({
  baseURL: '/api',
})

// Adjunta el token JWT a cada petición si existe sesión activa
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sffe_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
