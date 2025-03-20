import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSignOutAlt, faMoon, faSun, faBell, faUser, faTrash } from '@fortawesome/free-solid-svg-icons';

const ProfilePage = ({ onLogout, toggleTheme, theme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setEmail(data.email);
      setUsername(data.username);
      setName(data.name);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, username, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      localStorage.setItem('username', data.username);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete account');

      onLogout();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h2 className="profile-title">Profile</h2>
      </div>
      <div className="profile-toolbar">
        <OverlayTrigger placement="top" overlay={<Tooltip>Edit Profile</Tooltip>}>
          <Button
            variant="outline-light"
            className="profile-toolbar-item"
            onClick={() => setIsEditing(!isEditing)}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={<Tooltip>Logout</Tooltip>}>
          <Button variant="outline-light" className="profile-toolbar-item" onClick={onLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={<Tooltip>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</Tooltip>}>
          <Button variant="outline-light" className="profile-toolbar-item" onClick={toggleTheme}>
            <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={<Tooltip>Notifications</Tooltip>}>
          <Button variant="outline-light" className="profile-toolbar-item">
            <FontAwesomeIcon icon={faBell} />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={<Tooltip>Switch Accounts</Tooltip>}>
          <Button variant="outline-light" className="profile-toolbar-item">
            <FontAwesomeIcon icon={faUser} />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={<Tooltip>Delete Account</Tooltip>}>
          <Button variant="outline-light" className="profile-toolbar-item text-danger" onClick={handleDeleteAccount}>
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </OverlayTrigger>
      </div>

      {isEditing ? (
        <div className="profile-form-container">
          {error && <Alert variant="danger" className="profile-alert">{error}</Alert>}
          {success && <Alert variant="success" className="profile-alert">{success}</Alert>}
          <Form onSubmit={handleUpdateProfile}>
            <Form.Group className="mb-2">
              <Form.Label className="profile-label">Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="profile-input"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="profile-label">Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="profile-input"
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="profile-label">Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile-input"
              />
            </Form.Group>
            <Button type="submit" className="profile-button w-100">
              Save Changes
            </Button>
          </Form>
        </div>
      ) : (
        <div className="profile-form-container">
          {error && <Alert variant="danger" className="profile-alert">{error}</Alert>}
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Username:</strong> {username}</p>
          <p><strong>Name:</strong> {name || 'Not set'}</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;