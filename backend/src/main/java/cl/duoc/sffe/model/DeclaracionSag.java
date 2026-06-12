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
 * Declaración Jurada SAG de un expediente de viaje (RF02).
 * En el MVP la validación SAG es simulada con datos mock.
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
