import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../App';
import { API_BASE_URL } from '../constants';

const ChangePasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState(false);

  const handleChangePassword = async () => {
    setCurrentPasswordError(false);
    setNewPasswordError(false);

    if (!currentPassword) setCurrentPasswordError(true);
    if (!newPassword) setNewPasswordError(true);
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'Current password is incorrect') {
          setCurrentPasswordError(true);
        }
        throw new Error(data.error || 'Failed to change password');
      }

      Alert.alert('Success', 'Password changed successfully! Redirecting...', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f8f9fa' : '#212529' }]}>
      <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Change Password</Text>
      <TextInput
        style={[styles.input, currentPasswordError && styles.inputError, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
        placeholder="Current Password"
        placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      <TextInput
        style={[styles.input, newPasswordError && styles.inputError, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
        placeholder="New Password"
        placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <Button title="Change Password" onPress={handleChangePassword} />
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

export default ChangePasswordScreen;