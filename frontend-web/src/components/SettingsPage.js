import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Image, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [bio, setBio] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch profile');
        }

        setEmail(data.email);
        setUsername(data.username);
        setNewEmail(data.email);
        setName(data.name || '');
        setProfilePicture(data.profile_picture || '');
        setBio(data.bio || '');
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailError(false);
    setUsernameError(false);

    if (!email) setEmailError(true);
    if (!username) setUsernameError(true);
    if (!email || !username) {
      setError('Please fill in all required fields.');
      return;
    }

    if (username.length > 10) {
      setUsernameError(true);
      setError('Username must be 10 characters or less.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, username, name, profile_picture: profilePicture, bio }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'Email already exists') {
          setEmailError(true);
        }
        if (data.error === 'Username already exists') {
          setUsernameError(true);
        }
        throw new Error(data.error || 'Failed to update profile');
      }

      localStorage.setItem('username', data.user.username);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailError(false);

    if (!newEmail) {
      setEmailError(true);
      setError('Please enter a new email address.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail, username, name, profile_picture: profilePicture, bio }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error === 'Email already exists') {
          setEmailError(true);
        }
        throw new Error(data.error || 'Failed to update email');
      }

      setEmail(newEmail);
      setSuccess('Email updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPasswordError(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(true);
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(true);
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div>
            <h2 className="settings-section-title">Profile</h2>
            {error && <Alert variant="danger" className="settings-alert">{error}</Alert>}
            {success && <Alert variant="success" className="settings-alert">{success}</Alert>}
            <Form onSubmit={handleUpdateProfile}>
              <Form.Group controlId="profilePicture" className="mb-3">
                <Form.Label>Profile Picture</Form.Label>
                <div className="d-flex align-items-center mb-2">
                  <Image
                    src={profilePicture || 'https://via.placeholder.com/50'}
                    alt="Profile Picture"
                    roundedCircle
                    className="settings-profile-picture mr-3"
                  />
                  <Form.Control
                    type="text"
                    placeholder="Enter profile picture URL"
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                    className="settings-input"
                  />
                </div>
              </Form.Group>
              <Form.Group controlId="username" className="mb-3">
                <Form.Label>Username (max 10 characters) *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`settings-input ${usernameError ? 'is-invalid' : ''}`}
                  maxLength={10}
                />
                {usernameError && <div className="invalid-feedback">Username is required or already exists</div>}
              </Form.Group>
              <Form.Group controlId="name" className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="settings-input"
                />
              </Form.Group>
              <Form.Group controlId="bio" className="mb-3">
                <Form.Label>Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Tell us about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="settings-input"
                  style={{ resize: 'none' }}
                />
              </Form.Group>
              <Button type="submit" className="settings-button">Update Profile</Button>
            </Form>
          </div>
        );
      case 'email':
        return (
          <div>
            <h2 className="settings-section-title">Manage Email</h2>
            {error && <Alert variant="danger" className="settings-alert">{error}</Alert>}
            {success && <Alert variant="success" className="settings-alert">{success}</Alert>}
            <Form onSubmit={handleChangeEmail}>
              <Form.Group controlId="currentEmail" className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  readOnly
                  className="settings-input bg-light"
                />
              </Form.Group>
              <Form.Group controlId="newEmail" className="mb-3">
                <Form.Label>New Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={`settings-input ${emailError ? 'is-invalid' : ''}`}
                />
                {emailError && <div className="invalid-feedback">Email is required or already exists</div>}
              </Form.Group>
              <Button type="submit" className="settings-button">Change Email</Button>
            </Form>
          </div>
        );
      case 'password':
        return (
          <div>
            <h2 className="settings-section-title">Change Password</h2>
            {error && <Alert variant="danger" className="settings-alert">{error}</Alert>}
            {success && <Alert variant="success" className="settings-alert">{success}</Alert>}
            <Form onSubmit={handleChangePassword}>
              <Form.Group controlId="currentPassword" className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`settings-input ${passwordError ? 'is-invalid' : ''}`}
                />
              </Form.Group>
              <Form.Group controlId="newPassword" className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`settings-input ${passwordError ? 'is-invalid' : ''}`}
                />
              </Form.Group>
              <Form.Group controlId="confirmPassword" className="mb-3">
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`settings-input ${passwordError ? 'is-invalid' : ''}`}
                />
                {passwordError && <div className="invalid-feedback">Please fill in all fields correctly</div>}
              </Form.Group>
              <Button type="submit" className="settings-button">Change Password</Button>
            </Form>
          </div>
        );
      case 'twoFactor':
        return (
          <div>
            <h2 className="settings-section-title">Two-Factor Authentication</h2>
            <p>Two-factor authentication is not yet implemented.</p>
          </div>
        );
      case 'personalData':
        return (
          <div>
            <h2 className="settings-section-title">Personal Data</h2>
            <p>Personal data management is not yet implemented.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings-page-container">
      <h1 className="settings-title">Manage your account</h1>
      <div className="d-flex">
        <Nav className="settings-sidebar flex-column">
          <Nav.Link
            className={`settings-sidebar-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" /> Profile
          </Nav.Link>
          <Nav.Link
            className={`settings-sidebar-item ${activeSection === 'email' ? 'active' : ''}`}
            onClick={() => setActiveSection('email')}
          >
            <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Email
          </Nav.Link>
          <Nav.Link
            className={`settings-sidebar-item ${activeSection === 'password' ? 'active' : ''}`}
            onClick={() => setActiveSection('password')}
          >
            <FontAwesomeIcon icon={faLock} className="mr-2" /> Password
          </Nav.Link>
          <Nav.Link
            className={`settings-sidebar-item ${activeSection === 'twoFactor' ? 'active' : ''}`}
            onClick={() => setActiveSection('twoFactor')}
          >
            Two-factor authentication
          </Nav.Link>
          <Nav.Link
            className={`settings-sidebar-item ${activeSection === 'personalData' ? 'active' : ''}`}
            onClick={() => setActiveSection('personalData')}
          >
            Personal data
          </Nav.Link>
        </Nav>
        <div className="settings-content flex-grow-1">{renderSection()}</div>
      </div>
    </div>
  );
};

export default SettingsPage;