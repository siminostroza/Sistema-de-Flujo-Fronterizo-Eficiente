package cl.duoc.sffe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Vehículo registrado en un expediente de viaje (RF03).
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

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_viaje", nullable = false, unique = true)
    private Viaje viaje;

    @Column(name = "patente", nullable = false, length = 10)
    private String patente;

    @Column(name = "marca", nullable = false, length = 50)
    private String marca;

    @Column(name = "modelo", nullable = false, length = 50)
    private String modelo;

    @Column(name = "anio")
    private Integer anio;
}
