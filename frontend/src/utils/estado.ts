import type { EstadoViaje } from '../services/viajeService'

/** Texto y clases Tailwind para el badge de estado de un expediente (RF04). */
export function estadoBadge(estado: EstadoViaje): { texto: string; clases: string } {
  switch (estado) {
    case 'APROBADO':
      return {
        texto: '🟢 Aprobado',
        clases: 'bg-estado-aprobado-bg text-estado-aprobado-text',
      }
    case 'RECHAZADO':
      return {
        texto: '🔴 Rechazado',
        clases: 'bg-estado-rechazado-bg text-estado-rechazado-text',
      }
    default:
      return {
        texto: '🟡 Pendiente',
        clases: 'bg-estado-pendiente-bg text-estado-pendiente-text',
      }
  }
}
