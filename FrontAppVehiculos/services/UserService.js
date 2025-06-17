import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../Componentes/api';

const BASE_URL = 'http://192.168.157.164:8080/api/usuarios';

class UserService {
  constructor() {
    
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/registro', {
        nombre: userData.name,
        apellido: userData.lastName,
        email: userData.email,
        password: userData.password,
        rol: 'USER'
      });

      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Error al registrar usuario');
      } else if (error.request) {
        throw new Error('No se pudo conectar con el servidor');
      } else {
        throw new Error('Error en el registro');
      }
    }
  }
}

export default new UserService();