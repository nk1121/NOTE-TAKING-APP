import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameError, setUsernameError] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUsernameError(false);

    if (!username) {
      setUsernameError(true);
      setError('Please enter your email.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'User not found') {
          setUsernameError(true);
        }
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess('Password reset link sent to your email. Please check your inbox.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container card p-4 shadow-lg">
        <h2 className="text-center mb-4">Forgot Password</h2>
        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
        {success && <Alert variant="success" className="text-center">{success}</Alert>}
        <Form onSubmit={handleForgotPassword}>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={usernameError ? 'is-invalid' : ''}
            />
            {usernameError && <div className="invalid-feedback">Email is required or not found</div>}
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100 login-button mb-3">
            Send Reset Link
          </Button>
          <div className="text-center">
            <p className="mb-0">
              Back to{' '}
              <Link to="/login" className="signup-link">
                Login
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;