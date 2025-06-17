package com.appCasa.app.servicio;

import com.appCasa.app.modelo.Alerta;
import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.TipoOperacion;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.repositorio.AlertaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AlertaService {

    @Autowired
    private AlertaRepository alertaRepository;

    @Autowired
    private EmailService emailService;

    public Alerta crearAlerta(Alerta alerta) {
        alerta.setActiva(true);
        return alertaRepository.save(alerta);
    }

    public List<Alerta> obtenerAlertasPorUsuario(Usuario usuario) {
        return alertaRepository.findByUsuario(usuario);
    }

    public void eliminarAlerta(Long id, Usuario usuario) {
        Alerta alerta = alertaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada"));

        if (!alerta.getUsuario().getId().equals(usuario.getId()) && !usuario.getRol().equals("ADMIN")) {
            throw new RuntimeException("No autorizado para eliminar esta alerta.");
        }

        alertaRepository.delete(alerta);
    }

    public void comprobarAlertasYNotificar(Vehiculo vehiculo) {
        /*List<Alerta> alertas = alertaRepository.findAll();

        for (Alerta alerta : alertas) {
            boolean coincide = true;

            if (alerta.getUbicacion() != null &&
                    !vehiculo.getUbicacion().toLowerCase().contains(alerta.getUbicacion().toLowerCase())) {
                coincide = false;
            }

            if (alerta.getMarca() != null &&
                    !vehiculo.getMarca().equalsIgnoreCase(alerta.getMarca())) {
                coincide = false;
            }

            if (alerta.getPrecioMax() != null &&
                    vehiculo.getPrecioTotal() > alerta.getPrecioMax()) {
                coincide = false;
            }

            if (alerta.getAñoMin() != null &&
                    vehiculo.getAño() < alerta.getAñoMin()) {
                coincide = false;
            }

            if (alerta.getAñoMax() != null &&
                    vehiculo.getAño() > alerta.getAñoMax()) {
                coincide = false;
            }

            if (alerta.getKilometrajeMax() != null &&
                    vehiculo.getKilometraje() > alerta.getKilometrajeMax()) {
                coincide = false;
            }

            if (alerta.getTipoOperacion() != null &&
                    !alerta.getTipoOperacion().equals(vehiculo.getTipoOperacion())) {
                coincide = false;
            }

            if (coincide) {
                try {
                    String asunto = "Nuevo vehículo que coincide con tu alerta";
                    String cuerpo = "<h3>¡Buenas noticias!</h3>"
                            + "<p>Se ha publicado un nuevo vehículo que coincide con tu alerta:</p>"
                            + "<ul>"
                            + "<li><b>Marca/Modelo:</b> " + vehiculo.getMarca() + " " + vehiculo.getModelo() + "</li>"
                            + "<li><b>Año:</b> " + vehiculo.getAño() + "</li>"
                            + "<li><b>Kilometraje:</b> " + vehiculo.getKilometraje() + " km</li>"
                            + "<li><b>Precio:</b> " + vehiculo.getPrecioTotal() + "€</li>"
                            + "</ul>"
                            + "<p>Accede a la plataforma para verlo.</p>";

                    emailService.enviarEmail(alerta.getUsuario().getEmail(), asunto, cuerpo);
                } catch (Exception e) {
                    System.out.println("❌ Error al enviar email de alerta: " + e.getMessage());
                }
            }
        }*/
    }
}