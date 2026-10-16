"""
SQLAlchemy Database Models for PS-2 Disaster Response & Relief Coordination
Supports PostgreSQL (with SQLite fallback for local development)
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    Index,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class EmergencyReportModel(Base):
    __tablename__ = "emergency_reports"

    id = Column(String(50), primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    people_affected = Column(Integer, default=1, nullable=False)
    immediate_danger = Column(Boolean, default=False, nullable=False)
    medical_required = Column(Boolean, default=False, nullable=False)
    vulnerable_people = Column(Boolean, default=False, nullable=False)
    vulnerable_details = Column(String(255), nullable=True)
    contact_name = Column(String(100), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    verification_status = Column(String(50), default="Unverified", nullable=False, index=True)
    priority = Column(String(20), default="Medium", nullable=False, index=True)
    priority_score = Column(Integer, default=50, nullable=False)
    priority_factors = Column(JSON, default=list)
    missing_info_warnings = Column(JSON, default=list)
    recommended_actions = Column(JSON, default=list)
    status = Column(String(50), default="Submitted", nullable=False, index=True)
    assigned_team_ids = Column(JSON, default=list)
    assigned_hospital_ids = Column(JSON, default=list)
    assigned_shelter_ids = Column(JSON, default=list)
    internal_notes = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    is_simulated = Column(Boolean, default=False)

    __table_args__ = (
        Index("idx_emergency_priority_status", "priority", "status"),
        Index("idx_emergency_geo", "latitude", "longitude"),
    )


class RescueTeamModel(Base):
    __tablename__ = "rescue_teams"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)
    capabilities = Column(JSON, default=list)
    equipment = Column(JSON, default=list)
    personnel_count = Column(Integer, default=10, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    current_status = Column(String(50), default="Available", nullable=False, index=True)
    current_assignment_id = Column(String(50), ForeignKey("emergency_reports.id"), nullable=True)
    contact_phone = Column(String(50), nullable=False)
    leader_name = Column(String(100), nullable=False)
    base_station = Column(String(150), nullable=False)


class HospitalModel(Base):
    __tablename__ = "hospitals"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_beds = Column(Integer, nullable=False)
    available_beds = Column(Integer, nullable=False)
    icu_beds = Column(Integer, nullable=False)
    available_icu = Column(Integer, nullable=False)
    operational_status = Column(String(50), default="Fully Operational", nullable=False)
    has_trauma_center = Column(Boolean, default=False)
    has_burn_unit = Column(Boolean, default=False)
    ambulances_total = Column(Integer, default=5)
    ambulances_available = Column(Integer, default=2)
    blood_supplies = Column(String(50), default="Adequate")
    last_updated = Column(DateTime, default=datetime.utcnow)


class ShelterModel(Base):
    __tablename__ = "shelters"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0, nullable=False)
    is_accessible = Column(Boolean, default=True)
    food_water_status = Column(String(50), default="Abundant")
    medical_kits = Column(Integer, default=50)
    operational_status = Column(String(50), default="Active")
    manager_name = Column(String(100), nullable=False)
    manager_phone = Column(String(50), nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow)


class MissingPersonModel(Base):
    __tablename__ = "missing_persons"

    id = Column(String(50), primary_key=True, index=True)
    type = Column(String(50), nullable=False, index=True) # Missing or Found/Sheltered
    name = Column(String(100), nullable=False, index=True)
    approx_age = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    description = Column(Text, nullable=False)
    last_known_location = Column(String(255), nullable=False)
    found_location = Column(String(255), nullable=True)
    shelter_id = Column(String(50), ForeignKey("shelters.id"), nullable=True)
    contact_info = Column(String(255), nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Reported", index=True)
    matched_with_id = Column(String(50), nullable=True)
    match_confidence = Column(Integer, nullable=True)
    match_reasons = Column(JSON, default=list)


class BlockedRoadModel(Base):
    __tablename__ = "blocked_roads"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String(50), default="Total Blockage")
    reported_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Active", index=True)


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    details = Column(Text, nullable=False)
    emergency_id = Column(String(50), nullable=True)
