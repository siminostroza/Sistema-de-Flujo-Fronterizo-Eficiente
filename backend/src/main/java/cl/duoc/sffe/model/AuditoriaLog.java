package cl.duoc.sffe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Registro de auditoría de acciones en el sistema.
 * En el MVP solo se persisten eventos básicos (RF09 completo queda postergado).
 */
@Entity
@Table(name = "auditoria_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_log")
    private Integer idLog;

    /** Nullable: hay acciones sin usuario autenticado (ej. intentos de login fallidos). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "ip", length = 45)
    private String ip;

    @Column(name = "accion", nullable = false, length = 100)
    private String accion;

    @Column(name = "modulo", nullable = false, length = 50)
    private String modulo;

    /**
     * Contexto de fiscalización (RF05): código QR resuelto. Nullable porque hay
     * acciones de auditoría sin QR asociado.
     */
    @Column(name = "codigo_qr", length = 255)
    private String codigoQr;

    /**
     * Contexto de fiscalización (RF05): identificador del pasajero ya
     * enmascarado (RNF10). Nullable por la misma razón que {@link #codigoQr}.
     */
    @Column(name = "identificador_enmascarado", length = 30)
    private String identificadorEnmascarado;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;
}
