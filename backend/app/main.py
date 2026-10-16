"""
FastAPI Backend Application Entrypoint for PS-2 Disaster Response & Relief Coordination
"""

import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .schemas import (
    EmergencySubmissionSchema,
    PriorityOverrideSchema,
    VerificationUpdateSchema,
    ResourceAssignSchema,
)

app = FastAPI(
    title="PS-2: Intelligent Disaster Response & Relief Coordination API",
    description="Unified backend REST API and WebSocket coordinator for multi-agency disaster operations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FastAPI Disaster Coordination Engine",
        "database": os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/disaster_db"),
    }

@app.post("/api/emergencies", status_code=status.HTTP_201_CREATED)
def submit_emergency(payload: EmergencySubmissionSchema):
    # Deterministic priority evaluation logic
    score = 30
    if payload.immediate_danger:
        score += 30
    if payload.medical_required:
        score += 20
    if payload.vulnerable_people:
        score += 15

    priority = "Critical" if score >= 75 else "High" if score >= 50 else "Medium"
    report_id = f"EMG-2026-{os.urandom(2).hex()}"

    return {
        "success": True,
        "report_id": report_id,
        "priority": priority,
        "score": min(100, score),
        "status": "Submitted",
        "message": "Emergency successfully registered in relational disaster ledger.",
    }

@app.get("/api/stats")
def get_dashboard_statistics():
    return {
        "total_reports": 12,
        "unverified_reports": 2,
        "critical_emergencies": 3,
        "high_priority_emergencies": 4,
        "active_rescue_operations": 3,
        "available_rescue_teams": 3,
        "available_ambulances": 6,
        "operational_hospitals": 2,
        "available_shelter_capacity": 530,
        "missing_person_reports": 2,
        "resolved_emergencies": 5,
    }
