package cl.duoc.sffe.security;

import cl.duoc.sffe.model.Rol;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utilidades para generar y validar tokens JWT (RF01).
 *
 * <p>El subject del token es el identificador del usuario (RUT, pasaporte,
 * cédula extranjera o código temporal). El rol viaja como claim
 * personalizado "rol" para que el filtro de seguridad pueda autorizar por
 * rol sin consultar la base de datos en cada request.</p>
 */
@Component
public class JwtUtil {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtUtil(
            @Value("${sffe.jwt.secret}") String secret,
            @Value("${sffe.jwt.expiration-ms}") long expirationMs) {
        // HS256 requiere una clave de al menos 256 bits (32 bytes).
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /** Genera un token firmado con el identificador como subject y el rol como claim. */
    public String generarToken(String identificador, Rol rol) {
        Date ahora = new Date();
        Date expira = new Date(ahora.getTime() + expirationMs);
        return Jwts.builder()
                .subject(identificador)
                .claim("rol", rol.name())
                .issuedAt(ahora)
                .expiration(expira)
                .signWith(signingKey)
                .compact();
    }

    /** Extrae el identificador (subject) del token. */
    public String extraerIdentificador(String token) {
        return parseClaims(token).getSubject();
    }

    /** Extrae el rol del token. */
    public Rol extraerRol(String token) {
        String rol = parseClaims(token).get("rol", String.class);
        return Rol.valueOf(rol);
    }

    /** Indica si el token es válido (firma correcta y no expirado). */
    public boolean esValido(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
