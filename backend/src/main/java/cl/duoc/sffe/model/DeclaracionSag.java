package cl.duoc.sffe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Declaración Jurada del expediente de viaje (RF02): productos regulados (SAG)
 * más portación de divisas y mercancías sujetas a control (Aduanas).
 * En el MVP la validación es simulada con datos mock.
 */
@Entity
@Table(name = "declaraciones_sag")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeclaracionSag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_declaracion")
    private Integer idDeclaracion;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_viaje", nullable = false, unique = true)
    private Viaje viaje;

    @Column(name = "declara_productos", nullable = false)
    @Builder.Default
    private Boolean declaraProductos = false;

    /** Listado de productos declarados, serializado como JSON. */
    @Lob
    @Column(name = "productos", columnDefinition = "TEXT")
    private String productos;

    /** Aduanas: portación de efectivo o equivalentes superiores a USD 10.000. */
    @Column(name = "declara_divisas", nullable = false)
    @Builder.Default
    private Boolean declaraDivisas = false;

    @Column(name = "monto_divisas", precision = 12, scale = 2)
    private BigDecimal montoDivisas;

    @Column(name = "moneda_divisas", length = 10)
    private String monedaDivisas;

    /** Aduanas: mercancías que exceden la franquicia del viajero. */
    @Column(name = "declara_mercancias", nullable = false)
    @Builder.Default
    private Boolean declaraMercancias = false;

    @Lob
    @Column(name = "detalle_mercancias", columnDefinition = "TEXT")
    private String detalleMercancias;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    @Builder.Default
    private EstadoDeclaracion estado = EstadoDeclaracion.PENDIENTE;

    @Column(name = "firma_digital", length = 255)
    private String firmaDigital;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;
}
