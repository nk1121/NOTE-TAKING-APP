import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import LoginScreen from './screens/LoginScreen';
import NotesScreen from './screens/NotesScreen';
import NoteEditorScreen from './screens/NoteEditorScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import { API_BASE_URL } from './constants';

// Navigation setup
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Contexts
const ThemeContext = createContext();
const AuthContext = createContext();
const ViewContext = createContext(); // Declared once here

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState('light');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [currentView, setCurrentView] = useState('write');
  const [username, setUsername] = useState('Guest');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsAuthenticated(!!token);

        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) setUsername(storedUsername);

        const savedTheme = (await AsyncStorage.getItem('theme')) || 'light';
        setTheme(savedTheme);
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    let interval;
    if (timerRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setTimerRunning(false);
      Alert.alert('Pomodoro Timer', 'Timer finished!');
    }
    return () => clearInterval(interval);
  }, [timerRunning, pomodoroTime]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startPauseTimer = () => {
    if (!timerRunning) {
      setPomodoroTime(customMinutes * 60);
    }
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setPomodoroTime(customMinutes * 60);
  };

  const incrementMinutes = () => {
    setCustomMinutes((prev) => {
      const newMinutes = prev + 1;
      setPomodoroTime(newMinutes * 60);
      return newMinutes;
    });
    setTimerRunning(false);
  };

  const decrementMinutes = () => {
    setCustomMinutes((prev) => {
      const newMinutes = Math.max(1, prev - 1);
      setPomodoroTime(newMinutes * 60);
      return newMinutes;
    });
    setTimerRunning(false);
  };

  const DrawerContent = () => {
    const navigation = useNavigation();
    const { setIsAuthenticated } = useAuth();
    const { currentView } = useView();

    const handleLogout = async () => {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('username');
      setIsAuthenticated(false);
      setUsername('Guest');
      navigation.navigate('Login');
    };

    return (
      <View style={[styles.drawerContainer, { backgroundColor: theme === 'light' ? '#2c3e50' : '#1a252f' }]}>
        <TouchableOpacity
          style={[styles.drawerItem, currentView === 'write' && styles.activeDrawerItem]}
          onPress={() => {
            setCurrentView('write');
            navigation.navigate('Notes', { view: 'write' });
          }}
        >
          <FontAwesome name="pencil" size={20} color="white" />
          <Text style={styles.drawerText}>Write Note</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.drawerItem, currentView === 'all' && styles.activeDrawerItem]}
          onPress={() => {
            setCurrentView('all');
            navigation.navigate('Notes', { view: 'all' });
          }}
        >
          <FontAwesome name="sticky-note" size={20} color="white" />
          <Text style={styles.drawerText}>All Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.drawerItem, currentView === 'favorites' && styles.activeDrawerItem]}
          onPress={() => {
            setCurrentView('favorites');
            navigation.navigate('Notes', { view: 'favorites' });
          }}
        >
          <FontAwesome name="star" size={20} color="white" />
          <Text style={styles.drawerText}>Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.drawerItem, currentView === 'recent' && styles.activeDrawerItem]}
          onPress={() => {
            setCurrentView('recent');
            navigation.navigate('Notes', { view: 'recent' });
          }}
        >
          <FontAwesome name="clock-o" size={20} color="white" />
          <Text style={styles.drawerText}>Recent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <FontAwesome name="user" size={20} color="white" />
          <Text style={styles.drawerText}>{username}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={handleLogout}
        >
          <FontAwesome name="sign-out" size={20} color="white" />
          <Text style={styles.drawerText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const DrawerNavigator = () => (
    <Drawer.Navigator drawerContent={() => <DrawerContent />}>
      <Drawer.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          headerTitle: () => (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>NoteApp</Text>
              <View style={styles.timerControls}>
                <TouchableOpacity onPress={decrementMinutes}>
                  <Text style={styles.timerButton}>−</Text>
                </TouchableOpacity>
                <Text style={styles.timerText}>{formatTime(pomodoroTime)}</Text>
                <TouchableOpacity onPress={incrementMinutes}>
                  <Text style={styles.timerButton}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={startPauseTimer}>
                  <FontAwesome name={timerRunning ? 'pause' : 'play'} size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={resetTimer}>
                  <FontAwesome name="undo" size={20} color="white" style={{ marginLeft: 10 }} />
                </TouchableOpacity>
              </View>
            </View>
          ),
          headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={{ title: 'Edit Note', headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' }, headerTintColor: '#fff' }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' }, headerTintColor: '#fff' }}
      />
      <Drawer.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' }, headerTintColor: '#fff' }}
      />
    </Drawer.Navigator>
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
        <ViewContext.Provider value={{ currentView, setCurrentView }}>
          <NavigationContainer>
            <Stack.Navigator>
              {!isAuthenticated ? (
                <>
                  <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="ForgotPassword"
                    component={ForgotPasswordScreen}
                    options={{ title: 'Forgot Password', headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' }, headerTintColor: '#fff' }}
                  />
                  <Stack.Screen
                    name="ResetPassword"
                    component={ResetPasswordScreen}
                    options={{ title: 'Reset Password', headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' }, headerTintColor: '#fff' }}
                  />
                </>
              ) : (
                <Stack.Screen
                  name="Drawer"
                  component={DrawerNavigator}
                  options={{ headerShown: false }}
                />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </ViewContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    padding: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  activeDrawerItem: {
    backgroundColor: '#34495e',
  },
  drawerText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: 'white',
    fontSize: 16,
    marginHorizontal: 10,
  },
  timerButton: {
    color: 'white',
    fontSize: 20,
    paddingHorizontal: 10,
  },
});

export default App;
export { AuthContext, ThemeContext, ViewContext }; // Export the existing contexts
export const useAuth = () => useContext(AuthContext);
export const useTheme = () => useContext(ThemeContext);
export const useView = () => useContext(ViewContext);