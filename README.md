# Team Task Manager — Production-Grade SaaS

A Linear-inspired team task management platform with real-time collaboration, Kanban boards, and command-palette UX.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Zustand |
| Backend | Node.js, Express.js, MongoDB (Mongoose) |
| Auth | JWT (RS256), bcrypt |
| Real-time | Socket.IO |
| Caching | Redis (ioredis) — graceful fallback if unavailable |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — app works without it)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env     # edit values

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App opens at **http://localhost:5173**

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/          # DB + Redis connections
│   │   ├── controllers/     # Request handlers (MVC)
│   │   ├── middleware/       # Auth, validation, errors
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Redis cache, Socket.IO
│   │   └── utils/           # Helpers, constants, logger
│   └── server.js
└── frontend/
    └── src/
        ├── components/
        │   ├── CommandPalette/   # ⌘K palette
        │   ├── Dashboard/        # Stats + activity
        │   ├── Kanban/           # Drag-and-drop board
        │   ├── Layout/           # Sidebar, Navbar, AppLayout
        │   ├── Notifications/    # Real-time panel
        │   ├── Tasks/            # Task modal
        │   └── UI/               # Primitives
        ├── hooks/               # useKeyboard, useDebounce, useSocket
        ├── pages/               # Routes
        ├── services/            # API client, Socket
        ├── store/               # Zustand stores
        └── utils/               # Helpers, constants
```

---

## Key Features

### UX
- **Command palette** — `⌘K` for instant navigation + actions
- **Keyboard shortcuts** — `N` = new task, `Esc` = close
- **Drag-and-drop** Kanban with cross-column moves
- **Inline editing** in task modal — no page reloads
- **Skeleton loaders** everywhere (no spinners)
- **Micro-interactions** — hover elevation, press animations
- **Collapsible sidebar** with persistent state

### Backend
- **Redis caching** — dashboard stats (5 min TTL), auto-invalidated on writes
- **Rate limiting** — global (100 req/15m) + auth (20 req/15m)
- **Pagination** — all list endpoints
- **Input validation** — Joi schemas on every endpoint
- **Mongo sanitization** — prevents NoSQL injection
- **Indexed queries** — compound indexes on hot paths
- **Socket.IO rooms** — per-project and per-user

### Auth & Security
- JWT stored in localStorage (headers only, no cookies)
- bcrypt password hashing (cost 12)
- Role-based access: `admin` vs `member`
- Project-level access control

---

## API Reference

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/reorder
POST   /api/tasks/:id/comments

GET    /api/dashboard/stats
GET    /api/dashboard/my-tasks

GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

---

## Production Deployment

### Backend (Railway / Render / EC2)

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...  # Atlas URI
JWT_SECRET=<random 64-char string>
REDIS_HOST=<redis-cloud host>
CLIENT_URL=https://yourdomain.com
```

```bash
cd backend && npm start
```

### Frontend (Vercel / Netlify)

```bash
cd frontend && npm run build
# deploy dist/ folder
```

Set `VITE_API_URL` env var if your API isn't on the same domain (update `api.js` baseURL).

### Docker (optional)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## Performance Notes

- Dashboard stats cached in Redis, invalidated on task/project mutation
- MongoDB indexes: `email`, `project+status`, `project+order`, `assignee`, `createdAt desc`
- Text search index on task `title` + `description`
- N+1 avoided — Mongoose `.populate()` with field selection
- Frontend code-split by route + vendor chunks

---

## Socket.IO Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `project:join` | Client → Server | `projectId` |
| `task:created` | Server → Client | `{ task }` |
| `task:updated` | Server → Client | `{ task }` |
| `task:deleted` | Server → Client | `{ taskId }` |
| `task:reordered` | Server → Client | `{ tasks }` |
| `notification:new` | Server → Client | notification object |
