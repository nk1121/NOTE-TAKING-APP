import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import { Navbar, Nav, Form, FormControl, Button, Dropdown, DropdownButton, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEdit, faTrash, faUser, faFileExport, faCloud, faSearch, faPlay, faPause, faRedo, faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ProfilePage from './components/ProfilePage';
import './App.css';

const MainApp = ({ onLogout, toggleTheme, theme }) => {
  const [notes, setNotes] = useState([]);
  const [favorites, setFavorites] = useState([]); // State to track favorite notes
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Select Category');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [currentView, setCurrentView] = useState('all'); // State to track the current view (all or favorites)

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      setNotes(data);
      // Load favorites from localStorage or backend if implemented
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
      const method = editingNoteId ? 'PUT' : 'POST';
      const url = editingNoteId ? `http://localhost:5000/notes/${editingNoteId}` : 'http://localhost:5000/notes';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, tags }),
      });

      if (!response.ok) throw new Error(editingNoteId ? 'Failed to update note' : 'Failed to create note');

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
    setTags(note.tags || []);
    setCategory('Select Category');
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete note');

      // Remove from favorites if it was favorited
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

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
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
    setCategory('Select Category');
    setError('');
  };

  const displayedNotes = currentView === 'favorites' ? notes.filter((note) => favorites.includes(note.id)) : notes;

  return (
    <div className="app-content">
      <div className="d-flex flex-grow-1">
        <Nav className="flex-column sidebar p-3" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <Nav.Link as={Link} to="/app" className="active sidebar-item" style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)' }}>
            Write Note
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/app"
            className={`sidebar-item ${currentView === 'all' ? 'active' : ''}`}
            onClick={() => setCurrentView('all')}
          >
            All Notes <span className="badge badge-light">{notes.length}</span>
          </Nav.Link>
          <Nav.Link
            as={Link}
            to="/app"
            className={`sidebar-item ${currentView === 'favorites' ? 'active' : ''}`}
            onClick={() => setCurrentView('favorites')}
          >
            Favorites <span className="badge badge-light">{favorites.length}</span>
          </Nav.Link>
          <Nav.Link href="#recent" className="sidebar-item text-success">Recent</Nav.Link>
          <Nav.Link href="#referenced" className="sidebar-item text-danger">Referenced</Nav.Link>
          <Dropdown>
            <Dropdown.Toggle variant="dark" id="dropdown-tags" className="w-100 text-left sidebar-item">
              Tags
            </Dropdown.Toggle>
            <Dropdown.Menu className="bg-dark text-white">
              <div className="p-2">
                <FormControl
                  type="text"
                  placeholder="Add new tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="mb-2"
                />
                <Button variant="primary" size="sm" onClick={addTag}>+</Button>
              </div>
              {['Work', 'Personal', 'Ideas', 'Important', 'Web Development', 'Databases', 'Mobile', 'Programming'].map((tag) => (
                <Dropdown.Item key={tag} className="text-white">
                  {tag} <span className="text-danger">×</span>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Nav.Link href="#export" className="sidebar-item text-purple">
            <FontAwesomeIcon icon={faFileExport} className="mr-2" /> Export Notes
          </Nav.Link>
          <Nav.Link href="#nextcloud" className="sidebar-item text-purple">
            <FontAwesomeIcon icon={faCloud} className="mr-2" /> NextCloud Sync
          </Nav.Link>
          <Nav.Link as={Link} to="/profile" className="sidebar-item mt-auto">
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            {localStorage.getItem('username') || 'Guest'}
          </Nav.Link>
        </Nav>

        <div className="flex-grow-1 note-editor-container">
          <Routes>
            <Route path="/app" element={
              <>
                <div className="note-editor card p-3 shadow-lg mb-3">
                  <input
                    type="text"
                    placeholder="Note title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="note-title"
                  />
                  <div className="editor-options mt-2">
                    <DropdownButton variant="secondary" title="Normal" size="sm" className="mr-2">
                      <Dropdown.Item>Normal</Dropdown.Item>
                      <Dropdown.Item>Heading</Dropdown.Item>
                    </DropdownButton>
                    <DropdownButton variant="secondary" title="White" size="sm" className="mr-2">
                      <Dropdown.Item>White</Dropdown.Item>
                      <Dropdown.Item>Dark</Dropdown.Item>
                    </DropdownButton>
                    <Button variant="light" size="sm" className="mr-1">B</Button>
                    <Button variant="light" size="sm" className="mr-1">I</Button>
                    <Button variant="light" size="sm" className="mr-1">U</Button>
                    <Button variant="light" size="sm"><span role="img" aria-label="link">🔗</span></Button>
                  </div>
                  <textarea
                    placeholder="Write your note here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="note-content mt-2"
                  />
                  {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div>
                      {tags.map((tag) => (
                        <span key={tag} className="badge badge-secondary mr-1">
                          {tag} <span className="ml-1 text-danger" onClick={() => removeTag(tag)}>×</span>
                        </span>
                      ))}
                    </div>
                    <div>
                      <DropdownButton variant="secondary" title={category} size="sm" className="mr-2">
                        {['Work', 'Personal', 'Ideas', 'Important', 'Web Development', 'Databases', 'Mobile', 'Programming'].map((cat) => (
                          <Dropdown.Item key={cat} onClick={() => setCategory(cat)}>{cat}</Dropdown.Item>
                        ))}
                      </DropdownButton>
                      <Button variant="primary" onClick={handleSaveNote} className="save-button" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />}
                        {editingNoteId ? 'Update Note' : 'Save Note'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="notes-list">
                  <h3>{currentView === 'favorites' ? 'Favorite Notes' : 'All Notes'}</h3>
                  {loading && <Spinner animation="border" />}
                  {!loading && displayedNotes.length === 0 && <p>No notes available.</p>}
                  {displayedNotes.map((note) => (
                    <div key={note.id} className="note-item card p-2 mb-2 shadow-sm">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h5>{note.title}</h5>
                          <p>{note.content}</p>
                          <div>
                            {note.tags.map((tag) => (
                              <span key={tag} className="badge badge-secondary mr-1">{tag}</span>
                            ))}
                          </div>
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
                          <Button variant="outline-primary" size="sm" className="mr-1" onClick={() => handleEditNote(note)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteNote(note.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes in seconds
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
    return `${minutes} min ${remainingSeconds.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startPauseTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setPomodoroTime(customMinutes * 60);
  };

  const incrementMinutes = () => {
    setCustomMinutes((prev) => prev + 1);
    setPomodoroTime((prev) => prev + 60);
    setTimerRunning(false);
  };

  const decrementMinutes = () => {
    setCustomMinutes((prev) => Math.max(1, prev - 1));
    setPomodoroTime((prev) => Math.max(60, prev - 60));
    setTimerRunning(false);
  };

  return (
    <Router>
      <div className="app">
        {isAuthenticated && (
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
        )}
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
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/*" element={<MainApp onLogout={handleLogout} toggleTheme={toggleTheme} theme={theme} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;