import api from './api'
import type { Rol } from '../context/AuthContext'

/** Registro de auditoría completo del sistema (RF09), visible solo para ADMIN. */
export interface AuditoriaAdminItem {
  fecha: string
  funcionarioNombre: string | null
  funcionarioIdentificadorEnmascarado: string | null
  funcionarioRol: Rol | null
  codigoQr: string | null
  identificadorEnmascarado: string | null
  accion: string
  modulo: string
  observaciones: string | null
}

/** GET /api/admin/auditoria — auditoría completa del sistema (RF09). */
export async function obtenerAuditoriaCompleta(): Promise<AuditoriaAdminItem[]> {
  const { data } = await api.get<AuditoriaAdminItem[]>('/admin/auditoria')
  return data
}

/** Descarga un blob del backend como archivo, con el nombre indicado. */
function descargar(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(url)
}

/** GET /api/admin/reportes/pdf — descarga el reporte de trámites y fiscalizaciones en PDF (RF06). */
export async function descargarReportePdf(): Promise<void> {
  const { data } = await api.get('/admin/reportes/pdf', { responseType: 'blob' })
  descargar(data, 'sffe-reporte.pdf')
}

/** GET /api/admin/reportes/excel — descarga el reporte de trámites y fiscalizaciones en Excel (RF06). */
export async function descargarReporteExcel(): Promise<void> {
  const { data } = await api.get('/admin/reportes/excel', { responseType: 'blob' })
  descargar(data, 'sffe-reporte.xlsx')
}

/** Estado operativo del paso fronterizo, calculado a partir de datos reales (RF10). */
export interface MonitoreoEstado {
  pendientesEnCola: number
  ocupacionPorcentaje: number
  tiempoEsperaPromedioMinutos: number
  alertaActiva: boolean
}

/** GET /api/monitoreo — estado operativo actual del paso fronterizo (RF10). */
export async function obtenerMonitoreo(): Promise<MonitoreoEstado> {
  const { data } = await api.get<MonitoreoEstado>('/monitoreo')
  return data
}
