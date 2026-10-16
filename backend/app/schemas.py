from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class EmergencySubmissionSchema(BaseModel):
    category: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)
    address: Optional[str] = "Coordinates provided"
    latitude: Optional[float] = 17.72
    longitude: Optional[float] = 83.31
    people_affected: int = Field(default=1, ge=1)
    immediate_danger: bool = False
    medical_required: bool = False
    vulnerable_people: bool = False
    vulnerable_details: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    image_url: Optional[str] = None

class EmergencyResponseSchema(EmergencySubmissionSchema):
    id: str
    verification_status: str
    priority: str
    priority_score: int
    priority_factors: List[str]
    missing_info_warnings: List[str]
    recommended_actions: List[str]
    status: str
    assigned_team_ids: List[str]
    assigned_hospital_ids: List[str]
    assigned_shelter_ids: List[str]
    created_at: datetime
    updated_at: datetime

class PriorityOverrideSchema(BaseModel):
    priority: str
    reason: str = Field(..., min_length=5)
    actor: Optional[str] = "Commander"

class VerificationUpdateSchema(BaseModel):
    status: str
    reason: Optional[str] = None
    actor: Optional[str] = "Authority Officer"

class ResourceAssignSchema(BaseModel):
    team_id: Optional[str] = None
    hospital_id: Optional[str] = None
    shelter_id: Optional[str] = None
    actor: Optional[str] = "Incident Commander"
