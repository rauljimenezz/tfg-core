import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Text, StyleSheet, View, Image, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Platform, Dimensions, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './services/ApiService';
import { Search } from 'lucide-react-native';
import api from './Componentes/api';
import { ActivityIndicator } from 'react-native';
import { AppState } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useWindowDimensions } from 'react-native';

const App = () => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigation = useNavigation();
  const [mode, setMode] = useState('ALQUILER');
  const windowWidth = Dimensions.get('window').width;
  const { width } = useWindowDimensions();
  const isMobile = width < 800;
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [kilometrajeMax, setKilometrajeMax] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const filtersHeight = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const filtersTranslateY = useRef(new Animated.Value(0)).current;
  const filtersOpacity = useRef(new Animated.Value(1)).current;

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchAnimationValue = useRef(new Animated.Value(0)).current;

  const [forceShowFilters, setForceShowFilters] = useState(false);

  const [isModeSelectorVisible, setIsModeSelectorVisible] = useState(true);

  const filtersContainerRef = useRef(null);

  const fetchVehicles = async () => {
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      setError('El precio mínimo no puede ser mayor que el precio máximo');
      setVehicles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const filters = {
        ubicacion: search,
        precioMin: minPrice ? parseFloat(minPrice) : null,
        precioMax: maxPrice ? parseFloat(maxPrice) : null,
        añoMin: yearMin ? parseInt(yearMin) : null,
        añoMax: yearMax ? parseInt(yearMax) : null,
        kilometrajeMax,
        capacidadMin: capacity ? Number(capacity) : null,
        marca: brand || null,
        modelo: model || null,
        tipo: mode
      };

      const vehicles = await ApiService.getVehicles(filters);

      const mappedVehicles = vehicles.map(vehiculo => ({
        id: vehiculo.id.toString(),
        titulo: `${vehiculo.marca} ${vehiculo.modelo}`,
        descripcion: vehiculo.descripcion,
        ubicacion: vehiculo.ubicacion,
        precio: vehiculo.tipoOperacion === 'VENTA'
          ? vehiculo.precioTotal
          : vehiculo.precioPorDia,
        tipoOperacion: vehiculo.tipoOperacion,
        imagenPrincipal: vehiculo.imagenes && vehiculo.imagenes.length > 0
          ? `http://192.168.157.164:8080${vehiculo.imagenes[0]}`
          : 'icono',
        disponible: vehiculo.disponible,
        capacidad: vehiculo.capacidadPasajeros ?? vehiculo.capacidad,
        validada: vehiculo.validada,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        año: vehiculo.año,
        kilometraje: vehiculo.kilometraje,
        imagenes: vehiculo.imagenes ? vehiculo.imagenes.map(img => `http://192.168.157.164:8080${img}`) : [],
        valoracionPromedio: null
      }));

      const vehiclesWithRatings = await Promise.all(
        mappedVehicles.map(async (vehicle) => {
          try {
            const reviews = await ApiService.getVehicleReviews(vehicle.id);

            if (reviews && reviews.length > 0) {
              const totalRating = reviews.reduce((sum, review) => sum + review.calificacion, 0);
              const averageRating = (totalRating / reviews.length).toFixed(1);
              return { ...vehicle, valoracionPromedio: averageRating };
            }
            return vehicle;
          } catch (error) {
            console.error(`Error cargando reseñas para vehículo ${vehicle.id}:`, error);
            return vehicle;
          }
        })
      );

      setVehicles(vehiclesWithRatings);
      setError(null);
    } catch (err) {
      setError(err.message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setCapacity('');
    setBrand('');
    setModel('');
    setYearMin('');
    setYearMax('');
    setKilometrajeMax('');

    fetchVehicles();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const favs = await ApiService.getFavorites();
        setFavorites(favs.map(fav => fav.vehiculo.id.toString()));
      } catch (error) {
        console.log('Error al recargar favoritos en App.js:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);


  useEffect(() => {
    fetchVehicles();
  }, [search, minPrice, maxPrice, capacity, mode, brand, model, yearMin, yearMax, kilometrajeMax]);

  if (Platform.OS === 'web') { document.body.style.overflow = 'auto' }

  useEffect(() => {
    if (isMobile) {
      filtersHeight.current = 110;
    }
  }, [isMobile]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userRole = await AsyncStorage.getItem('userRole');

        if (token) {
          setUser({
            role: userRole
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error al verificar usuario:', error);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVehicles();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const favs = await ApiService.getFavorites();
        setFavorites(favs.map(fav => fav.vehiculo.id.toString()));
      } catch (error) {
        console.log('Error loading favorites:', error);
        if (error.response?.status === 403 || error.message.includes('403')) {
          setFavorites([]);
        }
      }
    };

    loadFavorites();
  }, []);

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } });
        } catch (e) { console.log('Logout backend falló:', e); }
      }
      await clearLocalData();
      setFavorites([]);
      setUser(null);
    } catch (err) {
      console.log('Error durante logout:', err);
      await clearLocalData();
      setFavorites([]);
      setUser(null);
    }
  };

  const clearLocalData = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'userRole', 'userEmail']);
      console.log('Datos locales eliminados correctamente');
    } catch (error) {
      console.log('Error limpiando los datos locales:', error);
    }
  };

  useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        const token = await AsyncStorage.getItem('token');

        if (token) {
          try {
            const response = await api.get('/auth/validate-token', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.data.valid) {
              await handleLogout();
            }
          } catch (error) {
            console.log('Error validando token:', error);
            await handleLogout();
          }
        }
      } catch (error) {
        console.log('Error al verificar token:', error);
      }
    };

    checkTokenValidity();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkTokenValidity();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const closeSearchPanel = () => {
    if (isSearchVisible) {
      setIsSearchVisible(false);
      Keyboard.dismiss();

      Animated.timing(searchAnimationValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease)
      }).start(() => {
        setForceShowFilters(false);
      });
    }
  };

  const handleOutsideTouch = (event) => {
    if (
      isSearchVisible &&
      filtersContainerRef.current &&
      event.target &&
      !filtersContainerRef.current.contains(event.target)
    ) {
      closeSearchPanel();
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && isSearchVisible) {
      document.addEventListener('mousedown', handleOutsideTouch);

      return () => {
        document.removeEventListener('mousedown', handleOutsideTouch);
      };
    }
  }, [isSearchVisible]);

  const toggleSearch = () => {
    const willBeVisible = !isSearchVisible;
    setIsSearchVisible(willBeVisible);
    setForceShowFilters(willBeVisible);

    if (!willBeVisible) {
      Keyboard.dismiss();
    }

    Animated.timing(searchAnimationValue, {
      toValue: willBeVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.ease)
    }).start(() => {
      if (!willBeVisible) {
        setForceShowFilters(false);
      }
    });
  };


  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        if (isMobile) {
          const currentScrollPosition = event.nativeEvent.contentOffset.y;
          const isScrollingDown = currentScrollPosition > lastScrollPosition;

          setLastScrollPosition(currentScrollPosition);

          if (isMenuVisible) {
            setIsMenuVisible(false);
          }

          if (!isSearchVisible) {
            if (isScrollingDown && filtersVisible && currentScrollPosition > 10 && !forceShowFilters) {
              setFiltersVisible(false);
              setIsModeSelectorVisible(false);
              Keyboard.dismiss();
              Animated.parallel([
                Animated.timing(filtersTranslateY, {
                  toValue: -filtersHeight.current,
                  duration: 300,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.ease)
                }),
                Animated.timing(filtersOpacity, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true
                })
              ]).start();
            }
            else if (!isScrollingDown && !filtersVisible && !forceShowFilters) {
              setFiltersVisible(true);
              setIsModeSelectorVisible(true);
              Animated.parallel([
                Animated.timing(filtersTranslateY, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.ease)
                }),
                Animated.timing(filtersOpacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true
                })
              ]).start();
            }
          }
        }
      }
    }
  );

  const renderModeSelector = () => {
    if (!isModeSelectorVisible && !forceShowFilters && isMobile) return null;

    return (
      <View style={[
        styles.modeSelector,
        isMobile && styles.modeSelectorFixed,
        (isMobile && forceShowFilters) && { display: 'flex' }
      ]}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'ALQUILER' ? styles.selectedMode : null]}
          onPress={() => setMode('ALQUILER')}
        >
          <Text style={[styles.modeText, mode === 'ALQUILER' ? styles.selectedModeText : null]}>Alquiler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'VENTA' ? styles.selectedMode : null]}
          onPress={() => setMode('VENTA')}
        >
          <Text style={[styles.modeText, mode === 'VENTA' ? styles.selectedModeText : null]}>Venta</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const toggleMenu = () => {
    setIsMenuVisible(prevState => !prevState);
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
  };

  const handleVehicleClick = (vehicle) => {
    navigation.navigate('VehicleDetail', {
      vehicleId: vehicle.id,
      vehicleData: {
        id: vehicle.id,
        title: vehicle.titulo,
        location: vehicle.ubicacion,
        tipoOperacion: vehicle.tipoOperacion,
        precioPorDia: vehicle.tipoOperacion === 'VENTA' ? undefined : vehicle.precio,
        precioTotal: vehicle.tipoOperacion === 'VENTA' ? vehicle.precio : undefined,
        images: vehicle.imagenes.map(img => ({ uri: img })),
        description: vehicle.descripcion,
        features: {
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          año: vehicle.año,
          kilometraje: vehicle.kilometraje,
          capacidad: vehicle.capacidadPasajeros ?? vehicle.capacidad
        },
        disponible: vehicle.disponible,
        validada: vehicle.validada
      }
    });
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsMenuVisible(false);
    });
    return unsubscribe;
  }, [navigation]);

  const renderMenu = () => {
    if (!isMenuVisible) return null;

    return (
      <View style={styles.menuContainer}>
        {user ? (
          <>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setIsMenuVisible(false);
                if (user?.role === 'ADMIN') {
                  navigation.navigate('AdminPanel');
                } else {
                  navigation.navigate('UserProfile');
                }
              }}
            >
              <Text style={styles.menuText}>Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={handleLogout}>
              <Text style={styles.menuText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.menuOption} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.menuText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.menuText}>Registrarse</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderSearchBar = () => {
    if (!isMobile) {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <TextInput
            style={styles.inputField}
            placeholder="Marca"
            value={brand}
            onChangeText={setBrand}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Modelo"
            value={model}
            onChangeText={setModel}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Ubicación"
            value={search}
            onChangeText={setSearch}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Precio mínimo"
            value={minPrice}
            keyboardType="numeric"
            onChangeText={setMinPrice}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Precio máximo"
            value={maxPrice}
            keyboardType="numeric"
            onChangeText={setMaxPrice}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Capacidad mínima"
            value={capacity}
            keyboardType="numeric"
            onChangeText={setCapacity}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Año mínimo"
            value={yearMin}
            keyboardType="numeric"
            onChangeText={setYearMin}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Año máximo"
            value={yearMax}
            keyboardType="numeric"
            onChangeText={setYearMax}
          />
          <TextInput
            style={styles.inputField}
            placeholder="Km máx."
            value={kilometrajeMax}
            keyboardType="numeric"
            onChangeText={setKilometrajeMax}
          />
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
            <Text style={styles.clearButtonText}>Eliminar filtros</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    const searchBarHeight = searchAnimationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 110]
    });

    const searchBarOpacity = searchAnimationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    });

    return (
      <Animated.View
        style={[
          styles.searchBarContainerMobileFixed,
          { height: searchBarHeight, opacity: searchBarOpacity, overflow: 'hidden' }
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          scrollEnabled={isSearchVisible}
          pointerEvents={isSearchVisible ? 'auto' : 'none'}
        >
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Marca"
            value={brand}
            onChangeText={setBrand}
            editable={isSearchVisible}
          />
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Modelo"
            value={model}
            onChangeText={setModel}
            editable={isSearchVisible}
          />
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Ubicación"
            value={search}
            onChangeText={setSearch}
            editable={isSearchVisible}
          />
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Precio mínimo"
            value={minPrice}
            keyboardType="numeric"
            onChangeText={setMinPrice}
            editable={isSearchVisible}
          />
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Precio máximo"
            value={maxPrice}
            keyboardType="numeric"
            onChangeText={setMaxPrice}
            editable={isSearchVisible}
          />
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Capacidad mínima"
            value={capacity}
            keyboardType="numeric"
            onChangeText={setCapacity}
            editable={isSearchVisible}
          />
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Año mínimo"
            value={yearMin}
            keyboardType="numeric"
            onChangeText={setYearMin}
            editable={isSearchVisible}
          />
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Año máximo"
            value={yearMax}
            keyboardType="numeric"
            onChangeText={setYearMax}
            editable={isSearchVisible}
          />
          <TextInput
            style={styles.inputFieldMobile}
            placeholder="Km máx."
            value={kilometrajeMax}
            keyboardType="numeric"
            onChangeText={setKilometrajeMax}
            editable={isSearchVisible}
          />
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
            <Text style={styles.clearButtonText}>Eliminar filtros</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  };

  const renderVehicles = () => {
    return vehicles.map((vehicle) => (
      <View key={vehicle.id} style={[
        styles.vehicleItemContainer,
        isMobile ? styles.vehicleItemContainerMobile : null
      ]}>
        <TouchableOpacity
          style={[
            styles.vehicleItem,
            isMobile ? styles.vehicleItemMobile : null
          ]}
          onPress={() => handleVehicleClick(vehicle)}
        >
          <Image
            source={
              vehicle.imagenPrincipal && vehicle.imagenPrincipal !== 'icono'
                ? { uri: vehicle.imagenPrincipal }
                : require('./img/coche.png')
            }
            style={[
              styles.image,
              isMobile ? styles.imageMobile : null
            ]}
            resizeMode="cover"
            onError={(e) => console.log('Image load error', e.nativeEvent.error)}
          />
          <View style={isMobile ? styles.vehicleTextMobile : styles.vehicleTextDesktop}>
            <Text style={styles.title}>{vehicle.marca} {vehicle.modelo}</Text>
            <Text>{vehicle.ubicacion}</Text>
            <Text>
              {vehicle.tipoOperacion === 'VENTA'
                ? `${vehicle.precio}€`
                : `${vehicle.precio}€ por día`}
            </Text>
            <View style={styles.vehicleDetails}>
              <Text>Año: {vehicle.año}</Text>

              {vehicle.reservada && (
                <Text style={styles.reservedStatus}>Reservada</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            favorites.includes(vehicle.id.toString()) && styles.favoriteButtonActive
          ]}
          onPress={async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert('Iniciar sesión', 'Debes iniciar sesión para agregar a favoritos');
                navigation.navigate('Login');
                return;
              }

              const isCurrentlyFavorite = favorites.includes(vehicle.id.toString());

              if (isCurrentlyFavorite) {
                await ApiService.removeFromFavorites(vehicle.id);
                setFavorites(prev => prev.filter(id => id !== vehicle.id.toString()));
              } else {
                await ApiService.addToFavorites(vehicle.id);
                setFavorites(prev => [...prev, vehicle.id.toString()]);
              }
            } catch (error) {
              Alert.Alert('Error al actualizar favoritos:', error);
              Alert.alert('Error', error.message || 'No se pudo actualizar el favorito');
            }
          }}
        >
          <Text style={[
            styles.favoriteIcon,
            favorites.includes(vehicle.id.toString()) && styles.favoriteIconActive
          ]}>
            ♥
          </Text>
        </TouchableOpacity>
        {vehicle.valoracionPromedio && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>
              ⭐ {vehicle.valoracionPromedio}
            </Text>
          </View>
        )}

      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('./img/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Cochemania</Text>
        </View>
        <View style={styles.headerRight}>
          {isMobile && (
            <TouchableOpacity onPress={toggleSearch} style={styles.searchIcon}>
              <Search color="#333" size={24} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleMenu}>
            <Image
              source={user ? require('./img/perfil.jpg') : require('./img/perfil.jpg')}
              style={styles.profileIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderMenu()}

      {isMenuVisible && (
        <Pressable
          style={styles.menuBackdrop}
          onPress={closeMenu}
        />
      )}

      <Animated.View
        ref={filtersContainerRef}
        style={[
          styles.filtersContainer,
          isMobile ? {
            position: 'absolute',
            top: Platform.OS === 'web' ? 80 : 120,
            left: 0,
            right: 0,
            zIndex: 90,
            transform: [{
              translateY: forceShowFilters
                ? new Animated.Value(0)
                : filtersTranslateY
            }],
            opacity: forceShowFilters
              ? 1
              : filtersOpacity,
            display: isModalVisible ? 'none' : 'flex'
          } : {
            marginTop: 10,
            marginBottom: 10
          }
        ]}
      >
        {renderModeSelector()}
        {renderSearchBar()}
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.grid,
          isMobile && styles.gridWithFixedFilters,
          isMobile && isSearchVisible && styles.gridWithOpenFilters
        ]}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={styles.loadingIndicator}
          />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity onPress={fetchVehicles} style={styles.retryButton}>
              <Text>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : vehicles.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No se encontraron vehiculos</Text>
          </View>
        ) : (
          renderVehicles()
        )}
      </ScrollView>

      {isSearchVisible && isMobile && (
        <TouchableWithoutFeedback onPress={closeSearchPanel}>
          <View style={styles.searchOverlay} />
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'web' ? 20 : 0,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
    borderRadius: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF5A5F',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Platform.OS === 'web' ? 20 : 0,
  },
  searchIcon: {
    padding: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 70 : 90,
    right: 20,
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuOption: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuText: {
    fontSize: 16,
    color: '#484848',
    fontWeight: '500',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 50,
    ...(Platform.OS === 'web'
      ? { position: 'sticky', top: 0, paddingVertical: 10 }
      : { position: 'relative', marginVertical: 10 }
    ),
  },
  searchBarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
    ...(Platform.OS === 'web'
      ? { maxWidth: 1000, alignSelf: 'center' }
      : {}
    ),
  },
  inputField: {
    minWidth: '48%',
    height: 40,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  searchBarContainerMobileFixed: {
    flexDirection: 'column',
    padding: 10,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 30,
  },
  inputFieldMobile: {
    height: 40,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  grid: {
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 12,
    gap: 12,
    backgroundColor: '#fff',
    ...(Platform.OS === 'web'
      ? { paddingHorizontal: 60, justifyContent: 'flex-start' }
      : {}
    ),
  },
  gridWithFixedFilters: {
    paddingTop: 120,
  },
  gridWithOpenFilters: {
    paddingTop: 200,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  inputFieldHorizontal: {
    width: 160,
    height: 40,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    marginRight: 8,
  },
  vehicleItemContainer: {
    position: 'relative',
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { width: '23%', marginHorizontal: 8 }
      : { width: '100%' }
    ),
  },
  vehicleItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }
      : {}
    ),
  },
  vehicleItemMobile: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: Platform.OS === 'web' ? 160 : 180,
    backgroundColor: '#f7f7f7',
  },
  imageMobile: {
    width: 120,
    height: 100,
    margin: 12,
    borderRadius: 8,
    backgroundColor: '#f7f7f7',
  },
  vehicleTextDesktop: {
    padding: 12,
    ...(Platform.OS === 'web' ? { minHeight: 140 } : {}),
  },
  vehicleTextMobile: {
    flex: 1,
    padding: 12,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
    color: '#222222',
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 13,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  availableStatus: {
    backgroundColor: '#ebf9f0',
    color: '#34a853',
  },
  reservedStatus: {
    backgroundColor: '#fdeaeb',
    color: '#e74c3c',
  },
  favoriteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  favoriteButtonActive: {
    backgroundColor: '#ffecec',
    borderColor: '#e74c3c',
  },
  favoriteIcon: {
    fontSize: 16,
    color: '#e74c3c',
    opacity: 0.5,
  },
  favoriteIconActive: {
    opacity: 1,
  },
  ratingContainer: {
    position: 'absolute',
    top: 50,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
    zIndex: 9,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'stretch',
    overflow: 'auto',
    zIndex: 1000,
    ...(Platform.OS === 'web'
      ? {
        width: '40%',
        maxWidth: 700,
        padding: 32,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
      }
      : {
        width: '92%',
        maxHeight: '80%',
        padding: 20,
      }
    ),
  },
  carouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    width: '100%',
  },
  modalImage: {
    width: '80%',
    height: 240,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  carouselButton: {
    width: 40,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  carouselButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  carouselIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 16,
    backgroundColor: '#FF5A5F',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#222',
  },
  modalText: {
    fontSize: 16,
    marginVertical: 5,
    color: '#484848',
  },
  moreInfoButton: {
    backgroundColor: '#FF5A5F',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  moreInfoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#222',
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    margin: 10,
    marginBottom: 5,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD',
    height: 48,
  },
  modeSelectorFixed: {
    zIndex: 40,
  },
  modeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedMode: {
    borderBottomColor: '#FF5A5F',
    backgroundColor: '#fff5f5',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#717171',
  },
  selectedModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF5A5F',
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF5A5F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#717171',
    textAlign: 'center',
  },
  searchOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  clearButton: {
    height: 40,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#ffecec',
  },
  clearButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
  },

});

export default App;