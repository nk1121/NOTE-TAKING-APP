
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

// Set up CORS 
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Initialize PostgreSQL connection pool
const dbPool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

dbPool.connect((err) => {
  if (err) {
    console.error("Failed to connect to the database:", err);
  } else {
    console.log("Database connection established.");
  }
});

// Set up the email transporter
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware to verify JSON Web Tokens
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided. Access denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token is invalid." });
  }
}

// ===== USER ROUTES =====

// Registration route (unchanged)
app.post("/register", async (req, res) => {
  const { email, username, password, name, profile_picture, bio } = req.body;
  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ error: "Email, username, and password are required." });
  }

  if (username.length > 10) {
    return res
      .status(400)
      .json({ error: "Username must be 10 characters or less." });
  }

  try {
    const emailCheck = await dbPool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }
    const usernameCheck = await dbPool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: "Username already taken." });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const newUser = await dbPool.query(
      `INSERT INTO users (email, username, password, name, profile_picture, bio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, username, name, profile_picture, bio`,
      [
        email,
        username,
        hashedPwd,
        name || null,
        profile_picture || null,
        bio || null,
      ]
    );

    res
      .status(201)
      .json({ message: "Registration successful", user: newUser.rows[0] });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "An error occurred during registration." });
  }
});

// Login route (unchanged)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Both email and password are required." });
  }

  try {
    const userData = await dbPool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userData.rows.length === 0) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const user = userData.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "An error occurred during login." });
  }
});

// Forgot password route (unchanged)
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const userResult = await dbPool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await dbPool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, resetToken, tokenExpiry]
    );

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    const mailDetails = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Account Password",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password.</p>
        <p>Click the button below to proceed:</p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>This link is valid for 1 hour.</p>
        <p>If you didn't request this, please ignore the email.</p>
      `,
    };

    await mailer.sendMail(mailDetails);
    res.json({ message: "A password reset link has been sent to your email." });
  } catch (err) {
    console.error("Password reset email error:", err);
    res.status(500).json({ error: "Failed to send password reset email." });
  }
});

// Reset password route (unchanged)
app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token and new password are required." });
  }

  try {
    const tokenData = await dbPool.query(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
      [token]
    );

    if (tokenData.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    const { user_id } = tokenData.rows[0];
    const newHashedPwd = await bcrypt.hash(newPassword, 10);

    await dbPool.query("UPDATE users SET password = $1 WHERE id = $2", [
      newHashedPwd,
      user_id,
    ]);
    await dbPool.query("DELETE FROM password_reset_tokens WHERE token = $1", [
      token,
    ]);

    res.json({ message: "Your password has been updated." });
  } catch (err) {
    console.error("Reset password error:", err);
    res
      .status(500)
      .json({ error: "An error occurred while resetting the password." });
  }
});

// Change password route (unchanged)
app.post("/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current and new passwords must be provided." });
  }

  try {
    const userResult = await dbPool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userResult.rows[0];
    const passwordOk = await bcrypt.compare(currentPassword, user.password);
    if (!passwordOk) {
      return res
        .status(401)
        .json({ error: "The current password you entered is incorrect." });
    }

    const hashedNewPwd = await bcrypt.hash(newPassword, 10);
    await dbPool.query(
      "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2",
      [hashedNewPwd, user.id]
    );

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res
      .status(500)
      .json({ error: "An error occurred while changing your password." });
  }
});

// Profile retrieval route (unchanged)
app.get("/profile", verifyToken, async (req, res) => {
  try {
    const profileInfo = await dbPool.query(
      "SELECT id, email, username, name, profile_picture, bio FROM users WHERE id = $1",
      [req.user.id]
    );
    if (profileInfo.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(profileInfo.rows[0]);
  } catch (err) {
    console.error("Fetch profile error:", err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching profile details." });
  }
});

// Profile update route (unchanged)
app.put("/profile", verifyToken, async (req, res) => {
  const { email, username, name, profile_picture, bio } = req.body;
  if (!email || !username) {
    return res.status(400).json({ error: "Email and username are required." });
  }
  if (username.length > 10) {
    return res
      .status(400)
      .json({ error: "Username must be 10 characters or less." });
  }

  try {
    const emailTaken = await dbPool.query(
      "SELECT * FROM users WHERE email = $1 AND id != $2",
      [email, req.user.id]
    );
    if (emailTaken.rows.length) {
      return res.status(400).json({ error: "Email is already in use." });
    }
    const usernameTaken = await dbPool.query(
      "SELECT * FROM users WHERE username = $1 AND id != $2",
      [username, req.user.id]
    );
    if (usernameTaken.rows.length) {
      return res.status(400).json({ error: "Username is already in use." });
    }

    const updatedProfile = await dbPool.query(
      `UPDATE users SET email = $1, username = $2, name = $3, profile_picture = $4, bio = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, username, name, profile_picture, bio`,
      [
        email,
        username,
        name || null,
        profile_picture || null,
        bio || null,
        req.user.id,
      ]
    );

    res.json({
      message: "Profile updated successfully.",
      user: updatedProfile.rows[0],
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res
      .status(500)
      .json({ error: "An error occurred while updating profile." });
  }
});

// Delete account route (unchanged)
app.delete("/delete-account", verifyToken, async (req, res) => {
  try {
    const deletedUser = await dbPool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [req.user.id]
    );
    if (deletedUser.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Account deletion error:", err);
    res
      .status(500)
      .json({ error: "An error occurred while deleting account." });
  }
});

// ===== NOTES ROUTES =====

// Retrieve active notes (modified to exclude deleted notes)
app.get("/notes", verifyToken, async (req, res) => {
  try {
    const notes = await dbPool.query(
      "SELECT * FROM notes WHERE user_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC",
      [req.user.id]
    );
    res.status(200).json(notes.rows);
  } catch (err) {
    console.error("Fetch notes error:", err);
    res.status(500).json({ error: "An error occurred while fetching notes." });
  }
});

// Create a new note (unchanged)
app.post("/notes", verifyToken, async (req, res) => {
  const { title, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  try {
    const newNote = await dbPool.query(
      `INSERT INTO notes (user_id, title, content, tags, created_at, updated_at, deleted_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NULL)
       RETURNING *`,
      [req.user.id, title, content, tags || []]
    );
    res.status(201).json(newNote.rows[0]);
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ error: "An error occurred while creating note." });
  }
});

// Update an existing note (modified to check deleted_at)
app.put("/notes/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  try {
    const updatedNote = await dbPool.query(
      `UPDATE notes SET title = $1, content = $2, tags = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5 AND deleted_at IS NULL
       RETURNING *`,
      [title, content, tags || [], id, req.user.id]
    );
    if (updatedNote.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Note not found or access denied." });
    }
    res.status(200).json(updatedNote.rows[0]);
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ error: "An error occurred while updating note." });
  }
});

// Delete a note (modified for soft delete)
app.delete("/notes/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const softDeletedNote = await dbPool.query(
      "UPDATE notes SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING *",
      [id, req.user.id]
    );
    if (softDeletedNote.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Note not found or access denied." });
    }
    res
      .status(200)
      .json({
        message: "Note moved to recently deleted.",
        note: softDeletedNote.rows[0],
      });
  } catch (err) {
    console.error("Soft delete note error:", err);
    res.status(500).json({ error: "An error occurred while deleting note." });
  }
});

// NEW: Retrieve recently deleted notes
app.get("/recently-deleted", verifyToken, async (req, res) => {
  try {
    const deletedNotes = await dbPool.query(
      "SELECT * FROM notes WHERE user_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC",
      [req.user.id]
    );
    res.status(200).json(deletedNotes.rows);
  } catch (err) {
    console.error("Fetch recently deleted notes error:", err);
    res
      .status(500)
      .json({
        error: "An error occurred while fetching recently deleted notes.",
      });
  }
});

// NEW: Permanently delete a note from recently deleted
app.delete("/recently-deleted/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const permanentlyDeletedNote = await dbPool.query(
      "DELETE FROM notes WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL RETURNING *",
      [id, req.user.id]
    );
    if (permanentlyDeletedNote.rows.length === 0) {
      return res
        .status(404)
        .json({
          error: "Note not found in recently deleted or access denied.",
        });
    }
    res.status(200).json({ message: "Note permanently deleted." });
  } catch (err) {
    console.error("Permanent delete note error:", err);
    res
      .status(500)
      .json({ error: "An error occurred while permanently deleting note." });
  }
});

// ===== SERVER SETUP =====

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

