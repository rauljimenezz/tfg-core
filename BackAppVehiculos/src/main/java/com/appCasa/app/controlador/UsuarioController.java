package com.appCasa.app.controlador;

import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.seguridad.JwtUtil;
import com.appCasa.app.servicio.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:8081")
@RestController
@RequestMapping("/api/usuarios")
@Tag(name = "Usuarios", description = "Gestión de usuarios")
@SecurityRequirement(name = "bearerAuth")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private JwtUtil jwtUtil;

    @Operation(summary = "Crear usuario", description = "Crea un nuevo usuario en el sistema")
    @ApiResponse(responseCode = "200", description = "Usuario creado exitosamente")
    @PostMapping
    public ResponseEntity<Usuario> crearUsuario(@RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.guardarUsuario(usuario));
    }

    @Operation(summary = "Listar usuarios", description = "Obtiene todos los usuarios del sistema")
    @ApiResponse(responseCode = "200", description = "Lista de usuarios obtenida exitosamente")
    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.listarUsuarios());
    }

    @Operation(summary = "Buscar usuario por email", description = "Obtiene un usuario específico por su email")
    @ApiResponse(responseCode = "200", description = "Usuario encontrado")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @GetMapping("/{email}")
    public ResponseEntity<Usuario> buscarUsuario(@PathVariable String email) {
        Optional<Usuario> usuario = usuarioService.buscarPorEmail(email);
        return usuario.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Operation(summary = "Obtener perfil", description = "Obtiene el perfil del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Perfil obtenido exitosamente")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @GetMapping("/perfil")
    public ResponseEntity<Usuario> obtenerPerfilUsuario(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuario = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return ResponseEntity.ok(usuario);
    }

    @Operation(summary = "Actualizar perfil", description = "Actualiza los datos del perfil del usuario autenticado")
    @ApiResponse(responseCode = "200", description = "Perfil actualizado exitosamente")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    @PutMapping("/perfil")
    public ResponseEntity<Usuario> actualizarPerfil(@RequestBody Usuario usuarioActualizado,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = jwtUtil.extraerEmail(token);

        Usuario usuarioExistente = usuarioService.buscarPorEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuarioExistente.setNombre(usuarioActualizado.getNombre());
        usuarioExistente.setApellido(usuarioActualizado.getApellido());
        usuarioExistente.setTelefono(usuarioActualizado.getTelefono());
        usuarioExistente.setDireccion(usuarioActualizado.getDireccion());

        Usuario usuarioGuardado = usuarioService.guardarUsuario(usuarioExistente);
        return ResponseEntity.ok(usuarioGuardado);
    }
}