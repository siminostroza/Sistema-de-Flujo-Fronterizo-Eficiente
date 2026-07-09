package cl.duoc.sffe.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Nuevo correo electrónico para el perfil del pasajero autenticado (RF01). */
public record ActualizarCorreoRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        String correo
) {
}
