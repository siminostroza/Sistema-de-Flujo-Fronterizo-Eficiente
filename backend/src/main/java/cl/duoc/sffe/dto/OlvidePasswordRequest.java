package cl.duoc.sffe.dto;

import jakarta.validation.constraints.NotBlank;

/** Solicitud de recuperación de contraseña por identificador (RUT, pasaporte, etc.) o correo (RF01). */
public record OlvidePasswordRequest(
        @NotBlank(message = "Ingresa tu identificador o tu correo")
        String identificadorOCorreo
) {
}
