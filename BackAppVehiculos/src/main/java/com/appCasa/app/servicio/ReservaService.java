package com.appCasa.app.servicio;

import com.appCasa.app.modelo.*;
import com.appCasa.app.repositorio.*;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class ReservaService {

    @Autowired
    private ReservaRepository reservaRepository;
    @Autowired
    private VehiculoRepository vehiculoRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private EmailService emailService;
    @Autowired
    private DisponibilidadRepository disponibilidadRepository;

    public Reserva crearReserva(Reserva reserva) {
        Vehiculo vehiculo = vehiculoRepository.findById(reserva.getVehiculo().getId())
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));
        Usuario usuario = usuarioRepository.findById(reserva.getUsuario().getId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        reserva.setFechaReserva(LocalDate.now().toString());

        switch (vehiculo.getTipoOperacion()) {
            case VENTA -> prepararReservaVenta(reserva, vehiculo);
            case ALQUILER -> prepararReservaAlquiler(reserva, vehiculo);
        }

        reserva.setVehiculo(vehiculo);
        reserva.setUsuario(usuario);
        reservaRepository.save(reserva);

        if (reserva.getFechaInicio() != null && reserva.getFechaFin() != null) {
            guardarBloque(reserva, "RESERVA_PENDIENTE");
        }

        enviarCorreos(reserva, vehiculo, usuario);

        return reserva;
    }

    private void prepararReservaVenta(Reserva reserva, Vehiculo vehiculo) {
        if (vehiculo.getReservado()) {
            throw new RuntimeException("Este vehículo ya está reservado para compra.");
        }
        reserva.setPrecioDia(null);
        reserva.setTotal(vehiculo.getPrecioTotal());
        reserva.setFechaExpiracion(LocalDate.now().plusMonths(1).toString());
        vehiculo.setReservado(true);
        vehiculo.setDisponible(false);
        reserva.setConfirmado(false);
        vehiculoRepository.save(vehiculo);
    }

    private void prepararReservaAlquiler(Reserva reserva, Vehiculo vehiculo) {
        if (reserva.getFechaInicio() == null || reserva.getFechaFin() == null) {
            throw new RuntimeException("Fechas obligatorias para alquiler.");
        }
        if (!isVehiculoDisponible(vehiculo, reserva.getFechaInicio(), reserva.getFechaFin())) {
            throw new RuntimeException("El vehículo no está disponible en estas fechas.");
        }
        reserva.setPrecioDia(vehiculo.getPrecioPorDia());
        reserva.setTotal(calcularTotalAlquiler(vehiculo, reserva.getFechaInicio(), reserva.getFechaFin()));
        reserva.setFechaExpiracion(null);
        reserva.setConfirmado(false);
    }

    private boolean isVehiculoDisponible(Vehiculo vehiculo, String fechaInicio, String fechaFin) {

        for (Reserva r : reservaRepository.findAll()) {
            if (r.getVehiculo().getId().equals(vehiculo.getId())
                    && rangoSolapado(fechaInicio, fechaFin, r.getFechaInicio(), r.getFechaFin())) {
                return false;
            }
        }

        for (Disponibilidad d : disponibilidadRepository.findByVehiculo(vehiculo)) {
            if (rangoSolapado(fechaInicio, fechaFin, d.getFechaInicio(), d.getFechaFin())) {
                return false;
            }
        }
        return true;
    }

    private boolean rangoSolapado(String ini1, String fin1, String ini2, String fin2) {
        return ini1.compareTo(fin2) < 0 && fin1.compareTo(ini2) > 0;
    }

    private void guardarBloque(Reserva reserva, String motivo) {
        Disponibilidad bloque = new Disponibilidad();
        bloque.setVehiculo(reserva.getVehiculo());
        bloque.setFechaInicio(reserva.getFechaInicio());
        bloque.setFechaFin(reserva.getFechaFin());
        bloque.setMotivo(motivo);
        disponibilidadRepository.save(bloque);
    }

    public Reserva actualizarReserva(Reserva reserva) {
        Reserva existente = reservaRepository.findById(reserva.getId())
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        Boolean confirmadoPrevio = existente.getConfirmado();
        existente.setConfirmado(reserva.getConfirmado());
        reservaRepository.save(existente);

        if (!Objects.equals(confirmadoPrevio, reserva.getConfirmado())) {
            actualizarBloqueDisponibilidad(existente);
        }

        if (existente.getVehiculo().getTipoOperacion() == TipoOperacion.VENTA && !existente.getConfirmado()) {
            Vehiculo v = existente.getVehiculo();
            v.setReservado(false);
            v.setDisponible(true);
            vehiculoRepository.save(v);
        }

        notificarDecisionReserva(existente);
        return existente;
    }

    private void actualizarBloqueDisponibilidad(Reserva reserva) {
        disponibilidadRepository.findByVehiculo(reserva.getVehiculo()).stream()
                .filter(d -> Objects.equals(d.getFechaInicio(), reserva.getFechaInicio())
                        && Objects.equals(d.getFechaFin(), reserva.getFechaFin()))
                .forEach(d -> {
                    d.setMotivo(reserva.getConfirmado() ? "RESERVA_CONFIRMADA" : "RESERVA_PENDIENTE");
                    disponibilidadRepository.save(d);
                });
    }

    public void cancelarReserva(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (reserva.getVehiculo().getTipoOperacion() == TipoOperacion.VENTA) {
            Vehiculo vehiculo = reserva.getVehiculo();
            vehiculo.setReservado(false);
            vehiculo.setDisponible(true);
            vehiculoRepository.save(vehiculo);
        }

        disponibilidadRepository.findByVehiculo(reserva.getVehiculo()).stream()
                .filter(d -> Objects.equals(d.getFechaInicio(), reserva.getFechaInicio())
                        && Objects.equals(d.getFechaFin(), reserva.getFechaFin()))
                .forEach(disponibilidadRepository::delete);

        reservaRepository.delete(reserva);
        notificarCancelacionReserva(reserva);
    }

    private double calcularTotalAlquiler(Vehiculo vehiculo, String fechaInicio, String fechaFin) {
        LocalDate ini = LocalDate.parse(fechaInicio);
        LocalDate fin = LocalDate.parse(fechaFin);
        long dias = ChronoUnit.DAYS.between(ini, fin);
        return dias * vehiculo.getPrecioPorDia();
    }

    public List<Reserva> listarReservas() { return reservaRepository.findAll(); }

    public Reserva buscarReserva(Long id) { return reservaRepository.findById(id).orElse(null); }

    public List<Reserva> obtenerReservasDeVehiculosDelDueño(Long usuarioId) {
        List<Vehiculo> mios = vehiculoRepository.findAll().stream()
                .filter(v -> v.getUsuario().getId().equals(usuarioId)).toList();
        return reservaRepository.findAll().stream()
                .filter(r -> mios.contains(r.getVehiculo())).toList();
    }

    public List<Reserva> obtenerReservasDeUsuario(Long usuarioId) {
        return reservaRepository.findAll().stream()
                .filter(r -> r.getUsuario().getId().equals(usuarioId)).toList();
    }

    private void enviarCorreos(Reserva reserva, Vehiculo vehiculo, Usuario usuario) {
        /*
        try {
            String asuntoUsuario = "Reserva en espera de confirmación";
            String cuerpoUsuario = "<h2>Reserva enviada</h2>" +
                    "<p>Vehículo: <b>" + vehiculo.getMarca() + " " + vehiculo.getModelo() + "</b></p>" +
                    (vehiculo.getTipoOperacion() == TipoOperacion.VENTA
                        ? "<p>Reserva para compra con señal del 5%.</p>"
                        : "<p>Fechas reservadas: " + reserva.getFechaInicio() + " al " + reserva.getFechaFin() + "</p>" +
                          "<p>Total: $" + reserva.getTotal() + "</p>") +
                    "<p>El propietario revisará tu solicitud.</p>";
            emailService.enviarEmail(usuario.getEmail(), asuntoUsuario, cuerpoUsuario);

            String asuntoDueno = "Nueva solicitud de reserva - " + vehiculo.getMarca() + " " + vehiculo.getModelo();
            String cuerpoDueno = "<h2>Nueva solicitud de reserva</h2>" +
                    "<p>Usuario: <b>" + usuario.getNombre() + "</b></p>" +
                    (vehiculo.getTipoOperacion() == TipoOperacion.VENTA
                        ? "<p>Reserva para compra con señal del 5%.</p>"
                        : "<p>Fechas solicitadas: " + reserva.getFechaInicio() + " al " + reserva.getFechaFin() + "</p>" +
                          "<p>Total a cobrar: $" + reserva.getTotal() + "</p>") +
                    "<p>Confirma o rechaza desde tu panel.</p>";
            emailService.enviarEmail(vehiculo.getUsuario().getEmail(), asuntoDueno, cuerpoDueno);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
        */
    }

    private void notificarDecisionReserva(Reserva reserva) {
        /*
        try {
            String asunto = reserva.getConfirmado() ? "Reserva confirmada" : "Reserva rechazada";
            String cuerpo = "<h2>" + asunto + "</h2>" +
                    "<p>Vehículo: <b>" + reserva.getVehiculo().getMarca() + " " + reserva.getVehiculo().getModelo() + "</b></p>" +
                    (reserva.getConfirmado() ? "<p>Tu reserva ha sido aprobada.</p>"
                                             : "<p>Tu reserva fue rechazada.</p>");
            emailService.enviarEmail(reserva.getUsuario().getEmail(), asunto, cuerpo);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
        */
    }

    private void notificarCancelacionReserva(Reserva reserva) {
        /*
        try {
            String asunto = "Reserva cancelada";
            String cuerpo = "<h2>Reserva cancelada</h2>" +
                    "<p>La reserva para el vehículo <b>" + reserva.getVehiculo().getMarca() + " " + reserva.getVehiculo().getModelo() + "</b> ha sido cancelada.</p>";
            emailService.enviarEmail(reserva.getUsuario().getEmail(), asunto, cuerpo);

            if (!reserva.getUsuario().getEmail().equals(reserva.getVehiculo().getUsuario().getEmail())) {
                emailService.enviarEmail(reserva.getVehiculo().getUsuario().getEmail(), asunto, cuerpo);
            }
        } catch (MessagingException e) {
            e.printStackTrace();
        }
        */
    }
}
