import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions, Alert, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { CommonActions } from '@react-navigation/native';
import api from './api';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [loadingReset, setLoadingReset] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const decodedToken = jwtDecode(token);

          if (decodedToken.rol === 'ADMIN') {
            navigation.dispatch(
  CommonActions.reset({
    index: decodedToken.rol === 'ADMIN' ? 1 : 0,
    routes:
      decodedToken.rol === 'ADMIN'
        ? [{ name: 'Home' }, { name: 'AdminPanel' }]
        : [{ name: 'Home' }],
  })
);
          } else {
            navigation.dispatch(
  CommonActions.reset({
    index: 0,
    routes: [{ name: 'Home' }],
  })
);
          }
        }
      } catch (error) {
        await AsyncStorage.removeItem('token');
      }
    };
    checkLoginStatus();
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token } = response.data;
      const decodedToken = jwtDecode(token);

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userEmail', email);
      await AsyncStorage.setItem('userRole', decodedToken.rol);

      const target = decodedToken.rol === 'ADMIN' ? 'AdminPanel' : 'Home';

      navigation.dispatch(
        CommonActions.reset({
          index: decodedToken.rol === 'ADMIN' ? 1 : 0,
   routes:
     decodedToken.rol === 'ADMIN'
       ? [{ name: 'Home' }, { name: 'AdminPanel' }]
       : [{ name: 'Home' }],
        })
      );

    } catch (error) {
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Correo o contraseña incorrectos');
      } else if (error.request) {
        Alert.alert('Error', 'No se pudo conectar con el servidor. Verifica tu conexión.');
      } else {
        Alert.alert('Error', 'Ocurrió un error inesperado');
      }
      console.log('Login error:', error);
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    setLoadingReset(true);
    try {
      await api.post('/auth/solicitar-restablecimiento', {
        email: resetEmail
      });
      Alert.alert('Éxito', 'Código enviado al correo electrónico');
      setResetStep(2);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo solicitar el restablecimiento');
    } finally {
      setLoadingReset(false);
    }
  };

  const handlePasswordResetConfirm = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoadingReset(true);
    try {
      await api.post('/auth/verificar-restablecimiento', {
        email: resetEmail,
        codigo: resetCode,
        nuevaPassword: newPassword,
        confirmarPassword: confirmPassword
      });
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setShowResetModal(false);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setResetStep(1);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo restablecer la contraseña');
    } finally {
      setLoadingReset(false);
    }
  };

  const isMobile = width < 800;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.button, { width: isMobile ? '80%' : '15%', padding: isMobile ? 15 : 10 }]}
        onPress={handleLogin}
      >
        <Text style={[styles.buttonText, { fontSize: isMobile ? 18 : 16 }]}>Acceder</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {
        setResetEmail(email);
        setShowResetModal(true);
      }}>
        <Text style={[styles.link, { marginTop: 10 }]}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showResetModal}
        onRequestClose={() => {
          setShowResetModal(false);
          setResetStep(1);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: isMobile ? '90%' : '40%' }]}>
            <Text style={styles.modalTitle}>Restablecer contraseña</Text>

            {resetStep === 1 ? (
              <>
                <Text style={styles.modalText}>Ingresa tu correo electrónico para recibir un código de verificación</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Correo electrónico"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.modalButtonContainer}>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowResetModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handlePasswordResetRequest}
                    disabled={loadingReset}
                  >
                    <Text style={styles.modalButtonText}>
                      {loadingReset ? 'Enviando...' : 'Enviar código'}
                    </Text>
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
                    disabled={loadingReset}
                  >
                    <Text style={styles.modalButtonText}>
                      {loadingReset ? 'Procesando...' : 'Cambiar contraseña'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  link: {
    marginTop: 15,
    color: '#3498db',
    textDecorationLine: 'underline',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    color: '#555',
    textAlign: 'center',
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
    marginTop: 10,
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
});

export default Login;