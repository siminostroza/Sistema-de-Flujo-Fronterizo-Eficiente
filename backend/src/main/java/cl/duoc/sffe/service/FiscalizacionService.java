package cl.duoc.sffe.service;

import cl.duoc.sffe.dto.FiscalizacionResponse;
import cl.duoc.sffe.dto.HistorialItemResponse;
import cl.duoc.sffe.exception.AuthException;
import cl.duoc.sffe.exception.FiscalizacionException;
import cl.duoc.sffe.model.AuditoriaLog;
import cl.duoc.sffe.model.CodigoQr;
import cl.duoc.sffe.model.DecisionFiscalizacion;
import cl.duoc.sffe.model.EstadoQr;
import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.Rol;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.model.Viaje;
import cl.duoc.sffe.repository.AuditoriaLogRepository;
import cl.duoc.sffe.repository.CodigoQrRepository;
import cl.duoc.sffe.repository.UsuarioRepository;
import cl.duoc.sffe.repository.ViajeRepository;
import cl.duoc.sffe.util.MaskUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Lógica de control fronterizo (RF05): resuelve la fiscalización de un
 * expediente a partir de su código QR, validando los permisos del rol del
 * funcionario, y construye el historial del turno. Toda resolución deja un
 * registro en {@link AuditoriaLog}.
 */
@Service
public class FiscalizacionService {

    private static final String MODULO = "QR";

    private final CodigoQrRepository codigoQrRepository;
    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaLogRepository auditoriaLogRepository;

    public FiscalizacionService(CodigoQrRepository codigoQrRepository,
                                ViajeRepository viajeRepository,
                                UsuarioRepository usuarioRepository,
                                AuditoriaLogRepository auditoriaLogRepository) {
        this.codigoQrRepository = codigoQrRepository;
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaLogRepository = auditoriaLogRepository;
    }

    /**
     * Resuelve la fiscalización de un expediente a partir del QR escaneado
     * (RF05). Valida que el QR exista, que el rol tenga permiso para la
     * decisión, aplica los efectos de estado y persiste la auditoría.
     * El QR debe estar ACTIVO solo para APROBADO/RECHAZADO (las decisiones
     * que consumen el QR); VALIDACION_IDENTIDAD, VALIDACION_SAG y SOSPECHA
     * son registros de auditoría que PDI/SAG pueden dejar en cualquier
     * momento, incluso si Aduana ya resolvió el ingreso.
     */
    @Transactional
    public FiscalizacionResponse resolver(String codigo,
                                          String decisionTexto,
                                          String observaciones,
                                          String identificadorFuncionario,
                                          Rol rolFuncionario) {
        DecisionFiscalizacion decision = parseDecision(decisionTexto);
        validarPermiso(decision, rolFuncionario);

        CodigoQr codigoQr = codigoQrRepository.findByCodigo(codigo)
                .orElseThrow(() -> new FiscalizacionException(
                        HttpStatus.NOT_FOUND, "Código QR no encontrado"));

        if (requiereQrActivo(decision) && codigoQr.getEstado() != EstadoQr.ACTIVO) {
            throw new FiscalizacionException(HttpStatus.CONFLICT,
                    "El código QR no está activo y no puede fiscalizarse");
        }

        Usuario funcionario = obtenerUsuario(identificadorFuncionario);
        Viaje viaje = codigoQr.getViaje();

        String mensaje = aplicarDecision(decision, viaje, codigoQr);
        viajeRepository.save(viaje);
        codigoQrRepository.save(codigoQr);

        registrarAuditoria(decision, funcionario, codigoQr, viaje.getUsuario());

        return new FiscalizacionResponse(mensaje, viaje.getEstado(), codigoQr.getEstado());
    }

    /**
     * Historial del turno actual (día en curso) del funcionario autenticado,
     * más recientes primero (RF05).
     */
    @Transactional(readOnly = true)
    public List<HistorialItemResponse> historialTurno(String identificadorFuncionario) {
        Usuario funcionario = obtenerUsuario(identificadorFuncionario);
        LocalDateTime inicioDelDia = LocalDate.now().atStartOfDay();
        return auditoriaLogRepository
                .findByUsuarioIdUsuarioAndFechaAfterOrderByFechaDesc(
                        funcionario.getIdUsuario(), inicioDelDia)
                .stream()
                .map(HistorialItemResponse::from)
                .toList();
    }

    /** Aplica los efectos de la decisión sobre el viaje y el QR; devuelve el mensaje de confirmación. */
    private String aplicarDecision(DecisionFiscalizacion decision, Viaje viaje, CodigoQr codigoQr) {
        return switch (decision) {
            case APROBADO -> {
                viaje.setEstado(EstadoViaje.APROBADO);
                codigoQr.setEstado(EstadoQr.USADO);
                yield "Ingreso autorizado. El expediente quedó APROBADO.";
            }
            case RECHAZADO -> {
                // El QR se mantiene ACTIVO para permitir reintentos del pasajero.
                viaje.setEstado(EstadoViaje.RECHAZADO);
                yield "Ingreso denegado. El expediente quedó RECHAZADO.";
            }
            case SOSPECHA -> "Sospecha registrada. No se modificó el estado del expediente.";
            case VALIDACION_IDENTIDAD -> "Identidad validada (PDI). Registro de fiscalización guardado.";
            case VALIDACION_SAG -> "Declaración SAG validada. Registro de fiscalización guardado.";
        };
    }

    /** APROBADO/RECHAZADO consumen el QR (lo dejan en USADO o lo mantienen ACTIVO); el resto son solo auditoría. */
    private boolean requiereQrActivo(DecisionFiscalizacion decision) {
        return decision == DecisionFiscalizacion.APROBADO || decision == DecisionFiscalizacion.RECHAZADO;
    }

    /**
     * Reglas de permiso por rol (RF05, tabla de permisos). ADMIN es de solo
     * lectura, por lo que no puede registrar ninguna resolución.
     */
    private void validarPermiso(DecisionFiscalizacion decision, Rol rol) {
        Set<Rol> permitidos = switch (decision) {
            case APROBADO, RECHAZADO -> Set.of(Rol.FUNCIONARIO_ADUANA);
            case SOSPECHA -> Set.of(
                    Rol.FUNCIONARIO_ADUANA, Rol.FUNCIONARIO_PDI, Rol.FUNCIONARIO_SAG);
            case VALIDACION_IDENTIDAD -> Set.of(Rol.FUNCIONARIO_PDI);
            case VALIDACION_SAG -> Set.of(Rol.FUNCIONARIO_SAG);
        };
        if (!permitidos.contains(rol)) {
            throw new FiscalizacionException(HttpStatus.FORBIDDEN,
                    "Tu rol no tiene permiso para registrar esta resolución");
        }
    }

    private DecisionFiscalizacion parseDecision(String decisionTexto) {
        try {
            return DecisionFiscalizacion.valueOf(decisionTexto);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new FiscalizacionException(HttpStatus.BAD_REQUEST,
                    "Decisión de fiscalización inválida");
        }
    }

    private void registrarAuditoria(DecisionFiscalizacion decision,
                                    Usuario funcionario,
                                    CodigoQr codigoQr,
                                    Usuario pasajero) {
        AuditoriaLog log = AuditoriaLog.builder()
                .usuario(funcionario)
                .accion(decision.name())
                .modulo(MODULO)
                .codigoQr(codigoQr.getCodigo())
                .identificadorEnmascarado(MaskUtil.maskIdentificador(
                        pasajero.getIdentificador(), pasajero.getTipoDocumento()))
                .build();
        auditoriaLogRepository.save(log);
    }

    private Usuario obtenerUsuario(String identificador) {
        return usuarioRepository.findByIdentificador(identificador)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "El usuario de la sesión no existe"));
    }
}
