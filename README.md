# Team Task Manager

A production-ready, full-stack SaaS task management platform inspired by Linear. Built with React, Node.js, MongoDB, and Redis — featuring real-time collaboration, a command palette, drag-and-drop Kanban boards, and enterprise-grade security.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Deploying to Railway](#deploying-to-railway)
- [Socket.IO Events](#socketio-events)
- [Security](#security)
- [Project Structure](#project-structure)

---

## Overview

Team Task Manager is a collaborative project management tool that lets teams create projects, manage tasks across a Kanban board, assign work to members, and receive real-time notifications. It is designed to be self-hosted or deployed to cloud platforms like Railway with minimal configuration.

---

## Features

### Workspace and Projects
- Create and manage multiple projects with custom colors and emoji icons
- Add and remove team members with role-based access (admin / member)
- Project-level activity feed and statistics (total tasks, completion rate, overdue count)

### Task Management
- Tasks with title, description, priority (urgent / high / medium / low / none), status, due date, labels, assignee, and comments
- Auto-generated identifiers (e.g. `PROJ-42`) per project
- Inline editing — update any field without leaving the board
- Drag-and-drop Kanban columns: **Todo → In Progress → In Review → Done**
- Batch reorder persisted to the database for consistent ordering

### Real-Time Collaboration
- Socket.IO broadcasts task creates, updates, deletions, and Kanban reorders to every member in the same project room
- Typing indicators show which team member is currently editing a task
- Push notifications delivered in real time to the recipient's session

### Dashboard
- KPI cards: total tasks, completed tasks, overdue tasks, active projects
- Redis-cached stats (5-minute TTL) for fast repeated loads
- My Tasks list filtered to the authenticated user

### Command Palette
- Open with `Ctrl+K` / `Cmd+K` from anywhere in the app
- Navigate to projects, create tasks, search, or jump to settings instantly

### Notifications
- In-app notifications for task assignment, status changes, comments, and due-soon reminders
- Mark individual or all notifications as read
- Real-time delivery via Socket.IO

### Authentication and Security
- JWT Bearer token authentication (7-day expiration)
- Password hashing with bcryptjs (cost factor 12)
- Rate limiting: 100 req/15 min global, 20 req/15 min on auth routes
- NoSQL injection prevention via mongo-sanitize
- HTTP security headers via Helmet
- CORS origin whitelist

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Client state | Zustand (5 stores) |
| Animations | Framer Motion |
| Drag and drop | @dnd-kit |
| Charts | Recharts |
| HTTP client | Axios (auto JWT injection) |
| Real-time client | Socket.IO client |
| Backend framework | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Caching | Redis via ioredis, optional with graceful fallback |
| Real-time server | Socket.IO |
| Auth | JWT HS256 |
| Validation | Joi |
| Logging | Winston |
| Security | bcryptjs, Helmet, mongo-sanitize, express-rate-limit |

---

## Architecture

```
+-----------------------------------------------------+
|                     Browser                         |
|   React SPA (Vite)                                  |
|   +-- Zustand stores (auth, projects, tasks,        |
|   |   notifications, UI)                            |
|   +-- Axios  ->  REST API                           |
|   +-- Socket.IO client  ->  WebSocket               |
+--------------------+--------------------------------+
                     | HTTPS / WSS
+--------------------v--------------------------------+
|              Express API  (backend/)                |
|   +-- JWT auth middleware                           |
|   +-- Joi validation middleware                     |
|   +-- 6 route groups (44+ endpoints)               |
|   +-- Socket.IO server                              |
|   +-- Winston structured logging                    |
+----------+---------------------------+--------------+
           |                           |
+----------v----------+  +-------------v------------+
|   MongoDB Atlas     |  |   Redis (optional)        |
|   5 collections:    |  |   Dashboard stats cache   |
|   users, projects,  |  |   TTL: 5 minutes          |
|   tasks,            |  |   Graceful fallback to DB |
|   activities,       |  |   when unavailable        |
|   notifications     |  |                           |
+---------------------+  +---------------------------+
```

---

## Database Schema

### User

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | unique, indexed |
| password | String | bcrypt hashed, cost 12 |
| avatar | String | URL |
| role | Enum | `admin` or `member` |
| isActive | Boolean | soft-delete flag |
| lastSeen | Date | updated on auth |
| preferences | Object | theme, notifications, emailDigest |
| passwordChangedAt | Date | used to invalidate old JWTs |
| passwordResetToken | String | hashed reset token |
| passwordResetExpires | Date | reset token expiry |

Virtual: `initials` derived from name.

### Project

| Field | Type | Notes |
|---|---|---|
| name | String | required |
| description | String | |
| color | String | hex color |
| icon | String | emoji |
| status | Enum | `active`, `archived`, or `completed` |
| owner | User ref | |
| members | Array | `{ user: ref, role: admin or member }` |
| taskCount | Number | denormalized counter |
| completedTaskCount | Number | denormalized counter |
| identifier | String | unique slug, e.g. `PROJ` |

Indexes: `identifier` (unique), `owner`, `createdAt`.

### Task

| Field | Type | Notes |
|---|---|---|
| title | String | required, text-indexed |
| description | String | text-indexed |
| status | Enum | `todo`, `in_progress`, `in_review`, `done` |
| priority | Enum | `no_priority`, `urgent`, `high`, `medium`, `low` |
| project | Project ref | required |
| assignee | User ref | |
| creator | User ref | required |
| dueDate | Date | |
| completedAt | Date | set when status changes to done |
| labels | [String] | |
| order | Number | Kanban column position |
| identifier | String | e.g. `PROJ-42` |
| comments | [Object] | `{ author, content, createdAt }` |
| attachments | [Object] | `{ name, url, size, uploadedAt }` |

Virtual: `isOverdue` computed from dueDate vs now.
Indexes: `project+status`, `project+order`, `assignee`, `creator`, `dueDate`, full-text on `title+description`.

### Activity (Audit Log)

| Field | Type | Notes |
|---|---|---|
| type | Enum | task_created, task_updated, task_status_changed, task_assigned, task_deleted, task_comment, project_created, project_updated, member_added, member_removed |
| actor | User ref | who performed the action |
| project | Project ref | |
| task | Task ref | |
| meta | Mixed | extra context object |

### Notification

| Field | Type | Notes |
|---|---|---|
| recipient | User ref | target user |
| type | Enum | task_assigned, task_status_changed, task_due_soon, project_invitation, mention, task_comment |
| title | String | |
| message | String | |
| read | Boolean | |
| readAt | Date | |
| actor | User ref | who triggered it |
| project | Project ref | |
| task | Task ref | |
| link | String | action URL |

---

## API Reference

### Authentication `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create a new account |
| POST | `/login` | Login, returns JWT |
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile and preferences |

### Users `/api/users`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all active users |
| GET | `/:id` | Get a user by ID |
| PATCH | `/:id` | Update user (admin only) |

### Projects `/api/projects`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List projects (paginated) |
| POST | `/` | Create a project |
| GET | `/:id` | Get project details |
| PUT | `/:id` | Update project |
| DELETE | `/:id` | Delete project |
| GET | `/:id/stats` | Project KPIs |
| POST | `/:id/members` | Add a member |
| DELETE | `/:id/members/:userId` | Remove a member |

### Tasks `/api/tasks`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List tasks with filters (project, status, priority, assignee, search) and pagination |
| POST | `/` | Create a task |
| GET | `/:id` | Get task details |
| PATCH | `/:id` | Partial update for inline edits |
| PUT | `/:id` | Full replace update |
| DELETE | `/:id` | Delete task |
| POST | `/reorder` | Batch Kanban reorder |
| POST | `/:id/comments` | Add a comment |

### Dashboard `/api/dashboard`

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | KPI cards, Redis-cached with 5 min TTL |
| GET | `/my-tasks` | Tasks assigned to the current user |

### Notifications `/api/notifications`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List notifications with read/unread filter |
| PATCH | `/:id/read` | Mark one notification as read |
| PATCH | `/read-all` | Mark all notifications as read |
| DELETE | `/:id` | Delete a notification |

---

## Environment Variables

### Backend `backend/.env`

```env
# Application
NODE_ENV=production
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/team-task-manager

# JWT
JWT_SECRET=replace_with_a_long_random_string_at_least_32_chars
JWT_EXPIRES_IN=7d

# Redis (optional, app degrades gracefully without it)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# CORS — URL of your deployed frontend
CLIENT_URL=https://your-frontend.up.railway.app

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend `frontend/.env`

```env
VITE_API_URL=https://your-backend.up.railway.app/api
VITE_SOCKET_URL=https://your-backend.up.railway.app
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- Redis running locally (optional — the app falls back to the database if unavailable)

### 1 — Clone the repository

```bash
git clone https://github.com/your-org/team-task-manager.git
cd team-task-manager
```

### 2 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and set at minimum:

```
MONGODB_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=any_long_random_string
CLIENT_URL=http://localhost:5173
```

Install dependencies and start:

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3 — Configure the frontend

Open a new terminal:

```bash
cd frontend
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Install dependencies and start:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 4 — Register your first user

Open `http://localhost:5173` and click **Sign up**. To promote a user to admin, run this in the MongoDB shell:

```js
db.users.updateOne({ email: 'you@example.com' }, { $set: { role: 'admin' } })
```

---

## Deploying to Railway

Railway hosts both the backend and the frontend as separate services inside one project. Follow the steps below to get the full stack running.

### Prerequisites

- A [Railway](https://railway.app) account
- A [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster (M0 tier is enough to start)
- Your code pushed to a GitHub repository

---

### Step 1 — Create a new Railway project

1. Go to [railway.app](https://railway.app) and click **New Project**.
2. Select **Deploy from GitHub repo** and authorize Railway to access your account.
3. Select the `team-task-manager` repository.

You will add multiple services to this project in the following steps.

---

### Step 2 — Add a Redis service

1. Inside your Railway project dashboard click **+ New** → **Database** → **Add Redis**.
2. Railway provisions a managed Redis instance automatically.
3. Click the Redis service → **Variables** tab and copy the values for:
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`

You will paste these into the backend environment variables in Step 4.

---

### Step 3 — Deploy the backend service

1. Click **+ New** → **GitHub Repo** → select your repository.
2. When prompted for **Root Directory** enter:
   ```
   backend
   ```
3. Railway detects `package.json` and runs `npm install && npm start` automatically.
4. Rename this service to `backend` for clarity.

---

### Step 4 — Set backend environment variables

1. Click the `backend` service → **Variables** tab → **Raw Editor**.
2. Paste the following block and replace the placeholder values:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/team-task-manager?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_secure_random_string_minimum_32_characters
JWT_EXPIRES_IN=7d
REDIS_HOST=<value from Step 2>
REDIS_PORT=<value from Step 2>
REDIS_PASSWORD=<value from Step 2>
CLIENT_URL=https://PLACEHOLDER_update_after_frontend_deploy
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

3. Click **Save** — Railway deploys the backend.
4. Go to **Settings** → **Networking** → **Generate Domain**. Copy the domain (e.g. `backend-production-xxxx.up.railway.app`). You will need it for the frontend.

---

### Step 5 — Deploy the frontend service

1. Click **+ New** → **GitHub Repo** → select the same repository.
2. Set **Root Directory** to:
   ```
   frontend
   ```
3. Set **Build Command** to:
   ```
   npm run build
   ```
4. Set **Start Command** to:
   ```
   npx serve -s dist -l $PORT
   ```
   This serves the compiled Vite output as a static SPA and handles client-side routing correctly.
5. Rename the service to `frontend`.

---

### Step 6 — Set frontend environment variables

1. Click the `frontend` service → **Variables** tab → **Raw Editor**.
2. Paste the following, replacing `<backend-domain>` with the domain copied in Step 4:

```
VITE_API_URL=https://<backend-domain>/api
VITE_SOCKET_URL=https://<backend-domain>
```

3. Click **Save**.

---

### Step 7 — Update CORS on the backend

1. Go back to the `backend` service → **Variables**.
2. Update `CLIENT_URL` to your frontend Railway domain:
   ```
   CLIENT_URL=https://<frontend-domain>.up.railway.app
   ```
3. Click **Save** — Railway redeploys automatically.

---

### Step 8 — Verify the deployment

1. Open your frontend Railway URL in a browser.
2. Register a new account.
3. Create a project, add tasks, and confirm the Kanban board loads and drag-and-drop works.
4. Open browser DevTools → **Network** tab → filter by **WS** and confirm a WebSocket connection to the backend shows status `101 Switching Protocols`.

---

### Railway Service Summary

| Service | Root Directory | Purpose |
|---|---|---|
| `backend` | `backend/` | Express API + Socket.IO server |
| `frontend` | `frontend/` | React SPA built with Vite, served as static files |
| `Redis` | Railway managed | Dashboard stats cache |

---

### Optional: `railway.toml` for zero-config deploys

Create `backend/railway.toml`:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node server.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

Create `frontend/railway.toml`:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npx serve -s dist -l $PORT"
```

---

## Socket.IO Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `project:join` | client → server | `{ projectId }` | Subscribe to a project room |
| `task:created` | server → clients | task object | Broadcast new task to all room members |
| `task:updated` | server → clients | partial task | Broadcast task changes to all room members |
| `task:deleted` | server → clients | `{ taskId }` | Broadcast deletion to all room members |
| `task:reordered` | server → clients | reorder payload | Broadcast Kanban drag result |
| `notification:new` | server → client | notification object | Deliver to specific user only |
| `task:typing` | client ↔ server | `{ taskId, user }` | Show active editor indicator |

---

## Security

| Mechanism | Implementation |
|---|---|
| Password hashing | bcryptjs cost factor 12 |
| Authentication | JWT HS256, 7-day expiry |
| Token transport | `Authorization: Bearer` header only |
| Role enforcement | `restrictTo('admin')` middleware |
| Project access | Membership check on every route |
| Input validation | Joi schemas on every endpoint |
| NoSQL injection | mongo-sanitize on request body and params |
| Rate limiting | express-rate-limit, global + stricter on auth routes |
| HTTP headers | Helmet (CSP, X-Frame-Options, HSTS, etc.) |
| CORS | Allowlist via `CLIENT_URL` environment variable |
| Response compression | gzip via compression middleware |

---

## Project Structure

```
team-task-manager/
|
+-- backend/
|   +-- server.js                  HTTP server entry point
|   +-- .env.example               Environment variable template
|   +-- package.json
|   +-- railway.toml               optional Railway deploy config
|   +-- src/
|       +-- app.js                 Express app setup, middleware, routes
|       +-- config/
|       |   +-- database.js        Mongoose connection
|       |   +-- redis.js           ioredis client (optional)
|       +-- controllers/
|       |   +-- authController.js
|       |   +-- userController.js
|       |   +-- projectController.js
|       |   +-- taskController.js
|       |   +-- dashboardController.js
|       |   +-- notificationController.js
|       +-- middleware/
|       |   +-- auth.js            JWT verification, restrictTo()
|       |   +-- validation.js      Joi schema middleware
|       |   +-- errorHandler.js    Global error handler
|       |   +-- projectAccess.js   Membership guard
|       +-- models/
|       |   +-- User.js
|       |   +-- Project.js
|       |   +-- Task.js
|       |   +-- Activity.js
|       |   +-- Notification.js
|       +-- routes/
|       |   +-- auth.js
|       |   +-- users.js
|       |   +-- projects.js
|       |   +-- tasks.js
|       |   +-- dashboard.js
|       |   +-- notifications.js
|       +-- services/
|       |   +-- socketService.js   Socket.IO event handlers
|       |   +-- cacheService.js    Redis read/write helpers
|       +-- utils/
|           +-- logger.js          Winston config
|           +-- helpers.js
|           +-- constants.js
|
+-- frontend/
    +-- index.html
    +-- vite.config.js
    +-- tailwind.config.js
    +-- vercel.json                SPA rewrite rules
    +-- railway.toml               optional Railway deploy config
    +-- package.json
    +-- src/
        +-- main.jsx               React root
        +-- App.jsx                Router, auth guards, theme loader
        +-- pages/
        |   +-- Auth.jsx
        |   +-- Dashboard.jsx
        |   +-- Projects.jsx
        |   +-- ProjectDetail.jsx
        |   +-- Settings.jsx
        +-- components/
        |   +-- Layout/            Sidebar, Topbar, AppShell
        |   +-- Dashboard/         KPI cards, charts
        |   +-- Kanban/            Board, Column, TaskCard, DragOverlay
        |   +-- Tasks/             TaskModal, TaskList, filters
        |   +-- Notifications/     Bell, NotificationList
        |   +-- CommandPalette/    Ctrl+K search and actions
        |   +-- ui/                Button, Modal, Input, Badge, Avatar,
        |                          Select, Skeleton, Tooltip
        +-- hooks/
        |   +-- useKeyboard.js     Global shortcut handler
        |   +-- useDebounce.js
        |   +-- useSocket.js       Socket.IO lifecycle hook
        +-- services/
        |   +-- api.js             Axios instance and interceptors
        |   +-- socket.js          Socket.IO client singleton
        |   +-- mockData.js        Development fallback data
        +-- store/
        |   +-- authStore.js
        |   +-- projectStore.js
        |   +-- taskStore.js
        |   +-- notificationStore.js
        |   +-- uiStore.js
        +-- utils/
            +-- helpers.js
            +-- constants.js
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Open command palette |
| `N` | Create new task when palette is closed |
| `Esc` | Close modal or palette |
| `J` / `K` | Navigate list items |

---

## License

MIT
