package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.AuditoriaAdminItemResponse;
import cl.duoc.sffe.repository.AuditoriaLogRepository;
import cl.duoc.sffe.service.ReporteService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints exclusivos de ADMIN (RF06, RF09): auditoría completa del sistema
 * y reportes exportables. {@code /api/admin/**} ya exige rol ADMIN a nivel
 * de filtro en {@code SecurityConfig}; el {@code @PreAuthorize} es
 * defensa en profundidad, mismo patrón que el resto de los controladores.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AuditoriaLogRepository auditoriaLogRepository;
    private final ReporteService reporteService;

    public AdminController(AuditoriaLogRepository auditoriaLogRepository, ReporteService reporteService) {
        this.auditoriaLogRepository = auditoriaLogRepository;
        this.reporteService = reporteService;
    }

    /** Auditoría completa del sistema, más reciente primero (RF09). */
    @GetMapping("/auditoria")
    public ResponseEntity<List<AuditoriaAdminItemResponse>> auditoria() {
        List<AuditoriaAdminItemResponse> items = auditoriaLogRepository.findAllByOrderByFechaDesc()
                .stream()
                .map(AuditoriaAdminItemResponse::from)
                .toList();
        return ResponseEntity.ok(items);
    }

    /** Reporte de trámites y fiscalizaciones en PDF (RF06). */
    @GetMapping("/reportes/pdf")
    public ResponseEntity<byte[]> reportePdf() {
        byte[] pdf = reporteService.generarPdf();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("sffe-reporte.pdf").build().toString())
                .body(pdf);
    }

    /** Reporte de trámites y fiscalizaciones en Excel (RF06). */
    @GetMapping("/reportes/excel")
    public ResponseEntity<byte[]> reporteExcel() {
        byte[] excel = reporteService.generarExcel();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("sffe-reporte.xlsx").build().toString())
                .body(excel);
    }
}
