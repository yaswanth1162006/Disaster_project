import React, { useState } from 'react';
import { Shelter } from '../types/disaster';
import { api } from '../services/api';
import {
  Tent,
  Users,
  Utensils,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface ShelterPortalProps {
  shelters: Shelter[];
  onDataRefresh: () => void;
}

export const ShelterPortal: React.FC<ShelterPortalProps> = ({
  shelters,
  onDataRefresh,
}) => {
  const [selectedShelterId, setSelectedShelterId] = useState<string>(
    shelters[0]?.id || 'SHELTER-01'
  );
  const activeShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  const [currentOccupancy, setCurrentOccupancy] = useState<number>(
    activeShelter?.current_occupancy ?? 512
  );
  const [foodWaterStatus, setFoodWaterStatus] = useState<string>(
    activeShelter?.food_water_status ?? 'Abundant'
  );
  const [opStatus, setOpStatus] = useState<string>(
    activeShelter?.operational_status ?? 'Active'
  );
  const [medicalKits, setMedicalKits] = useState<number>(activeShelter?.medical_kits ?? 140);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectShelter = (id: string) => {
    setSelectedShelterId(id);
    const sh = shelters.find((s) => s.id === id);
    if (sh) {
      setCurrentOccupancy(sh.current_occupancy);
      setFoodWaterStatus(sh.food_water_status);
      setOpStatus(sh.operational_status);
      setMedicalKits(sh.medical_kits);
    }
  };

  const handleSaveShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShelter) return;
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.updateShelterOccupancy(activeShelter.id, {
        current_occupancy: currentOccupancy,
        food_water_status: foodWaterStatus,
        operational_status: opStatus,
        medical_kits: medicalKits,
        actor: activeShelter.manager_name,
      });
      setSuccessMsg('Shelter occupancy and supplies logged to unified database.');
      onDataRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update shelter.');
    } finally {
      setIsLoading(false);
    }
  };

  const remaining = Math.max(0, (activeShelter?.total_capacity || 0) - currentOccupancy);
  const occupancyPercent = activeShelter
    ? Math.round((currentOccupancy / activeShelter.total_capacity) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <Tent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{activeShelter?.name}</h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  remaining > 50
                    ? 'bg-teal-950 text-teal-300 border border-teal-500/30'
                    : 'bg-red-950 text-red-300 border border-red-500/30'
                }`}
              >
                {activeShelter?.operational_status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {activeShelter?.address} | Manager: {activeShelter?.manager_name} ({activeShelter?.manager_phone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium px-2">Camp:</span>
          <select
            value={selectedShelterId}
            onChange={(e) => handleSelectShelter(e.target.value)}
            className="bg-slate-900 text-white font-semibold rounded-lg px-3 py-1.5 border border-slate-700 outline-none"
          >
            {shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
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
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Visual Capacity Meter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-teal-400" /> Current Population Intake vs Ceiling
          </span>
          <span className="font-mono text-white">
            {currentOccupancy} / {activeShelter?.total_capacity} Persons ({occupancyPercent}%)
          </span>
        </div>

        {/* Meter Bar */}
        <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              occupancyPercent > 90
                ? 'bg-red-500'
                : occupancyPercent > 70
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-teal-500 to-emerald-500'
            }`}
            style={{ width: `${Math.min(100, occupancyPercent)}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 pt-1">
          <span>Remaining Available Capacity: <b className="text-teal-300">{remaining} slots</b></span>
          <span>Accessibility: <b className="text-white">{activeShelter?.is_accessible ? 'Wheelchair Accessible ✓' : 'Stairs Only'}</b></span>
        </div>
      </div>

      {/* Update Form */}
      <form
        onSubmit={handleSaveShelter}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
      >
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
          Update Camp Population Headcount & Rations
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              Verified Headcount Occupancy:
            </label>
            <input
              type="number"
              min={0}
              max={activeShelter?.total_capacity ? activeShelter.total_capacity + 100 : 1000}
              value={currentOccupancy}
              onChange={(e) => setCurrentOccupancy(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-lg font-bold text-white focus:outline-none focus:border-teal-500"
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Exceeding capacity will immediately alert Unified Command to divert incoming convoys.
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
              First-Aid & Trauma Kits:
            </label>
            <input
              type="number"
              min={0}
              value={medicalKits}
              onChange={(e) => setMedicalKits(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-lg font-bold text-emerald-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Potable Water & Cooked Rations:
            </label>
            <select
              value={foodWaterStatus}
              onChange={(e) => setFoodWaterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="Abundant">Abundant (Water & 3 meals secure &gt;48h)</option>
              <option value="Moderate">Moderate (Adequate for 24 hours)</option>
              <option value="Low">Low (Urgent water bowser resupply needed)</option>
              <option value="Depleted">Depleted (CRITICAL EMERGENCY RESUPPLY)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              Operational Gate Status:
            </label>
            <select
              value={opStatus}
              onChange={(e) => setOpStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="Active">Active (Open for Intake)</option>
              <option value="At Capacity">At Capacity (Intake Diverted)</option>
              <option value="Needs Evacuation">Needs Evacuation (Rising floodwaters)</option>
              <option value="Closing">Closing / Transitioning</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving...' : 'Sync Shelter Intake Log'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
