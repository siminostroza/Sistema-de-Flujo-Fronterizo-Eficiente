package cl.duoc.sffe.service;

import cl.duoc.sffe.dto.ExpedienteResponse;
import cl.duoc.sffe.dto.QrResponse;
import cl.duoc.sffe.exception.AuthException;
import cl.duoc.sffe.exception.QrException;
import cl.duoc.sffe.model.CodigoQr;
import cl.duoc.sffe.model.EstadoQr;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.model.Viaje;
import cl.duoc.sffe.repository.CodigoQrRepository;
import cl.duoc.sffe.repository.UsuarioRepository;
import cl.duoc.sffe.repository.ViajeRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.UUID;

/**
 * Generación y validación de códigos QR de expedientes de viaje (RF04, RF05).
 * La imagen PNG no se persiste: se genera a partir del código guardado en
 * {@code codigos_qr} cada vez que se solicita.
 */
@Service
public class QrService {

    private static final int TAMANO_QR = 300;

    private final CodigoQrRepository codigoQrRepository;
    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;

    public QrService(CodigoQrRepository codigoQrRepository,
                      ViajeRepository viajeRepository,
                      UsuarioRepository usuarioRepository) {
        this.codigoQrRepository = codigoQrRepository;
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Genera el código QR del expediente del usuario autenticado, o devuelve
     * el existente si ya está ACTIVO (idempotente) (RF04).
     */
    @Transactional
    public QrResponse generarQR(Integer idViaje, String identificador) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);

        if (viaje.getDeclaracionSag() == null) {
            throw new QrException(HttpStatus.CONFLICT,
                    "Debes completar la Declaración Jurada SAG antes de generar tu código QR");
        }

        CodigoQr codigoQr = codigoQrRepository.findByViajeIdViaje(idViaje).orElse(null);
        if (codigoQr == null || codigoQr.getEstado() != EstadoQr.ACTIVO) {
            String nuevoCodigo = UUID.randomUUID().toString();
            if (codigoQr == null) {
                codigoQr = CodigoQr.builder()
                        .viaje(viaje)
                        .codigo(nuevoCodigo)
                        .estado(EstadoQr.ACTIVO)
                        .build();
            } else {
                codigoQr.setCodigo(nuevoCodigo);
                codigoQr.setEstado(EstadoQr.ACTIVO);
            }
            codigoQr = codigoQrRepository.save(codigoQr);
        }

        return QrResponse.from(codigoQr, generarImagenBase64(codigoQr.getCodigo()));
    }

    /**
     * Valida un código QR escaneado por un funcionario y devuelve el
     * expediente consolidado del viajero, con el identificador enmascarado
     * (RF05, RNF10). El expediente es visible sin importar el estado del QR
     * (ACTIVO, USADO o EXPIRADO): PDI y SAG deben poder consultarlo aunque
     * Aduana ya haya resuelto el ingreso.
     */
    @Transactional(readOnly = true)
    public ExpedienteResponse validarQR(String codigo) {
        CodigoQr codigoQr = codigoQrRepository.findByCodigo(codigo)
                .orElseThrow(() -> new QrException(HttpStatus.NOT_FOUND, "Código QR no encontrado"));

        return ExpedienteResponse.from(codigoQr);
    }

    /** Genera la imagen PNG (300x300) del código QR y la codifica en Base64. */
    private String generarImagenBase64(String contenido) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(contenido, BarcodeFormat.QR_CODE, TAMANO_QR, TAMANO_QR);

            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", salida);

            return Base64.getEncoder().encodeToString(salida.toByteArray());
        } catch (WriterException | IOException e) {
            throw new QrException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo generar el código QR");
        }
    }

    private Usuario obtenerUsuario(String identificador) {
        return usuarioRepository.findByIdentificador(identificador)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "El usuario de la sesión no existe"));
    }

    /** Busca el viaje por id y valida que pertenezca al usuario autenticado. */
    private Viaje obtenerViajeDelUsuario(String identificador, Integer idViaje) {
        Usuario usuario = obtenerUsuario(identificador);

        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new QrException(HttpStatus.NOT_FOUND, "El expediente de viaje no existe"));

        if (!viaje.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new QrException(HttpStatus.FORBIDDEN, "No tienes acceso a este expediente de viaje");
        }

        return viaje;
    }
}
