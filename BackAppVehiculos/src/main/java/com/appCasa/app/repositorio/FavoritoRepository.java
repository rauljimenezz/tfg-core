package com.appCasa.app.repositorio;

import com.appCasa.app.modelo.Favorito;
import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoritoRepository extends JpaRepository<Favorito, Long> {
    void deleteByVehiculo(Vehiculo vehiculo);
    List<Favorito> findByUsuario(Usuario usuario);
    Optional<Favorito> findByUsuarioAndVehiculo(Usuario usuario, Vehiculo vehiculo);
}