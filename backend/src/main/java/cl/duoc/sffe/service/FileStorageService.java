package cl.duoc.sffe.service;

import cl.duoc.sffe.exception.ArchivoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Almacenamiento en disco de archivos adjuntos (carnet de identidad, papeles
 * de antecedentes, permiso notarial). Valida extensión y tamaño antes de
 * guardar; el nombre guardado siempre es un UUID generado por el servidor
 * (el nombre original del archivo nunca se usa como ruta de destino, para
 * evitar path traversal).
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final Set<String> EXTENSIONES_PERMITIDAS = Set.of("pdf", "jpg", "jpeg", "png");
    private static final long TAMANO_MAXIMO_BYTES = 5L * 1024 * 1024; // 5 MB

    private final Path directorioBase;

    public FileStorageService(@Value("${sffe.upload.dir:uploads}") String directorio) {
        this.directorioBase = Paths.get(directorio).toAbsolutePath().normalize();
        try {
            Files.createDirectories(directorioBase);
        } catch (IOException e) {
            throw new UncheckedIOException(
                    "No se pudo inicializar el directorio de archivos adjuntos", e);
        }
    }

    /** Guarda un archivo obligatorio; lanza 400 si no viene adjunto o no es válido. */
    public String guardarObligatorio(MultipartFile archivo, String subcarpeta, String etiqueta) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ArchivoException(HttpStatus.BAD_REQUEST,
                    "Debes adjuntar " + etiqueta + " para continuar");
        }
        return guardar(archivo, subcarpeta, etiqueta);
    }

    /** Guarda un archivo opcional; devuelve {@code null} si no viene adjunto. */
    public String guardarOpcional(MultipartFile archivo, String subcarpeta, String etiqueta) {
        if (archivo == null || archivo.isEmpty()) {
            return null;
        }
        return guardar(archivo, subcarpeta, etiqueta);
    }

    /**
     * Lee de disco un archivo previamente guardado con {@link #guardar} y
     * devuelve su contenido junto al content-type derivado de la extensión,
     * para que el pasajero y el funcionario puedan visualizarlo.
     */
    public ArchivoDescargado cargar(String rutaRelativa, String etiqueta) {
        if (rutaRelativa == null || rutaRelativa.isBlank()) {
            throw new ArchivoException(HttpStatus.NOT_FOUND, "No hay " + etiqueta + " adjuntado");
        }

        Path destino = directorioBase.resolve(rutaRelativa).normalize();
        if (!destino.startsWith(directorioBase)) {
            throw new ArchivoException(HttpStatus.BAD_REQUEST, "Ruta de archivo inválida");
        }
        if (!Files.isRegularFile(destino)) {
            throw new ArchivoException(HttpStatus.NOT_FOUND, "El archivo ya no está disponible");
        }

        try {
            byte[] contenido = Files.readAllBytes(destino);
            return new ArchivoDescargado(contenido, mimeDe(extensionDe(rutaRelativa)));
        } catch (IOException e) {
            throw new ArchivoException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo leer " + etiqueta);
        }
    }

    /**
     * Reemplaza un archivo ya guardado: valida y guarda el nuevo, y solo si
     * eso funciona borra el anterior de disco (best-effort; un fallo al
     * borrar el viejo no revierte el reemplazo, solo queda un huérfano).
     */
    public String reemplazar(String rutaAnterior, MultipartFile nuevoArchivo, String subcarpeta, String etiqueta) {
        String nuevaRuta = guardarObligatorio(nuevoArchivo, subcarpeta, etiqueta);
        eliminarSilencioso(rutaAnterior);
        return nuevaRuta;
    }

    private void eliminarSilencioso(String rutaRelativa) {
        if (rutaRelativa == null || rutaRelativa.isBlank()) {
            return;
        }
        try {
            Path destino = directorioBase.resolve(rutaRelativa).normalize();
            if (destino.startsWith(directorioBase)) {
                Files.deleteIfExists(destino);
            }
        } catch (IOException e) {
            log.warn("No se pudo eliminar el archivo reemplazado: {}", rutaRelativa, e);
        }
    }

    private String mimeDe(String extension) {
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> "application/octet-stream";
        };
    }

    private String guardar(MultipartFile archivo, String subcarpeta, String etiqueta) {
        if (archivo.getSize() > TAMANO_MAXIMO_BYTES) {
            throw new ArchivoException(HttpStatus.BAD_REQUEST,
                    "El archivo de " + etiqueta + " no puede superar los 5 MB");
        }

        String extension = extensionDe(archivo.getOriginalFilename());
        if (!EXTENSIONES_PERMITIDAS.contains(extension)) {
            throw new ArchivoException(HttpStatus.BAD_REQUEST,
                    "El archivo de " + etiqueta + " debe ser PDF, JPG o PNG");
        }

        String nombreGuardado = UUID.randomUUID() + "." + extension;
        Path destinoDir = directorioBase.resolve(subcarpeta).normalize();
        Path destino = destinoDir.resolve(nombreGuardado);

        try {
            Files.createDirectories(destinoDir);
            archivo.transferTo(destino);
        } catch (IOException e) {
            throw new ArchivoException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudo guardar el archivo de " + etiqueta);
        }

        return subcarpeta + "/" + nombreGuardado;
    }

    private String extensionDe(String nombreOriginal) {
        if (nombreOriginal == null || !nombreOriginal.contains(".")) {
            return "";
        }
        return nombreOriginal
                .substring(nombreOriginal.lastIndexOf('.') + 1)
                .toLowerCase(Locale.ROOT);
    }
}
