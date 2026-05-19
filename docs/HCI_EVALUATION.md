# HCI Heuristic Evaluation — Ground Control Station
**Week:** 6 — HCI & Design Thinking (Lab Sheet 6 — Task 2)

## Evaluation Process

The wireframe from Task 1 was evaluated against two established HCI frameworks:

1. **Peer evaluation** — wireframe reviewed by two peers against Shneiderman's Golden Rules.
2. **AI evaluation** — wireframe described to Claude Sonnet 4.6 with the prompt: *"You are an expert UX/UI Researcher. Conduct a Heuristic Evaluation of a Ground Control Station dashboard used to pilot a Virtual Robot. Evaluate against Norman's 7 Principles and Shneiderman's 8 Golden Rules. Identify at least 3 usability issues and suggest specific improvements."*

---

## Shneiderman's 8 Golden Rules — Evaluation

| # | Rule | Initial Design Assessment | Pass / Fail | Fix Applied |
|---|---|---|---|---|
| 1 | **Strive for consistency** | Navigation labels, button labels, and status badges use consistent terminology throughout. Battery always shown as `%` with a bar. | ✅ Pass | — |
| 2 | **Enable shortcuts** | No keyboard shortcuts for Move or Reset in v1. Tab/Enter navigation works but no `Ctrl+M` shortcut for experienced operators. | ⚠️ Partial | Added `accesskey` attributes and documented shortcuts in UI tooltip |
| 3 | **Offer informative feedback** | Toast notification appears on Move success/failure. Battery bar changes colour. Connection status always visible. | ✅ Pass | — |
| 4 | **Design dialogs to yield closure** | Move command shows "Navigating to (x, y)" confirming the task started. Reset shows "Simulation reset." with a success toast. | ✅ Pass | — |
| 5 | **Offer simple error handling** | Client-side inline validation prevents out-of-range values before submission. Server-side 422 errors displayed as human-readable messages. | ✅ Pass | — |
| 6 | **Permit easy reversal of actions** | **Issue found:** No undo for a Move command once sent. Reset Simulation is available but destroys the entire session, not just the last command. | ❌ Fail | Added "Cancel" button that appears while robot is MOVING (sends a reset to halt movement) |
| 7 | **Support internal locus of control** | Role badge always visible. Connection status always visible. User can see exactly what the system is doing at all times. | ✅ Pass | — |
| 8 | **Reduce short-term memory load** | **Issue found (Peer feedback):** In v1, the coordinate input fields showed no hint of what values are valid — the user had to remember "0 to 20". | ❌ Fail | Added `placeholder="0–20"` and `min/max` attributes; added a small label "Coordinates: 0–20 grid" above inputs |

---

## Norman's 7 Principles — Evaluation

| # | Principle | Assessment | Pass / Fail | Fix Applied |
|---|---|---|---|---|
| 1 | **Knowledge in the world & head** | Status labels (`IDLE`, `MOVING`, `STUCK`) are self-explanatory. Battery percentage needs no explanation. | ✅ Pass | — |
| 2 | **Simplify task structures** | Move task requires: type X → type Y → click Move. Three steps, no branching. ✅ Minimal cognitive load. | ✅ Pass | — |
| 3 | **Make things visible (affordances)** | **Issue found (AI evaluation):** In v1, the Move button looked the same when enabled vs disabled — only the background colour changed subtly. A user with a colour-only monitor could not tell it was disabled. | ❌ Fail | Added `cursor: not-allowed`, `opacity: 0.5`, and a tooltip "Waiting for robot to stop moving" on the disabled state |
| 4 | **Get the mapping right** | The 2D grid map uses the same X/Y axes as the input fields. Moving the robot to X=5, Y=3 places the marker at column 5, row 3. The mapping is direct. | ✅ Pass | — |
| 5 | **Convert constraints into advantages** | Input fields enforce `type="number"` `min="0"` `max="20"` — the browser physically prevents out-of-range values in most cases. | ✅ Pass | — |
| 6 | **Design for error** | Client-side validation + server-side validation + toast error feedback = three layers of error handling. | ✅ Pass | — |
| 7 | **Standardize** | Bootstrap 5 components used throughout — users familiar with any modern web app will recognise the nav bar, toasts, progress bars, and badges. | ✅ Pass | — |

---

## Issues Found & Fixes Applied

### Issue 1 — No visual distinction between enabled/disabled Move button (Norman Principle 3)
**Problem:** The Move button in disabled state only changed background colour — not sufficient for accessibility.
**Peer/AI source:** AI evaluation.
**Fix:** Added `opacity: 0.5` + `cursor: not-allowed` + `title="Robot is currently MOVING"` tooltip.
**Result:** Non-colour-dependent visual cue now exists for the disabled state.

---

### Issue 2 — No coordinate range hint on input fields (Shneiderman Rule 8)
**Problem:** Input fields showed no placeholder text — the valid range (0–20) was not visible in the UI.
**Peer/AI source:** Peer evaluation (Peer 1).
**Fix:** Added `placeholder="0–20"` to both X and Y inputs, plus a helper text label: *"Enter integer coordinates between 0 and 20."*
**Result:** User no longer needs to remember the valid range from a separate page.

---

### Issue 3 — No way to cancel or halt an in-progress Move command (Shneiderman Rule 6)
**Problem:** Once Move is clicked, there is no way to stop the robot without resetting the entire simulation. This is especially critical for the STUCK scenario — a secondary `[Stop / Reset]` button should appear.
**Peer/AI source:** Peer evaluation (Peer 2) + AI evaluation.
**Fix:** A `[Stop Robot]` button appears in the command panel **only while** the robot status is `MOVING`. It triggers a `POST /api/reset` call but with a distinct confirmation toast ("Robot halted. Simulation reset.").
**Result:** Shneiderman Rule 6 (easy reversal) is now satisfied for the most common operator scenario.

---

### Issue 4 — Audit log table has no pagination (Shneiderman Rule 8)
**Problem:** On a long-running session, the audit log table could grow to hundreds of rows, forcing users to scroll a long page.
**Peer/AI source:** AI evaluation.
**Fix:** Added pagination (10 entries per page) and a search/filter input to the audit log. "Newest first" order maintained.
**Result:** Short-term memory load reduced; users find recent commands immediately.

---

## Refined Wireframe Notes

After applying all four fixes, the wireframe was updated:
- Move button: visual disabled state improved (opacity + cursor)
- Input fields: placeholder text `0–20` added
- Command panel: `[Stop Robot]` button appears conditionally during MOVING state
- Audit log: pagination added

These refinements are reflected in the interactive prototype (`client/public/prototype.html`).
