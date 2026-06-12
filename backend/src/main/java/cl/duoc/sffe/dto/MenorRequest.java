package cl.duoc.sffe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Datos de un menor de edad asociado a un expediente de viaje (RF02). */
public record MenorRequest(
        @NotBlank(message = "El nombre del menor es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String nombre,

        @NotBlank(message = "El RUT del menor es obligatorio")
        @Size(max = 12, message = "El RUT no puede superar los 12 caracteres")
        String rut,

        @NotNull(message = "La fecha de nacimiento es obligatoria")
        LocalDate fechaNacimiento,

        Boolean requiereAutorizacion
) {
}
