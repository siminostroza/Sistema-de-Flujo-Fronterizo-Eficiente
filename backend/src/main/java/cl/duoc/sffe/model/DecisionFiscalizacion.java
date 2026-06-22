package cl.duoc.sffe.model;

/**
 * Decisión que un funcionario registra al fiscalizar un expediente en frontera
 * (RF05). Cada decisión tiene reglas de permiso por rol y efectos distintos
 * sobre el estado del viaje y del código QR (ver {@code FiscalizacionService}):
 *
 * <ul>
 *   <li>{@code APROBADO} / {@code RECHAZADO} — solo Aduana; cambian el estado
 *       del viaje.</li>
 *   <li>{@code SOSPECHA} — Aduana, PDI y SAG; solo deja registro de auditoría.</li>
 *   <li>{@code VALIDACION_IDENTIDAD} — solo PDI; validación acotada (auditoría).</li>
 *   <li>{@code VALIDACION_SAG} — solo SAG; validación acotada (auditoría).</li>
 * </ul>
 */
public enum DecisionFiscalizacion {
    APROBADO,
    RECHAZADO,
    SOSPECHA,
    VALIDACION_IDENTIDAD,
    VALIDACION_SAG
}
