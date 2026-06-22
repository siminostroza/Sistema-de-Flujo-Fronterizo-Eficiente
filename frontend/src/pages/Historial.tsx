import { useEffect, useState } from 'react'
import { obtenerHistorial, type HistorialItem } from '../services/fiscalizacionService'
import { mensajeDeError } from '../services/authService'

/** Etiqueta y color del badge según la acción registrada en la auditoría (RF05). */
function accionBadge(accion: string): { texto: string; clases: string } {
  switch (accion) {
    case 'APROBADO':
      return { texto: 'Autorizado', clases: 'bg-estado-aprobado-bg text-estado-aprobado-text' }
    case 'RECHAZADO':
      return { texto: 'Denegado', clases: 'bg-estado-rechazado-bg text-estado-rechazado-text' }
    case 'SOSPECHA':
      return { texto: 'Sospecha', clases: 'bg-estado-pendiente-bg text-estado-pendiente-text' }
    case 'VALIDACION_IDENTIDAD':
      return { texto: 'Identidad validada', clases: 'bg-gov-primary-light text-gov-primary-dark' }
    case 'VALIDACION_SAG':
      return { texto: 'SAG validada', clases: 'bg-gov-primary-light text-gov-primary-dark' }
    default:
      return { texto: accion, clases: 'bg-gov-neutral text-gov-gray-a' }
  }
}

/** Hora local HH:MM:SS de la marca de tiempo de la auditoría. */
function formatoHora(fecha: string): string {
  const d = new Date(fecha)
  return Number.isNaN(d.getTime()) ? fecha : d.toLocaleTimeString('es-CL')
}

/** Primeros 8 caracteres del código QR, abreviados. */
function codigoCorto(codigo: string | null): string {
  if (!codigo) {
    return '—'
  }
  return codigo.length > 8 ? `${codigo.slice(0, 8)}…` : codigo
}

/**
 * Historial del turno actual del funcionario (RF05): tabla con las
 * resoluciones del día, con el identificador del pasajero enmascarado (RNF10).
 */
function Historial() {
  const [items, setItems] = useState<HistorialItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = () => {
    setCargando(true)
    setError('')
    obtenerHistorial()
      .then(setItems)
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-[22px] text-gov-black">Historial del turno</h1>
          <p className="text-sm text-gov-gray-b">
            RF05 — Resoluciones registradas durante el día actual
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-[14px] font-semibold text-white ${
            cargando
              ? 'cursor-default bg-gov-accent'
              : 'cursor-pointer bg-gov-primary hover:bg-gov-primary-dark'
          }`}
        >
          {cargando && <span className="inline-block animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />}
          {cargando ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-estado-rechazado-bg px-4 py-3 text-[14px] text-estado-rechazado-text"
        >
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gov-neutral bg-white">
        <table className="w-full border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-gov-neutral bg-gov-neutral text-[12px] uppercase tracking-wide text-gov-gray-a">
              <th className="px-4 py-2.5 font-semibold">Hora</th>
              <th className="px-4 py-2.5 font-semibold">Código QR</th>
              <th className="px-4 py-2.5 font-semibold">Identificador</th>
              <th className="px-4 py-2.5 font-semibold">Acción</th>
              <th className="px-4 py-2.5 font-semibold">Módulo</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !cargando ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gov-gray-b">
                  Aún no hay resoluciones registradas en este turno.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const badge = accionBadge(item.accion)
                return (
                  <tr
                    key={`${item.fecha}-${idx}`}
                    className="border-b border-gov-neutral last:border-b-0"
                  >
                    <td className="px-4 py-2.5 text-gov-black">{formatoHora(item.fecha)}</td>
                    <td className="px-4 py-2.5 font-mono text-gov-gray-a">
                      {codigoCorto(item.codigoQr)}
                    </td>
                    <td className="px-4 py-2.5 text-gov-black">
                      {item.identificadorEnmascarado ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-md px-2.5 py-1 text-[12px] font-semibold ${badge.clases}`}
                      >
                        {badge.texto}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gov-gray-a">{item.modulo}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Historial
