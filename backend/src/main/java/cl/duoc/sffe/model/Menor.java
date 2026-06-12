package cl.duoc.sffe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Menor de edad asociado a un expediente de viaje (RF02).
 */
@Entity
@Table(name = "menores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_menor")
    private Integer idMenor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_viaje", nullable = false)
    private Viaje viaje;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "rut", nullable = false, length = 12)
    private String rut;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    /** Indica si el menor viaja sin ambos padres y requiere autorización notarial. */
    @Column(name = "requiere_autorizacion", nullable = false)
    @Builder.Default
    private Boolean requiereAutorizacion = false;
}
