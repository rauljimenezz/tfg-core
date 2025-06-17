package com.appCasa.app.modelo;

import java.util.List;
import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "vehiculos", uniqueConstraints = @UniqueConstraint( columnNames = {"matricula", "tipo_operacion"}))
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Pattern(
        regexp = "\\d{4}[A-Z]{3}",
        message = "La matrícula debe tener el formato 0000XXX"
    )
    @Column(nullable = false, length = 7)
    private String matricula;

    @Column(nullable = false, length = 1000)
    private String descripcion;

    @Column(nullable = false)
    private String ubicacion;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String modelo;

    @Column(nullable = false)
    private Integer año;

    @Column(nullable = false)
    private Integer kilometraje;

    @Column(nullable = true)
    private Double precioPorDia;

    @Column(nullable = true)
    private Double precioTotal;

    @Column(nullable = false)
    private Integer capacidadPasajeros;

    @Column(nullable = false)
    private Boolean disponible;

    @Column(nullable = false)
    private Boolean validada = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoOperacion tipoOperacion;

    @Column(nullable = false)
    private Boolean reservado = false;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @OneToMany(mappedBy = "vehiculo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Reseña> reseñas;

    @ElementCollection
    @CollectionTable(name = "vehiculo_imagenes", joinColumns = @JoinColumn(name = "vehiculo_id"))
    @Column(name = "url_imagen")
    private List<String> imagenes;
}