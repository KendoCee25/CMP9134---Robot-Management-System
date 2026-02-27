# CMP9134 - Robot Management System

A web-based Ground Control Station dashboard for remotely monitoring and controlling a Virtual Robot.

## Module
CMP9134 Software Engineering | University of Lincoln | 2025-2026

## Overview
This project implements a Robot Management System that connects to a Virtual Robot API (Docker container) and provides:
- Real-time telemetry monitoring (battery, position, status)
- Navigation command interface
- Role-Based Access Control (Viewer / Commander)
- Mission audit logging
- Docker Compose deployment

## System Architecture

The diagram below shows the high-level component architecture and deployment strategy for the Robot Management System.

```mermaid
flowchart TB
    User([User\nBrowser :3000])

    subgraph GCS [Ground Control Station — Docker Container]
        subgraph Frontend [Frontend Layer]
            UI[Web Dashboard\nHTML / CSS / JavaScript]
        end

        subgraph Backend [Backend Layer]
            API[Python Flask API\n:5000]
            Auth[Session &\nAuth Middleware]
            RBAC[RBAC\nEnforcer]
        end

        subgraph Data [Data Layer]
            DB[(SQLite\nDatabase)]
        end

        UI -- HTTP REST / WebSocket --> API
        API --> Auth
        Auth --> RBAC
        API -- SQL queries --> DB
    end

    subgraph Robot [Virtual Robot Container — Docker]
        Sim[Robot Simulator\nFlask API :5000]
        WS[WebSocket\n/ws/telemetry]
    end

    User -- HTTP :3000 --> GCS
    GCS -- POST /api/move\nGET /api/status\nGET /api/map\nPOST /api/reset --> Robot
    Robot -- WS telemetry stream --> GCS
```

**Architecture notes:**
- The Ground Control Station (GCS) and Virtual Robot run as separate Docker containers, connected via Docker Compose internal networking using service names (not `localhost`).
- All RBAC enforcement happens inside the Backend Layer — the frontend never has authority over role decisions.
- The SQLite database persists the user table and immutable mission audit log across container restarts.
- The WebSocket `/ws/telemetry` stream provides real-time 1Hz telemetry updates; the system falls back to polling `GET /api/status` if the WebSocket drops.

## Getting Started
Documentation and setup instructions will be added as development progresses.

## GitHub Issues
All user stories and tasks are tracked via [GitHub Issues](../../issues).
