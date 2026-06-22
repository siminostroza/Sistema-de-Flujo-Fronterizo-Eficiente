package cl.duoc.sffe.exception;

import org.springframework.http.HttpStatus;

/**
 * Error de negocio sobre expedientes de viaje (RF02, RF04), con un estado
 * HTTP asociado para devolver mensajes específicos al cliente.
 */
public class ViajeException extends RuntimeException {

    private final HttpStatus status;

    public ViajeException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
