import React, { useState } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState(false);
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCurrentPasswordError(false);
    setNewPasswordError(false);

    if (!currentPassword) setCurrentPasswordError(true);
    if (!newPassword) setNewPasswordError(true);
    if (!currentPassword || !newPassword) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'Current password is incorrect') {
          setCurrentPasswordError(true);
        }
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully! Redirecting...');
      setTimeout(() => {
        navigate('/app');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  return (
    <div className="p-4">
      <div className="login-container card p-4 shadow-lg">
        <h2 className="text-center mb-4">Change Password</h2>
        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
        {success && <Alert variant="success" className="text-center">{success}</Alert>}
        <Form onSubmit={handleChangePassword}>
          <Form.Group controlId="currentPassword" className="mb-3">
            <Form.Label>Current Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={currentPasswordError ? 'is-invalid' : ''}
              />
              <InputGroup.Text onClick={toggleCurrentPasswordVisibility} style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
              </InputGroup.Text>
              {currentPasswordError && <div className="invalid-feedback">Current password is required or incorrect</div>}
            </InputGroup>
          </Form.Group>
          <Form.Group controlId="newPassword" className="mb-3">
            <Form.Label>New Password</Form.Label>
            <InputGroup>
              <Form.Control
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={newPasswordError ? 'is-invalid' : ''}
              />
              <InputGroup.Text onClick={toggleNewPasswordVisibility} style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
              </InputGroup.Text>
              {newPasswordError && <div className="invalid-feedback">New password is required</div>}
            </InputGroup>
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100 mb-3">
            Change Password
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;