package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.AuditoriaLog;

import java.time.LocalDateTime;

/**
 * Registro del historial del turno de un funcionario (RF05). Espeja un
 * {@link AuditoriaLog} con el identificador del pasajero ya enmascarado (RNF10).
 */
public record HistorialItemResponse(
        LocalDateTime fecha,
        String codigoQr,
        String identificadorEnmascarado,
        String accion,
        String modulo
) {

    public static HistorialItemResponse from(AuditoriaLog log) {
        return new HistorialItemResponse(
                log.getFecha(),
                log.getCodigoQr(),
                log.getIdentificadorEnmascarado(),
                log.getAccion(),
                log.getModulo()
        );
    }
}
