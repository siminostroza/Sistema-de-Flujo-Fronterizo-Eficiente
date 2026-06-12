package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.Menor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de {@link Menor} asociados a un expediente de viaje (RF02).
 */
@Repository
public interface MenorRepository extends JpaRepository<Menor, Integer> {

    List<Menor> findByViajeIdViaje(Integer idViaje);
}
