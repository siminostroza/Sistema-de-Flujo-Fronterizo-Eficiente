package cl.duoc.sffe.service;

import cl.duoc.sffe.dto.LoginRequest;
import cl.duoc.sffe.dto.LoginResponse;
import cl.duoc.sffe.dto.OlvidePasswordRequest;
import cl.duoc.sffe.dto.RegisterRequest;
import cl.duoc.sffe.dto.RegisterResponse;
import cl.duoc.sffe.dto.RestablecerPasswordRequest;
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
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lógica de autenticación y registro de pasajeros (RF01): login con
 * rate-limiting, registro con verificación de correo y recuperación de
 * contraseña.
 */
@Service
public class AuthService {

    private static final long VERIFICACION_CORREO_HORAS = 24;
    private static final long RESET_PASSWORD_MINUTOS = 60;

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final DocumentoValidator documentoValidator;
    private final FileStorageService fileStorageService;
    private final LoginAttemptService loginAttemptService;
    private final EmailService emailService;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       DocumentoValidator documentoValidator,
                       FileStorageService fileStorageService,
                       LoginAttemptService loginAttemptService,
                       EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.documentoValidator = documentoValidator;
        this.fileStorageService = fileStorageService;
        this.loginAttemptService = loginAttemptService;
        this.emailService = emailService;
    }

    /**
     * Valida credenciales por identificador y devuelve un token JWT (RF01).
     * Bloquea temporalmente el identificador tras varios intentos fallidos
     * seguidos (RNF03, fuerza bruta).
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        String identificador = documentoValidator.normalizar(request.identificador());

        long bloqueoSegundos = loginAttemptService.segundosDeBloqueo(identificador);
        if (bloqueoSegundos > 0) {
            long minutos = (bloqueoSegundos + 59) / 60;
            throw new AuthException(HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos fallidos. Vuelve a intentar en " + minutos + " minuto(s)");
        }

        Usuario usuario = usuarioRepository.findByIdentificador(identificador).orElse(null);
        if (usuario == null || !passwordEncoder.matches(request.contrasena(), usuario.getContrasena())) {
            loginAttemptService.registrarFallo(identificador);
            throw new AuthException(
                    HttpStatus.UNAUTHORIZED, "Identificador o contraseña incorrectos");
        }

        loginAttemptService.registrarExito(identificador);

        String token = jwtUtil.generarToken(usuario.getIdentificador(), usuario.getRol());
        return new LoginResponse(token, usuario.getRol(), usuario.getNombre(), usuario.getTipoDocumento(),
                usuario.getCorreo(), usuario.getCorreoVerificado());
    }

    /**
     * Registra un nuevo pasajero validando su identificador según el tipo de
     * documento y la unicidad de identificador y correo (RF01). El carnet de
     * identidad y los papeles de antecedentes son obligatorios salvo para
     * SIN_DOCUMENTO (ese tipo de documento implica precisamente no tener
     * carnet que adjuntar): sin ellos el registro no puede continuar. Envía
     * un correo de verificación; la cuenta queda utilizable de inmediato
     * (RNF09) pero marcada como no verificada hasta que el pasajero confirme.
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request,
                                      MultipartFile carnetIdentidad,
                                      MultipartFile papelesAntecedentes) {
        TipoDocumento tipoDocumento = request.tipoDocumento();
        String identificador = resolverIdentificador(tipoDocumento, request.identificador());
        String correo = request.correo().trim().toLowerCase();

        if (usuarioRepository.existsByIdentificador(identificador)) {
            throw new AuthException(
                    HttpStatus.CONFLICT, "Ya existe una cuenta registrada con este documento");
        }
        if (usuarioRepository.existsByCorreo(correo)) {
            throw new AuthException(
                    HttpStatus.CONFLICT, "Ya existe una cuenta registrada con este correo");
        }

        String carnetPath;
        String antecedentesPath;
        if (tipoDocumento == TipoDocumento.SIN_DOCUMENTO) {
            carnetPath = fileStorageService.guardarOpcional(carnetIdentidad, "usuarios", "tu carnet de identidad");
            antecedentesPath = fileStorageService.guardarOpcional(
                    papelesAntecedentes, "usuarios", "tus papeles de antecedentes");
        } else {
            carnetPath = fileStorageService.guardarObligatorio(carnetIdentidad, "usuarios", "tu carnet de identidad");
            antecedentesPath = fileStorageService.guardarObligatorio(
                    papelesAntecedentes, "usuarios", "tus papeles de antecedentes");
        }

        String tokenVerificacion = UUID.randomUUID().toString();

        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .identificador(identificador)
                .tipoDocumento(tipoDocumento)
                .correo(correo)
                .contrasena(passwordEncoder.encode(request.contrasena()))
                .nacionalidad(request.nacionalidad() != null
                        ? request.nacionalidad() : "Chilena")
                .telefono(request.telefono() != null ? request.telefono() : "")
                .rol(Rol.PASAJERO)
                .fechaNacimiento(request.fechaNacimiento())
                .carnetIdentidadPath(carnetPath)
                .papelesAntecedentesPath(antecedentesPath)
                .correoVerificado(false)
                .tokenVerificacionCorreo(tokenVerificacion)
                .tokenVerificacionExpira(LocalDateTime.now().plusHours(VERIFICACION_CORREO_HORAS))
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        emailService.enviarVerificacionCorreo(guardado, tokenVerificacion);
        return new RegisterResponse("Registro exitoso", guardado.getIdUsuario(), identificador);
    }

    /** Confirma el correo a partir del token enviado al registrarse (RF01). */
    @Transactional
    public void verificarCorreo(String token) {
        Usuario usuario = usuarioRepository.findByTokenVerificacionCorreo(token)
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST, "El enlace de verificación no es válido"));

        if (usuario.getTokenVerificacionExpira() == null
                || usuario.getTokenVerificacionExpira().isBefore(LocalDateTime.now())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "El enlace de verificación expiró");
        }

        usuario.setCorreoVerificado(true);
        usuario.setTokenVerificacionCorreo(null);
        usuario.setTokenVerificacionExpira(null);
        usuarioRepository.save(usuario);
    }

    /** Reenvía el correo de verificación al usuario autenticado, si aún no lo confirmó (RF01). */
    @Transactional
    public void reenviarVerificacion(String identificador) {
        Usuario usuario = usuarioRepository.findByIdentificador(identificador)
                .orElseThrow(() -> new AuthException(HttpStatus.UNAUTHORIZED, "El usuario de la sesión no existe"));

        if (Boolean.TRUE.equals(usuario.getCorreoVerificado())) {
            return;
        }

        String tokenVerificacion = UUID.randomUUID().toString();
        usuario.setTokenVerificacionCorreo(tokenVerificacion);
        usuario.setTokenVerificacionExpira(LocalDateTime.now().plusHours(VERIFICACION_CORREO_HORAS));
        usuarioRepository.save(usuario);
        emailService.enviarVerificacionCorreo(usuario, tokenVerificacion);
    }

    /**
     * Inicia la recuperación de contraseña (RF01). Responde siempre igual,
     * exista o no la cuenta, para no filtrar qué identificadores/correos
     * están registrados (enumeración de usuarios).
     */
    @Transactional
    public void olvidePassword(OlvidePasswordRequest request) {
        String valor = request.identificadorOCorreo().trim();
        Usuario usuario = usuarioRepository.findByIdentificador(documentoValidator.normalizar(valor))
                .or(() -> usuarioRepository.findByCorreo(valor.toLowerCase()))
                .orElse(null);

        if (usuario == null) {
            return;
        }

        String token = UUID.randomUUID().toString();
        usuario.setTokenResetPassword(token);
        usuario.setTokenResetExpira(LocalDateTime.now().plusMinutes(RESET_PASSWORD_MINUTOS));
        usuarioRepository.save(usuario);
        emailService.enviarRecuperacionPassword(usuario, token);
    }

    /** Aplica la nueva contraseña asociada a un token de recuperación vigente (RF01). */
    @Transactional
    public void restablecerPassword(RestablecerPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByTokenResetPassword(request.token())
                .orElseThrow(() -> new AuthException(HttpStatus.BAD_REQUEST, "El enlace de recuperación no es válido"));

        if (usuario.getTokenResetExpira() == null || usuario.getTokenResetExpira().isBefore(LocalDateTime.now())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "El enlace de recuperación expiró");
        }

        usuario.setContrasena(passwordEncoder.encode(request.nuevaContrasena()));
        usuario.setTokenResetPassword(null);
        usuario.setTokenResetExpira(null);
        usuarioRepository.save(usuario);
        loginAttemptService.registrarExito(usuario.getIdentificador());
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
