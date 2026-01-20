# LolaGPT

LolaGPT is a ChatGPT-like web application that combines a React frontend with a Node.js/Express backend and MongoDB persistence. The backend integrates with Groq AI (using the Llama family model in the example code) to generate assistant responses. The app supports user authentication, per-user chat threads, rate limiting and basic security hardening.

> NOTE: This README was generated from the repository structure and source files. Double-check/API keys and ports before running in production.

## Table of Contents

- [Features](#features)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting started (Backend)](#getting-started-backend)
- [Getting started (Frontend)](#getting-started-frontend)
- [Environment variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database models](#database-models)
- [Deployment notes & tips](#deployment-notes--tips)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Features

- User registration and login
- JWT-based authentication
- Thread-based chat history (per-user)
- Integration with Groq AI (chat completions)
- Rate limiting and Helmet security headers
- CORS configuration for frontend/backed separation
- React frontend with:
  - Chat UI and animated typing
  - Markdown rendering and syntax highlighting
  - Thread sidebar, profile settings, and logout

## Project structure

High-level layout:

- Frontend/ — React app (Vite-based; JSX entry at `Frontend/src/main.jsx`)
  - src/
    - App.jsx, ChatWindow.jsx, Chat.jsx, Sidebar.jsx, services/api.js, styles, etc.
- Backend/ — Node.js/Express server
  - server.js
  - routes/ (auth.js, user.js, chat.js)
  - models/ (User.js, Thread.js)
  - middleware/ (auth.js, rateLimiter.js)
  - utils/ (jwt.js, groqAi.js)

## Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- MongoDB (local or hosted)
- Groq API key (or another LLM provider key) — used by `Backend/utils/groqAi.js`

## Getting started (Backend)

1. Open a terminal and change to the backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create and configure `.env` (see [Environment variables](#environment-variables) below). You can copy the example:
   ```bash
   cp .env.example .env
   ```

4. Start the server (development):
   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```

Notes:
- The server uses `process.env.PORT` (default shown in code is 5000). If your frontend expects a different backend port (see `Frontend/src/ChatWindow.jsx` — the `API_BASE` constant is set to `http://localhost:8080/api/chat` in the current code), either:
  - Change `API_BASE` in the frontend to match your backend `PORT`, or
  - Start the backend on the port the frontend expects (e.g., set `PORT=8080` in `.env`).

## Getting started (Frontend)

1. Open a terminal and change to the frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the backend API base URL:
   - The frontend currently uses a hard-coded `API_BASE` constant in `Frontend/src/ChatWindow.jsx`:
     ```js
     const API_BASE = "http://localhost:8080/api/chat"
     ```
     Update that URL to match the backend server (for example `http://localhost:5000/api/chat`) or change the backend port to 8080 as noted above.
   - Optionally, refactor the frontend to use an environment variable (e.g., Vite `import.meta.env.VITE_API_BASE`) for easier configuration.

4. Start the frontend (Vite):
   ```bash
   npm run dev
   ```

5. Open the app in your browser (Vite default: `http://localhost:5173`).

## Environment variables

Backend `.env` (example):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lolagpt
JWT_SECRET=your_secure_secret_key
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
```

- PORT: port the backend server will bind to.
- MONGODB_URI: MongoDB connection string.
- JWT_SECRET: secret used to sign JWT tokens.
- FRONTEND_URL: allowed origin for CORS (set to your frontend development URL).
- GROQ_API_KEY: API key for Groq AI (keep secret!).

Frontend configuration:
- The repo currently uses a hard-coded API_BASE in `Frontend/src/ChatWindow.jsx`. Replace it with your backend base URL or change the backend port accordingly.

## API Endpoints

Authentication
- POST /api/auth/register — Register a new user
- POST /api/auth/login — Log in a user

User
- GET /api/user/profile — Get user profile (requires auth)
- PUT /api/user/profile — Update profile (requires auth)
- POST /api/user/change-password — Change password (requires auth)

Chat & Threads
- POST /api/chat — Send a chat message (requires auth). Body: `{ threadId, message }`
- GET /api/thread — Get all user threads (requires auth)
- GET /api/thread/:threadId — Get a specific thread (requires auth)
- DELETE /api/thread/:threadId — Delete a thread (requires auth)

Example: send a chat message (after obtaining JWT token):
```bash
curl -X POST "http://localhost:5000/api/chat" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"threadId":"<thread-id>", "message":"Hello LolaGPT!"}'
```

## Database models

Thread model (simplified):
- threadId: string (unique)
- userId: ObjectId -> User
- title: string
- messages: array of message objects
  - message: { role: "user" | "assistant", content: string, timestamp: Date }
- createdAt, updatedAt: Date

User model: typical email/password/username + hashed password and any profile fields (see `Backend/models/User.js` in the repo).

## Deployment notes & tips

- Keep your `GROQ_API_KEY` secret. Never commit `.env` to version control.
- For production, build frontend and serve it via a static host (Netlify, Vercel, S3+CloudFront) or serve from the backend (if coupling is desired).
- Use process managers (PM2, systemd) for backend process management.
- Use HTTPS and a secure cookie configuration (if using cookies).
- Consider using a more robust secret storage (AWS Secrets Manager, Vault) for API keys in production.
- If you expect high traffic, consider model usage limits or caching responses to reduce API costs.

## Security

- Passwords should be hashed (the backend uses bcryptjs).
- JWT is used for auth. Make sure to use a strong `JWT_SECRET`.
- Rate limiting and Helmet are already present in server.js/middleware to provide basic protection.
- Validate all input and sanitize where appropriate.

## Troubleshooting

- If assistant responses are empty or undefined, check `Backend/utils/groqAi.js`:
  - Ensure `GROQ_API_KEY` is set and valid.
  - Check the Groq API response structure before accessing `data.choices[0].message.content`.
- If the frontend cannot reach the backend:
  - Confirm ports and `API_BASE` in `Frontend/src/ChatWindow.jsx`.
  - Confirm backend `FRONTEND_URL` includes the frontend origin for CORS.

## Contributing

- Fork the repository and create feature branches for changes.
- Keep secrets out of commits.
- Open issues for bugs and feature requests, and create PRs for fixes.

Suggested improvements
- Extract `API_BASE` into environment variables for easier configuration.
- Add tests for core backend routes.
- Add CI (GitHub Actions) for linting and tests.
- Add better error handling & validation for Groq/LLM responses.

## License

No license file was detected in the repository. Consider adding a LICENSE (MIT, Apache-2.0, etc.) depending on your project goals. Example: add an `LICENSE` file with the MIT license if you want permissive open-source licensing.

## Acknowledgements

- Groq AI (used in `Backend/utils/groqAi.js`) — replace or configure as necessary based on your API provider and usage policy.
- React, Express, MongoDB and the other OSS libraries used in this project.