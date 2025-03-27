import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../context';
import * as Speech from 'expo-speech';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { ColorPicker } from 'react-native-color-picker';
import * as ImagePicker from 'expo-image-picker';

const NoteEditorScreen = ({ route, navigation }) => {
  const { note } = route.params || {};
  const { theme } = useTheme();
  const richText = useRef();
  const [title, setTitle] = useState(note ? note.title : '');
  const [content, setContent] = useState(note ? note.content : '');
  const [tags, setTags] = useState(note ? note.tags || [] : []);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(null); // 'text' or 'background'
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');

  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32];
  const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

  useEffect(() => {
    Speech.getAvailableVoicesAsync().then(voices => console.log('Available voices:', voices));
    return () => Speech.stop();
  }, []);

  const cleanContentForSpeech = (text) => text.replace(/<[^>]+>/g, '');

  const handleTextToSpeech = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else if (content) {
      const cleanText = cleanContentForSpeech(content);
      setIsSpeaking(true);
      await Speech.speak(cleanText, {
        language: 'en',
        pitch: 1.0,
        rate: 1.0,
        onDone: () => setIsSpeaking(false),
        onError: (error) => {
          setIsSpeaking(false);
          Alert.alert('Error', 'Failed to play speech: ' + error.message);
        },
      });
    } else {
      Alert.alert('No Content', 'Please add some content to read aloud.');
    }
  };

  const handleSaveNote = async () => {
    if (!title || !content) {
      setError('Please fill in both title and content.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      const method = note ? 'PUT' : 'POST';
      const url = note ? `http://172.19.139.223:5000/notes/${note.id}` : 'http://172.19.139.223:5000/notes';
      const uppercaseTags = tags.map(tag => tag.toUpperCase());
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, tags: uppercaseTags }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (note ? 'Failed to update note' : 'Failed to create note'));
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTagInputKeyPress = (text) => {
    setTagInput(text.toUpperCase());
    if (text.includes(',') || text.includes(' ')) {
      const newTag = text.replace(/[, ]/g, '').trim();
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => setTags(tags.filter(tag => tag !== tagToRemove));

  const handleInsertImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
    });

    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      richText.current?.insertImage(base64Image);
    }
  };

  const handleInsertLink = () => {
    Alert.prompt(
      'Insert Link',
      'Enter the URL:',
      (url) => {
        if (url) {
          richText.current?.insertLink(url, url);
        }
      }
    );
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    richText.current?.setFontSize(size);
  };

  const handleFontFamilyChange = (family) => {
    setFontFamily(family);
    richText.current?.setFontName(family);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme === 'light' ? '#f8f9fa' : '#212529' }]}>
      <View style={[styles.card, { backgroundColor: theme === 'light' ? '#fff' : '#343a40' }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={[styles.input, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
          placeholder="Note Title"
          placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
          value={title}
          onChangeText={setTitle}
        />
        <RichToolbar
          editor={richText}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            'textColor',
            'backgroundColor',
            'fontSize',
            'fontFamily',
            actions.heading1,
            actions.heading2,
            actions.setBlockquote,
            actions.code,
            actions.insertOrderedList,
            actions.insertBulletedList,
            actions.alignLeft,
            actions.alignCenter,
            actions.alignRight,
            actions.alignFull,
            actions.setIndent,
            actions.setOutdent,
            'insertLink',
            'insertImage',
            actions.removeFormat,
          ]}
          iconMap={{
            [actions.setBold]: ({ tint }) => <FontAwesome name="bold" size={20} color={tint} />,
            [actions.setItalic]: ({ tint }) => <FontAwesome name="italic" size={20} color={tint} />,
            [actions.setUnderline]: ({ tint }) => <FontAwesome name="underline" size={20} color={tint} />,
            textColor: ({ tint }) => <FontAwesome name="paint-brush" size={20} color={tint} />,
            backgroundColor: ({ tint }) => <FontAwesome name="square" size={20} color={tint} />,
            fontSize: ({ tint }) => <FontAwesome name="text-height" size={20} color={tint} />,
            fontFamily: ({ tint }) => <FontAwesome name="font" size={20} color={tint} />,
            [actions.heading1]: ({ tint }) => <Text style={{ color: tint }}>H1</Text>,
            [actions.heading2]: ({ tint }) => <Text style={{ color: tint }}>H2</Text>,
            [actions.setBlockquote]: ({ tint }) => <FontAwesome name="quote-left" size={20} color={tint} />,
            [actions.code]: ({ tint }) => <FontAwesome name="code" size={20} color={tint} />,
            [actions.insertOrderedList]: ({ tint }) => <FontAwesome name="list-ol" size={20} color={tint} />,
            [actions.insertBulletedList]: ({ tint }) => <FontAwesome name="list-ul" size={20} color={tint} />,
            [actions.alignLeft]: ({ tint }) => <FontAwesome name="align-left" size={20} color={tint} />,
            [actions.alignCenter]: ({ tint }) => <FontAwesome name="align-center" size={20} color={tint} />,
            [actions.alignRight]: ({ tint }) => <FontAwesome name="align-right" size={20} color={tint} />,
            [actions.alignFull]: ({ tint }) => <FontAwesome name="align-justify" size={20} color={tint} />,
            [actions.setIndent]: ({ tint }) => <FontAwesome name="indent" size={20} color={tint} />,
            [actions.setOutdent]: ({ tint }) => <FontAwesome name="outdent" size={20} color={tint} />,
            insertLink: ({ tint }) => <FontAwesome name="link" size={20} color={tint} />,
            insertImage: ({ tint }) => <FontAwesome name="image" size={20} color={tint} />,
            [actions.removeFormat]: ({ tint }) => <FontAwesome name="eraser" size={20} color={tint} />,
          }}
          onPressAddImage={handleInsertImage}
          insertLink={handleInsertLink}
          textColor={() => setShowColorPicker('text')}
          backgroundColor={() => setShowColorPicker('background')}
          fontSize={() => {
            Alert.alert(
              'Select Font Size',
              '',
              fontSizes.map(size => ({
                text: size.toString(),
                onPress: () => handleFontSizeChange(size),
              }))
            );
          }}
          fontFamily={() => {
            Alert.alert(
              'Select Font Family',
              '',
              fontFamilies.map(family => ({
                text: family,
                onPress: () => handleFontFamilyChange(family),
              }))
            );
          }}
          style={[styles.toolbar, { backgroundColor: theme === 'light' ? '#2c3e50' : '#495057' }]}
          iconTint={theme === 'light' ? '#fff' : '#f8f9fa'}
        />
        {showColorPicker && (
          <View style={styles.colorPickerContainer}>
            <ColorPicker
              onColorSelected={(color) => {
                if (showColorPicker === 'text') {
                  richText.current?.setForeColor(color);
                } else {
                  richText.current?.setBackColor(color);
                }
                setShowColorPicker(null);
              }}
              style={{ flex: 1, height: 200 }}
            />
            <TouchableOpacity onPress={() => setShowColorPicker(null)} style={styles.closePicker}>
              <Text style={styles.closePickerText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
        <RichEditor
          ref={richText}
          initialContentHTML={content}
          onChange={(text) => setContent(text)}
          style={[styles.richEditor, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
          placeholder="Write your note here..."
          placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
        />
        <TouchableOpacity style={styles.speechButton} onPress={handleTextToSpeech}>
          <FontAwesome name={isSpeaking ? 'stop' : 'play'} size={20} color="#fff" />
          <Text style={styles.buttonText}>{isSpeaking ? 'Stop Speech' : 'Read Aloud'}</Text>
        </TouchableOpacity>
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(tag)}>
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TextInput
            style={[styles.tagInput, { backgroundColor: theme === 'light' ? '#fff' : '#495057', color: theme === 'light' ? '#000' : '#f8f9fa' }]}
            placeholder="Add tags (separate with commas or spaces)..."
            placeholderTextColor={theme === 'light' ? '#adb5bd' : '#adb5bd'}
            value={tagInput}
            onChangeText={handleTagInputKeyPress}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSaveNote}>
          <Text style={styles.buttonText}>{note ? 'Update Note' : 'Save Note'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { padding: 20, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10, fontSize: 16 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', padding: 5, borderRadius: 5, justifyContent: 'space-around', marginBottom: 10 },
  richEditor: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10, minHeight: 200 },
  colorPickerContainer: { marginBottom: 10, padding: 10, backgroundColor: '#fff', borderRadius: 5 },
  closePicker: { alignSelf: 'center', padding: 10, backgroundColor: '#007bff', borderRadius: 5, marginTop: 10 },
  closePickerText: { color: '#fff', fontSize: 16 },
  speechButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center' },
  tagsContainer: { marginBottom: 10 },
  tag: { flexDirection: 'row', backgroundColor: '#000', borderRadius: 5, padding: 5, marginRight: 5, marginBottom: 5 },
  tagText: { color: '#fff', fontSize: 14 },
  tagRemove: { color: 'red', marginLeft: 5 },
  tagInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10 },
  button: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, marginLeft: 5 },
  error: { color: 'red', textAlign: 'center', marginBottom: 10 },
});

export default NoteEditorScreen;