import { useEffect, useState } from 'react'
import {
  descargarReporteExcel,
  descargarReportePdf,
  obtenerAuditoriaCompleta,
  type AuditoriaAdminItem,
} from '../services/adminService'
import { mensajeDeError } from '../services/authService'
import { formatearFechaHora } from '../utils/fecha'

/** Etiqueta y color del badge según la acción registrada en la auditoría (RF05, RF09). */
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

const formatoFechaHora = formatearFechaHora

/**
 * Administración del sistema (RF06, RF09) — visible solo para ADMIN.
 * Reportes en PDF/Excel y auditoría completa contra datos reales; gestión
 * de usuarios sigue siendo un placeholder (no formaba parte del alcance).
 */
function Admin() {
  const [toast, setToast] = useState('')
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [generandoExcel, setGenerandoExcel] = useState(false)

  const [auditoria, setAuditoria] = useState<AuditoriaAdminItem[]>([])
  const [cargandoAuditoria, setCargandoAuditoria] = useState(true)
  const [errorAuditoria, setErrorAuditoria] = useState('')

  const cargarAuditoria = () => {
    setCargandoAuditoria(true)
    setErrorAuditoria('')
    obtenerAuditoriaCompleta()
      .then(setAuditoria)
      .catch((err) => setErrorAuditoria(mensajeDeError(err)))
      .finally(() => setCargandoAuditoria(false))
  }

  useEffect(cargarAuditoria, [])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(id)
  }, [toast])

  const onExportarPdf = async () => {
    setGenerandoPdf(true)
    try {
      await descargarReportePdf()
    } catch (err) {
      setToast(mensajeDeError(err))
    } finally {
      setGenerandoPdf(false)
    }
  }

  const onExportarExcel = async () => {
    setGenerandoExcel(true)
    try {
      await descargarReporteExcel()
    } catch (err) {
      setToast(mensajeDeError(err))
    } finally {
      setGenerandoExcel(false)
    }
  }

  const gestionUsuariosEnDesarrollo = () => setToast('Funcionalidad en desarrollo')

  return (
    <div>
      <h1 className="mb-1 text-[22px] text-gov-black">Administración</h1>
      <p className="mb-5 text-sm text-gov-gray-b">
        RF06 / RF09 — Reportes y auditoría del sistema
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Reportes */}
        <div className="rounded-lg border border-gov-neutral bg-white p-5">
          <div className="mb-3 text-sm font-bold text-gov-black">
            Reportes (RF06)
          </div>
          <p className="mb-4 text-[14px] text-gov-gray-a">
            Exporta el resumen de trámites y fiscalizaciones del paso.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onExportarPdf}
              disabled={generandoPdf}
              className="flex-1 cursor-pointer rounded-md bg-gov-primary px-3 py-2.5 text-[14px] font-bold text-white hover:bg-gov-primary-dark disabled:cursor-default disabled:opacity-60"
            >
              {generandoPdf ? 'Generando…' : 'Exportar PDF'}
            </button>
            <button
              onClick={onExportarExcel}
              disabled={generandoExcel}
              className="flex-1 cursor-pointer rounded-md bg-gov-green px-3 py-2.5 text-[14px] font-bold text-white hover:opacity-90 disabled:cursor-default disabled:opacity-60"
            >
              {generandoExcel ? 'Generando…' : 'Exportar Excel'}
            </button>
          </div>
        </div>

        {/* Gestión de usuarios */}
        <div className="rounded-lg border border-gov-neutral bg-white p-5">
          <div className="mb-3 text-sm font-bold text-gov-black">
            Gestión de usuarios
          </div>
          <p className="mb-4 text-[14px] text-gov-gray-a">
            Alta, baja y asignación de roles de funcionarios.
          </p>
          <button
            onClick={gestionUsuariosEnDesarrollo}
            className="w-full cursor-pointer rounded-md bg-gov-primary-light px-3 py-3 text-center text-[13px] font-semibold text-gov-tertiary"
          >
            Próximamente
          </button>
        </div>
      </div>

      {/* Auditoría completa */}
      <div className="mt-5 rounded-lg border border-gov-neutral bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-gov-black">Auditoría del sistema (RF09)</div>
          <button
            onClick={cargarAuditoria}
            disabled={cargandoAuditoria}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-semibold text-white ${
              cargandoAuditoria
                ? 'cursor-default bg-gov-accent'
                : 'cursor-pointer bg-gov-primary hover:bg-gov-primary-dark'
            }`}
          >
            {cargandoAuditoria ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        {errorAuditoria && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-estado-rechazado-bg px-4 py-3 text-[14px] text-estado-rechazado-text"
          >
            {errorAuditoria}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gov-neutral">
          <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-gov-neutral bg-gov-neutral text-[11px] uppercase tracking-wide text-gov-gray-a">
                <th className="px-3 py-2.5 font-semibold">Fecha</th>
                <th className="px-3 py-2.5 font-semibold">Funcionario</th>
                <th className="px-3 py-2.5 font-semibold">Rol</th>
                <th className="px-3 py-2.5 font-semibold">Pasajero</th>
                <th className="px-3 py-2.5 font-semibold">Acción</th>
                <th className="px-3 py-2.5 font-semibold">Módulo</th>
                <th className="px-3 py-2.5 font-semibold">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {auditoria.length === 0 && !cargandoAuditoria ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gov-gray-b">
                    Aún no hay registros de auditoría.
                  </td>
                </tr>
              ) : (
                auditoria.map((item, idx) => {
                  const badge = accionBadge(item.accion)
                  return (
                    <tr key={`${item.fecha}-${idx}`} className="border-b border-gov-neutral last:border-b-0">
                      <td className="px-3 py-2 text-gov-black">{formatoFechaHora(item.fecha)}</td>
                      <td className="px-3 py-2 text-gov-black">
                        {item.funcionarioNombre ?? '—'}
                        {item.funcionarioIdentificadorEnmascarado
                          ? ` (${item.funcionarioIdentificadorEnmascarado})`
                          : ''}
                      </td>
                      <td className="px-3 py-2 text-gov-gray-a">{item.funcionarioRol ?? '—'}</td>
                      <td className="px-3 py-2 text-gov-gray-a">{item.identificadorEnmascarado ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${badge.clases}`}>
                          {badge.texto}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gov-gray-a">{item.modulo}</td>
                      <td className="px-3 py-2 text-gov-gray-a">{item.observaciones ?? '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-20 rounded-md bg-gov-tertiary px-4 py-3 text-[14px] font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

export default Admin
