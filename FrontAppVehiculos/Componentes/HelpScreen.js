import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const HelpScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Ayuda y Soporte</Text>
        <Text style={styles.subtitle}>Preguntas frecuentes</Text>
        
        <View style={styles.faqItem}>
          <Text style={styles.question}>¿Cómo puedo reservar un vehículo?</Text>
          <Text style={styles.answer}>
            Para reservar un vehículo, primero debes iniciar sesión. Luego, navega hasta el vehículo que te interese y haz clic en el botón "Reservar ahora". Completa los detalles de tu reserva y confirma.
          </Text>
        </View>
        
        <View style={styles.faqItem}>
          <Text style={styles.question}>¿Cómo contacto al propietario?</Text>
          <Text style={styles.answer}>
            Puedes contactar al propietario haciendo clic en el botón "Contactar con el vendedor" en la página de detalles del vehículo. El propietario recibirá una notificación con tu solicitud.
          </Text>
        </View>
        
        <View style={styles.faqItem}>
          <Text style={styles.question}>¿Cómo cancelo una reserva?</Text>
          <Text style={styles.answer}>
            Para cancelar una reserva, ve a tu perfil, selecciona la pestaña "Mis reservas" y haz clic en "Cancelar reserva" junto a la reserva que deseas cancelar.
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>Contacto</Text>
        <Text style={styles.contactText}>Email: soporte@miapp.com</Text>
        <Text style={styles.contactText}>Teléfono: +34 123 456 789</Text>
        <Text style={styles.contactText}>Horario de atención: L-V 9:00-18:00</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#3498db',
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  contactText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
});

export default HelpScreen;