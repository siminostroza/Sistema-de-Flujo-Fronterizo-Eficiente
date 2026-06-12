package cl.duoc.sffe.service;

import cl.duoc.sffe.dto.MenorRequest;
import cl.duoc.sffe.dto.SagRequest;
import cl.duoc.sffe.dto.VehiculoRequest;
import cl.duoc.sffe.dto.ViajeRequest;
import cl.duoc.sffe.dto.ViajeResponse;
import cl.duoc.sffe.exception.AuthException;
import cl.duoc.sffe.exception.ViajeException;
import cl.duoc.sffe.model.DeclaracionSag;
import cl.duoc.sffe.model.Menor;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.model.Vehiculo;
import cl.duoc.sffe.model.Viaje;
import cl.duoc.sffe.repository.DeclaracionSagRepository;
import cl.duoc.sffe.repository.MenorRepository;
import cl.duoc.sffe.repository.UsuarioRepository;
import cl.duoc.sffe.repository.VehiculoRepository;
import cl.duoc.sffe.repository.ViajeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Lógica de negocio de expedientes de viaje: itinerario, menores, vehículo y
 * declaración SAG (RF02, RF03, RF04). Todas las operaciones se acotan al
 * usuario autenticado, identificado por su RUT a partir del JWT.
 */
@Service
public class ViajeService {

    private final ViajeRepository viajeRepository;
    private final MenorRepository menorRepository;
    private final VehiculoRepository vehiculoRepository;
    private final DeclaracionSagRepository declaracionSagRepository;
    private final UsuarioRepository usuarioRepository;

    public ViajeService(ViajeRepository viajeRepository,
                        MenorRepository menorRepository,
                        VehiculoRepository vehiculoRepository,
                        DeclaracionSagRepository declaracionSagRepository,
                        UsuarioRepository usuarioRepository) {
        this.viajeRepository = viajeRepository;
        this.menorRepository = menorRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.declaracionSagRepository = declaracionSagRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /** Crea un nuevo expediente de viaje asociado al usuario autenticado (RF02). */
    @Transactional
    public ViajeResponse crear(String rut, ViajeRequest request) {
        Usuario usuario = obtenerUsuario(rut);

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
    public List<ViajeResponse> misViajes(String rut) {
        Usuario usuario = obtenerUsuario(rut);
        return viajeRepository.findByUsuarioIdUsuario(usuario.getIdUsuario())
                .stream()
                .map(ViajeResponse::from)
                .toList();
    }

    /** Obtiene el detalle de un expediente, solo si pertenece al usuario autenticado (RF04). */
    @Transactional(readOnly = true)
    public ViajeResponse obtener(String rut, Integer idViaje) {
        return ViajeResponse.from(obtenerViajeDelUsuario(rut, idViaje));
    }

    /** Actualiza los datos del itinerario de un expediente propio (RF02). */
    @Transactional
    public ViajeResponse actualizar(String rut, Integer idViaje, ViajeRequest request) {
        Viaje viaje = obtenerViajeDelUsuario(rut, idViaje);

        viaje.setFechaIngreso(request.fechaIngreso());
        viaje.setDestino(request.destino());
        viaje.setPaisOrigen(request.paisOrigen());
        viaje.setPasoFronterizo(request.pasoFronterizo());
        viaje.setMotivoViaje(request.motivoViaje());

        return ViajeResponse.from(viajeRepository.save(viaje));
    }

    /** Agrega un menor de edad al expediente de viaje (RF02). */
    @Transactional
    public ViajeResponse agregarMenor(String rut, Integer idViaje, MenorRequest request) {
        Viaje viaje = obtenerViajeDelUsuario(rut, idViaje);

        Menor menor = Menor.builder()
                .viaje(viaje)
                .nombre(request.nombre())
                .rut(request.rut())
                .fechaNacimiento(request.fechaNacimiento())
                .requiereAutorizacion(
                        request.requiereAutorizacion() != null && request.requiereAutorizacion())
                .build();

        menorRepository.save(menor);

        // No se agrega "menor" manualmente a viaje.getMenores(): al ser una
        // colección perezosa, acceder a ella aquí dispara su carga desde BD
        // (ya incluye el menor recién guardado) y duplicaría la entrada.
        return ViajeResponse.from(viaje);
    }

    /** Registra o actualiza el vehículo asociado al expediente, relación 1:1 (RF03). */
    @Transactional
    public ViajeResponse registrarVehiculo(String rut, Integer idViaje, VehiculoRequest request) {
        Viaje viaje = obtenerViajeDelUsuario(rut, idViaje);

        Vehiculo vehiculo = vehiculoRepository.findByViajeIdViaje(idViaje)
                .orElseGet(() -> Vehiculo.builder().viaje(viaje).build());

        vehiculo.setPatente(request.patente().toUpperCase());
        vehiculo.setMarca(request.marca());
        vehiculo.setModelo(request.modelo());
        vehiculo.setAnio(request.anio());

        viaje.setVehiculo(vehiculoRepository.save(vehiculo));

        return ViajeResponse.from(viaje);
    }

    /** Guarda o actualiza la Declaración Jurada SAG del expediente, relación 1:1 (RF02). */
    @Transactional
    public ViajeResponse guardarSag(String rut, Integer idViaje, SagRequest request) {
        Viaje viaje = obtenerViajeDelUsuario(rut, idViaje);

        DeclaracionSag sag = declaracionSagRepository.findByViajeIdViaje(idViaje)
                .orElseGet(() -> DeclaracionSag.builder().viaje(viaje).build());

        sag.setDeclaraProductos(request.declaraProductos());
        sag.setProductos(request.productos());

        viaje.setDeclaracionSag(declaracionSagRepository.save(sag));

        return ViajeResponse.from(viaje);
    }

    private Usuario obtenerUsuario(String rut) {
        return usuarioRepository.findByRut(rut)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.UNAUTHORIZED, "El usuario de la sesión no existe"));
    }

    /** Busca el viaje por id y valida que pertenezca al usuario autenticado. */
    private Viaje obtenerViajeDelUsuario(String rut, Integer idViaje) {
        Usuario usuario = obtenerUsuario(rut);

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
