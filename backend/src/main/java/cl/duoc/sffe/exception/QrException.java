package cl.duoc.sffe.exception;

import org.springframework.http.HttpStatus;

/**
 * Error de negocio sobre códigos QR y su validación (RF04, RF05), con un
 * estado HTTP asociado para devolver mensajes específicos al cliente.
 */
public class QrException extends RuntimeException {

    private final HttpStatus status;

    public QrException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
