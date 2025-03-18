import React, { useState } from 'react';
import { Navbar, Nav, Form, FormControl, Button, Dropdown, DropdownButton } from 'react-bootstrap';
import './App.css';

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Select Category');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');

  const handleSaveNote = () => {
    if (!title || !content) {
      setError('Please fill in both title and content.');
      return;
    }
    setError('');
    console.log({ title, content, category, tags });
    alert('Note saved successfully!');
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  return (
    <div className="app">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="justify-content-between shadow-sm">
        <Navbar.Brand href="#home" className="d-flex align-items-center">
          <img src="https://via.placeholder.com/30" alt="User" className="rounded-circle mr-2" />
          Demo User
        </Navbar.Brand>
        <Form inline>
          <FormControl type="text" placeholder="Search notes..." className="mr-sm-2 search-input" />
          <Button variant="outline-light" className="mr-2">Sign out</Button>
        </Form>
        <div className="timer-controls">
          <span className="timer">25:00</span>
          <Button variant="outline-light" size="sm" className="ml-2">-</Button>
          <Button variant="outline-light" size="sm" className="ml-1">+</Button>
          <Button variant="outline-light" size="sm" className="ml-1">▶</Button>
          <Button variant="outline-light" size="sm" className="ml-1">🔊</Button>
        </div>
      </Navbar>

      {/* Main Content */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <Nav className="flex-column sidebar p-3" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <Nav.Link href="#write" className="active sidebar-item" style={{ background: 'linear-gradient(45deg, #007bff, #0056b3)' }}>
            Write Note
          </Nav.Link>
          <Nav.Link href="#all-notes" className="sidebar-item">
            All Notes <span className="badge badge-light">0</span>
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

        {/* Note Editor */}
        <div className="flex-grow-1 p-4 note-editor-container">
          <div className="note-editor card p-4 shadow-lg">
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
            {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                {tags.map((tag) => (
                  <span key={tag} className="badge badge-secondary mr-1">{tag}</span>
                ))}
              </div>
              <div>
                <DropdownButton variant="secondary" title={category} size="sm" className="mr-2">
                  {['Work', 'Personal', 'Ideas', 'Important', 'Web Development', 'Databases', 'Mobile', 'Programming'].map((cat) => (
                    <Dropdown.Item key={cat} onClick={() => setCategory(cat)}>{cat}</Dropdown.Item>
                  ))}
                </DropdownButton>
                <Button variant="primary" onClick={handleSaveNote} className="save-button">
                  <i className="fas fa-save"></i> Save Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;