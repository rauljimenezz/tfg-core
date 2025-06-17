package com.appCasa.app.controlador;

import com.appCasa.app.modelo.Reseña;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.repositorio.ReseñaRepository;
import com.appCasa.app.servicio.ReseñaService;
import com.appCasa.app.servicio.UsuarioService;
import com.appCasa.app.seguridad.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reseñas")
@CrossOrigin(origins = "http://localhost:8081")
@Tag(name = "Reseñas", description = "Gestión de reseñas de vehículos")
@SecurityRequirement(name = "bearerAuth")
public class ReseñaController {

    @Autowired
    private ReseñaService reseñaService;

    @Autowired
    private ReseñaRepository reseñaRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsuarioService usuarioService;

    @Operation(summary = "Crear reseña", description = "Crea una nueva reseña para un vehículo")
    @ApiResponse(responseCode = "201", description = "Reseña creada exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos de reseña inválidos")
    @PostMapping("/vehiculo/{vehiculoId}")
    public ResponseEntity<?> crearReseña(@PathVariable Long vehiculoId,
            @RequestBody Reseña reseña,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.extraerEmail(token);

            Usuario usuario = usuarioService.buscarPorEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            reseña.setUsuario(usuario);

            if (reseña.getCalificacion() < 1 || reseña.getCalificacion() > 5) {
                return ResponseEntity.status(400)
                        .body(Map.of("error", "La calificación debe estar entre 1 y 5 estrellas."));
            }
            if (reseña.getComentario() == null || reseña.getComentario().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "El comentario no puede estar vacío."));
            }

            Reseña nuevaReseña = reseñaService.crearReseña(vehiculoId, reseña);
            return ResponseEntity.status(201).body(nuevaReseña);

        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Ocurrió un error inesperado. Inténtalo de nuevo más tarde."));
        }
    }

    @Operation(summary = "Obtener reseñas por vehículo", description = "Lista todas las reseñas de un vehículo específico")
    @ApiResponse(responseCode = "200", description = "Lista de reseñas obtenida exitosamente")
    @GetMapping("/vehiculo/{vehiculoId}")
    public ResponseEntity<List<Reseña>> obtenerReseñasPorVehiculo(@PathVariable Long vehiculoId) {
        List<Reseña> reseñas = reseñaService.obtenerReseñasPorVehiculo(vehiculoId);

        reseñas.forEach(reseña -> {
            if (reseña.getUsuario() != null) {
                Hibernate.initialize(reseña.getUsuario());
            }
        });

        return ResponseEntity.ok(reseñas);
    }

    @Operation(summary = "Responder reseña", description = "Permite al propietario o administrador responder una reseña")
    @ApiResponse(responseCode = "200", description = "Respuesta agregada exitosamente")
    @ApiResponse(responseCode = "404", description = "Reseña no encontrada")
    @PostMapping("/responder/{reseñaId}")
    public ResponseEntity<?> responderReseña(@PathVariable Long reseñaId,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String respuesta = body.get("respuesta");

        if (usuario.getRol().equals("ADMIN")) {
            Reseña reseña = reseñaRepository.findById(reseñaId)
                    .orElseThrow(() -> new RuntimeException("Reseña no encontrada"));
            reseña.setRespuestaDueño(respuesta);
            return ResponseEntity.ok(reseñaRepository.save(reseña));
        }

        Reseña reseñaActualizada = reseñaService.responderReseña(reseñaId, usuario, respuesta);
        return ResponseEntity.ok(reseñaActualizada);
    }

    @Operation(summary = "Obtener reseñas del usuario", description = "Lista todas las reseñas realizadas por el usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Lista de reseñas obtenida exitosamente")
    @GetMapping("/usuario")
    public ResponseEntity<List<Reseña>> obtenerReseñasDeUsuario(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Reseña> reseñas = reseñaRepository.findByUsuario(usuario);
        return ResponseEntity.ok(reseñas);
    }

    @Operation(summary = "Eliminar reseña", description = "Elimina una reseña específica")
    @ApiResponse(responseCode = "200", description = "Reseña eliminada exitosamente")
    @ApiResponse(responseCode = "404", description = "Reseña no encontrada")
    @DeleteMapping("/{reseñaId}")
    public ResponseEntity<?> eliminarReseña(@PathVariable Long reseñaId,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        reseñaService.eliminarReseña(reseñaId, usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Reseña eliminada correctamente"));
    }

    @Operation(summary = "Obtener promedio de calificación", description = "Calcula el promedio de calificaciones de un vehículo")
    @ApiResponse(responseCode = "200", description = "Promedio calculado exitosamente")
    @GetMapping("/promedio/{vehiculoId}")
    public ResponseEntity<?> obtenerPromedioCalificacion(@PathVariable Long vehiculoId) {
        double promedio = reseñaService.obtenerPromedioCalificacion(vehiculoId);
        return ResponseEntity.ok(Map.of("promedio", promedio));
    }

    @Operation(summary = "Obtener todas las reseñas (Admin)", description = "Lista todas las reseñas del sistema (solo administradores)")
    @ApiResponse(responseCode = "200", description = "Lista de reseñas obtenida exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<List<Reseña>> obtenerTodasReseñas(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!"ADMIN".equals(usuario.getRol())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Reseña> reseñas = reseñaRepository.findAll();

        reseñas.forEach(reseña -> {
            Hibernate.initialize(reseña.getVehiculo());
            Hibernate.initialize(reseña.getUsuario());
        });

        return ResponseEntity.ok(reseñas);
    }

    @Operation(summary = "Obtener reseñas como propietario", description = "Lista las reseñas de los vehículos del usuario autenticado (propietario)")
    @ApiResponse(responseCode = "200", description = "Lista de reseñas obtenida exitosamente")
    @GetMapping("/propietario")
    public ResponseEntity<List<Reseña>> getReviewsForOwner(@RequestHeader("Authorization") String authHeader) {
        String email = jwtUtil.extraerEmail(authHeader.substring(7));
        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Reseña> reviews = reseñaService.findByOwnerId(usuario.getId());
        reviews.forEach(r -> {
            Hibernate.initialize(r.getVehiculo());
            Hibernate.initialize(r.getUsuario());
        });
        return ResponseEntity.ok(reviews);
    }
}