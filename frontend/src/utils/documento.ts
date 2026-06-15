/**
 * Tipos de documento de identidad y validaciones en el cliente (RF01).
 * Espeja la lógica del backend para dar feedback inmediato antes de enviar
 * el formulario.
 */
import { validarRut } from './rut'

export type TipoDocumento = 'RUT' | 'PASAPORTE' | 'CEDULA_EXTRANJERA' | 'SIN_DOCUMENTO'

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'RUT', label: 'RUT chileno' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'CEDULA_EXTRANJERA', label: 'Cédula extranjera (Mercosur)' },
  { value: 'SIN_DOCUMENTO', label: 'No tengo documento' },
]

/** Etiqueta legible de un tipo de documento (para Perfil, mensajes, etc.). */
export function etiquetaTipoDocumento(tipo: TipoDocumento | undefined): string {
  return TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label ?? '—'
}

/** Quita puntos y espacios, y deja el valor en mayúsculas. */
export function normalizarIdentificador(valor: string): string {
  return valor.replace(/\./g, '').replace(/\s/g, '').trim().toUpperCase()
}

/** Pasaporte: alfanumérico, de 6 a 20 caracteres (ya normalizado). */
export function validarPasaporte(valor: string): boolean {
  return /^[A-Z0-9]{6,20}$/.test(normalizarIdentificador(valor))
}

/** Cédula extranjera (Mercosur): alfanumérica, de 5 a 15 caracteres (ya normalizada). */
export function validarCedula(valor: string): boolean {
  return /^[A-Z0-9]{5,15}$/.test(normalizarIdentificador(valor))
}

/** Valida el identificador según el tipo de documento seleccionado. */
export function validarIdentificador(valor: string, tipo: TipoDocumento): boolean {
  switch (tipo) {
    case 'RUT':
      return validarRut(valor)
    case 'PASAPORTE':
      return validarPasaporte(valor)
    case 'CEDULA_EXTRANJERA':
      return validarCedula(valor)
    case 'SIN_DOCUMENTO':
      return true
  }
}

/** Mensaje de error de validación del identificador según el tipo de documento. */
export function mensajeValidacionIdentificador(tipo: TipoDocumento): string {
  switch (tipo) {
    case 'RUT':
      return 'El RUT ingresado no es válido. Formato esperado: 12345678-9'
    case 'PASAPORTE':
      return 'El pasaporte ingresado no es válido. Debe ser alfanumérico de 6 a 20 caracteres'
    case 'CEDULA_EXTRANJERA':
      return 'La cédula ingresada no es válida. Debe ser alfanumérica de 5 a 15 caracteres'
    case 'SIN_DOCUMENTO':
      return ''
  }
}

/** Etiqueta del campo identificador según el tipo de documento. */
export function etiquetaIdentificador(tipo: TipoDocumento): string {
  switch (tipo) {
    case 'RUT':
      return 'RUT'
    case 'PASAPORTE':
      return 'Pasaporte'
    case 'CEDULA_EXTRANJERA':
      return 'Cédula extranjera'
    case 'SIN_DOCUMENTO':
      return 'Código temporal'
  }
}

/**
 * Enmascara un identificador según su tipo de documento (RNF10). Espeja
 * `util/MaskUtil.java` del backend; se usa en las vistas de funcionario que
 * muestran el propio identificador (ej. cabecera del panel).
 */
export function maskIdentificador(
  identificador: string,
  tipo: TipoDocumento,
): string {
  if (!identificador) {
    return ''
  }
  switch (tipo) {
    case 'RUT': {
      const guion = identificador.lastIndexOf('-')
      return guion < 0 ? '*****' : `*****-${identificador.slice(guion + 1)}`
    }
    case 'PASAPORTE':
    case 'CEDULA_EXTRANJERA':
      return identificador.length <= 3
        ? '*'.repeat(identificador.length)
        : `${identificador.slice(0, 2)}******${identificador.slice(-1)}`
    case 'SIN_DOCUMENTO':
      return 'TEMP-****'
  }
}

/** Placeholder del campo identificador según el tipo de documento. */
export function placeholderIdentificador(tipo: TipoDocumento): string {
  switch (tipo) {
    case 'RUT':
      return 'Ej: 12.345.678-9'
    case 'PASAPORTE':
      return 'Ej: AA123456'
    case 'CEDULA_EXTRANJERA':
      return 'Número de cédula'
    case 'SIN_DOCUMENTO':
      return 'Ej: TEMP-1718000000000-AB3D'
  }
}
