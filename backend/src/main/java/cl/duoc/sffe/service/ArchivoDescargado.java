package cl.duoc.sffe.service;

/** Contenido binario de un archivo adjunto y su content-type, listo para responder al cliente. */
public record ArchivoDescargado(byte[] contenido, String contentType) {
}
