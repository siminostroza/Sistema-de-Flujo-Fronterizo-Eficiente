package cl.duoc.sffe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Vehículo registrado en un expediente de viaje (RF03). Un viaje puede tener
 * hasta dos vehículos: el principal y, opcionalmente, su carro de arrastre o
 * remolque (relación 1:N con el viaje).
 */
@Entity
@Table(name = "vehiculos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_vehiculo")
    private Integer idVehiculo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_viaje", nullable = false)
    private Viaje viaje;

    @Column(name = "patente", nullable = false, length = 10)
    private String patente;

    @Column(name = "marca", length = 50)
    private String marca;

    @Column(name = "modelo", length = 50)
    private String modelo;

    @Column(name = "anio")
    private Integer anio;

    /** {@code true} si el vehículo es un carro de arrastre o remolque. */
    @Column(name = "es_remolque", nullable = false)
    @Builder.Default
    private Boolean esRemolque = false;

    /** Id del vehículo principal al que se vincula el remolque (nullable). */
    @Column(name = "vehiculo_principal_id")
    private Integer vehiculoPrincipalId;
}
