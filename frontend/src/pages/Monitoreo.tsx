import { useEffect, useState } from 'react'
import { obtenerMonitoreo, type MonitoreoEstado } from '../services/adminService'
import { mensajeDeError } from '../services/authService'

const INTERVALO_REFRESCO_MS = 30_000

/** Color de la barra de ocupación según el nivel (verde/naranja/rojo). */
function colorOcupacion(pct: number): string {
  if (pct >= 85) {
    return 'bg-gov-secondary'
  }
  if (pct >= 60) {
    return 'bg-[#E08A00]'
  }
  return 'bg-gov-green'
}

/**
 * Monitoreo del paso fronterizo (RF10) — visible solo para Aduana y Admin.
 * Ocupación y tiempo de espera se calculan a partir de datos reales del
 * sistema (códigos QR en cola y resoluciones recientes); las integraciones
 * con PDI/SAG/Aduana Argentina siguen simuladas (fuera del alcance del
 * prototipo, no hay con qué integrarse de verdad). Se refresca solo cada
 * 30s.
 */
function Monitoreo() {
  const [estado, setEstado] = useState<MonitoreoEstado | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = () => {
    obtenerMonitoreo()
      .then((datos) => {
        setEstado(datos)
        setError('')
      })
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, INTERVALO_REFRESCO_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-[22px] text-gov-black">Monitoreo del paso</h1>
      <p className="mb-5 text-sm text-gov-gray-b">
        RF10 — Estado operativo del paso fronterizo, calculado a partir de datos reales
      </p>

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gov-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-gov-secondary bg-estado-rechazado-bg px-5 py-4 text-estado-rechazado-text"
        >
          {error}
          <button onClick={cargar} className="ml-2 font-semibold underline">
            Intentar nuevamente
          </button>
        </div>
      ) : (
        estado && (
          <>
            {estado.alertaActiva && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-gov-secondary bg-estado-rechazado-bg px-5 py-4 text-estado-rechazado-text"
              >
                <div className="text-[15px] font-bold">
                  🚨 Protocolo de Contingencia — saturación crítica
                </div>
                <p className="mt-1 text-[14px]">
                  El paso superó el {estado.ocupacionPorcentaje}% de ocupación. Se recomienda
                  redistribuir el flujo y habilitar casetas adicionales.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Ocupación */}
              <div className="rounded-lg border border-gov-neutral bg-white p-5">
                <div className="mb-3 text-sm font-bold text-gov-black">
                  Nivel de ocupación
                </div>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-[28px] font-extrabold text-gov-black">
                    {estado.ocupacionPorcentaje}%
                  </span>
                  <span className="text-[13px] text-gov-gray-b">
                    {estado.pendientesEnCola} pasajero(s) en cola
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gov-neutral">
                  <div
                    className={`h-full rounded-full ${colorOcupacion(estado.ocupacionPorcentaje)}`}
                    style={{ width: `${estado.ocupacionPorcentaje}%` }}
                  />
                </div>
              </div>

              {/* Tiempo de espera */}
              <div className="rounded-lg border border-gov-neutral bg-white p-5">
                <div className="mb-3 text-sm font-bold text-gov-black">
                  Tiempo estimado de espera
                </div>
                <div className="text-[28px] font-extrabold text-gov-black">
                  {estado.tiempoEsperaPromedioMinutos} min
                </div>
                <p className="mt-1 text-[13px] text-gov-gray-b">
                  Promedio entre generación del QR y resolución de las últimas fiscalizaciones
                </p>
              </div>

              {/* Estado de APIs externas */}
              <div className="rounded-lg border border-gov-neutral bg-white p-5 lg:col-span-2">
                <div className="mb-3 text-sm font-bold text-gov-black">
                  Integraciones externas
                </div>
                <p className="mb-3 text-[13px] text-gov-gray-b">
                  Simuladas: el prototipo no se conecta a sistemas reales de PDI, SAG ni Aduana
                  Argentina.
                </p>
                <ul className="flex flex-col gap-2">
                  {['PDI', 'SAG', 'Aduana Argentina'].map((api) => (
                    <li
                      key={api}
                      className="flex items-center justify-between rounded-md bg-gov-neutral px-3 py-2 text-[14px]"
                    >
                      <span className="text-gov-black">{api}</span>
                      <span className="rounded-md bg-estado-aprobado-bg px-2.5 py-1 text-[12px] font-semibold text-estado-aprobado-text">
                        Operativa (simulada)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}

export default Monitoreo
