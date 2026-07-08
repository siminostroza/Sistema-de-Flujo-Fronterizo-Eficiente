package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.Mascota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/** Acceso a datos de {@link Mascota} asociadas a un expediente de viaje. */
@Repository
public interface MascotaRepository extends JpaRepository<Mascota, Integer> {

    List<Mascota> findByViajeIdViaje(Integer idViaje);
}
