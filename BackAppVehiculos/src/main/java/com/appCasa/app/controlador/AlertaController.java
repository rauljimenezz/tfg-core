package com.appCasa.app.controlador;

import com.appCasa.app.modelo.Alerta;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.seguridad.JwtUtil;
import com.appCasa.app.servicio.AlertaService;
import com.appCasa.app.servicio.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alertas")
@CrossOrigin(origins = "http://localhost:8081")
@Tag(name = "Alertas", description = "Gestión de alertas de usuarios")
@SecurityRequirement(name = "bearerAuth")
public class AlertaController {

    @Autowired
    private AlertaService alertaService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtUtil jwtUtil;

    @Operation(summary = "Crear alerta", description = "Crea una nueva alerta para el usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Alerta creada exitosamente")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @PostMapping
    public ResponseEntity<Alerta> crearAlerta(@RequestBody Alerta alerta,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);
        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        alerta.setUsuario(usuario);
        return ResponseEntity.ok(alertaService.crearAlerta(alerta));
    }

    @Operation(summary = "Listar alertas", description = "Obtiene todas las alertas del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Lista de alertas obtenida exitosamente")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @GetMapping
    public ResponseEntity<List<Alerta>> listarAlertasDelUsuario(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);
        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return ResponseEntity.ok(alertaService.obtenerAlertasPorUsuario(usuario));
    }

    @Operation(summary = "Eliminar alerta", description = "Elimina una alerta específica del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Alerta eliminada exitosamente")
    @ApiResponse(responseCode = "404", description = "Alerta no encontrada")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);
        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        alertaService.eliminarAlerta(id, usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Alerta eliminada correctamente"));
    }
}