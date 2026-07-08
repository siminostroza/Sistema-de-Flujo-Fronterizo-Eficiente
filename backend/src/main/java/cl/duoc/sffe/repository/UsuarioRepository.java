package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acceso a datos de {@link Usuario}. Soporta autenticación y validación de
 * unicidad en el registro (RF01).
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    /** Búsqueda por identificador (RUT, pasaporte, cédula o código temporal), usada en login y validación de registro. */
    Optional<Usuario> findByIdentificador(String identificador);

    Optional<Usuario> findByCorreo(String correo);

    /** Evita identificadores duplicados al registrar un pasajero (RF01). */
    boolean existsByIdentificador(String identificador);

    boolean existsByCorreo(String correo);

    /** Verificación de correo tras el registro (RF01). */
    Optional<Usuario> findByTokenVerificacionCorreo(String token);

    /** Recuperación de contraseña (RF01). */
    Optional<Usuario> findByTokenResetPassword(String token);
}
