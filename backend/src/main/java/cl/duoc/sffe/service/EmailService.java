package cl.duoc.sffe.service;

import cl.duoc.sffe.model.EstadoViaje;
import cl.duoc.sffe.model.Usuario;
import cl.duoc.sffe.model.Viaje;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Notificaciones por correo al pasajero cuando Aduana resuelve su ingreso
 * (RF05). Un fallo de envío (SMTP no disponible, credenciales inválidas,
 * etc.) se registra en el log pero nunca bloquea la fiscalización: el correo
 * es una notificación adicional, no una condición para aprobar o rechazar.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String remitente;

    public EmailService(JavaMailSender mailSender,
                         @Value("${sffe.mail.from:no-reply@sffe.cl}") String remitente) {
        this.mailSender = mailSender;
        this.remitente = remitente;
    }

    /** Envía el aviso de aprobación o rechazo del ingreso al correo del pasajero (RF05). */
    public void notificarResolucion(Usuario pasajero, Viaje viaje, String motivoRechazo) {
        if (pasajero.getCorreo() == null || pasajero.getCorreo().isBlank()) {
            return;
        }

        String asunto;
        String cuerpo;
        if (viaje.getEstado() == EstadoViaje.APROBADO) {
            asunto = "SFFE — Ingreso autorizado (EXP-" + viaje.getIdViaje() + ")";
            cuerpo = "Hola " + pasajero.getNombre() + ",\n\n"
                    + "Tu ingreso por el paso fronterizo " + safe(viaje.getPasoFronterizo())
                    + " fue AUTORIZADO por Aduana.\n\n"
                    + "Expediente: EXP-" + viaje.getIdViaje() + "\n"
                    + "Destino: " + safe(viaje.getDestino()) + "\n\n"
                    + "Prototipo desarrollado por estudiantes de DuocUC — "
                    + "No es un sistema oficial del Estado de Chile.";
        } else if (viaje.getEstado() == EstadoViaje.RECHAZADO) {
            asunto = "SFFE — Ingreso rechazado (EXP-" + viaje.getIdViaje() + ")";
            cuerpo = "Hola " + pasajero.getNombre() + ",\n\n"
                    + "Tu ingreso por el paso fronterizo " + safe(viaje.getPasoFronterizo())
                    + " fue RECHAZADO por Aduana.\n\n"
                    + "Expediente: EXP-" + viaje.getIdViaje() + "\n"
                    + "Motivo del rechazo: " + safe(motivoRechazo) + "\n\n"
                    + "Prototipo desarrollado por estudiantes de DuocUC — "
                    + "No es un sistema oficial del Estado de Chile.";
        } else {
            return;
        }

        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(pasajero.getCorreo());
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpo);
            mailSender.send(mensaje);
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo de notificación de fiscalización al expediente {}",
                    viaje.getIdViaje(), e);
        }
    }

    private String safe(String valor) {
        return (valor == null || valor.isBlank()) ? "—" : valor;
    }
}
