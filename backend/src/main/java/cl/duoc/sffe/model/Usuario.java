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

/**
 * Usuario del sistema: pasajeros, funcionarios (Aduana, PDI, SAG) y
 * administradores (RF01).
 */
@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    /**
     * Identificador del usuario: RUT, pasaporte, cédula extranjera o código
     * temporal {@code TEMP-...} para pasajeros sin documento (RF01).
     */
    @Column(name = "identificador", nullable = false, unique = true, length = 30)
    private String identificador;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento", nullable = false)
    private TipoDocumento tipoDocumento;

    @Column(name = "correo", nullable = false, length = 100)
    private String correo;

    /** Contraseña encriptada con BCrypt, nunca en texto plano. */
    @Column(name = "contrasena", nullable = false, length = 255)
    private String contrasena;

    @Column(name = "nacionalidad", nullable = false, length = 50)
    private String nacionalidad;

    @Column(name = "telefono", nullable = false, length = 20)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false)
    private Rol rol;

    /**
     * Fecha de nacimiento del titular de la cuenta (RF01). Obligatoria para
     * pasajeros autoregistrados; nula para funcionarios/admin creados por
     * semilla, que no pasan por el formulario público de registro.
     */
    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    /**
     * Ruta relativa del carnet de identidad adjuntado en el registro (RF01).
     * Obligatorio para pasajeros con tipo de documento distinto de
     * SIN_DOCUMENTO; nulo para funcionarios/admin y para SIN_DOCUMENTO.
     */
    @Column(name = "carnet_identidad_path", length = 255)
    private String carnetIdentidadPath;

    /** Ruta relativa de los papeles de antecedentes adjuntados en el registro (RF01). */
    @Column(name = "papeles_antecedentes_path", length = 255)
    private String papelesAntecedentesPath;

    /** true una vez que el pasajero confirmó el correo con el enlace enviado al registrarse (RF01). */
    @Column(name = "correo_verificado", nullable = false)
    @Builder.Default
    private Boolean correoVerificado = false;

    /** Token de un solo uso para verificar el correo (nulo una vez verificado). */
    @Column(name = "token_verificacion_correo", length = 64)
    private String tokenVerificacionCorreo;

    @Column(name = "token_verificacion_expira")
    private LocalDateTime tokenVerificacionExpira;

    /** Token de un solo uso para restablecer la contraseña (nulo salvo solicitud activa). */
    @Column(name = "token_reset_password", length = 64)
    private String tokenResetPassword;

    @Column(name = "token_reset_expira")
    private LocalDateTime tokenResetExpira;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
