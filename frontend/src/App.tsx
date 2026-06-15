import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import Login from './pages/Login'
import LoginFuncionario from './pages/LoginFuncionario'
import Dashboard from './pages/Dashboard'
import RegistroViaje from './pages/RegistroViaje'
import EstadoTramite from './pages/EstadoTramite'
import Perfil from './pages/Perfil'
import FiscalizacionQr from './pages/FiscalizacionQr'
import Historial from './pages/Historial'
import Monitoreo from './pages/Monitoreo'
import Admin from './pages/Admin'
import BottomNav from './components/layout/BottomNav'
import FuncionarioLayout from './components/layout/FuncionarioLayout'
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
  if (sesion.rol === 'PASAJERO') {
    return (
      <>
        {children}
        <BottomNav />
      </>
    )
  }
  // Funcionarios y admin comparten el layout institucional con sidebar por rol.
  return <FuncionarioLayout>{children}</FuncionarioLayout>
}

const ROLES_FUNCIONARIO: Rol[] = [
  'FUNCIONARIO_ADUANA',
  'FUNCIONARIO_PDI',
  'FUNCIONARIO_SAG',
  'ADMIN',
]

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
        path="/estado-tramite"
        element={
          <RutaProtegida roles={['PASAJERO']}>
            <EstadoTramite />
          </RutaProtegida>
        }
      />
      <Route
        path="/perfil"
        element={
          <RutaProtegida roles={['PASAJERO']}>
            <Perfil />
          </RutaProtegida>
        }
      />

      {/* Vista funcionario / admin */}
      <Route
        path="/fiscalizacion"
        element={
          <RutaProtegida roles={ROLES_FUNCIONARIO}>
            <FiscalizacionQr />
          </RutaProtegida>
        }
      />
      <Route
        path="/historial"
        element={
          <RutaProtegida roles={ROLES_FUNCIONARIO}>
            <Historial />
          </RutaProtegida>
        }
      />
      <Route
        path="/monitoreo"
        element={
          <RutaProtegida roles={['FUNCIONARIO_ADUANA', 'ADMIN']}>
            <Monitoreo />
          </RutaProtegida>
        }
      />
      <Route
        path="/admin"
        element={
          <RutaProtegida roles={['ADMIN']}>
            <Admin />
          </RutaProtegida>
        }
      />

      {/* Cualquier otra ruta vuelve a la raíz */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
