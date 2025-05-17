import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context'; // Import useAuth
import BASE_URL from '../config';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setIsAuthenticated } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
  
    try {
      if (!BASE_URL) {
        throw new Error('BASE_URL is not defined. Please check config.js.');
      }
  
      console.log("Starting login request...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
  
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
      console.log("Login response received:", response.status);
  
      const responseText = await response.text();
      console.log('Raw response (handleLogin):', responseText);
  
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Server returned non-JSON response: ${responseText}`);
        }
        throw new Error(errorData.error || `Login failed (Status: ${response.status})`);
      }
  
      const data = JSON.parse(responseText);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('username', data.username);
      setIsAuthenticated(true);
      console.log("Login successful");
    } catch (err) {
      if (err.name === "AbortError") {
        Alert.alert('Error', 'Request timed out. Please check your network or try again later.');
      } else {
        Alert.alert('Error', err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007bff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default LoginScreen;