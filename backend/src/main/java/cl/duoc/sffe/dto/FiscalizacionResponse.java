package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.EstadoQr;
import cl.duoc.sffe.model.EstadoViaje;

/**
 * Resultado de una resolución de fiscalización (RF05): mensaje de confirmación
 * y el estado resultante del viaje y del código QR.
 */
public record FiscalizacionResponse(
        String mensaje,
        EstadoViaje estadoViaje,
        EstadoQr estadoQr
) {
}
