package com.appCasa.app.modelo;

import java.util.List;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String rol;

    private String telefono;
    private String direccion;

    @OneToMany(mappedBy = "usuario")
    @JsonIgnore
    private List<Vehiculo> vehiculos;

    @Transient
    private boolean esPropietario;
    
    public boolean isEsPropietario() {
        return esPropietario;
    }

    public void setEsPropietario(boolean esPropietario) {
        this.esPropietario = esPropietario;
    }
}