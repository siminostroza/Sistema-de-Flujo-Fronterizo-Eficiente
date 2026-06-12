import api from './api'
import type { Rol } from '../context/AuthContext'

export interface LoginPayload {
  rut: string
  contrasena: string
}

export interface LoginResponse {
  token: string
  rol: Rol
  nombre: string
}

export interface RegisterPayload {
  nombre: string
  rut: string
  correo: string
  contrasena: string
  nacionalidad?: string
  telefono?: string
}

export interface RegisterResponse {
  mensaje: string
  userId: number
}

/** POST /api/auth/login */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

/** POST /api/auth/register */
export async function register(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', payload)
  return data
}

/** Extrae el mensaje de error específico devuelto por el backend (RF01). */
export function mensajeDeError(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const resp = (error as { response?: { data?: { mensaje?: string } } }).response
    if (resp?.data?.mensaje) {
      return resp.data.mensaje
    }
  }
  return 'No se pudo conectar con el servidor. Intenta nuevamente.'
}
