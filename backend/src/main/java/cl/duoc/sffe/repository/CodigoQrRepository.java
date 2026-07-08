package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.CodigoQr;
import cl.duoc.sffe.model.EstadoQr;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acceso a datos de {@link CodigoQr} (RF04, RF05). Relación 1:1 con el viaje.
 */
@Repository
public interface CodigoQrRepository extends JpaRepository<CodigoQr, Integer> {

    /** Validación del QR escaneado por el funcionario (GET /api/qr/validar/{codigo}). */
    Optional<CodigoQr> findByCodigo(String codigo);

    Optional<CodigoQr> findByViajeIdViaje(Integer idViaje);

    /** Códigos QR aún no resueltos: proxy de "pasajeros en cola" para el monitoreo (RF10). */
    long countByEstado(EstadoQr estado);
}
