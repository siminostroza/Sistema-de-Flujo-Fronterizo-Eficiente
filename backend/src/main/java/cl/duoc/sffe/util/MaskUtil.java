package cl.duoc.sffe.util;

import cl.duoc.sffe.model.TipoDocumento;

/**
 * Enmascaramiento del identificador del pasajero en vistas de funcionario
 * (RNF10). El pasajero solo ve su propio identificador sin enmascarar.
 */
public final class MaskUtil {

    private MaskUtil() {
    }

    /** Enmascara un identificador según su tipo de documento (RNF10). */
    public static String maskIdentificador(String identificador, TipoDocumento tipo) {
        if (identificador == null || identificador.isBlank()) {
            return "";
        }
        return switch (tipo) {
            case RUT -> maskRut(identificador);
            case PASAPORTE, CEDULA_EXTRANJERA -> maskDocumentoExtranjero(identificador);
            case SIN_DOCUMENTO -> "TEMP-****";
        };
    }

    /** RUT → *****-X (oculta el cuerpo, conserva el dígito verificador). */
    private static String maskRut(String rut) {
        int guion = rut.lastIndexOf('-');
        if (guion < 0) {
            return "*****";
        }
        return "*****-" + rut.substring(guion + 1);
    }

    /** Pasaporte / cédula extranjera → primeros 2 + ****** + último carácter. */
    private static String maskDocumentoExtranjero(String identificador) {
        if (identificador.length() <= 3) {
            return "*".repeat(identificador.length());
        }
        String inicio = identificador.substring(0, 2);
        String fin = identificador.substring(identificador.length() - 1);
        return inicio + "******" + fin;
    }
}
