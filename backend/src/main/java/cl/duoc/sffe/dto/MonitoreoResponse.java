package cl.duoc.sffe.dto;

/**
 * Estado operativo del paso fronterizo, calculado a partir de datos reales
 * (RF10): pasajeros en cola (códigos QR generados y aún no resueltos),
 * ocupación relativa a una capacidad configurable, y tiempo de espera
 * promedio de las últimas resoluciones.
 */
public record MonitoreoResponse(
        long pendientesEnCola,
        int ocupacionPorcentaje,
        long tiempoEsperaPromedioMinutos,
        boolean alertaActiva
) {
}
