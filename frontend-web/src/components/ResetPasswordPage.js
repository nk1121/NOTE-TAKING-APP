import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token. Please request a new reset link.');
    }
  }, [token]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNewPasswordError(false);

    if (!newPassword) {
      setNewPasswordError(true);
      setError('Please enter a new password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess('Password reset successfully! Redirecting to login...');
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

  return (
    <div className="login-page">
      <div className="login-container card p-4 shadow-lg">
        <h2 className="text-center mb-4">Reset Password</h2>
        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
        {success && <Alert variant="success" className="text-center">{success}</Alert>}
        <Form onSubmit={handleResetPassword}>
          <Form.Group controlId="newPassword" className="mb-3">
            <Form.Label>New Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={newPasswordError ? 'is-invalid' : ''}
              />
              <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </InputGroup.Text>
              {newPasswordError && <div className="invalid-feedback">New password is required</div>}
            </InputGroup>
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100 login-button mb-3">
            Reset Password
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

export default ResetPasswordPage;