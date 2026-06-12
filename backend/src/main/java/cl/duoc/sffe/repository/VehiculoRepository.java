package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acceso a datos de {@link Vehiculo} (RF03). Relación 1:1 con el viaje.
 */
@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Integer> {

    Optional<Vehiculo> findByViajeIdViaje(Integer idViaje);

    Optional<Vehiculo> findByPatente(String patente);
}
