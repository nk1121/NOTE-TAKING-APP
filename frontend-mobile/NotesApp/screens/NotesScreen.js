import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, useAuth } from '../context'; // Updated import
import BASE_URL from '../config';

const NotesScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { setIsAuthenticated } = useAuth();
  const [notes, setNotes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState(route.params?.view || 'all');
  const selectedTag = route.params?.tag;

  useEffect(() => {
    const initializeNotes = async () => {
      try {
        await fetchNotes();
        const storedFavorites = JSON.parse(await AsyncStorage.getItem('favorites')) || [];
        setFavorites(storedFavorites);
      } catch (error) {
        console.error('Error initializing notes:', error);
      }
    };

    initializeNotes();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 15 }}>
          <FontAwesome name="bars" size={24} color={theme === 'light' ? '#000' : '#fff'} />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: theme === 'light' ? '#fff' : '#212529',
      },
      headerTintColor: theme === 'light' ? '#000' : '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation, theme]);

  const fetchNotes = async () => {
    try {
      if (!BASE_URL) {
        throw new Error('BASE_URL is not defined. Please check config.js.');
      }
      const token = await AsyncStorage.getItem('token');
      console.log('Token:', token);
      const response = await fetch(`${BASE_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Server returned non-JSON response: ${responseText}`);
        }
        if (errorData.error === 'Invalid token') {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('username');
          setIsAuthenticated(false);
          return;
        }
        throw new Error(errorData.error || `Failed to fetch notes (Status: ${response.status})`);
      }

      const data = JSON.parse(responseText);
      const updatedData = data.map(note => ({
        ...note,
        tags: note.tags ? note.tags.map(tag => tag.toUpperCase()) : [],
      }));
      setNotes(updatedData);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!BASE_URL) {
        throw new Error('BASE_URL is not defined. Please check config.js.');
      }
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();
      console.log('Raw response (handleDelete):', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Server returned non-JSON response: ${responseText}`);
        }
        if (errorData.error === 'Invalid token') {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('username');
          setIsAuthenticated(false);
          return;
        }
        throw new Error(errorData.error || `Failed to delete note (Status: ${response.status})`);
      }

      setFavorites(favorites.filter((favId) => favId !== id));
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites.filter((favId) => favId !== id)));
      await fetchNotes();
      Alert.alert('Success', 'Note deleted successfully');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const toggleFavorite = async (id) => {
    let updatedFavorites;
    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter((favId) => favId !== id);
    } else {
      updatedFavorites = [...favorites, id];
    }
    setFavorites(updatedFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const getTimeDifference = (updatedAt) => {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffInMs = now - updated;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'TODAY';
    if (diffInDays === 1) return '1 DAY AGO';
    return `${diffInDays} DAYS AGO`;
  };

  let displayedNotes = notes;
  if (currentView === 'favorites') {
    displayedNotes = notes.filter((note) => favorites.includes(note.id));
  } else if (currentView === 'recent') {
    displayedNotes = [...notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  } else if (currentView === 'tags' && selectedTag) {
    displayedNotes = notes.filter((note) => note.tags && note.tags.includes(selectedTag));
  }
  if (searchQuery) {
    displayedNotes = displayedNotes.filter((note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const renderNote = ({ item }) => (
    <TouchableOpacity
      style={styles.noteCard}
      onPress={() => navigation.navigate('NoteEditor', { note: item })}
    >
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>
      <View style={styles.noteFooter}>
        <Text style={styles.timestamp}>{getTimeDifference(item.updated_at)}</Text>
      </View>
      <View style={styles.noteActions}>
        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
          <FontAwesome name={favorites.includes(item.id) ? 'star' : 'star-o'} size={20} color="#FFD700" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 10 }}>
          <FontAwesome name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f0f0f0' : '#212529' }]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme === 'light' ? '#e0e0e0' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
          placeholder="Search notes..."
          placeholderTextColor={theme === 'light' ? '#888' : '#adb5bd'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FontAwesome
          name="search"
          size={20}
          color={theme === 'light' ? '#888' : '#adb5bd'}
          style={styles.searchIcon}
        />
      </View>
      <Text style={[styles.header, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>
        {currentView === 'favorites' ? 'Favorite Notes' : currentView === 'recent' ? 'Recent Notes' : currentView === 'tags' ? `Notes tagged with "${selectedTag}"` : 'All Notes'}
      </Text>
      <FlatList
        data={displayedNotes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa', textAlign: 'center', marginTop: 20 }}>No notes found.</Text>}
        contentContainerStyle={styles.notesList}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NoteEditor', { note: null })}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  searchContainer: {
    position: 'relative',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    paddingLeft: 15,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginBottom: 10,
  },
  notesList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
});

export default NotesScreen;