package cl.duoc.sffe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Datos de una mascota asociada a un expediente de viaje. El certificado del
 * chip y el carnet de vacunación viajan como partes multipart separadas (no
 * en este DTO JSON) y son obligatorios.
 */
public record MascotaRequest(
        @NotBlank(message = "El tipo de animal es obligatorio")
        @Size(max = 50, message = "El tipo de animal no puede superar los 50 caracteres")
        String tipoAnimal,

        @NotBlank(message = "El número de chip es obligatorio")
        @Size(max = 50, message = "El número de chip no puede superar los 50 caracteres")
        String numeroChip
) {
}
