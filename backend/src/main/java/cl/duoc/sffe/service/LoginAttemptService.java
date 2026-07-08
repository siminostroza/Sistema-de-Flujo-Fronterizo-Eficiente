package cl.duoc.sffe.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate-limiting básico de intentos de login (RNF03): bloquea temporalmente un
 * identificador tras varios intentos fallidos seguidos, para dificultar
 * ataques de fuerza bruta sobre la contraseña. Estado en memoria: suficiente
 * para una única instancia del backend (no hay despliegue multi-nodo en el
 * MVP); se resetea si el proceso se reinicia.
 */
@Service
public class LoginAttemptService {

    private static final int MAX_INTENTOS = 5;
    private static final long BLOQUEO_MS = 15 * 60 * 1000L; // 15 minutos

    private record Intentos(AtomicInteger fallos, Instant bloqueadoHasta) {
    }

    private final ConcurrentHashMap<String, Intentos> intentosPorIdentificador = new ConcurrentHashMap<>();

    /** Segundos restantes de bloqueo para este identificador, o 0 si no está bloqueado. */
    public long segundosDeBloqueo(String identificador) {
        Intentos actual = intentosPorIdentificador.get(clave(identificador));
        if (actual == null || actual.bloqueadoHasta() == null) {
            return 0;
        }
        long restante = actual.bloqueadoHasta().getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(restante, 0);
    }

    /**
     * Registra un intento fallido; si alcanza el máximo, inicia el bloqueo
     * temporal. Si el bloqueo anterior ya expiró, arranca el conteo de nuevo
     * en vez de seguir sumando sobre el valor viejo: si no, un solo intento
     * fallido justo después de que expira un bloqueo volvía a bloquear de
     * inmediato, en vez de dar 5 intentos frescos.
     */
    public void registrarFallo(String identificador) {
        intentosPorIdentificador.compute(clave(identificador), (id, actual) -> {
            boolean bloqueoExpirado = actual != null
                    && actual.bloqueadoHasta() != null
                    && actual.bloqueadoHasta().isBefore(Instant.now());
            int fallos = (actual == null || bloqueoExpirado) ? 1 : actual.fallos().get() + 1;
            Instant bloqueadoHasta = fallos >= MAX_INTENTOS
                    ? Instant.now().plusMillis(BLOQUEO_MS)
                    : null;
            return new Intentos(new AtomicInteger(fallos), bloqueadoHasta);
        });
    }

    /** Limpia el contador tras un login exitoso. */
    public void registrarExito(String identificador) {
        intentosPorIdentificador.remove(clave(identificador));
    }

    private String clave(String identificador) {
        return identificador == null ? "" : identificador.trim().toUpperCase();
    }
}
