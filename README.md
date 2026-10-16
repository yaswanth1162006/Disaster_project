# PS-2 — When Every Minute Changes the Answer: Intelligent Disaster Response & Relief Coordination

A unified, full-stack disaster management command system engineered for high-stakes emergency scenarios (floods, cyclones, earthquakes, landslides, fires). It bridges real-time citizen distress reporting with an explainable deterministic priority engine, multi-agency resource allocation solver, interactive Leaflet GIS mapping, missing-persons reunification, and dynamic response replanning.

---

## 🌟 Key Capabilities

### 1. Citizen Emergency Portal (Default Homepage)
- **Zero Friction**: Submit emergency requests immediately without mandatory login or account creation.
- **Accurate Telemetry**: One-click device GPS capture with automatic coordinates and address lookup.
- **Detailed Triage Input**: Affected headcount, immediate threat to life flag, medical care required, and vulnerable demographics (infants, elderly, disabled).
- **Instant Request ID**: Generates a unique tracking code (e.g. `EMG-2026-1001`) with copyable link.
- **Real-Time Request Tracker**: Citizens can inspect status updates and assigned rescue units anytime.
- **Emergency Life-Safety Guides**: Immediate survival protocols for floods, landslides, fires, and cyclones.

### 2. Main Disaster Command Dashboard (13 Functional Modules)
1. **Overview**: Dynamic live KPIs (reports, unverified, critical, teams, beds, shelter capacity) and GIS map.
2. **Emergency Reports**: Searchable, filterable incident registry with verification status, priority overrides with mandatory recorded justification, and resource dispatch dialogs.
3. **Rescue Teams**: Fleet management tracking squad positions, heavy equipment, and active assignments.
4. **Hospitals**: Trauma center network monitoring available general beds, ICU beds, and ambulance readiness.
5. **Shelters**: Evacuation camps with live occupancy gauges, ration statuses, and automatic intake diversion.
6. **Relief Organizations**: Humanitarian NGO inventories (food kits, water liters, blankets) and delivery missions.
7. **Missing Persons**: Algorithmic similarity candidate matching, non-sensitive attribute scoring, and authorized reunification confirmation.
8. **Resource Allocation**: Algorithmic solver matching incident requirements with nearest compatible units while checking road blockages.
9. **Disaster GIS Map**: Full interactive Leaflet map with OpenStreetMap, color-coded priority pins, danger radius circles, and layer toggles.
10. **Alerts & Broadcasts**: Real-time network alert console with high-priority ticker tape and notification history.
11. **Reports & Analytics**: Visual charts (Recharts) showing incident distributions and severity ratios.
12. **User Management**: Role-based access control registry detailing credentials and clearance levels.
13. **Settings & Audit Logs**: Immutable chronological record of all administrative actions and safe demo baseline reset.

### 3. Dedicated Agency Portals
- **Rescue Team Portal**: Squad unit selector, operational status updates (Available, Dispatched, On Scene, Resting), mission start/completion, and on-ground road blockage reporting.
- **Hospital Portal**: Real-time bed, ICU, ambulance capacity updating, and incoming casualty streams.
- **Shelter Portal**: Headcount gauge, food/water supplies, and capacity alarm thresholds.
- **Relief Organization Portal**: Non-governmental aid inventory management and delivery task progression.

### 4. Deterministic Prioritization Engine (`src/services/priorityEngine.ts`)
- 100% testable, mathematical scoring algorithm (0-100 pts) evaluating category weights, immediate danger (+30 pts), medical urgency (+20 pts), vulnerable people (+15 pts), casualty volume, and elapsed unresponded time.
- Generates auditable factor breakdowns and automated missing-data warnings.

### 5. Dynamic Response Replanning Simulator (`DynamicReplanModal.tsx`)
- Allows authorized commanders to test disaster contingencies (Flash Flood Surge, Arterial Bridge Collapse, USAR Vehicle Breakdown, Shelter Full Capacity, Hospital Diversion).
- Shows side-by-side comparison of baseline vs proposed allocations with algorithmic justifications and human-in-the-loop sign-off.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Recharts, Lucide Icons.
- **Full-Stack Server**: Node.js & Express running on Port 3000 with Vite middleware integration.
- **Database & Persistence**: File-backed relational JSON database (`data/database.json`) with atomic writes and transaction safety.
- **Python Backend**: Reference FastAPI application (`backend/app/main.py`) with SQLAlchemy models (`backend/app/models.py`), Pydantic schemas (`backend/app/schemas.py`), and Alembic migrations.
- **Real-Time Layer**: Server-Sent Events (SSE) stream (`/api/events`) with automatic client reconnection.
- **Automated Testing**: TypeScript E2E integration test suite (`scripts/run_e2e_tests.ts`) executing all 12 operational lifecycle steps.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full-Stack Application
```bash
npm run dev
```
The server will start on `http://localhost:3000` with the complete REST API and React client mounted.

### 3. Run Automated Integration Tests
```bash
npm run test
```
Executes the comprehensive 12-step end-to-end integration test suite covering citizen submission, database persistence, priority scoring, resource matching, road blockage rerouting, and dynamic replanning.

---

## 👥 Demo Accounts & Roles
Switch roles instantly using the top header dropdown:
| Role | Demo Identity | Access Level |
|------|---------------|--------------|
| **Citizen (Public)** | Anonymous Citizen | Self-report hotline & tracking |
| **Disaster Authority** | Cmdr. K. Rao | Full Command Center & 13 Modules |
| **Rescue Team** | Cmdr. Vikram Singhania (NDRF Boat Unit) | Field status, mission ops, road blockage reports |
| **Hospital Staff** | Dr. A. Sharma (Apex Trauma Center) | Bed, ICU, ambulance capacity manager |
| **Shelter Manager** | Suresh Babu (East Arena Camp) | Evacuation intake & ration supplies |
| **Relief Organization** | Mariam Al-Mansoor (Red Crescent) | Stockpiles & task delivery progress |

---

## 📂 Project Structure
```
disaster-response/
├── backend/                  # Python FastAPI architecture
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   └── schemas.py        # Pydantic validation schemas
│   └── requirements.txt      # Python dependencies
├── data/
│   └── database.json         # Persistent database storage
├── docs/
│   └── ARCHITECTURE.md       # Comprehensive system architecture
├── scripts/
│   └── run_e2e_tests.ts      # Automated 12-step integration test runner
├── src/
│   ├── components/
│   │   ├── AuthorityDashboard.tsx    # 13-module command center
│   │   ├── CitizenPortal.tsx         # Default emergency reporting page
│   │   ├── DisasterMapComponent.tsx  # Leaflet GIS map
│   │   ├── DynamicReplanModal.tsx    # Replanning simulator
│   │   ├── HospitalPortal.tsx        # Hospital triage portal
│   │   ├── Navbar.tsx                # Header & role switcher
│   │   ├── ReliefPortal.tsx          # Relief organization portal
│   │   ├── RescuePortal.tsx          # Rescue team field portal
│   │   ├── ShelterPortal.tsx         # Evacuation shelter portal
│   │   └── TrackEmergencyModal.tsx   # Citizen tracking modal
│   ├── data/
│   │   └── seedData.ts       # Realistic baseline demonstration records
│   ├── services/
│   │   ├── allocationEngine.ts       # Solver & routing obstacle detector
│   │   ├── api.ts                    # Centralized frontend API client & SSE
│   │   └── priorityEngine.ts         # Deterministic prioritization engine
│   ├── types/
│   │   └── disaster.ts       # TypeScript definitions & interfaces
│   ├── App.tsx               # Main application router
│   ├── index.css             # Tailwind CSS styles
│   └── main.tsx              # React mounting root
├── server.ts                 # Express full-stack server & Vite middleware
├── package.json              # App configuration & scripts
└── tsconfig.json             # TypeScript compiler settings
```

---

## 🔒 Safety Doctrine & Privacy
- Public citizen reports do not expose private personal phone numbers or identifiers in public tracking feeds.
- Priority engine is explicitly deterministic and auditable; no AI hallucinations or black-box failures.
- No critical emergency assignment is cancelled or altered without recorded commander authorization and auditable justification.
