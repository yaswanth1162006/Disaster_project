import React, { useState } from 'react';
import { RescueTeam, EmergencyReport, BlockedRoad } from '../types/disaster';
import { api } from '../services/api';
import {
  LifeBuoy,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  CheckCheck,
  Send,
  Radio,
  Users,
  Shield,
  Truck,
  Flame,
  Phone,
  FileText,
} from 'lucide-react';

interface RescuePortalProps {
  teams: RescueTeam[];
  emergencies: EmergencyReport[];
  onDataRefresh: () => void;
}

export const RescuePortal: React.FC<RescuePortalProps> = ({
  teams,
  emergencies,
  onDataRefresh,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || 'TEAM-SAR-01');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Field Note Input
  const [fieldNote, setFieldNote] = useState('');

  // Road Blockage Reporting Modal/Form
  const [isReportingBlockage, setIsReportingBlockage] = useState(false);
  const [blockageRoadName, setBlockageRoadName] = useState('');
  const [blockageDesc, setBlockageDesc] = useState('');
  const [blockageSeverity, setBlockageSeverity] = useState<'Total Blockage' | 'High Clearance Only' | 'Flooded'>('Total Blockage');

  const activeTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const assignedEmergency = emergencies.find(
    (e) => activeTeam && (e.id === activeTeam.current_assignment_id || e.assigned_team_ids.includes(activeTeam.id))
  );

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeTeam) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.updateTeamStatus(activeTeam.id, newStatus, activeTeam.leader_name);
      setActionSuccess(`Team operational status updated to "${newStatus}".`);
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Status update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartOperation = async () => {
    if (!assignedEmergency || !activeTeam) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.updateEmergencyStatus(assignedEmergency.id, {
        status: 'In Progress',
        actor: activeTeam.name,
        resolution_notes: `Team ${activeTeam.name} arrived on-scene and commenced search & extrication.`,
      });
      await api.updateTeamStatus(activeTeam.id, 'On Scene', activeTeam.leader_name);
      setActionSuccess('Operation officially marked IN PROGRESS on command network.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Operation start failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOperation = async () => {
    if (!assignedEmergency || !activeTeam) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.updateEmergencyStatus(assignedEmergency.id, {
        status: 'Resolved',
        actor: activeTeam.name,
        resolution_notes: `All victims secured and safely transferred. Mission completed by ${activeTeam.name}.`,
      });
      await api.updateTeamStatus(activeTeam.id, 'Available', activeTeam.leader_name);
      setActionSuccess('Emergency marked RESOLVED. Team returned to Available standby.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Completion failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendFieldNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldNote.trim() || !assignedEmergency || !activeTeam) return;
    setActionLoading(true);
    try {
      await api.addEmergencyNote(assignedEmergency.id, fieldNote.trim(), `${activeTeam.name} (${activeTeam.leader_name})`);
      setFieldNote('');
      setActionSuccess('Field telemetry note logged and synced with Command Center.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit field note.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportRoadObstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockageRoadName.trim() || !activeTeam) return;
    setActionLoading(true);
    try {
      await api.reportRoadBlockage(activeTeam.id, {
        name: blockageRoadName.trim(),
        description: blockageDesc.trim(),
        latitude: activeTeam.latitude,
        longitude: activeTeam.longitude,
        severity: blockageSeverity,
      });
      setIsReportingBlockage(false);
      setBlockageRoadName('');
      setBlockageDesc('');
      setActionSuccess('Road blockage broadcasted to all routing matrices.');
      onDataRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to log road blockage.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Team Profile & Switcher Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{activeTeam?.name}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                {activeTeam?.type}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Station: {activeTeam?.base_station} | Personnel: {activeTeam?.personnel_count} Responders | Comms: {activeTeam?.contact_phone}
            </p>
          </div>
        </div>

        {/* Squad Unit Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium px-2">Select Squad:</span>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-slate-900 text-white font-semibold rounded-lg px-3 py-1.5 border border-slate-700 outline-none"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.current_status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Status Bar & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Availability Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Operational Readiness Status
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                activeTeam?.current_status === 'Available'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : activeTeam?.current_status === 'On Scene'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              ● {activeTeam?.current_status}
            </span>
          </div>

          <div className="text-[11px] text-slate-400">Update Readiness State:</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['Available', 'On Scene', 'Resting', 'Maintenance'] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleUpdateStatus(st)}
                disabled={actionLoading || activeTeam?.current_status === st}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activeTeam?.current_status === st
                    ? 'bg-slate-800 border-slate-600 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                Set {st}
              </button>
            ))}
          </div>
        </div>

        {/* Assigned Incident Quick Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Assigned Emergency Incident
            </div>
            {assignedEmergency && (
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                {assignedEmergency.priority} Priority
              </span>
            )}
          </div>

          {assignedEmergency ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-lg font-bold text-white">
                  {assignedEmergency.category} - {assignedEmergency.id}
                </span>
                <span className="text-xs text-slate-400">
                  Logged: {new Date(assignedEmergency.created_at).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                {assignedEmergency.description}
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> {assignedEmergency.address}
                </span>
                <span>Affected: <b className="text-white">{assignedEmergency.people_affected}</b></span>
                {assignedEmergency.vulnerable_details && (
                  <span className="text-amber-300">Vulnerable: {assignedEmergency.vulnerable_details}</span>
                )}
              </div>

              {/* Action Buttons for Active Mission */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {assignedEmergency.status !== 'In Progress' && assignedEmergency.status !== 'Resolved' && (
                  <button
                    onClick={handleStartOperation}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Commence Operation (On Scene)</span>
                  </button>
                )}

                {assignedEmergency.status !== 'Resolved' && (
                  <button
                    onClick={handleCompleteOperation}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Mark Mission Completed & Resolved</span>
                  </button>
                )}

                <button
                  onClick={() => setIsReportingBlockage(!isReportingBlockage)}
                  className="px-3.5 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Report Road Blockage</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No emergency is currently assigned to this rescue team. Stand by at base station for command dispatch orders.
            </div>
          )}
        </div>
      </div>

      {/* Road Blockage Report Sub-form */}
      {isReportingBlockage && (
        <form
          onSubmit={handleReportRoadObstruction}
          className="bg-red-950/30 border border-red-500/40 rounded-2xl p-5 space-y-3 animate-fade-in text-xs"
        >
          <div className="font-bold text-red-400 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Field Report: Road Obstruction / Submerged Causeway</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Road / Bridge Name:</label>
              <input
                type="text"
                value={blockageRoadName}
                onChange={(e) => setBlockageRoadName(e.target.value)}
                placeholder="e.g. Ring Road Causeway Km 4"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Severity:</label>
              <select
                value={blockageSeverity}
                onChange={(e) => setBlockageSeverity(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none"
              >
                <option value="Total Blockage">Total Blockage (Impassable)</option>
                <option value="Flooded">Flooded (&gt;1m Water Depth)</option>
                <option value="High Clearance Only">High Clearance Only (4x4 / Trucks)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Description:</label>
              <input
                type="text"
                value={blockageDesc}
                onChange={(e) => setBlockageDesc(e.target.value)}
                placeholder="e.g. Bridge guardrail collapsed, 4ft standing water"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReportingBlockage(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
            >
              Broadcast Blockage Alert
            </button>
          </div>
        </form>
      )}

      {/* Field Telemetry Notes & Equipment Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Notes Thread */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Incident Tactical Notes & Comms</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {assignedEmergency?.internal_notes && assignedEmergency.internal_notes.length > 0 ? (
              assignedEmergency.internal_notes.map((note) => (
                <div key={note.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 mb-1 border-b border-slate-900">
                    <span className="font-bold text-slate-300">{note.author}</span>
                    <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200">{note.text}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-4 text-center">
                No tactical notes recorded yet for this incident.
              </div>
            )}
          </div>

          {assignedEmergency && (
            <form onSubmit={handleSendFieldNote} className="flex gap-2">
              <input
                type="text"
                value={fieldNote}
                onChange={(e) => setFieldNote(e.target.value)}
                placeholder="Log field update (e.g. 8 survivors evacuated)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={actionLoading || !fieldNote.trim()}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          )}
        </div>

        {/* Equipment & Capabilities */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Assigned Gear & Verified Capabilities</span>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 mb-2">Tactical Capabilities:</div>
            <div className="flex flex-wrap gap-1.5">
              {activeTeam?.capabilities.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium"
                >
                  ✓ {c}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400 mb-2">Vehicles & Heavy Equipment:</div>
            <div className="flex flex-wrap gap-1.5">
              {activeTeam?.equipment.map((e, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300 font-mono"
                >
                  ⚙️ {e}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
