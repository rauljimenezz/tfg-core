package com.appCasa.app.repositorio;

import com.appCasa.app.modelo.Disponibilidad;
import com.appCasa.app.modelo.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisponibilidadRepository extends JpaRepository<Disponibilidad, Long> {
    List<Disponibilidad> findByVehiculo(Vehiculo vehiculo);
}
