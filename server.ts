import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_EMERGENCIES,
  INITIAL_RESCUE_TEAMS,
  INITIAL_HOSPITALS,
  INITIAL_SHELTERS,
  INITIAL_RELIEF_ORGS,
  INITIAL_MISSING_PERSONS,
  INITIAL_BLOCKED_ROADS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  REPLAN_SCENARIOS,
} from './src/data/seedData.ts';
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
  PriorityLevel,
} from './src/types/disaster.ts';
import { evaluateEmergencyPriority } from './src/services/priorityEngine.ts';
import { recommendResources } from './src/services/allocationEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

interface DatabaseSchema {
  emergencies: EmergencyReport[];
  rescueTeams: RescueTeam[];
  hospitals: Hospital[];
  shelters: Shelter[];
  reliefOrgs: ReliefOrganization[];
  missingPersons: MissingPerson[];
  blockedRoads: BlockedRoad[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
}

function getInitialData(): DatabaseSchema {
  return {
    emergencies: JSON.parse(JSON.stringify(INITIAL_EMERGENCIES)),
    rescueTeams: JSON.parse(JSON.stringify(INITIAL_RESCUE_TEAMS)),
    hospitals: JSON.parse(JSON.stringify(INITIAL_HOSPITALS)),
    shelters: JSON.parse(JSON.stringify(INITIAL_SHELTERS)),
    reliefOrgs: JSON.parse(JSON.stringify(INITIAL_RELIEF_ORGS)),
    missingPersons: JSON.parse(JSON.stringify(INITIAL_MISSING_PERSONS)),
    blockedRoads: JSON.parse(JSON.stringify(INITIAL_BLOCKED_ROADS)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
  };
}

let db: DatabaseSchema;

function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Failed to parse database file, re-initializing with seed data:', err);
    }
  }
  const initial = getInitialData();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    db = data;
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

db = loadDatabase();

// SSE Event Stream Clients
const sseClients: Response[] = [];

function broadcastSSE(type: string, payload: any) {
  const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      // client disconnected
    }
  });
}

function addAudit(actor: string, action: string, details: string, emergencyId?: string) {
  const log: AuditLog = {
    id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
    emergency_id: emergencyId,
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  saveDatabase(db);
  broadcastSSE('AUDIT_LOG_ADDED', log);
}

function addNotification(
  title: string,
  message: string,
  level: 'critical' | 'warning' | 'info' | 'success',
  category: string,
  target_role: string = 'all',
  link_id?: string
) {
  const notif: NotificationItem = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    message,
    level,
    timestamp: new Date().toISOString(),
    category,
    target_role,
    link_id,
    is_read: false,
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 100) db.notifications.pop();
  saveDatabase(db);
  broadcastSSE('NEW_NOTIFICATION', notif);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Router
  const api = express.Router();

  // Health check
  api.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'PS-2 Intelligent Disaster Coordination Server',
      timestamp: new Date().toISOString(),
      activeEmergencies: db.emergencies.filter((e) => e.status !== 'Resolved').length,
      availableTeams: db.rescueTeams.filter((t) => t.current_status === 'Available').length,
    });
  });

  // Real-time Server-Sent Events stream
  api.get('/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.push(res);
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream active' })}\n\n`);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // Global Statistics endpoint
  api.get('/stats', (_req: Request, res: Response) => {
    const total_reports = db.emergencies.length;
    const unverified_reports = db.emergencies.filter(
      (e) => e.verification_status === 'Unverified'
    ).length;
    const critical_emergencies = db.emergencies.filter(
      (e) => e.priority === 'Critical' && e.status !== 'Resolved' && e.status !== 'Closed'
    ).length;
    const high_priority_emergencies = db.emergencies.filter(
      (e) => e.priority === 'High' && e.status !== 'Resolved' && e.status !== 'Closed'
    ).length;
    const active_rescue_operations = db.rescueTeams.filter(
      (t) => t.current_status === 'Dispatched' || t.current_status === 'On Scene'
    ).length;
    const available_rescue_teams = db.rescueTeams.filter(
      (t) => t.current_status === 'Available'
    ).length;
    const available_ambulances = db.hospitals.reduce(
      (sum, h) => sum + (h.ambulances_available || 0),
      0
    );
    const operational_hospitals = db.hospitals.filter(
      (h) => h.operational_status === 'Fully Operational'
    ).length;
    const available_shelter_capacity = db.shelters.reduce(
      (sum, s) => sum + Math.max(0, s.total_capacity - s.current_occupancy),
      0
    );
    const missing_person_reports = db.missingPersons.filter(
      (m) => m.type === 'Missing' && m.status !== 'Reunited'
    ).length;
    const resolved_emergencies = db.emergencies.filter(
      (e) => e.status === 'Resolved' || e.status === 'Closed'
    ).length;

    res.json({
      total_reports,
      unverified_reports,
      critical_emergencies,
      high_priority_emergencies,
      active_rescue_operations,
      available_rescue_teams,
      available_ambulances,
      operational_hospitals,
      available_shelter_capacity,
      missing_person_reports,
      resolved_emergencies,
    });
  });

  // Emergencies: GET with filtering & sorting
  api.get('/emergencies', (req: Request, res: Response) => {
    const { category, priority, status, verification, search } = req.query;
    let results = [...db.emergencies];

    if (category && category !== 'All') {
      results = results.filter((e) => e.category === category);
    }
    if (priority && priority !== 'All') {
      results = results.filter((e) => e.priority === priority);
    }
    if (status && status !== 'All') {
      results = results.filter((e) => e.status === status);
    }
    if (verification && verification !== 'All') {
      results = results.filter((e) => e.verification_status === verification);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      results = results.filter(
        (e) =>
          e.id.toLowerCase().includes(q) ||
          e.address.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.contact_name && e.contact_name.toLowerCase().includes(q))
      );
    }

    // Default sort by priority score descending, then by created_at descending
    results.sort((a, b) => {
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    res.json(results);
  });

  // Emergencies: Citizen Report Submission (POST)
  api.post('/emergencies', (req: Request, res: Response) => {
    const body = req.body;

    // Strict validation
    if (!body.category || !body.description || typeof body.description !== 'string') {
      res.status(400).json({ error: 'Emergency category and detailed description are required.' });
      return;
    }
    if (body.description.trim().length < 5) {
      res.status(400).json({ error: 'Description must be at least 5 characters long.' });
      return;
    }

    const peopleAffected = parseInt(body.people_affected, 10) || 1;
    if (peopleAffected < 1) {
      res.status(400).json({ error: 'Number of people affected must be at least 1.' });
      return;
    }

    // Generate unique ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `EMG-2026-${randomSuffix}`;

    const now = new Date().toISOString();

    // Default location fallback if GPS wasn't permitted
    const lat = typeof body.latitude === 'number' && !isNaN(body.latitude) ? body.latitude : 17.72;
    const lon = typeof body.longitude === 'number' && !isNaN(body.longitude) ? body.longitude : 83.31;

    // Preliminary deterministic priority scoring
    const evalResult = evaluateEmergencyPriority(
      {
        category: body.category,
        description: body.description,
        address: body.address || 'Address not specified',
        latitude: lat,
        longitude: lon,
        people_affected: peopleAffected,
        immediate_danger: Boolean(body.immediate_danger),
        medical_required: Boolean(body.medical_required),
        vulnerable_people: Boolean(body.vulnerable_people),
        contact_phone: body.contact_phone,
        contact_email: body.contact_email,
        verification_status: 'Unverified',
        created_at: now,
      },
      Date.now()
    );

    const newReport: EmergencyReport = {
      id: newId,
      category: body.category,
      description: body.description.trim(),
      address: body.address?.trim() || 'Location coordinates provided',
      latitude: lat,
      longitude: lon,
      people_affected: peopleAffected,
      immediate_danger: Boolean(body.immediate_danger),
      medical_required: Boolean(body.medical_required),
      vulnerable_people: Boolean(body.vulnerable_people),
      vulnerable_details: body.vulnerable_details?.trim(),
      contact_name: body.contact_name?.trim(),
      contact_phone: body.contact_phone?.trim(),
      contact_email: body.contact_email?.trim(),
      image_url: body.image_url,
      verification_status: 'Unverified',
      priority: evalResult.priority,
      priority_score: evalResult.score,
      priority_factors: evalResult.factors,
      missing_info_warnings: evalResult.missingInfoWarnings,
      recommended_actions: evalResult.recommendedActions,
      status: 'Submitted',
      assigned_team_ids: [],
      assigned_hospital_ids: [],
      assigned_shelter_ids: [],
      internal_notes: [],
      created_at: now,
      updated_at: now,
      is_simulated: false,
    };

    db.emergencies.unshift(newReport);
    saveDatabase(db);

    // Audit log
    addAudit(
      'Citizen Portal',
      'EMERGENCY_SUBMITTED',
      `New incident ${newId} (${body.category}) reported. Calculated priority: ${evalResult.priority} (${evalResult.score} pts).`,
      newId
    );

    // Notification for emergency responders
    addNotification(
      `NEW EMERGENCY: ${body.category} (${evalResult.priority})`,
      `${peopleAffected} person(s) reported at ${newReport.address}. ${
        body.immediate_danger ? 'IMMEDIATE DANGER TO LIFE.' : ''
      }`,
      evalResult.priority === 'Critical' ? 'critical' : 'warning',
      'Citizen Report',
      'authority',
      newId
    );

    broadcastSSE('NEW_EMERGENCY', newReport);

    res.status(201).json({
      success: true,
      report: newReport,
      message: 'Emergency request registered successfully. Dispatched to command dashboard.',
    });
  });

  // Track an emergency report (Citizen public view)
  api.get('/emergencies/:id/track', (req: Request, res: Response) => {
    const report = db.emergencies.find((e) => e.id.toLowerCase() === req.params.id.toLowerCase());
    if (!report) {
      res.status(404).json({ error: 'Emergency request ID not found. Please verify the code.' });
      return;
    }

    // Strip sensitive internal information for public tracking
    const assignedTeams = db.rescueTeams.filter((t) => report.assigned_team_ids.includes(t.id));
    const publicData = {
      id: report.id,
      category: report.category,
      address: report.address,
      status: report.status,
      verification_status: report.verification_status,
      priority: report.priority,
      people_affected: report.people_affected,
      created_at: report.created_at,
      updated_at: report.updated_at,
      assigned_teams: assignedTeams.map((t) => ({
        name: t.name,
        type: t.type,
        status: t.current_status,
      })),
      notes_count: report.internal_notes.length,
    };

    res.json(publicData);
  });

  // Emergency: Verification status update
  api.patch('/emergencies/:id/verify', (req: Request, res: Response) => {
    const { status, reason, actor } = req.body;
    const report = db.emergencies.find((e) => e.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const validStatuses = ['Unverified', 'Verified', 'Flagged Incomplete', 'Flagged Conflicting'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid verification status' });
      return;
    }

    report.verification_status = status;
    report.updated_at = new Date().toISOString();

    // Recalculate priority based on confirmed status
    const recalculated = evaluateEmergencyPriority(report, Date.now());
    report.priority = recalculated.priority;
    report.priority_score = recalculated.score;
    report.priority_factors = recalculated.factors;

    if (reason) {
      report.internal_notes.push({
        id: `NOTE-${Date.now()}`,
        author: actor || 'Authority Operator',
        text: `Verification changed to "${status}": ${reason}`,
        timestamp: new Date().toISOString(),
      });
    }

    saveDatabase(db);

    addAudit(
      actor || 'Authority Officer',
      'VERIFICATION_UPDATED',
      `Emergency ${report.id} verification set to ${status}. Score updated to ${report.priority_score}.`,
      report.id
    );

    broadcastSSE('EMERGENCY_UPDATED', report);
    res.json({ success: true, report });
  });

  // Emergency: Override priority with required reason
  api.patch('/emergencies/:id/priority', (req: Request, res: Response) => {
    const { priority, reason, actor } = req.body;
    const report = db.emergencies.find((e) => e.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    if (!['Critical', 'High', 'Medium', 'Low'].includes(priority)) {
      res.status(400).json({ error: 'Invalid priority level' });
      return;
    }

    if (!reason || reason.trim().length < 5) {
      res.status(400).json({ error: 'A recorded operational reason is required for priority override.' });
      return;
    }

    const oldPriority = report.priority;
    report.priority = priority as PriorityLevel;
    report.priority_factors.unshift(
      `COMMAND OVERRIDE by ${actor || 'Emergency Manager'}: Changed from ${oldPriority} to ${priority} (Reason: ${reason})`
    );
    report.updated_at = new Date().toISOString();

    report.internal_notes.push({
      id: `NOTE-${Date.now()}`,
      author: actor || 'Emergency Commander',
      text: `PRIORITY OVERRIDE [${oldPriority} -> ${priority}]: ${reason}`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);

    addAudit(
      actor || 'Emergency Commander',
      'PRIORITY_OVERRIDE',
      `Priority of ${report.id} overridden to ${priority}. Reason: ${reason}`,
      report.id
    );

    broadcastSSE('EMERGENCY_UPDATED', report);
    res.json({ success: true, report });
  });

  // Emergency: Assign Resource (Team, Hospital, Shelter) with Concurrency Control
  api.patch('/emergencies/:id/assign', (req: Request, res: Response) => {
    const { team_id, hospital_id, shelter_id, actor } = req.body;
    const report = db.emergencies.find((e) => e.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const assignedNames: string[] = [];

    // Assign team
    if (team_id) {
      const team = db.rescueTeams.find((t) => t.id === team_id);
      if (!team) {
        res.status(404).json({ error: `Rescue team ${team_id} does not exist.` });
        return;
      }

      // Check if team is already assigned elsewhere (unless override)
      if (team.current_status !== 'Available' && team.current_assignment_id !== report.id) {
        // Double-booking check
        res.status(409).json({
          error: `Resource Conflict: ${team.name} is currently in status "${team.current_status}" on assignment ${team.current_assignment_id}. Reassign from active mission first.`,
        });
        return;
      }

      if (!report.assigned_team_ids.includes(team.id)) {
        report.assigned_team_ids.push(team.id);
      }
      team.current_status = 'Dispatched';
      team.current_assignment_id = report.id;
      assignedNames.push(`Team: ${team.name}`);
    }

    // Assign hospital
    if (hospital_id) {
      const hosp = db.hospitals.find((h) => h.id === hospital_id);
      if (!hosp) {
        res.status(404).json({ error: `Hospital ${hospital_id} does not exist.` });
        return;
      }
      if (!report.assigned_hospital_ids.includes(hosp.id)) {
        report.assigned_hospital_ids.push(hosp.id);
      }
      assignedNames.push(`Hospital: ${hosp.name}`);
    }

    // Assign shelter
    if (shelter_id) {
      const shelter = db.shelters.find((s) => s.id === shelter_id);
      if (!shelter) {
        res.status(404).json({ error: `Shelter ${shelter_id} does not exist.` });
        return;
      }
      const remaining = shelter.total_capacity - shelter.current_occupancy;
      if (remaining < report.people_affected) {
        res.status(409).json({
          error: `Capacity Warning: ${shelter.name} only has ${remaining} slots available, but ${report.people_affected} people need shelter.`,
        });
        return;
      }
      if (!report.assigned_shelter_ids.includes(shelter.id)) {
        report.assigned_shelter_ids.push(shelter.id);
      }
      assignedNames.push(`Shelter: ${shelter.name}`);
    }

    if (report.status === 'Submitted' || report.status === 'Verified') {
      report.status = 'Dispatched';
    }
    report.updated_at = new Date().toISOString();

    report.internal_notes.push({
      id: `NOTE-${Date.now()}`,
      author: actor || 'Incident Commander',
      text: `Resource deployment: ${assignedNames.join(', ')}`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);

    addAudit(
      actor || 'Incident Commander',
      'RESOURCES_ASSIGNED',
      `Assigned resources to ${report.id}: ${assignedNames.join(', ')}`,
      report.id
    );

    addNotification(
      `Dispatched to ${report.category}`,
      `Resources [${assignedNames.join(', ')}] assigned to incident ${report.id}`,
      'info',
      'Deployment',
      'rescue_team',
      report.id
    );

    broadcastSSE('DATA_REFRESH', { report, teams: db.rescueTeams });
    res.json({ success: true, report, rescueTeams: db.rescueTeams });
  });

  // Emergency: General status update (e.g. In Progress, Resolved)
  api.patch('/emergencies/:id/status', (req: Request, res: Response) => {
    const { status, actor, resolution_notes } = req.body;
    const report = db.emergencies.find((e) => e.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const oldStatus = report.status;
    report.status = status;
    report.updated_at = new Date().toISOString();

    if (status === 'Resolved' || status === 'Closed') {
      report.resolved_at = new Date().toISOString();

      // Free up any assigned rescue teams
      db.rescueTeams.forEach((t) => {
        if (t.current_assignment_id === report.id) {
          t.current_status = 'Available';
          t.current_assignment_id = null;
        }
      });
    }

    if (resolution_notes) {
      report.internal_notes.push({
        id: `NOTE-${Date.now()}`,
        author: actor || 'Responder',
        text: `Status [${oldStatus} -> ${status}]: ${resolution_notes}`,
        timestamp: new Date().toISOString(),
      });
    }

    saveDatabase(db);

    addAudit(
      actor || 'Responder',
      'STATUS_CHANGED',
      `Emergency ${report.id} changed from ${oldStatus} to ${status}.`,
      report.id
    );

    broadcastSSE('DATA_REFRESH', { report, teams: db.rescueTeams });
    res.json({ success: true, report, rescueTeams: db.rescueTeams });
  });

  // Emergency: Add internal command note
  api.patch('/emergencies/:id/notes', (req: Request, res: Response) => {
    const { text, author } = req.body;
    const report = db.emergencies.find((e) => e.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Note text cannot be empty' });
      return;
    }

    const newNote = {
      id: `NOTE-${Date.now()}`,
      author: author || 'Command Staff',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    report.internal_notes.push(newNote);
    report.updated_at = new Date().toISOString();

    saveDatabase(db);
    broadcastSSE('EMERGENCY_UPDATED', report);
    res.json({ success: true, report });
  });

  // Resource recommendation calculations for a specific emergency
  api.get('/recommendations/:id', (req: Request, res: Response) => {
    const report = db.emergencies.find((e) => e.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Emergency report not found' });
      return;
    }

    const recommendation = recommendResources(
      report,
      db.rescueTeams,
      db.hospitals,
      db.shelters,
      db.blockedRoads
    );

    res.json(recommendation);
  });

  // Rescue Teams: GET list
  api.get('/rescue-teams', (_req: Request, res: Response) => {
    res.json(db.rescueTeams);
  });

  // Rescue Teams: Update operational status (e.g. On Scene, Resting, Available)
  api.patch('/rescue-teams/:id/status', (req: Request, res: Response) => {
    const { status, actor } = req.body;
    const team = db.rescueTeams.find((t) => t.id === req.params.id);
    if (!team) {
      res.status(404).json({ error: 'Rescue team not found' });
      return;
    }

    const validStatuses = ['Available', 'Dispatched', 'On Scene', 'Resting', 'Maintenance'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid team status' });
      return;
    }

    const oldStatus = team.current_status;
    team.current_status = status;

    if (status === 'Available') {
      team.current_assignment_id = null;
    }

    saveDatabase(db);

    addAudit(
      actor || team.name,
      'TEAM_STATUS_UPDATED',
      `${team.name} status updated from ${oldStatus} to ${status}.`
    );

    broadcastSSE('RESCUE_TEAM_UPDATED', team);
    res.json({ success: true, team });
  });

  // Rescue Teams: Report Road Blockage from the field
  api.post('/rescue-teams/:id/report-blockage', (req: Request, res: Response) => {
    const { name, description, latitude, longitude, severity } = req.body;
    const team = db.rescueTeams.find((t) => t.id === req.params.id);
    if (!name || !description) {
      res.status(400).json({ error: 'Road name and description required' });
      return;
    }

    const newBlockage: BlockedRoad = {
      id: `ROAD-${Date.now().toString().slice(-4)}`,
      name,
      description,
      latitude: Number(latitude) || team?.latitude || 17.72,
      longitude: Number(longitude) || team?.longitude || 83.31,
      severity: severity || 'Total Blockage',
      reported_at: new Date().toISOString(),
      status: 'Active',
    };

    db.blockedRoads.unshift(newBlockage);
    saveDatabase(db);

    addAudit(
      team ? team.name : 'Rescue Field Unit',
      'ROAD_BLOCKAGE_REPORTED',
      `Road obstruction logged at ${name}: ${description}`
    );

    addNotification(
      `ROAD CLOSED: ${name}`,
      `Reported by field unit ${team?.name || ''}: ${description}. Navigation routes recalculated.`,
      'warning',
      'Infrastructure',
      'all'
    );

    broadcastSSE('ROAD_BLOCKAGE_ADDED', newBlockage);
    res.status(201).json({ success: true, blockage: newBlockage });
  });

  // Hospitals: GET list
  api.get('/hospitals', (_req: Request, res: Response) => {
    res.json(db.hospitals);
  });

  // Hospitals: Update capacity & status
  api.patch('/hospitals/:id/capacity', (req: Request, res: Response) => {
    const { available_beds, available_icu, operational_status, ambulances_available, blood_supplies, actor } = req.body;
    const hosp = db.hospitals.find((h) => h.id === req.params.id);
    if (!hosp) {
      res.status(404).json({ error: 'Hospital not found' });
      return;
    }

    if (available_beds !== undefined) hosp.available_beds = Math.max(0, Number(available_beds));
    if (available_icu !== undefined) hosp.available_icu = Math.max(0, Number(available_icu));
    if (ambulances_available !== undefined) hosp.ambulances_available = Math.max(0, Number(ambulances_available));
    if (operational_status) hosp.operational_status = operational_status;
    if (blood_supplies) hosp.blood_supplies = blood_supplies;
    hosp.last_updated = new Date().toISOString();

    saveDatabase(db);

    addAudit(
      actor || hosp.name,
      'HOSPITAL_CAPACITY_UPDATED',
      `${hosp.name} availability updated: ${hosp.available_beds} beds, ${hosp.available_icu} ICU, status: ${hosp.operational_status}`
    );

    if (hosp.available_beds <= 5 || hosp.operational_status === 'Diverting') {
      addNotification(
        `HOSPITAL CAPACITY ALERT: ${hosp.name}`,
        `${hosp.name} has only ${hosp.available_beds} general beds remaining. Status: ${hosp.operational_status}.`,
        'critical',
        'Hospital',
        'authority',
        hosp.id
      );
    }

    broadcastSSE('HOSPITAL_UPDATED', hosp);
    res.json({ success: true, hospital: hosp });
  });

  // Shelters: GET list
  api.get('/shelters', (_req: Request, res: Response) => {
    res.json(db.shelters);
  });

  // Shelters: Update occupancy & supplies
  api.patch('/shelters/:id/occupancy', (req: Request, res: Response) => {
    const { current_occupancy, food_water_status, operational_status, medical_kits, actor } = req.body;
    const shelter = db.shelters.find((s) => s.id === req.params.id);
    if (!shelter) {
      res.status(404).json({ error: 'Shelter not found' });
      return;
    }

    if (current_occupancy !== undefined) {
      shelter.current_occupancy = Math.max(0, Number(current_occupancy));
    }
    if (food_water_status) shelter.food_water_status = food_water_status;
    if (operational_status) shelter.operational_status = operational_status;
    if (medical_kits !== undefined) shelter.medical_kits = Math.max(0, Number(medical_kits));
    shelter.last_updated = new Date().toISOString();

    const remaining = shelter.total_capacity - shelter.current_occupancy;
    if (remaining <= 0) {
      shelter.operational_status = 'At Capacity';
    }

    saveDatabase(db);

    addAudit(
      actor || shelter.name,
      'SHELTER_OCCUPANCY_UPDATED',
      `${shelter.name} headcount set to ${shelter.current_occupancy}/${shelter.total_capacity} (${remaining} spots remaining)`
    );

    if (remaining <= 10) {
      addNotification(
        `SHELTER CAPACITY WARNING: ${shelter.name}`,
        `${shelter.name} is near/at capacity (${shelter.current_occupancy}/${shelter.total_capacity}). Intake diverted.`,
        'warning',
        'Shelter',
        'authority',
        shelter.id
      );
    }

    broadcastSSE('SHELTER_UPDATED', shelter);
    res.json({ success: true, shelter });
  });

  // Relief Organizations: GET list
  api.get('/relief-orgs', (_req: Request, res: Response) => {
    res.json(db.reliefOrgs);
  });

  // Relief Organizations: Update task progress
  api.patch('/relief-orgs/:id/tasks/:taskId', (req: Request, res: Response) => {
    const { status, progress, actor } = req.body;
    const org = db.reliefOrgs.find((o) => o.id === req.params.id);
    if (!org) {
      res.status(404).json({ error: 'Relief organization not found' });
      return;
    }

    const task = org.assigned_tasks.find((t) => t.id === req.params.taskId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (status) task.status = status;
    if (progress !== undefined) task.progress = Number(progress);

    saveDatabase(db);

    addAudit(
      actor || org.name,
      'RELIEF_TASK_UPDATED',
      `Relief task "${task.title}" updated to status ${task.status} (${task.progress}%)`
    );

    broadcastSSE('RELIEF_ORG_UPDATED', org);
    res.json({ success: true, organization: org });
  });

  // Relief Organizations: Update inventory
  api.patch('/relief-orgs/:id/inventory', (req: Request, res: Response) => {
    const { supplies, volunteers, vehicles, actor } = req.body;
    const org = db.reliefOrgs.find((o) => o.id === req.params.id);
    if (!org) {
      res.status(404).json({ error: 'Relief organization not found' });
      return;
    }

    if (supplies) org.supplies_inventory = { ...org.supplies_inventory, ...supplies };
    if (volunteers !== undefined) org.volunteers_active = Number(volunteers);
    if (vehicles !== undefined) org.vehicles_available = Number(vehicles);

    saveDatabase(db);

    addAudit(
      actor || org.name,
      'RELIEF_INVENTORY_UPDATED',
      `Stockpile updated: ${org.supplies_inventory.food_kits} food kits, ${org.supplies_inventory.water_liters}L water`
    );

    broadcastSSE('RELIEF_ORG_UPDATED', org);
    res.json({ success: true, organization: org });
  });

  // Missing Persons: GET list
  api.get('/missing-persons', (_req: Request, res: Response) => {
    res.json(db.missingPersons);
  });

  // Missing Persons: Register new report & calculate potential matches
  api.post('/missing-persons', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.name || !body.description || !body.type) {
      res.status(400).json({ error: 'Name, description, and type (Missing or Found/Sheltered) are required.' });
      return;
    }

    const newId = (body.type === 'Missing' ? 'MP-' : 'FP-') + Date.now().toString().slice(-4);
    const newPerson: MissingPerson = {
      id: newId,
      type: body.type,
      name: body.name.trim(),
      approx_age: body.approx_age || 'Unknown',
      gender: body.gender || 'Unspecified',
      description: body.description.trim(),
      last_known_location: body.last_known_location || 'Not specified',
      found_location: body.found_location,
      shelter_id: body.shelter_id,
      contact_info: body.contact_info || 'Command Center Registry',
      reported_at: new Date().toISOString(),
      status: 'Reported',
      photo_url: body.photo_url,
    };

    // Calculate algorithmic match candidate against opposite type
    const counterpartType = body.type === 'Missing' ? 'Found/Sheltered' : 'Missing';
    const counterparts = db.missingPersons.filter(
      (p) => p.type === counterpartType && p.status !== 'Reunited'
    );

    for (const other of counterparts) {
      let score = 0;
      const reasons: string[] = [];

      // Name similarity (case-insensitive sub-match)
      if (
        other.name.toLowerCase().includes(newPerson.name.toLowerCase()) ||
        newPerson.name.toLowerCase().includes(other.name.toLowerCase())
      ) {
        score += 40;
        reasons.push('Name phonetic / text match');
      }

      // Age proximity
      const ageA = Number(newPerson.approx_age);
      const ageB = Number(other.approx_age);
      if (!isNaN(ageA) && !isNaN(ageB) && Math.abs(ageA - ageB) <= 3) {
        score += 25;
        reasons.push(`Close approximate age correlation (~${ageA} vs ~${ageB} yrs)`);
      }

      // Gender match
      if (
        newPerson.gender &&
        other.gender &&
        newPerson.gender.toLowerCase() === other.gender.toLowerCase()
      ) {
        score += 15;
        reasons.push(`Gender match (${newPerson.gender})`);
      }

      // Description keyword overlap
      const descWordsA = newPerson.description.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3);
      const descWordsB = other.description.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3);
      const commonWords = descWordsA.filter((w: string) => descWordsB.includes(w));
      if (commonWords.length > 0) {
        score += 15;
        reasons.push(`Shared descriptive cues: ${commonWords.slice(0, 3).join(', ')}`);
      }

      if (score >= 45) {
        newPerson.status = 'Potential Match Found';
        newPerson.matched_with_id = other.id;
        newPerson.match_confidence = score;
        newPerson.match_reasons = reasons;

        other.status = 'Potential Match Found';
        other.matched_with_id = newPerson.id;
        other.match_confidence = score;
        other.match_reasons = reasons;

        addNotification(
          `REUNIFICATION MATCH CANDIDATE (${score}%)`,
          `Potential match between ${newPerson.name} (${newPerson.id}) and ${other.name} (${other.id}). Verification required.`,
          'info',
          'Reunification',
          'authority',
          newPerson.id
        );
        break;
      }
    }

    db.missingPersons.unshift(newPerson);
    saveDatabase(db);

    addAudit(
      'Reunification Desk',
      'PERSON_REGISTERED',
      `Registered ${newPerson.type} record: ${newPerson.name} (${newPerson.id}).`
    );

    broadcastSSE('MISSING_PERSONS_UPDATED', db.missingPersons);
    res.status(201).json({ success: true, person: newPerson });
  });

  // Missing Persons: Verify & Confirm Reunification
  api.patch('/missing-persons/:id/reunite', (req: Request, res: Response) => {
    const { matched_id, actor, notes } = req.body;
    const person = db.missingPersons.find((p) => p.id === req.params.id);
    if (!person) {
      res.status(404).json({ error: 'Person record not found' });
      return;
    }

    person.status = 'Reunited';
    if (matched_id) {
      const match = db.missingPersons.find((p) => p.id === matched_id);
      if (match) {
        match.status = 'Reunited';
      }
    }

    saveDatabase(db);

    addAudit(
      actor || 'Reunification Officer',
      'REUNIFICATION_CONFIRMED',
      `Confirmed reunification of ${person.name} (${person.id}). Verified by authorized personnel. Notes: ${notes || 'Verified identity and family relationship.'}`
    );

    addNotification(
      'Family Reunited!',
      `Reunification successfully verified for ${person.name}. Case closed.`,
      'success',
      'Reunification',
      'all'
    );

    broadcastSSE('MISSING_PERSONS_UPDATED', db.missingPersons);
    res.json({ success: true, person });
  });

  // Blocked Roads: GET list
  api.get('/blocked-roads', (_req: Request, res: Response) => {
    res.json(db.blockedRoads);
  });

  // Blocked Roads: Mark cleared
  api.patch('/blocked-roads/:id/clear', (req: Request, res: Response) => {
    const road = db.blockedRoads.find((r) => r.id === req.params.id);
    if (!road) {
      res.status(404).json({ error: 'Road record not found' });
      return;
    }
    road.status = 'Cleared';
    saveDatabase(db);

    addAudit('Public Works / Police', 'ROAD_CLEARED', `Obstruction cleared on ${road.name}. Normal routing restored.`);
    addNotification('Road Reopened', `${road.name} has been cleared and is passable for emergency transit.`, 'success', 'Infrastructure');

    broadcastSSE('DATA_REFRESH', { blockedRoads: db.blockedRoads });
    res.json({ success: true, road });
  });

  // Notifications: GET list
  api.get('/notifications', (_req: Request, res: Response) => {
    res.json(db.notifications);
  });

  // Notifications: Mark read
  api.patch('/notifications/:id/read', (req: Request, res: Response) => {
    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (notif) {
      notif.is_read = true;
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  // Notifications: Broadcast emergency alert
  api.post('/notifications/broadcast', (req: Request, res: Response) => {
    const { title, message, level, actor } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: 'Title and message required' });
      return;
    }

    addNotification(title, message, level || 'warning', 'Authority Broadcast', 'all');
    addAudit(actor || 'Disaster Commander', 'BROADCAST_ALERT', `Public emergency alert broadcasted: "${title}"`);

    res.json({ success: true, message: 'Broadcast transmitted.' });
  });

  // Dynamic Replanning Simulator: List scenarios & run simulation
  api.get('/replan/scenarios', (_req: Request, res: Response) => {
    res.json(REPLAN_SCENARIOS);
  });

  api.post('/replan/simulate', (req: Request, res: Response) => {
    const { scenario_id } = req.body;
    const scenario = REPLAN_SCENARIOS.find((s) => s.id === scenario_id);
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    // Dynamic replanning analysis
    res.json({
      scenario,
      activeDatabaseState: {
        totalActiveEmergencies: db.emergencies.filter((e) => e.status !== 'Resolved').length,
        availableTeams: db.rescueTeams.filter((t) => t.current_status === 'Available').map((t) => t.name),
        freeHospitalBeds: db.hospitals.reduce((sum, h) => sum + h.available_beds, 0),
        shelterAvailableCap: db.shelters.reduce((sum, s) => sum + Math.max(0, s.total_capacity - s.current_occupancy), 0),
      },
    });
  });

  api.post('/replan/approve', (req: Request, res: Response) => {
    const { scenario_id, actor, approval_rationale } = req.body;
    const scenario = REPLAN_SCENARIOS.find((s) => s.id === scenario_id);
    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    // Execute state changes for approved scenario
    if (scenario.type === 'ROAD_BLOCK') {
      const road = db.blockedRoads[0];
      if (road) road.status = 'Active';
    } else if (scenario.type === 'SHELTER_FULL') {
      const shelter = db.shelters.find((s) => s.id === 'SHELTER-01');
      if (shelter) {
        shelter.current_occupancy = shelter.total_capacity;
        shelter.operational_status = 'At Capacity';
      }
    } else if (scenario.type === 'HOSPITAL_DROP') {
      const hosp = db.hospitals.find((h) => h.id === 'HOSP-02');
      if (hosp) {
        hosp.available_beds = 0;
        hosp.operational_status = 'Diverting';
      }
    }

    saveDatabase(db);

    addAudit(
      actor || 'Disaster Commander',
      'REPLAN_APPROVED',
      `Approved Dynamic Replan [${scenario.name}]. Rationale: ${approval_rationale || 'Mitigated bottleneck based on simulation model.'}`
    );

    addNotification(
      `REPLAN EXECUTED: ${scenario.name}`,
      `Commander approved resource re-allocation: ${scenario.proposed_plan.reason_for_change}`,
      'critical',
      'Dynamic Replan',
      'all'
    );

    broadcastSSE('DATA_REFRESH', {
      emergencies: db.emergencies,
      rescueTeams: db.rescueTeams,
      hospitals: db.hospitals,
      shelters: db.shelters,
    });

    res.json({
      success: true,
      message: `Scenario "${scenario.name}" approved and live operational database updated.`,
      scenario,
    });
  });

  // Audit Logs
  api.get('/audit-logs', (_req: Request, res: Response) => {
    res.json(db.auditLogs);
  });

  // Reset database with fresh seed data (Development safety feature)
  api.post('/reset-demo', (req: Request, res: Response) => {
    const { actor } = req.body;
    const fresh = getInitialData();
    saveDatabase(fresh);

    addAudit(actor || 'System Admin', 'DATABASE_RESET', 'Demo database re-initialized to default baseline seed data.');
    broadcastSSE('DATA_REFRESH', fresh);

    res.json({
      success: true,
      message: 'Demo dataset reset to initial state successfully.',
    });
  });

  // Mount API router
  app.use('/api', api);

  // Mount Vite middlewares in development mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Disaster Response Command Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
