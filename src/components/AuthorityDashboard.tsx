import React, { useState, useEffect } from 'react';
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
  VerificationStatus,
  EmergencyStatus,
} from '../types/disaster';
import { api } from '../services/api';
import { DisasterMapComponent } from './DisasterMapComponent';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Truck,
  HeartPulse,
  Tent,
  Package,
  UserSearch,
  Cpu,
  Map as MapIcon,
  Bell,
  BarChart3,
  Users,
  Settings,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Plus,
  ArrowRight,
  ShieldAlert,
  Flame,
  Radio,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Send,
  Download,
} from 'lucide-react';

interface AuthorityDashboardProps {
  stats: any;
  emergencies: EmergencyReport[];
  rescueTeams: RescueTeam[];
  hospitals: Hospital[];
  shelters: Shelter[];
  reliefOrgs: ReliefOrganization[];
  missingPersons: MissingPerson[];
  blockedRoads: BlockedRoad[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  onDataRefresh: () => void;
  onOpenReplanSimulator: () => void;
}

type SidebarModule =
  | 'overview'
  | 'emergencies'
  | 'rescue_teams'
  | 'hospitals'
  | 'shelters'
  | 'relief_orgs'
  | 'missing_persons'
  | 'resource_allocation'
  | 'disaster_map'
  | 'notifications'
  | 'analytics'
  | 'users'
  | 'settings';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  stats,
  emergencies,
  rescueTeams,
  hospitals,
  shelters,
  reliefOrgs,
  missingPersons,
  blockedRoads,
  notifications,
  auditLogs,
  onDataRefresh,
  onOpenReplanSimulator,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarModule>('overview');

  // Emergency Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedVerification, setSelectedVerification] = useState('All');

  // Selected Emergency for Detailed View / Action Modal
  const [inspectEmergency, setInspectEmergency] = useState<EmergencyReport | null>(null);
  const [inspectRecommendations, setInspectRecommendations] = useState<any>(null);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // Form states inside Inspector
  const [verificationReason, setVerificationReason] = useState('');
  const [overridePriorityVal, setOverridePriorityVal] = useState<PriorityLevel>('Critical');
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedAssignTeam, setSelectedAssignTeam] = useState('');
  const [selectedAssignHosp, setSelectedAssignHosp] = useState('');
  const [selectedAssignShelter, setSelectedAssignShelter] = useState('');
  const [commandNote, setCommandNote] = useState('');

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Missing person register modal
  const [isRegisteringPerson, setIsRegisteringPerson] = useState(false);
  const [newPersonType, setNewPersonType] = useState<'Missing' | 'Found/Sheltered'>('Missing');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonAge, setNewPersonAge] = useState('');
  const [newPersonGender, setNewPersonGender] = useState('Male');
  const [newPersonDesc, setNewPersonDesc] = useState('');
  const [newPersonLoc, setNewPersonLoc] = useState('');
  const [newPersonContact, setNewPersonContact] = useState('');

  // Broadcast alert modal
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLevel, setBroadcastLevel] = useState<'critical' | 'warning' | 'info'>('warning');

  // Reset feedback timers
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Load recommendations when inspecting an emergency
  const handleOpenInspector = async (report: EmergencyReport) => {
    setInspectEmergency(report);
    setOverridePriorityVal(report.priority);
    setOverrideReason('');
    setVerificationReason('');
    setSelectedAssignTeam(report.assigned_team_ids[0] || '');
    setSelectedAssignHosp(report.assigned_hospital_ids[0] || '');
    setSelectedAssignShelter(report.assigned_shelter_ids[0] || '');
    setIsLoadingRecs(true);
    try {
      const recs = await api.getRecommendations(report.id);
      setInspectRecommendations(recs);
    } catch {
      setInspectRecommendations(null);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // Actions on Emergency
  const handleVerifyReport = async (status: VerificationStatus) => {
    if (!inspectEmergency) return;
    try {
      const res = await api.verifyEmergency(
        inspectEmergency.id,
        status,
        verificationReason || `Verified by Commander Rao`,
        'Cmdr. Rao (Authority)'
      );
      setInspectEmergency(res.report);
      setActionSuccess(`Report ${inspectEmergency.id} verification set to ${status}.`);
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Verification failed');
    }
  };

  const handleOverridePriority = async () => {
    if (!inspectEmergency) return;
    if (!overrideReason.trim()) {
      setActionError('Operational reason is required for priority override.');
      return;
    }
    try {
      const res = await api.overridePriority(
        inspectEmergency.id,
        overridePriorityVal,
        overrideReason.trim(),
        'Cmdr. Rao (Authority)'
      );
      setInspectEmergency(res.report);
      setOverrideReason('');
      setActionSuccess(`Priority overridden to ${overridePriorityVal}.`);
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Override failed');
    }
  };

  const handleAssignResources = async () => {
    if (!inspectEmergency) return;
    try {
      const res = await api.assignResources(inspectEmergency.id, {
        team_id: selectedAssignTeam || undefined,
        hospital_id: selectedAssignHosp || undefined,
        shelter_id: selectedAssignShelter || undefined,
        actor: 'Cmdr. Rao (Authority)',
      });
      setInspectEmergency(res.report);
      setActionSuccess('Resources assigned and dispatched.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Assignment failed');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectEmergency || !commandNote.trim()) return;
    try {
      const res = await api.addEmergencyNote(inspectEmergency.id, commandNote.trim(), 'Command Cell Rao');
      setInspectEmergency(res.report);
      setCommandNote('');
      setActionSuccess('Note added to incident file.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add note');
    }
  };

  // Missing Person registration
  const handleRegisterMissingPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerMissingPerson({
        type: newPersonType,
        name: newPersonName.trim(),
        approx_age: newPersonAge.trim(),
        gender: newPersonGender,
        description: newPersonDesc.trim(),
        last_known_location: newPersonLoc.trim(),
        contact_info: newPersonContact.trim(),
      });
      setIsRegisteringPerson(false);
      setNewPersonName('');
      setNewPersonAge('');
      setNewPersonDesc('');
      setNewPersonLoc('');
      setNewPersonContact('');
      setActionSuccess('Person registered and algorithmic matching executed.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to register person');
    }
  };

  const handleConfirmReunite = async (id: string, matchedId?: string) => {
    try {
      await api.reuniteMissingPerson(id, {
        matched_id: matchedId,
        actor: 'Reunification Officer Cmdr. Rao',
        notes: 'Identity confirmed by guardian with biometric and shelter witness records.',
      });
      setActionSuccess('Reunification verified and closed in public registry.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm reunification');
    }
  };

  // Broadcast Alert
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    try {
      await api.broadcastNotification({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        level: broadcastLevel,
        actor: 'Disaster Commander Rao',
      });
      setBroadcastTitle('');
      setBroadcastMessage('');
      setActionSuccess('Emergency Alert Broadcast transmitted to all stations.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to broadcast alert');
    }
  };

  // Safe Demo Database Reset
  const handleResetDemo = async () => {
    if (confirm('Re-initialize demo database back to default seed state? All test edits will be restored.')) {
      try {
        await api.resetDemoDatabase('Commander Rao');
        setActionSuccess('Demo database restored to default seed state.');
        onDataRefresh();
      } catch (err: any) {
        setActionError(err.message || 'Failed to reset demo');
      }
    }
  };

  // Filtered Emergencies List
  const filteredEmergencies = emergencies.filter((e) => {
    if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
    if (selectedPriority !== 'All' && e.priority !== selectedPriority) return false;
    if (selectedStatus !== 'All' && e.status !== selectedStatus) return false;
    if (selectedVerification !== 'All' && e.verification_status !== selectedVerification) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        e.id.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Chart data: Incidents by Category
  const categoryCounts: Record<string, number> = {};
  emergencies.forEach((e) => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });
  const categoryChartData = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Chart data: Priorities
  const priorityChartData = [
    { name: 'Critical', value: emergencies.filter((e) => e.priority === 'Critical').length, color: '#ef4444' },
    { name: 'High', value: emergencies.filter((e) => e.priority === 'High').length, color: '#f97316' },
    { name: 'Medium', value: emergencies.filter((e) => e.priority === 'Medium').length, color: '#eab308' },
    { name: 'Low', value: emergencies.filter((e) => e.priority === 'Low').length, color: '#3b82f6' },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      {/* LEFT SIDEBAR - 13 Modular Views (Section 4) */}
      <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
        <div className="p-4 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
            <span>Command Modules</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          {[
            { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
            { id: 'emergencies', label: '2. Emergency Reports', icon: FileSpreadsheet, badge: stats?.total_reports },
            { id: 'rescue_teams', label: '3. Rescue Teams', icon: Truck, badge: stats?.available_rescue_teams },
            { id: 'hospitals', label: '4. Hospitals', icon: HeartPulse },
            { id: 'shelters', label: '5. Shelters', icon: Tent },
            { id: 'relief_orgs', label: '6. Relief Organizations', icon: Package },
            { id: 'missing_persons', label: '7. Missing Persons', icon: UserSearch, badge: stats?.missing_person_reports },
            { id: 'resource_allocation', label: '8. Resource Allocation', icon: Cpu },
            { id: 'disaster_map', label: '9. Disaster GIS Map', icon: MapIcon },
            { id: 'notifications', label: '10. Alerts & Broadcasts', icon: Bell, badge: notifications.filter((n) => !n.is_read).length },
            { id: 'analytics', label: '11. Reports & Analytics', icon: BarChart3 },
            { id: 'users', label: '12. User Management', icon: Users },
            { id: 'settings', label: '13. Settings & Audit', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SidebarModule)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-slate-950 text-amber-400 font-bold' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Replanner Button & Demo Reset Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/60">
          <button
            onClick={onOpenReplanSimulator}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Dynamic Re-Planner</span>
          </button>

          <button
            onClick={handleResetDemo}
            className="w-full py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
        {/* Top Operational Feedback Banners */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3 bg-red-950/70 border border-red-500/50 text-red-300 text-xs rounded-xl flex items-center gap-2 shadow-lg animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* MODULE 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Command Center Overview
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time telemetry aggregated from active database queries.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenReplanSimulator}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Launch Replanning Simulation</span>
                </button>
                <button
                  onClick={onDataRefresh}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Force refresh database"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Database Statistics KPI Grid (Section 4) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Reports</div>
                <div className="text-2xl font-black text-white mt-1 font-mono">{stats?.total_reports ?? 0}</div>
                <div className="text-[10px] text-amber-400 mt-1">Logged Incidents</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Unverified</div>
                <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{stats?.unverified_reports ?? 0}</div>
                <div className="text-[10px] text-slate-400 mt-1">Pending Ground Scout</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Critical Threat</div>
                <div className="text-2xl font-black text-red-400 mt-1 font-mono">{stats?.critical_emergencies ?? 0}</div>
                <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> Immediate Life Danger
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Rescue Teams Ready</div>
                <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{stats?.available_rescue_teams ?? 0}</div>
                <div className="text-[10px] text-emerald-400 mt-1">Available for Dispatch</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Shelter Capacity</div>
                <div className="text-2xl font-black text-teal-400 mt-1 font-mono">{stats?.available_shelter_capacity ?? 0}</div>
                <div className="text-[10px] text-slate-400 mt-1">Remaining Safe Slots</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Resolved Cases</div>
                <div className="text-2xl font-black text-blue-400 mt-1 font-mono">{stats?.resolved_emergencies ?? 0}</div>
                <div className="text-[10px] text-slate-400 mt-1">Successfully Rescued</div>
              </div>
            </div>

            {/* Tactical Map & Priority Feed Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* GIS Map */}
              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-amber-400" />
                    <span>Live Operational GIS Map</span>
                  </span>
                  <button
                    onClick={() => setActiveTab('disaster_map')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Expand Full Map →
                  </button>
                </div>
                <DisasterMapComponent
                  emergencies={emergencies}
                  rescueTeams={rescueTeams}
                  hospitals={hospitals}
                  shelters={shelters}
                  blockedRoads={blockedRoads}
                  onSelectEmergency={handleOpenInspector}
                />
              </div>

              {/* Critical Attention Incident Feed */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                      <span>Priority Action Queue</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {emergencies.filter((e) => e.status !== 'Resolved').length} Active
                    </span>
                  </div>

                  <div className="space-y-2.5 mt-3 max-h-[440px] overflow-y-auto pr-1">
                    {emergencies
                      .filter((e) => e.status !== 'Resolved')
                      .slice(0, 5)
                      .map((report) => (
                        <div
                          key={report.id}
                          onClick={() => handleOpenInspector(report)}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-1.5 hover:bg-slate-800/40"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{report.id}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                                report.priority === 'Critical'
                                  ? 'bg-red-950 text-red-400 border border-red-500/30'
                                  : report.priority === 'High'
                                  ? 'bg-orange-950 text-orange-400 border border-orange-500/30'
                                  : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {report.priority} ({report.priority_score} pts)
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-200">{report.category}</div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{report.description}</p>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                            <span>People: <b className="text-white">{report.people_affected}</b></span>
                            <span className="text-amber-400 font-medium">Inspect →</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setActiveTab('emergencies')}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>View All Reports Table</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: EMERGENCY REPORTS TABLE & INSPECTOR */}
        {activeTab === 'emergencies' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Emergency Reports Registry
                </h2>
                <p className="text-xs text-slate-400">
                  Every citizen report, triage score, ground verification status, and assigned assets.
                </p>
              </div>

              <div className="text-xs text-slate-400">
                Displaying <b>{filteredEmergencies.length}</b> of <b>{emergencies.length}</b> records
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {/* Search */}
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by ID, area, or description..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Flood">Flood</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Fire">Fire</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Trapped Person">Trapped Person</option>
                    <option value="Food or Water Shortage">Food/Water Shortage</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Verification Filter */}
                <div>
                  <select
                    value={selectedVerification}
                    onChange={(e) => setSelectedVerification(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Verification</option>
                    <option value="Verified">Verified Only</option>
                    <option value="Unverified">Unverified Only</option>
                    <option value="Flagged Incomplete">Flagged Incomplete</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">ID / Category</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Triage Priority</th>
                      <th className="p-3.5">Verification</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Assigned Units</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredEmergencies.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-white font-mono">{report.id}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{report.category}</div>
                        </td>

                        <td className="p-3.5 max-w-[200px]">
                          <div className="truncate text-white font-medium">{report.address}</div>
                          <div className="text-[10px] text-slate-500">
                            Affected: <b className="text-slate-300">{report.people_affected}</b>
                            {report.immediate_danger && (
                              <span className="text-red-400 font-bold ml-1.5">• In Danger</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              report.priority === 'Critical'
                                ? 'bg-red-950 text-red-400 border border-red-500/30'
                                : report.priority === 'High'
                                ? 'bg-orange-950 text-orange-400 border border-orange-500/30'
                                : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {report.priority} ({report.priority_score})
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              report.verification_status === 'Verified'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : report.verification_status === 'Unverified'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-red-950 text-red-300'
                            }`}
                          >
                            {report.verification_status}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="text-slate-200 font-semibold">{report.status}</span>
                        </td>

                        <td className="p-3.5">
                          {report.assigned_team_ids.length > 0 ? (
                            <span className="text-emerald-400 font-medium">
                              {report.assigned_team_ids.join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">None assigned</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenInspector(report)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Inspect & Dispatch
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: RESCUE TEAMS TELEMETRY */}
        {activeTab === 'rescue_teams' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Rescue Teams Fleet</h2>
                <p className="text-xs text-slate-400">
                  Track tactical squad positions, heavy equipment, and active assignments.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rescueTeams.map((team) => (
                <div key={team.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{team.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        team.current_status === 'Available'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : team.current_status === 'On Scene'
                          ? 'bg-blue-950 text-blue-400 border border-blue-500/30 animate-pulse'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {team.current_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Leader: <b className="text-slate-200">{team.leader_name}</b> | Unit: {team.type}
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div>Station: {team.base_station}</div>
                    <div>Active Squad Size: {team.personnel_count} responders</div>
                    <div>Coordinates: {team.latitude}, {team.longitude}</div>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    <div className="font-bold text-slate-300 mb-1">Equipment:</div>
                    <div className="flex flex-wrap gap-1">
                      {team.equipment.map((eq, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>

                  {team.current_assignment_id && (
                    <div className="pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">Target Assignment: </span>
                      <span className="font-mono text-amber-400 font-bold">{team.current_assignment_id}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 4: HOSPITALS */}
        {activeTab === 'hospitals' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Hospital Trauma Network</h2>
              <p className="text-xs text-slate-400">
                Verified bed availability, intensive care capacity, and diversion alerts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hospitals.map((hosp) => (
                <div key={hosp.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{hosp.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        hosp.operational_status === 'Fully Operational'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-950 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {hosp.operational_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">General Beds</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">
                        {hosp.available_beds} / {hosp.total_beds}
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400">ICU Beds</div>
                      <div className="text-base font-bold text-rose-400 mt-0.5">
                        {hosp.available_icu} / {hosp.icu_beds}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Ambulances Available: <b className="text-white">{hosp.ambulances_available}</b></div>
                    <div>Blood Reserves: <b className="text-slate-200">{hosp.blood_supplies}</b></div>
                    <div>Trauma Center: <b className="text-white">{hosp.has_trauma_center ? 'Yes (Certified)' : 'No'}</b></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 5: SHELTERS */}
        {activeTab === 'shelters' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Evacuation Shelters</h2>
              <p className="text-xs text-slate-400">
                Displaced citizen intake, remaining capacities, and subsistence rations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shelters.map((sh) => {
                const remaining = Math.max(0, sh.total_capacity - sh.current_occupancy);
                const percent = Math.round((sh.current_occupancy / sh.total_capacity) * 100);
                return (
                  <div key={sh.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{sh.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/30">
                        {sh.operational_status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Occupancy</span>
                        <span className="font-mono text-white font-bold">{sh.current_occupancy} / {sh.total_capacity} ({percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            percent > 90 ? 'bg-red-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div>Remaining Room: <b className="text-teal-400">{remaining} individuals</b></div>
                      <div>Rations: <b className="text-slate-200">{sh.food_water_status}</b></div>
                      <div>Manager: {sh.manager_name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODULE 6: RELIEF ORGS */}
        {activeTab === 'relief_orgs' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Relief Organizations</h2>
              <p className="text-xs text-slate-400">
                NGO partners, volunteer mobilizations, and aid task deliveries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reliefOrgs.map((org) => (
                <div key={org.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">{org.name}</span>
                    <span className="text-xs text-slate-400 font-mono">Lead: {org.lead_contact}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                      <div className="text-slate-400 text-[10px]">Food Kits</div>
                      <div className="font-bold text-white mt-0.5">{org.supplies_inventory.food_kits}</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                      <div className="text-slate-400 text-[10px]">Clean Water</div>
                      <div className="font-bold text-blue-400 mt-0.5">{org.supplies_inventory.water_liters}L</div>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-center">
                      <div className="text-slate-400 text-[10px]">Volunteers</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{org.volunteers_active}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Assigned Relief Missions:</div>
                    {org.assigned_tasks.map((task) => (
                      <div key={task.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex justify-between font-semibold text-white">
                          <span>{task.title}</span>
                          <span className="text-indigo-400 font-mono">{task.progress}%</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Destination: {task.destination}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 7: MISSING PERSONS REUNIFICATION (Section 13) */}
        {activeTab === 'missing_persons' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Missing Persons Identification & Reunification
                </h2>
                <p className="text-xs text-slate-400">
                  Non-sensitive attribute matching, algorithmic similarity candidate scoring, and authorized reunification.
                </p>
              </div>

              <button
                onClick={() => setIsRegisteringPerson(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Register Person</span>
              </button>
            </div>

            {/* Registration Modal */}
            {isRegisteringPerson && (
              <form
                onSubmit={handleRegisterMissingPerson}
                className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">Register Missing or Sheltered Person</span>
                  <button
                    type="button"
                    onClick={() => setIsRegisteringPerson(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Record Type:</label>
                    <select
                      value={newPersonType}
                      onChange={(e) => setNewPersonType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="Missing">Missing (Family seeking)</option>
                      <option value="Found/Sheltered">Found / Sheltered (In intake camp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Name:</label>
                    <input
                      type="text"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Approx Age:</label>
                    <input
                      type="text"
                      value={newPersonAge}
                      onChange={(e) => setNewPersonAge(e.target.value)}
                      placeholder="e.g. 9 or elderly ~70"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Gender:</label>
                    <select
                      value={newPersonGender}
                      onChange={(e) => setNewPersonGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Physical Description / Clothing:</label>
                    <textarea
                      rows={2}
                      value={newPersonDesc}
                      onChange={(e) => setNewPersonDesc(e.target.value)}
                      placeholder="e.g. Blue graphic t-shirt, scar on chin, glasses"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-0.5">Last Known / Found Location:</label>
                      <input
                        type="text"
                        value={newPersonLoc}
                        onChange={(e) => setNewPersonLoc(e.target.value)}
                        placeholder="e.g. Sector 4 Lower Riverside"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-0.5">Contact Details:</label>
                      <input
                        type="text"
                        value={newPersonContact}
                        onChange={(e) => setNewPersonContact(e.target.value)}
                        placeholder="Family phone or shelter triage desk"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRegisteringPerson(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold"
                  >
                    Save & Run Matching Engine
                  </button>
                </div>
              </form>
            )}

            {/* List of Persons & Potential Matches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missingPersons.map((p) => (
                <div key={p.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-base">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({p.id})</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        p.status === 'Reunited'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'Potential Match Found'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Type: <b className={p.type === 'Missing' ? 'text-amber-400' : 'text-teal-400'}>{p.type}</b> | Age: {p.approx_age} | Gender: {p.gender}
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {p.description}
                  </p>

                  <div className="text-[11px] text-slate-400">
                    📍 Location: {p.last_known_location || p.found_location}
                  </div>

                  {/* Algorithmic Match Candidate Card */}
                  {p.matched_with_id && (
                    <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-indigo-300 font-bold">
                        <span>Algorithmic Match Candidate: {p.matched_with_id}</span>
                        <span>{p.match_confidence}% Match</span>
                      </div>
                      {p.match_reasons && (
                        <ul className="text-[11px] text-indigo-200/80 list-disc list-inside space-y-0.5">
                          {p.match_reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {p.status !== 'Reunited' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleConfirmReunite(p.id, p.matched_with_id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Confirm Reunification</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 8: RESOURCE ALLOCATION MATRIX */}
        {activeTab === 'resource_allocation' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Intelligent Resource Allocation Solver
                </h2>
                <p className="text-xs text-slate-400">
                  Algorithmic matching of specialized squads, distance, and road detour calculations.
                </p>
              </div>

              <button
                onClick={onOpenReplanSimulator}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulate Dynamic Disruption</span>
              </button>
            </div>

            <div className="space-y-4">
              {emergencies
                .filter((e) => e.status !== 'Resolved')
                .map((emg) => (
                  <div key={emg.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base font-mono">{emg.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {emg.category}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            emg.priority === 'Critical' ? 'bg-red-950 text-red-400' : 'bg-orange-950 text-orange-400'
                          }`}
                        >
                          {emg.priority}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenInspector(emg)}
                        className="text-xs text-amber-400 hover:underline font-semibold"
                      >
                        Adjust Assignment Matrix →
                      </button>
                    </div>

                    <div className="text-xs text-slate-300">
                      📍 {emg.address} (Affected: {emg.people_affected})
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-800/80">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Assigned Rescue Team</div>
                        <div className="font-bold text-emerald-400 mt-0.5">
                          {emg.assigned_team_ids.join(', ') || 'Queueing for unit...'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Destination Hospital</div>
                        <div className="font-bold text-rose-400 mt-0.5">
                          {emg.assigned_hospital_ids.join(', ') || 'Not routed'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Reception Shelter</div>
                        <div className="font-bold text-teal-400 mt-0.5">
                          {emg.assigned_shelter_ids.join(', ') || 'Not routed'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* MODULE 9: DISASTER GIS MAP (FULLSCREEN VIEW) */}
        {activeTab === 'disaster_map' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Unified Disaster Map</h2>
                <p className="text-xs text-slate-400">
                  Full situational awareness GIS layer with real-time marker telemetry and obstacle boundaries.
                </p>
              </div>
            </div>

            <DisasterMapComponent
              emergencies={emergencies}
              rescueTeams={rescueTeams}
              hospitals={hospitals}
              shelters={shelters}
              blockedRoads={blockedRoads}
              onSelectEmergency={handleOpenInspector}
            />
          </div>
        )}

        {/* MODULE 10: NOTIFICATIONS & BROADCASTS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Alerts & Broadcast Center</h2>
                <p className="text-xs text-slate-400">
                  Command network transmission console and audit of real-time alerts.
                </p>
              </div>
            </div>

            {/* Broadcast Creation Form */}
            <form
              onSubmit={handleBroadcastAlert}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 text-xs"
            >
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                <span>Transmit Public / Agency Emergency Broadcast</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-300 block mb-1">Broadcast Title:</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. FLASH FLOOD WARNING: Sector 4 Embankment Overflow"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Threat Level:</label>
                  <select
                    value={broadcastLevel}
                    onChange={(e) => setBroadcastLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="critical">Critical (Red Alert Banner)</option>
                    <option value="warning">Warning (Amber Alert)</option>
                    <option value="info">Info Advisory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Message Text:</label>
                <textarea
                  rows={2}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Official advisory instructions..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Broadcast Alert Across Network</span>
                </button>
              </div>
            </form>

            {/* Notifications Feed */}
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                    n.level === 'critical'
                      ? 'bg-red-950/30 border-red-500/40'
                      : n.level === 'warning'
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{n.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                        {n.category}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">{n.message}</p>
                    <div className="text-[10px] text-slate-500">
                      Logged: {new Date(n.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={async () => {
                        await api.markNotificationRead(n.id);
                        onDataRefresh();
                      }}
                      className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 11: REPORTS AND ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Reports & Disaster Analytics</h2>
              <p className="text-xs text-slate-400">
                Visualized incident distributions, severity metrics, and hospital strain.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown Bar Chart */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Incident Volume by Category
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-20} textAnchor="end" />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Priority Distribution Pie Chart */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Triage Priority Breakdown
                </div>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.name} (${entry.value})`}
                        labelLine={false}
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 12: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Responder & Role Management</h2>
              <p className="text-xs text-slate-400">
                Authorized credentials, least-privilege role matrix, and verified personnel status.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">User Handle</th>
                    <th className="p-3.5">Designation / Role</th>
                    <th className="p-3.5">Affiliated Entity</th>
                    <th className="p-3.5">Clearance Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-white font-bold">commander_rao</td>
                    <td className="p-3.5 text-amber-400 font-semibold">Disaster Command Authority</td>
                    <td className="p-3.5">Central Emergency Ops Cell</td>
                    <td className="p-3.5 font-mono text-emerald-400">Level 5 (Commander)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-white font-bold">team_sar_01</td>
                    <td className="p-3.5 text-blue-400 font-semibold">Rescue Field Squad</td>
                    <td className="p-3.5">NDRF Aquatic Unit 01</td>
                    <td className="p-3.5 font-mono text-blue-400">Level 3 (Tactical Ops)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-white font-bold">hosp_apex_triage</td>
                    <td className="p-3.5 text-rose-400 font-semibold">Hospital Triage Director</td>
                    <td className="p-3.5">Apex Trauma Center</td>
                    <td className="p-3.5 font-mono text-rose-400">Level 3 (Medical)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-white font-bold">shelter_mgr_arena</td>
                    <td className="p-3.5 text-teal-400 font-semibold">Shelter Camp Manager</td>
                    <td className="p-3.5">East Arena Evacuation Camp</td>
                    <td className="p-3.5 font-mono text-teal-400">Level 2 (Intake Admin)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-white font-bold">relief_red_crescent</td>
                    <td className="p-3.5 text-indigo-400 font-semibold">Relief Agency Lead</td>
                    <td className="p-3.5">Red Crescent Humanitarian Taskforce</td>
                    <td className="p-3.5 font-mono text-indigo-400">Level 2 (Logistics)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-white font-bold">citizen_public</td>
                    <td className="p-3.5 text-slate-400 font-semibold">Public Citizen</td>
                    <td className="p-3.5">Self-Report Hotline</td>
                    <td className="p-3.5 font-mono text-slate-500">Public (No Auth Req)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODULE 13: SETTINGS & AUDIT LOGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">System Settings & Audit Log</h2>
                <p className="text-xs text-slate-400">
                  Immutable administrative action history and safe development database controls.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResetDemo}
                  className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Demo Baseline</span>
                </button>
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                Recorded Administrative & Operational Audit Trail ({auditLogs.length} events)
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-amber-400 font-mono">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})</span>
                    </div>
                    <div className="text-slate-200 font-medium">{log.details}</div>
                    <div className="text-[10px] text-slate-500">
                      Actor: <b className="text-slate-300">{log.actor}</b>
                      {log.emergency_id && (
                        <span className="ml-2">Target: <b className="text-white font-mono">{log.emergency_id}</b></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* EMERGENCY INSPECTOR & DISPATCH MODAL */}
      {inspectEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 text-lg">
                    {inspectEmergency.id}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      inspectEmergency.priority === 'Critical'
                        ? 'bg-red-950 text-red-400 border border-red-500/30'
                        : 'bg-orange-950 text-orange-400 border border-orange-500/30'
                    }`}
                  >
                    {inspectEmergency.priority} ({inspectEmergency.priority_score} pts)
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {inspectEmergency.category} | Logged: {new Date(inspectEmergency.created_at).toLocaleTimeString()}
                </div>
              </div>

              <button
                onClick={() => setInspectEmergency(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-200 text-xs">
              {/* Incident Details Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">Situation Brief:</div>
                <p className="text-slate-300 leading-relaxed">{inspectEmergency.description}</p>
                <div className="pt-2 flex flex-wrap gap-4 text-slate-400 border-t border-slate-900">
                  <span>📍 Address: <b className="text-white">{inspectEmergency.address}</b></span>
                  <span>Affected: <b className="text-white">{inspectEmergency.people_affected}</b></span>
                  <span>Coordinates: <b className="text-slate-300 font-mono">{inspectEmergency.latitude}, {inspectEmergency.longitude}</b></span>
                </div>
              </div>

              {/* Priority Engine Factors Breakdown (Section 10) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center justify-between">
                  <span>Deterministic Prioritization Audit:</span>
                  <span className="font-mono">{inspectEmergency.priority_score} / 100</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {inspectEmergency.priority_factors.map((factor, i) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
                {inspectEmergency.missing_info_warnings && inspectEmergency.missing_info_warnings.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] mt-2">
                    <b>Data Warning:</b> {inspectEmergency.missing_info_warnings.join('; ')}
                  </div>
                )}
              </div>

              {/* Action 1: Verification Status */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  1. Report Verification Status
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400">Current: <b>{inspectEmergency.verification_status}</b></span>
                  <div className="flex gap-1.5 ml-auto">
                    {(['Verified', 'Unverified', 'Flagged Incomplete', 'Flagged Conflicting'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleVerifyReport(st)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                          inspectEmergency.verification_status === st
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        Set {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action 2: Override Priority with Reason */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  2. Priority Level Override (Requires Logged Reason)
                </div>
                <div className="flex gap-2">
                  <select
                    value={overridePriorityVal}
                    onChange={(e) => setOverridePriorityVal(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter mandatory operational justification for priority change..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs"
                  />

                  <button
                    onClick={handleOverridePriority}
                    className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shrink-0"
                  >
                    Commit Override
                  </button>
                </div>
              </div>

              {/* Action 3: Assign Resources with Solver Recommendation */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                    3. Dispatch Resources & Destination Facilities
                  </div>
                  {isLoadingRecs && <span className="text-amber-400 animate-spin">⟳ Calculating routes...</span>}
                </div>

                {inspectRecommendations && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-amber-300">
                    💡 <b>Recommendation Engine:</b> {inspectRecommendations.allocation_summary}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Select Rescue Team:</label>
                    <select
                      value={selectedAssignTeam}
                      onChange={(e) => setSelectedAssignTeam(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="">None / Keep Existing</option>
                      {rescueTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.current_status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Select Hospital:</label>
                    <select
                      value={selectedAssignHosp}
                      onChange={(e) => setSelectedAssignHosp(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="">None / Keep Existing</option>
                      {hospitals.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.available_beds} beds free)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Select Shelter:</label>
                    <select
                      value={selectedAssignShelter}
                      onChange={(e) => setSelectedAssignShelter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="">None / Keep Existing</option>
                      {shelters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.total_capacity - s.current_occupancy} spots)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleAssignResources}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Dispatch Assets</span>
                  </button>
                </div>
              </div>

              {/* Action 4: Tactical Command Notes */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                  4. Tactical Command Log
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {inspectEmergency.internal_notes.map((n) => (
                    <div key={n.id} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                      <span className="font-bold text-amber-400">{n.author}: </span>
                      <span>{n.text}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={commandNote}
                    onChange={(e) => setCommandNote(e.target.value)}
                    placeholder="Enter command note or relay instruction..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
