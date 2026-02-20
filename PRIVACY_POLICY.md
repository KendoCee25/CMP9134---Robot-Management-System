# Privacy Policy

**Last updated:** 20 February 2026
**System:** CMP9134 Robot Management System — Ground Control Station
**Controller:** Student Developer | University of Lincoln | CMP9134 Software Engineering

---

## 1. Overview

This Privacy Policy explains what personal data the Robot Management System (RMS) collects, why it is collected, how it is stored, and what rights you have over your data. This system is developed in compliance with the **UK General Data Protection Regulation (UK GDPR)** and the **Data Protection Act 2018**.

---

## 2. Data We Collect

The RMS collects only the minimum data strictly necessary to operate the system (Data Minimisation Principle — UK GDPR Article 5(1)(c)).

| Data Type | Description | Purpose | Legal Basis |
|---|---|---|---|
| **Username** | Chosen identifier at registration | Authentication & access control | Legitimate interest |
| **Password (hashed)** | Stored as a Bcrypt hash — never in plain text | Secure login | Legitimate interest |
| **Role** | `Viewer` or `Commander` | Role-Based Access Control (RBAC) | Legitimate interest |
| **Mission Logs** | Timestamp, username, command type, robot status at time of command | Safety accountability & audit trail | Legitimate interest |
| **Robot Telemetry** | Battery level, grid position (X/Y), robot status | Real-time monitoring display | Legitimate interest |

> **We do not collect:** email addresses, real names, location data, payment information, or any data beyond what is listed above.

---

## 3. How Data Is Stored

- **Passwords** are never stored in plain text. All passwords are hashed using **Bcrypt** before storage.
- **Mission logs** are stored in a local database (SQLite) on the server running this application.
- **Telemetry data** is retrieved in real time from the Virtual Robot API and is not permanently persisted beyond what appears in mission logs.
- No data is transmitted to third parties or external cloud services.

---

## 4. Data Retention

| Data | Retention Period |
|---|---|
| User account (username, hashed password, role) | Until the user requests deletion |
| Mission logs | Retained for the duration of system operation; can be deleted on request |
| Session data | Cleared on logout or session expiry |

---

## 5. Your Rights (UK GDPR)

You have the following rights regarding your personal data:

- **Right of Access (Article 15):** You may request a copy of the data held about you.
- **Right to Rectification (Article 16):** You may request correction of inaccurate data.
- **Right to Erasure / "Right to be Forgotten" (Article 17):** You may request deletion of your account and associated mission logs. The system provides a deletion workflow to fulfil this right. User data is **not** baked into immutable logs — it can be removed.
- **Right to Restrict Processing (Article 18):** You may request that processing of your data be restricted.
- **Right to Object (Article 21):** You may object to processing based on legitimate interests.

To exercise any of these rights, contact the system administrator.

---

## 6. Security Measures

The following technical and organisational measures are in place to protect your data:

- Passwords hashed with **Bcrypt** (salted, one-way)
- **Role-Based Access Control (RBAC):** `Viewer` accounts cannot issue commands; only `Commander` accounts can send navigation instructions
- Session management with server-side validation
- No sensitive data exposed in client-side code or logs

---

## 7. Cookies and Session Data

This system uses **server-side sessions only** to maintain login state. No tracking cookies or third-party analytics are used.

---

## 8. Changes to This Policy

This policy may be updated as the system evolves. The "Last updated" date at the top of this document will reflect any changes.

---

## 9. Contact

For any privacy-related queries or to exercise your data rights, contact:

**System Developer:** University of Lincoln, CMP9134 Software Engineering
**Supervisor:** Dr Francesco Del Duchetto | fdelduchetto@lincoln.ac.uk
