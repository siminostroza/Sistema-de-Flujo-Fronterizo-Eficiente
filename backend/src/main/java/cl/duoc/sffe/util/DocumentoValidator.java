package cl.duoc.sffe.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Normalización, validación y generación de identificadores de usuario
 * según su {@link cl.duoc.sffe.model.TipoDocumento} (RF01).
 */
@Component
public class DocumentoValidator {

    private static final String ALFABETO_TEMPORAL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int LARGO_SUFIJO_TEMPORAL = 4;

    private final SecureRandom random = new SecureRandom();

    /** Normaliza un identificador: sin puntos ni espacios, en mayúsculas. */
    public String normalizar(String identificador) {
        if (identificador == null) {
            return "";
        }
        return identificador.replace(".", "").replace(" ", "").trim().toUpperCase();
    }

    /**
     * Valida un RUT chileno (cuerpo-dígito verificador) usando módulo 11.
     * El RUT debe venir ya normalizado (sin puntos, con guion, en mayúsculas).
     */
    public boolean validarRut(String rut) {
        if (rut == null || !rut.matches("\\d{7,8}-[0-9K]")) {
            return false;
        }
        String[] partes = rut.split("-");
        String cuerpo = partes[0];
        char dvIngresado = partes[1].charAt(0);

        // Rechaza cuerpos degenerados (00000000, 11111111, ...): el módulo 11
        // por sí solo los acepta si el DV calza, pero jamás son RUT reales.
        if (cuerpo.chars().distinct().count() == 1) {
            return false;
        }

        int suma = 0;
        int multiplicador = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += Character.getNumericValue(cuerpo.charAt(i)) * multiplicador;
            multiplicador = (multiplicador == 7) ? 2 : multiplicador + 1;
        }
        int resto = 11 - (suma % 11);
        char dvCalculado;
        if (resto == 11) {
            dvCalculado = '0';
        } else if (resto == 10) {
            dvCalculado = 'K';
        } else {
            dvCalculado = Character.forDigit(resto, 10);
        }
        return dvCalculado == dvIngresado;
    }

    /** Valida un pasaporte: alfanumérico, de 6 a 20 caracteres (ya normalizado). */
    public boolean validarPasaporte(String pasaporte) {
        return pasaporte != null && pasaporte.matches("[A-Z0-9]{6,20}");
    }

    /** Valida una cédula extranjera (Mercosur): alfanumérica, de 5 a 15 caracteres (ya normalizada). */
    public boolean validarCedula(String cedula) {
        return cedula != null && cedula.matches("[A-Z0-9]{5,15}");
    }

    /**
     * Genera un identificador temporal único para pasajeros sin documento:
     * {@code TEMP-<epoch-millis>-<4 caracteres alfanuméricos>}.
     */
    public String generarIdentificadorTemporal() {
        StringBuilder sufijo = new StringBuilder(LARGO_SUFIJO_TEMPORAL);
        for (int i = 0; i < LARGO_SUFIJO_TEMPORAL; i++) {
            sufijo.append(ALFABETO_TEMPORAL.charAt(random.nextInt(ALFABETO_TEMPORAL.length())));
        }
        return "TEMP-" + System.currentTimeMillis() + "-" + sufijo;
    }
}
