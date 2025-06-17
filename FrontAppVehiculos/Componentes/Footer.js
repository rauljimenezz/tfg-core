import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Home, HelpCircle } from 'lucide-react-native';

const Footer = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Home')}
      >
        <Home color="#333" size={24} />
        <Text style={styles.buttonText}>Inicio</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Help')}
      >
        <HelpCircle color="#333" size={24} />
        <Text style={styles.buttonText}>Ayuda</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  button: {
    alignItems: 'center',
    padding: 5,
  },
  buttonText: {
    fontSize: 12,
    marginTop: 5,
    color: '#333',
  },
});

export default Footer;