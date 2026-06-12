package cl.duoc.sffe.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Datos del vehículo asociado a un expediente de viaje (RF03). */
public record VehiculoRequest(
        @NotBlank(message = "La patente es obligatoria")
        @Size(max = 10, message = "La patente no puede superar los 10 caracteres")
        String patente,

        @NotBlank(message = "La marca es obligatoria")
        @Size(max = 50, message = "La marca no puede superar los 50 caracteres")
        String marca,

        @NotBlank(message = "El modelo es obligatorio")
        @Size(max = 50, message = "El modelo no puede superar los 50 caracteres")
        String modelo,

        @NotNull(message = "El año es obligatorio")
        @Min(value = 1990, message = "El año debe ser igual o posterior a 1990")
        @Max(value = 2100, message = "El año ingresado no es válido")
        Integer anio
) {
}
