import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ScrollView, Alert, useWindowDimensions, Platform, Modal,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import ApiService from '../services/ApiService';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const BASE_URL = 'http://192.168.157.164:8080/api';

const AdminPanel = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('reservas');
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 800;
  const [selectedImages, setSelectedImages] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reservas, setReservas] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
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
    disponible: true,
    images: []
  });

  const resetVehicleForm = () => {
    setNewVehicle({
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
      disponible: true,
      images: []
    });
    setSelectedImages([]);
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState({
    id: null,
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const processed = await Promise.all(
          result.assets.map(async (asset) => {
            const manipResult = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 1280 } }],
              { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
            );
            return { ...asset, uri: manipResult.uri };
          })
        );

        setSelectedImages(processed);
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Error', 'No se pudieron seleccionar las imágenes');
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.overflow = 'auto';
    }

    fetchVehicles();
    fetchUsers();
    fetchReviews();
  }, []);

  useEffect(() => {
    if (activeTab === 'reservas') fetchReservas();
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/admin/vehiculos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const mappedVehicles = response.data.map(vehicle => {
        if (!vehicle) return null;

        return {
          id: vehicle.id?.toString() || 'unknown',
          ownerId: vehicle.usuario?.id?.toString() || null,
          title: `${vehicle.marca || 'Marca'} ${vehicle.modelo || 'Modelo'}`,
          location: vehicle.ubicacion || 'Ubicación desconocida',
          price: vehicle.tipoOperacion === 'VENTA'
            ? (vehicle.precioTotal?.toString() || '0')
            : (vehicle.precioPorDia?.toString() || '0'),
          mode: vehicle.tipoOperacion || 'ALQUILER',
          status: vehicle.validada ? 'active' : 'pending',
          owner: vehicle.usuario?.email || 'Desconocido',
          images: vehicle.imagenes && vehicle.imagenes.length > 0
            ? vehicle.imagenes.map(img => ({ uri: `http://192.168.157.164:8080${img}` }))
            : [require('../img/coche.png')]
        };
      }).filter(vehicle => vehicle !== null);

      setVehicles(mappedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', 'No se pudieron cargar los vehículos');
    } finally {
      setLoading(false);
    }
  };
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    AsyncStorage.getItem('userRole').then(setUserRole);
  }, []);


  const fetchReservas = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const url =
        userRole === 'ADMIN'
          ? `${BASE_URL}/admin/reservas`
          : `${BASE_URL}/reservas/dueño`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setReservas(response.data);
    } catch (error) {
      console.error('Error fetching reservas:', error);
      Alert.alert('Error', 'No tienes permisos para ver las reservas');
    }
  };

  useEffect(() => {
    if (activeTab === 'reservas' && userRole) {
      fetchReservas();
    }
  }, [activeTab, userRole]);

  const renderReservaItem = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.itemTitle}>Vehículo: {item.vehiculo?.marca || 'Marca'} {item.vehiculo?.modelo || 'Modelo'}
      </Text>
      <Text>Usuario: {item.usuario?.nombre || 'Desconocido'}</Text>
      <Text>Email: {item.usuario?.email || 'No disponible'}</Text>
      <Text>Fecha Inicio: {item.fechaInicio}</Text>
      <Text>Fecha Fin: {item.fechaFin}</Text>
      <Text>Estado: {item.confirmado ? '✅ Confirmada' : '⏳ Pendiente'}</Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, item.confirmado ? styles.deleteButton : styles.approveButton]}
          onPress={() => handleReservaAction(item.id, !item.confirmado)}
        >
          <Text style={styles.actionButtonText}>
            {item.confirmado ? 'Cancelar' : 'Confirmar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleReservaAction = async (reservaId, confirmar) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${BASE_URL}/reservas/confirmar/${reservaId}`,
        {},
        {
          params: { confirmar },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setReservas(reservas.map(reserva =>
        reserva.id === reservaId ? { ...reserva, confirmado: confirmar } : reserva
      ));

      Alert.alert('Éxito', `Reserva ${confirmar ? 'confirmada' : 'cancelada'}`);
    } catch (error) {
      console.error('Error al actualizar reserva:', error);
      Alert.alert('Error', 'No se pudo actualizar la reserva');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${BASE_URL}/admin/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const mappedUsers = response.data.map(user => ({
        id: user.id.toString(),
        name: `${user.nombre || ''}${user.apellido ? ' ' + user.apellido : ''}`.trim(),
        email: user.email,
        role: user.rol
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    }
  };

  const createVehicle = async () => {
    const MATRICULA_REGEX = /^\d{4}[A-Z]{3}$/;
    if (!MATRICULA_REGEX.test(newVehicle.matricula.toUpperCase())) {
      Alert.alert('Error', 'La matrícula debe tener el formato 0000XXX');
      return;
    }
    if (!newVehicle.matricula || !newVehicle.ubicacion || !newVehicle.marca || !newVehicle.modelo) {
      Alert.alert('Error', 'Por favor complete todos los campos requeridos');
      return;
    }


    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const payload = {
        ...newVehicle,
        año: parseInt(newVehicle.año),
        kilometraje: parseInt(newVehicle.kilometraje),
        capacidadPasajeros: parseInt(newVehicle.capacidadPasajeros),
        precioPorDia: newVehicle.tipoOperacion === 'ALQUILER' ?
          parseFloat(newVehicle.precioPorDia) || null : null,
        precioTotal: newVehicle.tipoOperacion === 'VENTA' ?
          parseFloat(newVehicle.precioTotal) || null : null,
        validada: true
      };

      const response = await ApiService.createVehicleAsAdmin(payload, token);

      const vehicleId = response.vehicle.id;

      if (selectedImages.length > 0) {
        const formData = new FormData();

        selectedImages.forEach((image, index) => {
          formData.append('imagenes', {
            uri: image.uri,
            type: 'image/jpeg',
            name: `image_${index}.jpg`
          });
        });

        await ApiService.uploadVehicleImages(vehicleId, formData);
      }

      fetchVehicles();

      setNewVehicle({
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
        disponible: true,
        images: []
      });
      setSelectedImages([]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleAction = async (vehicle, action) => {
    if (action === 'delete') {
      Alert.alert(
        "Confirmar eliminación",
        "¿Está seguro que quiere eliminar este vehículo?",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Sí, eliminar",
            style: "destructive",
            onPress: async () => {
              try {
                const token = await AsyncStorage.getItem('token');
                await axios.delete(`${BASE_URL}/admin/vehiculos/${vehicle.id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });

                setVehicles(vehicles.filter(v => v.id !== vehicle.id));
              } catch (error) {
                console.error('Error eliminando vehículo:', error.response?.data || error.message);
                Alert.alert('Error', 'No se pudo eliminar el vehículo');
              }
            }
          }
        ]
      );
    } else if (action === 'approve') {
      try {
        const token = await AsyncStorage.getItem('token');
        await axios.put(
          `${BASE_URL}/admin/validarVehiculo/${vehicle.id}`,
          {},
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        setVehicles(vehicles.map(v =>
          v.id === vehicle.id ? { ...v, status: 'active' } : v
        ));
      } catch (error) {
        console.error('Error approving vehicle:', error);
      }
    }
  };


  const handleUserAction = async (user, action) => {
    const token = await AsyncStorage.getItem('token');

    if (action === 'delete') {
      Alert.alert(
        "Confirmar eliminación",
        `¿Estás seguro de que deseas eliminar al usuario "${user.name}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar", style: "destructive", onPress: async () => {
              try {
                await axios.delete(`${BASE_URL}/admin/usuarios/${user.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });

                setUsers(users.filter(u => u.id !== user.id));
              } catch (error) {
                console.error('Error eliminando usuario:', error);
                Alert.alert("Error", "No se pudo eliminar el usuario");
              }
            }
          }
        ]
      );
    } else if (action === 'edit') {
      setEditingUser({
        id: user.id,
        nombre: user.name,
        email: user.email,
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      });
      setShowEditModal(true);
    } else if (action === 'changeRole') {
      const newRole = user.role === 'USER' ? 'ADMIN' : 'USER';
      Alert.alert(
        "Cambiar rol",
        `¿Cambiar rol de "${user.name}" de ${user.role} a ${newRole}?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Cambiar", onPress: async () => {
              try {
                await axios.put(`${BASE_URL}/admin/usuarios/${user.id}/rol?nuevoRol=${newRole}`, {}, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });

                const updatedUsers = users.map(u =>
                  u.id === user.id ? { ...u, role: newRole } : u
                );
                setUsers(updatedUsers);
              } catch (error) {
                console.error('Error cambiando rol:', error);
                Alert.alert("Error", "No se pudo cambiar el rol del usuario");
              }
            }
          }
        ]
      );
    }
  };

  const handleSaveUserChanges = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      await axios.put(`${BASE_URL}/admin/usuarios/${editingUser.id}`, editingUser, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const updatedUsers = users.map(u =>
        u.id === editingUser.id ? {
          ...u,
          name: editingUser.nombre,
          email: editingUser.email,
          telefono: editingUser.telefono,
          direccion: editingUser.direccion
        } : u
      );

      setUsers(updatedUsers);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const renderEditUserModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => !loading && setShowEditModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Usuario</Text>

          {loading && <ActivityIndicator size="large" color="#3498db" style={styles.loadingIndicator} />}

          <TextInput
            style={styles.input}
            placeholder="Nombre *"
            value={editingUser.nombre}
            onChangeText={text => setEditingUser({ ...editingUser, nombre: text })}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={editingUser.email}
            onChangeText={text => setEditingUser({ ...editingUser, email: text })}
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={editingUser.telefono}
            onChangeText={text => setEditingUser({ ...editingUser, telefono: text })}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Dirección"
            multiline
            value={editingUser.direccion}
            onChangeText={text => setEditingUser({ ...editingUser, direccion: text })}
            editable={!loading}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                if (!loading) {
                  resetVehicleForm();
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton, loading && styles.disabledButton]}
              onPress={handleSaveUserChanges}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const fetchReviews = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await ApiService.getAllReviews();
      const mappedReviews = response.map(review => ({
        id: review.id.toString(),
        vehicleBrand: review.vehiculo?.marca || 'Marca desconocida',
        vehicleModel: review.vehiculo?.modelo || 'Modelo desconocido',
        vehicleId: review.vehiculo?.id,
        userName: review.usuario?.nombre || review.usuario?.email || 'Usuario',
        userEmail: review.usuario?.email?.toLowerCase() || '',
        rating: review.calificacion,
        comment: review.comentario,
        date: review.fechaReseña?.toString() || 'Fecha desconocida',
        adminReply: review.respuestaDueño
          ? { text: review.respuestaDueño, date: new Date().toLocaleDateString() }
          : null
      }));
      setReviews(mappedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'No se pudieron cargar las reseñas');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`http://192.168.157.164:8080/api/reseñas/${reviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      Alert.alert('Error', 'No se pudo eliminar la reseña');
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Por favor escribe una respuesta');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await ApiService.respondToReview(reviewId, replyText);

      setReviews(reviews.map(review =>
        review.id === reviewId
          ? { ...review, adminReply: { text: replyText, date: new Date().toLocaleDateString() } }
          : review
      ));
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error al responder reseña:', error);
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    }
  };



  const filteredUsers = users.filter(user => {
    const name = user.name ? user.name.toLowerCase() : '';
    const email = user.email ? user.email.toLowerCase() : '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const filteredReviews = reviews.filter(r => {
    const q = searchQuery.toLowerCase();
    return r.userEmail.includes(q);
  });

  const filteredReservas = reservas.filter(r => {
    const email = r.usuario?.email?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return email.includes(q);
  });

  const renderUserItem = ({ item }) => (
    <View style={[styles.listItem, isMobile && styles.listItemMobile]}>
      <View style={styles.itemContent}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <Text>{item.email}</Text>
          <Text style={{
            color: item.role === 'ADMIN' ? 'purple' : 'blue'
          }}>
            Rol: {item.role}
          </Text>
          <Text>Vehículos: {vehicles.filter(v => v.ownerId === item.id).length}</Text>
        </View>
      </View>
      <View style={isMobile ? styles.actionButtonsMobile : styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isMobile && styles.actionButtonMobile,
            styles.editButton
          ]}
          onPress={() => handleUserAction(item, 'edit')}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isMobile && styles.actionButtonMobile,
            styles.roleButton
          ]}
          onPress={() => handleUserAction(item, 'changeRole')}
        >
          <Text style={styles.actionButtonText}>Cambiar Rol</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isMobile && styles.actionButtonMobile,
            styles.deleteButton
          ]}
          onPress={() => handleUserAction(item, 'delete')}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewItem = ({ item }) => (
    <View style={[styles.listItem, isMobile && styles.listItemMobile]}>
      <View style={styles.reviewHeader}>
        <Text style={styles.itemTitle}>Vehículo: {item.vehiculo?.marca || 'Marca'} {item.vehiculo?.modelo || 'Modelo'}</Text>
        <Text style={styles.reviewDate}>{item.date}</Text>
      </View>

      <View style={styles.reviewUser}>
        <Text style={styles.reviewUserName}>{item.userName}</Text>
        <Text style={styles.reviewRating}>{'⭐'.repeat(item.rating)}</Text>
      </View>

      <Text style={styles.reviewComment}>{item.comment}</Text>

      {item.adminReply && (
        <View style={styles.adminReplyContainer}>
          <Text style={styles.adminReplyLabel}>Respuesta del dueño:</Text>
          <Text style={styles.adminReplyText}>{item.adminReply.text}</Text>
          <Text style={styles.adminReplyDate}>{item.adminReply.date}</Text>
        </View>
      )}

      <View style={styles.reviewActionsContainer}>
        {!item.adminReply && (
          <View style={styles.replyContainer}>
            {replyingTo === item.id ? (
              <>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Escribe tu respuesta aquí..."
                  multiline
                  numberOfLines={3}
                  value={replyText}
                  onChangeText={setReplyText}
                />
                <View style={styles.replyButtons}>
                  <TouchableOpacity
                    style={[styles.replyActionButton, styles.cancelReplyButton]}
                    onPress={() => setReplyingTo(null)}
                  >
                    <Text style={styles.replyActionButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.replyActionButton, styles.submitReplyButton]}
                    onPress={() => handleReplySubmit(item.id)}
                  >
                    <Text style={styles.replyActionButtonText}>Enviar</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.replyButton]}
                onPress={() => setReplyingTo(item.id)}
              >
                <Text style={styles.actionButtonText}>Responder</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            Alert.alert(
              "Confirmar eliminación",
              "¿Estás seguro de que deseas eliminar esta reseña?",
              [
                {
                  text: "Cancelar",
                  style: "cancel"
                },
                {
                  text: "Eliminar",
                  onPress: () => handleDeleteReview(item.id),
                  style: "destructive"
                }
              ]
            );
          }}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateVehicleModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => !loading && setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Crear Nuevo Vehículo</Text>

          {loading && <ActivityIndicator size="large" color="#3498db" style={styles.loadingIndicator} />}

          <TextInput
            style={styles.input}
            placeholder="Marca *"
            value={newVehicle.marca}
            onChangeText={text => setNewVehicle({ ...newVehicle, marca: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Modelo *"
            value={newVehicle.modelo}
            onChangeText={text => setNewVehicle({ ...newVehicle, modelo: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Matrícula *"
            value={newVehicle.matricula}
            maxLength={7}
            autoCapitalize="characters"
            onChangeText={text =>
              setNewVehicle({
                ...newVehicle,
                matricula: text.toUpperCase().replace(/[^0-9A-Z]/g, '')
              })
            }
          />


          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Descripción"
            multiline
            value={newVehicle.descripcion}
            onChangeText={text => setNewVehicle({ ...newVehicle, descripcion: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Ubicación *"
            value={newVehicle.ubicacion}
            onChangeText={text => setNewVehicle({ ...newVehicle, ubicacion: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Año"
            keyboardType="numeric"
            value={newVehicle.año}
            onChangeText={text => setNewVehicle({ ...newVehicle, año: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Kilometraje"
            keyboardType="numeric"
            value={newVehicle.kilometraje}
            onChangeText={text => setNewVehicle({ ...newVehicle, kilometraje: text })}
          />

          <Picker
            selectedValue={newVehicle.tipoOperacion}
            style={styles.input}
            onValueChange={itemValue => setNewVehicle({ ...newVehicle, tipoOperacion: itemValue })}>
            <Picker.Item label="Alquiler" value="ALQUILER" />
            <Picker.Item label="Venta" value="VENTA" />
          </Picker>

          {newVehicle.tipoOperacion === 'ALQUILER' && (
            <TextInput
              style={styles.input}
              placeholder="Precio por día"
              keyboardType="numeric"
              value={newVehicle.precioPorDia}
              onChangeText={text => setNewVehicle({ ...newVehicle, precioPorDia: text })}
            />
          )}

          {newVehicle.tipoOperacion === 'VENTA' && (
            <TextInput
              style={styles.input}
              placeholder="Precio total"
              keyboardType="numeric"
              value={newVehicle.precioTotal}
              onChangeText={text => setNewVehicle({ ...newVehicle, precioTotal: text })}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Capacidad de pasajeros"
            keyboardType="numeric"
            value={newVehicle.capacidadPasajeros}
            onChangeText={text => setNewVehicle({ ...newVehicle, capacidadPasajeros: text })}
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

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => !loading && setShowCreateModal(false)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createButton, loading && styles.disabledButton]}
              onPress={createVehicle}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creando...' : 'Crear'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const filteredVehicles = vehicles.filter(vehicle => {
    const title = vehicle.title ? vehicle.title.toLowerCase() : '';
    const location = vehicle.location ? vehicle.location.toLowerCase() : '';
    const query = searchQuery.toLowerCase();
    return title.includes(query) || location.includes(query);
  });

  const renderVehicleItem = ({ item }) => (
    <View style={[styles.listItem, isMobile && styles.listItemMobile]}>
      <View style={styles.itemContent}>
        <Image
          source={item.images[0]}
          style={styles.thumbnail}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text>{item.location}</Text>
          <Text>
            {item.mode === 'VENTA'
              ? `${item.price}€ (Venta)`
              : `${item.price}€ por día`}
          </Text>
          <Text style={{
            color: item.status === 'active' ? 'green' : 'orange'
          }}>
            Estado: {item.status === 'active' ? 'Activo' : 'Pendiente'}
          </Text>
          <Text>Propietario: {item.owner}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleVehicleAction(item, 'approve')}
          >
            <Text style={styles.actionButtonText}>Aprobar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleVehicleAction(item, 'delete')}
        >
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Administración</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reservas' && styles.activeTab]}
          onPress={() => setActiveTab('reservas')}
        >
          <Text style={[styles.tabText, activeTab === 'reservas' && styles.activeTabText]}>
            Reservas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vehicles' && styles.activeTab]}
          onPress={() => setActiveTab('vehicles')}
        >
          <Text style={[styles.tabText, activeTab === 'vehicles' && styles.activeTabText]}>
            Vehículos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Usuarios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Reseñas
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab !== 'dashboard' && (
        <TextInput
          style={styles.searchInput}
          placeholder={`Buscar ${activeTab === 'vehicles' ? 'vehículos' :
            activeTab === 'users' ? 'usuarios' :
              activeTab === 'reservas' ? 'reservas' :
                'reseñas'}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      )}

      {activeTab === 'reservas' && (
        <FlatList
          data={filteredReservas}
          renderItem={renderReservaItem}
          keyExtractor={item => item.id.toString()}
        />
      )}

      {activeTab === 'vehicles' && (
        <>
          <FlatList
            data={filteredVehicles}
            renderItem={renderVehicleItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => {
              fetchUsers();
              resetVehicleForm();
              setShowCreateModal(true);
            }}>
            <Text style={styles.floatingButtonText}>+</Text>
          </TouchableOpacity>
        </>
      )}

      {activeTab === 'users' && (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeTab === 'reviews' && (
        <FlatList
          data={filteredReviews}
          renderItem={renderReviewItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
      {renderCreateVehicleModal()}
      {renderEditUserModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  listContent: {
    paddingBottom: 20,
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  listItemMobile: {
    flexDirection: 'column',
  },
  itemContent: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 8,
    marginTop: 5,
  },
  actionButtonsMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    margin: 10,
  },
  actionButtonMobile: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    margin: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  approveButton: {
    backgroundColor: '#2ecc71',
  },
  roleButton: {
    backgroundColor: '#9b59b6',
  },
  dashboardContainer: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  statTitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 5,
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginTop: 5,
  },
  activityItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  reviewVehicle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    marginLeft: 10,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewUserName: {
    fontWeight: '600',
    marginRight: 10,
  },
  reviewRating: {
    fontSize: 16,
  },
  reviewComment: {
    color: '#444',
    marginBottom: 10,
    lineHeight: 20,
  },
  adminReplyContainer: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  adminReplyLabel: {
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  adminReplyText: {
    color: '#333',
    marginBottom: 5,
  },
  adminReplyDate: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
  },
  replyContainer: {
    marginTop: 10,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  replyButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  replyButton: {
    backgroundColor: '#2ecc71',
  },
  replyActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelReplyButton: {
    backgroundColor: '#95a5a6',
  },
  submitReplyButton: {
    backgroundColor: '#2ecc71',
  },
  replyActionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    marginRight: 10,
  }, modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
    minHeight: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    marginBottom: 50
  },
  createButton: {
    backgroundColor: '#2ecc71',
    marginBottom: 50
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 100,
  },
  floatingButtonText: {
    color: 'white',
    fontSize: 30,
    lineHeight: 30,
  }, loadingIndicator: {
    marginVertical: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  requiredField: {
    borderColor: '#e74c3c',
  },
  imagePickerButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center'
  },
  imagePickerText: {
    color: 'white',
    fontWeight: 'bold'
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    maxHeight: 100
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  approveButton: {
    backgroundColor: '#2ecc71',
    padding: 8,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  reviewActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'flex-start',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  replyButton: {
    backgroundColor: '#2ecc71',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    marginLeft: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default AdminPanel;