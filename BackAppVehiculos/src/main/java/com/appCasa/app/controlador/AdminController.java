package com.appCasa.app.controlador;

import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.Reserva;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.seguridad.JwtUtil;
import com.appCasa.app.servicio.VehiculoService;
import com.appCasa.app.servicio.ReservaService;
import com.appCasa.app.servicio.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = { "http://localhost:8081", "http://192.168.157.164:8081", "http://localhost:19006" })
@Tag(name = "Administración", description = "Operaciones exclusivas para administradores")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    @Autowired
    private VehiculoService vehiculoService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ReservaService reservaService;

    @Autowired
    private JwtUtil jwtUtil;

    @Operation(summary = "Obtener todos los vehículos", description = "Lista todos los vehículos del sistema")
    @ApiResponse(responseCode = "200", description = "Lista de vehículos obtenida exitosamente")
    @GetMapping("/vehiculos")
    public ResponseEntity<List<Vehiculo>> obtenerTodosLosVehiculos() {
        List<Vehiculo> vehiculos = vehiculoService.obtenerTodas();
        return ResponseEntity.ok(vehiculos);
    }

    @Operation(summary = "Validar vehículo", description = "Valida un vehículo y convierte al dueño en PROPIETARIO")
    @ApiResponse(responseCode = "200", description = "Vehículo validado exitosamente")
    @ApiResponse(responseCode = "404", description = "Vehículo no encontrado")
    @PutMapping("/validarVehiculo/{id}")
    public ResponseEntity<Vehiculo> validarVehiculo(@PathVariable Long id) {
        Vehiculo vehiculo = vehiculoService.buscarPorId(id);
        if (vehiculo == null) {
            return ResponseEntity.notFound().build();
        }

        vehiculo.setValidada(true);
        vehiculoService.guardarVehiculo(vehiculo);

        Usuario owner = vehiculo.getUsuario();
        owner.setRol("PROPIETARIO");
        usuarioService.guardarUsuario(owner);

        return ResponseEntity.ok(vehiculo);
    }

    @Operation(summary = "Eliminar vehículo", description = "Elimina un vehículo del sistema")
    @ApiResponse(responseCode = "204", description = "Vehículo eliminado exitosamente")
    @ApiResponse(responseCode = "400", description = "Error al eliminar el vehículo")
    @DeleteMapping("/vehiculos/{id}")
    public ResponseEntity<Void> eliminarVehiculo(@PathVariable Long id) {
        try {
            vehiculoService.eliminarVehiculo(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @Operation(summary = "Crear vehículo como administrador", description = "Permite a un administrador crear un vehículo asignándolo a un propietario")
    @ApiResponse(responseCode = "200", description = "Vehículo creado exitosamente")
    @ApiResponse(responseCode = "400", description = "Error en los datos del vehículo")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/vehiculos")
    public ResponseEntity<?> crearVehiculoComoAdmin(
            @RequestBody Vehiculo vehiculo,
            @RequestParam(required = false) Long propietarioId,
            @RequestHeader("Authorization") String authHeader) {

        if (propietarioId != null) {
            Usuario propietario = usuarioService.buscarPorId(propietarioId);
            if (propietario == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Propietario no encontrado"));
            }
            vehiculo.setUsuario(propietario);
        } else {
            String token = authHeader.substring(7);
            String email = jwtUtil.extraerEmail(token);
            Usuario admin = usuarioService.buscarPorEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            vehiculo.setUsuario(admin);
        }

        vehiculo.setValidada(true);

        try {
            vehiculoService.validarDatosVehiculo(vehiculo);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
        Vehiculo guardado = vehiculoService.guardarVehiculo(vehiculo);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "vehicle", guardado,
                "message", "Vehículo creado exitosamente por ADMIN"));
    }

    @Operation(summary = "Listar usuarios", description = "Obtiene todos los usuarios del sistema")
    @ApiResponse(responseCode = "200", description = "Lista de usuarios obtenida exitosamente")
    @GetMapping("/usuarios")
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @Operation(summary = "Eliminar usuario", description = "Elimina un usuario del sistema")
    @ApiResponse(responseCode = "204", description = "Usuario eliminado exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Void> eliminarUsuario(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Optional<Usuario> adminOpt = usuarioService.buscarPorEmail(email);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRol())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Usuario admin = adminOpt.get();

        if (admin.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
        }

        Usuario usuarioAEliminar = usuarioService.buscarPorId(id);
        if (usuarioAEliminar == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            usuarioService.eliminarUsuario(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Actualizar usuario", description = "Actualiza los datos de un usuario")
    @ApiResponse(responseCode = "200", description = "Usuario actualizado exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @PutMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(
            @PathVariable Long id,
            @RequestBody Usuario usuarioActualizado,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Optional<Usuario> adminOpt = usuarioService.buscarPorEmail(email);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRol())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Usuario usuarioExistente = usuarioService.buscarPorId(id);
        if (usuarioExistente == null) {
            return ResponseEntity.notFound().build();
        }

        if (usuarioActualizado.getNombre() != null) {
            usuarioExistente.setNombre(usuarioActualizado.getNombre());
        }
        if (usuarioActualizado.getApellido() != null) {
            usuarioExistente.setApellido(usuarioActualizado.getApellido());
        }
        if (usuarioActualizado.getTelefono() != null) {
            usuarioExistente.setTelefono(usuarioActualizado.getTelefono());
        }
        if (usuarioActualizado.getDireccion() != null) {
            usuarioExistente.setDireccion(usuarioActualizado.getDireccion());
        }
        if (usuarioActualizado.getEmail() != null) {
            usuarioExistente.setEmail(usuarioActualizado.getEmail());
        }

        try {
            Usuario usuarioGuardado = usuarioService.guardarUsuario(usuarioExistente);
            return ResponseEntity.ok(usuarioGuardado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Cambiar rol de usuario", description = "Cambia el rol de un usuario (ADMIN/USER)")
    @ApiResponse(responseCode = "200", description = "Rol cambiado exitosamente")
    @ApiResponse(responseCode = "400", description = "Rol inválido")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @PutMapping("/usuarios/{id}/rol")
    public ResponseEntity<Usuario> cambiarRolUsuario(
            @PathVariable Long id,
            @RequestParam String nuevoRol,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Optional<Usuario> adminOpt = usuarioService.buscarPorEmail(email);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRol())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Usuario admin = adminOpt.get();

        if (admin.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        if (!"ADMIN".equals(nuevoRol) && !"USER".equals(nuevoRol)) {
            return ResponseEntity.badRequest().build();
        }

        Usuario usuarioExistente = usuarioService.buscarPorId(id);
        if (usuarioExistente == null) {
            return ResponseEntity.notFound().build();
        }

        usuarioExistente.setRol(nuevoRol);

        try {
            Usuario usuarioGuardado = usuarioService.guardarUsuario(usuarioExistente);
            return ResponseEntity.ok(usuarioGuardado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Obtener usuario por ID", description = "Obtiene los detalles de un usuario específico")
    @ApiResponse(responseCode = "200", description = "Usuario encontrado")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @GetMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> obtenerUsuarioPorId(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Optional<Usuario> adminOpt = usuarioService.buscarPorEmail(email);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRol())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Usuario usuario = usuarioService.buscarPorId(id);
        if (usuario == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(usuario);
    }

    @Operation(summary = "Obtener todas las reservas", description = "Lista todas las reservas del sistema")
    @ApiResponse(responseCode = "200", description = "Lista de reservas obtenida exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @GetMapping("/reservas")
    public ResponseEntity<List<Reserva>> obtenerTodasLasReservas(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Optional<Usuario> adminOpt = usuarioService.buscarPorEmail(email);
        if (adminOpt.isEmpty() || !"ADMIN".equals(adminOpt.get().getRol())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Reserva> reservas = reservaService.listarReservas();
        return ResponseEntity.ok(reservas);
    }
}