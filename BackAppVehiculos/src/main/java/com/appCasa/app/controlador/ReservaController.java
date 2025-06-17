package com.appCasa.app.controlador;

import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.Reserva;
import com.appCasa.app.modelo.TipoOperacion;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.servicio.ReservaService;
import com.appCasa.app.servicio.VehiculoService;
import com.appCasa.app.servicio.UsuarioService;
import com.appCasa.app.seguridad.JwtUtil;
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
@RequestMapping("/api/reservas")
@Tag(name = "Reservas", description = "Gestión de reservas de vehículos")
@SecurityRequirement(name = "bearerAuth")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private VehiculoService vehiculoService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsuarioService usuarioService;

    @Operation(summary = "Crear reserva", description = "Crea una nueva reserva para un vehículo")
    @ApiResponse(responseCode = "201", description = "Reserva creada exitosamente")
    @ApiResponse(responseCode = "400", description = "Error en los datos de la reserva")
    @ApiResponse(responseCode = "404", description = "Vehículo no encontrado")
    @PostMapping
    public ResponseEntity<?> crearReserva(
            @RequestBody Reserva reserva,
            @RequestHeader("Authorization") String authHeader) {

        String email = jwtUtil.extraerEmail(authHeader.substring(7));
        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Vehiculo vehiculo = vehiculoService.buscarPorId(reserva.getVehiculo().getId());
        if (vehiculo == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "El vehículo no existe."));
        }
        if (!vehiculo.getValidada()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "El vehículo aún no ha sido validado."));
        }

        try {
            reserva.setUsuario(usuario);
            reserva.setVehiculo(vehiculo);
            Reserva nueva = reservaService.crearReserva(reserva);
            return ResponseEntity.status(201).body(nueva);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @Operation(summary = "Listar reservas", description = "Obtiene todas las reservas del sistema")
    @ApiResponse(responseCode = "200", description = "Lista de reservas obtenida exitosamente")
    @GetMapping
    public ResponseEntity<List<Reserva>> listarReservas() {
        return ResponseEntity.ok(reservaService.listarReservas());
    }

    @Operation(summary = "Buscar reserva", description = "Obtiene una reserva específica por su ID")
    @ApiResponse(responseCode = "200", description = "Reserva encontrada")
    @ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    @GetMapping("/{id}")
    public ResponseEntity<Reserva> buscarReserva(@PathVariable Long id) {
        Reserva reserva = reservaService.buscarReserva(id);
        return reserva != null ? ResponseEntity.ok(reserva) : ResponseEntity.notFound().build();
    }

    @Operation(summary = "Confirmar reserva", description = "Confirma o cancela una reserva (solo propietario o admin)")
    @ApiResponse(responseCode = "200", description = "Reserva actualizada exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    @PutMapping("/confirmar/{id}")
    public ResponseEntity<Reserva> confirmarReserva(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestParam Boolean confirmar) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Reserva reserva = reservaService.buscarReserva(id);
        if (reserva == null) {
            return ResponseEntity.notFound().build();
        }

        String ownerEmail = reserva.getVehiculo().getUsuario().getEmail();
        if (!ownerEmail.equals(email) && !"ADMIN".equals(usuario.getRol())) {
            return ResponseEntity.status(403).build();
        }

        reserva.setConfirmado(confirmar);
        Reserva reservaActualizada = reservaService.actualizarReserva(reserva);
        return ResponseEntity.ok(reservaActualizada);
    }

    @Operation(summary = "Obtener reservas como propietario", description = "Lista las reservas de los vehículos del usuario autenticado (propietario)")
    @ApiResponse(responseCode = "200", description = "Lista de reservas obtenida exitosamente")
    @GetMapping("/dueño")
    public ResponseEntity<List<Reserva>> obtenerReservasDelDueño(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Reserva> reservas = reservaService.obtenerReservasDeVehiculosDelDueño(usuario.getId());
        return ResponseEntity.ok(reservas);
    }

    @Operation(summary = "Obtener reservas como usuario", description = "Lista las reservas realizadas por el usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Lista de reservas obtenida exitosamente")
    @GetMapping("/usuario")
    public ResponseEntity<List<Reserva>> obtenerReservasDeUsuario(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Reserva> reservas = reservaService.obtenerReservasDeUsuario(usuario.getId());
        return ResponseEntity.ok(reservas);
    }

    @Operation(summary = "Cancelar reserva", description = "Cancela una reserva específica")
    @ApiResponse(responseCode = "200", description = "Reserva cancelada exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Reserva no encontrada")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelarReserva(@PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Reserva reserva = reservaService.buscarReserva(id);
        if (reserva == null) {
            return ResponseEntity.notFound().build();
        }

        if (!reserva.getUsuario().getEmail().equals(email)) {
            return ResponseEntity.status(403).build();
        }

        try {
            reservaService.cancelarReserva(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}