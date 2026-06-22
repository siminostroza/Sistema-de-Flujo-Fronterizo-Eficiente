import { Link, useLocation } from 'react-router-dom'

// "Viaje" apunta al historial (/dashboard), no al wizard: el wizard se inicia
// desde el botón "Nuevo Viaje" del historial (CAMBIO 6.1).
const TABS = [
  { to: '/dashboard', icon: '🏠', label: 'Inicio' },
  { to: '/dashboard', icon: '🧾', label: 'Viajes' },
  { to: '/estado-tramite', icon: '🔳', label: 'Mi QR' },
  { to: '/perfil', icon: '👤', label: 'Perfil' },
]

/** Navegación inferior fija de la vista pasajero (4 pestañas). */
function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid h-16 grid-cols-4 border-t border-gov-neutral bg-white">
      {TABS.map((tab) => {
        const activo = pathname === tab.to
        return (
          <Link
            key={tab.label}
            to={tab.to}
            className={`flex flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
              activo ? 'text-gov-primary' : 'text-gov-gray-b'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default BottomNav
