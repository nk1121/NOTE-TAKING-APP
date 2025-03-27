import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, useAuth } from '../context';
import BASE_URL from '../config';

const ProfileScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { setIsAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchProfile();
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 15 }}>
          <FontAwesome name="bars" size={24} color={theme === 'light' ? '#000' : '#fff'} />
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: theme === 'light' ? '#fff' : '#212529' },
      headerTintColor: theme === 'light' ? '#000' : '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    });
  }, [navigation, theme]);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Invalid token') {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('username');
          setIsAuthenticated(false);
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      const data = await response.json();
      setProfile(data);
      setEmail(data.email);
      setUsername(data.username);
      setName(data.name || '');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setShowChangePassword(false);
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, username, name }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      setIsEditing(false);
      fetchProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSubmitChangePassword = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteAccount = () => {
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
              const response = await fetch(`${BASE_URL}/delete-account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete account');
              }
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('username');
              setIsAuthenticated(false);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowChangePassword(false);
    setEmail(profile.email);
    setUsername(profile.username);
    setName(profile.name || '');
    setCurrentPassword('');
    setNewPassword('');
  };

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f0f0f0' : '#212529' }]}>
        <Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f0f0f0' : '#212529' }]}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleEditProfile}>
          <FontAwesome name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarButton} onPress={handleChangePassword}>
          <FontAwesome name="lock" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolbarButton, { backgroundColor: '#dc3545' }]} onPress={handleDeleteAccount}>
          <FontAwesome name="trash" size={20} color="#fff" />
        </TouchableOpacity>
        {isEditing && (
          <>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleSaveChanges}>
              <FontAwesome name="save" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleCancel}>
              <FontAwesome name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
      <View style={[styles.card, { backgroundColor: theme === 'light' ? '#fff' : '#343a40' }]}>
        {showChangePassword ? (
          <>
            <Text style={[styles.label, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Current Password:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <Text style={[styles.label, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>New Password:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleSubmitChangePassword}>
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: '#6c757d' }]} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Email:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
            />
            <Text style={[styles.label, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Username:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
              value={username}
              onChangeText={setUsername}
              editable={isEditing}
            />
            <Text style={[styles.label, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>Name:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
              value={name}
              onChangeText={setName}
              editable={isEditing}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#2c3e50', padding: 10, borderRadius: 5, marginBottom: 10 },
  toolbarButton: { padding: 10, backgroundColor: '#007bff', borderRadius: 5 },
  card: { padding: 20, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10, fontSize: 16 },
  button: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16 },
});

export default ProfileScreen;