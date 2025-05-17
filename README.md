# PIXEL NOTES
A full-stack note-taking application featuring a Node.js/Express/PostgreSQL backend, Expo React Native mobile app, and React web frontend.
Table of Contents

Features

Tech Stack

Prerequisites

Environment Variables

Backend Setup

Mobile (React Native) Setup

Web (React) Setup

API Endpoints

Authentication Flow

Contributing



Features

User registration & login (JWT authentication)

Password reset via email (nodemailer)

Profile management (view, update, change password, delete account)

CRUD notes with tags, rich-text editor, color/font options, image & link insertion

Text-to-speech playback

Favorites, search, filter by tags, recent notes, and soft-deleted notes

Export notes to PDF or plain text

Tags navigation drawer

Light & dark themes

Pomodoro timer integrated in navbar

Tech Stack

Layer

Technologies

Backend

Node.js, Express, PostgreSQL (pg), bcrypt, JWT, nodemailer, dotenv

Mobile App

React Native (Expo), AsyncStorage, react-native-pell-rich-editor, react-native-color-picker, expo-speech, expo-image-picker

Web App

React, React Bootstrap, react-quill, DOMPurify, jsPDF, React Router, FontAwesome

Prerequisites

Node.js (v14+)

Yarn or npm

PostgreSQL database

Google/Gmail account for SMTP (app password)

Environment Variables

Create a .env file in the backend root:

DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
JWT_SECRET=your_jwt_secret
PORT=5000

Backend Setup

Install dependencies:

cd backend
npm install

Run database migrations / ensure tables exist:

users

notes

password_reset_tokens

Start server:

npm start

Mobile (React Native) Setup

Install Expo CLI globally:

npm install -g expo-cli

Install dependencies:

cd mobile-app
npm install

Configure config.js:

const BASE_URL = 'http://<backend-host>:5000';
export default BASE_URL;

Run on device/emulator:

expo start

Web (React) Setup

Install dependencies:

cd web-frontend
npm install

Configure backend URL in code (e.g., fetch('http://localhost:5000/...')).

Start development server:

npm start

API Endpoints

Auth

POST /register — Create user

POST /login — Authenticate, returns JWT

POST /forgot-password — Send reset link to email

POST /reset-password — Reset password with token

User

GET /profile — Get current user

PUT /profile — Update profile

POST /change-password — Change current password

DELETE /delete-account — Delete account

Notes

GET /notes — List active notes

POST /notes — Create note

PUT /notes/:id — Update note

DELETE /notes/:id — Soft-delete note

GET /recently-deleted — List trashed notes

DELETE /recently-deleted/:id — Permanently delete note

All note routes require Authorization: Bearer <token> header.

Authentication Flow

User registers or logs in to receive a JWT.

JWT stored in localStorage (web) or AsyncStorage (mobile).

Protected API calls include Authorization header.

Logout clears token and redirects to login.

Contributing

Fork the repo.

Create a feature branch: git checkout -b feature/YourFeature.

Commit your changes: git commit -m 'Add feature'.

Push to branch: git push origin feature/YourFeature.

Open a Pull Request.


