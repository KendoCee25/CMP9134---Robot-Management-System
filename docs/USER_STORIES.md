# User Stories & Acceptance Criteria

**Project:** CMP9134 Robot Management System
**Last updated:** 20 February 2026

All stories follow the format: *"As a [role], I want [functionality], so that [benefit]."*
Acceptance Criteria (AC) are specific to each story. The global Definition of Done (DoD) checklist applies on top of these via the PR template.

---

## Sprint Backlog — This Week

---

### US-01 — User Registration

> As a new user, I want to register an account with username and password, so that I can securely access the robot management dashboard.

**Acceptance Criteria:**
- [ ] Registration form requires a unique username and a password (minimum 8 characters)
- [ ] Password is hashed with Bcrypt before being stored — never saved in plain text
- [ ] Duplicate usernames are rejected with a clear error message ("Username already taken")
- [ ] All new accounts are assigned the `Viewer` role by default
- [ ] Empty or whitespace-only username/password fields are rejected client-side
- [ ] Registration form includes a "Confirm Password" field; submission blocked if fields don't match *(added after AI stakeholder review)*
- [ ] Registration form fields and submit button are keyboard accessible (WCAG — Operable)
- [ ] On success, user is redirected to the login page with a confirmation message

---

### US-02 — Secure User Login

> As a registered user, I want to log in with secure authentication, so that only authorised individuals can view or control the virtual robot.

**Acceptance Criteria:**
- [ ] Login form accepts username and password
- [ ] Invalid credentials return a generic error ("Invalid username or password") — no detail on which field is wrong (prevents enumeration)
- [ ] Successful login creates a server-side session tied to the user's role
- [ ] Session is invalidated on logout
- [ ] Unauthenticated users attempting to access the dashboard are redirected to the login page
- [ ] Login form is keyboard accessible (WCAG — Operable)
- [ ] Successful login redirects the user to the main dashboard

---

## Product Backlog

---

### US-03 — Role-Based Access Control (RBAC)

> As a system user, I want my account to have a role — Viewer (read-only) or Commander (can issue commands) — so that robot control is restricted to authorised Commanders only.

**Acceptance Criteria:**
- [ ] Two roles exist: `Viewer` and `Commander`
- [ ] `Viewer` users can view the dashboard, telemetry, map, and audit log — but cannot see or interact with move controls
- [ ] `Commander` users can see and use the move controls
- [ ] Role is enforced server-side — a `Viewer` cannot call the move endpoint even via a direct HTTP request
- [ ] If a `Viewer` attempts a command action, the server returns `403 Forbidden`
- [ ] Role is stored in the database and cannot be changed by the user themselves
- [ ] Role is read from the server-side session/database on every request — client-provided role claims are never trusted *(added after AI stakeholder review)*
- [ ] Role is visible to the logged-in user on the dashboard (e.g. "Logged in as: Commander")

---

### US-04 — Real-Time Robot Telemetry Retrieval

> As a Viewer or Commander, I want the dashboard to automatically retrieve real-time telemetry (battery, coordinates, status), so that I can monitor the robot's state at all times.

**Acceptance Criteria:**
- [ ] Dashboard connects to `ws://localhost:5000/ws/telemetry` WebSocket on load
- [ ] Telemetry (battery, position x/y, status) updates on the UI at 1Hz without page refresh
- [ ] If WebSocket disconnects, dashboard falls back to polling `GET /api/status` every 2 seconds
- [ ] Battery displayed as a percentage with a visual bar indicator
- [ ] Battery bar turns amber at ≤ 30%, red at ≤ 20%
- [ ] Robot status (`IDLE`, `MOVING`, `LOW_BATTERY`, `STUCK`) displayed as a labelled badge
- [ ] A `LOW_BATTERY` alert banner is shown prominently when battery < 20%
- [ ] `STUCK` status triggers a visible alert ("Robot is stuck — clear path required")
- [ ] When robot is `IDLE` at (0,0) and battery is increasing, display a "Charging" indicator *(added after AI stakeholder review)*
- [ ] UI does not crash or freeze during 503 outages; shows "Reconnecting..." indicator
- [ ] Last known data is displayed (labelled as stale) during a dropout

---

### US-05 — Send Robot Movement Commands

> As a Commander, I want to send navigation commands by specifying target (x, y) coordinates, so that I can direct the robot to move to a chosen location.

**Acceptance Criteria:**
- [ ] Move controls show two numeric input fields: X and Y (integers)
- [ ] Client-side validation: both fields required; values must be integers in range 0–20
- [ ] Negative values and values > 20 are rejected before the request is sent
- [ ] On valid submit, a `POST` request is sent to `/api/move` with `{"x": int, "y": int}`
- [ ] On success (`200`), confirmation displayed: e.g. "Navigating to (3, 4)"
- [ ] On `422` validation error from server, a human-readable error message is shown in the UI
- [ ] Move button is disabled while robot `status === "MOVING"` (prevents conflicting commands)
- [ ] Move button is disabled when `battery === 0`
- [ ] Move button and input fields are keyboard accessible (WCAG — Operable)
- [ ] If robot status becomes `STUCK` after a move command, UI displays "Robot is stuck — command did not complete" *(added after AI stakeholder review)*
- [ ] Move controls are hidden entirely for `Viewer` role users

---

### US-06 — 2D Grid Robot Position Visualisation

> As a user (Viewer or Commander), I want a 2D grid map on the dashboard showing the robot's position in real time, so that I can visually track the robot's location.

**Acceptance Criteria:**
- [ ] Map is fetched from `GET /api/map` on dashboard load
- [ ] Grid rendered as 21×21 cells
- [ ] Obstacle cells (`1` in grid) are visually distinct from free cells (`0`)
- [ ] Robot's current position is shown as a distinct marker on the correct cell
- [ ] Charging station at (0, 0) is visually marked
- [ ] Robot marker updates position as telemetry data changes
- [ ] Map is re-fetched after a simulation reset to show the new obstacle layout
- [ ] Map is responsive and does not overflow its container on smaller screens

---

### US-07 — Connection & Status Visual Indicators

> As a user, I want prominent visual indicators for system health and connection state, so that I immediately understand when the robot or communication is in an abnormal state.

**Acceptance Criteria:**
- [ ] A connection status indicator is always visible on the dashboard
- [ ] Indicator shows: "Connected" (green), "Reconnecting..." (amber), "Signal Lost" (red)
- [ ] Indicator transitions automatically as connection state changes — no page reload required
- [ ] "Low Battery" alert shown when battery < 20% (distinct from connection status)
- [ ] "Robot Stuck" alert shown when status is `STUCK`
- [ ] "Command Failed" message shown if a move request returns an error
- [ ] If connection is lost while robot is `MOVING`, dashboard displays "Signal lost — robot may still be executing last command" *(added after AI stakeholder review)*
- [ ] All status indicators meet WCAG colour contrast requirements (not colour-only — include icon or text label)
- [ ] Indicators are screen-reader accessible (WCAG — Robust)

---

### US-08 — Command & Mission Audit Logging

> As a system administrator, I want every command sent to the robot permanently recorded in a local database, so that a complete audit trail exists for every control action.

**Acceptance Criteria:**
- [ ] Every `POST /api/move` request is logged to the local database before the response is returned
- [ ] Each log entry stores: timestamp (UTC), username, role, target X, target Y, robot status at time of command
- [ ] Audit log is displayed in the dashboard as a table (newest entries first)
- [ ] Log persists across server restarts (stored in database, not in-memory)
- [ ] Both `Viewer` and `Commander` users can read the audit log (read-only for all)
- [ ] Failed commands (e.g. 422 errors) are also logged with their error reason
- [ ] Log entries are immutable — no edit or update operation exists for existing entries *(added after AI stakeholder review)*
- [ ] A logged-in user can submit a deletion request via the dashboard; system deletes their entries and confirms in writing (GDPR Right to Erasure — Article 17) *(updated after AI stakeholder review)*

---

### US-09 — Automated Unit & Integration Testing

> As a developer, I want automated unit and integration tests, so that I can verify the system behaves correctly and demonstrate reliability via the CI pipeline.

**Acceptance Criteria:**
- [ ] Unit tests cover: password hashing, RBAC role enforcement, coordinate validation (0–20), mission log creation
- [ ] Integration tests cover: registration flow, login flow, `/api/move` blocked for `Viewer` role, audit log entry created after move command
- [ ] All tests are runnable with a single command (e.g. `pytest` or `npm test`)
- [ ] Tests pass in the GitHub Actions CI pipeline on every push
- [ ] No hardcoded credentials or secrets in test files
- [ ] CI pipeline includes a secret-scanning step that fails the build if credentials are found in code *(added after AI stakeholder review)*
- [ ] At least 70% code coverage on core business logic

---

## In Progress

---

### US-10 — Docker Compose Multi-Container Setup

> As a developer deploying the system, I want the entire application containerised with Docker and startable with a single command alongside the Virtual Robot container, so that the system can be reproducibly launched in any environment.

**Acceptance Criteria:**
- [ ] `Dockerfile` exists for the dashboard application (backend + frontend)
- [ ] `docker-compose.yml` defines both the dashboard service and the robot simulator service
- [ ] `docker-compose up` starts the full system with no manual steps beyond setting env variables
- [ ] Dashboard container can reach robot API at `http://robot_sim:5000` via Docker internal network
- [ ] `.env.example` provided listing all required environment variables (no secrets committed to repo)
- [ ] `.env` file is listed in `.gitignore` — verified before any push to main *(added after AI stakeholder review)*
- [ ] No hardcoded `localhost` references in production code — use service names from docker-compose
- [ ] Application is accessible at `http://localhost:3000` (or documented port) after `docker-compose up`
- [ ] `docker-compose down` cleanly stops and removes containers
