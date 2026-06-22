package cl.duoc.sffe.exception;

import org.springframework.http.HttpStatus;

/**
 * Error de negocio sobre la fiscalización de expedientes en frontera (RF05),
 * con un estado HTTP asociado para devolver mensajes específicos al cliente
 * (404 QR inexistente, 403 rol sin permiso, 409 QR no activo, 400 decisión
 * inválida).
 */
public class FiscalizacionException extends RuntimeException {

    private final HttpStatus status;

    public FiscalizacionException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
