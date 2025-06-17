package com.appCasa.app.modelo;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "alertas")
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ubicacion;
    private String marca;
    private String modelo;
    private Integer añoMin;
    private Integer añoMax;
    private Integer kilometrajeMax;
    private Double precioMax;

    @Enumerated(EnumType.STRING)
    private TipoOperacion tipoOperacion;

    private Boolean activa = true;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
}