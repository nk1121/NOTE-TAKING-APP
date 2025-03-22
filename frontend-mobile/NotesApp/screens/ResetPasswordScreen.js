import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../App';
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../constants';

const ResetPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const route = useRoute();
  const token = route.params?.token;
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState(false);

  useEffect(() => {
    if (!token) {
      Alert.alert('Error', 'Invalid or missing token. Please request a new reset link.');
    }
  }, [token]);

  const handleResetPassword = async () => {
    setNewPasswordError(false);

    if (!newPassword) {
      setNewPasswordError(true);
      Alert.alert('Error', 'Please enter a new password.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      Alert.alert('Success', 'Password reset successfully! Redirecting to login...', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f8f9fa' : '#212529' }]}>
      <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Reset Password</Text>
      <TextInput
        style={[styles.input, newPasswordError && styles.inputError, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
        placeholder="New Password"
        placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <Button title="Reset Password" onPress={handleResetPassword} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  inputError: {
    borderColor: 'red',
  },
});

export default ResetPasswordScreen;