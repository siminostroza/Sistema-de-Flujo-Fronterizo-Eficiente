package cl.duoc.sffe.service;

import cl.duoc.sffe.dto.LoginRequest;
import cl.duoc.sffe.dto.LoginResponse;
import cl.duoc.sffe.dto.RegisterRequest;
import cl.duoc.sffe.dto.RegisterResponse;
import cl.duoc.sffe.exception.AuthException;
import cl.duoc.sffe.model.Rol;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.repository.UsuarioRepository;
import cl.duoc.sffe.security.JwtUtil;
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

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /** Valida credenciales por RUT y devuelve un token JWT (RF01). */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String rut = normalizarRut(request.rut());

        Usuario usuario = usuarioRepository.findByRut(rut)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "RUT o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.contrasena(), usuario.getContrasena())) {
            throw new AuthException(
                    HttpStatus.UNAUTHORIZED, "RUT o contraseña incorrectos");
        }

        String token = jwtUtil.generarToken(usuario.getRut(), usuario.getRol());
        return new LoginResponse(token, usuario.getRol(), usuario.getNombre());
    }

    /** Registra un nuevo pasajero validando unicidad de RUT y correo (RF01). */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String rut = normalizarRut(request.rut());

        if (!rutEsValido(rut)) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST, "El RUT ingresado no es válido");
        }
        if (usuarioRepository.existsByRut(rut)) {
            throw new AuthException(
                    HttpStatus.CONFLICT, "Ya existe una cuenta registrada con este RUT");
        }
        if (usuarioRepository.existsByCorreo(request.correo())) {
            throw new AuthException(
                    HttpStatus.CONFLICT, "Ya existe una cuenta registrada con este correo");
        }

        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .rut(rut)
                .correo(request.correo())
                .contrasena(passwordEncoder.encode(request.contrasena()))
                .nacionalidad(request.nacionalidad() != null
                        ? request.nacionalidad() : "Chilena")
                .telefono(request.telefono() != null ? request.telefono() : "")
                .rol(Rol.PASAJERO)
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
        return new RegisterResponse("Registro exitoso", guardado.getIdUsuario());
    }

    /** Normaliza el RUT: minúsculas, sin puntos ni espacios, con guion. */
    private String normalizarRut(String rut) {
        if (rut == null) {
            return "";
        }
        return rut.replace(".", "").replace(" ", "").trim().toLowerCase();
    }

    /**
     * Valida un RUT chileno (formato cuerpo-dígito) usando módulo 11.
     * Acepta dígito verificador 'k'. El RUT debe venir ya normalizado.
     */
    private boolean rutEsValido(String rut) {
        if (rut == null || !rut.matches("\\d{7,8}-[0-9k]")) {
            return false;
        }
        String[] partes = rut.split("-");
        String cuerpo = partes[0];
        char dvIngresado = partes[1].charAt(0);

        int suma = 0;
        int multiplicador = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += Character.getNumericValue(cuerpo.charAt(i)) * multiplicador;
            multiplicador = (multiplicador == 7) ? 2 : multiplicador + 1;
        }
        int resto = 11 - (suma % 11);
        char dvCalculado;
        if (resto == 11) {
            dvCalculado = '0';
        } else if (resto == 10) {
            dvCalculado = 'k';
        } else {
            dvCalculado = Character.forDigit(resto, 10);
        }
        return dvCalculado == dvIngresado;
    }
}
