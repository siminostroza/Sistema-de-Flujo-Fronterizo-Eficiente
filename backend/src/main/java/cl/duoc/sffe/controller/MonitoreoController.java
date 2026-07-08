package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.MonitoreoResponse;
import cl.duoc.sffe.service.MonitoreoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Monitoreo del paso fronterizo (RF10), visible para Aduana (lectura) y
 * ADMIN — mismo criterio de roles que la ruta /monitoreo del frontend.
 * No cae bajo {@code /api/admin/**} porque ese matcher exige rol ADMIN
 * exclusivamente; acá se necesita además FUNCIONARIO_ADUANA.
 */
@RestController
@RequestMapping("/api/monitoreo")
@PreAuthorize("hasAnyRole('FUNCIONARIO_ADUANA', 'ADMIN')")
public class MonitoreoController {

    private final MonitoreoService monitoreoService;

    public MonitoreoController(MonitoreoService monitoreoService) {
        this.monitoreoService = monitoreoService;
    }

    /** Estado operativo actual del paso fronterizo, calculado a partir de datos reales (RF10). */
    @GetMapping
    public ResponseEntity<MonitoreoResponse> estado() {
        return ResponseEntity.ok(monitoreoService.obtenerEstado());
    }
}
