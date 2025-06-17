package com.appCasa.app.servicio;

import com.appCasa.app.modelo.Disponibilidad;
import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.repositorio.DisponibilidadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DisponibilidadService {

    @Autowired
    private DisponibilidadRepository disponibilidadRepository;

    @Autowired
    private VehiculoService vehiculoService;

    public Disponibilidad agregarDisponibilidad(Long vehiculoId, Disponibilidad disponibilidad) {
        Vehiculo vehiculo = vehiculoService.buscarPorId(vehiculoId);
        if (vehiculo == null) {
            throw new RuntimeException("Vehículo no encontrado.");
        }
        disponibilidad.setVehiculo(vehiculo);
        return disponibilidadRepository.save(disponibilidad);
    }

    public List<Disponibilidad> listarDisponibilidadesPorVehiculo(Long vehiculoId) {
        Vehiculo vehiculo = vehiculoService.buscarPorId(vehiculoId);
        if (vehiculo == null) {
            throw new RuntimeException("Vehículo no encontrado.");
        }
        return disponibilidadRepository.findByVehiculo(vehiculo);
    }

    public Disponibilidad buscarDisponibilidadPorId(Long id) {
        return disponibilidadRepository.findById(id).orElse(null);
    }

    public void eliminarDisponibilidad(Long id) {
        disponibilidadRepository.deleteById(id);
    }
}