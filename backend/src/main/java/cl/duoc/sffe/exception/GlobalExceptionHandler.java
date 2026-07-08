package cl.duoc.sffe.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Manejo centralizado de errores para devolver mensajes específicos al
 * cliente (RF01: mensajes de error específicos).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** Errores de negocio de autenticación/registro con estado HTTP propio. */
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<Map<String, Object>> handleAuth(AuthException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(cuerpo(ex.getStatus(), ex.getMessage()));
    }

    /** Errores de negocio sobre expedientes de viaje con estado HTTP propio (RF02, RF04). */
    @ExceptionHandler(ViajeException.class)
    public ResponseEntity<Map<String, Object>> handleViaje(ViajeException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(cuerpo(ex.getStatus(), ex.getMessage()));
    }

    /** Errores de negocio sobre códigos QR con estado HTTP propio (RF04, RF05). */
    @ExceptionHandler(QrException.class)
    public ResponseEntity<Map<String, Object>> handleQr(QrException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(cuerpo(ex.getStatus(), ex.getMessage()));
    }

    /** Errores de negocio sobre la fiscalización en frontera con estado HTTP propio (RF05). */
    @ExceptionHandler(FiscalizacionException.class)
    public ResponseEntity<Map<String, Object>> handleFiscalizacion(FiscalizacionException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(cuerpo(ex.getStatus(), ex.getMessage()));
    }

    /** Errores de negocio sobre archivos adjuntos, con estado HTTP propio (RF01, RF02). */
    @ExceptionHandler(ArchivoException.class)
    public ResponseEntity<Map<String, Object>> handleArchivo(ArchivoException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(cuerpo(ex.getStatus(), ex.getMessage()));
    }

    /** Falta una parte obligatoria (archivo o datos) en un request multipart. */
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<Map<String, Object>> handleMissingPart(
            MissingServletRequestPartException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(cuerpo(HttpStatus.BAD_REQUEST,
                        "Falta un archivo o dato obligatorio: " + ex.getRequestPartName()));
    }

    /** El request multipart supera el límite configurado (por archivo o en total). */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSize(
            MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(cuerpo(HttpStatus.BAD_REQUEST,
                        "Los archivos adjuntos superan el tamaño máximo permitido"));
    }

    /** Errores de validación de los DTO (@Valid). Devuelve el primer mensaje. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Datos inválidos");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(cuerpo(HttpStatus.BAD_REQUEST, mensaje));
    }

    private Map<String, Object> cuerpo(HttpStatus status, String mensaje) {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("timestamp", LocalDateTime.now().toString());
        cuerpo.put("status", status.value());
        cuerpo.put("error", status.getReasonPhrase());
        cuerpo.put("mensaje", mensaje);
        return cuerpo;
    }
}
