import api from './api'
import type { Rol } from '../context/AuthContext'
import type { TipoDocumento } from '../utils/documento'

export interface LoginPayload {
  identificador: string
  contrasena: string
}

export interface LoginResponse {
  token: string
  rol: Rol
  nombre: string
  tipoDocumento: TipoDocumento
}

export interface RegisterPayload {
  nombre: string
  tipoDocumento: TipoDocumento
  identificador?: string
  correo: string
  contrasena: string
  nacionalidad?: string
  telefono?: string
  fechaNacimiento: string
}

/**
 * Carnet de identidad y papeles de antecedentes (RF01). Obligatorios salvo
 * para SIN_DOCUMENTO, validado en el backend; por eso son nullable aquí.
 */
export interface RegisterArchivos {
  carnetIdentidad: File | null
  papelesAntecedentes: File | null
}

export interface RegisterResponse {
  mensaje: string
  userId: number
  identificador: string
}

/** POST /api/auth/login */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload)
  return data
}

/**
 * POST /api/auth/register — multipart: la parte "datos" lleva el JSON del
 * registro; "carnetIdentidad" y "papelesAntecedentes" son los archivos
 * adjuntos.
 */
export async function register(
  payload: RegisterPayload,
  archivos: RegisterArchivos,
): Promise<RegisterResponse> {
  const formData = new FormData()
  formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (archivos.carnetIdentidad) {
    formData.append('carnetIdentidad', archivos.carnetIdentidad)
  }
  if (archivos.papelesAntecedentes) {
    formData.append('papelesAntecedentes', archivos.papelesAntecedentes)
  }
  const { data } = await api.post<RegisterResponse>('/auth/register', formData)
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
