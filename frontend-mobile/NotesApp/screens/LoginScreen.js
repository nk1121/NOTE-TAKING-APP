import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../App';
import { API_BASE_URL } from '../constants';

const LoginScreen = ({ navigation }) => {
  const { setIsAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  const handleSubmit = async () => {
    setEmailError(false);
    setUsernameError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);

    if (!email) setEmailError(true);
    if (!isLogin && !username) setUsernameError(true);
    if (!password) setPasswordError(true);
    if (!isLogin && !confirmPassword) setConfirmPasswordError(true);

    if (!email || (!isLogin && !username) || !password || (!isLogin && !confirmPassword)) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (!isLogin && username.length > 10) {
      setUsernameError(true);
      Alert.alert('Error', 'Username must be 10 characters or less.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setPasswordError(true);
      setConfirmPasswordError(true);
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const body = isLogin
        ? { email, password }
        : { email, username, password, name, profile_picture: profilePicture, bio };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Email already exists') setEmailError(true);
        if (data.error === 'Username already exists') setUsernameError(true);
        if (data.error === 'Invalid email or password') {
          setEmailError(true);
          setPasswordError(true);
        }
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('username', data.username);
        setIsAuthenticated(true);
        navigation.navigate('Drawer');
      } else {
        Alert.alert('Success', 'Registration successful. Please log in.');
        setIsLogin(true);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login to NoteApp' : 'Sign Up for NoteApp'}</Text>
      <TextInput
        style={[styles.input, emailError && styles.inputError]}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      {!isLogin && (
        <>
          <TextInput
            style={[styles.input, usernameError && styles.inputError]}
            placeholder="Username (max 10 characters) *"
            value={username}
            onChangeText={setUsername}
            maxLength={10}
          />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Profile Picture URL"
            value={profilePicture}
            onChangeText={setProfilePicture}
          />
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
          />
        </>
      )}
      <TextInput
        style={[styles.input, passwordError && styles.inputError]}
        placeholder="Password *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {!isLogin && (
        <TextInput
          style={[styles.input, confirmPasswordError && styles.inputError]}
          placeholder="Confirm Password *"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      )}
      <Button title={isLogin ? 'Login' : 'Sign Up'} onPress={handleSubmit} />
      {isLogin && (
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.link}>
          {isLogin ? 'Don’t have an account? Sign Up' : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
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
  link: {
    marginTop: 10,
    color: 'blue',
    textAlign: 'center',
  },
});

export default LoginScreen;