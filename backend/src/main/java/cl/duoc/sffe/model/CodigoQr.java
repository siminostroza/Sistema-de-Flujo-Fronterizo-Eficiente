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
 * Código QR único vinculado a un expediente de viaje (RF04, RF05).
 * El funcionario lo escanea en frontera para ver la información consolidada.
 */
@Entity
@Table(name = "codigos_qr")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodigoQr {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_qr")
    private Integer idQr;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_viaje", nullable = false, unique = true)
    private Viaje viaje;

    @Column(name = "codigo", nullable = false, unique = true, length = 255)
    private String codigo;

    @CreationTimestamp
    @Column(name = "fecha_generacion", nullable = false, updatable = false)
    private LocalDateTime fechaGeneracion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    @Builder.Default
    private EstadoQr estado = EstadoQr.ACTIVO;
}
