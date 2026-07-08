package cl.duoc.sffe.service;

import cl.duoc.sffe.model.AuditoriaLog;
import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.Viaje;
import cl.duoc.sffe.repository.AuditoriaLogRepository;
import cl.duoc.sffe.repository.ViajeRepository;
import cl.duoc.sffe.util.MaskUtil;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Reportes de trámites y fiscalizaciones para ADMIN (RF06), exportables en
 * PDF y Excel. Ambos formatos reportan lo mismo: resumen de expedientes por
 * estado, resumen de fiscalizaciones por acción, y el detalle de
 * expedientes con el identificador del pasajero enmascarado (RNF10, igual
 * que en el resto de vistas de funcionario/admin).
 */
@Service
public class ReporteService {

    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");
    private static final float MARGEN = 50;

    private final ViajeRepository viajeRepository;
    private final AuditoriaLogRepository auditoriaLogRepository;

    public ReporteService(ViajeRepository viajeRepository, AuditoriaLogRepository auditoriaLogRepository) {
        this.viajeRepository = viajeRepository;
        this.auditoriaLogRepository = auditoriaLogRepository;
    }

    /** Genera el reporte en PDF (RF06). Transaccional: las relaciones lazy (usuario del viaje) se resuelven acá. */
    @Transactional(readOnly = true)
    public byte[] generarPdf() {
        List<Viaje> viajes = viajeRepository.findAll();
        List<AuditoriaLog> logs = auditoriaLogRepository.findAllByOrderByFechaDesc();

        try (PDDocument documento = new PDDocument()) {
            EscritorPdf escritor = new EscritorPdf(documento);
            escritor.titulo("SFFE — Reporte de trámites y fiscalizaciones");
            escritor.texto("Generado " + LocalDateTime.now().format(FORMATO_FECHA)
                    + " — Prototipo académico DuocUC, no es un sistema oficial del Estado de Chile");
            escritor.espacio();

            escritor.subtitulo("Expedientes por estado");
            for (Map.Entry<String, Long> entrada : porEstado(viajes).entrySet()) {
                escritor.texto(entrada.getKey() + ": " + entrada.getValue());
            }
            escritor.espacio();

            escritor.subtitulo("Fiscalizaciones por acción");
            for (Map.Entry<String, Long> entrada : porAccion(logs).entrySet()) {
                escritor.texto(entrada.getKey() + ": " + entrada.getValue());
            }
            escritor.espacio();

            escritor.subtitulo("Detalle de expedientes");
            for (Viaje viaje : viajes) {
                escritor.texto(String.format("EXP-%05d  %-10s  %-25s  %-20s  %s",
                        viaje.getIdViaje(),
                        viaje.getEstado(),
                        recorta(viaje.getDestino(), 25),
                        recorta(viaje.getPasoFronterizo(), 20),
                        maskUsuario(viaje)));
            }

            escritor.cerrar();
            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            documento.save(salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el reporte PDF", e);
        }
    }

    /** Genera el reporte en Excel (RF06). Transaccional por la misma razón que {@link #generarPdf()}. */
    @Transactional(readOnly = true)
    public byte[] generarExcel() {
        List<Viaje> viajes = viajeRepository.findAll();
        List<AuditoriaLog> logs = auditoriaLogRepository.findAllByOrderByFechaDesc();

        try (XSSFWorkbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Sheet resumen = libro.createSheet("Resumen");
            int fila = fila(resumen, 0, "SFFE — Reporte generado " + LocalDateTime.now().format(FORMATO_FECHA));
            fila++;
            fila = fila(resumen, fila, "Expedientes por estado");
            for (Map.Entry<String, Long> entrada : porEstado(viajes).entrySet()) {
                fila = fila(resumen, fila, entrada.getKey(), String.valueOf(entrada.getValue()));
            }
            fila++;
            fila = fila(resumen, fila, "Fiscalizaciones por acción");
            for (Map.Entry<String, Long> entrada : porAccion(logs).entrySet()) {
                fila = fila(resumen, fila, entrada.getKey(), String.valueOf(entrada.getValue()));
            }
            anchoFijo(resumen, 2);

            Sheet hojaViajes = libro.createSheet("Viajes");
            int filaViajes = fila(hojaViajes, 0,
                    "Expediente", "Estado", "Destino", "Paso fronterizo", "Fecha ingreso", "Pasajero");
            for (Viaje viaje : viajes) {
                filaViajes = fila(hojaViajes, filaViajes,
                        String.format("EXP-%05d", viaje.getIdViaje()),
                        viaje.getEstado().name(),
                        viaje.getDestino(),
                        viaje.getPasoFronterizo(),
                        viaje.getFechaIngreso() != null ? viaje.getFechaIngreso().toString() : "",
                        maskUsuario(viaje));
            }
            anchoFijo(hojaViajes, 6);

            libro.write(salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el reporte Excel", e);
        }
    }

    private Map<String, Long> porEstado(List<Viaje> viajes) {
        Map<String, Long> conteo = new LinkedHashMap<>();
        for (EstadoViaje estado : EstadoViaje.values()) {
            conteo.put(estado.name(), 0L);
        }
        conteo.putAll(viajes.stream()
                .collect(Collectors.groupingBy(v -> v.getEstado().name(), Collectors.counting())));
        return conteo;
    }

    private Map<String, Long> porAccion(List<AuditoriaLog> logs) {
        return logs.stream().collect(Collectors.groupingBy(AuditoriaLog::getAccion, Collectors.counting()));
    }

    private String maskUsuario(Viaje viaje) {
        return MaskUtil.maskIdentificador(
                viaje.getUsuario().getIdentificador(), viaje.getUsuario().getTipoDocumento());
    }

    private String recorta(String valor, int largoMaximo) {
        if (valor == null) {
            return "";
        }
        return valor.length() > largoMaximo ? valor.substring(0, largoMaximo - 1) + "…" : valor;
    }

    private int fila(Sheet hoja, int indice, String... valores) {
        Row fila = hoja.createRow(indice);
        for (int i = 0; i < valores.length; i++) {
            fila.createCell(i).setCellValue(valores[i] == null ? "" : valores[i]);
        }
        return indice + 1;
    }

    private void anchoFijo(Sheet hoja, int columnas) {
        for (int i = 0; i < columnas; i++) {
            hoja.setColumnWidth(i, 20 * 256);
        }
    }

    /**
     * Escribe texto en un PDDocument con salto de página automático cuando
     * se agota el espacio. No implementa AutoCloseable a propósito: el
     * content stream de la página actual debe cerrarse con {@link #cerrar()}
     * ANTES de {@code documento.save(...)}, así que el llamador controla el
     * momento exacto en vez de delegarlo a un try-with-resources.
     */
    private static final class EscritorPdf {
        private final PDDocument documento;
        private final PDType1Font fuenteTitulo;
        private final PDType1Font fuenteSubtitulo;
        private final PDType1Font fuenteTexto;
        private PDPageContentStream contenido;
        private float y;

        EscritorPdf(PDDocument documento) throws IOException {
            this.documento = documento;
            this.fuenteTitulo = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            this.fuenteSubtitulo = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            this.fuenteTexto = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            nuevaPagina();
        }

        void titulo(String texto) throws IOException {
            escribir(fuenteTitulo, 15, texto);
        }

        void subtitulo(String texto) throws IOException {
            escribir(fuenteSubtitulo, 11, texto);
        }

        void texto(String texto) throws IOException {
            escribir(fuenteTexto, 9, texto);
        }

        void espacio() {
            y -= 10;
        }

        void cerrar() throws IOException {
            contenido.close();
        }

        private void nuevaPagina() throws IOException {
            PDPage pagina = new PDPage(PDRectangle.A4);
            documento.addPage(pagina);
            contenido = new PDPageContentStream(documento, pagina);
            y = PDRectangle.A4.getHeight() - MARGEN;
        }

        private void escribir(PDType1Font fuente, float tamano, String texto) throws IOException {
            if (y < MARGEN + 20) {
                contenido.close();
                nuevaPagina();
            }
            contenido.beginText();
            contenido.setFont(fuente, tamano);
            contenido.newLineAtOffset(MARGEN, y);
            contenido.showText(texto);
            contenido.endText();
            y -= tamano + 6;
        }
    }
}
