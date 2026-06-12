package cl.duoc.sffe.exception;

import org.springframework.http.HttpStatus;

/**
 * Error de autenticación o registro con un estado HTTP asociado, para devolver
 * mensajes específicos al cliente (RF01).
 */
public class AuthException extends RuntimeException {

    private final HttpStatus status;

    public AuthException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
