/*import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.157.164:8080/api/reservas';

class ReservaService {
  static async crearReserva(reservaData) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(BASE_URL, reservaData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  }

  static async getReservasUsuario() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/usuario`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      throw error;
    }
  }
}

export default ReservaService;*/