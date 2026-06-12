package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.Viaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de {@link Viaje} (RF02, RF04).
 */
@Repository
public interface ViajeRepository extends JpaRepository<Viaje, Integer> {

    /** Expedientes del usuario autenticado (GET /api/viajes/mis-viajes). */
    List<Viaje> findByUsuarioIdUsuario(Integer idUsuario);

    List<Viaje> findByEstado(EstadoViaje estado);
}
