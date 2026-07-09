import api from './api'
import type { EstadoViaje, MascotaInfo, MenorInfo, SagInfo, VehiculoInfo } from './viajeService'
import type { TipoDocumento } from '../utils/documento'

export type EstadoQr = 'ACTIVO' | 'USADO' | 'EXPIRADO'

export interface QrResponse {
  codigo: string
  imagenBase64: string
  estado: EstadoQr
  fechaGeneracion: string
}

/** Expediente consolidado de un viajero para fiscalización (RF05), con el identificador enmascarado (RNF10). */
export interface ExpedienteResponse {
  identificadorEnmascarado: string
  tipoDocumento: TipoDocumento
  nombrePasajero: string
  destino: string
  pasoFronterizo: string
  motivoViaje: string
  estadoViaje: EstadoViaje
  estadoQr: EstadoQr
  /** true si el pasajero adjuntó su carnet al registrarse; las cuentas semilla no lo tienen. */
  carnetIdentidad: boolean
  /** true si el pasajero adjuntó sus papeles de antecedentes al registrarse. */
  papelesAntecedentes: boolean
  vehiculos: VehiculoInfo[]
  mascotas: MascotaInfo[]
  declaracionSag: SagInfo | null
  menores: MenorInfo[]
}

/** GET /api/qr/{idViaje} — genera (o recupera) el código QR del expediente propio (RF04). */
export async function obtenerQR(idViaje: number): Promise<QrResponse> {
  const { data } = await api.get<QrResponse>(`/qr/${idViaje}`)
  return data
}

/** GET /api/qr/validar/{codigo} — valida un código QR escaneado por un funcionario (RF05). */
export async function validarQR(codigo: string): Promise<ExpedienteResponse> {
  const { data } = await api.get<ExpedienteResponse>(`/qr/validar/${codigo}`)
  return data
}
