import React, { useState } from 'react';
import { Hospital, EmergencyReport } from '../types/disaster';
import { api } from '../services/api';
import {
  HeartPulse,
  Bed,
  Ambulance,
  AlertCircle,
  CheckCircle2,
  Save,
  Activity,
  Droplet,
  ShieldAlert,
  Building,
} from 'lucide-react';

interface HospitalPortalProps {
  hospitals: Hospital[];
  emergencies: EmergencyReport[];
  onDataRefresh: () => void;
}

export const HospitalPortal: React.FC<HospitalPortalProps> = ({
  hospitals,
  emergencies,
  onDataRefresh,
}) => {
  const [selectedHospId, setSelectedHospId] = useState<string>(
    hospitals[0]?.id || 'HOSP-01'
  );
  const activeHosp = hospitals.find((h) => h.id === selectedHospId) || hospitals[0];

  // Editable form fields
  const [availableBeds, setAvailableBeds] = useState<number>(activeHosp?.available_beds ?? 42);
  const [availableIcu, setAvailableIcu] = useState<number>(activeHosp?.available_icu ?? 6);
  const [ambulancesAvail, setAmbulancesAvail] = useState<number>(activeHosp?.ambulances_available ?? 3);
  const [opStatus, setOpStatus] = useState<string>(activeHosp?.operational_status ?? 'Fully Operational');
  const [bloodSupplies, setBloodSupplies] = useState<string>(activeHosp?.blood_supplies ?? 'Adequate');

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep state synced when switching hospital
  const handleSelectHospital = (id: string) => {
    setSelectedHospId(id);
    const h = hospitals.find((item) => item.id === id);
    if (h) {
      setAvailableBeds(h.available_beds);
      setAvailableIcu(h.available_icu);
      setAmbulancesAvail(h.ambulances_available);
      setOpStatus(h.operational_status);
      setBloodSupplies(h.blood_supplies);
    }
  };

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHosp) return;
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.updateHospitalCapacity(activeHosp.id, {
        available_beds: availableBeds,
        available_icu: availableIcu,
        ambulances_available: ambulancesAvail,
        operational_status: opStatus,
        blood_supplies: bloodSupplies,
        actor: 'Dr. Sharma (Apex Trauma Triage Director)',
      });
      setSuccessMsg('Hospital capacity updated and synced with Unified Command Center.');
      onDataRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Capacity update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Find incoming medical emergencies designated for this hospital
  const incomingEmergencies = emergencies.filter(
    (e) => activeHosp && e.assigned_hospital_ids.includes(activeHosp.id) && e.status !== 'Resolved'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Hospital Header & Facility Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-black shadow-lg">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{activeHosp?.name}</h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  activeHosp?.operational_status === 'Fully Operational'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-950 text-red-400 border border-red-500/30'
                }`}
              >
                {activeHosp?.operational_status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Address: {activeHosp?.address} | Last Checked: {new Date(activeHosp?.last_updated || Date.now()).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium px-2">Facility:</span>
          <select
            value={selectedHospId}
            onChange={(e) => handleSelectHospital(e.target.value)}
            className="bg-slate-900 text-white font-semibold rounded-lg px-3 py-1.5 border border-slate-700 outline-none"
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capacity Form */}
        <form
          onSubmit={handleSaveCapacity}
          className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Real-Time Bed & Trauma Triage Capacities</span>
            </h3>
            <span className="text-xs text-slate-400">Total Bed Census: {activeHosp?.total_beds}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* General Beds Available */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                <Bed className="w-4 h-4 text-emerald-400" /> Available General Beds
              </label>
              <input
                type="number"
                min={0}
                max={activeHosp?.total_beds || 500}
                value={availableBeds}
                onChange={(e) => setAvailableBeds(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-lg font-bold text-white focus:outline-none focus:border-rose-500"
              />
              <div className="text-[10px] text-slate-500 mt-1">Out of {activeHosp?.total_beds} capacity</div>
            </div>

            {/* ICU Beds Available */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                <HeartPulse className="w-4 h-4 text-rose-400" /> Available ICU Beds
              </label>
              <input
                type="number"
                min={0}
                max={activeHosp?.icu_beds || 100}
                value={availableIcu}
                onChange={(e) => setAvailableIcu(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-lg font-bold text-rose-400 focus:outline-none focus:border-rose-500"
              />
              <div className="text-[10px] text-slate-500 mt-1">Out of {activeHosp?.icu_beds} total ICU units</div>
            </div>

            {/* Ambulances Fleet */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                <Ambulance className="w-4 h-4 text-amber-400" /> Ambulances Ready
              </label>
              <input
                type="number"
                min={0}
                max={activeHosp?.ambulances_total || 20}
                value={ambulancesAvail}
                onChange={(e) => setAmbulancesAvail(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-lg font-bold text-amber-400 focus:outline-none focus:border-rose-500"
              />
              <div className="text-[10px] text-slate-500 mt-1">Out of {activeHosp?.ambulances_total} fleet total</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1 block">Facility Operational Status:</label>
              <select
                value={opStatus}
                onChange={(e) => setOpStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Fully Operational">Fully Operational (All Trauma & Surg Active)</option>
                <option value="Critical Capacity">Critical Capacity (Triage Threshold &gt;90%)</option>
                <option value="Diverting">Diverting (Severe Backlog / Power Hazard)</option>
                <option value="Damaged">Damaged / Evacuating</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold mb-1 block">Blood & Plasma Reserves:</label>
              <select
                value={bloodSupplies}
                onChange={(e) => setBloodSupplies(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Adequate">Adequate (Universal O-Neg & Platelets Stocked)</option>
                <option value="Low">Low (Request Red Crescent Plasma Supply)</option>
                <option value="Critical Shortage">Critical Shortage (Emergency Blood Drive Required)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-500">
              Updates immediately recalibrate resource recommendation routes.
            </span>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Broadcasting...' : 'Save Hospital Triage Status'}</span>
            </button>
          </div>
        </form>

        {/* Incoming Patients / Designated Casualty Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Ambulance className="w-4 h-4 text-amber-400" />
              <span>Incoming Casualties ({incomingEmergencies.length})</span>
            </h3>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {incomingEmergencies.length > 0 ? (
              incomingEmergencies.map((emg) => (
                <div key={emg.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-400">{emg.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono">
                      {emg.priority}
                    </span>
                  </div>
                  <div className="font-semibold text-white">{emg.category}</div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">{emg.description}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>Casualties: <b>{emg.people_affected}</b></span>
                    <span>Status: <b className="text-indigo-400">{emg.status}</b></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                No active ambulances routed to this facility currently.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
