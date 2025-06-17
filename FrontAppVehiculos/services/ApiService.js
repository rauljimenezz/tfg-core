import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'http://192.168.157.164:8080/api';
const VEHICLES_URL = `${BASE_URL}/vehiculos`;
const ADMIN_URL = `${BASE_URL}/admin`;

class ApiService {
  static async getVehicles(filters = {}) {
    try {
      const response = await axios.get(`${VEHICLES_URL}/buscar`, {
        params: {
          ubicacion: filters.ubicacion,
          precioMin: filters.precioMin,
          precioMax: filters.precioMax,
          añoMin: filters.añoMin,
          añoMax: filters.añoMax,
          kilometrajeMax: filters.kilometrajeMax,
          capacidadMin   : filters.capacidadMin,
          marca: filters.marca,
          modelo: filters.modelo,
          tipo: filters.tipo
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  static async getVehicleById(id) {
    try {
      const response = await axios.get(`${VEHICLES_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  }

  static async getUserVehicles() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${VEHICLES_URL}/usuario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user vehicles:', error);
      return [];
    }
  }

  static async createVehicle(vehicleData) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${VEHICLES_URL}`, vehicleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error.response?.data?.message || error.message;
    }
  }

  static async createVehicleAsAdmin(vehicleData, token) {
    try {
      const response = await axios.post(`${ADMIN_URL}/vehiculos`, vehicleData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle as admin:', error);
      throw error.response?.data?.message || error.message;
    }
  }

  static async validateVehicle(vehicleId, token) {
    try {
      const response = await axios.put(
        `${ADMIN_URL}/validarVehiculo/${vehicleId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error validating vehicle:', error);
      throw error.response?.data?.message || error.message;
    }
  }

  static async deleteVehicleAsAdmin(vehicleId, token) {
    try {
      const response = await axios.delete(`${ADMIN_URL}/vehiculos/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error.response?.data?.message || error.message;
    }
  }

  static async uploadVehicleImages(vehicleId, formData) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${VEHICLES_URL}/${vehicleId}/imagenes`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error.response?.data?.message || error.message;
    }
  }

  static async getVehicleReviews(vehicleId) {
    try {
      const response = await axios.get(`${BASE_URL}/reseñas/vehiculo/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  static async addReview(vehicleId, reviewData) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(`${BASE_URL}/reseñas/vehiculo/${vehicleId}`, reviewData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  static async getAllReviews() {
  const token = await AsyncStorage.getItem('token');
  const { data } = await axios.get(`${BASE_URL}/reseñas/admin`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
}

static async respondToReview(reviewId, text) {
  const token = await AsyncStorage.getItem('token');
  await axios.post(`${BASE_URL}/reseñas/responder/${reviewId}`,
                   { respuesta: text },
                   { headers: { Authorization: `Bearer ${token}` } });
}

  static async createReservation(vehicleId, reservationData) {
  const token = await AsyncStorage.getItem('token');
  const body = {
    ...reservationData,   
    vehiculo: { id: vehicleId }
  };
  const response = await axios.post(
      `${BASE_URL}/reservas`, body,
      { headers: { Authorization: `Bearer ${token}`,
                   'Content-Type': 'application/json' }});
  return response.data;
}

  static async getUserReservations() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/reservas/usuario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      return [];
    }
  }

  static async cancelReservation(reservationId) {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.delete(`${BASE_URL}/reservas/${reservationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling reservation:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  static async addToFavorites(vehicleId) {
    const token = await AsyncStorage.getItem('token');
    await axios.post(`${BASE_URL}/favoritos/${vehicleId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
  }

  static async removeFromFavorites(vehicleId) {
    const token = await AsyncStorage.getItem('token');
    await axios.delete(`${BASE_URL}/favoritos/${vehicleId}`, { headers: { Authorization: `Bearer ${token}` } });
  }

  static async getFavorites() {
    const token = await AsyncStorage.getItem('token');
    if (!token) return [];
    const response = await axios.get(`${BASE_URL}/favoritos`, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  }

  static async checkFavoriteStatus(vehicleId) {
    const token = await AsyncStorage.getItem('token');
    if (!token) return false;
    const response = await axios.get(`${BASE_URL}/favoritos/check/${vehicleId}`, { headers: { Authorization: `Bearer ${token}` } });
    return response.data.isFavorite;
  }

  static async createAlert(alertData) {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${BASE_URL}/alertas`, alertData, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  }

  static async getUserAlerts() {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}/alertas`, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  }

  static async deleteAlert(alertId) {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.delete(`${BASE_URL}/alertas/${alertId}`, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  }

  static async sendContactRequest(vehicleId) {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${VEHICLES_URL}/${vehicleId}/contactar`, { headers: { Authorization: `Bearer ${token}` } });

    return {
      success: true,
      ownerEmail: response.data.ownerEmail,
      message: response.data.message
    };
  }

  static async getCommentsForOwnerVehicles() {
  const token = await AsyncStorage.getItem('token');
  const { data } = await axios.get(`${BASE_URL}/reseñas/propietario`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
}

  static async getReservationsForOwnerVehicles() {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/reservas/dueño`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching owner reservations:', error);
      return [];
    }
  }

  static async getVehicleAvailability(vehicleId) {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/disponibilidades/${vehicleId}`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
  }
}

export default ApiService;
