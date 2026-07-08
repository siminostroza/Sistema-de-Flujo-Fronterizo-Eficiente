package cl.duoc.sffe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Expediente de viaje de un pasajero (RF02). Agrupa itinerario, menores,
 * vehículo, declaración SAG y código QR para la fiscalización en frontera.
 */
@Entity
@Table(name = "viajes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Viaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_viaje")
    private Integer idViaje;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;

    @Column(name = "destino", nullable = false, length = 100)
    private String destino;

    @Column(name = "pais_origen", length = 100)
    private String paisOrigen;

    @Column(name = "paso_fronterizo", length = 100)
    private String pasoFronterizo;

    @Column(name = "motivo_viaje", length = 200)
    private String motivoViaje;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    @Builder.Default
    private EstadoViaje estado = EstadoViaje.PENDIENTE;

    /**
     * Motivo detallado por el que Aduana rechazó el ingreso (RF05). Lo
     * completa el funcionario al resolver RECHAZADO y lo ve el pasajero en su
     * ticket; se limpia si el expediente se vuelve a aprobar más adelante.
     */
    @Lob
    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "viaje", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Menor> menores = new ArrayList<>();

    @OneToMany(mappedBy = "viaje", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Vehiculo> vehiculos = new ArrayList<>();

    @OneToMany(mappedBy = "viaje", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Mascota> mascotas = new ArrayList<>();

    @OneToOne(mappedBy = "viaje", cascade = CascadeType.ALL, orphanRemoval = true)
    private DeclaracionSag declaracionSag;

    @OneToOne(mappedBy = "viaje", cascade = CascadeType.ALL, orphanRemoval = true)
    private CodigoQr codigoQr;
}
