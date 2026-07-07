package cl.duoc.sffe.exception;

import org.springframework.http.HttpStatus;

/**
 * Error de negocio sobre archivos adjuntos (carnet de identidad, papeles de
 * antecedentes, permiso notarial), con un estado HTTP asociado.
 */
public class ArchivoException extends RuntimeException {

    private final HttpStatus status;

    public ArchivoException(HttpStatus status, String mensaje) {
        super(mensaje);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
