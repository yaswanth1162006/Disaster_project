import {
  EmergencyReport,
  RescueTeam,
  Hospital,
  Shelter,
  ReliefOrganization,
  MissingPerson,
  BlockedRoad,
  NotificationItem,
  AuditLog,
  ResourceRecommendation,
  ReplanScenario,
  PriorityLevel,
  VerificationStatus,
  EmergencyStatus,
} from '../types/disaster';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) errorMsg = errorJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Statistics
  getStats: () =>
    request<{
      total_reports: number;
      unverified_reports: number;
      critical_emergencies: number;
      high_priority_emergencies: number;
      active_rescue_operations: number;
      available_rescue_teams: number;
      available_ambulances: number;
      operational_hospitals: number;
      available_shelter_capacity: number;
      missing_person_reports: number;
      resolved_emergencies: number;
    }>('/stats'),

  // Emergencies
  getEmergencies: (params?: {
    category?: string;
    priority?: string;
    status?: string;
    verification?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.status) query.append('status', params.status);
    if (params?.verification) query.append('verification', params.verification);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return request<EmergencyReport[]>(`/emergencies${qs ? `?${qs}` : ''}`);
  },

  submitEmergency: (data: {
    category: string;
    description: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    people_affected: number;
    immediate_danger: boolean;
    medical_required: boolean;
    vulnerable_people: boolean;
    vulnerable_details?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    image_url?: string;
  }) =>
    request<{ success: boolean; report: EmergencyReport; message: string }>('/emergencies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  trackEmergency: (id: string) =>
    request<{
      id: string;
      category: string;
      address: string;
      status: string;
      verification_status: string;
      priority: string;
      people_affected: number;
      created_at: string;
      updated_at: string;
      assigned_teams: Array<{ name: string; type: string; status: string }>;
      notes_count: number;
    }>(`/emergencies/${id}/track`),

  verifyEmergency: (id: string, status: VerificationStatus, reason?: string, actor?: string) =>
    request<{ success: boolean; report: EmergencyReport }>(`/emergencies/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason, actor }),
    }),

  overridePriority: (id: string, priority: PriorityLevel, reason: string, actor?: string) =>
    request<{ success: boolean; report: EmergencyReport }>(`/emergencies/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority, reason, actor }),
    }),

  assignResources: (
    id: string,
    data: { team_id?: string; hospital_id?: string; shelter_id?: string; actor?: string }
  ) =>
    request<{ success: boolean; report: EmergencyReport; rescueTeams: RescueTeam[] }>(
      `/emergencies/${id}/assign`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  updateEmergencyStatus: (
    id: string,
    data: { status: EmergencyStatus; actor?: string; resolution_notes?: string }
  ) =>
    request<{ success: boolean; report: EmergencyReport; rescueTeams: RescueTeam[] }>(
      `/emergencies/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  addEmergencyNote: (id: string, text: string, author?: string) =>
    request<{ success: boolean; report: EmergencyReport }>(`/emergencies/${id}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ text, author }),
    }),

  getRecommendations: (id: string) =>
    request<ResourceRecommendation>(`/recommendations/${id}`),

  // Rescue Teams
  getRescueTeams: () => request<RescueTeam[]>('/rescue-teams'),

  updateTeamStatus: (id: string, status: string, actor?: string) =>
    request<{ success: boolean; team: RescueTeam }>(`/rescue-teams/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actor }),
    }),

  reportRoadBlockage: (
    teamId: string,
    data: { name: string; description: string; latitude?: number; longitude?: number; severity?: string }
  ) =>
    request<{ success: boolean; blockage: BlockedRoad }>(`/rescue-teams/${teamId}/report-blockage`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Hospitals
  getHospitals: () => request<Hospital[]>('/hospitals'),

  updateHospitalCapacity: (
    id: string,
    data: {
      available_beds?: number;
      available_icu?: number;
      operational_status?: string;
      ambulances_available?: number;
      blood_supplies?: string;
      actor?: string;
    }
  ) =>
    request<{ success: boolean; hospital: Hospital }>(`/hospitals/${id}/capacity`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Shelters
  getShelters: () => request<Shelter[]>('/shelters'),

  updateShelterOccupancy: (
    id: string,
    data: {
      current_occupancy?: number;
      food_water_status?: string;
      operational_status?: string;
      medical_kits?: number;
      actor?: string;
    }
  ) =>
    request<{ success: boolean; shelter: Shelter }>(`/shelters/${id}/occupancy`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Relief Organizations
  getReliefOrgs: () => request<ReliefOrganization[]>('/relief-orgs'),

  updateReliefTask: (
    orgId: string,
    taskId: string,
    data: { status?: string; progress?: number; actor?: string }
  ) =>
    request<{ success: boolean; organization: ReliefOrganization }>(
      `/relief-orgs/${orgId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  updateReliefInventory: (
    orgId: string,
    data: {
      supplies?: Partial<ReliefOrganization['supplies_inventory']>;
      volunteers?: number;
      vehicles?: number;
      actor?: string;
    }
  ) =>
    request<{ success: boolean; organization: ReliefOrganization }>(
      `/relief-orgs/${orgId}/inventory`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  // Missing Persons
  getMissingPersons: () => request<MissingPerson[]>('/missing-persons'),

  registerMissingPerson: (data: Partial<MissingPerson>) =>
    request<{ success: boolean; person: MissingPerson }>('/missing-persons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reuniteMissingPerson: (id: string, data: { matched_id?: string; actor?: string; notes?: string }) =>
    request<{ success: boolean; person: MissingPerson }>(`/missing-persons/${id}/reunite`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Blocked Roads
  getBlockedRoads: () => request<BlockedRoad[]>('/blocked-roads'),

  clearBlockedRoad: (id: string) =>
    request<{ success: boolean; road: BlockedRoad }>(`/blocked-roads/${id}/clear`, {
      method: 'PATCH',
    }),

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  broadcastNotification: (data: { title: string; message: string; level: string; actor?: string }) =>
    request<{ success: boolean; message: string }>('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dynamic Replanning Simulator
  getReplanScenarios: () => request<ReplanScenario[]>('/replan/scenarios'),

  simulateReplan: (scenario_id: string) =>
    request<{ scenario: ReplanScenario; activeDatabaseState: any }>('/replan/simulate', {
      method: 'POST',
      body: JSON.stringify({ scenario_id }),
    }),

  approveReplan: (scenario_id: string, actor?: string, approval_rationale?: string) =>
    request<{ success: boolean; message: string; scenario: ReplanScenario }>('/replan/approve', {
      method: 'POST',
      body: JSON.stringify({ scenario_id, actor, approval_rationale }),
    }),

  // Audit Logs
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),

  // Safe Demo Reset
  resetDemoDatabase: (actor?: string) =>
    request<{ success: boolean; message: string }>('/reset-demo', {
      method: 'POST',
      body: JSON.stringify({ actor }),
    }),

  // Real-time Event Subscription (SSE with auto-reconnect fallback)
  subscribeEvents: (onEvent: (event: { type: string; payload: any }) => void) => {
    let eventSource: EventSource | null = null;
    let isClosed = false;

    const connect = () => {
      if (isClosed) return;
      try {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            onEvent(data);
          } catch {
            // ignore non-json
          }
        };
        eventSource.onerror = () => {
          eventSource?.close();
          if (!isClosed) {
            setTimeout(connect, 3000);
          }
        };
      } catch {
        if (!isClosed) setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isClosed = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  },
};
