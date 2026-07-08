package cl.duoc.sffe.service;

import cl.duoc.sffe.model.AuditoriaLog;
import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.Rol;
import cl.duoc.sffe.model.TipoDocumento;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.model.Viaje;
import cl.duoc.sffe.repository.AuditoriaLogRepository;
import cl.duoc.sffe.repository.ViajeRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Smoke test de ReporteService (RF06): valida que el PDF y el Excel
 * generados sean archivos realmente válidos y no solo que el código
 * compile. El uso de las APIs de PDFBox/POI es fácil de dejar mal a nivel
 * de tipos pero fallar recién en tiempo de ejecución.
 */
class ReporteServiceTest {

    private Viaje viajeDePrueba() {
        Usuario usuario = Usuario.builder()
                .idUsuario(1)
                .nombre("Pasajero de Prueba")
                .identificador("12345678-5")
                .tipoDocumento(TipoDocumento.RUT)
                .correo("prueba@sffe.cl")
                .rol(Rol.PASAJERO)
                .build();
        return Viaje.builder()
                .idViaje(1)
                .usuario(usuario)
                .fechaIngreso(LocalDate.now())
                .destino("Buenos Aires")
                .pasoFronterizo("Los Libertadores")
                .estado(EstadoViaje.APROBADO)
                .build();
    }

    private AuditoriaLog logDePrueba() {
        return AuditoriaLog.builder()
                .accion("APROBADO")
                .modulo("QR")
                .codigoQr("codigo-1")
                .identificadorEnmascarado("*****-5")
                .build();
    }

    @Test
    void generarPdf_devuelveUnPdfValidoYNoVacio() throws Exception {
        ViajeRepository viajeRepository = mock(ViajeRepository.class);
        AuditoriaLogRepository auditoriaLogRepository = mock(AuditoriaLogRepository.class);
        when(viajeRepository.findAll()).thenReturn(List.of(viajeDePrueba()));
        when(auditoriaLogRepository.findAllByOrderByFechaDesc()).thenReturn(List.of(logDePrueba()));

        ReporteService reporteService = new ReporteService(viajeRepository, auditoriaLogRepository);
        byte[] pdf = reporteService.generarPdf();

        assertThat(pdf).isNotEmpty();
        try (PDDocument documento = Loader.loadPDF(pdf)) {
            assertThat(documento.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        }
    }

    @Test
    void generarExcel_devuelveUnLibroValidoConLasDosHojas() throws Exception {
        ViajeRepository viajeRepository = mock(ViajeRepository.class);
        AuditoriaLogRepository auditoriaLogRepository = mock(AuditoriaLogRepository.class);
        when(viajeRepository.findAll()).thenReturn(List.of(viajeDePrueba()));
        when(auditoriaLogRepository.findAllByOrderByFechaDesc()).thenReturn(List.of(logDePrueba()));

        ReporteService reporteService = new ReporteService(viajeRepository, auditoriaLogRepository);
        byte[] excel = reporteService.generarExcel();

        assertThat(excel).isNotEmpty();
        try (Workbook libro = new XSSFWorkbook(new ByteArrayInputStream(excel))) {
            assertThat(libro.getSheet("Resumen")).isNotNull();
            assertThat(libro.getSheet("Viajes")).isNotNull();
            assertThat(libro.getSheet("Viajes").getPhysicalNumberOfRows()).isEqualTo(2); // encabezado + 1 viaje
        }
    }
}
