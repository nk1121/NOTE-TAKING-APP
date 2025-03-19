const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.connect((err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('Connected to PostgreSQL');
});

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Server error while registering user' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Server error while logging in' });
  }
});

// Forgot Password
app.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Generate a reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Send email with reset link
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: username,
      subject: 'Password Reset Request for Note-Taking App',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your Note-Taking App account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error('Error sending reset email:', err);
    res.status(500).json({ error: 'Server error while sending reset email' });
  }
});

// Reset Password
app.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const resetToken = result.rows[0];
    const userId = resetToken.user_id;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Server error while resetting password' });
  }
});

// Protect note routes with JWT
app.get('/notes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ error: 'Server error while fetching notes' });
  }
});

app.post('/notes', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const result = await pool.query(
      'INSERT INTO notes (title, content, tags) VALUES ($1, $2, $3) RETURNING *',
      [title, content, tags || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating note:', err);
    res.status(500).json({ error: 'Server error while creating note' });
  }
});

app.put('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
    const result = await pool.query(
      'UPDATE notes SET title=$1, content=$2, tags=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [title, content, tags || [], id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Server error while updating note' });
  }
});

app.delete('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM notes WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Server error while deleting note' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));