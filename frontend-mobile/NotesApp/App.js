import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import NotesScreen from './screens/NotesScreen';
import NoteEditorScreen from './screens/NoteEditorScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import SplashScreen from './components/SplashScreen';

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

// Auth Context
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState('write');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsAuthenticated(!!token);

        const savedTheme = (await AsyncStorage.getItem('theme')) || 'light';
        setTheme(savedTheme);

        setTimeout(() => setShowSplash(false), 3000);
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const DrawerContent = ({ navigation }) => {
    const { setIsAuthenticated } = useAuth();

    const handleLogout = async () => {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('username');
      setIsAuthenticated(false);
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
          <Text style={styles.drawerText}>{AsyncStorage.getItem('username') || 'Guest'}</Text>
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
    <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          headerTitle: () => (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>NoteApp</Text>
            </View>
          ),
          headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' },
          headerTintColor: '#fff',
        }}
        initialParams={{ view: 'write' }}
      />
      <Drawer.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={{
          title: 'Edit Note',
          headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' },
          headerTintColor: '#fff',
        }}
      />
    </Drawer.Navigator>
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
        <NavigationContainer>
          {showSplash ? (
            <SplashScreen />
          ) : (
            <Stack.Navigator>
              {!isAuthenticated ? (
                <>
                  <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Register"
                    component={RegisterScreen}
                    options={{
                      title: 'Sign Up',
                      headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen
                    name="ForgotPassword"
                    component={ForgotPasswordScreen}
                    options={{
                      title: 'Forgot Password',
                      headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' },
                      headerTintColor: '#fff',
                    }}
                  />
                  <Stack.Screen
                    name="ResetPassword"
                    component={ResetPasswordScreen}
                    options={{
                      title: 'Reset Password',
                      headerStyle: { backgroundColor: theme === 'light' ? '#343a40' : '#1a252f' },
                      headerTintColor: '#fff',
                    }}
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
          )}
        </NavigationContainer>
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
});

export default App;