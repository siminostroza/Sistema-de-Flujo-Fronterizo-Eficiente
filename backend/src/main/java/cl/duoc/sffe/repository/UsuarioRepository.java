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

    /** Búsqueda por RUT, usada en login y validación de registro. */
    Optional<Usuario> findByRut(String rut);

    Optional<Usuario> findByCorreo(String correo);

    /** Evita RUT duplicados al registrar un pasajero (RF01). */
    boolean existsByRut(String rut);

    boolean existsByCorreo(String correo);
}
