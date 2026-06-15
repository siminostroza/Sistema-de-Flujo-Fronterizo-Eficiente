import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth, type Rol } from '../../context/AuthContext'
import { maskIdentificador } from '../../utils/documento'
import Footer from './Footer'

interface NavItem {
  to: string
  label: string
  icon: string
  roles: Rol[]
}

const TODOS: Rol[] = [
  'FUNCIONARIO_ADUANA',
  'FUNCIONARIO_PDI',
  'FUNCIONARIO_SAG',
  'ADMIN',
]

/** Items del sidebar; cada uno se muestra solo a los roles indicados (RF05). */
const NAV_ITEMS: NavItem[] = [
  { to: '/fiscalizacion', label: 'Fiscalización', icon: '🛂', roles: TODOS },
  { to: '/historial', label: 'Historial', icon: '🗂️', roles: TODOS },
  {
    to: '/monitoreo',
    label: 'Monitoreo',
    icon: '📊',
    roles: ['FUNCIONARIO_ADUANA', 'ADMIN'],
  },
  { to: '/admin', label: 'Administración', icon: '⚙️', roles: ['ADMIN'] },
]

/** Institución que se muestra en la cabecera según el rol del JWT. */
function institucionDeRol(rol: Rol): string {
  switch (rol) {
    case 'FUNCIONARIO_ADUANA':
      return 'Servicio Nacional de Aduanas'
    case 'FUNCIONARIO_PDI':
      return 'Policía de Investigaciones (PDI)'
    case 'FUNCIONARIO_SAG':
      return 'Servicio Agrícola y Ganadero (SAG)'
    case 'ADMIN':
      return 'Administración del Sistema'
    default:
      return 'Control Fronterizo'
  }
}

/**
 * Layout responsive del panel de funcionario (RF05): sidebar fijo 220px en
 * desktop (≥900px), hamburguesa en mobile (<900px). Navegación según rol,
 * cabecera con banda GOB.CL, institución e identificador enmascarado (RNF10).
 */
function FuncionarioLayout({ children }: { children: ReactNode }) {
  const { sesion, logout } = useAuth()
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  if (!sesion) {
    return null
  }

  const items = NAV_ITEMS.filter((item) => item.roles.includes(sesion.rol))
  const identificadorEnmascarado = maskIdentificador(
    sesion.identificador,
    sesion.tipoDocumento,
  )

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[220px_1fr]">
      {/* Sidebar: visible en desktop (md:), toggle en mobile */}
      <aside
        className={`${
          sidebarAbierto ? 'flex' : 'hidden md:flex'
        } flex-col bg-gov-tertiary text-white`}
      >
        <div className="border-b border-white/10 px-4 py-4">
          <div className="text-xs font-bold tracking-wider text-gov-accent">
            GOB.CL
          </div>
          <div className="mt-1 text-lg font-extrabold">SFFE</div>
          <div className="text-[11px] text-gov-accent">Panel institucional</div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3 text-sm">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 font-semibold transition-colors ${
                  isActive
                    ? 'bg-gov-primary text-white'
                    : 'text-gov-accent hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="m-3 cursor-pointer rounded-md bg-gov-secondary px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Contenido principal */}
      <div className="flex min-w-0 flex-col bg-gov-neutral">
        {/* Cabecera */}
        <header className="flex items-center justify-between border-b border-gov-accent bg-white px-4 py-3 md:px-6">
          <button
            onClick={() => setSidebarAbierto(!sidebarAbierto)}
            className="md:hidden cursor-pointer rounded-md bg-gov-neutral px-2 py-1.5 text-xl text-gov-tertiary hover:bg-gov-primary-light"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <div>
            <div className="text-sm font-bold text-gov-tertiary">
              {institucionDeRol(sesion.rol)}
            </div>
            <div className="text-xs text-gov-gray-b">
              Servicio Nacional de Aduanas · Gobierno de Chile
            </div>
          </div>
          <div className="text-right text-[13px]">
            <div className="font-semibold text-gov-black">
              {sesion.nombre}
            </div>
            <div className="text-xs text-gov-gray-b">
              {identificadorEnmascarado} · {sesion.rol.replace('FUNCIONARIO_', '')}
            </div>
          </div>
        </header>

        {/* Banner obligatorio de prototipo */}
        <div className="border-b border-gov-accent bg-estado-pendiente-bg px-4 py-1.5 text-center text-xs text-estado-pendiente-text md:px-6">
          ⚠️ Prototipo académico DuocUC — No es un sistema oficial del Estado de Chile
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  )
}

export default FuncionarioLayout
