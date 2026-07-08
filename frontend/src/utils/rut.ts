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
