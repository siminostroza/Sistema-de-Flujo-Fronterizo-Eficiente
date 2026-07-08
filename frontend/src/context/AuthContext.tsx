import { createContext, useContext, useState, type ReactNode } from 'react'
import type { TipoDocumento } from '../utils/documento'

export type Rol =
  | 'PASAJERO'
  | 'FUNCIONARIO_ADUANA'
  | 'FUNCIONARIO_PDI'
  | 'FUNCIONARIO_SAG'
  | 'ADMIN'

export interface Sesion {
  token: string
  rol: Rol
  nombre: string
  identificador: string
  tipoDocumento: TipoDocumento
  correo: string
}

interface AuthContextType {
  sesion: Sesion | null
  login: (datos: Sesion) => void
  logout: () => void
  isAuthenticated: () => boolean
}

const STORAGE_KEY = 'sffe_token'
const STORAGE_ROL = 'sffe_rol'
const STORAGE_NOMBRE = 'sffe_nombre'
const STORAGE_IDENTIFICADOR = 'sffe_identificador'
const STORAGE_TIPO_DOCUMENTO = 'sffe_tipo_documento'
const STORAGE_CORREO = 'sffe_correo'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Reconstruye la sesión desde localStorage al iniciar la app. */
function leerSesionInicial(): Sesion | null {
  const token = localStorage.getItem(STORAGE_KEY)
  const rol = localStorage.getItem(STORAGE_ROL) as Rol | null
  const nombre = localStorage.getItem(STORAGE_NOMBRE)
  const identificador = localStorage.getItem(STORAGE_IDENTIFICADOR)
  const tipoDocumento = localStorage.getItem(STORAGE_TIPO_DOCUMENTO) as TipoDocumento | null
  const correo = localStorage.getItem(STORAGE_CORREO) ?? ''
  if (token && rol && nombre && identificador && tipoDocumento) {
    return { token, rol, nombre, identificador, tipoDocumento, correo }
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesionInicial)

  const login = (datos: Sesion) => {
    localStorage.setItem(STORAGE_KEY, datos.token)
    localStorage.setItem(STORAGE_ROL, datos.rol)
    localStorage.setItem(STORAGE_NOMBRE, datos.nombre)
    localStorage.setItem(STORAGE_IDENTIFICADOR, datos.identificador)
    localStorage.setItem(STORAGE_TIPO_DOCUMENTO, datos.tipoDocumento)
    localStorage.setItem(STORAGE_CORREO, datos.correo ?? '')
    setSesion(datos)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_ROL)
    localStorage.removeItem(STORAGE_NOMBRE)
    localStorage.removeItem(STORAGE_IDENTIFICADOR)
    localStorage.removeItem(STORAGE_TIPO_DOCUMENTO)
    localStorage.removeItem(STORAGE_CORREO)
    setSesion(null)
  }

  const isAuthenticated = () => sesion !== null

  return (
    <AuthContext.Provider value={{ sesion, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook de acceso al contexto de sesión. */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}
