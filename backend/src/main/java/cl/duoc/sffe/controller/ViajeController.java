package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.MascotaRequest;
import cl.duoc.sffe.dto.MenorRequest;
import cl.duoc.sffe.dto.SagRequest;
import cl.duoc.sffe.dto.VehiculoRequest;
import cl.duoc.sffe.dto.ViajeRequest;
import cl.duoc.sffe.dto.ViajeResponse;
import cl.duoc.sffe.service.ArchivoDescargado;
import cl.duoc.sffe.service.ArchivoService;
import cl.duoc.sffe.service.ViajeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Endpoints de expedientes de viaje del pasajero autenticado (RF02, RF03, RF04).
 * El identificador del usuario se obtiene del JWT validado por
 * {@link cl.duoc.sffe.security.JwtAuthenticationFilter}. Restringidos a rol
 * PASAJERO: son endpoints de autoservicio del pasajero, no del funcionario
 * (aunque un funcionario también sea un {@code Usuario} autenticado válido).
 */
@RestController
@RequestMapping("/api/viajes")
@PreAuthorize("hasRole('PASAJERO')")
public class ViajeController {

    private final ViajeService viajeService;
    private final ArchivoService archivoService;

    public ViajeController(ViajeService viajeService, ArchivoService archivoService) {
        this.viajeService = viajeService;
        this.archivoService = archivoService;
    }

    /** Crea un nuevo expediente de viaje (RF02). */
    @PostMapping
    public ResponseEntity<ViajeResponse> crear(
            @Valid @RequestBody ViajeRequest request, Authentication authentication) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(viajeService.crear(authentication.getName(), request));
    }

    /** Lista los expedientes de viaje del usuario autenticado (RF04). */
    @GetMapping("/mis-viajes")
    public ResponseEntity<List<ViajeResponse>> misViajes(Authentication authentication) {
        return ResponseEntity.ok(viajeService.misViajes(authentication.getName()));
    }

    /** Consulta el detalle de un expediente propio (RF04). */
    @GetMapping("/{id}")
    public ResponseEntity<ViajeResponse> obtener(
            @PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(viajeService.obtener(authentication.getName(), id));
    }

    /** Actualiza los datos del itinerario de un expediente propio (RF02). */
    @PutMapping("/{id}")
    public ResponseEntity<ViajeResponse> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody ViajeRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(viajeService.actualizar(authentication.getName(), id, request));
    }

    /**
     * Agrega un menor de edad al expediente (RF02). Multipart: la parte
     * {@code datos} lleva el JSON de {@link MenorRequest}; el carnet de
     * identidad y los papeles de antecedentes son obligatorios, y el permiso
     * notarial lo es solo si {@code requiereAutorizacion = true} (validado en
     * {@code ViajeService}).
     */
    @PostMapping(value = "/{id}/menores", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ViajeResponse> agregarMenor(
            @PathVariable Integer id,
            @Valid @RequestPart("datos") MenorRequest request,
            @RequestPart(value = "carnetIdentidad", required = false) MultipartFile carnetIdentidad,
            @RequestPart(value = "papelesAntecedentes", required = false) MultipartFile papelesAntecedentes,
            @RequestPart(value = "permisoNotarial", required = false) MultipartFile permisoNotarial,
            Authentication authentication) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(viajeService.agregarMenor(
                        authentication.getName(), id, request,
                        carnetIdentidad, papelesAntecedentes, permisoNotarial));
    }

    /**
     * Quita un menor del expediente (RF02). Solo mientras el viaje sigue
     * PENDIENTE; el wizard también lo usa para "editar" un menor ya
     * guardado (lo quita y lo vuelve a agregar con los datos corregidos).
     */
    @DeleteMapping("/{id}/menores/{idMenor}")
    public ResponseEntity<ViajeResponse> eliminarMenor(
            @PathVariable Integer id, @PathVariable Integer idMenor, Authentication authentication) {
        return ResponseEntity.ok(viajeService.eliminarMenor(authentication.getName(), id, idMenor));
    }

    /**
     * Registra o actualiza el vehículo asociado al expediente (RF03).
     * Multipart: la parte {@code datos} lleva el JSON de
     * {@link VehiculoRequest}; {@code permisoCirculacion} es el documento
     * adjunto obligatorio (principal o remolque), visible para Aduana y PDI.
     */
    @PostMapping(value = "/{id}/vehiculo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ViajeResponse> registrarVehiculo(
            @PathVariable Integer id,
            @Valid @RequestPart("datos") VehiculoRequest request,
            @RequestPart(value = "permisoCirculacion", required = false) MultipartFile permisoCirculacion,
            Authentication authentication) {
        return ResponseEntity.ok(viajeService.registrarVehiculo(
                authentication.getName(), id, request, permisoCirculacion));
    }

    /**
     * Agrega una mascota al expediente (RF02). Multipart: la parte
     * {@code datos} lleva el JSON de {@link MascotaRequest}; el certificado
     * del chip y el carnet de vacunación son obligatorios. Visible para
     * fiscalización (Aduana, PDI, SAG).
     */
    @PostMapping(value = "/{id}/mascotas", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ViajeResponse> agregarMascota(
            @PathVariable Integer id,
            @Valid @RequestPart("datos") MascotaRequest request,
            @RequestPart(value = "certificadoChip", required = false) MultipartFile certificadoChip,
            @RequestPart(value = "carnetVacunacion", required = false) MultipartFile carnetVacunacion,
            Authentication authentication) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(viajeService.agregarMascota(
                        authentication.getName(), id, request, certificadoChip, carnetVacunacion));
    }

    /** Quita una mascota del expediente (RF02). Solo mientras el viaje sigue PENDIENTE. */
    @DeleteMapping("/{id}/mascotas/{idMascota}")
    public ResponseEntity<ViajeResponse> eliminarMascota(
            @PathVariable Integer id, @PathVariable Integer idMascota, Authentication authentication) {
        return ResponseEntity.ok(viajeService.eliminarMascota(authentication.getName(), id, idMascota));
    }

    /** Guarda o actualiza la Declaración Jurada SAG del expediente (RF02). */
    @PostMapping("/{id}/sag")
    public ResponseEntity<ViajeResponse> guardarSag(
            @PathVariable Integer id,
            @Valid @RequestBody SagRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(viajeService.guardarSag(authentication.getName(), id, request));
    }

    /**
     * Visualización de archivos adjuntos del propio expediente: carnet de
     * identidad y papeles de antecedentes del pasajero (RF01). Devuelve el
     * binario con el content-type correcto para mostrarlo inline (imagen o PDF).
     */
    @GetMapping("/{id}/archivos/usuario/{campo}")
    public ResponseEntity<byte[]> archivoUsuario(
            @PathVariable Integer id, @PathVariable String campo, Authentication authentication) {
        return responder(archivoService.archivoUsuarioPropio(authentication.getName(), id, campo));
    }

    /** Visualización de los archivos adjuntos de un menor del propio expediente (RF02). */
    @GetMapping("/{id}/archivos/menores/{idMenor}/{campo}")
    public ResponseEntity<byte[]> archivoMenor(
            @PathVariable Integer id, @PathVariable Integer idMenor, @PathVariable String campo,
            Authentication authentication) {
        return responder(archivoService.archivoMenorPropio(authentication.getName(), id, idMenor, campo));
    }

    /** Visualización del permiso de circulación de un vehículo del propio expediente (RF03). */
    @GetMapping("/{id}/archivos/vehiculos/{idVehiculo}/{campo}")
    public ResponseEntity<byte[]> archivoVehiculo(
            @PathVariable Integer id, @PathVariable Integer idVehiculo, @PathVariable String campo,
            Authentication authentication) {
        return responder(archivoService.archivoVehiculoPropio(authentication.getName(), id, idVehiculo, campo));
    }

    /** Visualización de los archivos adjuntos de una mascota del propio expediente (RF02). */
    @GetMapping("/{id}/archivos/mascotas/{idMascota}/{campo}")
    public ResponseEntity<byte[]> archivoMascota(
            @PathVariable Integer id, @PathVariable Integer idMascota, @PathVariable String campo,
            Authentication authentication) {
        return responder(archivoService.archivoMascotaPropio(authentication.getName(), id, idMascota, campo));
    }

    private ResponseEntity<byte[]> responder(ArchivoDescargado archivo) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header("X-Content-Type-Options", "nosniff")
                .body(archivo.contenido());
    }

    /**
     * Reemplaza el carnet de identidad o los papeles de antecedentes ya
     * subidos por el pasajero (RF01), por ejemplo si adjuntó el archivo
     * equivocado. Solo mientras el viaje sigue PENDIENTE.
     */
    @PutMapping(value = "/{id}/archivos/usuario/{campo}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> reemplazarArchivoUsuario(
            @PathVariable Integer id, @PathVariable String campo,
            @RequestPart("archivo") MultipartFile archivo, Authentication authentication) {
        archivoService.reemplazarArchivoUsuario(authentication.getName(), id, campo, archivo);
        return ResponseEntity.noContent().build();
    }

    /** Reemplaza un archivo ya subido de un menor del expediente (RF02). Solo mientras el viaje sigue PENDIENTE. */
    @PutMapping(value = "/{id}/archivos/menores/{idMenor}/{campo}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> reemplazarArchivoMenor(
            @PathVariable Integer id, @PathVariable Integer idMenor, @PathVariable String campo,
            @RequestPart("archivo") MultipartFile archivo, Authentication authentication) {
        archivoService.reemplazarArchivoMenor(authentication.getName(), id, idMenor, campo, archivo);
        return ResponseEntity.noContent().build();
    }

    /** Reemplaza el permiso de circulación de un vehículo del expediente (RF03). Solo mientras el viaje sigue PENDIENTE. */
    @PutMapping(value = "/{id}/archivos/vehiculos/{idVehiculo}/{campo}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> reemplazarArchivoVehiculo(
            @PathVariable Integer id, @PathVariable Integer idVehiculo, @PathVariable String campo,
            @RequestPart("archivo") MultipartFile archivo, Authentication authentication) {
        archivoService.reemplazarArchivoVehiculo(authentication.getName(), id, idVehiculo, campo, archivo);
        return ResponseEntity.noContent().build();
    }

    /** Reemplaza un archivo ya subido de una mascota del expediente (RF02). Solo mientras el viaje sigue PENDIENTE. */
    @PutMapping(value = "/{id}/archivos/mascotas/{idMascota}/{campo}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> reemplazarArchivoMascota(
            @PathVariable Integer id, @PathVariable Integer idMascota, @PathVariable String campo,
            @RequestPart("archivo") MultipartFile archivo, Authentication authentication) {
        archivoService.reemplazarArchivoMascota(authentication.getName(), id, idMascota, campo, archivo);
        return ResponseEntity.noContent().build();
    }
}
