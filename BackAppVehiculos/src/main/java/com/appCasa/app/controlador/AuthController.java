package com.appCasa.app.controlador;

import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.servicio.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:8081")
@Tag(name = "Autenticación", description = "Operaciones relacionadas con autenticación de usuarios")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Operation(summary = "Registrar nuevo usuario", description = "Permite registrar un nuevo usuario en el sistema")
    @ApiResponse(responseCode = "200", description = "Usuario registrado exitosamente")
    @ApiResponse(responseCode = "400", description = "Error en los datos proporcionados")
    @PostMapping("/registro")
public ResponseEntity<?> registrar(@RequestBody Usuario usuario) {
    try {
        String token = authService.registrarUsuario(usuario);
        return ResponseEntity.ok(Map.of("token", token, "mensaje", "Registro exitoso"));
    } catch (RuntimeException e) {
        return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
    }
}

    @Operation(summary = "Iniciar sesión", description = "Permite a un usuario iniciar sesión y obtener un token JWT")
    @ApiResponse(responseCode = "200", description = "Inicio de sesión exitoso")
    @ApiResponse(responseCode = "401", description = "Credenciales inválidas")
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> credenciales) {
        String token = authService.autenticarUsuario(
                credenciales.get("email"),
                credenciales.get("password"));
        return ResponseEntity.ok(Map.of("token", token));
    }

    @Operation(summary = "Cerrar sesión", description = "Cierra la sesión del usuario actual")
    @ApiResponse(responseCode = "200", description = "Sesión cerrada exitosamente")
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("mensaje", "Cierre de sesión exitoso"));
    }

    @Operation(summary = "Validar token", description = "Verifica si el token JWT es válido")
    @ApiResponse(responseCode = "200", description = "Token válido")
    @ApiResponse(responseCode = "401", description = "Token inválido o expirado")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/validate-token")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> validateToken() {
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "message", "Token válido"));
    }

    @Operation(summary = "Obtener detalles del token", description = "Obtiene información detallada del usuario a partir del token JWT")
    @ApiResponse(responseCode = "200", description = "Detalles obtenidos exitosamente")
    @ApiResponse(responseCode = "401", description = "Token inválido o expirado")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/validate-token-details")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> validateTokenWithDetails(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        return ResponseEntity.ok(Map.of(
                "valid", true,
                "username", userDetails.getUsername(),
                "roles", userDetails.getAuthorities().stream()
                        .map(auth -> auth.getAuthority())
                        .toArray(),
                "message", "Token válido con detalles"));
    }
}