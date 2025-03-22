import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useTheme } from '../App';
import { API_BASE_URL } from '../constants';

const NoteEditorScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  const { note } = route.params || {};
  const [title, setTitle] = useState(note ? note.title : '');
  const [content, setContent] = useState(note ? note.content : '');
  const [tags, setTags] = useState(note ? note.tags : []);
  const [tagInput, setTagInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${title}. ${content}`;
    if (!textToSpeak.trim()) {
      Alert.alert('Error', 'No content to read aloud.');
      return;
    }

    Speech.speak(textToSpeak, {
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    setIsSpeaking(true);
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const method = note ? 'PUT' : 'POST';
      const url = note
        ? `${API_BASE_URL}/notes/${note.id}`
        : `${API_BASE_URL}/notes`;

      const uppercaseTags = tags.map(tag => tag.toUpperCase());
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, tags: uppercaseTags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }

      Alert.alert('Success', 'Note saved successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleTagInputKeyPress = (text) => {
    setTagInput(text.toUpperCase());
    if (text.includes(',') || text.includes(' ')) {
      const newTag = text.trim().replace(',', '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag.toUpperCase()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#f8f9fa' : '#212529' }]}>
      <TextInput
        style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
        placeholder="Title"
        placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.contentInput, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
        placeholder="Content"
        placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
        value={content}
        onChangeText={setContent}
        multiline
      />
      <View style={styles.tagsContainer}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={{ color: '#fff' }}>{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(tag)}>
              <Text style={styles.tagRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TextInput
        style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
        placeholder="Add tags (separate with commas or spaces)..."
        placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
        value={tagInput}
        onChangeText={handleTagInputKeyPress}
      />
      <View style={styles.buttonContainer}>
        <Button title="Save" onPress={handleSave} />
        <Button title={isSpeaking ? 'Stop' : 'Speak'} onPress={handleSpeak} color="#28a745" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  contentInput: {
    height: 150,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#000',
    borderRadius: 5,
    padding: 5,
    marginRight: 5,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagRemove: {
    color: 'red',
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default NoteEditorScreen;