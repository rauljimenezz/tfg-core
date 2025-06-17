package com.appCasa.app.controlador;

import com.appCasa.app.modelo.ImagenInfo;
import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.TipoOperacion;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.seguridad.JwtUtil;
import com.appCasa.app.servicio.EmailService;
import com.appCasa.app.servicio.VehiculoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.appCasa.app.servicio.UsuarioService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/vehiculos")
@CrossOrigin(origins = {
    "http://localhost:8081",
    "http://localhost:19006"
})
@Tag(name = "Vehículos", description = "Gestión de vehículos")
@SecurityRequirement(name = "bearerAuth")
public class VehiculoController {

    @Autowired
    private VehiculoService vehiculoService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtUtil jwtUtil;

    @Operation(summary = "Buscar por ubicación", description = "Busca vehículos por ubicación")
    @ApiResponse(responseCode = "200", description = "Lista de vehículos obtenida exitosamente")
    @GetMapping("/ubicacion/{ubicacion}")
    public ResponseEntity<List<Vehiculo>> buscarPorUbicacion(@PathVariable String ubicacion) {
        return ResponseEntity.ok(vehiculoService.buscarPorUbicacion(ubicacion));
    }

    @Operation(summary = "Eliminar vehículo", description = "Elimina un vehículo específico")
    @ApiResponse(responseCode = "204", description = "Vehículo eliminado exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Vehículo no encontrado")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarVehiculo(@PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Vehiculo vehiculo = vehiculoService.buscarPorId(id);
        if (vehiculo == null) {
            return ResponseEntity.notFound().build();
        }

        boolean esDueno = vehiculo.getUsuario().getId().equals(usuario.getId());
        boolean esAdmin = usuario.getRol().equals("ADMIN");

        if (!esDueno && !esAdmin) {
            return ResponseEntity.status(403).build();
        }

        vehiculoService.eliminarVehiculo(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Crear vehículo", description = "Crea un nuevo vehículo")
    @ApiResponse(responseCode = "200", description = "Vehículo creado exitosamente")
    @PostMapping
    public ResponseEntity<Vehiculo> crearVehiculo(@RequestBody Vehiculo vehiculo,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        vehiculo.setUsuario(usuario);

        if (!"ADMIN".equals(usuario.getRol())) {
            vehiculo.setValidada(false);
        }

        Vehiculo vehiculoGuardado = vehiculoService.guardarVehiculo(vehiculo);
        return ResponseEntity.ok(vehiculoGuardado);
    }

    @Operation(summary = "Obtener vehículos del usuario", description = "Lista los vehículos del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Lista de vehículos obtenida exitosamente")
    @GetMapping("/usuario")
    public ResponseEntity<List<Vehiculo>> obtenerVehiculosUsuario(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Vehiculo> vehiculos = vehiculoService.buscarPorUsuario(usuario);
        return ResponseEntity.ok(vehiculos);
    }

    @Operation(summary = "Buscar vehículo", description = "Obtiene un vehículo específico por su ID")
    @ApiResponse(responseCode = "200", description = "Vehículo encontrado")
    @ApiResponse(responseCode = "404", description = "Vehículo no encontrado")
    @GetMapping("/{id}")
    public ResponseEntity<Vehiculo> buscarVehiculo(@PathVariable Long id) {
        Vehiculo vehiculo = vehiculoService.buscarPorId(id);
        if (vehiculo == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(vehiculo);
    }

    @Operation(summary = "Listar vehículos", description = "Obtiene todos los vehículos del sistema")
    @ApiResponse(responseCode = "200", description = "Lista de vehículos obtenida exitosamente")
    @GetMapping
    public ResponseEntity<List<Vehiculo>> listarVehiculos() {
        return ResponseEntity.ok(vehiculoService.listarVehiculos());
    }

    @Operation(summary = "Buscar con filtros", description = "Busca vehículos aplicando múltiples filtros")
    @ApiResponse(responseCode = "200", description = "Lista de vehículos obtenida exitosamente")
    @GetMapping("/buscar")
    public ResponseEntity<List<Vehiculo>> buscarConFiltros(
            @RequestParam(required = false) String ubicacion,
            @RequestParam(required = false) Double precioMin,
            @RequestParam(required = false) Double precioMax,
            @RequestParam(required = false) Integer añoMin,
            @RequestParam(required = false) Integer añoMax,
            @RequestParam(required = false) Integer kilometrajeMax,
            @RequestParam(required = false) Integer capacidadMin,
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String modelo,
            @RequestParam(required = false) TipoOperacion tipo) {

        List<Vehiculo> vehiculos = vehiculoService.buscarConFiltros(
        ubicacion, precioMin, precioMax, añoMin, añoMax,
        kilometrajeMax, capacidadMin, marca, modelo, tipo);
    return ResponseEntity.ok(vehiculos);
    }

    @Operation(summary = "Subir imágenes", description = "Sube imágenes para un vehículo específico")
    @ApiResponse(responseCode = "200", description = "Imágenes subidas exitosamente")
    @ApiResponse(responseCode = "403", description = "No autorizado")
    @ApiResponse(responseCode = "404", description = "Vehículo no encontrado")
    @PostMapping("/{id}/imagenes")
    public ResponseEntity<?> subirImagenes(@PathVariable Long id,
            @RequestParam("imagenes") List<MultipartFile> imagenes,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.extraerEmail(token);
            Usuario usuario = usuarioService.buscarPorEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Vehiculo vehiculo = vehiculoService.buscarPorId(id);
            if (vehiculo == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Vehículo no encontrado"));
            }

            boolean esDueno = vehiculo.getUsuario().getId().equals(usuario.getId());
            boolean esAdmin = usuario.getRol().equals("ADMIN");

            if (!esDueno && !esAdmin) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "No tienes permisos para subir imágenes a este vehículo"));
            }

            String carpetaDestino = "../files";
            List<String> imagenesUrls = new ArrayList<>();

            for (MultipartFile imagen : imagenes) {
                if (imagen.isEmpty())
                    continue;

                String extension = Optional.ofNullable(imagen.getOriginalFilename())
                        .filter(f -> f.contains("."))
                        .map(f -> f.substring(f.lastIndexOf(".") + 1))
                        .orElse("");

                String uniqueId = UUID.randomUUID().toString();
                String nombreArchivo = "veh_" + id + "_" + uniqueId + "." + extension;

                Path rutaDestino = Paths.get(carpetaDestino, nombreArchivo);
                Files.createDirectories(rutaDestino.getParent());
                imagen.transferTo(rutaDestino);

                imagenesUrls.add("/api/imagenes/" + nombreArchivo);
            }

            if (vehiculo.getImagenes() == null) {
                vehiculo.setImagenes(new ArrayList<>());
            }
            vehiculo.getImagenes().addAll(imagenesUrls);
            vehiculoService.guardarVehiculo(vehiculo);

            return ResponseEntity.ok(imagenesUrls);

        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al subir imágenes"));
        }
    }

    @Operation(summary = "Contactar propietario", description = "Obtiene la información de contacto del propietario de un vehículo")
    @ApiResponse(responseCode = "200", description = "Información obtenida exitosamente")
    @ApiResponse(responseCode = "404", description = "Vehículo no encontrado")
    @GetMapping("/{id}/contactar")
    public ResponseEntity<?> contactarPropietario(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.extraerEmail(token);

            Usuario interesado = usuarioService.buscarPorEmail(email)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            Vehiculo vehiculo = vehiculoService.buscarPorId(id);
            if (vehiculo == null) {
                return ResponseEntity.notFound().build();
            }

            Usuario propietario = vehiculo.getUsuario();
            if (propietario == null || propietario.getEmail() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El vehículo no tiene dueño válido"));
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "ownerEmail", propietario.getEmail(),
                    "message", "Datos del propietario obtenidos"));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error al contactar al vendedor: " + e.getMessage()));
        }
    }
}