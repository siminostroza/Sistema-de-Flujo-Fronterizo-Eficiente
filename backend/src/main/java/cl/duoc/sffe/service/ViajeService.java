package cl.duoc.sffe.service;

import cl.duoc.sffe.dto.MascotaRequest;
import cl.duoc.sffe.dto.MenorRequest;
import cl.duoc.sffe.dto.SagRequest;
import cl.duoc.sffe.dto.VehiculoRequest;
import cl.duoc.sffe.dto.ViajeRequest;
import cl.duoc.sffe.dto.ViajeResponse;
import cl.duoc.sffe.exception.AuthException;
import cl.duoc.sffe.exception.ViajeException;
import cl.duoc.sffe.model.DeclaracionSag;
import cl.duoc.sffe.model.Mascota;
import cl.duoc.sffe.model.Menor;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.model.Vehiculo;
import cl.duoc.sffe.model.Viaje;
import cl.duoc.sffe.repository.DeclaracionSagRepository;
import cl.duoc.sffe.repository.MascotaRepository;
import cl.duoc.sffe.repository.MenorRepository;
import cl.duoc.sffe.repository.UsuarioRepository;
import cl.duoc.sffe.repository.VehiculoRepository;
import cl.duoc.sffe.repository.ViajeRepository;
import cl.duoc.sffe.util.DocumentoValidator;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

/**
 * Lógica de negocio de expedientes de viaje: itinerario, menores, vehículo y
 * declaración SAG (RF02, RF03, RF04). Todas las operaciones se acotan al
 * usuario autenticado, identificado por su identificador a partir del JWT.
 */
@Service
public class ViajeService {

    private final ViajeRepository viajeRepository;
    private final MenorRepository menorRepository;
    private final VehiculoRepository vehiculoRepository;
    private final MascotaRepository mascotaRepository;
    private final DeclaracionSagRepository declaracionSagRepository;
    private final UsuarioRepository usuarioRepository;
    private final DocumentoValidator documentoValidator;
    private final FileStorageService fileStorageService;

    public ViajeService(ViajeRepository viajeRepository,
                        MenorRepository menorRepository,
                        VehiculoRepository vehiculoRepository,
                        MascotaRepository mascotaRepository,
                        DeclaracionSagRepository declaracionSagRepository,
                        UsuarioRepository usuarioRepository,
                        DocumentoValidator documentoValidator,
                        FileStorageService fileStorageService) {
        this.viajeRepository = viajeRepository;
        this.menorRepository = menorRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.mascotaRepository = mascotaRepository;
        this.declaracionSagRepository = declaracionSagRepository;
        this.usuarioRepository = usuarioRepository;
        this.documentoValidator = documentoValidator;
        this.fileStorageService = fileStorageService;
    }

    /** Crea un nuevo expediente de viaje asociado al usuario autenticado (RF02). */
    @Transactional
    public ViajeResponse crear(String identificador, ViajeRequest request) {
        Usuario usuario = obtenerUsuario(identificador);

        Viaje viaje = Viaje.builder()
                .usuario(usuario)
                .fechaIngreso(request.fechaIngreso())
                .destino(request.destino())
                .paisOrigen(request.paisOrigen())
                .pasoFronterizo(request.pasoFronterizo())
                .motivoViaje(request.motivoViaje())
                .build();

        return ViajeResponse.from(viajeRepository.save(viaje));
    }

    /** Lista los expedientes de viaje del usuario autenticado (RF04). */
    @Transactional(readOnly = true)
    public List<ViajeResponse> misViajes(String identificador) {
        Usuario usuario = obtenerUsuario(identificador);
        return viajeRepository.findByUsuarioIdUsuario(usuario.getIdUsuario())
                .stream()
                .map(ViajeResponse::from)
                .toList();
    }

    /** Obtiene el detalle de un expediente, solo si pertenece al usuario autenticado (RF04). */
    @Transactional(readOnly = true)
    public ViajeResponse obtener(String identificador, Integer idViaje) {
        return ViajeResponse.from(obtenerViajeDelUsuario(identificador, idViaje));
    }

    /** Actualiza los datos del itinerario de un expediente propio (RF02). */
    @Transactional
    public ViajeResponse actualizar(String identificador, Integer idViaje, ViajeRequest request) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);

        viaje.setFechaIngreso(request.fechaIngreso());
        viaje.setDestino(request.destino());
        viaje.setPaisOrigen(request.paisOrigen());
        viaje.setPasoFronterizo(request.pasoFronterizo());
        viaje.setMotivoViaje(request.motivoViaje());

        return ViajeResponse.from(viajeRepository.save(viaje));
    }

    /**
     * Agrega un menor de edad al expediente de viaje (RF02). El RUT se valida
     * con el mismo algoritmo módulo 11 que el identificador del usuario, la
     * fecha de nacimiento debe corresponder a una persona menor de 18 años a
     * la fecha de ingreso, y el carnet de identidad y los papeles de
     * antecedentes son obligatorios; el permiso notarial es obligatorio solo
     * cuando {@code requiereAutorizacion = true}.
     */
    @Transactional
    public ViajeResponse agregarMenor(String identificador, Integer idViaje, MenorRequest request,
                                       MultipartFile carnetIdentidad,
                                       MultipartFile papelesAntecedentes,
                                       MultipartFile permisoNotarial) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);

        String rutNormalizado = documentoValidator.normalizar(request.rut());
        if (!documentoValidator.validarRut(rutNormalizado)) {
            throw new ViajeException(HttpStatus.BAD_REQUEST, "El RUT del menor no es válido");
        }

        LocalDate fechaNacimiento = request.fechaNacimiento();
        if (fechaNacimiento.isAfter(LocalDate.now())) {
            throw new ViajeException(HttpStatus.BAD_REQUEST,
                    "La fecha de nacimiento del menor no es válida");
        }
        boolean esMenorDeEdad = fechaNacimiento.isAfter(viaje.getFechaIngreso().minusYears(18));
        if (!esMenorDeEdad) {
            throw new ViajeException(HttpStatus.BAD_REQUEST,
                    "La fecha de nacimiento indicada corresponde a una persona mayor de edad");
        }

        boolean requiereAutorizacion =
                request.requiereAutorizacion() != null && request.requiereAutorizacion();

        String carnetPath = fileStorageService.guardarObligatorio(
                carnetIdentidad, "menores", "el carnet de identidad del menor");
        String antecedentesPath = fileStorageService.guardarObligatorio(
                papelesAntecedentes, "menores", "los papeles de antecedentes del menor");
        String permisoPath = requiereAutorizacion
                ? fileStorageService.guardarObligatorio(
                        permisoNotarial, "menores", "el permiso notarial del menor")
                : fileStorageService.guardarOpcional(
                        permisoNotarial, "menores", "el permiso notarial del menor");

        Menor menor = Menor.builder()
                .viaje(viaje)
                .nombre(request.nombre())
                .rut(rutNormalizado)
                .fechaNacimiento(fechaNacimiento)
                .requiereAutorizacion(requiereAutorizacion)
                .carnetIdentidadPath(carnetPath)
                .papelesAntecedentesPath(antecedentesPath)
                .permisoNotarialPath(permisoPath)
                .build();

        menorRepository.save(menor);

        // No se agrega "menor" manualmente a viaje.getMenores(): al ser una
        // colección perezosa, acceder a ella aquí dispara su carga desde BD
        // (ya incluye el menor recién guardado) y duplicaría la entrada.
        return ViajeResponse.from(viaje);
    }

    /**
     * Registra o actualiza un vehículo del expediente (RF03). Un viaje admite
     * como máximo un vehículo principal y un remolque; la operación es un upsert
     * por tipo (busca por {@code esRemolque}, crea si no existe, actualiza si ya
     * existe). El remolque exige que el vehículo principal ya esté registrado.
     * El permiso de circulación es obligatorio para cualquiera de los dos
     * (RF03) y queda visible para Aduana y PDI en el expediente consolidado.
     */
    @Transactional
    public ViajeResponse registrarVehiculo(String identificador, Integer idViaje, VehiculoRequest request,
                                            MultipartFile permisoCirculacion) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);

        boolean esRemolque = Boolean.TRUE.equals(request.esRemolque());

        Vehiculo principal = vehiculoRepository
                .findByViajeIdViajeAndEsRemolque(idViaje, false)
                .orElse(null);

        if (esRemolque && principal == null) {
            throw new ViajeException(HttpStatus.CONFLICT,
                    "Debes registrar el vehículo principal antes del remolque");
        }

        if (!esRemolque && (isBlank(request.marca()) || isBlank(request.modelo()) || request.anio() == null)) {
            throw new ViajeException(HttpStatus.BAD_REQUEST,
                    "Marca, modelo y año son obligatorios para el vehículo principal");
        }

        String permisoPath = fileStorageService.guardarObligatorio(
                permisoCirculacion, "vehiculos", "el permiso de circulación del vehículo");

        Vehiculo vehiculo = vehiculoRepository
                .findByViajeIdViajeAndEsRemolque(idViaje, esRemolque)
                .orElseGet(() -> Vehiculo.builder().viaje(viaje).esRemolque(esRemolque).build());

        vehiculo.setPatente(request.patente().toUpperCase());
        vehiculo.setMarca(request.marca());
        vehiculo.setModelo(request.modelo());
        vehiculo.setAnio(request.anio());
        vehiculo.setEsRemolque(esRemolque);
        vehiculo.setVehiculoPrincipalId(esRemolque ? principal.getIdVehiculo() : null);
        vehiculo.setPermisoCirculacionPath(permisoPath);

        vehiculoRepository.save(vehiculo);

        // No se agrega manualmente a viaje.getVehiculos(): la colección perezosa
        // aún no se ha cargado, así que ViajeResponse.from la leerá fresca desde
        // BD (incluyendo el vehículo recién guardado), igual que con los menores.
        return ViajeResponse.from(viaje);
    }

    /**
     * Agrega una mascota al expediente (RF02). El tipo de animal y el número
     * de chip son obligatorios (@NotBlank en {@link MascotaRequest}); el
     * certificado del chip y el carnet de vacunación son obligatorios como
     * archivos adjuntos. Visible para toda fiscalización (Aduana, PDI, SAG).
     */
    @Transactional
    public ViajeResponse agregarMascota(String identificador, Integer idViaje, MascotaRequest request,
                                         MultipartFile certificadoChip, MultipartFile carnetVacunacion) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);

        String certificadoPath = fileStorageService.guardarObligatorio(
                certificadoChip, "mascotas", "el certificado del chip de la mascota");
        String vacunacionPath = fileStorageService.guardarObligatorio(
                carnetVacunacion, "mascotas", "el carnet de vacunación de la mascota");

        Mascota mascota = Mascota.builder()
                .viaje(viaje)
                .tipoAnimal(request.tipoAnimal())
                .numeroChip(request.numeroChip())
                .certificadoChipPath(certificadoPath)
                .carnetVacunacionPath(vacunacionPath)
                .build();

        mascotaRepository.save(mascota);

        // No se agrega manualmente a viaje.getMascotas(): igual que con menores
        // y vehículos, ViajeResponse.from relee la colección perezosa desde BD.
        return ViajeResponse.from(viaje);
    }

    /** Guarda o actualiza la Declaración Jurada SAG del expediente, relación 1:1 (RF02). */
    @Transactional
    public ViajeResponse guardarSag(String identificador, Integer idViaje, SagRequest request) {
        Viaje viaje = obtenerViajeDelUsuario(identificador, idViaje);

        boolean declaraDivisas = Boolean.TRUE.equals(request.declaraDivisas());
        if (declaraDivisas
                && (request.montoDivisas() == null
                        || request.montoDivisas().compareTo(java.math.BigDecimal.ZERO) <= 0)) {
            throw new ViajeException(HttpStatus.BAD_REQUEST,
                    "Si declara divisas, debe indicar un monto mayor a cero");
        }

        DeclaracionSag sag = declaracionSagRepository.findByViajeIdViaje(idViaje)
                .orElseGet(() -> DeclaracionSag.builder().viaje(viaje).build());

        // Sección SAG
        sag.setDeclaraProductos(request.declaraProductos());
        sag.setProductos(request.productos());

        // Sección Aduanas: si no declara, se descartan los detalles asociados.
        sag.setDeclaraDivisas(declaraDivisas);
        sag.setMontoDivisas(declaraDivisas ? request.montoDivisas() : null);
        sag.setMonedaDivisas(declaraDivisas ? request.monedaDivisas() : null);

        boolean declaraMercancias = Boolean.TRUE.equals(request.declaraMercancias());
        sag.setDeclaraMercancias(declaraMercancias);
        sag.setDetalleMercancias(declaraMercancias ? request.detalleMercancias() : null);

        viaje.setDeclaracionSag(declaracionSagRepository.save(sag));

        return ViajeResponse.from(viaje);
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.isBlank();
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
                .orElseThrow(() -> new ViajeException(
                        HttpStatus.NOT_FOUND, "El expediente de viaje no existe"));

        if (!viaje.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new ViajeException(
                    HttpStatus.FORBIDDEN, "No tienes acceso a este expediente de viaje");
        }

        return viaje;
    }
}
