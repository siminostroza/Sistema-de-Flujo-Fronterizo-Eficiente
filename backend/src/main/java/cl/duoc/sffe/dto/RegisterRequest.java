package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.TipoDocumento;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Datos de registro de un pasajero (RF01). El rol siempre será PASAJERO;
 * los funcionarios y administradores se crean por otra vía (semilla / admin).
 *
 * <p>El campo {@code identificador} es obligatorio para los tipos RUT,
 * PASAPORTE y CEDULA_EXTRANJERA. Para SIN_DOCUMENTO puede venir vacío o nulo:
 * el backend genera un código temporal único.</p>
 *
 * <p>El carnet de identidad y los papeles de antecedentes viajan como partes
 * multipart separadas (no en este DTO JSON): son obligatorios salvo para
 * SIN_DOCUMENTO, ya que ese tipo de documento implica precisamente no tener
 * carnet que adjuntar.</p>
 */
public record RegisterRequest(
        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @NotNull(message = "El tipo de documento es obligatorio")
        TipoDocumento tipoDocumento,

        @Size(max = 30, message = "El identificador no puede superar los 30 caracteres")
        String identificador,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        String contrasena,

        String nacionalidad,

        String telefono,

        @NotNull(message = "La fecha de nacimiento es obligatoria")
        @Past(message = "La fecha de nacimiento debe ser anterior a hoy")
        LocalDate fechaNacimiento
) {
}
