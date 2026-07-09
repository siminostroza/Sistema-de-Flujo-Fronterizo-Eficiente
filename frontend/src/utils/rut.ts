/**
 * Validación de RUT chileno en el cliente (RF01). Espeja la lógica del
 * backend (módulo 11) para dar feedback inmediato antes de enviar el formulario.
 */

/** Quita puntos y espacios, deja minúsculas y guion. */
export function normalizarRut(rut: string): string {
  return rut.replace(/\./g, '').replace(/\s/g, '').trim().toLowerCase()
}

/** Valida formato cuerpo-dígito y dígito verificador (módulo 11). */
export function validarRut(rutEntrada: string): boolean {
  const rut = normalizarRut(rutEntrada)
  if (!/^\d{7,8}-[0-9k]$/.test(rut)) {
    return false
  }
  const [cuerpo, dv] = rut.split('-')
  // Rechaza cuerpos degenerados (00000000, 11111111, ...): nunca son RUT reales.
  if (/^(\d)\1+$/.test(cuerpo)) {
    return false
  }
  let suma = 0
  let multiplicador = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const resto = 11 - (suma % 11)
  let dvCalculado: string
  if (resto === 11) {
    dvCalculado = '0'
  } else if (resto === 10) {
    dvCalculado = 'k'
  } else {
    dvCalculado = String(resto)
  }
  return dvCalculado === dv
}

/**
 * Calcula el dígito verificador correcto (módulo 11) para un cuerpo de RUT,
 * o {@code null} si el cuerpo no tiene un formato válido. Se usa solo para
 * sugerir una corrección cuando {@link validarRut} rechaza un RUT: el
 * cuerpo puede ser correcto y el usuario haber tipeado el DV equivocado
 * (confusión frecuente, ya que el DV no es arbitrario — lo define el
 * cuerpo).
 */
export function calcularDigitoVerificador(rutEntrada: string): string | null {
  const rut = normalizarRut(rutEntrada)
  const cuerpo = rut.split('-')[0]
  if (!/^\d{7,8}$/.test(cuerpo)) {
    return null
  }
  let suma = 0
  let multiplicador = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

/**
 * Autoformatea un RUT mientras se escribe: deja solo dígitos y K/k, e
 * inserta el guion antes del dígito verificador. Sin esto, un RUT real
 * tipeado sin guion (ej. "210132813", muy común al copiar desde una
 * cédula) fallaba {@link validarRut} por formato aunque el módulo 11 diera
 * válido, y se reportaba como "RUT inválido" sin serlo.
 */
export function formatearRutInput(valor: string): string {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase()
  if (limpio.length <= 1) {
    return limpio
  }
  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  return `${cuerpo}-${dv}`
}
