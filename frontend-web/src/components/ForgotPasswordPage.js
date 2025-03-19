import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailError(false);

    if (!email) {
      setEmailError(true);
      setError('Please enter your email.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'User not found') {
          setEmailError(true);
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
          <Form.Group controlId="email" className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={emailError ? 'is-invalid' : ''}
            />
            {emailError && <div className="invalid-feedback">Email is required or not found</div>}
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