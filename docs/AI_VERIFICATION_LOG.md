# Appendix A — AI Verification Log

**Project:** CMP9134 Robot Management System
**Student:** KendoCee25 | University of Lincoln

This log documents all uses of AI assistance during this project, in accordance with the CMP9134 AI Usage Policy. AI was used as a "Junior Assistant" to support development and requirements validation — not to write the report or generate diagrams.

---

| # | Task Category | AI Tool Used | Prompt Summary | Verification & Modification |
|---|---|---|---|---|
| 1 | Requirements — GDPR Compliance Documentation | Claude Sonnet 4.6 (Claude Code CLI) | "Create a PRIVACY_POLICY.md for a Robot Management System that collects user accounts, mission logs, and telemetry. Must comply with UK GDPR." | Reviewed output against UK GDPR Articles 5, 15–17, 21. Verified data table was accurate to actual system data (username, hashed password, role, mission logs, telemetry). Confirmed Right to Erasure section correctly states user data is not baked into immutable logs (per lecture requirement). No fabricated legal references found. Accepted with minor wording adjustments. |
| 2 | Requirements — Definition of Done / PR Template | Claude Sonnet 4.6 (Claude Code CLI) | "Create a GitHub PR template that enforces a Definition of Done checklist for a robot management dashboard. Must include: security, RBAC, WCAG, API error handling, mission logging, Docker." | Reviewed each checklist section against assessment CRG criteria. Verified WCAG items reference specific POUR principles. Confirmed RBAC check distinguishes Viewer from Commander. Added "No debug print/console.log statements" item manually after review. Template tested by opening a draft PR on GitHub — auto-populated correctly. |
| 3 | Requirements — API Analysis & Acceptance Criteria | Claude Sonnet 4.6 (Claude Code CLI) | "Analyse the live Virtual Robot API endpoints (/api/status, /api/move, /api/sensor, /api/map, /api/reset, /ws/telemetry) and derive Acceptance Criteria for each user story on the Trello board." | All AC were cross-referenced against the live API responses obtained by running `curl` against `http://localhost:5000`. Verified error response format (422 schema) against actual API output. Confirmed coordinate validation range (0–20) matches `NavigationRequest` schema in `/openapi.json`. WebSocket URL `ws://localhost:5000/ws/telemetry` confirmed from `/test` endpoint. Battery drain rate (0.5%/step) verified by observing status between move commands. AC adopted with addition of battery drain and charging station observations from live testing. |
| 4 | Requirements — Stakeholder Persona Validation | Claude Sonnet 4.6 (Claude Code CLI) | "Act as three stakeholder personas (Commander end-user, System Auditor, Safety & Security Officer) and critically review the Acceptance Criteria for all 10 user stories. Identify gaps." | Three personas reviewed all 10 user stories. AI identified 8 missing AC items across US-01, US-03, US-04, US-05, US-07, US-08, US-09, US-10. Each identified gap was evaluated manually before being accepted: (1) "Confirm Password" field — accepted, genuine UX risk; (2) "Role never from client claim" — accepted, genuine security risk; (3) "Charging indicator at (0,0)" — accepted, useful UX; (4) "STUCK feedback after move" — accepted, missing error state; (5) "Signal lost during MOVING" — accepted, safety-critical scenario; (6) "Immutable log entries" — accepted, audit integrity requirement; (7) "GDPR deletion workflow" — updated to be more specific; (8) ".env in .gitignore" — accepted, real security risk. All 8 items added to USER_STORIES.md and marked with *(added after AI stakeholder review)*. |

---

*AI was not used to write any section of this report, generate figures or diagrams, or edit the video submission.*
