# Architecture Document: PS-2 Intelligent Disaster Response & Relief Coordination

## 1. System Overview
The **PS-2 Disaster Response & Relief Coordination System** is a unified full-stack emergency management platform engineered for high-consequence natural disaster events (floods, cyclones, landslides, earthquakes, fires). It bridges public citizens in acute distress with specialized tactical rescue teams, trauma centers, evacuation shelters, and non-governmental relief agencies.

---

## 2. Component Architecture

### A. Frontend Layer
- **Framework**: React 19 SPA running on Vite with TypeScript.
- **Styling**: Tailwind CSS with dark emergency-management palette (Slate-950 background, Amber tactical highlights, Red threat indicators).
- **Mapping**: Leaflet with OpenStreetMap tiles displaying color-coded threat radius circles, rescue squad positions, and active road blockages.
- **Analytics**: Recharts data visualization for incident distribution by category and triage priority ratios.
- **State & Real-Time Sync**: Server-Sent Events (SSE) stream (`/api/events`) providing sub-second synchronization across all open browser sessions and agency tabs.

### B. Citizen Public Portal (Default View)
- Accessible without mandatory login/registration to minimize friction during acute danger.
- Device GPS capture with high-accuracy coordinates.
- Form capturing affected headcounts, immediate threat indicators, vulnerable demographic flags (infants, elderly, disabled), and optional contact/photo attachments.
- Generates a unique, non-guessable Request ID (e.g. `EMG-2026-1001`).
- Public tracking drawer allows citizens to monitor verified triage status and assigned rescue units without exposing sensitive command communications.

### C. Backend & API Services
- **Full-Stack Production Server**: Node.js + Express with atomic file-backed JSON relational persistence (`data/database.json`), ACID-compliant transactional state modifications, and Vite middleware integration.
- **Python FastAPI Architecture**: Reference FastAPI services with Pydantic request/response schemas, SQLAlchemy ORM models, Alembic migrations, and automated Pytest test suites located in `/backend`.
- **Endpoints**:
  - `POST /api/emergencies`: Citizen report registration & deterministic triage scoring.
  - `GET /api/emergencies/:id/track`: Public tracking endpoint for citizens.
  - `PATCH /api/emergencies/:id/verify`: Authority verification status updater.
  - `PATCH /api/emergencies/:id/priority`: Human-in-the-loop priority override with mandatory rationale.
  - `PATCH /api/emergencies/:id/assign`: Concurrency-controlled resource dispatcher.
  - `GET /api/stats`: Dynamic aggregation of active incidents, teams, beds, and capacities.
  - `POST /api/replan/simulate` & `/api/replan/approve`: Dynamic response simulator.

---

## 3. Prioritization & Allocation Engines

### Deterministic Prioritization Engine (`src/services/priorityEngine.ts`)
- Evaluates emergencies with 100% explainable, deterministic mathematical rules without reliance on opaque or rate-limited external APIs:
  - **Category Base Weight**: 10 to 35 pts (e.g. Trapped Person: 35, Fire: 30, Medical: 30, Flood: 25).
  - **Immediate Danger**: +30 pts.
  - **Urgent Medical Care**: +20 pts.
  - **Vulnerable Demographics**: +15 pts.
  - **Casualty Scale**: +5 to +25 pts.
  - **Elapsed Waiting Time**: Escalates unattended incidents (+3 pts per 30 minutes unresponded).
- Outputs priority tier (`Critical`, `High`, `Medium`, `Low`), numeric score (0-100), full factor explanations, and automated missing-data warnings.

### Resource Allocation Solver (`src/services/allocationEngine.ts`)
- Matches emergency category with equipment capabilities (e.g. Aquatic Zodiac boats for floods, hydraulic extrication squads for landslides).
- Calculates great-circle travel distances via the Haversine formula.
- **Road Blockage Detection**: Detects if active road obstructions lie on the transit corridor and penalizes or reroutes units accordingly.
- **Capacity Enforcement**: Prevents assigning patients to diverting hospitals or displaced citizens to full evacuation shelters.

---

## 4. Multi-Agency Portals
1. **Public Citizen Portal**: Incident reporting and tracking.
2. **Main Disaster Authority Dashboard**: 13 sidebar command modules covering live KPIs, GIS maps, reports registry, fleet telemetry, hospital/shelter networks, missing persons, and audit logs.
3. **Rescue Team Portal**: Field squad status toggling, mission commencement, and ground road obstruction reporting.
4. **Hospital Portal**: Real-time bed, ICU, ambulance capacity updating, and incoming casualty streams.
5. **Shelter Portal**: Headcount gauge, ration stockpiles, and automatic intake diversion alarms.
6. **Relief Organization Portal**: Non-governmental aid inventory and delivery progression.

---

## 5. Auditability & Safety Doctrine
Every administrative action (priority override, team assignment, road blockage declaration, dynamic replanning approval, database reset) is immutably logged with an ISO timestamp, actor identity, and operational rationale.
