package cl.duoc.sffe.repository;

import cl.duoc.sffe.model.AuditoriaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de {@link AuditoriaLog}. En el MVP solo se registran
 * eventos básicos (RF09 completo queda postergado).
 */
@Repository
public interface AuditoriaLogRepository extends JpaRepository<AuditoriaLog, Integer> {

    List<AuditoriaLog> findByUsuarioIdUsuario(Integer idUsuario);

    List<AuditoriaLog> findByModulo(String modulo);
}
