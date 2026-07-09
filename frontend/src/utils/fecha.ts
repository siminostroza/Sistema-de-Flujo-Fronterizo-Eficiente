/**
 * Formato de fecha único para toda la app (dd/mm/yyyy): los `<input
 * type="date">` siguen en formato yyyy-mm-dd (lo exige el estándar HTML,
 * el navegador ya lo muestra localizado al usuario), esto es solo para
 * texto de solo lectura.
 */
export function formatearFecha(fechaIso: string | null | undefined): string {
  if (!fechaIso) {
    return '—'
  }
  const soloFecha = fechaIso.split('T')[0]
  const partes = soloFecha.split('-')
  if (partes.length !== 3) {
    return fechaIso
  }
  const [anio, mes, dia] = partes
  return `${dia}/${mes}/${anio}`
}

/** Fecha y hora local en dd/mm/yyyy HH:MM:SS, para timestamps completos (ej. auditoría). */
export function formatearFechaHora(fechaIso: string | null | undefined): string {
  if (!fechaIso) {
    return '—'
  }
  const d = new Date(fechaIso)
  if (Number.isNaN(d.getTime())) {
    return fechaIso
  }
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const anio = d.getFullYear()
  const horas = String(d.getHours()).padStart(2, '0')
  const minutos = String(d.getMinutes()).padStart(2, '0')
  const segundos = String(d.getSeconds()).padStart(2, '0')
  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`
}
