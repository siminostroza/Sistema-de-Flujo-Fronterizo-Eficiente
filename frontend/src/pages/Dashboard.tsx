import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import {
  misViajes,
  numeroExpediente,
  setIdViajeActivo,
  type Viaje,
} from '../services/viajeService'
import { estadoBadge } from '../utils/estado'
import { formatearFecha } from '../utils/fecha'
import { reenviarVerificacion, mensajeDeError } from '../services/authService'

const STORAGE_ID_VIAJE = 'sffe_id_viaje_activo'

/**
 * Historial de viajes del pasajero (CAMBIO 6.1). Lista todos los expedientes
 * (relación 1:N), cada uno con su estado y acceso al QR; permite iniciar un
 * nuevo viaje a través del wizard.
 */
function Dashboard() {
  const { sesion, logout } = useAuth()
  const navigate = useNavigate()
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [reenviando, setReenviando] = useState(false)
  const [avisoVerificacion, setAvisoVerificacion] = useState('')

  const onReenviarVerificacion = async () => {
    setReenviando(true)
    setAvisoVerificacion('')
    try {
      const datos = await reenviarVerificacion()
      setAvisoVerificacion(datos.mensaje)
    } catch (err) {
      setAvisoVerificacion(mensajeDeError(err))
    } finally {
      setReenviando(false)
    }
  }

  const cargar = () => {
    setCargando(true)
    setError('')
    misViajes()
      .then((datos) => setViajes([...datos].sort((a, b) => b.idViaje - a.idViaje)))
      .catch((err) => {
        setViajes([])
        setError('No se pudieron cargar tus viajes. Intenta nuevamente.')
        console.error(err)
      })
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  const nuevoViaje = () => {
    // El wizard arranca limpio: sin expediente activo en localStorage.
    localStorage.removeItem(STORAGE_ID_VIAJE)
    navigate('/registro-viaje')
  }

  const continuar = (viaje: Viaje) => {
    setIdViajeActivo(viaje.idViaje)
    navigate('/registro-viaje')
  }

  const verQr = (viaje: Viaje) => {
    setIdViajeActivo(viaje.idViaje)
    navigate(`/estado-tramite?id=${viaje.idViaje}`)
  }

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />

      <main className="mx-auto max-w-[520px] px-4 py-6 pb-16">
        <div className="flex items-start justify-between">
          <h1 className="mb-1 text-[22px] text-gov-black">Hola, {sesion?.nombre}</h1>
          <Link to="/perfil" className="mt-1 text-sm text-gov-primary">
            Mi perfil
          </Link>
        </div>
        <p className="mt-0 text-sm text-gov-gray-b">Tus viajes registrados</p>

        {sesion && !sesion.correoVerificado && (
          <div className="mb-4 mt-3 rounded-lg border border-estado-pendiente-text bg-estado-pendiente-bg px-4 py-3 text-[13px] text-estado-pendiente-text">
            <p className="mb-2">
              Aún no confirmas tu correo ({sesion.correo}). Sin verificarlo, igual podrás recibir los
              avisos de aprobación/rechazo, pero te recomendamos confirmarlo.
            </p>
            {avisoVerificacion ? (
              <p className="font-semibold">{avisoVerificacion}</p>
            ) : (
              <button
                onClick={onReenviarVerificacion}
                disabled={reenviando}
                className="cursor-pointer rounded-md border border-estado-pendiente-text px-3 py-1.5 text-[13px] font-semibold disabled:cursor-default disabled:opacity-60"
              >
                {reenviando ? 'Enviando…' : 'Reenviar correo de verificación'}
              </button>
            )}
          </div>
        )}

        {!cargando && viajes.length > 0 && (
          <button
            onClick={nuevoViaje}
            className="my-4 w-full cursor-pointer rounded-md bg-gov-primary px-4 py-3 text-[15px] font-bold text-white hover:bg-gov-primary-dark"
          >
            + Nuevo Viaje
          </button>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-gov-secondary bg-estado-rechazado-bg px-4 py-3 text-sm text-estado-rechazado-text"
          >
            {error}
            <button
              onClick={cargar}
              className="ml-2 font-semibold underline"
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {cargando ? (
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gov-primary border-t-transparent" />
          </div>
        ) : viajes.length === 0 ? (
          <div className="mt-6 rounded-lg border border-gov-neutral bg-white p-6 text-center">
            <div className="mb-2 text-3xl">🧳</div>
            <p className="mb-4 text-sm text-gov-gray-a">
              Aún no tienes viajes registrados.
            </p>
            <button
              onClick={nuevoViaje}
              className="w-full cursor-pointer rounded-md bg-gov-primary px-4 py-3 text-[15px] font-bold text-white hover:bg-gov-primary-dark"
            >
              Crear mi primer viaje
            </button>
          </div>
        ) : (
          <ul className="list-none">
            {viajes.map((viaje) => {
              const badge = estadoBadge(viaje.estado)
              return (
                <li
                  key={viaje.idViaje}
                  className="mb-3 rounded-lg border border-gov-neutral bg-white p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-gov-black">
                      {numeroExpediente(viaje.idViaje)}
                    </span>
                    <span
                      className={`rounded-md px-2 py-1 text-[12px] font-semibold ${badge.clases}`}
                    >
                      {badge.texto}
                    </span>
                  </div>
                  <div className="text-[13px] text-gov-gray-a">
                    <div>
                      <span className="font-semibold">Destino:</span> {viaje.destino}
                    </div>
                    <div>
                      <span className="font-semibold">Paso:</span>{' '}
                      {viaje.pasoFronterizo || '—'}
                    </div>
                    <div>
                      <span className="font-semibold">Fecha:</span> {formatearFecha(viaje.fechaIngreso)}
                    </div>
                  </div>

                  {viaje.estado === 'RECHAZADO' && viaje.motivoRechazo && (
                    <div className="mt-2 rounded-md bg-estado-rechazado-bg px-2.5 py-2 text-[12px] text-estado-rechazado-text">
                      <span className="font-semibold">Motivo: </span>
                      {viaje.motivoRechazo}
                    </div>
                  )}

                  {viaje.qr ? (
                    <button
                      onClick={() => verQr(viaje)}
                      className="mt-3 w-full cursor-pointer rounded-md bg-gov-primary px-3 py-2 text-[13px] font-bold text-white hover:bg-gov-primary-dark"
                    >
                      Ver QR
                    </button>
                  ) : (
                    <button
                      onClick={() => continuar(viaje)}
                      className="mt-3 w-full cursor-pointer rounded-md border border-gov-primary px-3 py-2 text-[13px] font-bold text-gov-primary"
                    >
                      Continuar trámite
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <button
          onClick={logout}
          className="mt-4 w-full cursor-pointer rounded-md bg-gov-secondary px-4 py-2.5 text-white"
        >
          Cerrar sesión
        </button>
      </main>
      <Footer />
    </div>
  )
}

export default Dashboard
