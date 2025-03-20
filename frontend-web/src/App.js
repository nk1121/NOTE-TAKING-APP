import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import { Navbar, Nav, Form, FormControl, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEdit, faTrash, faUser, faFileExport, faCloud, faSearch, faPlay, faPause, faRedo, faStar as faStarSolid, faVolumeUp, faStop, faSignOutAlt, faChevronDown, faChevronRight, faPen, faStickyNote, faStar, faClock } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ProfilePage from './components/ProfilePage';
import './App.css';

const MainApp = ({ onLogout, toggleTheme, theme }) => {
  const [notes, setNotes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [currentView, setCurrentView] = useState('write');
  const [selectedTag, setSelectedTag] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingNoteId, setSpeakingNoteId] = useState(null);
  const [isTagsExpanded, setIsTagsExpanded] = useState(true);

  const colorPalette = [
    '#D4EFDF', '#FFFFCC', '#FFD1DC', '#E6E6FA', '#E0F7FA',
    '#00FF00', '#FFFF00', '#FF0000', '#800080', '#0000FF',
    '#008000', '#FFA500', '#FF4500', '#4B0082', '#00008B',
    '#FFFFFF', '#D3D3D3', '#808080', '#000000', '#2F4F4F',
  ];

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'strike'],
      [{ 'color': colorPalette }, { 'background': colorPalette }],
      ['link', 'code', 'code-block'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote'],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'align': [] }],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'strike',
    'color',
    'background',
    'link',
    'code',
    'code-block',
    'list',
    'bullet',
    'blockquote',
    'script',
    'align',
  ];

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const response = await fetch('http://localhost:5000/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notes');
      }

      const data = await response.json();
      // Convert all tags to uppercase when fetching notes
      const updatedData = data.map(note => ({
        ...note,
        tags: note.tags ? note.tags.map(tag => tag.toUpperCase()) : [],
      }));
      setNotes(updatedData);
      const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
      setFavorites(storedFavorites);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!title || !content) {
      setError('Please fill in both title and content.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const method = editingNoteId ? 'PUT' : 'POST';
      const url = editingNoteId ? `http://localhost:5000/notes/${editingNoteId}` : 'http://localhost:5000/notes';
      // Ensure tags are saved in uppercase
      const uppercaseTags = tags.map(tag => tag.toUpperCase());
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, tags: uppercaseTags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingNoteId ? 'Failed to update note' : 'Failed to create note'));
      }

      await fetchNotes();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    // Tags are already uppercase from fetchNotes
    setTags(note.tags || []);
    setCurrentView('write');
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const response = await fetch(`http://localhost:5000/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }

      setFavorites(favorites.filter((favId) => favId !== id));
      localStorage.setItem('favorites', JSON.stringify(favorites.filter((favId) => favId !== id)));
      await fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (id) => {
    let updatedFavorites;
    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter((favId) => favId !== id);
    } else {
      updatedFavorites = [...favorites, id];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const toggleCurrentNoteFavorite = () => {
    if (!editingNoteId) return;
    toggleFavorite(editingNoteId);
  };

  const handleTagInputChange = (e) => {
    // Convert input to uppercase as the user types
    setTagInput(e.target.value.toUpperCase());
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        // Add the tag in uppercase
        setTags([...tags, newTag.toUpperCase()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const resetForm = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setError('');
    setCurrentView('write');
    setIsSpeaking(false);
    setSpeakingNoteId(null);
    window.speechSynthesis.cancel();
  };

  const handleSpeak = (content, noteId) => {
    if (speakingNoteId === noteId && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingNoteId(null);
      return;
    }

    if (!content) {
      setError('No content to read aloud.');
      return;
    }

    const div = document.createElement('div');
    div.innerHTML = DOMPurify.sanitize(content);
    const plainText = div.innerText || div.textContent;

    if (!plainText.trim()) {
      setError('No readable content found.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingNoteId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingNoteId(null);
    };
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setSpeakingNoteId(noteId);
  };

  // Convert tags to uppercase for the sidebar
  const allTags = [...new Set(notes.flatMap((note) => note.tags || []))];

  let displayedNotes = notes;
  if (currentView === 'favorites') {
    displayedNotes = notes.filter((note) => favorites.includes(note.id));
  } else if (currentView === 'recent') {
    displayedNotes = [...notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
  if (selectedTag) {
    displayedNotes = displayedNotes.filter((note) => (note.tags || []).includes(selectedTag));
  }

  const truncateContent = (content) => {
    const div = document.createElement('div');
    div.innerHTML = DOMPurify.sanitize(content);
    const plainText = div.innerText || div.textContent;
    if (plainText.length > 20) {
      return plainText.substring(0, 20) + '...';
    }
    return plainText;
  };

  const toggleTagsSection = () => {
    setIsTagsExpanded(!isTagsExpanded);
  };

  return (
    <div className="app-content">
      <div className="d-flex flex-grow-1">
        <Nav className="flex-column sidebar p-3" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <Nav.Link
            as={Link}
            to="/app"
            className={`sidebar-item ${currentView === 'write' ? 'active' : ''}`}
            style={currentView === 'write' ? { background: 'linear-gradient(45deg, #007bff, #0056b3)' } : {}}
            onClick={() => {
              setCurrentView('write');
              setSelectedTag(null);
            }}
          >
            <FontAwesomeIcon icon={faPen} className="mr-2" /> Write Note
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/app"
            className={`sidebar-item ${currentView === 'all' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('all');
              setSelectedTag(null);
            }}
          >
            <FontAwesomeIcon icon={faStickyNote} className="mr-2" /> All Notes <span className="badge badge-light">{notes.length}</span>
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/app"
            className={`sidebar-item ${currentView === 'favorites' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('favorites');
              setSelectedTag(null);
            }}
          >
            <FontAwesomeIcon icon={faStar} className="mr-2" /> Favorites <span className="badge badge-light">{favorites.length}</span>
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/app"
            className={`sidebar-item ${currentView === 'recent' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('recent');
              setSelectedTag(null);
            }}
          >
            <FontAwesomeIcon icon={faClock} className="mr-2" /> Recent
          </Nav.Link>
          <Nav.Link href="#referenced" className="sidebar-item">Referenced</Nav.Link>
          <div className="tags-section">
            <h6 className="sidebar-item tags-header" onClick={toggleTagsSection}>
              Tags
              <FontAwesomeIcon
                icon={isTagsExpanded ? faChevronDown : faChevronRight}
                className="ml-2"
              />
            </h6>
            {isTagsExpanded && (
              <>
                {allTags.length === 0 && <p className="text-muted small pl-3">No tags available.</p>}
                {allTags.map((tag) => (
                  <Nav.Link
                    key={tag}
                    as={Link}
                    to="/app"
                    className={`sidebar-item small ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedTag(tag);
                      setCurrentView('all');
                    }}
                  >
                    {tag}
                  </Nav.Link>
                ))}
              </>
            )}
          </div>
          <Nav.Link href="#export" className="sidebar-item text-purple">
            <FontAwesomeIcon icon={faFileExport} className="mr-2" /> Export Notes
          </Nav.Link>
          <Nav.Link href="#nextcloud" className="sidebar-item text-purple">
            <FontAwesomeIcon icon={faCloud} className="mr-2" /> NextCloud Sync
          </Nav.Link>
          <Nav.Link onClick={onLogout} className="sidebar-item mt-auto">
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Log Out
          </Nav.Link>
          <Nav.Link as={Link} to="/profile" className="sidebar-item">
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            {localStorage.getItem('username') || 'Guest'}
          </Nav.Link>
        </Nav>

        <div className="flex-grow-1 note-editor-container">
          <Routes>
            <Route path="/app" element={
              <>
                {currentView === 'write' ? (
                  <div className="note-editor card p-3 shadow-lg mb-3">
                    <input
                      type="text"
                      placeholder="Note title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="note-title"
                    />
                    <ReactQuill
                      value={content}
                      onChange={setContent}
                      modules={quillModules}
                      formats={quillFormats}
                      className="note-content mt-2"
                      placeholder="Write your note here..."
                    />
                    {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
                    <div className="action-bar mt-2 d-flex align-items-center">
                      <div className="tags-input-container flex-grow-1 mr-2">
                        <div className="d-flex flex-wrap mb-1">
                          {tags.map((tag) => (
                            <span key={tag} className="badge badge-black mr-1 mb-1">
                              {tag} <span className="ml-1 text-danger" onClick={() => removeTag(tag)}>×</span>
                            </span>
                          ))}
                        </div>
                        <FormControl
                          type="text"
                          placeholder="Add tags (separate with commas or spaces)..."
                          value={tagInput}
                          onChange={handleTagInputChange}
                          onKeyPress={handleTagInputKeyPress}
                          className="tag-input"
                        />
                      </div>
                      <Button
                        variant={isSpeaking && speakingNoteId === null ? "outline-danger" : "outline-primary"}
                        size="sm"
                        className="mr-2"
                        onClick={() => handleSpeak(content, null)}
                        disabled={!content}
                      >
                        <FontAwesomeIcon icon={isSpeaking && speakingNoteId === null ? faStop : faVolumeUp} />
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="mr-2"
                        onClick={toggleCurrentNoteFavorite}
                        disabled={!editingNoteId}
                      >
                        <FontAwesomeIcon icon={editingNoteId && favorites.includes(editingNoteId) ? faStarSolid : faStarRegular} />
                      </Button>
                      <Button variant="primary" onClick={handleSaveNote} className="save-button" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />}
                        {editingNoteId ? 'Update Note' : 'Save Note'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="notes-list">
                    <h3>
                      {currentView === 'favorites' ? 'Favorite Notes' : currentView === 'recent' ? 'Recent Notes' : selectedTag ? `Notes tagged with "${selectedTag}"` : 'All Notes'}
                    </h3>
                    {loading && <Spinner animation="border" />}
                    {!loading && displayedNotes.length === 0 && <p>No notes available.</p>}
                    {displayedNotes.map((note) => (
                      <div key={note.id} className="note-item card p-2 mb-2 shadow-sm">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h5>{note.title}</h5>
                            <p>{truncateContent(note.content)}</p>
                            <div>
                              {note.tags && note.tags.map((tag) => (
                                <span key={tag} className="badge badge-black mr-1">{tag}</span>
                              ))}
                            </div>
                            <small className="text-muted">
                              Last updated: {new Date(note.updated_at).toLocaleString()}
                            </small>
                          </div>
                          <div className="d-flex align-items-center">
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="mr-1"
                              onClick={() => toggleFavorite(note.id)}
                            >
                              <FontAwesomeIcon icon={favorites.includes(note.id) ? faStarSolid : faStarRegular} />
                            </Button>
                            <Button
                              variant={isSpeaking && speakingNoteId === note.id ? "outline-danger" : "outline-primary"}
                              size="sm"
                              className="mr-1"
                              onClick={() => handleSpeak(note.content, note.id)}
                            >
                              <FontAwesomeIcon icon={isSpeaking && speakingNoteId === note.id ? faStop : faVolumeUp} />
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="mr-1"
                              onClick={() => handleEditNote(note)}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            } />
            <Route path="/profile" element={<ProfilePage onLogout={onLogout} toggleTheme={toggleTheme} theme={theme} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState('light');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let interval;
    if (timerRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setTimerRunning(false);
      console.log('Pomodoro timer finished!');
    }
    return () => clearInterval(interval);
  }, [timerRunning, pomodoroTime]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startPauseTimer = () => {
    if (!timerRunning) {
      setPomodoroTime(customMinutes * 60);
    }
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setPomodoroTime(customMinutes * 60);
  };

  const incrementMinutes = () => {
    setCustomMinutes((prev) => {
      const newMinutes = prev + 1;
      setPomodoroTime(newMinutes * 60);
      return newMinutes;
    });
    setTimerRunning(false);
  };

  const decrementMinutes = () => {
    setCustomMinutes((prev) => {
      const newMinutes = Math.max(1, prev - 1);
      setPomodoroTime(newMinutes * 60);
      return newMinutes;
    });
    setTimerRunning(false);
  };

  const AppNavbar = () => (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
      <div className="navbar-content">
        <div className="app-title-container">
          <Navbar.Brand href="#home" className="app-title">
            NoteApp
          </Navbar.Brand>
        </div>
        <div className="search-container-wrapper">
          <Form inline className="search-form">
            <div className="search-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <FormControl
                type="text"
                placeholder="Search notes..."
                className="search-input"
              />
            </div>
          </Form>
        </div>
        <div className="timer-controls">
          <Button
            variant="outline-light"
            size="sm"
            className="timer-button"
            onClick={decrementMinutes}
          >
            −
          </Button>
          <span className="timer">{formatTime(pomodoroTime)}</span>
          <Button
            variant="outline-light"
            size="sm"
            className="timer-button"
            onClick={incrementMinutes}
          >
            +
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            className="timer-button"
            onClick={startPauseTimer}
          >
            <FontAwesomeIcon icon={timerRunning ? faPause : faPlay} />
          </Button>
          <Button
            variant="outline-light"
            size="sm"
            className="timer-button"
            onClick={resetTimer}
          >
            <FontAwesomeIcon icon={faRedo} />
          </Button>
        </div>
      </div>
    </Navbar>
  );

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={
              showSplash ? (
                <SplashScreen />
              ) : !isAuthenticated ? (
                <Navigate to="/login" />
              ) : (
                <Navigate to="/app" />
              )
            }
          />
          <Route path="/login" element={
            !isAuthenticated ? (
              <LoginPage onLogin={handleLogin} />
            ) : (
              <Navigate to="/app" />
            )
          } />
          <Route path="/register" element={
            !isAuthenticated ? (
              <RegisterPage />
            ) : (
              <Navigate to="/app" />
            )
          } />
          <Route path="/forgot-password" element={
            !isAuthenticated ? (
              <ForgotPasswordPage />
            ) : (
              <Navigate to="/app" />
            )
          } />
          <Route path="/reset-password" element={
            !isAuthenticated ? (
              <ResetPasswordPage />
            ) : (
              <Navigate to="/app" />
            )
          } />
          <Route path="/*" element={
            isAuthenticated ? (
              <>
                <AppNavbar />
                <MainApp onLogout={handleLogout} toggleTheme={toggleTheme} theme={theme} />
              </>
            ) : (
              <Navigate to="/login" />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;