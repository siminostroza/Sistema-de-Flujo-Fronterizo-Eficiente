package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.DeclaracionSag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acceso a datos de {@link DeclaracionSag} (RF02). Relación 1:1 con el viaje.
 */
@Repository
public interface DeclaracionSagRepository extends JpaRepository<DeclaracionSag, Integer> {

    Optional<DeclaracionSag> findByViajeIdViaje(Integer idViaje);
}
