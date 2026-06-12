package cl.duoc.sffe.dto;

/** Respuesta del registro de un pasajero (RF01). */
public record RegisterResponse(
        String mensaje,
        Integer userId
) {
}
