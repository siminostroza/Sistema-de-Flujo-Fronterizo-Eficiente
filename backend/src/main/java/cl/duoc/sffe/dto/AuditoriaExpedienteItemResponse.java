package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.AuditoriaLog;
import cl.duoc.sffe.model.Rol;

import java.time.LocalDateTime;

/**
 * Registro de auditoría de un expediente específico (RF05), visible para
 * cualquier rol de fiscalización que lo consulte: a diferencia del
 * historial de turno (acotado al propio funcionario), esto muestra quién
 * hizo qué sobre ESTE expediente, sin importar el rol — así Aduana ve si
 * PDI ya validó identidad, PDI ve si Aduana ya autorizó el ingreso, etc.
 */
public record AuditoriaExpedienteItemResponse(
        LocalDateTime fecha,
        String accion,
        String funcionarioNombre,
        Rol funcionarioRol,
        String observaciones
) {

    public static AuditoriaExpedienteItemResponse from(AuditoriaLog log) {
        return new AuditoriaExpedienteItemResponse(
                log.getFecha(),
                log.getAccion(),
                log.getUsuario() != null ? log.getUsuario().getNombre() : "—",
                log.getUsuario() != null ? log.getUsuario().getRol() : null,
                log.getObservaciones()
        );
    }
}
