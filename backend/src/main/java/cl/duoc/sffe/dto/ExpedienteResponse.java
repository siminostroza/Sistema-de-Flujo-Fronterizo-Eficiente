package cl.duoc.sffe.dto;

import cl.duoc.sffe.model.CodigoQr;
import cl.duoc.sffe.model.EstadoQr;
import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.TipoDocumento;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.model.Viaje;
import cl.duoc.sffe.util.MaskUtil;

import java.util.List;

/**
 * Expediente consolidado de un viajero para la fiscalización en frontera
 * (RF05), con el identificador del pasajero enmascarado según su
 * {@link TipoDocumento} (RNF10).
 */
public record ExpedienteResponse(
        String identificadorEnmascarado,
        TipoDocumento tipoDocumento,
        String nombrePasajero,
        String destino,
        String pasoFronterizo,
        String motivoViaje,
        EstadoViaje estadoViaje,
        EstadoQr estadoQr,
        List<ViajeResponse.VehiculoInfo> vehiculos,
        List<ViajeResponse.MascotaInfo> mascotas,
        ViajeResponse.SagInfo declaracionSag,
        List<ViajeResponse.MenorInfo> menores
) {

    /** Construye el expediente consolidado a partir del QR escaneado, enmascarando el identificador (RNF10). */
    public static ExpedienteResponse from(CodigoQr codigoQr) {
        Viaje viaje = codigoQr.getViaje();
        Usuario usuario = viaje.getUsuario();
        return new ExpedienteResponse(
                MaskUtil.maskIdentificador(usuario.getIdentificador(), usuario.getTipoDocumento()),
                usuario.getTipoDocumento(),
                usuario.getNombre(),
                viaje.getDestino(),
                viaje.getPasoFronterizo(),
                viaje.getMotivoViaje(),
                viaje.getEstado(),
                codigoQr.getEstado(),
                viaje.getVehiculos().stream().map(ViajeResponse.VehiculoInfo::from).toList(),
                viaje.getMascotas().stream().map(ViajeResponse.MascotaInfo::from).toList(),
                ViajeResponse.SagInfo.from(viaje.getDeclaracionSag()),
                viaje.getMenores().stream().map(ViajeResponse.MenorInfo::from).toList()
        );
    }
}
