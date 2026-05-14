# Open-Source License Audit

**Project:** CMP9134 Robot Management System
**Author:** KendoCee25 | University of Lincoln
**Week:** 5 — Architecture, Patterns & Reuse (Lab Sheet 5 — Task 3: LEPSI)

---

## Purpose

This audit evaluates the legal obligations imposed by the third-party libraries and frameworks used in the Robot Management System. Under LEPSI principles, any open-source component used in a system must be assessed for its licensing terms before integration, to ensure the project does not inadvertently inherit incompatible legal constraints.

---

## Dependency License Table

| # | Component | Version | Purpose in System | License Type | Permissive / Copyleft | Source |
|---|---|---|---|---|---|---|
| 1 | **React** | 18.x | JavaScript UI library — renders the Ground Control Station dashboard as a Single Page Application (SPA) | MIT | ✅ Permissive | [github.com/facebook/react](https://github.com/facebook/react/blob/main/LICENSE) |
| 2 | **Express** | 4.x | Node.js web framework — handles all HTTP routing, middleware execution, and JSON API responses in the backend | MIT | ✅ Permissive | [github.com/expressjs/express](https://github.com/expressjs/express/blob/master/LICENSE) |
| 3 | **Mongoose** | 8.x | MongoDB Object Document Mapper (ODM) — defines `User` and `MissionLog` schemas; abstracts all MongoDB queries from route handlers | MIT | ✅ Permissive | [github.com/Automattic/mongoose](https://github.com/Automattic/mongoose/blob/master/LICENSE.md) |
| 4 | **MongoDB Community Server** | 7.x | NoSQL document database — persists user accounts and the immutable mission audit log across container restarts | SSPL v1 | ⚠️ See note below | [mongodb.com/legal/licensing](https://www.mongodb.com/legal/licensing/server-side-public-license) |
| 5 | **Axios** | 1.x | HTTP client for Node.js — used inside `robotClient.js` to make outbound REST calls to the Virtual Robot API | MIT | ✅ Permissive | [github.com/axios/axios](https://github.com/axios/axios/blob/v1.x/LICENSE) |

---

## Important Note on MongoDB SSPL

MongoDB Community Server is licensed under the **Server Side Public License v1 (SSPL)**, which the Open Source Initiative (OSI) has **not** recognised as a traditional open-source license. The SSPL is a copyleft-style license with one specific trigger: if you make MongoDB available **as a cloud service to third parties**, you must release the full stack of software used to provide that service under the SSPL.

**For this project, SSPL is not a concern** because:
- The Robot Management System is a **student project running locally** via Docker Compose, not a cloud service offered to the public.
- MongoDB is consumed internally by Express — it is not exposed or re-sold as a managed database service.

If this project were ever commercialised as a hosted service, switching to the MongoDB Atlas free tier (Apache 2.0 licensed drivers) or an alternative such as PostgreSQL (PostgreSQL License, permissive) would eliminate the SSPL question entirely.

---

## Legal Conclusion

All application-layer dependencies (React, Express, Mongoose, Axios) use **permissive MIT licenses** imposing no restrictions on the project's own licensing. MongoDB Community Server carries an SSPL obligation that is **not triggered** by this project's deployment model (local Docker containers for academic use). The current combination of licenses imposes **no legal restrictions** on the development or submission of this Ground Control Station as a university coursework project.

---

## References

- [choosealicense.com](https://choosealicense.com/) — GitHub's plain-English guide to open-source licenses
- [MongoDB SSPL FAQ](https://www.mongodb.com/licensing/server-side-public-license/faq)
- Sommerville, I. (2016). *Software Engineering* (10th ed.), Chapter 16
