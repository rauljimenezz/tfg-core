package com.appCasa.app.repositorio;

import com.appCasa.app.modelo.Reseña;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.modelo.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReseñaRepository extends JpaRepository<Reseña, Long> {
    @Query("SELECT r FROM Reseña r LEFT JOIN FETCH r.vehiculo")
    List<Reseña> findAllWithVehiculo();
    List<Reseña> findByVehiculo(Vehiculo vehiculo);
    List<Reseña> findByUsuario(Usuario usuario);
    void deleteByVehiculo(Vehiculo vehiculo);
    @Query("SELECT r FROM Reseña r JOIN FETCH r.vehiculo v WHERE v.usuario.id = :propietarioId")
  List<Reseña> findByVehiculoUsuarioId(@Param("propietarioId") Long propietarioId);
}