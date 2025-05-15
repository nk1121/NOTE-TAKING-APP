import React, { useState, useEffect } from "react";
import { Alert, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import NotesScreen from "./screens/NotesScreen";
import NoteEditorScreen from "./screens/NoteEditorScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./screens/ResetPasswordScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import RecentlyDeletedScreen from "./screens/RecentlyDeletedScreen"; // Import new screen
import { AuthContext, ThemeContext } from "./context";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

const CustomDrawerContent = (props) => {
  const {
    state,
    navigation,
    notesCount,
    favoritesCount,
    deletedCount,
    setIsAuthenticated,
  } = props;
  const [username, setUsername] = useState("");
  const [tags, setTags] = useState([]);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);

  useEffect(() => {
    const fetchUsernameAndTags = async () => {
      const storedUsername = await AsyncStorage.getItem("username");
      setUsername(storedUsername || "User");
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch("http://172.19.139.223:5000/notes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const responseText = await response.text();
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            throw new Error(
              `Server returned non-JSON response: ${responseText}`
            );
          }
          throw new Error(errorData.error || "Failed to fetch notes");
        }
        const data = JSON.parse(responseText);
        const allTags = new Set();
        data.forEach((note) => {
          if (note.tags && Array.isArray(note.tags)) {
            note.tags.forEach((tag) => allTags.add(tag.toUpperCase()));
          }
        });
        setTags([...allTags]);
      } catch (error) {
        console.error("Error fetching tags:", error.message);
        if (error.message.includes("Invalid token")) {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("username");
          setIsAuthenticated(false);
        }
      }
    };
    fetchUsernameAndTags();
  }, [setIsAuthenticated]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("username");
      setIsAuthenticated(false);
    } catch (error) {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  const handleTagPress = (tag) => {
    navigation.navigate("Notes", { view: "tags", tag });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}
    >
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderText}>Pixel Notes</Text>
      </View>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Tags"
        labelStyle={styles.drawerHeaderLabel}
        style={styles.drawerHeaderItem}
        icon={() => (
          <FontAwesome
            name={isTagsExpanded ? "angle-down" : "angle-right"}
            size={20}
            color="#fff"
          />
        )}
        onPress={() => setIsTagsExpanded(!isTagsExpanded)}
        inactiveTintColor="#fff"
      />
      {isTagsExpanded && (
        <View style={styles.tagsContainer}>
          {tags.length > 0 ? (
            tags.map((tag) => (
              <DrawerItem
                key={tag}
                label={tag}
                labelStyle={styles.tagLabel}
                onPress={() => handleTagPress(tag)}
                inactiveTintColor="#fff"
              />
            ))
          ) : (
            <Text style={styles.noTagsText}>No tags available</Text>
          )}
        </View>
      )}
      <View style={styles.drawerFooter}>
        <View style={styles.profileContainer}>
          <FontAwesome
            name="user"
            size={20}
            color="#fff"
            style={styles.userIcon}
          />
          <Text style={styles.username}>{username.toUpperCase()}</Text>
        </View>
        <DrawerItem
          label="Log Out"
          labelStyle={styles.drawerLabel}
          icon={() => <FontAwesome name="sign-out" size={20} color="#fff" />}
          onPress={handleLogout}
          inactiveTintColor="#fff"
        />
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = ({
  notesCount,
  favoritesCount,
  deletedCount,
  setIsAuthenticated,
}) => {
  return (
    <Drawer.Navigator
      initialRouteName="All Notes"
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          notesCount={notesCount}
          favoritesCount={favoritesCount}
          deletedCount={deletedCount}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}
      screenOptions={{
        drawerStyle: { backgroundColor: "#2A3E4C", width: 250 },
        drawerActiveTintColor: "#fff",
        drawerInactiveTintColor: "#fff",
        drawerActiveBackgroundColor: "#007bff",
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="Write Note"
        component={NoteEditorScreen}
        initialParams={{ note: null }}
        options={{
          drawerIcon: ({ color }) => (
            <FontAwesome name="pencil" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="All Notes"
        component={NotesScreen}
        initialParams={{ view: "all" }}
        options={{
          drawerIcon: ({ color }) => (
            <FontAwesome name="folder" size={20} color={color} />
          ),
          drawerLabel: () => (
            <Text style={styles.drawerLabel}>
              All Notes {notesCount > 0 ? `(${notesCount})` : ""}
            </Text>
          ),
        }}
      />
      <Drawer.Screen
        name="Favorites"
        component={NotesScreen}
        initialParams={{ view: "favorites" }}
        options={{
          drawerIcon: ({ color }) => (
            <FontAwesome name="star" size={20} color={color} />
          ),
          drawerLabel: () => (
            <Text style={styles.drawerLabel}>
              Favorites {favoritesCount > 0 ? `(${favoritesCount})` : ""}
            </Text>
          ),
        }}
      />
      <Drawer.Screen
        name="Recent"
        component={NotesScreen}
        initialParams={{ view: "recent" }}
        options={{
          drawerIcon: ({ color }) => (
            <FontAwesome name="clock-o" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Recently Deleted"
        component={RecentlyDeletedScreen}
        options={{
          drawerIcon: ({ color }) => (
            <FontAwesome name="trash" size={20} color={color} />
          ),
          drawerLabel: () => (
            <Text style={styles.drawerLabel}>
              Recently Deleted {deletedCount > 0 ? `(${deletedCount})` : ""}
            </Text>
          ),
        }}
      />
      <Drawer.Screen
        name="Notes"
        component={NotesScreen}
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer.Navigator>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [theme, setTheme] = useState("light");
  const [notesCount, setNotesCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const response = await fetch("http://172.19.139.223:5000/notes", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const responseText = await response.text();
          if (!response.ok) {
            let errorData;
            try {
              errorData = JSON.parse(responseText);
            } catch (e) {
              throw new Error(
                `Server returned non-JSON response: ${responseText}`
              );
            }
            throw new Error(errorData.error || "Failed to verify token");
          }
          setIsAuthenticated(true);
          await fetchNotesCount();
          await fetchFavoritesCount();
          await fetchDeletedCount();
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error.message);
        if (error.message.includes("Invalid token")) {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("username");
        }
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const fetchNotesCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch("http://172.19.139.223:5000/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = JSON.parse(await response.text());
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch notes count");
      setNotesCount(data.length);
    } catch (error) {
      console.error("Error fetching notes count:", error.message);
    }
  };

  const fetchFavoritesCount = async () => {
    try {
      const favorites =
        JSON.parse(await AsyncStorage.getItem("favorites")) || [];
      setFavoritesCount(favorites.length);
    } catch (error) {
      console.error("Error fetching favorites count:", error);
    }
  };

  const fetchDeletedCount = async () => {
    try {
      const deletedNotes =
        JSON.parse(await AsyncStorage.getItem("deletedNotes")) || [];
      setDeletedCount(deletedNotes.length);
    } catch (error) {
      console.error("Error fetching deleted count:", error);
    }
  };

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <NavigationContainer>
          {isAuthenticated ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Drawer">
                {() => (
                  <DrawerNavigator
                    notesCount={notesCount}
                    favoritesCount={favoritesCount}
                    deletedCount={deletedCount}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
              />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
              />
              <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
              />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  drawerContent: { flex: 1 },
  drawerHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#3A4E5C",
  },
  drawerHeaderText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  drawerHeaderItem: { backgroundColor: "#2A3E4C", marginTop: 10 },
  drawerHeaderLabel: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  drawerLabel: { fontSize: 16, color: "#fff" },
  tagsContainer: { paddingLeft: 20 },
  tagLabel: { fontSize: 14, color: "#fff" },
  noTagsText: {
    fontSize: 14,
    color: "#fff",
    paddingLeft: 20,
    paddingVertical: 5,
  },
  drawerFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#3A4E5C",
    marginTop: "auto",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  userIcon: { marginRight: 10 },
  username: { fontSize: 16, color: "#fff" },
});

export default App;
