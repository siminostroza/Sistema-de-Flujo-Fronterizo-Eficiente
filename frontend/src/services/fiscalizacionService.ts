import api from './api'
import type { EstadoViaje } from './viajeService'
import type { EstadoQr } from './qrService'

/** Decisiones que un funcionario puede registrar al fiscalizar (RF05). */
export type DecisionFiscalizacion =
  | 'APROBADO'
  | 'RECHAZADO'
  | 'SOSPECHA'
  | 'VALIDACION_IDENTIDAD'
  | 'VALIDACION_SAG'

export interface FiscalizacionRequest {
  decision: DecisionFiscalizacion
  observaciones?: string | null
}

export interface FiscalizacionResponse {
  mensaje: string
  estadoViaje: EstadoViaje
  estadoQr: EstadoQr
}

/** Registro del historial del turno del funcionario (RF05), con el pasajero enmascarado (RNF10). */
export interface HistorialItem {
  fecha: string
  codigoQr: string | null
  identificadorEnmascarado: string | null
  accion: string
  modulo: string
  observaciones: string | null
}

/** PUT /api/fiscalizacion/{codigo}/resolver — registra la resolución del funcionario (RF05). */
export async function resolverFiscalizacion(
  codigo: string,
  decision: DecisionFiscalizacion,
  observaciones?: string | null,
): Promise<FiscalizacionResponse> {
  const payload: FiscalizacionRequest = { decision, observaciones }
  const { data } = await api.put<FiscalizacionResponse>(
    `/fiscalizacion/${codigo}/resolver`,
    payload,
  )
  return data
}

/** GET /api/fiscalizacion/historial — registros del turno actual del funcionario (RF05). */
export async function obtenerHistorial(): Promise<HistorialItem[]> {
  const { data } = await api.get<HistorialItem[]>('/fiscalizacion/historial')
  return data
}

/** Registro de auditoría de un expediente específico (RF05): quién hizo qué, sin importar el rol. */
export interface AuditoriaExpedienteItem {
  fecha: string
  accion: string
  funcionarioNombre: string
  funcionarioRol: string | null
  observaciones: string | null
}

/** GET /api/fiscalizacion/{codigo}/auditoria — historial completo de un expediente, visible entre roles (RF05). */
export async function obtenerAuditoriaExpediente(codigo: string): Promise<AuditoriaExpedienteItem[]> {
  const { data } = await api.get<AuditoriaExpedienteItem[]>(`/fiscalizacion/${codigo}/auditoria`)
  return data
}
