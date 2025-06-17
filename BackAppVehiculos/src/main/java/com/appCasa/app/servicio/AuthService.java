package com.appCasa.app.servicio;

import com.appCasa.app.modelo.Usuario;
import com.appCasa.app.repositorio.UsuarioRepository;
import com.appCasa.app.seguridad.JwtUtil;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public String registrarUsuario(Usuario usuario) {
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está en uso. Usa otro email.");
        }

        if (usuario.getPassword() == null || usuario.getPassword().isEmpty()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía.");
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        usuario.setRol("USER");

        usuarioRepository.save(usuario);
        return jwtUtil.generarToken(usuario.getEmail(), usuario.getRol());
    }

    public String autenticarUsuario(String email, String password) {
        Optional<Usuario> usuario = usuarioRepository.findByEmail(email);
        if (usuario.isPresent() && passwordEncoder.matches(password, usuario.get().getPassword())) {
            String rol = usuario.get().getRol() != null ? usuario.get().getRol() : "USER";
            return jwtUtil.generarToken(email, rol);
        }
        throw new RuntimeException("Credenciales incorrectas");
    }
}