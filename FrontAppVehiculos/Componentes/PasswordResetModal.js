import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, StyleSheet, Alert } from 'react-native';
import api from './api';

const PasswordResetModal = ({ visible, onClose, userEmail = '' }) => {
  const [email, setEmail] = useState(userEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/solicitar-restablecimiento', { email });
      Alert.alert('Éxito', 'Código enviado a tu correo electrónico');
      setStep(2);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verificar-restablecimiento', {
        email,
        codigo: code,
        nuevaPassword: newPassword,
        confirmarPassword: confirmPassword
      });
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      onClose();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Restablecer contraseña</Text>

          {step === 1 ? (
            <>
              <Text style={styles.modalText}>Ingresa tu correo electrónico para recibir un código de verificación</Text>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Enviando...' : 'Enviar código'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.modalText}>Ingresa el código recibido y tu nueva contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Código de verificación"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Nueva contraseña"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setStep(1)}
                >
                  <Text style={styles.buttonText}>Atrás</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Procesando...' : 'Cambiar contraseña'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    color: '#555',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  confirmButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PasswordResetModal;