import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../context";
import * as Speech from "expo-speech";

const NoteEditorScreen = ({ route, navigation }) => {
  const { note } = route.params || {};
  const { theme } = useTheme();
  const [title, setTitle] = useState(note ? note.title : "");
  const [content, setContent] = useState(note ? note.content : "");
  const [tags, setTags] = useState(note ? note.tags || [] : []);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cleanContentForSpeech = (text) => text.replace(/<[^>]+>/g, "");

  useEffect(() => {
    Speech.getAvailableVoicesAsync().then((voices) =>
      console.log("Available voices:", voices)
    );
    return () => Speech.stop();
  }, []);

  const handleTextToSpeech = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else if (content) {
      const cleanText = cleanContentForSpeech(content);
      setIsSpeaking(true);
      await Speech.speak(cleanText, {
        language: "en",
        pitch: 1.0,
        rate: 1.0,
        onDone: () => setIsSpeaking(false),
        onError: (error) => {
          setIsSpeaking(false);
          Alert.alert("Error", "Failed to play speech: " + error.message);
        },
      });
    } else {
      Alert.alert("No Content", "Please add some content to read aloud.");
    }
  };

  const handleSaveNote = async () => {
    if (!title || !content) {
      setError("Please fill in both title and content.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      const method = note ? "PUT" : "POST";
      const url = note
        ? `http://172.19.139.223:5000/notes/${note.id}`
        : "http://172.19.139.223:5000/notes";
      const uppercaseTags = tags.map((tag) => tag.toUpperCase());
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, tags: uppercaseTags }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            (note ? "Failed to update note" : "Failed to create note")
        );
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTagInputKeyPress = (text) => {
    setTagInput(text.toUpperCase());
    if (text.includes(",") || text.includes(" ")) {
      const newTag = text.replace(/[, ]/g, "").trim();
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) =>
    setTags(tags.filter((tag) => tag !== tagToRemove));

  const applyFormatting = (tag) => {
    const selectionStart = content.length; // Simplified: assumes end of text
    const newContent = `${content}<${tag}>${content.slice(
      selectionStart
    )}</${tag}>`;
    setContent(newContent);
  };

  const applyAlignment = (align) => {
    const newContent = `<p style="text-align: ${align}">${content}</p>`;
    setContent(newContent);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme === "light" ? "#f8f9fa" : "#212529" },
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: theme === "light" ? "#fff" : "#343a40" },
        ]}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme === "light" ? "#fff" : "#495057",
              color: theme === "light" ? "#000" : "#f8f9fa",
            },
          ]}
          placeholder="Note Title"
          placeholderTextColor={theme === "light" ? "#adb5bd" : "#adb5bd"}
          value={title}
          onChangeText={setTitle}
        />
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => applyFormatting("b")}>
            <FontAwesome name="bold" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => applyFormatting("i")}>
            <FontAwesome name="italic" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => applyFormatting("u")}>
            <FontAwesome name="underline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => applyAlignment("left")}>
            <FontAwesome name="align-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => applyAlignment("center")}>
            <FontAwesome name="align-center" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => applyAlignment("right")}>
            <FontAwesome name="align-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme === "light" ? "#fff" : "#495057",
              color: theme === "light" ? "#000" : "#f8f9fa",
            },
          ]}
          placeholder="Write your note here..."
          placeholderTextColor={theme === "light" ? "#adb5bd" : "#adb5bd"}
          value={content}
          onChangeText={setContent}
          multiline
        />
        <TouchableOpacity
          style={styles.speechButton}
          onPress={handleTextToSpeech}
        >
          <FontAwesome
            name={isSpeaking ? "stop" : "play"}
            size={20}
            color="#fff"
          />
          <Text style={styles.buttonText}>
            {isSpeaking ? "Stop Speech" : "Read Aloud"}
          </Text>
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
            style={[
              styles.tagInput,
              {
                backgroundColor: theme === "light" ? "#fff" : "#495057",
                color: theme === "light" ? "#000" : "#f8f9fa",
              },
            ]}
            placeholder="Add tags (separate with commas or spaces)..."
            placeholderTextColor={theme === "light" ? "#adb5bd" : "#adb5bd"}
            value={tagInput}
            onChangeText={handleTagInputKeyPress}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSaveNote}>
          <Text style={styles.buttonText}>
            {note ? "Update Note" : "Save Note"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: {
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  toolbar: {
    flexDirection: "row",
    backgroundColor: "#2c3e50",
    padding: 5,
    borderRadius: 5,
    justifyContent: "space-around",
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    height: 200,
    textAlignVertical: "top",
  },
  speechButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  tagsContainer: { marginBottom: 10 },
  tag: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderRadius: 5,
    padding: 5,
    marginRight: 5,
    marginBottom: 5,
  },
  tagText: { color: "#fff", fontSize: 14 },
  tagRemove: { color: "red", marginLeft: 5 },
  tagInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, marginLeft: 5 },
  error: { color: "red", textAlign: "center", marginBottom: 10 },
});

export default NoteEditorScreen;
