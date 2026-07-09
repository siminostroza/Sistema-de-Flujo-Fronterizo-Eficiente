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

/**
 * Archivos adjuntos del menor (RF02). El carnet y los papeles de
 * antecedentes son obligatorios; el permiso notarial es obligatorio solo
 * cuando {@code requiereAutorizacion = true} (validado en el backend).
 */
export interface MenorArchivos {
  carnetIdentidad: File | null
  papelesAntecedentes: File | null
  permisoNotarial: File | null
}

/** Datos de una mascota del viaje (RF02). */
export interface MascotaPayload {
  tipoAnimal: string
  numeroChip: string
}

export interface MascotaInfo extends MascotaPayload {
  idMascota: number
  certificadoChip: boolean
  carnetVacunacion: boolean
}

/** Certificado del chip y carnet de vacunación de la mascota (RF02): ambos obligatorios. */
export interface MascotaArchivos {
  certificadoChip: File | null
  carnetVacunacion: File | null
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
  /** true si el permiso de circulación fue adjuntado (RF03, obligatorio). */
  permisoCirculacion: boolean
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
  /** Motivo detallado del rechazo (RF05), visible en el ticket del pasajero. Nulo salvo RECHAZADO. */
  motivoRechazo: string | null
  createdAt: string
  /** true si el pasajero adjuntó su carnet al registrarse; las cuentas semilla no lo tienen. */
  carnetIdentidad: boolean
  /** true si el pasajero adjuntó sus papeles de antecedentes al registrarse. */
  papelesAntecedentes: boolean
  /** Lista de vehículos del viaje: principal y, opcionalmente, remolque (1:N). */
  vehiculos: VehiculoInfo[]
  /** Mascotas del viaje (RF02), visibles para toda fiscalización. */
  mascotas: MascotaInfo[]
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

/**
 * POST /api/viajes/{id}/menores — agrega un menor de edad al expediente
 * (RF02). Multipart: la parte "datos" lleva el JSON del menor; el carnet de
 * identidad y los papeles de antecedentes son obligatorios, y el permiso
 * notarial lo es solo si requiereAutorizacion es true.
 */
export async function agregarMenor(
  idViaje: number,
  payload: MenorPayload,
  archivos: MenorArchivos,
): Promise<Viaje> {
  const formData = new FormData()
  formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (archivos.carnetIdentidad) {
    formData.append('carnetIdentidad', archivos.carnetIdentidad)
  }
  if (archivos.papelesAntecedentes) {
    formData.append('papelesAntecedentes', archivos.papelesAntecedentes)
  }
  if (archivos.permisoNotarial) {
    formData.append('permisoNotarial', archivos.permisoNotarial)
  }
  const { data } = await api.post<Viaje>(`/viajes/${idViaje}/menores`, formData)
  return data
}

/**
 * PUT /api/viajes/{id}/menores/{idMenor} — actualiza nombre, RUT, fecha de
 * nacimiento y autorización notarial de un menor ya guardado (RF02), sin
 * tocar sus archivos adjuntos (para eso está reemplazarArchivoMenor).
 */
export async function actualizarMenor(
  idViaje: number,
  idMenor: number,
  payload: MenorPayload,
): Promise<Viaje> {
  const { data } = await api.put<Viaje>(`/viajes/${idViaje}/menores/${idMenor}`, payload)
  return data
}

/** DELETE /api/viajes/{id}/menores/{idMenor} — quita un menor del expediente, definitivamente (RF02). Solo mientras el viaje sigue PENDIENTE. */
export async function eliminarMenor(idViaje: number, idMenor: number): Promise<Viaje> {
  const { data } = await api.delete<Viaje>(`/viajes/${idViaje}/menores/${idMenor}`)
  return data
}

/**
 * POST /api/viajes/{id}/vehiculo — registra o actualiza el vehículo del
 * expediente (RF03). Multipart: la parte "datos" lleva el JSON del vehículo;
 * el permiso de circulación es obligatorio (principal o remolque), visible
 * para Aduana y PDI.
 */
export async function registrarVehiculo(
  idViaje: number,
  payload: VehiculoPayload,
  permisoCirculacion: File | null,
): Promise<Viaje> {
  const formData = new FormData()
  formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (permisoCirculacion) {
    formData.append('permisoCirculacion', permisoCirculacion)
  }
  const { data } = await api.post<Viaje>(`/viajes/${idViaje}/vehiculo`, formData)
  return data
}

/**
 * POST /api/viajes/{id}/mascotas — agrega una mascota al expediente (RF02).
 * Multipart: la parte "datos" lleva el JSON de la mascota; el certificado
 * del chip y el carnet de vacunación son obligatorios.
 */
export async function agregarMascota(
  idViaje: number,
  payload: MascotaPayload,
  archivos: MascotaArchivos,
): Promise<Viaje> {
  const formData = new FormData()
  formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  if (archivos.certificadoChip) {
    formData.append('certificadoChip', archivos.certificadoChip)
  }
  if (archivos.carnetVacunacion) {
    formData.append('carnetVacunacion', archivos.carnetVacunacion)
  }
  const { data } = await api.post<Viaje>(`/viajes/${idViaje}/mascotas`, formData)
  return data
}

/** PUT /api/viajes/{id}/mascotas/{idMascota} — actualiza tipo de animal y número de chip, sin tocar sus archivos (RF02). */
export async function actualizarMascota(
  idViaje: number,
  idMascota: number,
  payload: MascotaPayload,
): Promise<Viaje> {
  const { data } = await api.put<Viaje>(`/viajes/${idViaje}/mascotas/${idMascota}`, payload)
  return data
}

/** DELETE /api/viajes/{id}/mascotas/{idMascota} — quita una mascota del expediente, definitivamente (RF02). Solo mientras el viaje sigue PENDIENTE. */
export async function eliminarMascota(idViaje: number, idMascota: number): Promise<Viaje> {
  const { data } = await api.delete<Viaje>(`/viajes/${idViaje}/mascotas/${idMascota}`)
  return data
}

/** POST /api/viajes/{id}/sag — guarda o actualiza la Declaración Jurada SAG (RF02). */
export async function guardarSag(idViaje: number, payload: SagPayload): Promise<Viaje> {
  const { data } = await api.post<Viaje>(`/viajes/${idViaje}/sag`, payload)
  return data
}

/**
 * PUT /api/viajes/{id}/archivos/... — reemplaza un archivo ya subido (por
 * ejemplo, si se adjuntó el documento equivocado). Solo permitido mientras
 * el viaje sigue PENDIENTE.
 */
async function subirReemplazo(url: string, archivo: File): Promise<void> {
  const formData = new FormData()
  formData.append('archivo', archivo)
  await api.put(url, formData)
}

export function reemplazarArchivoUsuario(idViaje: number, campo: string, archivo: File): Promise<void> {
  return subirReemplazo(`/viajes/${idViaje}/archivos/usuario/${campo}`, archivo)
}

export function reemplazarArchivoMenor(
  idViaje: number, idMenor: number, campo: string, archivo: File,
): Promise<void> {
  return subirReemplazo(`/viajes/${idViaje}/archivos/menores/${idMenor}/${campo}`, archivo)
}

export function reemplazarArchivoVehiculo(
  idViaje: number, idVehiculo: number, campo: string, archivo: File,
): Promise<void> {
  return subirReemplazo(`/viajes/${idViaje}/archivos/vehiculos/${idVehiculo}/${campo}`, archivo)
}

export function reemplazarArchivoMascota(
  idViaje: number, idMascota: number, campo: string, archivo: File,
): Promise<void> {
  return subirReemplazo(`/viajes/${idViaje}/archivos/mascotas/${idMascota}/${campo}`, archivo)
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
