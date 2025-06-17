import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useWindowDimensions, Alert, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const Register = ({ navigation }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState(1);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [resetLoading, setResetLoading] = useState(false);

  const { width } = useWindowDimensions();

  const containsNumbers = (text) => {
    return /\d/.test(text);
  };

  const containsOnlyNumbers = (text) => {
    return /^\d*$/.test(text);
  };

  const validateForm = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return false;
    }
    if (containsNumbers(nombre)) {
      Alert.alert('Error', 'El nombre no puede contener números');
      return false;
    }
    if (apellido.trim() && containsNumbers(apellido)) {
      Alert.alert('Error', 'El apellido no puede contener números');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (telefono.trim() && !containsOnlyNumbers(telefono)) {
      Alert.alert('Error', 'El teléfono solo puede contener números');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const userData = {
      nombre: nombre,
      apellido: apellido,
      email: email,
      password: password,
      rol: "USER",
      telefono: telefono,
      direccion: direccion
    };

    try {
      const response = await api.post('/auth/registro', userData);

      if (response.data.token) {
        Alert.alert(
          'Registro exitoso',
          'Tu cuenta ha sido creada correctamente.',
          [{
            text: 'OK',
            onPress: () => {
              navigation.replace('Login', {
                email: email,
                verified: true
              });
            }
          }]
        );
      }
    } catch (error) {
      console.error("Error en el registro:", error);
      let errorMessage = 'Error al registrar';
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      Alert.alert('Error de Registro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/verificar-codigo', {
        email: pendingEmail,
        codigo: verificationCode
      });

      console.log("Respuesta de verificación:", response.data);

      if (response.data.token) {
        Alert.alert(
          'Registro Exitoso',
          'Tu cuenta ha sido verificada. Por favor inicia sesión con tus credenciales.',
          [{
            text: 'OK',
            onPress: () => {
              navigation.replace('Login', {
                email: pendingEmail,
                verified: true
              });
            }
          }]
        );
      }
    } catch (error) {
      console.error("Error en la verificación:", error);
      let errorMessage = 'Error al verificar el código';
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      Alert.alert('Error de Verificación', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!pendingEmail) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/solicitar-restablecimiento', { email: pendingEmail });

      if (response.data.mensaje) {
        Alert.alert('Código reenviado', 'Se ha enviado un nuevo código de verificación a tu correo.');
      }
    } catch (error) {
      console.error("Error al reenviar código:", error);
      Alert.alert('Error', 'No se pudo reenviar el código. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNombreChange = (text) => {
    setNombre(text);
  };

  const handleApellidoChange = (text) => {
    setApellido(text);
  };

  const handleTelefonoChange = (text) => {
    if (containsOnlyNumbers(text) || text === '') {
      setTelefono(text);
    }
  };

  const handleResetRequest = async () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/auth/solicitar-restablecimiento', { email: resetEmail });

      if (response.data.mensaje) {
        setResetStep(2);
        Alert.alert(
          'Código enviado',
          `Se ha enviado un código de verificación a ${resetEmail}.`
        );
      }
    } catch (error) {
      console.error("Error al solicitar restablecimiento:", error);
      let errorMessage = 'Error al enviar código';
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (!resetCode.trim() || resetCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código de 6 dígitos');
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/auth/verificar-codigo', {
        email: resetEmail,
        codigo: resetCode
      });

      if (response.data.token) {
        setResetStep(3);
      }
    } catch (error) {
      console.error("Error al verificar código:", error);
      let errorMessage = 'Código incorrecto';
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setResetLoading(true);
    try {
      const response = await api.post('/auth/restablecer-password', {
        email: resetEmail,
        codigo: resetCode,
        nuevaPassword: newPassword
      });

      if (response.data.mensaje) {
        Alert.alert(
          'Contraseña restablecida',
          'Tu contraseña ha sido actualizada exitosamente',
          [
            {
              text: 'Iniciar sesión',
              onPress: () => {
                setShowResetModal(false);
                setResetStep(1);
                navigation.navigate('Login', { email: resetEmail });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Error al restablecer contraseña:", error);
      let errorMessage = 'No se pudo restablecer la contraseña';
      if (error.response) {
        errorMessage = error.response.data.error || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const resendResetCode = async () => {
    setResetLoading(true);
    try {
      await axios.post(
        'http://192.168.157.164:8080/api/auth/solicitar-restablecimiento',
        { email: resetEmail },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      Alert.alert('Código reenviado', 'Se ha enviado un nuevo código a tu correo.');
    } catch (error) {
      console.error("Error al reenviar código:", error);
      Alert.alert('Error', 'No se pudo reenviar el código. Intenta nuevamente.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep(1);
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
  };

  const isMobile = width < 800;

  const renderResetModalContent = () => {
    switch (resetStep) {
      case 1:
        return (
          <>
            <Text style={styles.modalTitle}>Restablecer contraseña</Text>
            <Text style={styles.modalText}>
              Ingresa tu correo electrónico para recibir un código de verificación
            </Text>
            <TextInput
              style={[styles.input, styles.modalInput]}
              placeholder="Correo electrónico"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!resetLoading}
            />
            <TouchableOpacity
              style={[styles.button, styles.modalButton, resetLoading && { opacity: 0.5 }]}
              onPress={handleResetRequest}
              disabled={resetLoading}
            >
              <Text style={styles.buttonText}>
                {resetLoading ? 'Enviando...' : 'Enviar código'}
              </Text>
            </TouchableOpacity>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.modalTitle}>Verificar código</Text>
            <Text style={styles.modalText}>
              Ingresa el código de 6 dígitos enviado a {resetEmail}
            </Text>
            <TextInput
              style={[styles.input, styles.modalInput]}
              placeholder="Código de verificación"
              value={resetCode}
              onChangeText={setResetCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!resetLoading}
            />
            <TouchableOpacity
              style={[styles.button, styles.modalButton, resetLoading && { opacity: 0.5 }]}
              onPress={handleVerifyResetCode}
              disabled={resetLoading}
            >
              <Text style={styles.buttonText}>
                {resetLoading ? 'Verificando...' : 'Verificar código'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resendResetCode}
              disabled={resetLoading}
            >
              <Text style={styles.modalLink}>
                ¿No recibiste el código? Reenviar
              </Text>
            </TouchableOpacity>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.modalTitle}>Nueva contraseña</Text>
            <Text style={styles.modalText}>
              Ingresa tu nueva contraseña
            </Text>
            <TextInput
              style={[styles.input, styles.modalInput]}
              placeholder="Nueva contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              editable={!resetLoading}
            />
            <TouchableOpacity
              style={[styles.button, styles.modalButton, resetLoading && { opacity: 0.5 }]}
              onPress={handlePasswordReset}
              disabled={resetLoading}
            >
              <Text style={styles.buttonText}>
                {resetLoading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Text>
            </TouchableOpacity>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text style={styles.title}>{step === 1 ? 'Registrarse' : 'Verificar Código'}</Text>

      {step === 1 ? (
        <>
          <TextInput
            style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
            placeholder="Nombre *"
            value={nombre}
            onChangeText={handleNombreChange}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
            placeholder="Apellido"
            value={apellido}
            onChangeText={handleApellidoChange}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
            placeholder="Correo electrónico *"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
            placeholder="Contraseña *"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
            placeholder="Teléfono"
            value={telefono}
            onChangeText={handleTelefonoChange}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <TextInput
            style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
            placeholder="Dirección"
            value={direccion}
            onChangeText={setDireccion}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.button,
              {
                width: isMobile ? '80%' : '15%',
                padding: isMobile ? 15 : 12,
                opacity: loading ? 0.5 : 1
              }
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { fontSize: isMobile ? 18 : 16 }]}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setShowResetModal(true);
            setResetEmail(email);
          }}>
            <Text style={[styles.link, { marginTop: 10 }]}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.verificationText}>
            Ingresa el código de 6 dígitos que enviamos a {pendingEmail}
          </Text>

          <TextInput
            style={[styles.input, { width: isMobile ? '80%' : '30%', fontSize: isMobile ? 16 : 14 }]}
            placeholder="Código de verificación"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.button,
              {
                width: isMobile ? '80%' : '15%',
                padding: isMobile ? 15 : 12,
                opacity: loading ? 0.5 : 1
              }
            ]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { fontSize: isMobile ? 18 : 16 }]}>
              {loading ? 'Verificando...' : 'Verificar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resendCode}
            disabled={loading}
          >
            <Text style={[styles.link, { marginTop: 10 }]}>
              ¿No recibiste el código? Reenviar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStep(1)}
            disabled={loading}
          >
            <Text style={[styles.link, { marginTop: 5 }]}>
              Volver al registro
            </Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showResetModal}
        onRequestClose={closeResetModal}
      >
        <View style={styles.centeredView}>
          <View style={[
            styles.modalView,
            { width: isMobile ? '90%' : '50%' }
          ]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeResetModal}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {renderResetModalContent()}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  verificationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    width: '80%',
    color: '#555',
  },
  input: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 10,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#555',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 5,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    width: '90%',
    marginVertical: 10,
  },
  modalButton: {
    width: '90%',
    padding: 12,
  },
  modalLink: {
    marginTop: 15,
    color: '#3498db',
    textDecorationLine: 'underline',
  },
});

export default Register;