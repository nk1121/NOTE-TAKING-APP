import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
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
      setSuccess('Profile updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/app');
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="profile-page-container">
      <Card className="profile-page-card p-4 shadow-lg">
        <h2 className="text-center mb-3">User Profile</h2>
        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
        {success && <Alert variant="success" className="text-center">{success}</Alert>}
        <div className="text-center mb-3">
          <Image
            src={profilePicture || 'https://via.placeholder.com/100'}
            alt="Profile Picture"
            roundedCircle
            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
          />
        </div>
        <Form onSubmit={handleUpdateProfile}>
          <Form.Group controlId="email" className="mb-2">
            <Form.Label>Email Address *</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={emailError ? 'is-invalid' : ''}
            />
            {emailError && <div className="invalid-feedback">Email is required or already exists</div>}
          </Form.Group>
          <Form.Group controlId="username" className="mb-2">
            <Form.Label>Username (max 10 characters) *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={usernameError ? 'is-invalid' : ''}
              maxLength={10}
            />
            {usernameError && <div className="invalid-feedback">Username is required or already exists</div>}
          </Form.Group>
          <Form.Group controlId="name" className="mb-2">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="profilePicture" className="mb-2">
            <Form.Label>Profile Picture URL</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter profile picture URL"
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="bio" className="mb-2">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Tell us about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ resize: 'none' }}
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100 mt-2">
            Update Profile
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;