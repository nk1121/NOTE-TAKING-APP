import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Navbar, Nav, Form, FormControl, Button, Dropdown, DropdownButton, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import SplashScreen from './components/SplashScreen';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import './App.css';

const MainApp = ({ onLogout }) => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Select Category');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);

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

      await fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="app">
      <Navbar bg="dark" variant="dark" expand="lg" className="justify-content-between shadow-sm">
        <Navbar.Brand href="#home" className="d-flex align-items-center">
          <img src="https://via.placeholder.com/30" alt="User" className="rounded-circle mr-2" />
          {localStorage.getItem('username') || 'Demo User'}
        </Navbar.Brand>
        <Form inline>
          <FormControl type="text" placeholder="Search notes..." className="mr-sm-2 search-input" />
          <Button variant="outline-light" className="mr-2" onClick={onLogout}>Sign out</Button>
        </Form>
        <div className="timer-controls">
          <span className="timer">25:00</span>
          <Button variant="outline-light" size="sm" className="ml-2">-</Button>
          <Button variant="outline-light" size="sm" className="ml-1">+</Button>
          <Button variant="outline-light" size="sm" className="ml-1">▶</Button>
          <Button variant="outline-light" size="sm" className="ml-1">🔊</Button>
        </div>
      </Navbar>

      <div className="d-flex flex-grow-1">
        <Nav className="flex-column sidebar p-3" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <Nav.Link href="#write" className="active sidebar-item" style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)' }}>
            Write Note
          </Nav.Link>
          <Nav.Link href="#all-notes" className="sidebar-item">
            All Notes <span className="badge badge-light">{notes.length}</span>
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
          <Nav.Link href="#nextcloud" className="sidebar-item text-purple">NextCloud Sync</Nav.Link>
          <Nav.Link href="#export" className="sidebar-item text-purple">Export Notes</Nav.Link>
        </Nav>

        <div className="flex-grow-1 p-4 note-editor-container">
          <div className="note-editor card p-4 shadow-lg mb-4">
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
              className="note-content mt-3"
            />
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            <div className="d-flex justify-content-between align-items-center mt-3">
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
            <h3>All Notes</h3>
            {loading && <Spinner animation="border" />}
            {!loading && notes.length === 0 && <p>No notes available.</p>}
            {notes.map((note) => (
              <div key={note.id} className="note-item card p-3 mb-3 shadow-sm">
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
                  <div>
                    <Button variant="outline-primary" size="sm" className="mr-2" onClick={() => handleEditNote(note)}>
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
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  return (
    <Router>
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
        <Route path="/app" element={<MainApp onLogout={handleLogout} />} />
      </Routes>
    </Router>
  );
};

export default App;