# CMP9134 — Robot Management System

A web-based Ground Control Station (GCS) for remotely monitoring and controlling the CMP9134 Virtual Robot.

**Module:** CMP9134 Software Engineering · University of Lincoln · 2025–2026

## Overview

The GCS connects to the Virtual Robot's REST + WebSocket API and provides:

- Real-time telemetry (battery, position, status) via WebSocket with polling fallback
- Navigation command interface on a 21 × 21 grid
- Visual indicators for `Connected` / `Reconnecting…` / `Signal Lost` and a `Low Battery` banner
- User registration + JWT-secured login
- Role-Based Access Control: `Viewer` (read-only) vs `Commander` (can move the robot)
- Persistent mission audit log (every command with user, role, target, outcome)
- Full Docker Compose deployment alongside the Virtual Robot container
- Unit + integration tests, GitHub Actions CI

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Bootstrap 5 |
| Backend | Node.js + Express + `ws` |
| Auth | bcryptjs (hashing) + jsonwebtoken (JWT, HS256) |
| HTTP client | axios (`robotClient.js` — Singleton + Facade + Observer) |
| Deployment | Docker + Docker Compose (3-service stack) |
| CI | GitHub Actions — Jest, ESLint, TS build, dockerised integration |

## Design patterns

| Pattern | Where it lives | Why |
|---|---|---|
| **Singleton** | `server/robotClient.js` | A single HTTP client to the robot; Node module cache + static slot enforce uniqueness. |
| **Facade** | `server/robotClient.js` | Hides HTTP headers, timeouts, retry/backoff, error mapping behind `getStatus / move / reset / getMap`. |
| **Observer** | `server/robotClient.js` (EventEmitter), `server/wsRelay.js`, `client/src/components/ToastHost.tsx` | Subscribers consume connection-state transitions and toast events without polling. |
| **Factory** | `server/users.js` (`createUser`), `server/auditLog.js` (`recordEntry`) | Canonical construction of validated user / audit-entry objects. |

See `docs/ARCHITECTURE.md` and `docs/UML_DIAGRAMS.md` for the full breakdown.

## Project layout

```
.
├── server/                  Express API + WebSocket relay
│   ├── app.js               Express factory (testable; mounts all routes)
│   ├── server.js            Production entry point (HTTP + WS bind)
│   ├── robotClient.js       Singleton/Facade/Observer client to the robot
│   ├── wsRelay.js           Browser ↔ robot WebSocket relay (JWT-gated)
│   ├── auth.js              JWT + static-token auth + RBAC middleware
│   ├── users.js             In-memory user store (bcrypt hashed)
│   ├── auditLog.js          In-memory mission audit log
│   ├── validation.js        Pure input validators (0–20 grid checks, roles)
│   ├── routes/auth.js       POST /api/register, POST /api/login
│   └── tests/               Jest suites — 30 tests across 5 files
├── client/                  React dashboard (Vite + TS)
│   ├── src/
│   │   ├── api/             http.ts, robot.ts, auth.ts
│   │   ├── auth/            AuthContext.ts, AuthProvider.tsx
│   │   ├── hooks/           useTelemetry.ts  (WS + polling fallback + retry)
│   │   ├── components/      Dashboard, Navbar, StatusBar, AlertBanners,
│   │   │                    GridMap, TelemetryPanel, MoveControl, AuditLog,
│   │   │                    Login, Register, RequireAuth, ToastHost
│   │   ├── App.tsx          React Router wiring
│   │   ├── App.css          Dark-theme styles ported from the prototype
│   │   └── types.ts
│   ├── Dockerfile           Multi-stage build + nginx runtime
│   └── nginx.conf           SPA + /api + /ws reverse-proxy
├── docker-compose.yml       robot + backend + frontend
├── docker-compose.test.yml  Adds a test-runner service for CI
└── .github/workflows/ci-tests.yml
```

## Running the system

### One-shot (Docker Compose)

```bash
docker compose up --build
```

This brings up three containers:

| Service | URL | Notes |
|---|---|---|
| `frontend` | http://localhost:3000 | React dashboard via nginx |
| `backend`  | http://localhost:5000 | Express + WebSocket relay |
| `robot`    | http://localhost:5050 | Virtual robot (exposed for direct inspection) |

Open http://localhost:3000, register a `Commander` account, and you're in.

### Local dev

```bash
# 1. Robot only
docker compose up robot

# 2. Backend
cd server && npm ci && npm start

# 3. Frontend (Vite dev server on :3000, proxies /api and /ws to :5000)
cd client && npm ci && npm run dev
```

## Authentication

| Endpoint | Body | Returns |
|---|---|---|
| `POST /api/register` | `{ username, password, role }` (role: `viewer` \| `operator`) | `{ token, username, role }` |
| `POST /api/login`    | `{ username, password }` | `{ token, username, role }` |

Bearer the returned JWT on every protected request: `Authorization: Bearer <token>`.

Two static demo tokens remain accepted for quick testing and the legacy unit tests: `viewer-token` and `operator-token`. Set `DISABLE_STATIC_TOKENS=1` to turn them off in production.

## Robot endpoints (proxied)

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/status` | JWT | Current telemetry (`id`, `position`, `battery`, `status`) |
| `GET /api/map` | JWT | 21×21 grid (0 = free, 1 = obstacle) |
| `POST /api/move` | JWT + `operator` | Body `{ x, y }`, 0 ≤ x,y ≤ 20. Audited. |
| `POST /api/reset` | JWT + `operator` | Resets the simulator. Audited. |
| `GET /api/audit` | JWT | Mission audit log |
| `WS /ws/telemetry?token=…` | JWT in query | 1 Hz telemetry stream |

## Resilience

- `robotClient.js` retries `getStatus / getMap / move / reset` with exponential backoff (250 ms → 4 s, capped) on 5xx / network errors. 4xx errors are not retried.
- It extends `EventEmitter` and broadcasts `connected` / `reconnecting` / `disconnected` events that the WebSocket relay forwards to clients.
- The browser hook `useTelemetry` prefers WebSocket; on disconnect it falls back to polling `/api/status` while a backoff timer retries the WebSocket. After 3 consecutive failures the UI shows **Signal Lost** and the last sample is labelled `(stale)`.

## Testing

```bash
# Backend (Jest, 30 tests across validation / api / auth / audit / robotClient)
cd server && npm test
cd server && npm run test:coverage

# Frontend (ESLint + TypeScript)
cd client && npm run lint && npm run build

# Dockerised integration
docker compose -f docker-compose.yml -f docker-compose.test.yml run --rm test-runner
```

## CI

`.github/workflows/ci-tests.yml` runs three jobs on every push and PR to `main`:

1. **backend** — Jest + coverage upload
2. **frontend** — ESLint + Vite production build
3. **integration** — Dockerised test runner against the real robot container

## GitHub Issues

User stories and tasks are tracked in [GitHub Issues](../../issues). See `docs/USER_STORIES.md` for the acceptance criteria each story is graded against.
