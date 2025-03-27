import React, { useState, useEffect } from 'react';
import { Button, Form, Dropdown, DropdownButton } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSun, faMoon, faVolumeUp, faSave, faCog,
  faEdit, faShareSquare, faBell, faUser, faTrash
} from '@fortawesome/free-solid-svg-icons';

const ProfilePage = ({ onLogout, toggleTheme, theme }) => {
  const [activeSection, setActiveSection] = useState('none'); // State to control which section is visible: 'none', 'profile', or 'tts'
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Guest');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [ttsSettings, setTtsSettings] = useState(() => {
    // Initialize ttsSettings with saved settings if available
    const savedSettings = JSON.parse(localStorage.getItem('ttsSettings'));
    return savedSettings || {
      rate: 1, // Default: normal speed (1x)
      pitch: 1, // Default: normal pitch
      volume: 1, // Default: full volume
      voice: null, // Default: first available voice
    };
  });
  const [voices, setVoices] = useState([]);
  const [testText, setTestText] = useState('This is a test of the text-to-speech settings.');

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Load voices immediately and on change (some browsers load voices asynchronously)
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []); // No dependencies, runs once on mount and when voices change

  // Set default voice if not set
  useEffect(() => {
    if (voices.length > 0 && ttsSettings.voice === null) {
      setTtsSettings((prev) => ({ ...prev, voice: voices[0] }));
    }
  }, [voices, ttsSettings.voice]); // Depend on voices and ttsSettings.voice

  // Load saved voice settings after voices are available
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('ttsSettings'));
    if (savedSettings && savedSettings.voice && voices.length > 0) {
      const savedVoice = voices.find((v) => v.name === savedSettings.voice.name);
      if (savedVoice) {
        setTtsSettings((prev) => ({
          ...prev,
          voice: savedVoice,
        }));
      }
    }
  }, [voices]); // Depend on voices only

  // Group voices by gender, accent, and style
  const groupVoices = () => {
    const grouped = {
      Male: [],
      Female: [],
      'Non-binary': [],
    };

    voices.forEach((voice) => {
      const name = voice.name.toLowerCase();
      let gender = 'Non-binary'; // Default to non-binary if gender isn't clear

      if (name.includes('male') || name.includes('man')) {
        gender = 'Male';
      } else if (name.includes('female') || name.includes('woman')) {
        gender = 'Female';
      }

      grouped[gender].push(voice);
    });

    return grouped;
  };

  const handleSaveProfile = () => {
    // Simulate saving profile changes
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
    if (ttsSettings.voice) {
      utterance.voice = ttsSettings.voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceSelect = (voice) => {
    setTtsSettings((prev) => ({ ...prev, voice }));
  };

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
          <span className="profile-toolbar-item" title="Share Profile">
            <FontAwesomeIcon icon={faShareSquare} />
          </span>
          <span className="profile-toolbar-item" onClick={toggleTheme} title="Toggle Theme">
            <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
          </span>
          <span
            className={`profile-toolbar-item ${activeSection === 'tts' ? 'active' : ''}`}
            onClick={() => setActiveSection(activeSection === 'tts' ? 'none' : 'tts')}
            title="Text-to-Speech Settings"
          >
            <FontAwesomeIcon icon={faCog} />
          </span>
          <span className="profile-toolbar-item" title="Notifications">
            <FontAwesomeIcon icon={faBell} />
          </span>
          <span className="profile-toolbar-item" title="View Profile">
            <FontAwesomeIcon icon={faUser} />
          </span>
          <span className="profile-toolbar-item text-danger" onClick={onLogout} title="Delete Profile">
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
              <Button className="profile-button" onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </Form>
          </>
        )}

        {/* TTS Settings Section */}
        {activeSection === 'tts' && (
          <>
            <h2 className="profile-title">Text-to-Speech Settings</h2>
            <Form>
              {/* Speech Rate */}
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

              {/* Pitch */}
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

              {/* Volume */}
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

              {/* Voice Selection */}
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

              {/* Test Speech */}
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

              {/* Save Button */}
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