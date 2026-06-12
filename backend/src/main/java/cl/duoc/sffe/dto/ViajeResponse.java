package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.DeclaracionSag;
import cl.duoc.sffe.model.EstadoDeclaracion;
import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.Menor;
import cl.duoc.sffe.model.Vehiculo;
import cl.duoc.sffe.model.Viaje;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Expediente de viaje completo, con vehículo, declaración SAG y menores
 * anidados (RF02, RF04).
 */
public record ViajeResponse(
        Integer idViaje,
        LocalDate fechaIngreso,
        String destino,
        String paisOrigen,
        String pasoFronterizo,
        String motivoViaje,
        EstadoViaje estado,
        LocalDateTime createdAt,
        VehiculoInfo vehiculo,
        SagInfo sag,
        java.util.List<MenorInfo> menores
) {

    /** Construye la respuesta a partir de la entidad, mapeando sus relaciones. */
    public static ViajeResponse from(Viaje viaje) {
        return new ViajeResponse(
                viaje.getIdViaje(),
                viaje.getFechaIngreso(),
                viaje.getDestino(),
                viaje.getPaisOrigen(),
                viaje.getPasoFronterizo(),
                viaje.getMotivoViaje(),
                viaje.getEstado(),
                viaje.getCreatedAt(),
                VehiculoInfo.from(viaje.getVehiculo()),
                SagInfo.from(viaje.getDeclaracionSag()),
                viaje.getMenores().stream().map(MenorInfo::from).toList()
        );
    }

    /** Vehículo asociado al viaje (RF03), o {@code null} si no se ha registrado. */
    public record VehiculoInfo(
            Integer idVehiculo,
            String patente,
            String marca,
            String modelo,
            Integer anio
    ) {
        public static VehiculoInfo from(Vehiculo vehiculo) {
            if (vehiculo == null) {
                return null;
            }
            return new VehiculoInfo(
                    vehiculo.getIdVehiculo(),
                    vehiculo.getPatente(),
                    vehiculo.getMarca(),
                    vehiculo.getModelo(),
                    vehiculo.getAnio()
            );
        }
    }

    /** Declaración Jurada SAG (RF02), o {@code null} si no se ha completado. */
    public record SagInfo(
            Integer idDeclaracion,
            Boolean declaraProductos,
            String productos,
            EstadoDeclaracion estado,
            String firmaDigital,
            LocalDateTime fecha
    ) {
        public static SagInfo from(DeclaracionSag sag) {
            if (sag == null) {
                return null;
            }
            return new SagInfo(
                    sag.getIdDeclaracion(),
                    sag.getDeclaraProductos(),
                    sag.getProductos(),
                    sag.getEstado(),
                    sag.getFirmaDigital(),
                    sag.getFecha()
            );
        }
    }

    /** Menor de edad asociado al viaje (RF02). */
    public record MenorInfo(
            Integer idMenor,
            String nombre,
            String rut,
            LocalDate fechaNacimiento,
            Boolean requiereAutorizacion
    ) {
        public static MenorInfo from(Menor menor) {
            return new MenorInfo(
                    menor.getIdMenor(),
                    menor.getNombre(),
                    menor.getRut(),
                    menor.getFechaNacimiento(),
                    menor.getRequiereAutorizacion()
            );
        }
    }
}
