import React, { useContext } from 'react';

// Create contexts
export const AuthContext = React.createContext();
export const ThemeContext = React.createContext();

// Custom hook for ThemeContext
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContext.Provider');
  }
  // Return theme and a toggleTheme function
  return {
    theme: context.theme,
    toggleTheme: () => context.setTheme(context.theme === 'light' ? 'dark' : 'light'),
  };
};

// Custom hook for AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthContext.Provider');
  }
  return context;
};