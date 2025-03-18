import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot instead of ReactDOM
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import App from './App';

// Get the root DOM element
const container = document.getElementById('root');

// Create a root for rendering
const root = createRoot(container);

// Render the app using the new API
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);