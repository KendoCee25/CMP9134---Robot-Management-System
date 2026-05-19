# CBSE Interface Specification — Mission Logger

**Originated:** Week 5 — Architecture, Patterns & Reuse (Lab Sheet 5 — Task 4)


---

## 1. Component overview

In Component-Based Software Engineering (CBSE), a component is an **abstract, stand-alone service provider** whose behaviour is defined entirely by its interfaces — what it *provides* to others and what it *requires* from the environment.

The **Mission Logger** (`server/auditLog.js`) is a dedicated CBSE component responsible for creating an immutable audit trail of every command issued through the Ground Control Station. It operates independently of the Express route handlers and could, in principle, be swapped for a different storage backend (PostgreSQL, S3, etc.) without touching any other component — the only consumers of its API are `server/app.js` (which appends entries when commands run) and `GET /api/audit` (which lists them).

---

## 2. Provides interface

These are the services the Mission Logger exposes to the rest of the backend (exact signatures from `server/auditLog.js`):

| Method | Signature | Description |
|---|---|---|
| `recordEntry` | `recordEntry({ username, role, command, target, outcome, detail }) → Promise<Entry>` | Appends an immutable audit document. `command ∈ { "MOVE", "RESET" }`; `outcome ∈ { "SUCCESS", "ERROR" }`. Both successful commands and failed/invalid ones are recorded. |
| `listEntries` | `listEntries({ limit }) → Promise<Entry[]>` | Returns the most recent entries, newest-first, capped at `limit` (defaults to `LIST_LIMIT = 500`). Drives the dashboard's audit-log table. |
| `_reset` | `_reset() → Promise<void>` | **Test-only.** Wipes the audit collection between Jest specs. Underscore-prefixed to discourage production use. |

---

## 3. Requires interface

These are the external services the Mission Logger **depends on** to function. It does not implement them itself.

| External service | Concrete provider | Why it is needed |
|---|---|---|
| **`MissionLog` model** | Mongoose model in `server/models/MissionLog.js` | Provides `create`, `find`, `deleteMany`, and `toJSON` mapping for persistence. |
| **MongoDB connection** | `server/db.js` (`mongoose.connect`) | The model is bound to a live Mongoose connection — without one, `create` and `find` reject. |
| **System clock** | Node `Date` (via Mongoose's `default: () => new Date()`) | Every entry records a UTC timestamp at the moment it is created. |

---

## 4. UML ball-and-socket notation

The "ball" (lollipop) represents the **Provides** interface — a service offered outward.
The "socket" (open arc) represents the **Requires** interface — a dependency that must be satisfied by the environment.

```
                         ┌─────────────────────────┐
                         │                         │
   recordEntry ──────●   │                         │   ○──── MissionLog
   listEntries ─────●    │    Mission Logger       │        Mongoose model
   _reset (test)  ──●    │  (server/auditLog.js)   │   ○──── MongoDB
                         │                         │        connection
                         │                         │   ○──── System clock
                         └─────────────────────────┘
```

> **Key:**
> - `●` (ball / lollipop) = **Provides Interface** — services this component offers
> - `○` (socket / open arc) = **Requires Interface** — services this component consumes

---

## 5. Mermaid diagram (structural view)

![5 mermaid diagram structural view](diagrams/cbse-interfaces/01-5-mermaid-diagram-structural-view.png)

---

## 6. Mongoose schema (actual)

The `MissionLog` Mongoose schema implements the Provides interface's data contract (verbatim from `server/models/MissionLog.js`):

```js
const missionLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date(), index: true },
  username:  { type: String, required: true },
  role:      { type: String, required: true },
  command:   { type: String, enum: ["MOVE", "RESET"], required: true },
  target:    { type: { x: Number, y: Number }, default: null, _id: false },
  outcome:   { type: String, enum: ["SUCCESS", "ERROR"], required: true },
  detail:    { type: String, default: null },
});

// `toJSON` maps `_id → id` and strips `__v` so the wire shape is stable.
// Documents are append-only at the application layer — no `update` or
// per-document `delete` operation is exposed.
```

| Field | Purpose |
|---|---|
| `timestamp` | UTC time the command was processed (indexed for newest-first paging). |
| `username` | Logged-in user (`sub` claim from the JWT, or the static-token identity in dev). |
| `role` | Role at the time the command was issued (`viewer` / `operator`). |
| `command` | Either `MOVE` or `RESET`. |
| `target` | `{x, y}` for moves; `null` for resets and missing-coord error rows. |
| `outcome` | `SUCCESS` if the robot acknowledged with 2xx; `ERROR` for any other terminal state. |
| `detail` | Free-text reason for an error row (e.g. `"Invalid coordinates"`, `"HTTP 503"`). |

---

## 7. Design decisions

- **Immutability** — the Provides interface exposes no `update` or per-document `delete`. Log documents are write-once. An audit trail that can be silently edited defeats its own purpose.
- **Append-only auditability** — even *failed* commands and invalid coordinates create an entry (`outcome=ERROR`). The brief requires every command intent to be auditable, not just successful ones.
- **Decoupling via Requires** — by depending on the `MissionLog` Mongoose model (not on `mongoose` itself) and on the system clock, the logger can be tested with `mongodb-memory-server` in `globalSetup.js` without any code change.
- **Independence** — the logger does not call `robotClient.js`, the auth middleware, or any other component. It is a *pure data recorder*: it receives facts about what happened and stores them.
- **Stable wire shape** — the `toJSON` transform maps Mongo's `_id` to `id` so the React audit-log table can use a typed `AuditEntry` model without leaking Mongo internals.
