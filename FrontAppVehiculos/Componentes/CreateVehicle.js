import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/ApiService';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateVehicle = ({ navigation, route }) => {
  const [vehicle, setVehicle] = useState({
    matricula: '',
    descripcion: '',
    ubicacion: '',
    marca: '',
    modelo: '',
    año: '',
    kilometraje: '',
    tipoOperacion: 'ALQUILER',
    precioPorDia: '',
    precioTotal: '',
    capacidadPasajeros: '',
    disponible: true
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7
      });

      if (!result.canceled) {
        const compressedImages = await Promise.all(
          result.assets.map(async (img) => {
            const compressed = await manipulateAsync(
              img.uri,
              [{ resize: { width: 800 } }],
              { compress: 0.7, format: SaveFormat.JPEG }
            );
            return {
              uri: compressed.uri,
              type: 'image/jpeg',
              name: `vehicle_${Date.now()}.jpg`
            };
          })
        );
        setSelectedImages(compressedImages);
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  const MATRICULA_REGEX = /^\d{4}[A-Z]{3}$/;

const validateFields = () => {
  const matricula = vehicle.matricula.trim().toUpperCase();
  if (!MATRICULA_REGEX.test(matricula)) {
    Alert.alert('Error', 'La matrícula debe tener el formato 0000XXX');
    return false;
  }

  if (
    !vehicle.descripcion ||
    !vehicle.ubicacion  ||
    !vehicle.marca      ||
    !vehicle.modelo     ||
    !vehicle.año        ||
    !vehicle.kilometraje||
    !vehicle.capacidadPasajeros
  ) {
    Alert.alert('Error', 'Por favor complete todos los campos requeridos');
    return false;
  }

  if (vehicle.tipoOperacion === 'ALQUILER' && !vehicle.precioPorDia) {
    Alert.alert('Error', 'Introduzca el precio por día');
    return false;
  }
  if (vehicle.tipoOperacion === 'VENTA' && !vehicle.precioTotal) {
    Alert.alert('Error', 'Introduzca el precio total');
    return false;
  }

  return true;
};

  const handleSubmit = async () => {
  if (!validateFields()) return;

  try {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');

    const payload = {
      ...vehicle,
      matricula: vehicle.matricula.trim().toUpperCase(),
      año: parseInt(vehicle.año),
      kilometraje: parseInt(vehicle.kilometraje),
      capacidadPasajeros: parseInt(vehicle.capacidadPasajeros),
      precioPorDia: vehicle.tipoOperacion === 'ALQUILER'
        ? parseFloat(vehicle.precioPorDia) || null
        : null,
      precioTotal: vehicle.tipoOperacion === 'VENTA'
        ? parseFloat(vehicle.precioTotal) || null
        : null,
      validada: false
    };

    const vehicleResponse = await ApiService.createVehicle(payload);

      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((image, index) => {
          formData.append('imagenes', {
            uri: image.uri,
            type: image.type,
            name: image.name || `image_${index}.jpg`
          });
        });

        await ApiService.uploadVehicleImages(vehicleResponse.id, formData);
      }

      Alert.alert('Éxito', 'Vehículo enviado para revisión');
      if (route.params?.onVehicleCreated) {
        route.params.onVehicleCreated();
      }
      navigation.goBack();
    } catch (error) {
      const msg =
    error.response?.data?.error || 
    error.message ||
    'No se pudo crear el vehículo';
  Alert.alert('Error', msg);
    console.error('Error creating vehicle:', error);
    Alert.alert('Error', error.message || 'No se pudo crear el vehículo');
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Añadir Nuevo Vehículo</Text>

        <TextInput
          style={styles.input}
          placeholder="Marca *"
          value={vehicle.marca}
          onChangeText={(text) => setVehicle({ ...vehicle, marca: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Modelo *"
          value={vehicle.modelo}
          onChangeText={(text) => setVehicle({ ...vehicle, modelo: text })}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Matrícula *"
          value={vehicle.matricula}
          maxLength={7}
          autoCapitalize="characters"
          onChangeText={(text) =>
            setVehicle({ ...vehicle, matricula: text.replace(/[^0-9A-Za-z]/g, '').toUpperCase() })
          }
        />

        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Descripción *"
          multiline
          value={vehicle.descripcion}
          onChangeText={(text) => setVehicle({ ...vehicle, descripcion: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Ubicación *"
          value={vehicle.ubicacion}
          onChangeText={(text) => setVehicle({ ...vehicle, ubicacion: text })}
        />

        
        <TextInput
          style={styles.input}
          placeholder="Año *"
          keyboardType="numeric"
          value={vehicle.año}
          onChangeText={(text) => setVehicle({ ...vehicle, año: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Kilometraje *"
          keyboardType="numeric"
          value={vehicle.kilometraje}
          onChangeText={(text) => setVehicle({ ...vehicle, kilometraje: text })}
        />

        <Picker
          selectedValue={vehicle.tipoOperacion}
          onValueChange={(itemValue) =>
            setVehicle({ ...vehicle, tipoOperacion: itemValue })
          }
          style={styles.input}
        >
          <Picker.Item label="Alquiler" value="ALQUILER" />
          <Picker.Item label="Venta" value="VENTA" />
        </Picker>

        {vehicle.tipoOperacion === 'ALQUILER' && (
          <TextInput
            style={styles.input}
            placeholder="Precio por día *"
            keyboardType="numeric"
            value={vehicle.precioPorDia}
            onChangeText={(text) => setVehicle({ ...vehicle, precioPorDia: text })}
          />
        )}

        {vehicle.tipoOperacion === 'VENTA' && (
          <TextInput
            style={styles.input}
            placeholder="Precio total *"
            keyboardType="numeric"
            value={vehicle.precioTotal}
            onChangeText={(text) => setVehicle({ ...vehicle, precioTotal: text })}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Capacidad pasajeros *"
          keyboardType="numeric"
          value={vehicle.capacidadPasajeros}
          onChangeText={(text) =>
            setVehicle({ ...vehicle, capacidadPasajeros: text })
          }
        />

        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={pickImages}
        >
          <Text style={styles.imagePickerText}>
            {selectedImages.length > 0
              ? `${selectedImages.length} imagen(es) seleccionada(s)`
              : 'Seleccionar imágenes'}
          </Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <ScrollView horizontal style={styles.imagePreviewContainer}>
            {selectedImages.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image.uri }}
                style={styles.imagePreview}
              />
            ))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar para Aprobación</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={loading}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.modalText}>Creando vehículo...</Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 20
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  submitButton: {
    backgroundColor: '#3498db'
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    marginBottom: 40
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  imagePickerButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15
  },
  imagePickerText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  imagePreviewContainer: {
    maxHeight: 120,
    marginBottom: 20
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalText: {
    marginTop: 10,
    fontSize: 16
  }
});

export default CreateVehicle;