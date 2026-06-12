package cl.duoc.sffe.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Declaración Jurada SAG de un expediente de viaje (RF02). El campo
 * {@code productos} viaja como texto JSON con el detalle declarado.
 */
public record SagRequest(
        @NotNull(message = "Debe indicar si declara productos")
        Boolean declaraProductos,

        String productos
) {
}
