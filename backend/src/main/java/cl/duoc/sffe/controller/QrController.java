package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.ExpedienteResponse;
import cl.duoc.sffe.dto.QrResponse;
import cl.duoc.sffe.service.QrService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de generación y validación de códigos QR de expedientes de viaje
 * (RF04, RF05).
 */
@RestController
@RequestMapping("/api/qr")
public class QrController {

    private final QrService qrService;

    public QrController(QrService qrService) {
        this.qrService = qrService;
    }

    /** Genera (o recupera) el código QR del expediente del pasajero autenticado (RF04). */
    @GetMapping("/{idViaje}")
    @PreAuthorize("hasRole('PASAJERO')")
    public ResponseEntity<QrResponse> obtener(
            @PathVariable Integer idViaje, Authentication authentication) {
        return ResponseEntity.ok(qrService.generarQR(idViaje, authentication.getName()));
    }

    /** Valida un código QR escaneado por un funcionario y devuelve el expediente consolidado (RF05). */
    @GetMapping("/validar/{codigo}")
    @PreAuthorize("hasAnyRole('FUNCIONARIO_ADUANA', 'FUNCIONARIO_PDI', 'FUNCIONARIO_SAG', 'ADMIN')")
    public ResponseEntity<ExpedienteResponse> validar(@PathVariable String codigo) {
        return ResponseEntity.ok(qrService.validarQR(codigo));
    }
}
