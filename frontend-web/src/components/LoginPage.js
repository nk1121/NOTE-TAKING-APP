import React, { useState } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import './LoginPage.css'; // Ensure this file exists

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailError(false);
    setPasswordError(false);

    if (!email) setEmailError(true);
    if (!password) setPasswordError(true);
    if (!email || !password) {
      setError('Please fill in all fields.');
      console.log('Validation failed: Missing fields');
      return;
    }

    try {
      console.log('Attempting login with:', { email, password });
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.log('Login failed:', data.error);
        if (data.error === 'Invalid email or password') {
          setEmailError(true);
          setPasswordError(true);
        }
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful, setting token and username:', data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);

      // Set success message and ensure it renders before redirect
      setSuccess('Login successful! Redirecting...');
      console.log('Success message set');

      // Call onLogin immediately
      onLogin();

      // Delay navigation to allow the success message to be visible
      setTimeout(() => {
        console.log('Redirecting to /app');
        navigate('/app');
      }, 5000); // 2-second delay
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container card p-4 shadow-lg">
        <h2 className="text-center mb-4">Login to PixelNotes</h2>
        {error && (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" className="text-center">
            {success}
          </Alert>
        )}
        <Form onSubmit={handleLogin}>
          <Form.Group controlId="email" className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={emailError ? 'is-invalid' : ''}
            />
            {emailError && <div className="invalid-feedback">Email is required</div>}
          </Form.Group>
          <Form.Group controlId="password" className="mb-3">
            <Form.Label>Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={passwordError ? 'is-invalid' : ''}
              />
              <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </InputGroup.Text>
              {passwordError && <div className="invalid-feedback">Password is required</div>}
            </InputGroup>
          </Form.Group>
          <div className="d-flex justify-content-between mb-3">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>
          <Button variant="primary" type="submit" className="w-100 login-button mb-3">
            Login
          </Button>
          <div className="text-center">
            <p className="mb-0">
              Don't have an account?{' '}
              <Link to="/register" className="signup-link">
                Sign Up
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;