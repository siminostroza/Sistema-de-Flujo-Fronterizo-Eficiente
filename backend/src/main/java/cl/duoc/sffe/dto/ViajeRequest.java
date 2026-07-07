package cl.duoc.sffe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Datos de un expediente de viaje, para crear o actualizar (RF02). */
public record ViajeRequest(
        @NotNull(message = "La fecha de ingreso es obligatoria")
        LocalDate fechaIngreso,

        @NotBlank(message = "El destino es obligatorio")
        @Size(max = 100, message = "El destino no puede superar los 100 caracteres")
        String destino,

        @NotBlank(message = "El paso fronterizo es obligatorio")
        @Size(max = 100, message = "El paso fronterizo no puede superar los 100 caracteres")
        String pasoFronterizo,

        @Size(max = 100, message = "El país de origen no puede superar los 100 caracteres")
        String paisOrigen,

        @NotBlank(message = "El motivo del viaje es obligatorio")
        @Size(max = 200, message = "El motivo de viaje no puede superar los 200 caracteres")
        String motivoViaje
) {
}
