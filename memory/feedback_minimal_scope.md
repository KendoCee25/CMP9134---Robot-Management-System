---
name: feedback-minimal-scope
description: For workshop/assessment tasks, implement exactly what is asked — no extras (no extra methods, no expanded docstrings, no bonus refactors).
metadata:
  type: feedback
---

When the user gives a task brief (especially workshop tasks like "implement at least one of these methods"), do **exactly** the minimum the brief specifies. Don't do "at least one" by doing both. Don't expand existing docstrings. Don't add helpful TODOs or comments that weren't there. Don't pre-emptively refactor surrounding code.

**Why:** The user said verbatim "just do exactly what the task said, nothing more" after I implemented both `move()` and `reset()` (plus enriched docstrings) when the W7 Task 2 brief only required one. Workshop tasks are graded against a specific brief; extras dilute focus and create review burden.

**How to apply:**
- If the brief says "at least one", do one. If they want the other, they'll ask.
- Keep existing comments / docstrings byte-identical unless the brief asks to change them.
- Mirror the pattern of nearby existing code rather than introducing a new style.
- Skip the "scratch file" / extra documentation unless the brief literally asks for it.
- If unsure whether something is in scope, ask before adding it — don't assume "more is better."
