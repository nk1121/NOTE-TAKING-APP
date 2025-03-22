import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../App';
import { API_BASE_URL } from '../constants';

const ForgotPasswordScreen = () => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);

  const handleForgotPassword = async () => {
    setEmailError(false);

    if (!email) {
      setEmailError(true);
      Alert.alert('Error', 'Please enter your email.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'User not found') {
          setEmailError(true);
        }
        throw new Error(data.error || 'Failed to send reset email');
      }

      Alert.alert('Success', 'Password reset link sent to your email. Please check your inbox.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f8f9fa' : '#212529' }]}>
      <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Forgot Password</Text>
      <TextInput
        style={[styles.input, emailError && styles.inputError, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
        placeholder="Enter your email"
        placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Button title="Send Reset Link" onPress={handleForgotPassword} />
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

export default ForgotPasswordScreen;