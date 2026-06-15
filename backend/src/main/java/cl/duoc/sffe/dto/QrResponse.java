package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.CodigoQr;
import cl.duoc.sffe.model.EstadoQr;

import java.time.LocalDateTime;

/**
 * Código QR de un expediente de viaje (RF04, RF05). La imagen PNG viaja
 * codificada en Base64 para mostrarla directamente en el frontend.
 */
public record QrResponse(
        String codigo,
        String imagenBase64,
        EstadoQr estado,
        LocalDateTime fechaGeneracion
) {

    /** Construye la respuesta a partir de la entidad y la imagen ya codificada. */
    public static QrResponse from(CodigoQr codigoQr, String imagenBase64) {
        return new QrResponse(
                codigoQr.getCodigo(),
                imagenBase64,
                codigoQr.getEstado(),
                codigoQr.getFechaGeneracion()
        );
    }
}
