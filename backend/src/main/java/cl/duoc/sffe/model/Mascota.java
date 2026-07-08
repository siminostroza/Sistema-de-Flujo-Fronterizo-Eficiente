package cl.duoc.sffe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Mascota asociada a un expediente de viaje. El tipo de animal, el número de
 * chip, el certificado del chip y el carnet de vacunación son obligatorios
 * (sin ellos no se puede agregar la mascota al viaje), y el expediente
 * consolidado es visible para todos los roles de fiscalización.
 */
@Entity
@Table(name = "mascotas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mascota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mascota")
    private Integer idMascota;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_viaje", nullable = false)
    private Viaje viaje;

    @Column(name = "tipo_animal", nullable = false, length = 50)
    private String tipoAnimal;

    @Column(name = "numero_chip", nullable = false, length = 50)
    private String numeroChip;

    @Column(name = "certificado_chip_path", nullable = false, length = 255)
    private String certificadoChipPath;

    @Column(name = "carnet_vacunacion_path", nullable = false, length = 255)
    private String carnetVacunacionPath;
}
