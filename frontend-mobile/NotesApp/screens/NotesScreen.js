import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, useView } from '../App';
import { API_BASE_URL } from '../constants';

const NotesScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { currentView, setCurrentView } = useView();
  const [notes, setNotes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [isTagsExpanded, setIsTagsExpanded] = useState(true);

  useEffect(() => {
    if (route.params?.view) {
      setCurrentView(route.params.view);
    }
    fetchNotes();
    const loadFavorites = async () => {
      const storedFavorites = JSON.parse(await AsyncStorage.getItem('favorites')) || [];
      setFavorites(storedFavorites);
    };
    loadFavorites();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notes');
      }

      const data = await response.json();
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
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
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

  const allTags = [...new Set(notes.flatMap((note) => note.tags || []))];

  let displayedNotes = notes;
  if (currentView === 'favorites') {
    displayedNotes = notes.filter((note) => favorites.includes(note.id));
  } else if (currentView === 'recent') {
    displayedNotes = [...notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  if (selectedTag) {
    displayedNotes = displayedNotes.filter((note) => (note.tags || []).includes(selectedTag));
  }
  if (searchQuery) {
    displayedNotes = displayedNotes.filter((note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const renderNote = ({ item }) => (
    <View style={[styles.noteCard, { backgroundColor: theme === 'light' ? '#fff' : '#343a40' }]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('NoteEditor', { note: item })}
      >
        <Text style={[styles.noteTitle, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>{item.title}</Text>
        <Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa' }} numberOfLines={2}>{item.content}</Text>
        <Text style={[styles.tags, { color: theme === 'light' ? '#666' : '#adb5bd' }]}>Tags: {item.tags?.join(', ') || 'None'}</Text>
        <Text style={{ color: theme === 'light' ? '#666' : '#adb5bd' }}>
          Last updated: {new Date(item.updated_at).toLocaleString()}
        </Text>
      </TouchableOpacity>
      <View style={styles.noteActions}>
        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
          <FontAwesome name={favorites.includes(item.id) ? 'star' : 'star-o'} size={20} color="#FFD700" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 10 }}>
          <FontAwesome name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f8f9fa' : '#212529' }]}>
      {currentView === 'write' ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NoteEditor', { note: null })}
        >
          <FontAwesome name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>Write Note</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme === 'light' ? '#343a40' : '#495057', color: theme === 'light' ? '#f8f9fa' : '#f8f9fa' }]}
            placeholder="Search notes..."
            placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Text style={[styles.header, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>
            {currentView === 'favorites' ? 'Favorite Notes' : currentView === 'recent' ? 'Recent Notes' : selectedTag ? `Notes tagged with "${selectedTag}"` : 'All Notes'}
          </Text>
          {allTags.length > 0 && (
            <View>
              <TouchableOpacity onPress={() => setIsTagsExpanded(!isTagsExpanded)}>
                <Text style={[styles.tagsHeader, { color: theme === 'light' ? '#000' : '#f8f9fa' }]}>
                  Tags {isTagsExpanded ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {isTagsExpanded && allTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagItem, selectedTag === tag && styles.activeTagItem]}
                  onPress={() => {
                    setSelectedTag(tag);
                    setCurrentView('all');
                  }}
                >
                  <Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa' }}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <FlatList
            data={displayedNotes}
            renderItem={renderNote}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<Text style={{ color: theme === 'light' ? '#000' : '#f8f9fa' }}>No notes found.</Text>}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchInput: {
    borderRadius: 20,
    paddingLeft: 30,
    padding: 10,
    marginBottom: 20,
  },
  noteCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tags: {
    marginTop: 5,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  tagsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tagItem: {
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
  },
  activeTagItem: {
    backgroundColor: '#34495e',
  },
});

export default NotesScreen;