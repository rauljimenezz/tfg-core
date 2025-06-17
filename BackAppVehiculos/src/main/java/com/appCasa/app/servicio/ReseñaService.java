package com.appCasa.app.servicio;

import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.Reseña;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.repositorio.ReseñaRepository;
import com.appCasa.app.repositorio.VehiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class ReseñaService {

    @Autowired
    private ReseñaRepository reseñaRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    public Reseña crearReseña(Long vehiculoId, Reseña reseña) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado."));

        reseña.setVehiculo(vehiculo);
        reseña.setFechaReseña(LocalDate.now());

        return reseñaRepository.save(reseña);
    }

    public List<Reseña> obtenerReseñasPorVehiculo(Long vehiculoId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado."));

        return reseñaRepository.findByVehiculo(vehiculo);
    }

    public Reseña responderReseña(Long reseñaId, Usuario usuario, String respuesta) {
        Reseña reseña = reseñaRepository.findById(reseñaId)
                .orElseThrow(() -> new RuntimeException("Reseña no encontrada."));

        if (!reseña.getVehiculo().getUsuario().getId().equals(usuario.getId())
                && !usuario.getRol().equals("ADMIN")) {
            throw new RuntimeException("Solo el dueño del vehículo o un administrador puede responder a esta reseña.");
        }

        reseña.setRespuestaDueño(respuesta);
        return reseñaRepository.save(reseña);
    }

    public void eliminarReseña(Long reseñaId, Usuario usuario) {
        Reseña reseña = reseñaRepository.findById(reseñaId)
                .orElseThrow(() -> new RuntimeException("Reseña no encontrada."));

        if (!reseña.getUsuario().getId().equals(usuario.getId()) && !usuario.getRol().equals("ADMIN")) {
            throw new RuntimeException("No tienes permiso para eliminar esta reseña.");
        }

        reseñaRepository.delete(reseña);
    }

    public double obtenerPromedioCalificacion(Long vehiculoId) {
        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado."));

        List<Reseña> reseñas = reseñaRepository.findByVehiculo(vehiculo);

        if (reseñas.isEmpty()) {
            return 0.0;
        }

        double suma = reseñas.stream().mapToInt(Reseña::getCalificacion).sum();
        return suma / reseñas.size();
    }

    public List<Reseña> findByOwnerId(Long ownerId) {
    return reseñaRepository.findByVehiculoUsuarioId(ownerId);
  }
}