import React from 'react';
import { Spinner } from 'react-bootstrap';

const SplashScreen = () => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <h1>Pixel Notes</h1>
        <Spinner animation="border" variant="primary" />
        <p>Loading...</p>
      </div>
    </div>
  );
};

export default SplashScreen;