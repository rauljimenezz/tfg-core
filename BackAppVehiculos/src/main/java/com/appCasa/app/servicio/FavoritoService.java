package com.appCasa.app.servicio;

import com.appCasa.app.modelo.Favorito;
import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.repositorio.FavoritoRepository;
import com.appCasa.app.repositorio.VehiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FavoritoService {

    @Autowired
    private FavoritoRepository favoritoRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    public List<Favorito> obtenerFavoritosDeUsuario(Usuario usuario) {
        return favoritoRepository.findByUsuario(usuario);
    }

    public void agregarAFavoritos(Usuario usuario, Long vehiculoId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        if (!Boolean.TRUE.equals(vehiculo.getValidada())) {
            throw new RuntimeException("No se puede agregar a favoritos un vehículo no validado.");
        }

        boolean yaFavorito = favoritoRepository.findByUsuarioAndVehiculo(usuario, vehiculo).isPresent();
        if (yaFavorito) {
            throw new RuntimeException("Este vehículo ya está en tus favoritos.");
        }

        Favorito favorito = new Favorito(null, usuario, vehiculo);
        favoritoRepository.save(favorito);
    }

    public void eliminarDeFavoritos(Usuario usuario, Long vehiculoId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        Favorito favorito = favoritoRepository.findByUsuarioAndVehiculo(usuario, vehiculo)
                .orElseThrow(() -> new RuntimeException("No existe este vehículo en tus favoritos."));

        favoritoRepository.delete(favorito);
    }

    public boolean existeFavorito(Usuario usuario, Long vehiculoId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        return favoritoRepository.findByUsuarioAndVehiculo(usuario, vehiculo).isPresent();
    }
}