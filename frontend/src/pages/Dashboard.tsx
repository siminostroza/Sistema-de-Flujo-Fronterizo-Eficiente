import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Banner from '../components/layout/Banner'
import { useAuth } from '../context/AuthContext'
import { getIdViajeActivo, misViajes, setIdViajeActivo, type Viaje } from '../services/viajeService'
import { estadoBadge } from '../utils/estado'

const cardClass = 'mb-4 rounded-lg border border-gov-neutral bg-white p-5'
const cardTitleClass = 'mb-3 text-sm font-bold text-gov-black'

const moduloCardClass =
  'rounded-lg border-2 border-gov-neutral bg-white p-4 text-center transition hover:border-gov-primary hover:shadow-md'
const moduloCardDeshabilitadoClass =
  'cursor-not-allowed rounded-lg border-2 border-gov-neutral bg-gov-neutral p-4 text-center opacity-60'

/** Ítem del checklist de progreso del expediente (RF02–RF04). */
function ItemProgreso({ completo, label }: { completo: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5 border-b border-gov-neutral py-2.5 text-[13px] font-medium text-gov-gray-a last:border-b-0">
      <span className={completo ? 'text-gov-green' : 'text-gov-accent'}>
        {completo ? '✅' : '⏳'}
      </span>
      {label}
    </li>
  )
}

/**
 * Dashboard del pasajero (RF02–RF04): checklist de progreso del expediente
 * activo, estado del trámite y acceso rápido a los módulos de registro.
 */
function Dashboard() {
  const { sesion, logout } = useAuth()
  const [viajeActivo, setViajeActivo] = useState<Viaje | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    misViajes()
      .then((viajes) => {
        if (viajes.length === 0) {
          return
        }
        const idActivo = getIdViajeActivo()
        const encontrado = viajes.find((v) => v.idViaje === idActivo)
        const masReciente = viajes.reduce((a, b) => (b.idViaje > a.idViaje ? b : a))
        const elegido = encontrado ?? masReciente
        setIdViajeActivo(elegido.idViaje)
        setViajeActivo(elegido)
      })
      .catch(() => {
        // Sin expedientes disponibles: se muestra el dashboard vacío.
      })
      .finally(() => setCargando(false))
  }, [])

  const badge = estadoBadge(viajeActivo?.estado ?? 'PENDIENTE')

  return (
    <div className="min-h-screen bg-gov-neutral">
      <TopBar />
      <Banner />

      <main className="mx-auto max-w-[520px] px-4 py-6">
        <h1 className="mb-1 text-[22px] text-gov-black">Hola, {sesion?.nombre}</h1>
        <p className="mt-0 text-sm text-gov-gray-b">
          Completa los pasos para obtener tu código QR de cruce fronterizo
        </p>

        {!cargando && (
          <>
            <div className={cardClass}>
              <div className={cardTitleClass}>Estado del Trámite</div>
              <div
                className={`rounded-md px-3 py-2.5 text-center text-[13px] font-semibold ${badge.clases}`}
              >
                {badge.texto}
                {viajeActivo ? ` — Expediente N° ${viajeActivo.idViaje}` : ' — completa los módulos'}
              </div>
            </div>

            <div className={cardClass}>
              <div className={cardTitleClass}>Progreso</div>
              <ul className="list-none">
                <ItemProgreso completo={!!viajeActivo} label="Registro de viaje" />
                <ItemProgreso
                  completo={!!viajeActivo?.vehiculo}
                  label="Registro de vehículo (opcional)"
                />
                <ItemProgreso completo={!!viajeActivo?.sag} label="Declaración SAG" />
                <ItemProgreso completo={false} label="Código QR (disponible próximamente)" />
              </ul>
            </div>

            <div className={cardClass}>
              <div className={cardTitleClass}>Módulos</div>
              <div className="grid grid-cols-2 gap-2.5">
                <Link to="/registro-viaje" className={moduloCardClass}>
                  <div className="mb-1 text-xl">🧾</div>
                  <div className="text-xs font-semibold text-gov-gray-a">
                    Registro de Viaje
                  </div>
                </Link>
                <Link to="/registro-vehiculo" className={moduloCardClass}>
                  <div className="mb-1 text-xl">🚗</div>
                  <div className="text-xs font-semibold text-gov-gray-a">
                    Registro de Vehículo
                  </div>
                </Link>
                <Link to="/declaracion-sag" className={moduloCardClass}>
                  <div className="mb-1 text-xl">🌿</div>
                  <div className="text-xs font-semibold text-gov-gray-a">
                    Declaración SAG
                  </div>
                </Link>
                <div className={moduloCardDeshabilitadoClass}>
                  <div className="mb-1 text-xl">🔳</div>
                  <div className="text-xs font-semibold text-gov-gray-b">
                    Mi Código QR
                    <br />
                    (próximamente)
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <button
          onClick={logout}
          className="w-full cursor-pointer rounded-md bg-gov-secondary px-4 py-2.5 text-white"
        >
          Cerrar sesión
        </button>
      </main>
    </div>
  )
}

export default Dashboard
