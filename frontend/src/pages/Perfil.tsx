import { Link, useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import { etiquetaTipoDocumento } from '../utils/documento'

const cardClass = 'mb-4 rounded-lg border border-gov-neutral bg-white p-5'
const filaClass = 'mb-3 last:mb-0'
const labelFilaClass = 'text-[13px] font-semibold text-gov-gray-a'
const valorFilaClass = 'text-[15px] text-gov-black'

/**
 * Perfil del pasajero (RF01): muestra sus datos de sesión, incluyendo tipo
 * de documento e identificador SIN enmascarar (el pasajero ve sus propios
 * datos completos; el enmascarado de RNF10 aplica solo en vistas de
 * funcionario).
 */
function Perfil() {
  const { sesion, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />

      <main className="mx-auto max-w-[520px] px-4 py-6 pb-16">
        <h1 className="mb-1 text-[22px] text-gov-black">Mi perfil</h1>
        <p className="mt-0 text-sm text-gov-gray-b">Datos de tu cuenta SFFE</p>

        <div className={cardClass}>
          <div className={filaClass}>
            <div className={labelFilaClass}>Nombre</div>
            <div className={valorFilaClass}>{sesion?.nombre}</div>
          </div>
          <div className={filaClass}>
            <div className={labelFilaClass}>Tipo de documento</div>
            <div className={valorFilaClass}>{etiquetaTipoDocumento(sesion?.tipoDocumento)}</div>
          </div>
          <div className={filaClass}>
            <div className={labelFilaClass}>Identificador</div>
            <div className={valorFilaClass}>{sesion?.identificador}</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full cursor-pointer rounded-md bg-gov-secondary px-4 py-2.5 text-white"
        >
          Cerrar sesión
        </button>

        <p className="mt-4 text-center text-sm">
          <Link to="/dashboard" className="text-gov-primary">
            Volver al inicio
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  )
}

export default Perfil
