# Virtual Robot API — Analysis & Acceptance Criteria

**Date analysed:** 20 February 2026
**Robot container:** `ghcr.io/francescodelduchetto/cmp9134_2526_robotsim:latest`
**Base URL:** `http://localhost:5000`
**API version:** 1.1

---

## Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/status` | Get current robot state |
| POST | `/api/move` | Send navigation command |
| GET | `/api/sensor` | Get proximity + Lidar sensor data |
| GET | `/api/map` | Get full 21×21 grid map |
| POST | `/api/reset` | Reset simulation to initial state |
| WS | `ws://localhost:5000/ws/telemetry` | Real-time telemetry stream (1Hz) |

---

## `/api/status` — GET

### Response Schema
```json
{
  "id": "XR-900",
  "position": { "x": 0, "y": 0 },
  "battery": 100.0,
  "status": "IDLE"
}
```

### Field Details
| Field | Type | Description |
|---|---|---|
| `id` | string | Robot identifier (fixed: `"XR-900"`) |
| `position.x` | int | Current X coordinate (0–20) |
| `position.y` | int | Current Y coordinate (0–20) |
| `battery` | float | Battery level 0.0–100.0; drains 0.5% per step |
| `status` | enum | `IDLE` \| `MOVING` \| `LOW_BATTERY` \| `STUCK` |

### Status State Meanings
| Status | Meaning |
|---|---|
| `IDLE` | Robot is stationary and ready for commands |
| `MOVING` | Executing a navigation command |
| `LOW_BATTERY` | Battery below 20% — still operational but alert required |
| `STUCK` | Robot hit an obstacle and cannot continue |

### Observed Behaviour (Live Test)
- Returns immediately with no delay artefacts at this endpoint
- Status transitions: `IDLE` → `MOVING` during navigation, then back to `IDLE` on arrival
- Battery observed draining at 0.5% per step during movement

### Acceptance Criteria (for dashboard implementation)
- [ ] Dashboard polls `/api/status` and updates UI in real time
- [ ] Battery percentage displayed with visual indicator; turns red/amber when < 20% (`LOW_BATTERY`)
- [ ] Robot position (x, y) reflected on the 2D grid map
- [ ] Status badge displayed (`IDLE` / `MOVING` / `LOW_BATTERY` / `STUCK`)
- [ ] UI handles 503 dropouts from this endpoint gracefully (shows "Reconnecting..." indicator)

---

## `/api/move` — POST

### Request Schema
```json
{ "x": 3, "y": 4 }
```
| Field | Type | Constraints |
|---|---|---|
| `x` | integer | Required. 0 ≤ x ≤ 20 |
| `y` | integer | Required. 0 ≤ y ≤ 20 |

### Success Response (200)
```json
{ "message": "Navigating to (3, 4)" }
```

### Error Responses (422 Validation Error)
| Scenario | Response |
|---|---|
| Negative coordinate (`x: -1`) | `"Input should be greater than or equal to 0"` |
| Out of range (`x: 25`) | `"Input should be less than or equal to 20"` |
| Missing field (`y` omitted) | `"Field required"` |

### Observed Behaviour (Live Test)
- Accepts command immediately and returns `200` with message
- Robot begins moving — position updates incrementally (not teleporting)
- Battery drains 0.5% per grid step taken
- Robot reports `MOVING` status during navigation
- Validation is server-side — client must also validate to prevent unnecessary requests

### Acceptance Criteria (for dashboard implementation)
- [ ] Dashboard provides two numeric input fields for X and Y coordinates
- [ ] Client-side validation: rejects inputs outside 0–20 range before sending request
- [ ] Client-side validation: rejects negative values
- [ ] Both X and Y fields are required — form cannot submit with either missing
- [ ] On success, displays confirmation message (e.g. "Navigating to (3, 4)")
- [ ] On 422 error, displays human-readable error message in the UI
- [ ] "Move" button is disabled while robot `status === "MOVING"` to prevent conflicting commands
- [ ] "Move" button is disabled when `battery === 0` (robot stops responding)
- [ ] Move command button is keyboard accessible (WCAG — Operable)
- [ ] Only users with `Commander` role can access the move controls (RBAC)
- [ ] Every move command is logged to the database: timestamp, username, target (x, y)

---

## `/api/sensor` — GET

### Response Schema
```json
{
  "N": 0.0, "S": 3.0, "E": 5.0, "W": 0.0,
  "lidar": [5.5, 6.0, ...]
}
```
- **N/S/E/W:** Distance to nearest obstacle in each cardinal direction (max 5 units; 0 = obstacle adjacent)
- **lidar:** 360 readings (one per degree, 0°–359°), max range 10 units

---

## `/api/map` — GET

### Response Schema
```json
{
  "width": 21,
  "height": 21,
  "grid": [[0,0,1,...], ...]
}
```
- `0` = free space, `1` = obstacle
- 21×21 grid; 40 randomly generated obstacles
- Starting position (0,0) guaranteed obstacle-free
- Map is regenerated on each `/api/reset`

---

## `/api/reset` — POST

- Resets position to (0,0), battery to 100%, regenerates map
- Returns: `{ "message": "Simulation reset." }`
- No request body required

---

## `ws://localhost:5000/ws/telemetry` — WebSocket

- Streams telemetry at **1Hz** (once per second)
- Same schema as `/api/status` response
- Provides real-time updates without polling
- **Design decision:** WebSocket preferred over REST polling for live dashboard updates (lower latency, fewer requests)

---

## Key Design Implications for Dashboard

1. **Polling vs WebSocket:** Use WebSocket (`/ws/telemetry`) for live telemetry; fall back to polling `/api/status` on WebSocket disconnect
2. **Error Handling:** Must handle random 503 outages (5–10 seconds) — implement retry with exponential backoff
3. **Latency:** Random 0.1–0.8s delays on API responses — UI must not block or freeze; use async requests
4. **RBAC enforcement:** `/api/move` must only be callable by authenticated `Commander` users; the backend must verify role before proxying to robot API
5. **Mission Logging:** Log every POST to `/api/move` regardless of whether the robot reaches the target — command intent must be auditable
