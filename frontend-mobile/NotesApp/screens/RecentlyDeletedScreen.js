import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, useAuth } from '../context';
import BASE_URL from '../config';

const RecentlyDeletedScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { setIsAuthenticated } = useAuth();
  const [deletedNotes, setDeletedNotes] = useState([]);

  useEffect(() => {
    fetchDeletedNotes();
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

  const fetchDeletedNotes = async () => {
    try {
      const storedDeletedNotes = JSON.parse(await AsyncStorage.getItem('deletedNotes')) || [];
      setDeletedNotes(storedDeletedNotes);
    } catch (error) {
      console.error('Error fetching deleted notes:', error);
    }
  };

  const handlePermanentDelete = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/notes/${id}`, {
        method: 'DELETE',
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
        throw new Error(errorData.error || 'Failed to permanently delete note');
      }

      const updatedDeletedNotes = deletedNotes.filter((note) => note.id !== id);
      setDeletedNotes(updatedDeletedNotes);
      await AsyncStorage.setItem('deletedNotes', JSON.stringify(updatedDeletedNotes));
      Alert.alert('Success', 'Note permanently deleted');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderDeletedNote = ({ item }) => (
    <View style={styles.noteCard}>
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>
      <View style={styles.noteActions}>
        <TouchableOpacity onPress={() => handlePermanentDelete(item.id)}>
          <FontAwesome name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f0f0f0' : '#212529' }]}>
      <Text style={[styles.header, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>
        Recently Deleted
      </Text>
      <FlatList
        data={deletedNotes}
        renderItem={renderDeletedNote}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa', textAlign: 'center', marginTop: 20 }}>No deleted notes.</Text>}
        contentContainerStyle={styles.notesList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 15, marginTop: 15, marginBottom: 10 },
  notesList: { paddingHorizontal: 15, paddingBottom: 20 },
  noteCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  noteTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 5 },
  noteContent: { fontSize: 14, color: '#666', marginBottom: 10 },
  noteActions: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
});

export default RecentlyDeletedScreen;