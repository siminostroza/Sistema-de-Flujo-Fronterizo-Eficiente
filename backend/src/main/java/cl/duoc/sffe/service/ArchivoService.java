package cl.duoc.sffe.service;

import cl.duoc.sffe.exception.ArchivoException;
import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.Mascota;
import cl.duoc.sffe.model.Menor;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.model.Vehiculo;
import cl.duoc.sffe.model.Viaje;
import cl.duoc.sffe.repository.CodigoQrRepository;
import cl.duoc.sffe.repository.MascotaRepository;
import cl.duoc.sffe.repository.MenorRepository;
import cl.duoc.sffe.repository.UsuarioRepository;
import cl.duoc.sffe.repository.VehiculoRepository;
import cl.duoc.sffe.repository.ViajeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Visualización y reemplazo de los archivos adjuntos de un expediente
 * (carnet de identidad, papeles de antecedentes, permiso notarial, permiso
 * de circulación, documentos de mascotas).
 *
 * <p>Dos vías de <b>lectura</b>, cada una en su propia transacción para no
 * arrastrar entidades detached entre servicios: el pasajero dueño del viaje
 * ({@code *Propio}, por {@code idViaje}) y cualquier funcionario de
 * fiscalización ({@code *PorQr}, por el código QR ya escaneado) — mismo
 * criterio que {@code ExpedienteResponse}: todo rol de fiscalización ve el
 * expediente completo, sin restricción adicional por rol.</p>
 *
 * <p>El <b>reemplazo</b> de un archivo ya guardado ({@code reemplazar*}) es
 * exclusivo del pasajero dueño del viaje, y solo mientras el viaje sigue
 * {@code PENDIENTE}: una vez que Aduana resolvió (APROBADO/RECHAZADO), los
 * documentos que sustentaron esa decisión ya no se pueden alterar.</p>
 */
@Service
public class ArchivoService {

    private final ViajeRepository viajeRepository;
    private final CodigoQrRepository codigoQrRepository;
    private final UsuarioRepository usuarioRepository;
    private final MenorRepository menorRepository;
    private final VehiculoRepository vehiculoRepository;
    private final MascotaRepository mascotaRepository;
    private final FileStorageService fileStorageService;

    public ArchivoService(ViajeRepository viajeRepository,
                           CodigoQrRepository codigoQrRepository,
                           UsuarioRepository usuarioRepository,
                           MenorRepository menorRepository,
                           VehiculoRepository vehiculoRepository,
                           MascotaRepository mascotaRepository,
                           FileStorageService fileStorageService) {
        this.viajeRepository = viajeRepository;
        this.codigoQrRepository = codigoQrRepository;
        this.usuarioRepository = usuarioRepository;
        this.menorRepository = menorRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.mascotaRepository = mascotaRepository;
        this.fileStorageService = fileStorageService;
    }

    // ---------- Acceso del pasajero, dueño del viaje ----------

    @Transactional(readOnly = true)
    public ArchivoDescargado archivoUsuarioPropio(String identificador, Integer idViaje, String campo) {
        return archivoUsuario(obtenerViajeDelUsuario(identificador, idViaje), campo);
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado archivoMenorPropio(String identificador, Integer idViaje, Integer idMenor, String campo) {
        return archivoMenor(obtenerViajeDelUsuario(identificador, idViaje), idMenor, campo);
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado archivoVehiculoPropio(String identificador, Integer idViaje, Integer idVehiculo, String campo) {
        return archivoVehiculo(obtenerViajeDelUsuario(identificador, idViaje), idVehiculo, campo);
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado archivoMascotaPropio(String identificador, Integer idViaje, Integer idMascota, String campo) {
        return archivoMascota(obtenerViajeDelUsuario(identificador, idViaje), idMascota, campo);
    }

    // ---------- Reemplazo del pasajero, dueño del viaje, solo si sigue PENDIENTE ----------

    @Transactional
    public void reemplazarArchivoUsuario(String identificador, Integer idViaje, String campo, MultipartFile nuevo) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);
        verificarPendiente(viaje);
        Usuario titular = viaje.getUsuario();
        switch (campo) {
            case "carnet-identidad" -> titular.setCarnetIdentidadPath(
                    fileStorageService.reemplazar(titular.getCarnetIdentidadPath(), nuevo, "usuarios", "tu carnet de identidad"));
            case "papeles-antecedentes" -> titular.setPapelesAntecedentesPath(
                    fileStorageService.reemplazar(titular.getPapelesAntecedentesPath(), nuevo, "usuarios", "tus papeles de antecedentes"));
            default -> throw new ArchivoException(HttpStatus.BAD_REQUEST, "Documento no reconocido");
        }
        usuarioRepository.save(titular);
    }

    @Transactional
    public void reemplazarArchivoMenor(String identificador, Integer idViaje, Integer idMenor, String campo, MultipartFile nuevo) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);
        verificarPendiente(viaje);
        Menor menor = menorDelViaje(viaje, idMenor);
        switch (campo) {
            case "carnet-identidad" -> menor.setCarnetIdentidadPath(
                    fileStorageService.reemplazar(menor.getCarnetIdentidadPath(), nuevo, "menores", "el carnet de identidad del menor"));
            case "papeles-antecedentes" -> menor.setPapelesAntecedentesPath(
                    fileStorageService.reemplazar(menor.getPapelesAntecedentesPath(), nuevo, "menores", "los papeles de antecedentes del menor"));
            case "permiso-notarial" -> menor.setPermisoNotarialPath(
                    fileStorageService.reemplazar(menor.getPermisoNotarialPath(), nuevo, "menores", "el permiso notarial del menor"));
            default -> throw new ArchivoException(HttpStatus.BAD_REQUEST, "Documento no reconocido");
        }
        menorRepository.save(menor);
    }

    @Transactional
    public void reemplazarArchivoVehiculo(String identificador, Integer idViaje, Integer idVehiculo, String campo, MultipartFile nuevo) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);
        verificarPendiente(viaje);
        Vehiculo vehiculo = vehiculoDelViaje(viaje, idVehiculo);
        switch (campo) {
            case "permiso-circulacion" -> vehiculo.setPermisoCirculacionPath(
                    fileStorageService.reemplazar(vehiculo.getPermisoCirculacionPath(), nuevo, "vehiculos", "el permiso de circulación del vehículo"));
            default -> throw new ArchivoException(HttpStatus.BAD_REQUEST, "Documento no reconocido");
        }
        vehiculoRepository.save(vehiculo);
    }

    @Transactional
    public void reemplazarArchivoMascota(String identificador, Integer idViaje, Integer idMascota, String campo, MultipartFile nuevo) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);
        verificarPendiente(viaje);
        Mascota mascota = mascotaDelViaje(viaje, idMascota);
        switch (campo) {
            case "certificado-chip" -> mascota.setCertificadoChipPath(
                    fileStorageService.reemplazar(mascota.getCertificadoChipPath(), nuevo, "mascotas", "el certificado del chip de la mascota"));
            case "carnet-vacunacion" -> mascota.setCarnetVacunacionPath(
                    fileStorageService.reemplazar(mascota.getCarnetVacunacionPath(), nuevo, "mascotas", "el carnet de vacunación de la mascota"));
            default -> throw new ArchivoException(HttpStatus.BAD_REQUEST, "Documento no reconocido");
        }
        mascotaRepository.save(mascota);
    }

    /** Solo se puede modificar documentación mientras el viaje no ha sido fiscalizado. */
    private void verificarPendiente(Viaje viaje) {
        if (viaje.getEstado() != EstadoViaje.PENDIENTE) {
            throw new ArchivoException(HttpStatus.CONFLICT,
                    "No puedes modificar documentos de un expediente que ya fue fiscalizado");
        }
    }

    // ---------- Acceso del funcionario, por QR ya escaneado ----------

    @Transactional(readOnly = true)
    public ArchivoDescargado archivoUsuarioPorQr(String codigo, String campo) {
        return archivoUsuario(obtenerViajePorCodigo(codigo), campo);
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado archivoMenorPorQr(String codigo, Integer idMenor, String campo) {
        return archivoMenor(obtenerViajePorCodigo(codigo), idMenor, campo);
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado archivoVehiculoPorQr(String codigo, Integer idVehiculo, String campo) {
        return archivoVehiculo(obtenerViajePorCodigo(codigo), idVehiculo, campo);
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado archivoMascotaPorQr(String codigo, Integer idMascota, String campo) {
        return archivoMascota(obtenerViajePorCodigo(codigo), idMascota, campo);
    }

    // ---------- Resolución del viaje ----------

    private Viaje obtenerViajeDelUsuario(String identificador, Integer idViaje) {
        Usuario usuario = usuarioRepository.findByIdentificador(identificador)
                .orElseThrow(() -> new ArchivoException(HttpStatus.UNAUTHORIZED, "El usuario de la sesión no existe"));
        Viaje viaje = viajeRepository.findById(idViaje)
                .orElseThrow(() -> new ArchivoException(HttpStatus.NOT_FOUND, "El expediente de viaje no existe"));
        if (!viaje.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new ArchivoException(HttpStatus.FORBIDDEN, "No tienes acceso a este expediente de viaje");
        }
        return viaje;
    }

    private Viaje obtenerViajePorCodigo(String codigo) {
        return codigoQrRepository.findByCodigo(codigo)
                .orElseThrow(() -> new ArchivoException(HttpStatus.NOT_FOUND, "Código QR no encontrado"))
                .getViaje();
    }

    // ---------- Resolución del archivo por entidad y campo ----------

    private ArchivoDescargado archivoUsuario(Viaje viaje, String campo) {
        Usuario titular = viaje.getUsuario();
        String ruta = switch (campo) {
            case "carnet-identidad" -> titular.getCarnetIdentidadPath();
            case "papeles-antecedentes" -> titular.getPapelesAntecedentesPath();
            default -> throw new ArchivoException(HttpStatus.BAD_REQUEST, "Documento no reconocido");
        };
        return fileStorageService.cargar(ruta, "el documento solicitado");
    }

    private ArchivoDescargado archivoMenor(Viaje viaje, Integer idMenor, String campo) {
        Menor menor = menorDelViaje(viaje, idMenor);
        String ruta = switch (campo) {
            case "carnet-identidad" -> menor.getCarnetIdentidadPath();
            case "papeles-antecedentes" -> menor.getPapelesAntecedentesPath();
            case "permiso-notarial" -> menor.getPermisoNotarialPath();
            default -> throw new ArchivoException(HttpStatus.BAD_REQUEST, "Documento no reconocido");
        };
        return fileStorageService.cargar(ruta, "el documento solicitado");
    }

    private ArchivoDescargado archivoVehiculo(Viaje viaje, Integer idVehiculo, String campo) {
        Vehiculo vehiculo = vehiculoDelViaje(viaje, idVehiculo);
        String ruta = switch (campo) {
            case "permiso-circulacion" -> vehiculo.getPermisoCirculacionPath();
            default -> throw new ArchivoException(HttpStatus.BAD_REQUEST, "Documento no reconocido");
        };
        return fileStorageService.cargar(ruta, "el documento solicitado");
    }

    private ArchivoDescargado archivoMascota(Viaje viaje, Integer idMascota, String campo) {
        Mascota mascota = mascotaDelViaje(viaje, idMascota);
        String ruta = switch (campo) {
            case "certificado-chip" -> mascota.getCertificadoChipPath();
            case "carnet-vacunacion" -> mascota.getCarnetVacunacionPath();
            default -> throw new ArchivoException(HttpStatus.BAD_REQUEST, "Documento no reconocido");
        };
        return fileStorageService.cargar(ruta, "el documento solicitado");
    }

    // ---------- Resolución de la entidad hija, verificando que pertenezca al viaje ----------

    private Menor menorDelViaje(Viaje viaje, Integer idMenor) {
        Menor menor = menorRepository.findById(idMenor)
                .orElseThrow(() -> new ArchivoException(HttpStatus.NOT_FOUND, "El menor no existe"));
        if (!menor.getViaje().getIdViaje().equals(viaje.getIdViaje())) {
            throw new ArchivoException(HttpStatus.NOT_FOUND, "El menor no pertenece a este expediente");
        }
        return menor;
    }

    private Vehiculo vehiculoDelViaje(Viaje viaje, Integer idVehiculo) {
        Vehiculo vehiculo = vehiculoRepository.findById(idVehiculo)
                .orElseThrow(() -> new ArchivoException(HttpStatus.NOT_FOUND, "El vehículo no existe"));
        if (!vehiculo.getViaje().getIdViaje().equals(viaje.getIdViaje())) {
            throw new ArchivoException(HttpStatus.NOT_FOUND, "El vehículo no pertenece a este expediente");
        }
        return vehiculo;
    }

    private Mascota mascotaDelViaje(Viaje viaje, Integer idMascota) {
        Mascota mascota = mascotaRepository.findById(idMascota)
                .orElseThrow(() -> new ArchivoException(HttpStatus.NOT_FOUND, "La mascota no existe"));
        if (!mascota.getViaje().getIdViaje().equals(viaje.getIdViaje())) {
            throw new ArchivoException(HttpStatus.NOT_FOUND, "La mascota no pertenece a este expediente");
        }
        return mascota;
    }
}
