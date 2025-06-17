package com.appCasa.app.servicio;

import com.appCasa.app.modelo.*;
import com.appCasa.app.repositorio.*;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class VehiculoService {

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private ReseñaRepository reseñaRepository;

    @Autowired
    private FavoritoRepository favoritoRepository;

    @Autowired
    private DisponibilidadRepository disponibilidadRepository;

    @Autowired
    private AlertaService alertaService;

    public List<Vehiculo> obtenerTodas() {
        return vehiculoRepository.findAll();
    }

    public Vehiculo buscarPorId(Long id) {
        return vehiculoRepository.findById(id).orElse(null);
    }

    public Vehiculo guardarVehiculo(Vehiculo vehiculo) {
        if (vehiculo.getId() == null) {
            if (vehiculoRepository.existsByMatriculaAndTipoOperacion(
                    vehiculo.getMatricula(),
                    vehiculo.getTipoOperacion())) {
                throw new RuntimeException(
                        "Ya existe un vehículo con la misma matrícula para "
                                + vehiculo.getTipoOperacion());
            }
        } else {
            if (vehiculoRepository
                    .existsByMatriculaAndTipoOperacionAndIdNot(
                            vehiculo.getMatricula(),
                            vehiculo.getTipoOperacion(),
                            vehiculo.getId())) {
                throw new RuntimeException(
                        "Ya existe otro vehículo con la misma matrícula para "
                                + vehiculo.getTipoOperacion());
            }
        }

        Vehiculo guardado = vehiculoRepository.save(vehiculo);

        if (Boolean.TRUE.equals(guardado.getValidada())) {
            alertaService.comprobarAlertasYNotificar(guardado);
        }

        return guardado;
    }

    @Transactional
    public void eliminarVehiculo(Long id) {
        Vehiculo vehiculo = vehiculoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + id));

        try {
            favoritoRepository.deleteByVehiculo(vehiculo);
            reseñaRepository.deleteByVehiculo(vehiculo);

            List<Reserva> reservas = reservaRepository.findByVehiculo(vehiculo);
            reservaRepository.deleteAll(reservas);

            List<Disponibilidad> disponibilidades = disponibilidadRepository.findByVehiculo(vehiculo);
            disponibilidadRepository.deleteAll(disponibilidades);

            vehiculoRepository.delete(vehiculo);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo eliminar el vehículo", e);
        }
    }

    public List<Vehiculo> listarVehiculos() {
        return vehiculoRepository.findAll();
    }

    public List<Vehiculo> buscarPorUbicacion(String ubicacion) {
        return vehiculoRepository.findByUbicacion(ubicacion);
    }

    public List<Vehiculo> buscarConFiltros(String ubicacion,
                                       Double precioMin, Double precioMax,
                                       Integer añoMin, Integer añoMax,
                                       Integer kilometrajeMax, Integer capacidadMin,
                                       String marca, String modelo,
                                       TipoOperacion tipo) {

    Specification<Vehiculo> spec = (root, query, criteriaBuilder) -> {
        Predicate predicate = criteriaBuilder.conjunction();
        predicate = criteriaBuilder.and(predicate, criteriaBuilder.isTrue(root.get("validada")));

        if (ubicacion != null && !ubicacion.isBlank())
            predicate = criteriaBuilder.and(predicate,
               criteriaBuilder.like(criteriaBuilder.lower(root.get("ubicacion")), "%" + ubicacion.toLowerCase() + "%"));
        if (precioMin != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                criteriaBuilder.ge(root.get("precioTotal"),   precioMin),
                criteriaBuilder.ge(root.get("precioPorDia"),  precioMin)
            ));
        }
        if (precioMax != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.or(
                criteriaBuilder.le(root.get("precioTotal"),   precioMax),
                criteriaBuilder.le(root.get("precioPorDia"),  precioMax)
            ));
        }

            if (añoMin != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.greaterThanOrEqualTo(root.get("año"), añoMin));
            }

            if (añoMax != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.lessThanOrEqualTo(root.get("año"), añoMax));
            }

            if (kilometrajeMax != null) {
                predicate = criteriaBuilder.and(predicate,
                        criteriaBuilder.lessThanOrEqualTo(root.get("kilometraje"), kilometrajeMax));
            }

            if (capacidadMin != null)
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.ge(root.get("capacidadPasajeros"), capacidadMin));

        if (marca != null && !marca.isBlank())
            predicate = criteriaBuilder.and(predicate,
               criteriaBuilder.like(criteriaBuilder.lower(root.get("marca")), "%" + marca.toLowerCase() + "%"));

        if (modelo != null && !modelo.isBlank())
            predicate = criteriaBuilder.and(predicate,
               criteriaBuilder.like(criteriaBuilder.lower(root.get("modelo")), "%" + modelo.toLowerCase() + "%"));

        if (tipo != null)
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.equal(root.get("tipoOperacion"), tipo));

        return predicate;
    };

    return vehiculoRepository.findAll(spec);
}

    public void validarDatosVehiculo(Vehiculo vehiculo) {
        if (vehiculo.getTipoOperacion() == null) {
            throw new RuntimeException("Debe especificar el tipo de operación.");
        }

        switch (vehiculo.getTipoOperacion()) {
            case VENTA:
                if (vehiculo.getPrecioTotal() == null || vehiculo.getPrecioTotal() <= 0) {
                    throw new RuntimeException("Debe indicar un precio total válido para vehículo en venta.");
                }
                vehiculo.setPrecioPorDia(null);
                break;

            case ALQUILER:
                if (vehiculo.getPrecioPorDia() == null || vehiculo.getPrecioPorDia() <= 0) {
                    throw new RuntimeException("Debe indicar un precio por día válido para alquiler.");
                }
                vehiculo.setPrecioTotal(null);
                break;
        }
    }

    public List<Vehiculo> buscarPorUsuario(Usuario usuario) {
        return vehiculoRepository.findByUsuario(usuario);
    }
}