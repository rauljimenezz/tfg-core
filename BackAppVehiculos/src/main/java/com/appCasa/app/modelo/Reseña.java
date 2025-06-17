package com.appCasa.app.modelo;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "reseñas")
public class Reseña {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "vehiculo_id", nullable = false)
    @JsonBackReference
    private Vehiculo vehiculo;

    @Column(nullable = false)
    private int calificacion;

    @Column(nullable = true, length = 1000)
    private String comentario;

    @Column(nullable = false)
    private LocalDate fechaReseña;

    @Column(nullable = true, length = 1000)
    private String respuestaDueño;
}