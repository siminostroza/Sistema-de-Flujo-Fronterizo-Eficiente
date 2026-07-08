package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.LoginRequest;
import cl.duoc.sffe.dto.LoginResponse;
import cl.duoc.sffe.dto.MensajeResponse;
import cl.duoc.sffe.dto.OlvidePasswordRequest;
import cl.duoc.sffe.dto.RegisterRequest;
import cl.duoc.sffe.dto.RegisterResponse;
import cl.duoc.sffe.dto.RestablecerPasswordRequest;
import cl.duoc.sffe.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Endpoints de autenticación (RF01). La mayoría son públicos
 * ({@code /api/auth/**} en {@code SecurityConfig}); {@code reenviar-verificacion}
 * exige sesión de pasajero mediante {@code @PreAuthorize} a nivel de método
 * (la regla de filtro permitAll solo evita bloquear el resto de la ruta).
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Inicia sesión y devuelve token JWT, rol y nombre. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Registra un nuevo pasajero. Multipart: la parte {@code datos} lleva el
     * JSON de {@link RegisterRequest}; {@code carnetIdentidad} y
     * {@code papelesAntecedentes} son los archivos adjuntos (obligatorios
     * salvo para SIN_DOCUMENTO, validado en {@code AuthService}). Envía un
     * correo de verificación; la cuenta ya queda utilizable de inmediato.
     */
    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestPart("datos") RegisterRequest request,
            @RequestPart(value = "carnetIdentidad", required = false) MultipartFile carnetIdentidad,
            @RequestPart(value = "papelesAntecedentes", required = false) MultipartFile papelesAntecedentes) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(authService.register(request, carnetIdentidad, papelesAntecedentes));
    }

    /** Confirma el correo a partir del enlace enviado al registrarse (RF01). */
    @GetMapping("/verificar-correo")
    public ResponseEntity<MensajeResponse> verificarCorreo(@RequestParam String token) {
        authService.verificarCorreo(token);
        return ResponseEntity.ok(new MensajeResponse("Correo verificado correctamente"));
    }

    /** Reenvía el correo de verificación al pasajero autenticado (RF01). */
    @PostMapping("/reenviar-verificacion")
    @PreAuthorize("hasRole('PASAJERO')")
    public ResponseEntity<MensajeResponse> reenviarVerificacion(Authentication authentication) {
        authService.reenviarVerificacion(authentication.getName());
        return ResponseEntity.ok(new MensajeResponse("Correo de verificación reenviado"));
    }

    /**
     * Inicia la recuperación de contraseña (RF01). Siempre responde igual,
     * exista o no la cuenta, para no revelar qué identificadores/correos
     * están registrados.
     */
    @PostMapping("/olvide-password")
    public ResponseEntity<MensajeResponse> olvidePassword(@Valid @RequestBody OlvidePasswordRequest request) {
        authService.olvidePassword(request);
        return ResponseEntity.ok(new MensajeResponse(
                "Si el identificador o correo existe, te enviamos un enlace para restablecer tu contraseña"));
    }

    /** Aplica la nueva contraseña a partir de un token de recuperación vigente (RF01). */
    @PostMapping("/restablecer-password")
    public ResponseEntity<MensajeResponse> restablecerPassword(
            @Valid @RequestBody RestablecerPasswordRequest request) {
        authService.restablecerPassword(request);
        return ResponseEntity.ok(new MensajeResponse("Contraseña actualizada. Ya puedes iniciar sesión"));
    }
}
