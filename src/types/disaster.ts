export type EmergencyCategory =
  | 'Flood'
  | 'Cyclone'
  | 'Earthquake'
  | 'Landslide'
  | 'Fire'
  | 'Medical Emergency'
  | 'Trapped Person'
  | 'Missing Person'
  | 'Food or Water Shortage'
  | 'Other';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type VerificationStatus =
  | 'Unverified'
  | 'Verified'
  | 'Flagged Incomplete'
  | 'Flagged Conflicting';

export type EmergencyStatus =
  | 'Submitted'
  | 'Verified'
  | 'Dispatched'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export interface EmergencyReport {
  id: string;
  category: EmergencyCategory;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  people_affected: number;
  immediate_danger: boolean;
  medical_required: boolean;
  vulnerable_people: boolean;
  vulnerable_details?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  image_url?: string;
  verification_status: VerificationStatus;
  priority: PriorityLevel;
  priority_score: number;
  priority_factors: string[];
  missing_info_warnings?: string[];
  recommended_actions?: string[];
  status: EmergencyStatus;
  assigned_team_ids: string[];
  assigned_hospital_ids: string[];
  assigned_shelter_ids: string[];
  internal_notes: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  is_simulated?: boolean;
}

export type RescueTeamType =
  | 'Boat Rescue'
  | 'Urban SAR'
  | 'Medical First Response'
  | 'Aviation Support'
  | 'Hazmat & Fire'
  | 'Quick Response';

export type TeamStatus = 'Available' | 'Dispatched' | 'On Scene' | 'Resting' | 'Maintenance';

export interface RescueTeam {
  id: string;
  name: string;
  type: RescueTeamType;
  capabilities: string[];
  equipment: string[];
  personnel_count: number;
  latitude: number;
  longitude: number;
  current_status: TeamStatus;
  current_assignment_id: string | null;
  contact_phone: string;
  leader_name: string;
  base_station: string;
}

export type HospitalStatus = 'Fully Operational' | 'Critical Capacity' | 'Diverting' | 'Damaged';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  available_beds: number;
  icu_beds: number;
  available_icu: number;
  operational_status: HospitalStatus;
  has_trauma_center: boolean;
  has_burn_unit: boolean;
  ambulances_total: number;
  ambulances_available: number;
  blood_supplies: 'Adequate' | 'Low' | 'Critical Shortage';
  last_updated: string;
}

export type ShelterStatus = 'Active' | 'At Capacity' | 'Needs Evacuation' | 'Closing';

export interface Shelter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  current_occupancy: number;
  is_accessible: boolean;
  food_water_status: 'Abundant' | 'Moderate' | 'Low' | 'Depleted';
  medical_kits: number;
  operational_status: ShelterStatus;
  manager_name: string;
  manager_phone: string;
  last_updated: string;
}

export interface ReliefTask {
  id: string;
  title: string;
  destination: string;
  status: 'Pending' | 'In Transit' | 'Delivered';
  progress: number;
  target_date: string;
  supplies_summary: string;
}

export interface ReliefOrganization {
  id: string;
  name: string;
  lead_contact: string;
  phone: string;
  volunteers_active: number;
  vehicles_available: number;
  supplies_inventory: {
    food_kits: number;
    water_liters: number;
    hygiene_packs: number;
    blankets: number;
    medical_tents: number;
  };
  assigned_tasks: ReliefTask[];
}

export interface MissingPerson {
  id: string;
  type: 'Missing' | 'Found/Sheltered';
  name: string;
  approx_age: number | string;
  gender: string;
  description: string;
  last_known_location: string;
  found_location?: string;
  shelter_id?: string;
  contact_info: string;
  reported_at: string;
  status: 'Reported' | 'Potential Match Found' | 'Reunited' | 'Closed';
  matched_with_id?: string;
  match_confidence?: number;
  match_reasons?: string[];
  photo_url?: string;
}

export interface BlockedRoad {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: 'Total Blockage' | 'High Clearance Only' | 'Flooded';
  reported_at: string;
  status: 'Active' | 'Cleared';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  level: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
  category: string;
  target_role: string;
  link_id?: string;
  is_read: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  emergency_id?: string;
}

export interface ResourceRecommendation {
  emergency_id: string;
  recommended_teams: Array<{
    team: RescueTeam;
    distance_km: number;
    estimated_arrival_minutes: number;
    match_score: number;
    match_reasons: string[];
    is_blocked: boolean;
  }>;
  recommended_hospitals: Array<{
    hospital: Hospital;
    distance_km: number;
    available_beds: number;
    has_trauma: boolean;
    recommendation_note: string;
  }>;
  recommended_shelters: Array<{
    shelter: Shelter;
    distance_km: number;
    remaining_capacity: number;
    recommendation_note: string;
  }>;
  allocation_summary: string;
}

export interface ReplanScenario {
  id: string;
  name: string;
  description: string;
  type:
    | 'CRITICAL_SURGE'
    | 'ROAD_BLOCK'
    | 'TEAM_DOWN'
    | 'SHELTER_FULL'
    | 'HOSPITAL_DROP'
    | 'SUPPLY_SHORTAGE';
  impact_summary: string;
  previous_plan: {
    emergency_id: string;
    assigned_team_id?: string;
    assigned_hospital_id?: string;
    assigned_shelter_id?: string;
    status: string;
  };
  proposed_plan: {
    emergency_id: string;
    assigned_team_id?: string;
    assigned_hospital_id?: string;
    assigned_shelter_id?: string;
    status: string;
    reason_for_change: string;
    tradeoffs: string;
  };
}

export type UserRole =
  | 'citizen'
  | 'authority'
  | 'rescue_team'
  | 'hospital'
  | 'shelter_manager'
  | 'relief_org';

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  entityId?: string; // e.g. team id or hospital id
}
