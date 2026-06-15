package cl.duoc.sffe.service;

import cl.duoc.sffe.dto.LoginRequest;
import cl.duoc.sffe.dto.LoginResponse;
import cl.duoc.sffe.dto.RegisterRequest;
import cl.duoc.sffe.dto.RegisterResponse;
import cl.duoc.sffe.exception.AuthException;
import cl.duoc.sffe.model.Rol;
import cl.duoc.sffe.model.TipoDocumento;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.repository.UsuarioRepository;
import cl.duoc.sffe.security.JwtUtil;
import cl.duoc.sffe.util.DocumentoValidator;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lógica de autenticación y registro de pasajeros (RF01).
 */
@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final DocumentoValidator documentoValidator;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       DocumentoValidator documentoValidator) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.documentoValidator = documentoValidator;
    }

    /** Valida credenciales por identificador y devuelve un token JWT (RF01). */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String identificador = documentoValidator.normalizar(request.identificador());

        Usuario usuario = usuarioRepository.findByIdentificador(identificador)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "Identificador o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.contrasena(), usuario.getContrasena())) {
            throw new AuthException(
                    HttpStatus.UNAUTHORIZED, "Identificador o contraseña incorrectos");
        }

        String token = jwtUtil.generarToken(usuario.getIdentificador(), usuario.getRol());
        return new LoginResponse(token, usuario.getRol(), usuario.getNombre(), usuario.getTipoDocumento());
    }

    /**
     * Registra un nuevo pasajero validando su identificador según el tipo de
     * documento y la unicidad de identificador y correo (RF01).
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        TipoDocumento tipoDocumento = request.tipoDocumento();
        String identificador = resolverIdentificador(tipoDocumento, request.identificador());

        if (usuarioRepository.existsByIdentificador(identificador)) {
            throw new AuthException(
                    HttpStatus.CONFLICT, "Ya existe una cuenta registrada con este documento");
        }
        if (usuarioRepository.existsByCorreo(request.correo())) {
            throw new AuthException(
                    HttpStatus.CONFLICT, "Ya existe una cuenta registrada con este correo");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .identificador(identificador)
                .tipoDocumento(tipoDocumento)
                .correo(request.correo())
                .contrasena(passwordEncoder.encode(request.contrasena()))
                .nacionalidad(request.nacionalidad() != null
                        ? request.nacionalidad() : "Chilena")
                .telefono(request.telefono() != null ? request.telefono() : "")
                .rol(Rol.PASAJERO)
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        return new RegisterResponse("Registro exitoso", guardado.getIdUsuario(), identificador);
    }

    /**
     * Normaliza y valida el identificador recibido según el tipo de documento.
     * Para SIN_DOCUMENTO el valor del cliente se ignora y se genera un código
     * temporal único.
     */
    private String resolverIdentificador(TipoDocumento tipoDocumento, String identificadorRecibido) {
        if (tipoDocumento == TipoDocumento.SIN_DOCUMENTO) {
            return documentoValidator.generarIdentificadorTemporal();
        }

        if (identificadorRecibido == null || identificadorRecibido.isBlank()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST, "El identificador es obligatorio para este tipo de documento");
        }

        String identificador = documentoValidator.normalizar(identificadorRecibido);

        boolean valido = switch (tipoDocumento) {
            case RUT -> documentoValidator.validarRut(identificador);
            case PASAPORTE -> documentoValidator.validarPasaporte(identificador);
            case CEDULA_EXTRANJERA -> documentoValidator.validarCedula(identificador);
            case SIN_DOCUMENTO -> true; // inalcanzable, manejado arriba
        };

        if (!valido) {
            throw new AuthException(HttpStatus.BAD_REQUEST, mensajeInvalido(tipoDocumento));
        }

        return identificador;
    }

    private String mensajeInvalido(TipoDocumento tipoDocumento) {
        return switch (tipoDocumento) {
            case RUT -> "El RUT ingresado no es válido";
            case PASAPORTE -> "El pasaporte ingresado no es válido (debe ser alfanumérico de 6 a 20 caracteres)";
            case CEDULA_EXTRANJERA -> "La cédula ingresada no es válida (debe ser alfanumérica de 5 a 15 caracteres)";
            case SIN_DOCUMENTO -> "Tipo de documento inválido";
        };
    }
}
