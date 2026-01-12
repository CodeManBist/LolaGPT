# ChatBot Backend

A Node.js/Express backend for a ChatGPT-like application with user authentication, authorization, and rate limiting.

## Features

- User Authentication (Register, Login)
- JWT-based Authorization
- User Profile Management
- Password Management
- Thread-based Chat History with User Association
- Rate Limiting for Security
- CORS enabled
- Helmet for security headers
- Groq AI Integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Groq API Key

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatbot
JWT_SECRET=your_secure_secret_key
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
```

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Note: Make sure MongoDB is running before starting the server.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### User Management
- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update user profile (requires auth)
- `POST /api/user/change-password` - Change password (requires auth)

### Chat
- `POST /api/chat` - Send a chat message (requires auth)
- `GET /api/thread` - Get all user threads (requires auth)
- `GET /api/thread/:threadId` - Get specific thread (requires auth)
- `DELETE /api/thread/:threadId` - Delete thread (requires auth)

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Rate limiting on auth endpoints
- Rate limiting on API endpoints
- CORS configuration
- Helmet for security headers
- Input validation

## Project Structure

```
Backend/
├── models/
│   ├── User.js
│   └── Thread.js
├── routes/
│   ├── auth.js
│   ├── user.js
│   └── chat.js
├── middleware/
│   ├── auth.js
│   └── rateLimiter.js
├── utils/
│   ├── jwt.js
│   └── groqAi.js
└── server.js
