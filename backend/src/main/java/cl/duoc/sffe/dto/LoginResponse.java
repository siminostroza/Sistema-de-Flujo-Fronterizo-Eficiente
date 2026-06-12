package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.Rol;

/** Respuesta del login: token JWT y datos mínimos de sesión (RF01). */
public record LoginResponse(
        String token,
        Rol rol,
        String nombre
) {
}
