import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView, useWindowDimensions, Platform, SafeAreaView, StatusBar, Alert, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';
import api from './api';
import ApiService from '../services/ApiService';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const UserProfile = ({ navigation, route }) => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [activeTab, setActiveTab] = useState('datos');
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [emailForReset, setEmailForReset] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [reservas, setReservas] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userVehicles, setUserVehicles] = useState([]);
  const esPropietario = userData?.esPropietario;
  const [comentariosPropios, setComentariosPropios] = useState([]);
  const [reservasPropias, setReservasPropias] = useState([]);

  const { width } = useWindowDimensions();
  const isMobile = width < 800;

  const [alerts, setAlerts] = useState([]);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    ubicacion: '',
    precioMin: '',
    precioMax: '',
    tipoOperacion: '',
    marca: '',
    modelo: '',
    kilometrajeMax: '',
    añoMin: '',
    añoMax: ''
  });

  const fetchUserVehicles = async () => {
    try {
      const vehicles = await ApiService.getUserVehicles();
      setUserVehicles(vehicles);

      const owns = vehicles.some(v => v.validada);
      setUserData(prev => ({
        ...prev,
        esPropietario: owns,
      }));
    } catch (error) {
      console.error('Error fetching user vehicles:', error);
      setUserVehicles([]);
    }
  };


  useEffect(() => {
    const init = async () => {
      await fetchUserData();
      await fetchUserVehicles();
    };
    init();
  }, []);


  const fetchUserAlerts = async () => {
    try {
      const alerts = await ApiService.getUserAlerts();
      setAlerts(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      Alert.alert('Error', 'No se pudieron cargar las alertas');
    }
  };

  const handleCreateAlert = async () => {
    try {
      const alertData = {
        ubicacion: newAlert.ubicacion || null,
        precioMin: newAlert.precioMin ? parseFloat(newAlert.precioMin) : null,
        precioMax: newAlert.precioMax ? parseFloat(newAlert.precioMax) : null,
        tipoOperacion: newAlert.tipoOperacion || null,
        marca: newAlert.marca || null,
        modelo: newAlert.modelo || null,
        kilometrajeMax: newAlert.kilometrajeMax ? parseInt(newAlert.kilometrajeMax) : null,
        añoMin: newAlert.añoMin ? parseInt(newAlert.añoMin) : null,
        añoMax: newAlert.añoMax ? parseInt(newAlert.añoMax) : null
      };

      await ApiService.createAlert(alertData);
      setShowAlertModal(false);
      setNewAlert({
        ubicacion: '',
        precioMin: '',
        precioMax: '',
        tipoOperacion: '',
        marca: '',
        modelo: '',
        kilometrajeMax: '',
        añoMin: '',
        añoMax: ''
      });
      await fetchUserAlerts();
    } catch (error) {
      console.error('Error creating alert:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la alerta');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await ApiService.deleteAlert(alertId);
      await fetchUserAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      Alert.alert('Error', error.message || 'No se pudo eliminar la alerta');
    }
  };

  const handleOwnReservaAction = async (reservaId, confirmar) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `http://192.168.157.164:8080/api/reservas/confirmar/${reservaId}`,
        {},
        {
          params: { confirmar },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setReservasPropias(reservasPropias.map(r =>
        r.id === reservaId ? { ...r, confirmado: confirmar } : r
      ));
      Alert.alert('Éxito', `Reserva ${confirmar ? 'confirmada' : 'cancelada'}`);
    } catch (error) {
      console.error('Error al actualizar reserva:', error);
      Alert.alert('Error', 'No se pudo actualizar la reserva');
    }
  };

  const fetchUserReviews = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('http://192.168.157.164:8080/api/reseñas/usuario', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUserReviews(response.data);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      setUserReviews([]);
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
      setUserReviews(userReviews.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === 'favoritos' || route.params?.refreshFavorites) {
        console.log('Cargando favoritos...');
        await loadFavorites();
        if (route.params?.refreshFavorites) {
          navigation.setParams({ refreshFavorites: false });
        }
      }
    };
    fetchData();
  }, [activeTab, route.params?.refreshFavorites]);

  const handleTabChange = async (tab) => {
    setActiveTab(tab);

    if (tab === 'reservas') {
      const reservasUser = await ApiService.getUserReservations();
      setReservas(reservasUser);
    } else if (tab === 'favoritos') {
      await loadFavorites();
    } else if (tab === 'misVehiculos') {
      await fetchUserVehicles();
    }
    else if (tab === 'comentariosPropios') {
      const comentarios = await ApiService.getCommentsForOwnerVehicles();
      setComentariosPropios(comentarios);
    }
    else if (tab === 'reservasPropias') {
      const reservasOwn = await ApiService.getReservationsForOwnerVehicles();
      setReservasPropias(reservasOwn);
    }
  };


  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Sesión expirada', 'Por favor, inicia sesión nuevamente');
        navigation.navigate('Login');
        return;
      }

      const favs = await ApiService.getFavorites();
      const formattedFavorites = favs.map(fav => ({
        id: fav.id.toString(),
        vehiculo: fav.vehiculo
      }));

      setFavorites(formattedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'No se pudieron cargar los favoritos');
      setFavorites([]);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await api.get('/usuarios/perfil');
      setUserData(response.data);
      setEditedData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos de usuario:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del usuario');
      setLoading(false);
    }
  };

  const containsNumbers = (text) => {
    return /\d/.test(text);
  };

  const containsOnlyNumbers = (text) => {
    return /^\d*$/.test(text);
  };

  const validateEditedData = () => {
    if (containsNumbers(editedData.nombre)) {
      Alert.alert('Error', 'El nombre no puede contener números');
      return false;
    }
    if (editedData.apellido && containsNumbers(editedData.apellido)) {
      Alert.alert('Error', 'El apellido no puede contener números');
      return false;
    }
    if (editedData.telefono && !containsOnlyNumbers(editedData.telefono)) {
      Alert.alert('Error', 'El teléfono solo puede contener números');
      return false;
    }
    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateEditedData()) {
      return;
    }

    try {
      const response = await api.put('/usuarios/perfil', editedData);
      setUserData(response.data);
      setIsEditing(false);
      Alert.alert('Éxito', 'Datos actualizados correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Alert.alert('Error', 'No se pudieron actualizar los datos');
    }
  };

  const fetchFavoritos = async () => {
    try {
      const response = await api.get('/usuarios/favoritos');
      return response.data;
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
      return [];
    }
  };

  if (Platform.OS === 'web') { document.body.style.overflow = 'auto' }

  const handleCancelReservation = async (reservationId) => {
    try {
      await ApiService.cancelReservation(reservationId);
      Alert.alert('Éxito', 'Reserva cancelada correctamente');
      const updatedReservas = reservas.filter(r => r.id !== reservationId);
      setReservas(updatedReservas);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo cancelar la reserva');
    }
  };

  const handleCancelEdit = () => {
    setEditedData({ ...userData });
    setIsEditing(false);
  };

  const handleNombreChange = (text) => {
    setEditedData({ ...editedData, nombre: text });
  };

  const handleApellidoChange = (text) => {
    setEditedData({ ...editedData, apellido: text });
  };

  const handleTelefonoChange = (text) => {
    if (containsOnlyNumbers(text) || text === '') {
      setEditedData({ ...editedData, telefono: text });
    }
  };

  const handlePasswordResetRequest = async () => {
    try {
      await api.post('/auth/solicitar-restablecimiento', { email: emailForReset });
      Alert.alert('Éxito', 'Código enviado al correo electrónico');
      setResetStep(2);
    } catch (error) {
      console.error('Error al solicitar restablecimiento:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo solicitar el restablecimiento');
    }
  };

  const handlePasswordResetConfirm = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      await api.post('/auth/verificar-restablecimiento', {
        email: emailForReset,
        codigo: resetCode,
        nuevaPassword: newPassword,
        confirmarPassword: confirmPassword
      });
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setEmailForReset('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setResetStep(1);
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo restablecer la contraseña');
    }
  };

  const resetModalState = () => {
    setShowPasswordModal(false);
    setEmailForReset('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetStep(1);
  };

  return (
    <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordModal}
        onRequestClose={() => resetModalState()}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar contraseña</Text>

            {resetStep === 1 ? (
              <>
                <Text style={styles.modalText}>Ingresa tu correo electrónico para recibir un código de verificación</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Correo electrónico"
                  value={emailForReset}
                  onChangeText={setEmailForReset}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.modalButtonContainer}>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => resetModalState()}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handlePasswordResetRequest}
                  >
                    <Text style={styles.modalButtonText}>Enviar código</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalText}>Ingresa el código recibido y tu nueva contraseña</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Código de verificación"
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <View style={styles.modalButtonContainer}>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setResetStep(1);
                      setResetCode('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Text style={styles.modalButtonText}>Atrás</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handlePasswordResetConfirm}
                  >
                    <Text style={styles.modalButtonText}>Cambiar contraseña</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAlertModal}
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Nueva Alerta</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ubicación"
              value={newAlert.ubicacion}
              onChangeText={(text) => setNewAlert({ ...newAlert, ubicacion: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Marca"
              value={newAlert.marca}
              onChangeText={(text) => setNewAlert({ ...newAlert, marca: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Modelo"
              value={newAlert.modelo}
              onChangeText={(text) => setNewAlert({ ...newAlert, modelo: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Precio mínimo"
              value={newAlert.precioMin}
              onChangeText={(text) => setNewAlert({ ...newAlert, precioMin: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Precio máximo"
              value={newAlert.precioMax}
              onChangeText={(text) => setNewAlert({ ...newAlert, precioMax: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Kilometraje máximo"
              value={newAlert.kilometrajeMax}
              onChangeText={(text) => setNewAlert({ ...newAlert, kilometrajeMax: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Año mínimo"
              value={newAlert.añoMin}
              onChangeText={(text) => setNewAlert({ ...newAlert, añoMin: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Año máximo"
              value={newAlert.añoMax}
              onChangeText={(text) => setNewAlert({ ...newAlert, añoMax: text })}
              keyboardType="numeric"
            />

            <Picker
              selectedValue={newAlert.tipoOperacion}
              style={styles.modalInput}
              onValueChange={(itemValue) => setNewAlert({ ...newAlert, tipoOperacion: itemValue })}
            >
              <Picker.Item label="Selecciona el tipo" value="" />
              <Picker.Item label="Venta" value="VENTA" />
              <Picker.Item label="Alquiler" value="ALQUILER" />
            </Picker>

            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAlertModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleCreateAlert}
              >
                <Text style={styles.modalButtonText}>Crear Alerta</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : (
        <>
          <StatusBar backgroundColor="#3498db" barStyle="light-content" />
          <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require('../img/perfil.jpg')}
                  style={styles.profileImage}
                />
              </View>

              <Text style={styles.welcomeText}>
                Bienvenido/a, {userData.nombre}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabContainer}
              contentContainerStyle={{
                paddingHorizontal: 15,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'datos' && styles.activeTab]}
                onPress={() => setActiveTab('datos')}
              >
                <Text style={[styles.tabText, activeTab === 'datos' && styles.activeTabText]}>
                  Mis datos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'favoritos' && styles.activeTab]}
                onPress={() => setActiveTab('favoritos')}
              >
                <Text style={[styles.tabText, activeTab === 'favoritos' && styles.activeTabText]}>
                  Favoritos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'reservas' && styles.activeTab]}
                onPress={() => handleTabChange('reservas')}
              >
                <Text style={[styles.tabText, activeTab === 'reservas' && styles.activeTabText]}>
                  Reservas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'reviews' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('reviews');
                  fetchUserReviews();
                }}
              >
                <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                  Reseñas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'alerts' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('alerts');
                  fetchUserAlerts();
                }}
              >
                <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
                  Alertas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'misVehiculos' && styles.activeTab]}
                onPress={() => {
                  setActiveTab('misVehiculos');
                  fetchUserVehicles();
                }}
              >
                <Text style={[styles.tabText, activeTab === 'misVehiculos' && styles.activeTabText]}>
                  Mis vehículos
                </Text>
              </TouchableOpacity>

              {esPropietario && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'comentariosPropios' && styles.activeTab,
                    ]}
                    onPress={() => handleTabChange('comentariosPropios')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'comentariosPropios' && styles.activeTabText,
                      ]}
                    >
                      Comentarios en tus vehículos
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'reservasPropias' && styles.activeTab,
                    ]}
                    onPress={() => handleTabChange('reservasPropias')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'reservasPropias' && styles.activeTabText,
                      ]}
                    >
                      Reservas en tus vehículos
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>


            {activeTab === 'datos' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información personal</Text>

                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nombre:</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editedData.nombre}
                        onChangeText={handleNombreChange}
                      />
                    ) : (
                      <Text style={styles.infoValue}>{userData.nombre}</Text>
                    )}
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Apellido:</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editedData.apellido}
                        onChangeText={handleApellidoChange}
                      />
                    ) : (
                      <Text style={styles.infoValueLargo}>{userData.apellido}</Text>
                    )}
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValueLargo}>{userData.email}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Teléfono:</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editedData.telefono}
                        onChangeText={handleTelefonoChange}
                        keyboardType="phone-pad"
                      />
                    ) : (
                      <Text style={styles.infoValue}>{userData.telefono}</Text>
                    )}
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Dirección:</Text>
                    {isEditing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editedData.direccion}
                        onChangeText={(text) => setEditedData({ ...editedData, direccion: text })}
                        multiline
                      />
                    ) : (
                      <Text style={styles.infoValueLargo}>{userData.direccion}</Text>
                    )}
                  </View>
                </View>

                {isEditing && (
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.editActionButton, styles.saveButton]}
                      onPress={handleSaveChanges}
                    >
                      <Text style={styles.editActionButtonText}>Guardar cambios</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editActionButton, styles.cancelButton]}
                      onPress={handleCancelEdit}
                    >
                      <Text style={styles.editActionButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.actionButtonsContainer}>
                  {!isEditing && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editProfileButton]}
                      onPress={() => setIsEditing(true)}
                    >
                      <Text style={styles.actionButtonText}>Editar perfil</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.changePasswordButton]}
                    onPress={() => {
                      setEmailForReset(userData?.email || '');
                      setShowPasswordModal(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Cambiar contraseña</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {activeTab === 'favoritos' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Favoritos</Text>

                {favorites.length > 0 ? (
                  favorites.map(fav => {
                    let priceText = '';
                    let priceLabel = '';

                    if (fav.vehiculo.tipoOperacion === 'VENTA') {
                      priceText = `${fav.vehiculo.precioTotal}€`;
                      priceLabel = 'Precio de venta';
                    } else if (fav.vehiculo.tipoOperacion === 'ALQUILER') {
                      priceText = `${fav.vehiculo.precioPorDia}€`;
                      priceLabel = 'Por día';
                    } else {
                      priceText = `${fav.vehiculo.precioMensual}€`;
                      priceLabel = 'Por mes';
                    }

                    return (
                      <TouchableOpacity
                        key={fav.id}
                        style={styles.vehicleCard}
                        onPress={() => navigation.navigate('VehicleDetail', {
                          vehicleId: fav.vehiculo.id,
                        })}
                      >
                        <View style={styles.vehicleInfo}>
                          <Text style={styles.vehicleTitulo}>{fav.vehiculo.marca} {fav.vehiculo.modelo}</Text>
                          <Text style={styles.vehicleUbicacion}>{fav.vehiculo.ubicacion}</Text>
                          <Text style={styles.vehiclePrecio}>
                            {priceText} <Text style={styles.priceLabel}>({priceLabel})</Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.favoriteButton, styles.favoriteButtonActive]}
                          onPress={async e => {
                            e.stopPropagation();
                            try {
                              await ApiService.removeFromFavorites(fav.vehiculo.id);
                              setFavorites(current =>
                                current.filter(f => f.vehiculo.id !== fav.vehiculo.id)
                              );
                            } catch (error) {
                              console.error('Error removing favorite:', error);
                              Alert.alert('Error', 'No se pudo eliminar de favoritos');
                            }
                          }}
                        >
                          <Text style={styles.favoriteIcon}>❤</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="heart-dislike-outline" size={50} color="#ccc" />
                    <Text style={styles.emptyMessage}>No tienes vehículos en favoritos</Text>
                    <TouchableOpacity
                      style={styles.browseButton}
                      onPress={() => navigation.navigate('Home')}
                    >
                      <Text style={styles.browseButtonText}>Explorar vehículos</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}


            {activeTab === 'reservas' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reservas</Text>

                {reservas.length > 0 ? (
                  reservas.map(reservation => (
                    <View key={reservation.id} style={styles.reservationCard}>
                      <View style={styles.reservationInfo}>
                        <Text style={styles.vehicleTitulo}>{reservation.vehiculo.marca} {reservation.vehiculo.modelo}</Text>
                        <Text style={styles.vehicleUbicacion}>{reservation.vehiculo?.ubicacion || 'Ubicación no disponible'}</Text>
                        <Text style={styles.vehicleFechas}>
                          {reservation.fechaInicio} - {reservation.fechaFin || 'Indefinido'}
                        </Text>
                        <Text style={styles.vehiclePrecio}>{reservation.total}€</Text>
                        <View style={[
                          styles.statusBadge,
                          reservation.confirmado ? styles.confirmedStatus : styles.pendingStatus
                        ]}>
                          <Text style={styles.statusText}>
                            {reservation.confirmado ? 'Confirmada' : 'Pendiente'}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelReservation(reservation.id)}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyMessage}>No tienes reservas activas</Text>
                )}
              </View>
            )}

            {activeTab === 'reviews' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reseñas</Text>
                {userReviews.length > 0 ? (
                  userReviews.map(review => (
                    <View key={review.id} style={styles.reviewCard}>
                      <Text style={styles.reviewVehicle}>
                        {review.vehiculos?.titulo || 'Vehiculo'}
                      </Text>
                      <Text style={styles.reviewRating}>{'⭐'.repeat(review.calificacion)}</Text>
                      <Text style={styles.reviewComment}>{review.comentario}</Text>
                      <Text style={styles.reviewDate}>{review.fechaReseña}</Text>
                      {review.respuestaDueño && (
                        <View style={styles.reviewResponse}>
                          <Text style={styles.reviewResponseLabel}>Respuesta:</Text>
                          <Text style={styles.reviewResponseText}>{review.respuestaDueño}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.deleteReviewButton}
                        onPress={() => handleDeleteReview(review.id)}
                      >
                        <Text style={styles.deleteReviewButtonText}>Eliminar Reseña</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyMessage}>No has escrito ninguna reseña</Text>
                )}
              </View>
            )}

            {activeTab === 'alerts' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alertas</Text>

                <TouchableOpacity
                  style={styles.addAlertButton}
                  onPress={() => setShowAlertModal(true)}
                >
                  <Text style={styles.addAlertButtonText}>+ Crear Nueva Alerta</Text>
                </TouchableOpacity>

                {alerts.length > 0 ? (
                  alerts.map(alert => (
                    <View key={alert.id} style={styles.alertCard}>
                      <View style={styles.alertInfo}>
                        {alert.ubicacion && (
                          <Text style={styles.alertText}>Ubicación: {alert.ubicacion}</Text>
                        )}
                        {alert.marca && (
                          <Text style={styles.alertText}>Marca: {alert.marca}</Text>
                        )}
                        {alert.modelo && (
                          <Text style={styles.alertText}>Modelo: {alert.modelo}</Text>
                        )}
                        {alert.precioMin && (
                          <Text style={styles.alertText}>Precio Mín: {alert.precioMin}€</Text>
                        )}
                        {alert.precioMax && (
                          <Text style={styles.alertText}>Precio Máx: {alert.precioMax}€</Text>
                        )}
                        {alert.kilometrajeMax && (
                          <Text style={styles.alertText}>Kilometraje Máx: {alert.kilometrajeMax} km</Text>
                        )}
                        {alert.añoMin && (
                          <Text style={styles.alertText}>Año Mín: {alert.añoMin}</Text>
                        )}
                        {alert.añoMax && (
                          <Text style={styles.alertText}>Año Máx: {alert.añoMax}</Text>
                        )}
                        {alert.tipoOperacion && (
                          <Text style={styles.alertText}>Tipo: {alert.tipoOperacion}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.deleteAlertButton}
                        onPress={() => handleDeleteAlert(alert.id)}
                      >
                        <Text style={styles.deleteAlertButtonText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyMessage}>No tienes alertas configuradas</Text>
                )}
              </View>
            )}
            {activeTab === 'misVehiculos' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vehículos</Text>
                <TouchableOpacity
                  style={styles.addVehicleButton}
                  onPress={() => navigation.navigate('CreateVehicle')}
                >
                  <Text style={styles.addVehicleButtonText}>+ Añadir nuevo vehículo</Text>
                </TouchableOpacity>

                {userVehicles.map(vehicle => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={styles.vehicleCard}
                    onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
                  >
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.vehicleBrandModel}>
                        {vehicle.marca} {vehicle.modelo}
                      </Text>
                      <Text style={styles.vehicleLocation}>
                        {vehicle.ubicacion}
                      </Text>
                      <Text style={styles.vehiclePrice}>
                        {vehicle.tipoOperacion === 'VENTA'
                          ? `${vehicle.precioTotal}€`
                          : `${vehicle.precioPorDia}€/día`}
                      </Text>
                      <Text style={styles.vehicleStatus}>
                        Estado: {vehicle.validada ? 'Aprobado' : 'Pendiente'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === 'comentariosPropios' && esPropietario && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Comentarios en tus vehículos</Text>
                {comentariosPropios.length > 0 ? (
                  comentariosPropios.map(c => (
                    <View key={c.id} style={styles.reviewCard}>
                      <Text style={styles.reviewVehicle}>
                        {c.vehiculo?.marca || 'Marca'} {c.vehiculo?.modelo || ''}
                      </Text>
                      <Text style={styles.reviewComment}>{c.comentario}</Text>
                      <Text style={styles.reviewDate}>{c.fecha}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyMessage}>No hay comentarios aún en tus vehículos</Text>
                )}
              </View>
            )}

            {activeTab === 'reservasPropias' && esPropietario && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reservas en tus vehículos</Text>
                {reservasPropias.length > 0 ? (
                  reservasPropias.map(r => (
                    <View key={r.id} style={styles.reservationCard}>
                      <Text style={styles.vehicleTitulo}>{r.vehiculo.marca} {r.vehiculo.modelo}</Text>
                      <Text style={styles.vehicleFechas}>{r.fechaInicio} - {r.fechaFin}</Text>
                      <Text style={styles.vehiclePrecio}>{r.total}€</Text>
                      <View style={[
                        styles.statusBadge,
                        r.confirmado ? styles.confirmedStatus : styles.pendingStatus
                      ]}>
                        <Text style={styles.statusText}>
                          {r.confirmado ? 'Confirmada' : 'Pendiente'}
                        </Text>
                      </View>

                      <View style={styles.propertyActions}>
                        {!r.confirmado ? (
                          <TouchableOpacity
                            style={[styles.propertyActionButton, styles.modalButtonConfirm]}
                            onPress={() => handleOwnReservaAction(r.id, true)}
                          >
                            <Text style={styles.propertyActionButtonText}>Confirmar</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.propertyActionButton, styles.deleteButton]}
                            onPress={() => handleOwnReservaAction(r.id, false)}
                          >
                            <Text style={styles.propertyActionButtonText}>Rechazar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyMessage}>No hay reservas en tus vehículos</Text>
                )}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3498db',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#3498db',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    alignItems: 'center',
    borderRadius: 20,
    margin: 10,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  welcomeText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    paddingHorizontal: 5,
    minHeight: 50,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 100,
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontWeight: '500',
    color: '#888',
    fontSize: Platform.OS === 'ios' || Platform.OS === 'android' ? 14 : 16,
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    margin: 15,
    marginTop: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  infoContainer: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexWrap: 'wrap',
  },
  infoLabel: {
    width: Platform.OS === 'ios' || Platform.OS === 'android' ? '40%' : '33%',
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
    width: Platform.OS === 'ios' || Platform.OS === 'android' ? '60%' : '67%',
    color: '#333',
  },
  infoValueLargo: {
    width: Platform.OS === 'ios' || Platform.OS === 'android' ? '60%' : '67%',
    color: '#333',
    width: '900px'
  },
  editInput: {
    width: Platform.OS === 'ios' || Platform.OS === 'android' ? '60%' : '67%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    backgroundColor: '#f9f9f9',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  editActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  editActionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  editProfileButton: {
    backgroundColor: '#3498db',
  },
  changePasswordButton: {
    backgroundColor: '#f39c12',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  vehicleCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitulo: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  vehicleUbicacion: {
    color: '#666',
    marginBottom: 5,
  },
  vehiclePrecio: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  vehicleFechas: {
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  favoriteButton: {
    padding: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
  },
  confirmedStatus: {
    backgroundColor: '#2ecc71',
  },
  pendingStatus: {
    backgroundColor: '#f39c12',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalText: {
    marginBottom: 15,
    color: '#555',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#e74c3c',
  },
  modalButtonConfirm: {
    backgroundColor: '#2ecc71',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reservationCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  vehicleInfoContainer: {
    flex: 1,
  },
  reservationCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  reservationInfo: {
    marginBottom: 10,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffecec',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#e74c3c',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'normal',
  },
  browseButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  propertyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  propertyActionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  propertyActionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  vehicleInfo: {
    flex: 1,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  favoriteButtonActive: {
    backgroundColor: '#ffecec',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#e74c3c',
  },
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  reviewVehicle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  reviewRating: {
    marginBottom: 5,
    fontSize: 16,
  },
  reviewComment: {
    color: '#444',
    marginBottom: 5,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
  },
  reviewResponse: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  reviewResponseLabel: {
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  deleteReviewButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  deleteReviewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addAlertButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  addAlertButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertInfo: {
    flex: 1,
  },
  alertText: {
    marginBottom: 5,
    color: '#333',
  },
  deleteAlertButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteAlertButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addVehicleButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  addVehicleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  vehicleEstado: {
    color: '#666',
    marginVertical: 5,
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#2ecc71',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  imagePickerButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePickerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    marginBottom: 20,
    maxHeight: 120,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  vehicleDetails: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  vehicleBrandModel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  vehicleLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  vehiclePrice: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '500',
    marginBottom: 4,
  },
  vehicleStatus: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },

});

export default UserProfile;
