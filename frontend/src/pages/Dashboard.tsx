import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import { useAuth } from '../context/AuthContext'

/**
 * Dashboard del pasajero (placeholder de la Sesión 3). El contenido de
 * trámites se construye en la Sesión 4.
 */
function Dashboard() {
  const { sesion, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />
      <main className="mx-auto max-w-[520px] px-4 py-6">
        <h1 className="text-[22px] text-gov-black">Hola, {sesion?.nombre}</h1>
        <p className="text-gov-gray-a">
          Bienvenido a tu portal de trámites de cruce fronterizo.
        </p>
        <button
          onClick={logout}
          className="cursor-pointer rounded-md bg-gov-secondary px-4 py-2.5 text-white"
        >
          Cerrar sesión
        </button>
      </main>
    </div>
  )
}

export default Dashboard
