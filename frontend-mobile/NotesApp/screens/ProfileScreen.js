import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useTheme } from '../App';

const ProfileScreen = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigation = useNavigation();
  const { setIsAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://172.19.139.223:5000/profile', {
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
      setError(err.message);
    }
  };

  const handleUpdateProfile = async () => {
    setError('');
    setSuccess('');

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://172.19.139.223:5000/profile', {
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
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
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
              const response = await fetch('http://172.19.139.223:5000/delete-account', {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) throw new Error('Failed to delete account');

              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('username');
              setIsAuthenticated(false);
            } catch (err) {
              setError(err.message);
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
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'light' ? '#f8f9fa' : '#212529' }]}>
      <View style={[styles.card, { backgroundColor: theme === 'light' ? '#fff' : '#343a40' }]}>
        <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Profile</Text>
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarItem} onPress={() => setIsEditing(!isEditing)}>
            <FontAwesome name="edit" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarItem} onPress={toggleTheme}>
            <FontAwesome name={theme === 'light' ? 'moon-o' : 'sun-o'} size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarItem} onPress={() => navigation.navigate('ChangePassword')}>
            <FontAwesome name="lock" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toolbarItem, styles.danger]} onPress={handleDeleteAccount}>
            <FontAwesome name="trash" size={20} color="red" />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        {isEditing ? (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
              placeholder="Email"
              placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
              placeholder="Username"
              placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
              placeholder="Name"
              placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.info, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Email: {email}</Text>
            <Text style={[styles.info, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Username: {username}</Text>
            <Text style={[styles.info, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Name: {name || 'Not set'}</Text>
          </>
        )}
        <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    borderRadius: 5,
    padding: 5,
    marginBottom: 20,
  },
  toolbarItem: {
    padding: 10,
    marginRight: 5,
  },
  danger: {
    backgroundColor: '#ff6b6b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default ProfileScreen;