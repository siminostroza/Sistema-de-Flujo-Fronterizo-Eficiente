package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.AuditoriaLog;
import cl.duoc.sffe.model.Rol;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.util.MaskUtil;

import java.time.LocalDateTime;

/**
 * Registro de auditoría completo para ADMIN (RF09): a diferencia de
 * {@link HistorialItemResponse} (acotado al turno de un funcionario), incluye
 * quién ejecutó la acción. El identificador del funcionario también se
 * enmascara (RNF10 aplica igual a los datos de funcionarios en vistas de
 * auditoría), igual que ya se hace con el propio identificador en la
 * cabecera del panel.
 */
public record AuditoriaAdminItemResponse(
        LocalDateTime fecha,
        String funcionarioNombre,
        String funcionarioIdentificadorEnmascarado,
        Rol funcionarioRol,
        String codigoQr,
        String identificadorEnmascarado,
        String accion,
        String modulo,
        String observaciones
) {

    public static AuditoriaAdminItemResponse from(AuditoriaLog log) {
        Usuario funcionario = log.getUsuario();
        return new AuditoriaAdminItemResponse(
                log.getFecha(),
                funcionario != null ? funcionario.getNombre() : null,
                funcionario != null
                        ? MaskUtil.maskIdentificador(funcionario.getIdentificador(), funcionario.getTipoDocumento())
                        : null,
                funcionario != null ? funcionario.getRol() : null,
                log.getCodigoQr(),
                log.getIdentificadorEnmascarado(),
                log.getAccion(),
                log.getModulo(),
                log.getObservaciones()
        );
    }
}
