package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acceso a datos de {@link Vehiculo} (RF03). Relación 1:N con el viaje:
 * hasta un vehículo principal y un remolque por expediente.
 */
@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Integer> {

    List<Vehiculo> findByViajeIdViaje(Integer idViaje);

    /** Busca el vehículo de un viaje según sea principal o remolque. */
    Optional<Vehiculo> findByViajeIdViajeAndEsRemolque(Integer idViaje, Boolean esRemolque);

    Optional<Vehiculo> findByPatente(String patente);
}
