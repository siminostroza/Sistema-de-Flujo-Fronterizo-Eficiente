package cl.duoc.sffe.dto;

/**
 * Respuesta del registro de un pasajero (RF01).
 *
 * <p>{@code identificador} devuelve el valor normalizado guardado; para
 * SIN_DOCUMENTO es el código temporal generado por el backend, que el
 * pasajero debe conservar para iniciar sesión.</p>
 */
public record RegisterResponse(
        String mensaje,
        Integer userId,
        String identificador
) {
}
