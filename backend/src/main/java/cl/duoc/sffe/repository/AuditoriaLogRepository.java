package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.AuditoriaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/** Acceso a datos de {@link AuditoriaLog} (RF05, RF09). */
@Repository
public interface AuditoriaLogRepository extends JpaRepository<AuditoriaLog, Integer> {

    List<AuditoriaLog> findByUsuarioIdUsuario(Integer idUsuario);

    List<AuditoriaLog> findByModulo(String modulo);

    /** Historial del turno de un funcionario: sus registros desde una fecha, más recientes primero (RF05). */
    List<AuditoriaLog> findByUsuarioIdUsuarioAndFechaAfterOrderByFechaDesc(
            Integer idUsuario, LocalDateTime desde);

    /** Auditoría completa del sistema para ADMIN, más recientes primero (RF09). */
    List<AuditoriaLog> findAllByOrderByFechaDesc();

    /** Últimas resoluciones (APROBADO/RECHAZADO), para promediar el tiempo de espera (RF10). */
    List<AuditoriaLog> findTop20ByAccionInOrderByFechaDesc(List<String> acciones);
}
