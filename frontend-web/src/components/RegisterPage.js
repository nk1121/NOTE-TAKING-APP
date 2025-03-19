import React, { useState } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUsernameError(false);
    setPasswordError(false);
    setConfirmPasswordError(false);

    if (!username) setUsernameError(true);
    if (!password) setPasswordError(true);
    if (!confirmPassword) setConfirmPasswordError(true);
    if (!username || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(true);
      setConfirmPasswordError(true);
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'Username already exists') {
          setUsernameError(true);
        }
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container card p-4 shadow-lg">
        <h2 className="text-center mb-4">Sign Up for Note-Taking App</h2>
        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
        {success && <Alert variant="success" className="text-center">{success}</Alert>}
        <Form onSubmit={handleRegister}>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={usernameError ? 'is-invalid' : ''}
            />
            {usernameError && <div className="invalid-feedback">Email is required or already exists</div>}
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
          <Form.Group controlId="confirmPassword" className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={confirmPasswordError ? 'is-invalid' : ''}
              />
              <InputGroup.Text onClick={toggleConfirmPasswordVisibility} style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </InputGroup.Text>
              {confirmPasswordError && <div className="invalid-feedback">Please confirm your password</div>}
            </InputGroup>
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100 login-button mb-3">
            Sign Up
          </Button>
          <div className="text-center">
            <p className="mb-0">
              Already have an account?{' '}
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

export default RegisterPage;