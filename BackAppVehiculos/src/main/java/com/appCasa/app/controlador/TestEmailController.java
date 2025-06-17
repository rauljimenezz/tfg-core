package com.appCasa.app.controlador;

import com.appCasa.app.servicio.EmailService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
public class TestEmailController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/send-email")
    public String enviarCorreoDePrueba() {
        try {
            emailService.enviarEmail("r26760887@gmail.com", "Prueba de Email", "<h2>Esto es un test</h2>");
            return "Correo enviado con éxito.";
        } catch (MessagingException e) {
            return "Error enviando correo: " + e.getMessage();
        }
    }
}
