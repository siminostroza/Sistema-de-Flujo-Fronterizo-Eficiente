package cl.duoc.sffe.controller;

import cl.duoc.sffe.dto.MenorRequest;
import cl.duoc.sffe.dto.SagRequest;
import cl.duoc.sffe.dto.VehiculoRequest;
import cl.duoc.sffe.dto.ViajeRequest;
import cl.duoc.sffe.dto.ViajeResponse;
import cl.duoc.sffe.service.ViajeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

    public ViajeController(ViajeService viajeService) {
        this.viajeService = viajeService;
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

    /** Registra o actualiza el vehículo asociado al expediente (RF03). */
    @PostMapping("/{id}/vehiculo")
    public ResponseEntity<ViajeResponse> registrarVehiculo(
            @PathVariable Integer id,
            @Valid @RequestBody VehiculoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(viajeService.registrarVehiculo(authentication.getName(), id, request));
    }

    /** Guarda o actualiza la Declaración Jurada SAG del expediente (RF02). */
    @PostMapping("/{id}/sag")
    public ResponseEntity<ViajeResponse> guardarSag(
            @PathVariable Integer id,
            @Valid @RequestBody SagRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(viajeService.guardarSag(authentication.getName(), id, request));
    }
}
