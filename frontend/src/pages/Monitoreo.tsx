import { useEffect, useState } from 'react'

/** Datos simulados del estado del paso fronterizo (RF10, fuera del MVP). */
const OCUPACION = 72 // % de ocupación simulado
const TIEMPO_ESPERA = '2 h 40 min'

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
 * Los datos son simulados; en producción provendrían de
 * /api/admin/monitoreo (fuera del alcance del MVP).
 */
function Monitoreo() {
  const [alerta, setAlerta] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setCargando(false), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-[22px] text-gov-black">Monitoreo del paso</h1>
      <p className="mb-5 text-sm text-gov-gray-b">
        RF10 — Estado operativo del paso fronterizo (datos simulados)
      </p>

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gov-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {alerta && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-gov-secondary bg-estado-rechazado-bg px-5 py-4 text-estado-rechazado-text"
        >
          <div className="text-[15px] font-bold">
            🚨 Protocolo de Contingencia activado
          </div>
          <p className="mt-1 text-[14px]">
            Saturación crítica del paso. Se recomienda redistribuir el flujo y
            habilitar casetas adicionales.
          </p>
          <button
            onClick={() => setAlerta(false)}
            className="mt-2 cursor-pointer rounded-md border border-gov-secondary px-3 py-1.5 text-[13px] font-semibold"
          >
            Desactivar alerta
          </button>
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
              {OCUPACION}%
            </span>
            <span className="text-[13px] text-gov-gray-b">capacidad utilizada</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gov-neutral">
            <div
              className={`h-full rounded-full ${colorOcupacion(OCUPACION)}`}
              style={{ width: `${OCUPACION}%` }}
            />
          </div>
        </div>

        {/* Tiempo de espera */}
        <div className="rounded-lg border border-gov-neutral bg-white p-5">
          <div className="mb-3 text-sm font-bold text-gov-black">
            Tiempo estimado de espera
          </div>
          <div className="text-[28px] font-extrabold text-gov-black">
            {TIEMPO_ESPERA}
          </div>
          <p className="mt-1 text-[13px] text-gov-gray-b">
            Promedio de las últimas filas procesadas
          </p>
        </div>

        {/* Estado de APIs externas */}
        <div className="rounded-lg border border-gov-neutral bg-white p-5">
          <div className="mb-3 text-sm font-bold text-gov-black">
            Integraciones externas
          </div>
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

        {/* Alertas */}
        <div className="rounded-lg border border-gov-neutral bg-white p-5">
          <div className="mb-3 text-sm font-bold text-gov-black">Alertas</div>
          <p className="mb-3 text-[14px] text-gov-gray-a">
            Simula una alerta de saturación para activar el protocolo de
            contingencia (RF10).
          </p>
          <button
            onClick={() => setAlerta(true)}
            className="w-full cursor-pointer rounded-md bg-gov-secondary px-3 py-2.5 text-[15px] font-bold text-white hover:opacity-90"
          >
            Simular alerta de saturación
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default Monitoreo
