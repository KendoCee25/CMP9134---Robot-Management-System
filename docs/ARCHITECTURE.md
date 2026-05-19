# Architecture — Robot Management System


## 1. Chosen tech stack

| Layer | Technology | Notes |
|---|---|---|
| User Interface | React 19 + TypeScript + Vite | Dark-themed Bootstrap 5 dashboard |
| Backend | Node.js + Express | HTTP API + WebSocket relay |
| Authentication | bcryptjs + jsonwebtoken (HS256) | JWT bearer tokens, 12 h TTL |
| Data store | MongoDB via Mongoose | `User` and `MissionLog` collections |
| Robot client | `axios` (in `server/robotClient.js`) | Retry/backoff + EventEmitter |
| Telemetry transport | WebSocket (`/ws/telemetry`) + polling fallback | Relayed by backend |
| Deployment | Docker + Docker Compose | 4 services: mongo, robot, backend, frontend |
| Virtual Robot | Pre-built Docker image | Provided by module — Flask + WS |

---

## 2. Architectural pattern

The Ground Control Station follows a **hybrid Layered + MVC architecture**.

**MVC mapping:**

| MVC Role | Technology | Responsibility |
|---|---|---|
| **View** | React SPA | Renders telemetry, 2D grid, command form, alerts, audit log |
| **Controller** | Express route handlers + middleware | Validates input, enforces RBAC, orchestrates robot calls + persistence |
| **Model** | Mongoose schemas (`User`, `MissionLog`) | Persists user credentials and the immutable mission log |

**Layered mapping (top → bottom):**

| Layer | Components | Responsibility |
|---|---|---|
| **UI** | `client/src/components/**` + `useTelemetry` hook | Presents live telemetry, captures operator commands, owns transport-state UX |
| **Business Logic** | `server/app.js`, `routes/auth.js`, `auth.js`, `validation.js`, `wsRelay.js`, `robotClient.js` | Auth, RBAC, validation, outbound robot calls, WS relay |
| **Data Access** | `server/models/User.js`, `server/models/MissionLog.js`, `server/db.js` | All Mongo reads/writes |
| **System** | MongoDB, Virtual Robot container, Docker Compose | Infrastructure |

---

## 3. Layered architecture diagram

![3 layered architecture diagram](diagrams/architecture/01-3-layered-architecture-diagram.png)

---

## 4. Design patterns in use

| Pattern | File(s) | Role |
|---|---|---|
| **Singleton** | `server/robotClient.js` | One client to the robot per process; enforced via static slot + Node module cache. |
| **Facade** | `server/robotClient.js` | Hides HTTP headers, timeouts, retry/backoff, and error mapping behind `getStatus / move / reset / getMap`. |
| **Observer** | `server/robotClient.js` (extends `EventEmitter`), `server/wsRelay.js`, `client/src/components/ToastHost.tsx` | The client emits `connected / reconnecting / disconnected` events; the WS relay and toast bus broadcast to subscribers without polling. |
| **Factory** | `server/users.js` (`createUser`), `server/auditLog.js` (`recordEntry`) | Canonical construction of validated user and audit-entry documents. |
| **State machine** | `client/src/hooks/useTelemetry.ts` | `connecting → connected → reconnecting → lost` with WS-primary, polling-fallback, exponential-backoff retry. |

---

## 5. Resilience strategy

Per the brief: the robot API simulates latency and dropouts; the UI must never freeze. Two cooperating layers:

**Server-side (`robotClient.js`):**
- Exponential backoff: 250 ms → 4 s, capped.
- Retries only 5xx / network errors / timeouts — never 4xx (validation faults are not transient).
- Emits `connected / reconnecting / disconnected` state events. The WS relay subscribes and broadcasts to clients.

**Client-side (`useTelemetry.ts`):**
- Primary: WebSocket to `/ws/telemetry` (1 Hz push).
- Fallback: HTTP polling `/api/status` after WS close, with the WS retried on exponential backoff (1 s → 30 s).
- After `LOST_THRESHOLD = 3` consecutive failures the UI shows **Signal Lost**; the last sample is labelled `(stale)`.

---

## 6. Authentication & RBAC

- Passwords hashed with **bcryptjs** (10 salt rounds) before persistence in `User`.
- `POST /api/login` returns a signed JWT (HS256, 12 h TTL) with payload `{ sub: <username>, role: viewer | operator }`.
- `authenticate` middleware verifies the JWT or, for the existing unit tests and quick curl checks, the two static demo tokens (`viewer-token`, `operator-token`). Static tokens can be disabled with `DISABLE_STATIC_TOKENS=1`.
- `requireOperator` middleware enforces commander-only routes (`/api/move`, `/api/reset`).
- The frontend `RequireAuth` guard redirects unauthenticated users to `/login`; the role flag in the JWT decoded inside `AuthContext` is what hides the Commander panel for viewers.

---

## 7. Mission audit log

Every command — successful or failed — appends a `MissionLog` document with `{ timestamp, username, role, command, target, outcome, detail }`. Documents are append-only at the application layer (the dashboard reads but never mutates). Stored in MongoDB with an index on `timestamp` for newest-first pagination.

---

## 8. Project folder structure

```
CMP9134---Robot-Management-System/
├── client/                              ← React SPA (Vite + TS)
│   ├── src/
│   │   ├── api/                         ← http.ts, robot.ts, auth.ts
│   │   ├── auth/                        ← AuthContext.ts, AuthProvider.tsx
│   │   ├── hooks/useTelemetry.ts        ← WS + polling state machine
│   │   ├── components/                  ← Dashboard, GridMap, MoveControl, …
│   │   └── App.tsx                      ← React Router wiring
│   ├── Dockerfile + nginx.conf
│   └── package.json
│
├── server/                              ← Express API (Node.js)
│   ├── app.js                           ← Express factory (testable)
│   ├── server.js                        ← Process entry (HTTP + WS bind)
│   ├── robotClient.js                   ← Singleton + Facade + Observer
│   ├── wsRelay.js                       ← WS upgrade + robot WS relay
│   ├── auth.js                          ← JWT + RBAC middleware
│   ├── users.js                         ← bcrypt-hashed user CRUD
│   ├── auditLog.js                      ← Mission audit append/list
│   ├── validation.js                    ← Pure input validators
│   ├── db.js                            ← Mongoose connect helper
│   ├── models/                          ← User.js, MissionLog.js
│   ├── routes/auth.js                   ← register / login
│   └── tests/                           ← Jest suites + globalSetup (Mongo)
│
├── docker-compose.yml                   ← mongo + robot + backend + frontend
├── docker-compose.test.yml              ← CI integration overlay
└── .github/workflows/ci-tests.yml       ← backend + frontend + integration
```

---

## 9. Why this architecture?

- **Separation of concerns** — the dashboard never talks to MongoDB; Express never renders HTML; each layer has one job.
- **Replaceability** — the React SPA could be swapped for a mobile client without touching the API; MongoDB could be swapped for PostgreSQL by rewriting only the two Mongoose models.
- **Security** — RBAC lives in the Express middleware; the React UI cannot bypass it by manipulating client state. JWTs are signed and verified on every protected request.
- **Testability** — `robotClient`, `validation`, and the Mongoose-backed stores can each be exercised in isolation. Jest covers the backend; Vitest + React Testing Library covers the frontend hook + key components. `mongodb-memory-server` gives the audit/auth tests real Mongo without a sidecar.
- **Resilience** — every external call is wrapped by `_withRetry`; the dashboard never blocks waiting for the robot.
