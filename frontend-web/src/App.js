import React, { useState, useEffect, useRef, memo } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Form, FormControl, Button, Alert, Spinner, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEdit, faTrash, faUser, faSearch, faPlay, faPause, faRedo, faStar as faStarSolid, faVolumeUp, faStop, faSignOutAlt, faChevronDown, faChevronRight, faPen, faStickyNote, faStar, faInfoCircle, faFileExport } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { jsPDF } from 'jspdf';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ProfilePage from './components/ProfilePage';
import './App.css';

// Memoize the React Quill component to prevent unnecessary re-renders
const MemoizedReactQuill = memo(ReactQuill, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.placeholder === nextProps.placeholder
  );
});

const MainApp = ({ onLogout, toggleTheme, theme }) => {
  const [notes, setNotes] = useState([]);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', tags: [] });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [currentView, setCurrentView] = useState('write');
  const [selectedTag, setSelectedTag] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingNoteId, setSpeakingNoteId] = useState(null);
  const [isTagsExpanded, setIsTagsExpanded] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const quillRef = useRef(null);
  const navigate = useNavigate();

  const colorPalette = [
    '#D4EFDF', '#FFFFCC', '#FFD1DC', '#E6E6FA', '#E0F7FA',
    '#00FF00', '#FFFF00', '#FF0000', '#800080', '#0000FF',
    '#008000', '#FFA500', '#FF4500', '#4B0082', '#00008B',
    '#FFFFFF', '#D3D3D3', '#808080', '#000000', '#2F4F4F',
  ];

  const toolbarContainer = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'strike'],
    [{ 'color': colorPalette }, { 'background': colorPalette }],
    ['link', 'code', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['blockquote'],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'align': [] }],
    ['clean'],
  ];

  const quillModules = {
    toolbar: {
      container: toolbarContainer,
    },
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'strike', 'color', 'background',
    'link', 'code', 'code-block', 'list', 'bullet', 'blockquote',
    'script', 'align',
  ];

  useEffect(() => {
    fetchNotes();
    fetchRecentlyDeleted();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const response = await fetch('http://localhost:5000/notes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notes');
      }

      const data = await response.json();
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

  const fetchRecentlyDeleted = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const response = await fetch('http://localhost:5000/recently-deleted', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recently deleted notes');
      }

      const data = await response.json();
      setRecentlyDeleted(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote.title || !currentNote.content) {
      setError('Please fill in both title and content.');
      setSuccessMessage('');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const method = editingNoteId ? 'PUT' : 'POST';
      const url = editingNoteId ? `http://localhost:5000/notes/${editingNoteId}` : 'http://localhost:5000/notes';
      const uppercaseTags = tags.map(tag => tag.toUpperCase());
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title: currentNote.title, content: currentNote.content, tags: uppercaseTags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingNoteId ? 'Failed to update note' : 'Failed to create note'));
      }

      const savedNote = await response.json();
      if (!editingNoteId) {
        setEditingNoteId(savedNote.id);
      }

      if (isFavorite && !favorites.includes(savedNote.id)) {
        const updatedFavorites = [...favorites, savedNote.id];
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      }

      await fetchNotes();
      setSuccessMessage('Note saved successfully!');
      setCurrentNote({ title: '', content: '', tags: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note.id);
    setCurrentNote({ title: note.title, content: note.content, tags: note.tags || [] });
    setIsFavorite(favorites.includes(note.id));
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
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete note');
      }

      setFavorites(favorites.filter((favId) => favId !== id));
      localStorage.setItem('favorites', JSON.stringify(favorites.filter((favId) => favId !== id)));
      setNotes(notes.filter((note) => note.id !== id));
      await fetchRecentlyDeleted();
      setCurrentView('recentlyDeleted');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const permanentDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to permanently delete this note?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found. Please log in again.');

      const response = await fetch(`http://localhost:5000/recently-deleted/${noteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to permanently delete note');
      }

      setRecentlyDeleted(recentlyDeleted.filter((note) => note.id !== noteId));
      setSuccessMessage('Note permanently deleted.');
    } catch (err) {
      setError(err.message);
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
    setIsFavorite(updatedFavorites.includes(id));
  };

  const toggleCurrentNoteFavorite = () => {
    if (editingNoteId) {
      toggleFavorite(editingNoteId);
    } else {
      setIsFavorite(!isFavorite);
    }
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value.toUpperCase());
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag.toUpperCase()]);
        setCurrentNote({ ...currentNote, tags: [...tags, newTag.toUpperCase()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    setCurrentNote({ ...currentNote, tags: updatedTags });
  };

  const resetForm = () => {
    setEditingNoteId(null);
    setCurrentNote({ title: '', content: '', tags: [] });
    setTags([]);
    setTagInput('');
    setError('');
    setSuccessMessage('');
    setIsFavorite(false);
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

  const showNoteId = (id) => {
    alert(`Note ID: ${id}`);
  };

  const handleExportNote = (format) => {
    if (!currentNote.title || !currentNote.content) {
      setError('Please fill in both title and content to export.');
      return;
    }

    const div = document.createElement('div');
    div.innerHTML = DOMPurify.sanitize(currentNote.content);
    const plainText = div.innerText || div.textContent;

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(currentNote.title, 10, 10);
      doc.setFontSize(12);
      doc.text(plainText, 10, 20);
      doc.save(`${currentNote.title || 'note'}.pdf`);
    } else if (format === 'text') {
      const blob = new Blob([`Title: ${currentNote.title}\n\n${plainText}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentNote.title || 'note'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const allTags = [...new Set(notes.flatMap((note) => note.tags || []))];

  let displayedNotes = notes;
  if (currentView === 'favorites') {
    displayedNotes = notes.filter((note) => favorites.includes(note.id));
  } else if (currentView === 'recentlyDeleted') {
    displayedNotes = recentlyDeleted;
  }
  if (selectedTag) {
    displayedNotes = displayedNotes.filter((note) => (note.tags || []).includes(selectedTag));
  }

  const truncateContent = (content) => {
    const div = document.createElement('div');
    div.innerHTML = DOMPurify.sanitize(content);
    const plainText = div.innerText || div.textContent;
    return plainText.length > 20 ? plainText.substring(0, 20) + '...' : plainText;
  };

  const toggleTagsSection = () => {
    setIsTagsExpanded(!isTagsExpanded);
  };

  return (
    <div className="main-app">
      <div className="sidebar">
        <ul className="sidebar-main">
          <li
            className={currentView === 'write' ? 'active' : ''}
            onClick={() => {
              setCurrentView('write');
              setSelectedTag(null);
              navigate('/app');
            }}
          >
            <FontAwesomeIcon icon={faPen} className="mr-2" /> Write Note
          </li>
          <li
            className={currentView === 'all' ? 'active' : ''}
            onClick={() => {
              setCurrentView('all');
              setSelectedTag(null);
              navigate('/app');
            }}
          >
            <FontAwesomeIcon icon={faStickyNote} className="mr-2" /> All Notes <span className="badge badge-light">{notes.length}</span>
          </li>
          <li
            className={currentView === 'favorites' ? 'active' : ''}
            onClick={() => {
              setCurrentView('favorites');
              setSelectedTag(null);
              navigate('/app');
            }}
          >
            <FontAwesomeIcon icon={faStar} className="mr-2" /> Favorites <span className="badge badge-light">{favorites.length}</span>
          </li>
          <li
            className={currentView === 'recentlyDeleted' ? 'active' : ''}
            onClick={() => {
              setCurrentView('recentlyDeleted');
              setSelectedTag(null);
              navigate('/app');
            }}
          >
            <FontAwesomeIcon icon={faTrash} className="mr-2" /> Recently Deleted <span className="badge badge-light">{recentlyDeleted.length}</span>
          </li>
          <li className="tags-header" onClick={toggleTagsSection}>
            Tags
            <FontAwesomeIcon
              icon={isTagsExpanded ? faChevronDown : faChevronRight}
              className="ml-2"
            />
          </li>
          {isTagsExpanded && allTags.map((tag) => (
            <li
              key={tag}
              className={`small ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => {
                setSelectedTag(tag);
                setCurrentView('all');
                navigate('/app');
              }}
            >
              {tag}
            </li>
          ))}
        </ul>
        <ul className="sidebar-footer">
          <li onClick={() => navigate('/profile')}>
            <FontAwesomeIcon icon={faUser} className="mr-2" /> {localStorage.getItem('username') || 'Guest'}
          </li>
          <li onClick={() => { localStorage.removeItem('token'); navigate('/login'); onLogout(); }}>
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Log Out
          </li>
        </ul>
      </div>

      <div className="content">
        <Routes>
          <Route path="/app" element={
            <>
              {currentView === 'write' ? (
                <div className="note-editor card p-3 shadow-lg mb-3">
                  <input
                    type="text"
                    placeholder="Note title"
                    value={currentNote.title}
                    onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                    className="note-title"
                  />
                  <MemoizedReactQuill
                    ref={quillRef}
                    value={currentNote.content}
                    onChange={(newContent) => setCurrentNote({ ...currentNote, content: newContent })}
                    modules={quillModules}
                    formats={quillFormats}
                    className="note-content mt-2"
                    placeholder="Write your note here..."
                    readOnly={false}
                    preserveWhitespace
                  />
                  {error && <Alert variant="danger" className="mt-2">{error}</Alert>}
                  {successMessage && <Alert variant="success" className="mt-2">{successMessage}</Alert>}
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
                      onClick={() => handleSpeak(currentNote.content, null)}
                      disabled={!currentNote.content}
                    >
                      <FontAwesomeIcon icon={isSpeaking && speakingNoteId === null ? faStop : faVolumeUp} />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="mr-2"
                      onClick={toggleCurrentNoteFavorite}
                    >
                      <FontAwesomeIcon icon={(editingNoteId && favorites.includes(editingNoteId)) || isFavorite ? faStarSolid : faStarRegular} />
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="outline-info"
                        size="sm"
                        className="mr-2"
                        id="exportDropdown"
                      >
                        <FontAwesomeIcon icon={faFileExport} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => handleExportNote('pdf')}>
                          Export as PDF
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleExportNote('text')}>
                          Export as Text
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                    <Button variant="primary" onClick={handleSaveNote} className="save-button" disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />}
                      {editingNoteId ? 'Update Note' : 'Save Note'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="notes-list">
                  <h2>
                    {currentView === 'favorites' ? 'Favorite Notes' :
                     currentView === 'recentlyDeleted' ? 'Recently Deleted' :
                     selectedTag ? `Notes tagged with "${selectedTag}"` : 'All Notes'}
                  </h2>
                  {loading && <Spinner animation="border" />}
                  {!loading && displayedNotes.length === 0 && <p>No notes available.</p>}
                  <ul>
                    {displayedNotes.map((note) => (
                      <li key={note.id} className="note-item card p-2 mb-2 shadow-sm">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h5>{note.title}</h5>
                            {currentView !== 'recentlyDeleted' ? (
                              <>
                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }} />
                                <div>
                                  {note.tags && note.tags.map((tag) => (
                                    <span key={tag} className="badge badge-black mr-1">{tag}</span>
                                  ))}
                                </div>
                                <small className="text-muted">
                                  Last updated: {new Date(note.updated_at).toLocaleString()}
                                </small>
                              </>
                            ) : (
                              <small className="text-muted">
                                Deleted: {new Date(note.deleted_at).toLocaleString()}
                              </small>
                            )}
                          </div>
                          <div className="d-flex align-items-center">
                            {currentView !== 'recentlyDeleted' ? (
                              <>
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
                                  className="mr-1"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  className="mr-1"
                                  onClick={() => showNoteId(note.id)}
                                  title="Show Note ID"
                                >
                                  <FontAwesomeIcon icon={faInfoCircle} />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => permanentDeleteNote(note.id)}
                              >
                                Permanently Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          } />
          <Route path="/profile" element={<ProfilePage onLogout={onLogout} toggleTheme={toggleTheme} theme={theme} />} />
        </Routes>
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