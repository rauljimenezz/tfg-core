package com.appCasa.app.repositorio;

import com.appCasa.app.modelo.Vehiculo;
import com.appCasa.app.modelo.TipoOperacion;
import com.appCasa.app.modelo.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Long>, JpaSpecificationExecutor<Vehiculo> {
    List<Vehiculo> findByUbicacion(String ubicacion);
    List<Vehiculo> findByUsuario(Usuario usuario);
    @Query("SELECT v.imagenes FROM Vehiculo v WHERE v.id = :id")
    List<String> findImagenesByVehiculoId(@Param("id") Long id);
    boolean existsByMatriculaAndTipoOperacionAndIdNot(
            String matricula,
            TipoOperacion tipoOperacion,
            Long id);
    boolean existsByMatriculaAndTipoOperacion(String matricula, TipoOperacion tipoOperacion);

}