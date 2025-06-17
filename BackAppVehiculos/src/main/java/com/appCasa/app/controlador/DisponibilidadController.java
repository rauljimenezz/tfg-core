package com.appCasa.app.controlador;

import com.appCasa.app.modelo.Disponibilidad;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.seguridad.JwtUtil;
import com.appCasa.app.servicio.DisponibilidadService;
import com.appCasa.app.servicio.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/disponibilidades")
@Tag(name = "Disponibilidades", description = "Gestión de disponibilidades de vehículos")
@SecurityRequirement(name = "bearerAuth")
public class DisponibilidadController {

    @Autowired
    private DisponibilidadService disponibilidadService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtUtil jwtUtil;

    @Operation(summary = "Agregar disponibilidad", description = "Agrega una nueva disponibilidad para un vehículo")
    @ApiResponse(responseCode = "200", description = "Disponibilidad agregada exitosamente")
    @PostMapping("/{vehiculoId}")
    public ResponseEntity<Disponibilidad> agregarDisponibilidad(@PathVariable Long vehiculoId,
            @RequestBody Disponibilidad disponibilidad) {
        Disponibilidad nuevaDisponibilidad = disponibilidadService.agregarDisponibilidad(vehiculoId, disponibilidad);
        return ResponseEntity.ok(nuevaDisponibilidad);
    }

    @Operation(summary = "Listar disponibilidades", description = "Obtiene todas las disponibilidades de un vehículo")
    @ApiResponse(responseCode = "200", description = "Lista de disponibilidades obtenida exitosamente")
    @GetMapping("/{vehiculoId}")
    public ResponseEntity<List<Disponibilidad>> listarDisponibilidades(@PathVariable Long vehiculoId) {
        List<Disponibilidad> disponibilidades = disponibilidadService.listarDisponibilidadesPorVehiculo(vehiculoId);
        return ResponseEntity.ok(disponibilidades);
    }

    @Operation(summary = "Eliminar disponibilidad", description = "Elimina una disponibilidad específica")
    @ApiResponse(responseCode = "204", description = "Disponibilidad eliminada exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Disponibilidad no encontrada")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarDisponibilidad(@PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Disponibilidad disponibilidad = disponibilidadService.buscarDisponibilidadPorId(id);
        if (disponibilidad == null) {
            return ResponseEntity.notFound().build();
        }

        boolean esDueno = disponibilidad.getVehiculo().getUsuario().getId().equals(usuario.getId());
        boolean esAdmin = usuario.getRol().equals("ADMIN");

        if (!esDueno && !esAdmin) {
            return ResponseEntity.status(403).build();
        }

        disponibilidadService.eliminarDisponibilidad(id);
        return ResponseEntity.noContent().build();
    }
}