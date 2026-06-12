import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import Login from './pages/Login'
import LoginFuncionario from './pages/LoginFuncionario'
import Dashboard from './pages/Dashboard'
import RegistroViaje from './pages/RegistroViaje'
import RegistroVehiculo from './pages/RegistroVehiculo'
import DeclaracionSag from './pages/DeclaracionSag'
import Fiscalizacion from './pages/Fiscalizacion'
import { useAuth, type Rol } from './context/AuthContext'

/**
 * Ruta protegida: exige sesión y, opcionalmente, uno de los roles indicados.
 * Si no hay sesión redirige al login; si el rol no corresponde, redirige al
 * destino propio del usuario.
 */
function RutaProtegida({
  children,
  roles,
}: {
  children: ReactNode
  roles: Rol[]
}) {
  const { sesion } = useAuth()

  if (!sesion) {
    return <Navigate to="/login" replace />
  }
  if (!roles.includes(sesion.rol)) {
    return <Navigate to={destinoPorRol(sesion.rol)} replace />
  }
  return <>{children}</>
}

/** Pantalla inicial de cada rol tras autenticarse. */
function destinoPorRol(rol: Rol): string {
  return rol === 'PASAJERO' ? '/dashboard' : '/fiscalizacion'
}

function App() {
  const { sesion } = useAuth()

  return (
    <Routes>
      {/* Raíz: redirige según haya o no sesión */}
      <Route
        path="/"
        element={
          sesion ? (
            <Navigate to={destinoPorRol(sesion.rol)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Rutas públicas de autenticación */}
      <Route path="/login" element={<Login />} />
      <Route path="/funcionario/login" element={<LoginFuncionario />} />

      {/* Vista pasajero */}
      <Route
        path="/dashboard"
        element={
          <RutaProtegida roles={['PASAJERO']}>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route
        path="/registro-viaje"
        element={
          <RutaProtegida roles={['PASAJERO']}>
            <RegistroViaje />
          </RutaProtegida>
        }
      />
      <Route
        path="/registro-vehiculo"
        element={
          <RutaProtegida roles={['PASAJERO']}>
            <RegistroVehiculo />
          </RutaProtegida>
        }
      />
      <Route
        path="/declaracion-sag"
        element={
          <RutaProtegida roles={['PASAJERO']}>
            <DeclaracionSag />
          </RutaProtegida>
        }
      />

      {/* Vista funcionario / admin */}
      <Route
        path="/fiscalizacion"
        element={
          <RutaProtegida
            roles={[
              'FUNCIONARIO_ADUANA',
              'FUNCIONARIO_PDI',
              'FUNCIONARIO_SAG',
              'ADMIN',
            ]}
          >
            <Fiscalizacion />
          </RutaProtegida>
        }
      />

      {/* Cualquier otra ruta vuelve a la raíz */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
