package cl.duoc.sffe.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Declaración Jurada del expediente de viaje (RF02). Reúne la declaración SAG
 * (productos regulados) y la declaración de Aduanas (divisas y mercancías).
 * El campo {@code productos} viaja como texto JSON con el detalle SAG.
 *
 * <p>La regla "si declara divisas, el monto es obligatorio y mayor a cero" es
 * condicional entre campos, por lo que se valida en
 * {@code ViajeService.guardarSag} (no con anotaciones de Bean Validation).
 */
public record SagRequest(
        // --- Sección SAG ---
        @NotNull(message = "Debe indicar si declara productos")
        Boolean declaraProductos,

        String productos,

        // --- Sección Aduanas ---
        @NotNull(message = "Debe indicar si porta divisas")
        Boolean declaraDivisas,

        BigDecimal montoDivisas,

        String monedaDivisas,

        @NotNull(message = "Debe indicar si transporta mercancías")
        Boolean declaraMercancias,

        String detalleMercancias
) {
}
