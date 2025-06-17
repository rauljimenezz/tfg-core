package com.appCasa.app.controlador;

import com.appCasa.app.modelo.Favorito;
import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.seguridad.JwtUtil;
import com.appCasa.app.servicio.FavoritoService;
import com.appCasa.app.servicio.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favoritos")
@Tag(name = "Favoritos", description = "Gestión de vehículos favoritos de usuarios")
@SecurityRequirement(name = "bearerAuth")
public class FavoritoController {

    @Autowired
    private FavoritoService favoritoService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtUtil jwtUtil;

    private Usuario obtenerUsuarioDesdeToken(String token) {
        String email = jwtUtil.extraerEmail(token);
        return usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @Operation(summary = "Agregar a favoritos", description = "Agrega un vehículo a la lista de favoritos del usuario")
    @ApiResponse(responseCode = "200", description = "Vehículo agregado a favoritos")
    @PostMapping("/{vehiculoId}")
    public ResponseEntity<?> agregar(@PathVariable Long vehiculoId, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Usuario usuario = obtenerUsuarioDesdeToken(token);

        favoritoService.agregarAFavoritos(usuario, vehiculoId);
        return ResponseEntity.ok().body("Vehículo agregado a favoritos");
    }

    @Operation(summary = "Eliminar de favoritos", description = "Elimina un vehículo de la lista de favoritos del usuario")
    @ApiResponse(responseCode = "200", description = "Vehículo eliminado de favoritos")
    @DeleteMapping("/{vehiculoId}")
    public ResponseEntity<?> eliminar(@PathVariable Long vehiculoId,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Usuario usuario = obtenerUsuarioDesdeToken(token);

        favoritoService.eliminarDeFavoritos(usuario, vehiculoId);
        return ResponseEntity.ok().body("Vehículo eliminado de favoritos");
    }

    @Operation(summary = "Listar favoritos", description = "Obtiene todos los vehículos favoritos del usuario")
    @ApiResponse(responseCode = "200", description = "Lista de favoritos obtenida exitosamente")
    @GetMapping
    public ResponseEntity<List<Favorito>> listarFavoritos(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        Usuario usuario = obtenerUsuarioDesdeToken(token);

        List<Favorito> favoritos = favoritoService.obtenerFavoritosDeUsuario(usuario);
        favoritos.forEach(f -> Hibernate.initialize(f.getVehiculo()));

        return ResponseEntity.ok(favoritos);
    }

    @Operation(summary = "Verificar favorito", description = "Comprueba si un vehículo está en la lista de favoritos del usuario")
    @ApiResponse(responseCode = "200", description = "Estado de favorito obtenido")
    @GetMapping("/check/{vehiculoId}")
    public ResponseEntity<Map<String, Boolean>> checkFavoriteStatus(
            @PathVariable Long vehiculoId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        Usuario usuario = obtenerUsuarioDesdeToken(token);

        boolean isFavorite = favoritoService.existeFavorito(usuario, vehiculoId);
        return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
    }
}