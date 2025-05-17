# PixelNotes Application

A full-stack note-taking application featuring a Node.js/Express/PostgreSQL backend, Expo React Native mobile app, and React web frontend.

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Environment Variables](#environment-variables)
* [Backend Setup](#backend-setup)
* [Mobile (React Native) Setup](#mobile-react-native-setup)
* [Web (React) Setup](#web-react-setup)
* [API Endpoints](#api-endpoints)
* [Authentication Flow](#authentication-flow)
* [Contributing](#contributing)
* [License](#license)

## Features

* User registration & login (JWT authentication)
* Password reset via email (nodemailer)
* Profile management (view, update, change password, delete account)
* CRUD notes with tags, rich-text editor, color/font options, image & link insertion
* Text-to-speech playback
* Favorites, search, filter by tags, recent notes, and soft-deleted notes
* Export notes to PDF or plain text
* Tags navigation drawer
* Light & dark themes
* Pomodoro timer integrated in navbar

## Tech Stack

| Layer      | Technologies                                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| Backend    | Node.js, Express, PostgreSQL (pg), bcrypt, JWT, nodemailer, dotenv                                                          |
| Mobile App | React Native (Expo), AsyncStorage, react-native-pell-rich-editor, react-native-color-picker, expo-speech, expo-image-picker |
| Web App    | React, React Bootstrap, react-quill, DOMPurify, jsPDF, React Router, FontAwesome                                            |

## Prerequisites

* Node.js (v14+)
* Yarn or npm
* PostgreSQL database
* Google/Gmail account for SMTP (app password)

## Environment Variables

Create a `.env` file in the backend root:

```ini
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
JWT_SECRET=your_jwt_secret
PORT=5000
```

## Backend Setup

1. Install dependencies:

   ```bash
   cd backend
   npm install
   ```
2. Run database migrations / ensure tables exist:

   * `users`
   * `notes`
   * `password_reset_tokens`
3. Start server:

   ```bash
   npm start
   ```

## Mobile (React Native) Setup

1. Install Expo CLI globally:

   ```bash
   npm install -g expo-cli
   ```
2. Install dependencies:

   ```bash
   cd mobile-app
   npm install
   ```
3. Configure `config.js`:

   ```js
   const BASE_URL = 'http://<backend-host>:5000';
   export default BASE_URL;
   ```
4. Run on device/emulator:

   ```bash
   expo start
   ```

## Web (React) Setup

1. Install dependencies:

   ```bash
   cd web-frontend
   npm install
   ```
2. Configure backend URL in code (e.g., `fetch('http://localhost:5000/...')`).
3. Start development server:

   ```bash
   npm start
   ```

## API Endpoints

### Auth

* **POST** `/register` — Create user
* **POST** `/login` — Authenticate, returns JWT
* **POST** `/forgot-password` — Send reset link to email
* **POST** `/reset-password` — Reset password with token

### User

* **GET** `/profile` — Get current user
* **PUT** `/profile` — Update profile
* **POST** `/change-password` — Change current password
* **DELETE** `/delete-account` — Delete account

### Notes

* **GET** `/notes` — List active notes
* **POST** `/notes` — Create note
* **PUT** `/notes/:id` — Update note
* **DELETE** `/notes/:id` — Soft-delete note
* **GET** `/recently-deleted` — List trashed notes
* **DELETE** `/recently-deleted/:id` — Permanently delete note

*All note routes require `Authorization: Bearer <token>` header.*

## Authentication Flow

1. User registers or logs in to receive a JWT.
2. JWT stored in `localStorage` (web) or `AsyncStorage` (mobile).
3. Protected API calls include `Authorization` header.
4. Logout clears token and redirects to login.

## Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -m 'Add feature'`.
4. Push to branch: `git push origin feature/YourFeature`.
5. Open a Pull Request.

## License

This project is licensed under the MIT License. Feel free to use and modify.
