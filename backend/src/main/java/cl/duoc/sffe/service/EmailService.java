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
 * Notificaciones por correo al pasajero: resolución de fiscalización (RF05),
 * verificación de correo y recuperación de contraseña (RF01). Un fallo de
 * envío (SMTP no disponible, credenciales inválidas, etc.) se registra en el
 * log pero nunca interrumpe el flujo que lo dispara: el correo es siempre una
 * notificación adicional, nunca una condición bloqueante para fiscalizar,
 * registrar una cuenta o pedir un reset de contraseña.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String PIE = "\n\nPrototipo desarrollado por estudiantes de DuocUC — "
            + "No es un sistema oficial del Estado de Chile.";

    private final JavaMailSender mailSender;
    private final String remitente;
    private final String urlFrontend;

    public EmailService(JavaMailSender mailSender,
                         @Value("${sffe.mail.from:no-reply@sffe.cl}") String remitente,
                         @Value("${sffe.frontend.url:http://localhost:5173}") String urlFrontend) {
        this.mailSender = mailSender;
        this.remitente = remitente;
        this.urlFrontend = urlFrontend;
    }

    /** Envía el aviso de aprobación o rechazo del ingreso al correo del pasajero (RF05). */
    public void notificarResolucion(Usuario pasajero, Viaje viaje, String motivoRechazo) {
        String asunto;
        String cuerpo;
        if (viaje.getEstado() == EstadoViaje.APROBADO) {
            asunto = "SFFE — Ingreso autorizado (EXP-" + viaje.getIdViaje() + ")";
            cuerpo = "Hola " + pasajero.getNombre() + ",\n\n"
                    + "Tu ingreso por el paso fronterizo " + safe(viaje.getPasoFronterizo())
                    + " fue AUTORIZADO por Aduana.\n\n"
                    + "Expediente: EXP-" + viaje.getIdViaje() + "\n"
                    + "Destino: " + safe(viaje.getDestino());
        } else if (viaje.getEstado() == EstadoViaje.RECHAZADO) {
            asunto = "SFFE — Ingreso rechazado (EXP-" + viaje.getIdViaje() + ")";
            cuerpo = "Hola " + pasajero.getNombre() + ",\n\n"
                    + "Tu ingreso por el paso fronterizo " + safe(viaje.getPasoFronterizo())
                    + " fue RECHAZADO por Aduana.\n\n"
                    + "Expediente: EXP-" + viaje.getIdViaje() + "\n"
                    + "Motivo del rechazo: " + safe(motivoRechazo);
        } else {
            return;
        }
        enviar(pasajero.getCorreo(), asunto, cuerpo + PIE);
    }

    /** Envía el enlace de verificación de correo tras el registro (RF01). */
    public void enviarVerificacionCorreo(Usuario usuario, String token) {
        String enlace = urlFrontend + "/verificar-correo?token=" + token;
        String cuerpo = "Hola " + usuario.getNombre() + ",\n\n"
                + "Gracias por registrarte en SFFE. Confirma tu correo entrando a este enlace "
                + "(válido por 24 horas):\n\n" + enlace
                + "\n\nAsí podremos notificarte cuando tu ingreso sea autorizado o rechazado.";
        enviar(usuario.getCorreo(), "SFFE — Confirma tu correo", cuerpo + PIE);
    }

    /** Envía el enlace para restablecer la contraseña (RF01). */
    public void enviarRecuperacionPassword(Usuario usuario, String token) {
        String enlace = urlFrontend + "/restablecer-password?token=" + token;
        String cuerpo = "Hola " + usuario.getNombre() + ",\n\n"
                + "Solicitaste restablecer tu contraseña en SFFE. Entra a este enlace para elegir una "
                + "nueva (válido por 1 hora):\n\n" + enlace
                + "\n\nSi no fuiste tú, ignora este correo: tu contraseña actual sigue funcionando.";
        enviar(usuario.getCorreo(), "SFFE — Restablece tu contraseña", cuerpo + PIE);
    }

    private void enviar(String destinatario, String asunto, String cuerpo) {
        if (destinatario == null || destinatario.isBlank()) {
            return;
        }
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(destinatario);
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpo);
            mailSender.send(mensaje);
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo '{}' a {}", asunto, destinatario, e);
        }
    }

    private String safe(String valor) {
        return (valor == null || valor.isBlank()) ? "—" : valor;
    }
}
