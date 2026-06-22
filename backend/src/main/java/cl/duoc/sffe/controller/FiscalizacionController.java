package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.FiscalizacionRequest;
import cl.duoc.sffe.dto.FiscalizacionResponse;
import cl.duoc.sffe.dto.HistorialItemResponse;
import cl.duoc.sffe.exception.AuthException;
import cl.duoc.sffe.model.Rol;
import cl.duoc.sffe.service.FiscalizacionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints de control fronterizo del funcionario autenticado (RF05).
 * El identificador y el rol provienen del JWT validado por
 * {@link cl.duoc.sffe.security.JwtAuthenticationFilter}.
 */
@RestController
@RequestMapping("/api/fiscalizacion")
public class FiscalizacionController {

    private static final String ROLE_PREFIX = "ROLE_";

    private final FiscalizacionService fiscalizacionService;

    public FiscalizacionController(FiscalizacionService fiscalizacionService) {
        this.fiscalizacionService = fiscalizacionService;
    }

    /** Resuelve la fiscalización de un expediente a partir de su código QR (RF05). */
    @PutMapping("/{codigo}/resolver")
    @PreAuthorize("hasAnyRole('FUNCIONARIO_ADUANA', 'FUNCIONARIO_PDI', 'FUNCIONARIO_SAG', 'ADMIN')")
    public ResponseEntity<FiscalizacionResponse> resolver(
            @PathVariable String codigo,
            @Valid @RequestBody FiscalizacionRequest request,
            Authentication authentication) {
        FiscalizacionResponse respuesta = fiscalizacionService.resolver(
                codigo,
                request.decision(),
                request.observaciones(),
                authentication.getName(),
                extraerRol(authentication));
        return ResponseEntity.ok(respuesta);
    }

    /** Historial del turno actual del funcionario autenticado (RF05). */
    @GetMapping("/historial")
    @PreAuthorize("hasAnyRole('FUNCIONARIO_ADUANA', 'FUNCIONARIO_PDI', 'FUNCIONARIO_SAG', 'ADMIN')")
    public ResponseEntity<List<HistorialItemResponse>> historial(Authentication authentication) {
        return ResponseEntity.ok(
                fiscalizacionService.historialTurno(authentication.getName()));
    }

    /** Extrae el rol del usuario a partir de la authority {@code ROLE_<rol>} del JWT. */
    private Rol extraerRol(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith(ROLE_PREFIX))
                .map(authority -> authority.substring(ROLE_PREFIX.length()))
                .map(Rol::valueOf)
                .findFirst()
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "La sesión no tiene un rol válido"));
    }
}
