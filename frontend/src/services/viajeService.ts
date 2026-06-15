import api from './api'

export type EstadoViaje = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
export type EstadoDeclaracion = 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO'

export interface ViajePayload {
  fechaIngreso: string
  destino: string
  pasoFronterizo: string
  paisOrigen?: string | null
  motivoViaje: string
}

export interface MenorPayload {
  nombre: string
  rut: string
  fechaNacimiento: string
  requiereAutorizacion: boolean
}

export interface MenorInfo extends MenorPayload {
  idMenor: number
}

export type EstadoQr = 'ACTIVO' | 'USADO' | 'EXPIRADO'

export interface VehiculoPayload {
  patente: string
  marca?: string | null
  modelo?: string | null
  anio?: number | null
  /** true si es carro de arrastre o remolque (CAMBIO 6.1). */
  esRemolque?: boolean
}

export interface VehiculoInfo extends VehiculoPayload {
  idVehiculo: number
  esRemolque: boolean
}

export interface SagPayload {
  // Sección SAG
  declaraProductos: boolean
  productos: string
  // Sección Aduanas
  declaraDivisas: boolean
  montoDivisas?: number | null
  monedaDivisas?: string | null
  declaraMercancias: boolean
  detalleMercancias?: string | null
}

export interface SagInfo extends SagPayload {
  idDeclaracion: number
  estado: EstadoDeclaracion
  firmaDigital: string | null
  fecha: string
}

/** Código QR anidado en el expediente (RF04). */
export interface QrInfo {
  codigo: string
  estado: EstadoQr
  fechaGeneracion: string
}

export interface Viaje extends ViajePayload {
  idViaje: number
  estado: EstadoViaje
  createdAt: string
  /** Lista de vehículos del viaje: principal y, opcionalmente, remolque (1:N). */
  vehiculos: VehiculoInfo[]
  sag: SagInfo | null
  menores: MenorInfo[]
  qr: QrInfo | null
}

/** Vehículo principal del viaje (no remolque), o null si no hay. */
export function vehiculoPrincipal(viaje: Viaje): VehiculoInfo | null {
  return viaje.vehiculos.find((v) => !v.esRemolque) ?? null
}

/** Remolque / carro de arrastre del viaje, o null si no hay. */
export function vehiculoRemolque(viaje: Viaje): VehiculoInfo | null {
  return viaje.vehiculos.find((v) => v.esRemolque) ?? null
}

/** Formatea el número de expediente como EXP-00042 (CAMBIO 6.1). */
export function numeroExpediente(idViaje: number): string {
  return `EXP-${String(idViaje).padStart(5, '0')}`
}

/** POST /api/viajes — crea un nuevo expediente de viaje (RF02). */
export async function crearViaje(payload: ViajePayload): Promise<Viaje> {
  const { data } = await api.post<Viaje>('/viajes', payload)
  return data
}

/** PUT /api/viajes/{id} — actualiza el itinerario de un expediente propio (RF02). */
export async function actualizarViaje(
  idViaje: number,
  payload: ViajePayload,
): Promise<Viaje> {
  const { data } = await api.put<Viaje>(`/viajes/${idViaje}`, payload)
  return data
}

/** GET /api/viajes/mis-viajes — expedientes del usuario autenticado (RF04). */
export async function misViajes(): Promise<Viaje[]> {
  const { data } = await api.get<Viaje[]>('/viajes/mis-viajes')
  return data
}

/** GET /api/viajes/{id} — detalle de un expediente propio (RF04). */
export async function obtenerViaje(idViaje: number): Promise<Viaje> {
  const { data } = await api.get<Viaje>(`/viajes/${idViaje}`)
  return data
}

/** POST /api/viajes/{id}/menores — agrega un menor de edad al expediente (RF02). */
export async function agregarMenor(
  idViaje: number,
  payload: MenorPayload,
): Promise<Viaje> {
  const { data } = await api.post<Viaje>(`/viajes/${idViaje}/menores`, payload)
  return data
}

/** POST /api/viajes/{id}/vehiculo — registra o actualiza el vehículo del expediente (RF03). */
export async function registrarVehiculo(
  idViaje: number,
  payload: VehiculoPayload,
): Promise<Viaje> {
  const { data } = await api.post<Viaje>(`/viajes/${idViaje}/vehiculo`, payload)
  return data
}

/** POST /api/viajes/{id}/sag — guarda o actualiza la Declaración Jurada SAG (RF02). */
export async function guardarSag(idViaje: number, payload: SagPayload): Promise<Viaje> {
  const { data } = await api.post<Viaje>(`/viajes/${idViaje}/sag`, payload)
  return data
}

const STORAGE_ID_VIAJE = 'sffe_id_viaje_activo'

/** Recupera el id del expediente de viaje en curso (flujo de registro de varios pasos). */
export function getIdViajeActivo(): number | null {
  const valor = localStorage.getItem(STORAGE_ID_VIAJE)
  return valor ? Number(valor) : null
}

/** Guarda el id del expediente de viaje en curso. */
export function setIdViajeActivo(idViaje: number): void {
  localStorage.setItem(STORAGE_ID_VIAJE, String(idViaje))
}
