package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.CodigoQr;
import cl.duoc.sffe.model.DeclaracionSag;
import cl.duoc.sffe.model.EstadoDeclaracion;
import cl.duoc.sffe.model.EstadoQr;
import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.Mascota;
import cl.duoc.sffe.model.Menor;
import cl.duoc.sffe.model.Vehiculo;
import cl.duoc.sffe.model.Viaje;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Expediente de viaje completo, con vehículos, mascotas, declaración
 * (SAG + Aduanas), menores y código QR anidados (RF02, RF03, RF04).
 */
public record ViajeResponse(
        Integer idViaje,
        LocalDate fechaIngreso,
        String destino,
        String paisOrigen,
        String pasoFronterizo,
        String motivoViaje,
        EstadoViaje estado,
        /** Motivo detallado del rechazo (RF05), visible en el ticket del pasajero. Nulo salvo RECHAZADO. */
        String motivoRechazo,
        LocalDateTime createdAt,
        /** true si el pasajero adjuntó su carnet al registrarse (RF01); las cuentas semilla no lo tienen. */
        boolean carnetIdentidad,
        /** true si el pasajero adjuntó sus papeles de antecedentes al registrarse (RF01). */
        boolean papelesAntecedentes,
        List<VehiculoInfo> vehiculos,
        List<MascotaInfo> mascotas,
        SagInfo sag,
        List<MenorInfo> menores,
        QrInfo qr
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
                viaje.getMotivoRechazo(),
                viaje.getCreatedAt(),
                viaje.getUsuario().getCarnetIdentidadPath() != null,
                viaje.getUsuario().getPapelesAntecedentesPath() != null,
                viaje.getVehiculos().stream().map(VehiculoInfo::from).toList(),
                viaje.getMascotas().stream().map(MascotaInfo::from).toList(),
                SagInfo.from(viaje.getDeclaracionSag()),
                viaje.getMenores().stream().map(MenorInfo::from).toList(),
                QrInfo.from(viaje.getCodigoQr())
        );
    }

    /**
     * Vehículo asociado al viaje (RF03): principal o carro de arrastre/remolque.
     * {@code permisoCirculacion} indica si el permiso de circulación fue
     * adjuntado (siempre {@code true}: es obligatorio); visible para Aduana y PDI.
     */
    public record VehiculoInfo(
            Integer idVehiculo,
            String patente,
            String marca,
            String modelo,
            Integer anio,
            Boolean esRemolque,
            Boolean permisoCirculacion
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
                    vehiculo.getAnio(),
                    vehiculo.getEsRemolque(),
                    vehiculo.getPermisoCirculacionPath() != null
            );
        }
    }

    /**
     * Mascota asociada al viaje (RF02): tipo de animal, número de chip y
     * confirmación de los documentos adjuntados (certificado del chip y
     * carnet de vacunación, ambos obligatorios). Visible para fiscalización.
     */
    public record MascotaInfo(
            Integer idMascota,
            String tipoAnimal,
            String numeroChip,
            Boolean certificadoChip,
            Boolean carnetVacunacion
    ) {
        public static MascotaInfo from(Mascota mascota) {
            return new MascotaInfo(
                    mascota.getIdMascota(),
                    mascota.getTipoAnimal(),
                    mascota.getNumeroChip(),
                    mascota.getCertificadoChipPath() != null,
                    mascota.getCarnetVacunacionPath() != null
            );
        }
    }

    /**
     * Declaración Jurada SAG + Aduanas (RF02), o {@code null} si no se ha
     * completado. Incluye productos regulados (SAG), divisas y mercancías
     * (Aduanas).
     */
    public record SagInfo(
            Integer idDeclaracion,
            Boolean declaraProductos,
            String productos,
            Boolean declaraDivisas,
            BigDecimal montoDivisas,
            String monedaDivisas,
            Boolean declaraMercancias,
            String detalleMercancias,
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
                    sag.getDeclaraDivisas(),
                    sag.getMontoDivisas(),
                    sag.getMonedaDivisas(),
                    sag.getDeclaraMercancias(),
                    sag.getDetalleMercancias(),
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

    /** Código QR del expediente (RF04), o {@code null} si aún no se ha generado. */
    public record QrInfo(
            String codigo,
            EstadoQr estado,
            LocalDateTime fechaGeneracion
    ) {
        public static QrInfo from(CodigoQr qr) {
            if (qr == null) {
                return null;
            }
            return new QrInfo(qr.getCodigo(), qr.getEstado(), qr.getFechaGeneracion());
        }
    }
}
