package cl.duoc.sffe.dto;

import jakarta.validation.constraints.NotBlank;

/** Credenciales de inicio de sesión (RF01). */
public record LoginRequest(
        @NotBlank(message = "El identificador es obligatorio")
        String identificador,

        @NotBlank(message = "La contraseña es obligatoria")
        String contrasena
) {
}
