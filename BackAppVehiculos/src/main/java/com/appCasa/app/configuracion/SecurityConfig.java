package com.appCasa.app.configuracion;

import com.appCasa.app.seguridad.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/usuarios/**").permitAll()
                        .requestMatchers("/api/vehiculos/buscar").permitAll()
                        .requestMatchers("/api/vehiculos/ubicacion/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/vehiculos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/vehiculos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/imagenes/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/vehiculos").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/vehiculos/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/vehiculos/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/vehiculos/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/reseñas/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reseñas/vehiculo/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reseñas/promedio/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reseñas/admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/reseñas/usuario").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/reseñas/responder/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reseñas/propietario").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/reservas").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reservas/usuario").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reservas/dueño").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/reservas/confirmar/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/reservas/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/disponibilidades/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/disponibilidades/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/disponibilidades/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/favoritos/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/favoritos/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/favoritos").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/favoritos/check/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/vehiculos/{id}/contactar").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/alertas").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/alertas").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/alertas/**").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/reservas").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/admin/validarVehiculo/**").hasRole("ADMIN")
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}