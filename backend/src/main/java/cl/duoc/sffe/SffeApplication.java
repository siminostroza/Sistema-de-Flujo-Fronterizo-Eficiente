package cl.duoc.sffe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Sistema de Flujo Fronterizo Eficiente (SFFE).
 * API REST para la gestión de trámites de cruce fronterizo terrestre:
 * usuarios, viajes, declaraciones SAG, vehículos, fiscalización por QR y reportes.
 */
@SpringBootApplication
public class SffeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SffeApplication.class, args);
    }
}
