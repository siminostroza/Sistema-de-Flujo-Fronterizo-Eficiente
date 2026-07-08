package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.FiscalizacionRequest;
import cl.duoc.sffe.dto.FiscalizacionResponse;
import cl.duoc.sffe.dto.HistorialItemResponse;
import cl.duoc.sffe.exception.AuthException;
import cl.duoc.sffe.model.Rol;
import cl.duoc.sffe.service.ArchivoDescargado;
import cl.duoc.sffe.service.ArchivoService;
import cl.duoc.sffe.service.FiscalizacionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
    private static final String ROLES_FUNCIONARIO =
            "hasAnyRole('FUNCIONARIO_ADUANA', 'FUNCIONARIO_PDI', 'FUNCIONARIO_SAG', 'ADMIN')";

    private final FiscalizacionService fiscalizacionService;
    private final ArchivoService archivoService;

    public FiscalizacionController(FiscalizacionService fiscalizacionService, ArchivoService archivoService) {
        this.fiscalizacionService = fiscalizacionService;
        this.archivoService = archivoService;
    }

    /** Resuelve la fiscalización de un expediente a partir de su código QR (RF05). */
    @PutMapping("/{codigo}/resolver")
    @PreAuthorize(ROLES_FUNCIONARIO)
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
    @PreAuthorize(ROLES_FUNCIONARIO)
    public ResponseEntity<List<HistorialItemResponse>> historial(Authentication authentication) {
        return ResponseEntity.ok(
                fiscalizacionService.historialTurno(authentication.getName()));
    }

    /**
     * Visualización de los archivos adjuntos del pasajero (carnet de
     * identidad, papeles de antecedentes) del expediente identificado por el
     * QR ya validado (RF01, RF05).
     */
    @GetMapping("/{codigo}/archivos/usuario/{campo}")
    @PreAuthorize(ROLES_FUNCIONARIO)
    public ResponseEntity<byte[]> archivoUsuario(@PathVariable String codigo, @PathVariable String campo) {
        return responder(archivoService.archivoUsuarioPorQr(codigo, campo));
    }

    /** Visualización de los archivos adjuntos de un menor del expediente (RF02, RF05). */
    @GetMapping("/{codigo}/archivos/menores/{idMenor}/{campo}")
    @PreAuthorize(ROLES_FUNCIONARIO)
    public ResponseEntity<byte[]> archivoMenor(
            @PathVariable String codigo, @PathVariable Integer idMenor, @PathVariable String campo) {
        return responder(archivoService.archivoMenorPorQr(codigo, idMenor, campo));
    }

    /** Visualización del permiso de circulación de un vehículo del expediente (RF03, RF05). */
    @GetMapping("/{codigo}/archivos/vehiculos/{idVehiculo}/{campo}")
    @PreAuthorize(ROLES_FUNCIONARIO)
    public ResponseEntity<byte[]> archivoVehiculo(
            @PathVariable String codigo, @PathVariable Integer idVehiculo, @PathVariable String campo) {
        return responder(archivoService.archivoVehiculoPorQr(codigo, idVehiculo, campo));
    }

    /** Visualización de los archivos adjuntos de una mascota del expediente (RF02, RF05). */
    @GetMapping("/{codigo}/archivos/mascotas/{idMascota}/{campo}")
    @PreAuthorize(ROLES_FUNCIONARIO)
    public ResponseEntity<byte[]> archivoMascota(
            @PathVariable String codigo, @PathVariable Integer idMascota, @PathVariable String campo) {
        return responder(archivoService.archivoMascotaPorQr(codigo, idMascota, campo));
    }

    private ResponseEntity<byte[]> responder(ArchivoDescargado archivo) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(archivo.contenido());
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
