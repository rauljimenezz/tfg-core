package com.appCasa.app.controlador;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/imagenes")
@Tag(name = "Imágenes", description = "Gestión de imágenes de vehículos")
public class ImagenController {

    private final String RUTA_IMAGENES = "../files";

    @Operation(summary = "Ver imagen", description = "Obtiene una imagen por su nombre")
    @ApiResponse(responseCode = "200", description = "Imagen obtenida exitosamente")
    @ApiResponse(responseCode = "404", description = "Imagen no encontrada")
    @GetMapping("/{nombreImagen}")
    public ResponseEntity<Resource> verImagen(@PathVariable String nombreImagen) throws MalformedURLException {
        Path ruta = Paths.get(RUTA_IMAGENES).resolve(nombreImagen);
        Resource recurso = new UrlResource(ruta.toUri());

        if (!recurso.exists() || !recurso.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        return new ResponseEntity<>(recurso, headers, HttpStatus.OK);
    }

    @Operation(summary = "Eliminar imagen", description = "Elimina una imagen por su ID")
    @ApiResponse(responseCode = "200", description = "Imagen eliminada exitosamente")
    @ApiResponse(responseCode = "404", description = "Imagen no encontrada")
    @DeleteMapping("/{idImagen}")
    public ResponseEntity<?> eliminarImagenPorId(@PathVariable String idImagen) {
        File carpeta = new File(RUTA_IMAGENES);
        File[] archivos = carpeta.listFiles((dir, name) -> name.contains(idImagen));

        if (archivos == null || archivos.length == 0) {
            return ResponseEntity.status(404).body(Map.of("error", "Imagen no encontrada"));
        }

        Arrays.stream(archivos).forEach(File::delete);

        return ResponseEntity.ok(Map.of("mensaje", "Imagen eliminada correctamente"));
    }

    @Operation(summary = "Listar imágenes de vehículo", description = "Obtiene todas las imágenes de un vehículo específico")
    @ApiResponse(responseCode = "200", description = "Lista de imágenes obtenida exitosamente")
    @GetMapping("/vehiculo/{vehiculoId}")
    public ResponseEntity<List<String>> listarImagenesDeVehiculo(@PathVariable Long vehiculoId) {
        File carpeta = new File(RUTA_IMAGENES);
        File[] archivos = carpeta.listFiles((dir, name) -> name.startsWith("veh_" + vehiculoId + "_"));

        if (archivos == null || archivos.length == 0) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<String> urls = Arrays.stream(archivos)
                .map(File::getName)
                .map(nombre -> "/api/imagenes/" + nombre)
                .collect(Collectors.toList());

        return ResponseEntity.ok(urls);
    }
}