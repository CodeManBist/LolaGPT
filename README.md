# LolaGPT

A full-featured ChatGPT clone built with React, Node.js/Express, MongoDB, and Groq AI. Supports real-time streaming responses, multi-model selection, conversation threads, user authentication, and a responsive dark-themed UI.

## Features

- **Real-time streaming** — Server-Sent Events (SSE) for token-by-token AI responses
- **Multi-model support** — Switch between Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, and Gemma2 9B
- **JWT authentication** — Secure registration, login, profile management, and password changes
- **Thread management** — Create, rename, search, and delete conversation threads
- **Conversation context** — AI receives up to 20 previous messages for contextual replies
- **Code highlighting** — Syntax-highlighted code blocks with one-click copy
- **Chat export** — Download conversations as Markdown files
- **Responsive design** — Mobile-friendly with collapsible sidebar
- **Welcome screen** — Suggested prompts for new conversations
- **Rate limiting & security** — Helmet, CORS, rate limiting, input validation
- **Error boundary** — Graceful error handling in the frontend

## Project Structure

```
LolaGPT/
├── Backend/
│   ├── server.js              # Express entry point
│   ├── routes/
│   │   ├── auth.js            # Register & login
│   │   ├── user.js            # Profile & password
│   │   └── chat.js            # Chat, streaming, threads, search, models
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Thread.js          # Thread & messages schema
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   └── rateLimiter.js     # Rate limiting
│   └── utils/
│       ├── groqAi.js          # Groq API (standard + streaming)
│       └── jwt.js             # Token generation
├── Frontend/
│   ├── src/
│   │   ├── App.jsx            # Root with ErrorBoundary
│   │   ├── ChatWindow.jsx     # Main chat UI, streaming, model select
│   │   ├── Chat.jsx           # Message rendering, markdown, code blocks
│   │   ├── Sidebar.jsx        # Thread list, search, rename
│   │   ├── MyContext.jsx       # Chat state context
│   │   ├── services/api.js    # Centralized Axios API client
│   │   ├── context/AuthContext.jsx
│   │   ├── hooks/useAuth.js
│   │   └── components/        # Auth pages, UserProfile, ErrorBoundary
│   └── index.html
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB (local or hosted — e.g., MongoDB Atlas)
- [Groq API key](https://console.groq.com/)

## Getting Started

### Backend

```bash
cd Backend
npm install
cp .env.example .env    # Edit with your values
npm run dev             # Development with nodemon
```

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env    # Edit if backend is not on port 3000
npm run dev             # Vite dev server at http://localhost:5173
```

## Environment Variables

### Backend (`.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret for signing JWT tokens | — |
| `GROQ_API_KEY` | Groq AI API key | — |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

### Frontend (`.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |

### User (requires auth)
| Method | Path | Description |
|---|---|---|
| GET | `/api/user/profile` | Get profile |
| PUT | `/api/user/profile` | Update username/email |
| POST | `/api/user/change-password` | Change password |

### Chat (requires auth)
| Method | Path | Description |
|---|---|---|
| POST | `/api/chat/chat` | Send message (non-streaming) |
| POST | `/api/chat/chat/stream` | Send message (SSE streaming) |
| GET | `/api/chat/thread` | List all threads |
| GET | `/api/chat/thread/:threadId` | Get thread messages |
| DELETE | `/api/chat/thread/:threadId` | Delete a thread |
| PUT | `/api/chat/thread/:threadId` | Rename a thread |
| GET | `/api/chat/search?q=term` | Search threads |
| GET | `/api/chat/models` | List available AI models |

## Deployment

### Build Frontend
```bash
cd Frontend
npm run build    # Output in dist/
```

### Production Backend
```bash
cd Backend
NODE_ENV=production npm start
```

### Deployment Options
- **Frontend**: Vercel, Netlify, or any static hosting (serve `dist/`)
- **Backend**: Railway, Render, Fly.io, or a VPS with PM2
- **Database**: MongoDB Atlas (free tier available)

### Production Checklist
- [ ] Set strong `JWT_SECRET` (use `openssl rand -base64 32`)
- [ ] Set `FRONTEND_URL` to your deployed frontend URL
- [ ] Set `VITE_API_URL` to your deployed backend URL
- [ ] Ensure `.env` is in `.gitignore`
- [ ] Enable HTTPS

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Axios, React Markdown |
| Backend | Express 5, Mongoose 9, JWT, Helmet |
| AI | Groq API (Llama, Mixtral, Gemma) |
| Database | MongoDB |

## License

MIT

## Acknowledgements

- [Groq](https://groq.com/) for fast AI inference
- [React](https://react.dev/), [Express](https://expressjs.com/), [MongoDB](https://www.mongodb.com/), and all OSS dependencies
