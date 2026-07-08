package cl.duoc.sffe.service;

import cl.duoc.sffe.dto.MonitoreoResponse;
import cl.duoc.sffe.model.AuditoriaLog;
import cl.duoc.sffe.model.EstadoQr;
import cl.duoc.sffe.repository.AuditoriaLogRepository;
import cl.duoc.sffe.repository.CodigoQrRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Estado operativo del paso fronterizo (RF10), calculado a partir de datos
 * reales del sistema: la integración con fuentes externas (cámaras, sensores
 * de tránsito) sigue fuera del alcance del prototipo, pero la ocupación y el
 * tiempo de espera ya no son valores fijos simulados.
 */
@Service
public class MonitoreoService {

    private static final List<String> ACCIONES_RESOLUCION = List.of("APROBADO", "RECHAZADO");
    private static final int UMBRAL_ALERTA_PORCENTAJE = 85;

    private final CodigoQrRepository codigoQrRepository;
    private final AuditoriaLogRepository auditoriaLogRepository;
    private final int capacidadMaxima;

    public MonitoreoService(CodigoQrRepository codigoQrRepository,
                             AuditoriaLogRepository auditoriaLogRepository,
                             @Value("${sffe.monitoreo.capacidad-maxima:50}") int capacidadMaxima) {
        this.codigoQrRepository = codigoQrRepository;
        this.auditoriaLogRepository = auditoriaLogRepository;
        this.capacidadMaxima = capacidadMaxima;
    }

    /**
     * Pasajeros en cola = códigos QR ACTIVOS (generados y aún no resueltos
     * por Aduana). Ocupación = esa cantidad sobre una capacidad máxima
     * configurable ({@code sffe.monitoreo.capacidad-maxima}), tope 100%.
     * Tiempo de espera = promedio, en minutos, entre la generación del QR y
     * su resolución (APROBADO/RECHAZADO) de las últimas 20 resoluciones.
     */
    @Transactional(readOnly = true)
    public MonitoreoResponse obtenerEstado() {
        long enCola = codigoQrRepository.countByEstado(EstadoQr.ACTIVO);
        int ocupacionPorcentaje = (int) Math.min(100, Math.round((enCola * 100.0) / capacidadMaxima));

        long tiempoEsperaPromedio = calcularTiempoEsperaPromedioMinutos();

        return new MonitoreoResponse(
                enCola,
                ocupacionPorcentaje,
                tiempoEsperaPromedio,
                ocupacionPorcentaje >= UMBRAL_ALERTA_PORCENTAJE
        );
    }

    private long calcularTiempoEsperaPromedioMinutos() {
        List<AuditoriaLog> resueltosRecientes =
                auditoriaLogRepository.findTop20ByAccionInOrderByFechaDesc(ACCIONES_RESOLUCION);

        List<Long> minutosEspera = new ArrayList<>();
        for (AuditoriaLog log : resueltosRecientes) {
            if (log.getCodigoQr() == null) {
                continue;
            }
            codigoQrRepository.findByCodigo(log.getCodigoQr()).ifPresent(qr -> {
                if (qr.getFechaGeneracion() != null && log.getFecha() != null) {
                    minutosEspera.add(Duration.between(qr.getFechaGeneracion(), log.getFecha()).toMinutes());
                }
            });
        }

        if (minutosEspera.isEmpty()) {
            return 0;
        }
        return Math.round(minutosEspera.stream().mapToLong(Long::longValue).average().orElse(0));
    }
}
