# UI Wireframes — Ground Control Station

**Week:** 6 — HCI & Design Thinking (Lab Sheet 6 — Task 1)

---

## Design Principles Applied

| Principle | Application |
|---|---|
| **Fitts's Law** | Primary action buttons ("Move Robot", "Emergency Stop") are large and placed in the lower-right — the natural resting zone for a right-handed mouse user. The Reset button is deliberately smaller and separated to prevent accidental clicks. |
| **Hick's Law** | Navigation is limited to 2 top-level items (Dashboard, Audit Log). The telemetry panel shows only 4 key values — not raw sensor dumps. |
| **Shneiderman Rule 3 (Informative Feedback)** | Every button press produces a visible toast notification. The connection indicator updates in real time. |
| **Shneiderman Rule 6 (Easy Reversal)** | Reset Simulation is available but placed secondary — it is reversible but destructive, so it is visually de-emphasised. |

---

## Wireframe 1 — Main Dashboard (Commander View)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 Robot GCS    [Dashboard]  [Audit Log]    Role: [COMMANDER] ▼  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│  STATUS BAR                                                             │
│  ● Connected (green)  |  Battery: [████████░░] 82%  |  Status: IDLE    │
├──────────────────────────────┬──────────────────────────────────────────┤
│                              │                                          │
│  2D GRID MAP                 │  TELEMETRY PANEL                         │
│  ┌────────────────────────┐  │  ┌────────────────────────────────────┐  │
│  │  21 × 21 Grid          │  │  │  Robot ID:   XR-900                │  │
│  │                        │  │  │  Status:     [ IDLE ]  (green)     │  │
│  │  · · · · · · · · · · · │  │  │  Battery:    82%                   │  │
│  │  · · · R · · · · · · · │  │  │  [████████░░░░░░░░░░] green        │  │
│  │  · · · · · · · · · · · │  │  │  Position:   X: 3   Y: 4           │  │
│  │  · ■ · · · · · · · · · │  │  │  Last Update: 2026-03-13 10:05:01  │  │
│  │  · · · · · · ■ · · · · │  │  └────────────────────────────────────┘  │
│  │  · · · · · · · · · · · │  │                                          │
│  │  · · · · · · · · · · · │  │  MOVE ROBOT  [Commander only]            │
│  │  ★ = charging station  │  │  ┌────────────────────────────────────┐  │
│  │  R = robot position    │  │  │  Target X:  [ 0–20  _________ ]   │  │
│  │  ■ = obstacle          │  │  │  Target Y:  [ 0–20  _________ ]   │  │
│  └────────────────────────┘  │  │                                    │  │
│                              │  │  ┌──────────────────────────────┐  │  │
│  [Map re-fetches on Reset]   │  │  │     MOVE ROBOT  ← BIG        │  │  │
│                              │  │  └──────────────────────────────┘  │  │
│                              │  │  (disabled while MOVING or battery=0) │
│                              │  │                                    │  │
│                              │  │  [ Reset Simulation ]  ← smaller  │  │
│                              │  └────────────────────────────────────┘  │
├──────────────────────────────┴──────────────────────────────────────────┤
│  MISSION AUDIT LOG  (newest first, read-only for all roles)             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Timestamp           │ User     │ Role      │ X  │ Y  │ Outcome  │   │
│  │ 2026-03-13 10:04:50 │ alice    │ Commander │ 3  │ 4  │ SUCCESS  │   │
│  │ 2026-03-13 10:03:12 │ alice    │ Commander │ 99 │ 0  │ ERROR    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  [Request Data Deletion]  ← GDPR Right to Erasure                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Notes:**
- The `[COMMANDER]` role badge in the navbar uses a distinct colour (amber) vs Viewer (grey) — always visible, cannot be missed (Shneiderman Rule 7: locus of control).
- The connection status indicator (● green/amber/red) is always shown in the status bar. Colour alone is not used — text label accompanies it (WCAG, US-07 AC).
- The 2D grid and telemetry panel sit side-by-side on desktop; stack vertically on mobile (Bootstrap responsive grid).

---

## Wireframe 2 — Viewer Role (Move Controls Hidden)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 Robot GCS    [Dashboard]  [Audit Log]    Role: [VIEWER]       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [2D Grid Map]                   [Telemetry Panel — read only]          │
│                                                                         │
│                                  ┌──────────────────────────────────┐  │
│                                  │  Move controls are not shown.    │  │
│                                  │  (RBAC: Viewer role — US-03 AC)  │  │
│                                  └──────────────────────────────────┘  │
│                                                                         │
│  [Mission Audit Log — read only for Viewer]                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Wireframe 3 — Deep Dive: Move Robot Control Panel

```
MOVE ROBOT — Detailed Interaction Flow

  Step 1: Default state (robot IDLE)
  ┌────────────────────────────────────────────────────┐
  │  Target X:  [________________]  (0 – 20)           │
  │  Target Y:  [________________]  (0 – 20)           │
  │                                                    │
  │  ┌──────────────────────────────────────────────┐  │
  │  │              MOVE ROBOT                      │  │  ← Large (Fitts's Law)
  │  └──────────────────────────────────────────────┘  │    Full-width, high contrast
  │  [ Reset Simulation ]                              │  ← Smaller, right-aligned
  └────────────────────────────────────────────────────┘

  Step 2: Validation error (X = 25, out of range)
  ┌────────────────────────────────────────────────────┐
  │  Target X:  [  25  ]  ← red border                 │
  │  ⚠ Value must be between 0 and 20                  │  ← inline error
  │  Target Y:  [  10  ]  ← valid (green border)       │
  │                                                    │
  │  ┌──────────────────────────────────────────────┐  │
  │  │         MOVE ROBOT  (disabled, grey)         │  │  ← Disabled until valid
  │  └──────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────┘

  Step 3: Command sent (robot MOVING)
  ┌────────────────────────────────────────────────────┐
  │  Target X:  [  5  ]    Target Y:  [  10  ]         │
  │                                                    │
  │  ┌──────────────────────────────────────────────┐  │
  │  │       MOVE ROBOT  (disabled — MOVING)        │  │  ← Disabled, spinner shown
  │  └──────────────────────────────────────────────┘  │
  │                                                    │
  │  ┌─────────────────────────────────────────────┐   │
  │  │  ✓  Navigating to (5, 10)           [×]    │   │  ← Toast notification
  │  └─────────────────────────────────────────────┘   │
  └────────────────────────────────────────────────────┘

  Step 4: Error state (503 — robot unreachable)
  ┌────────────────────────────────────────────────────┐
  │  ┌─────────────────────────────────────────────┐   │
  │  │  ✗  Command failed: Robot unreachable  [×]  │   │  ← Red toast (error)
  │  └─────────────────────────────────────────────┘   │
  │                                                    │
  │  Status Bar: ● Signal Lost (red)                   │
  │  Last known data displayed, labelled "(stale)"     │
  └────────────────────────────────────────────────────┘
```

**Fitts's Law applied:**
- The MOVE ROBOT button is full-width — maximises target width, minimises miss-clicks.
- Reset Simulation is a smaller secondary button — reduces accidental triggering.
- Input fields are large with clear labels and inline validation — reduces cognitive load before the user even reaches the button.
