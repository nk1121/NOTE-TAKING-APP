\documentclass[a4paper,12pt]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{geometry}
\geometry{a4paper, margin=1in}
\usepackage{enumitem}
\usepackage{booktabs}
\usepackage{array}
\usepackage{multirow}
\usepackage{parskip}
\usepackage{amsmath}
\usepackage{amsfonts}
\usepackage{hyperref}
\hypersetup{colorlinks=true, linkcolor=blue, urlcolor=blue}
\usepackage{noto}
\renewcommand{\familydefault}{\sfdefault}

\begin{document}

\section*{Pixel Notes System Overview}
\subsection*{Features}
\begin{itemize}[leftmargin=*]
    \item User registration/login with JWT authentication
    \item Password reset via email (Nodemailer)
    \item Profile management: view, update, change password, delete account
    \item Note CRUD with rich-text editor, tags, color/font options, image/link insertion
    \item Text-to-Speech playback and Pomodoro timer
    \item Favorites, search, tag filtering, recent/soft-deleted notes
    \item Export notes to PDF/text; light/dark themes
\end{itemize}

\subsection*{Tech Stack}
\begin{tabular}{>{\raggedright\arraybackslash}p{3cm} >{\raggedright\arraybackslash}p{10cm}}
    \toprule
    \textbf{Layer} & \textbf{Technologies} \\
    \midrule
    Backend & Node.js, Express, PostgreSQL (pg), bcrypt, JWT, Nodemailer, dotenv \\
    Mobile App & React Native (Expo), AsyncStorage, react-native-pell-rich-editor, expo-speech \\
    Web App & React, React Bootstrap, react-quill, DOMPurify, jsPDF, React Router \\
    \bottomrule
\end{tabular}

\subsection*{Prerequisites}
\begin{itemize}[leftmargin=*]
    \item Node.js (v14+), Yarn/npm
    \item PostgreSQL database
    \item Gmail account with app password for SMTP
\end{itemize}

\subsection*{Environment Variables}
Create \texttt{.env} in backend root:
\begin{itemize}[leftmargin=*]
    \item \texttt{DB\_HOST}, \texttt{DB\_USER}, \texttt{DB\_PASSWORD}, \texttt{DB\_NAME}
    \item \texttt{EMAIL\_USER}, \texttt{EMAIL\_PASS}, \texttt{JWT\_SECRET}, \texttt{PORT=5000}
\end{itemize}

\subsection*{Backend Setup}
\begin{itemize}[leftmargin=*]
    \item Install: \texttt{cd backend; npm install}
    \item Ensure tables: users, notes, password\_reset\_tokens
    \item Start: \texttt{npm start}
\end{itemize}

\subsection*{Mobile (React Native) Setup}
\begin{itemize}[leftmargin=*]
    \item Install Expo CLI: \texttt{npm install -g expo-cli}
    \item Install: \texttt{cd mobile-app; npm install}
    \item Configure: Set \texttt{BASE\_URL} in \texttt{config.js}
    \item Run: \texttt{expo start}
\end{itemize}

\subsection*{Web (React) Setup}
\begin{itemize}[leftmargin=*]
    \item Install: \texttt{cd web-frontend; npm install}
    \item Configure: Set backend URL in API calls
    \item Start: \texttt{npm start}
\end{itemize}

\subsection*{API Endpoints}
\begin{itemize}[leftmargin=*]
    \item \textbf{Auth}: \texttt{POST /register}, \texttt{/login}, \texttt{/forgot-password}, \texttt{/reset-password}
    \item \textbf{User}: \texttt{GET/PUT /profile}, \texttt{POST /change-password}, \texttt{DELETE /delete-account}
    \item \textbf{Notes}: \texttt{GET/POST/PUT/DELETE /notes(/:id)}, \texttt{GET/DELETE /recently-deleted(/:id)}
    \item Note routes require \texttt{Authorization: Bearer <token>}
\end{itemize}

\subsection*{Authentication Flow}
\begin{itemize}[leftmargin=*]
    \item Register/login to receive JWT
    \item Store JWT in localStorage (web) or AsyncStorage (mobile)
    \item Include \texttt{Authorization} header for protected API calls
    \item Logout clears token, redirects to login
\end{itemize}

\subsection*{Contributing}
\begin{itemize}[leftmargin=*]
    \item Fork repo, create feature branch: \texttt{git checkout -b feature/YourFeature}
    \item Commit: \texttt{git commit -m 'Add feature'}
    \item Push: \texttt{git push origin feature/YourFeature}
    \item Submit Pull Request
\end{itemize}

\subsection*{License}
MIT License: Free to use and modify.

\end{document}
