package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.LoginRequest;
import cl.duoc.sffe.dto.LoginResponse;
import cl.duoc.sffe.dto.RegisterRequest;
import cl.duoc.sffe.dto.RegisterResponse;
import cl.duoc.sffe.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Endpoints públicos de autenticación (RF01).
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
     * salvo para SIN_DOCUMENTO, validado en {@code AuthService}).
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
}
