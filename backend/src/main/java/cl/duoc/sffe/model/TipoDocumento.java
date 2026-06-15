package cl.duoc.sffe.model;

/**
 * Tipo de documento de identidad de un usuario (RF01). Determina cómo se
 * valida, normaliza y enmascara su {@code identificador}.
 */
public enum TipoDocumento {
    RUT,
    PASAPORTE,
    CEDULA_EXTRANJERA,
    SIN_DOCUMENTO
}
