import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, useAuth } from '../App';
import { API_BASE_URL } from '../constants';

const ProfileScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useTheme();
  const { setIsAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setEmail(data.email);
      setUsername(data.username);
      setName(data.name || '');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, username, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      await AsyncStorage.setItem('username', data.username);
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_BASE_URL}/delete-account`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) throw new Error('Failed to delete account');

              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('username');
              setIsAuthenticated(false);
              navigation.navigate('Login');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('username');
    setIsAuthenticated(false);
    navigation.navigate('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f8f9fa' : '#212529' }]}>
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <FontAwesome name="edit" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 10 }}>
          <FontAwesome name="sign-out" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme} style={{ marginLeft: 10 }}>
          <FontAwesome name={theme === 'light' ? 'moon-o' : 'sun-o'} size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteAccount} style={{ marginLeft: 10 }}>
          <FontAwesome name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
      {isEditing ? (
        <View>
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <Button title="Save Changes" onPress={handleUpdateProfile} />
        </View>
      ) : (
        <View>
          <Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa' }}><Text style={styles.label}>Email:</Text> {email}</Text>
          <Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa' }}><Text style={styles.label}>Username:</Text> {username}</Text>
          <Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa' }}><Text style={styles.label}>Name:</Text> {name || 'Not set'}</Text>
        </View>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('ChangePassword')}>
        <Text style={styles.link}>Change Password</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  label: {
    fontWeight: 'bold',
  },
  link: {
    marginTop: 10,
    color: 'blue',
    textAlign: 'center',
  },
});

export default ProfileScreen;