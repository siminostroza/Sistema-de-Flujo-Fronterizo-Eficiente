package cl.duoc.sffe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Solicitud de resolución de fiscalización de un expediente (RF05).
 * {@code decision} es el nombre de una
 * {@link cl.duoc.sffe.model.DecisionFiscalizacion}.
 */
public record FiscalizacionRequest(
        @NotBlank(message = "Debes indicar la decisión de fiscalización")
        String decision,

        @Size(max = 500, message = "Las observaciones no pueden superar los 500 caracteres")
        String observaciones
) {
}
