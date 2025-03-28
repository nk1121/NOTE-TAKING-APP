import React, { useState, useEffect } from 'react';
import { Button, Form, Dropdown, DropdownButton, Alert, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSun, faMoon, faVolumeUp, faSave, faCog,
  faEdit, faBell, faUser, faTrash, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

const ProfilePage = ({ onLogout, toggleTheme, theme }) => {
  const [activeSection, setActiveSection] = useState('none');
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Guest');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [ttsSettings, setTtsSettings] = useState(() => {
    const savedSettings = JSON.parse(localStorage.getItem('ttsSettings'));
    return savedSettings || { rate: 1, pitch: 1, volume: 1, voice: null };
  });
  const [voices, setVoices] = useState([]);
  const [testText, setTestText] = useState('This is a test of the text-to-speech settings.');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retypeNewPassword, setRetypeNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRetypeNewPassword, setShowRetypeNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (voices.length > 0 && ttsSettings.voice === null) {
      setTtsSettings((prev) => ({ ...prev, voice: voices[0] }));
    }
  }, [voices, ttsSettings.voice]);

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('ttsSettings'));
    if (savedSettings && savedSettings.voice && voices.length > 0) {
      const savedVoice = voices.find((v) => v.name === savedSettings.voice.name);
      if (savedVoice) {
        setTtsSettings((prev) => ({ ...prev, voice: savedVoice }));
      }
    }
  }, [voices]);

  const groupVoices = () => {
    const grouped = { Male: [], Female: [], 'Non-binary': [] };
    voices.forEach((voice) => {
      const name = voice.name.toLowerCase();
      let gender = 'Non-binary';
      if (name.includes('male') || name.includes('man')) gender = 'Male';
      else if (name.includes('female') || name.includes('woman')) gender = 'Female';
      grouped[gender].push(voice);
    });
    return grouped;
  };

  const handleSaveProfile = () => {
    localStorage.setItem('username', username);
    localStorage.setItem('email', email);
    localStorage.setItem('name', name);
    alert('Profile updated successfully!');
  };

  const handleSaveTtsSettings = () => {
    localStorage.setItem('ttsSettings', JSON.stringify(ttsSettings));
    alert('Text-to-speech settings saved!');
  };

  const handleTestSpeech = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = ttsSettings.rate;
    utterance.pitch = ttsSettings.pitch;
    utterance.volume = ttsSettings.volume;
    if (ttsSettings.voice) utterance.voice = ttsSettings.voice;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceSelect = (voice) => {
    setTtsSettings((prev) => ({ ...prev, voice }));
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !retypeNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== retypeNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const response = await fetch('http://localhost:5000/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setPasswordSuccess('Password reset successfully!');
      setOldPassword('');
      setNewPassword('');
      setRetypeNewPassword('');
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const toggleOldPasswordVisibility = () => setShowOldPassword(!showOldPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleRetypeNewPasswordVisibility = () => setShowRetypeNewPassword(!showRetypeNewPassword);

  const groupedVoices = groupVoices();

  return (
    <div className="profile-page-container">
      <div className="profile-form-container">
        <div className="profile-toolbar">
          <span
            className={`profile-toolbar-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection(activeSection === 'profile' ? 'none' : 'profile')}
            title="Edit Profile"
          >
            <FontAwesomeIcon icon={faEdit} />
          </span>
          <span
            className="profile-toolbar-item"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
          </span>
          <span
            className={`profile-toolbar-item ${activeSection === 'tts' ? 'active' : ''}`}
            onClick={() => setActiveSection(activeSection === 'tts' ? 'none' : 'tts')}
            title="Text-to-Speech Settings"
          >
            <FontAwesomeIcon icon={faCog} />
          </span>
          <span
            className="profile-toolbar-item"
            title="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
          </span>
          <span
            className="profile-toolbar-item"
            title="View Profile"
          >
            <FontAwesomeIcon icon={faUser} />
          </span>
          <span
            className="profile-toolbar-item text-danger"
            onClick={onLogout}
            title="Delete Profile"
          >
            <FontAwesomeIcon icon={faTrash} />
          </span>
        </div>

        {/* Profile Editing Section */}
        {activeSection === 'profile' && (
          <>
            <h2 className="profile-title">Profile</h2>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Email</Form.Label>
                <Form.Control
                  type="email"
                  className="profile-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Username</Form.Label>
                <Form.Control
                  type="text"
                  className="profile-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Name</Form.Label>
                <Form.Control
                  type="text"
                  className="profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Form.Group>
              <Button className="profile-button w-100" onClick={handleSaveProfile}>
                Save Changes
              </Button>

              <h3 className="profile-title mt-4">Reset Password</h3>
              {passwordError && <Alert variant="danger" className="mt-2">{passwordError}</Alert>}
              {passwordSuccess && <Alert variant="success" className="mt-2">{passwordSuccess}</Alert>}
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Old Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter old password"
                  />
                  <InputGroup.Text onClick={toggleOldPasswordVisibility} style={{ cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={showOldPassword ? faEyeSlash : faEye} />
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">New Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <InputGroup.Text onClick={toggleNewPasswordVisibility} style={{ cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Retype New Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showRetypeNewPassword ? 'text' : 'password'}
                    value={retypeNewPassword}
                    onChange={(e) => setRetypeNewPassword(e.target.value)}
                    placeholder="Retype new password"
                  />
                  <InputGroup.Text onClick={toggleRetypeNewPasswordVisibility} style={{ cursor: 'pointer' }}>
                    <FontAwesomeIcon icon={showRetypeNewPassword ? faEyeSlash : faEye} />
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <Button className="profile-button w-100" onClick={handleResetPassword}>
                Reset Password
              </Button>
            </Form>
          </>
        )}

        {/* TTS Settings Section */}
        {activeSection === 'tts' && (
          <>
            <h2 className="profile-title">Text-to-Speech Settings</h2>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Speech Rate: {ttsSettings.rate.toFixed(1)}x</Form.Label>
                <Form.Range
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={ttsSettings.rate}
                  onChange={(e) => setTtsSettings((prev) => ({ ...prev, rate: parseFloat(e.target.value) }))}
                />
                <div className="d-flex justify-content-between">
                  <small>Slow (0.5x)</small>
                  <small>Normal (1x)</small>
                  <small>Fast (2x)</small>
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Pitch: {ttsSettings.pitch.toFixed(1)}</Form.Label>
                <Form.Range
                  min={0}
                  max={2}
                  step={0.1}
                  value={ttsSettings.pitch}
                  onChange={(e) => setTtsSettings((prev) => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                />
                <div className="d-flex justify-content-between">
                  <small>Low (0)</small>
                  <small>Normal (1)</small>
                  <small>High (2)</small>
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Volume: {(ttsSettings.volume * 100).toFixed(0)}%</Form.Label>
                <Form.Range
                  min={0}
                  max={1}
                  step={0.01}
                  value={ttsSettings.volume}
                  onChange={(e) => setTtsSettings((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))}
                />
                <div className="d-flex justify-content-between">
                  <small>Mute (0%)</small>
                  <small>Full (100%)</small>
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Voice Selection</Form.Label>
                <DropdownButton
                  title={ttsSettings.voice ? ttsSettings.voice.name : 'Select a voice'}
                  variant="outline-secondary"
                  className="w-100"
                >
                  {Object.entries(groupedVoices).map(([gender, voiceList]) => (
                    voiceList.length > 0 && (
                      <div key={gender}>
                        <Dropdown.Header>{gender}</Dropdown.Header>
                        {voiceList.map((voice) => (
                          <Dropdown.Item
                            key={voice.name}
                            onClick={() => handleVoiceSelect(voice)}
                          >
                            {voice.name} ({voice.lang})
                          </Dropdown.Item>
                        ))}
                      </div>
                    )
                  ))}
                </DropdownButton>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="profile-label">Test Text</Form.Label>
                <Form.Control
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="profile-input"
                />
                <Button
                  variant="outline-primary"
                  onClick={handleTestSpeech}
                  className="mt-2 w-100"
                >
                  <FontAwesomeIcon icon={faVolumeUp} /> Test Speech
                </Button>
              </Form.Group>
              <Button className="profile-button w-100" onClick={handleSaveTtsSettings}>
                <FontAwesomeIcon icon={faSave} /> Save Settings
              </Button>
            </Form>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;