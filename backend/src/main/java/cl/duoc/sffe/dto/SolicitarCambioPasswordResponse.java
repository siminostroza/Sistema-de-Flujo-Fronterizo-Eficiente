package cl.duoc.sffe.dto;

/**
 * Confirmación de que se envió el correo de cambio de contraseña (RF01).
 *
 * <p>{@code token} viaja también en la respuesta —fuera del flujo normal de
 * recuperación, donde el token solo llega por correo— porque este endpoint
 * exige sesión activa: quien lo llama ya demostró ser dueño de la cuenta con
 * su JWT, así que exponerlo aquí no abre una vía nueva de account takeover.
 * Se usa exclusivamente para que, en el prototipo de pruebas, el botón
 * "Cambiar contraseña" del perfil pueda abrir directamente la pestaña de
 * restablecimiento sin depender de revisar Mailpit.</p>
 */
public record SolicitarCambioPasswordResponse(String mensaje, String token) {
}
