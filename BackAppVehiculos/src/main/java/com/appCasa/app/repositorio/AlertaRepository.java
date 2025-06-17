package com.appCasa.app.repositorio;

import com.appCasa.app.modelo.Alerta;
import com.appCasa.app.modelo.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {
    List<Alerta> findByUsuario(Usuario usuario);
    List<Alerta> findByActivaTrue();
}