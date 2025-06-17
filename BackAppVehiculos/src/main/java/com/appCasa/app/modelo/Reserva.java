package com.appCasa.app.modelo;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "vehiculo_id", nullable = false)
    private Vehiculo vehiculo;

    @Column(nullable = true)
    private String fechaInicio;

    @Column(nullable = true)
    private String fechaFin;

    @Column(nullable = true)
    private String fechaReserva;

    @Column(nullable = true)
    private String fechaExpiracion;

    @Column(nullable = false)
    private Double total;

    @Column(nullable = true, name = "precio_dia")
    private Double precioDia;

    @Column(nullable = false)
    private Boolean confirmado = false;
}