# AI Query Assistant

A full-stack AI chat application powered by Google Gemini, with real-time streaming responses, persistent chat history, and a clean dark/light UI.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=flat&logo=google&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## Features

- **Real-time streaming** — responses stream token-by-token like ChatGPT
- **Markdown rendering** — code blocks with syntax highlighting, tables, lists
- **Persistent chat history** — conversations saved per user in MongoDB, with a sidebar to browse and manage chats
- **JWT authentication** — register/login with bcrypt-hashed passwords
- **Dark / light mode** — toggle with preference saved to localStorage
- **Copy to clipboard** — one-click copy on any AI response
- **Response time** — displayed below each AI message
- **Rate limiting** — 15 queries/min, 20 auth requests/15min
- **Pre-commit hooks** — TypeScript, ESLint, and full test suite run before every commit
- **CI/CD** — GitHub Actions runs lint + tests + build on every push

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB + Mongoose |
| AI | Google Gemini (`@google/genai`) |
| Auth | JWT + bcrypt |
| Testing | Jest + Supertest (backend), Vitest + RTL (frontend) |
| DevOps | Docker, Docker Compose, GitHub Actions, Husky |

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌──────────────┐
│   React + Vite  │ ──SSE──▶│  Express + TypeScript │ ───────▶│   MongoDB    │
│   (port 3000)   │◀── JWT ─│      (port 5000)      │         │  (port 27017)│
└─────────────────┘         └──────────────────────┘         └──────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │   Google Gemini   │
                              │  (Streaming API)  │
                              └──────────────────┘
```

## Getting Started

### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/HighKage93/ai-query-assistant.git
cd ai-query-assistant

cp .env.example .env
# Edit .env and add your GEMINI_API_KEY and JWT_SECRET

docker-compose up --build
```

Open [http://localhost:3000](http://localhost:3000)

### Option B — Manual Setup

**Prerequisites:** Node.js 20+, MongoDB running locally

```bash
git clone https://github.com/HighKage93/ai-query-assistant.git
cd ai-query-assistant
```

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in GEMINI_API_KEY and JWT_SECRET
npm install
npm run dev
```

**Frontend** (new terminal):
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key | — |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.5-flash-lite` |
| `JWT_SECRET` | Secret for signing JWT tokens | — |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/ai-query-assistant` |
| `PORT` | Backend port | `5000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (production only, e.g. `https://your-app.railway.app`) |

## Deployment

### Frontend → Vercel

1. Import `HighKage93/ai-query-assistant` in Vercel
2. Set **Root Directory** → `frontend`
3. Add env var: `VITE_API_URL=https://your-railway-backend.up.railway.app`

### Backend → Railway

1. New project → Deploy from GitHub → `HighKage93/ai-query-assistant`
2. Set **Root Directory** → `backend`
3. Add env vars: `GEMINI_API_KEY`, `JWT_SECRET`, `MONGO_URI` (from Atlas), `FRONTEND_URL` (your Vercel URL)

### Database → MongoDB Atlas

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Get the connection string → set as `MONGO_URI` in Railway

## Running Tests

```bash
# Backend (Jest + Supertest)
cd backend && npm test

# Frontend (Vitest + React Testing Library)
cd frontend && npm test
```

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| POST | `/api/query` | Bearer | Stream AI response (SSE) |
| GET | `/api/chats` | Bearer | List all user chats |
| GET | `/api/chats/:id` | Bearer | Get chat with messages |
| DELETE | `/api/chats/:id` | Bearer | Delete a chat |
| GET | `/health` | No | Health check |

## License

MIT
