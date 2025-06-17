package com.appCasa.app.repositorio;

import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.Reserva;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    void deleteByVehiculo(Vehiculo vehiculo);
    List<Reserva> findByVehiculo(Vehiculo vehiculo);
}