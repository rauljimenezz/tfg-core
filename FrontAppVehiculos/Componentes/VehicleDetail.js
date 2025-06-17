import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import { Modal } from 'react-native';
import { Linking } from 'react-native';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { CommonActions } from '@react-navigation/native';

const VehicleDetail = ({ route, navigation }) => {
  const { vehicleId, vehicleData, initialMode } = route.params;
  const [vehicle, setVehicle] = useState(vehicleData || null);
  const [loading, setLoading] = useState(!vehicleData);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservedRanges, setReservedRanges] = useState([]);
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [reservationStep, setReservationStep] = useState(1);
  const [reservationData, setReservationData] = useState({ fechaInicio: '', fechaFin: '' });
  const [totalCost, setTotalCost] = useState(0);

  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  const calculateTotal = (start, end) => {
    if (!start || !end || !vehicle) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const days = Math.floor((e - s) / MS_IN_DAY) + 1;
    return days * (vehicle.precioPorDia || 0);
  };

  const rangoBloqueado = (ini, fin) =>
    reservedRanges.some(r =>
      moment.max(moment(ini), moment(r.fechaInicio))
        .isSameOrBefore(moment.min(moment(fin), moment(r.fechaFin)), 'day')
    );

  useEffect(() => {
    if (showReservationModal) {
      ApiService.getVehicleAvailability(vehicleId)
        .then(data => setReservedRanges(data))
        .catch(err => console.error(err));
    }
  }, [showReservationModal]);

  const renderReservationModal = () => {
    const marked = {};
    reservedRanges.forEach(({ fechaInicio, fechaFin }) => {
      let cur = moment(fechaInicio), end = moment(fechaFin);
      while (cur.isSameOrBefore(end, 'day')) {
        marked[cur.format('YYYY-MM-DD')] = { disabled: true, disableTouchEvent: true, color: '#d9d9d9' };
        cur = cur.add(1, 'day');
      }
    });
    if (selectedStart) marked[selectedStart] = { ...(marked[selectedStart] || {}), startingDay: true, color: '#70d7c7', textColor: 'white' };
    if (selectedEnd) marked[selectedEnd] = { ...(marked[selectedEnd] || {}), endingDay: true, color: '#70d7c7', textColor: 'white' };
    if (selectedStart && selectedEnd) {
      let cursor = moment(selectedStart).add(1, 'day'), end = moment(selectedEnd).subtract(1, 'day');
      while (cursor.isSameOrBefore(end, 'day')) {
        marked[cursor.format('YYYY-MM-DD')] = { color: '#a4e1d9', textColor: 'white' };
        cursor = cursor.add(1, 'day');
      }
    }

    return (
      <Modal visible={showReservationModal} transparent animationType="slide" onRequestClose={() => setShowReservationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {reservationStep === 1 && (
              <>
                <Text style={styles.modalTitle}>Selecciona fechas</Text>
                <Calendar
                  minDate={moment().format('YYYY-MM-DD')}
                  markingType='period'
                  markedDates={marked}
                  onDayPress={day => {
                    const date = day.dateString;
                    if (marked[date]?.disabled) return;
                    if (!selectedStart || (selectedStart && selectedEnd)) {
                      setSelectedStart(date);
                      setSelectedEnd(null);
                      setReservationData({ fechaInicio: date, fechaFin: '' });
                      setTotalCost(0);
                    } else {
                      const i = moment.min(moment(selectedStart), moment(date)).format('YYYY-MM-DD');
                      const f = moment.max(moment(selectedStart), moment(date)).format('YYYY-MM-DD');
                      if (rangoBloqueado(i, f)) {
                        Alert.alert('Fechas ocupadas', 'Este rango incluye días reservados');
                        return;
                      }
                      setSelectedStart(i);
                      setSelectedEnd(f);
                      setReservationData({ fechaInicio: i, fechaFin: f });
                      setTotalCost(calculateTotal(i, f));
                    }
                  }}
                />
                {reservationData.fechaInicio && reservationData.fechaFin && (
                  <View style={styles.costContainer}>
                    <Text style={styles.costLabel}>Coste:</Text>
                    <Text style={styles.costAmount}>{totalCost.toFixed(2)}€</Text>
                  </View>
                )}
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowReservationModal(false)}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.createButton]} disabled={!reservationData.fechaInicio || !reservationData.fechaFin} onPress={() => setReservationStep(2)}>
                    <Text style={styles.buttonText}>Siguiente</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {reservationStep === 2 && (
              <>
                <Text style={styles.modalTitle}>Confirmar Reserva</Text>
                <Text>Desde: {reservationData.fechaInicio}</Text>
                <Text>Hasta: {reservationData.fechaFin}</Text>
                <Text style={{ marginTop: 10 }}>Coste total: {totalCost.toFixed(2)}€</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setReservationStep(1)}>
                    <Text style={styles.buttonText}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.createButton]} onPress={async () => {
                    try {
                      await ApiService.createReservation(vehicleId, reservationData);
                      Alert.alert('Éxito', 'Reserva creada');
                      resetReservationState();
                      setShowReservationModal(false);
                    } catch (err) {
                      Alert.alert('Error', err.message);
                    }
                  }}>
                    <Text style={styles.buttonText}>Reservar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </View>
        </View>
      </Modal>
    );
  };

  const toggleFavorite = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Iniciar sesión', 'Debes iniciar sesión para agregar a favoritos');
        navigation.navigate('Login');
        return;
      }

      if (isFavorite) {
        await ApiService.removeFromFavorites(vehicleId);
        if (route.params?.fromFavorites) {
          navigation.navigate('UserProfile', { refreshFavorites: true });
        }
      } else {
        await ApiService.addToFavorites(vehicleId);
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error al manejar favoritos:', error);
      Alert.alert('Error', error.message || 'No se pudo completar la acción');
    }
  };

  const isMobile = Dimensions.get('window').width < 768;
  const carouselHeight = isMobile ? 250 : 350;

  const calculateTotalCost = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr || !vehicle || !vehicle.precioPorDia) {
      return 0;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 0;
    }

    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return vehicle.precioPorDia * diffDays;
  };

  const updateReservationData = (field, value) => {
    const newData = { ...reservationData, [field]: value };
    const newTotalCost = calculateTotalCost(
      field === 'fechaInicio' ? value : reservationData.fechaInicio,
      field === 'fechaFin' ? value : reservationData.fechaFin
    );
    setReservationData(newData);
    setTotalCost(newTotalCost);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        navigation.dispatch(
          CommonActions.navigate({
            name: 'Home',
            params: { initialMode },
            merge: true
          })
        );
      }
    });
    return unsubscribe;
  }, [navigation, initialMode]);

  const handleReserve = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Iniciar sesión', 'Debes iniciar sesión para hacer una reserva');
        return;
      }

      if (!reservationData.fechaInicio || !reservationData.fechaFin) {
        Alert.alert('Error', 'Por favor, selecciona las fechas de inicio y fin');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = new Date(reservationData.fechaInicio);
      startDate.setHours(0, 0, 0, 0);

      if (startDate < today) {
        Alert.alert('Error', 'La fecha de inicio no puede ser anterior al día actual');
        return;
      }

      const endDate = new Date(reservationData.fechaFin);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        Alert.alert('Error', 'La fecha de fin no puede ser anterior al día actual');
        return;
      }

      if (endDate < startDate) {
        Alert.alert('Error', 'La fecha de fin no puede ser anterior a la fecha de inicio');
        return;
      }

      const response = await ApiService.createReservation(vehicleId, {
        fechaInicio: reservationData.fechaInicio,
        fechaFin: reservationData.fechaFin
      });

      Alert.alert('Éxito', 'Reserva creada correctamente');
      setShowReservationModal(false);
      setReservationData({ fechaInicio: '', fechaFin: '' });

    } catch (error) {
      console.error('Error creating reservation:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la reserva');
    }
  };


  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const vehicleReviews = await ApiService.getVehicleReviews(vehicleId);
        console.log("Reviews recibidas:", vehicleReviews);

        const reviewsWithUser = vehicleReviews.map(review => ({
          ...review,
          usuario: review.usuario || { email: 'Usuario anónimo' }
        }));

        setReviews(reviewsWithUser || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      }
    };

    fetchReviews();
  }, [vehicleId]);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        const vehicleDetails = await ApiService.getVehicleById(vehicleId);
        const vehicleReviews = await ApiService.getVehicleReviews(vehicleId);

        setVehicle({
          ...vehicleDetails,
          title: vehicleDetails.titulo,
          location: vehicleDetails.ubicacion,
          precioPorDia: vehicleDetails.precioPorDia,
          precioTotal: vehicleDetails.precioTotal,
          tipoOperacion: vehicleDetails.tipoOperacion,
          images: vehicleDetails.imagenes && vehicleDetails.imagenes.length > 0
            ? vehicleDetails.imagenes.map(img => ({
              uri: img.startsWith('http') ? img : `http://192.168.157.164:8080${img}`
            }))
            : [{ uri: require('../img/coche.png') }],
          description: vehicleDetails.descripcion || 'Descripción no disponible',
          features: {
            marca: vehicleDetails.marca,
            modelo: vehicleDetails.modelo,
            año: vehicleDetails.año,
            kilometraje: vehicleDetails.kilometraje,
            capacidad: vehicleDetails.capacidadPasajeros ?? vehicleDetails.capacidad
          }
        });
        setReviews(vehicleReviews || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!vehicleData) {
      fetchVehicleDetails();
    }
  }, [vehicleId, vehicleData]);

  useEffect(() => {
    const calculateAverageRating = () => {
      if (reviews.length === 0) return 0;
      const sum = reviews.reduce((acc, review) => acc + review.calificacion, 0);
      return (sum / reviews.length).toFixed(1);
    };
    setAverageRating(calculateAverageRating());
  }, [reviews]);

  useEffect(() => {
    const getUserRole = async () => {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role);
    };
    getUserRole();
  }, []);

  useEffect(() => {
    const loadFavoriteStatus = async () => {
      try {
        const isFav = await ApiService.checkFavoriteStatus(vehicleId);
        setIsFavorite(isFav);
      } catch (error) {
        console.error('Error loading favorite status:', error);
      }
    };

    loadFavoriteStatus();
  }, [vehicleId]);

  const nextImage = () => {
    setCurrentImageIndex(prev =>
      prev === vehicle.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(prev =>
      prev === 0 ? vehicle.images.length - 1 : prev - 1
    );
  };

  const resetReservationState = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setReservationStep(1);
    setReservationData({ fechaInicio: '', fechaFin: '' });
    setTotalCost(0);
  };

  useEffect(() => {
    if (!showReservationModal) {
      resetReservationState();
    }
  }, [showReservationModal]);


  const renderContactButton = () => {
    if (userRole === 'ADMIN') {
      return null;
    }

    const checkUserAuthentication = async () => {
      const token = await AsyncStorage.getItem('token');
      return token !== null;
    };

    const handleContactSeller = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Iniciar sesión', 'Debes iniciar sesión para contactar al vendedor');
          navigation.navigate('Login');
          return;
        }

        const result = await ApiService.sendContactRequest(vehicle.id);

        const subject = `Consulta sobre ${vehicle.title}`;
        const mailtoUrl = `mailto:${result.ownerEmail}?subject=${encodeURIComponent(subject)}`;

        const canOpen = await Linking.canOpenURL(mailtoUrl);
        if (canOpen) {
          await Linking.openURL(mailtoUrl);
        } else {
          Alert.alert(
            'Contacto Exitoso',
            `El vendedor ha sido notificado. Su correo es: ${result.ownerEmail}`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error al contactar:', error);
        Alert.alert('Error', error.message);
      }
    };

    const handleReservePress = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Iniciar sesión', 'Debes iniciar sesión para hacer una reserva');
        navigation.navigate('Login');
        return;
      }
      setShowReservationModal(true);
    };

    if (!userRole) {
      return null;
    }

    return (
      <>
        {vehicle.tipoOperacion === 'ALQUILER' && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => setShowReservationModal(true)}
          >
            <Text style={styles.contactButtonText}>Reservar ahora</Text>
          </TouchableOpacity>
        )}

        {vehicle.tipoOperacion === 'VENTA' && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactSeller}
          >
            <Text style={styles.contactButtonText}>Contactar con el vendedor</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  const ReviewInput = () => {
    const [localReview, setLocalReview] = useState({ rating: 0, comment: '' });

    const reloadReviews = async () => {
      try {
        const vehicleReviews = await ApiService.getVehicleReviews(vehicleId);
        setReviews(vehicleReviews || []);
      } catch (error) {
        console.error('Error al recargar reseñas:', error);
      }
    };

    const handleSubmit = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Iniciar sesión', 'Debes iniciar sesión para dejar una reseña');
        return;
      }

      if (userRole === 'ADMIN') {
        Alert.alert('Acceso denegado', 'Solo usuarios y propietarios pueden dejar reseñas.');
        return;
      }

      if (localReview.rating === 0 || localReview.comment.trim() === '') {
        Alert.alert('Error', 'Por favor, selecciona una calificación y escribe un comentario');
        return;
      }

      try {
        await ApiService.addReview(vehicleId, {
          calificacion: localReview.rating,
          comentario: localReview.comment
        });
        await reloadReviews();

        const userEmail = await AsyncStorage.getItem('userEmail');
        const reviewToAdd = {
          id: Date.now().toString(),
          usuario: { email: userEmail || 'Usuario' },
          calificacion: localReview.rating,
          comentario: localReview.comment,
          fechaReseña: new Date().toISOString().split('T')[0]
        };

        setReviews([reviewToAdd, ...reviews]);
        setLocalReview({ rating: 0, comment: '' });
      } catch (error) {
        Alert.alert('Error', 'No se pudo agregar la reseña: ' + error.message);
      }
    };

    return (
      <View style={styles.reviewInputContainer}>
        <Text style={styles.sectionTitle}>Añadir Reseña</Text>
        {!userRole ? (
          <Text style={{ marginBottom: 10 }}>Inicia sesión para dejar una reseña</Text>
        ) : !(userRole === 'USER' || userRole === 'PROPIETARIO') ? (
          <Text style={{ marginBottom: 10 }}>Solo usuarios pueden dejar reseñas</Text>
        ) : (
          <>
            <View style={styles.starRatingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setLocalReview({ ...localReview, rating: star })}
                >
                  <Text style={[
                    styles.starButton,
                    star <= localReview.rating && styles.selectedStar
                  ]}>
                    ⭐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewTextInput}
              placeholder="Escribe tu reseña..."
              multiline
              value={localReview.comment}
              onChangeText={(text) => setLocalReview(prev => ({ ...prev, comment: text }))}
              blurOnSubmit={false}
              returnKeyType="done"
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.submitReviewButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitReviewButtonText}>Enviar Reseña</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const ReviewList = () => (
    <View style={styles.reviewListContainer}>
      <Text style={styles.sectionTitle}>Reseñas ({reviews.length}) - Promedio: {averageRating} ⭐</Text>
      {reviews.length === 0 ? (
        <Text>No hay reseñas aún</Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewUserName}>
                {review.usuario?.nombre || review.usuario?.email || 'Usuario anónimo'}
              </Text>
              <Text style={styles.reviewDate}>
                {review.fechaReseña ? new Date(review.fechaReseña).toLocaleDateString() : 'Fecha desconocida'}
              </Text>
            </View>
            <Text style={styles.reviewRating}>{'⭐'.repeat(review.calificacion)}</Text>
            <Text style={styles.reviewComment}>{review.comentario}</Text>
            {review.respuestaDueño && (
              <View style={styles.ownerResponse}>
                <Text style={styles.ownerResponseLabel}>Respuesta del dueño:</Text>
                <Text style={styles.ownerResponseText}>{review.respuestaDueño}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  if (loading && !vehicle) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error al cargar el vehículo: {error}</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text>Vehículo no encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.carouselContainer, { height: carouselHeight }]}>
        <TouchableOpacity
          style={[styles.carouselButton, { height: carouselHeight }]}
          onPress={prevImage}
        >
          <Text style={styles.carouselButtonText}>{"<"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.imageContainer, { height: carouselHeight }]}
          onPress={() => {
            setSelectedImageIndex(currentImageIndex);
            setModalVisible(true);
          }}
        >
          <Image
            source={vehicle.images[currentImageIndex]}
            style={styles.vehicleImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.carouselButton, { height: carouselHeight }]}
          onPress={nextImage}
        >
          <Text style={styles.carouselButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.carouselIndicator}>
        {vehicle.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentImageIndex ? styles.activeIndicator : {}
            ]}
          />
        ))}
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{vehicle.title}</Text>
          <View style={styles.ratingAndFavoriteContainer}>
            {vehicle.tipoOperacion !== 'VENTA' && (
              <Text style={styles.ratingText}>
                {averageRating} ⭐
              </Text>
            )}
            <TouchableOpacity
              onPress={toggleFavorite}
              style={[
                styles.favoriteButton,
                isFavorite && styles.favoriteButtonActive
              ]}
            >
              <Text style={styles.favoriteIcon}>
                {isFavorite ? '❤' : '♥'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.location}>{vehicle.location}</Text>
        <Text style={styles.price}>
          {vehicle.tipoOperacion === 'VENTA'
            ? `${vehicle.precioTotal}€ (Venta)`
            : `${vehicle.precioPorDia}€ por día`}
        </Text>

        <View style={styles.separator} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>
            {vehicle.description}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características</Text>
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Marca</Text>
              <Text>{vehicle.features.marca}</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Modelo</Text>
              <Text>{vehicle.features.modelo}</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Año</Text>
              <Text>{vehicle.features.año}</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Kilometraje</Text>
              <Text>{vehicle.features.kilometraje} km</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureTitle}>Capacidad</Text>
              <Text>{vehicle.features.capacidad} pasajeros</Text>
            </View>
          </View>
        </View>

        <View style={styles.separator} />

        {vehicle.tipoOperacion !== 'VENTA' && (
          <>
            <ReviewInput />
            <ReviewList />
          </>
        )}

        {renderContactButton()}
        {renderReservationModal()}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.fullScreenButton}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            <Image
              source={vehicle.images[selectedImageIndex]}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalNavButton, { left: 20 }]}
            onPress={() => {
              setSelectedImageIndex(prev =>
                prev === 0 ? vehicle.images.length - 1 : prev - 1
              );
            }}
          >
            <Text style={styles.modalNavButtonText}>{"<"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalNavButton, { right: 20 }]}
            onPress={() => {
              setSelectedImageIndex(prev =>
                prev === vehicle.images.length - 1 ? 0 : prev + 1
              );
            }}
          >
            <Text style={styles.modalNavButtonText}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  modalNavButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalNavButtonText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  createButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  carouselButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  carouselButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  carouselIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: '#e74c3c',
  },
  detailsContainer: {
    padding: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  ratingContainer: {
    backgroundColor: '#fef9e7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f9e79f',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d4ac0d',
  },
  location: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  featureItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  featureTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  reviewInputContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  starButton: {
    fontSize: 30,
    marginHorizontal: 5,
    opacity: 0.5,
  },
  selectedStar: {
    opacity: 1,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitReviewButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  submitReviewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reviewListContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  reviewUserName: {
    fontWeight: 'bold',
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
  },
  reviewRating: {
    marginBottom: 5,
  },
  reviewComment: {
    color: '#444',
  },
  ownerResponse: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  ownerResponseLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#e74c3c',
  },
  ownerResponseText: {
    color: '#555',
  },
  contactButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  costContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  costAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  favoriteButtonActive: {
    backgroundColor: '#ffecec',
    borderColor: '#e74c3c',
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#e74c3c',
  },
  ratingAndFavoriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9e7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#f9e79f',
  },
  reviewUserName: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: 16,
  },
});

export default VehicleDetail;