import { createContext, useContext, useState, type ReactNode } from 'react'

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

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Reconstruye la sesión desde localStorage al iniciar la app. */
function leerSesionInicial(): Sesion | null {
  const token = localStorage.getItem(STORAGE_KEY)
  const rol = localStorage.getItem(STORAGE_ROL) as Rol | null
  const nombre = localStorage.getItem(STORAGE_NOMBRE)
  if (token && rol && nombre) {
    return { token, rol, nombre }
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesionInicial)

  const login = (datos: Sesion) => {
    localStorage.setItem(STORAGE_KEY, datos.token)
    localStorage.setItem(STORAGE_ROL, datos.rol)
    localStorage.setItem(STORAGE_NOMBRE, datos.nombre)
    setSesion(datos)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_ROL)
    localStorage.removeItem(STORAGE_NOMBRE)
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
