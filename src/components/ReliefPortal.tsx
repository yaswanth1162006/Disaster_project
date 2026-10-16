import React, { useState } from 'react';
import { ReliefOrganization, ReliefTask } from '../types/disaster';
import { api } from '../services/api';
import {
  Truck,
  Package,
  Users,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  Save,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface ReliefPortalProps {
  organizations: ReliefOrganization[];
  onDataRefresh: () => void;
}

export const ReliefPortal: React.FC<ReliefPortalProps> = ({
  organizations,
  onDataRefresh,
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    organizations[0]?.id || 'RELIEF-01'
  );
  const activeOrg = organizations.find((o) => o.id === selectedOrgId) || organizations[0];

  // Inventory state
  const [foodKits, setFoodKits] = useState<number>(activeOrg?.supplies_inventory.food_kits ?? 1250);
  const [waterLiters, setWaterLiters] = useState<number>(activeOrg?.supplies_inventory.water_liters ?? 18000);
  const [hygienePacks, setHygienePacks] = useState<number>(activeOrg?.supplies_inventory.hygiene_packs ?? 950);
  const [blankets, setBlankets] = useState<number>(activeOrg?.supplies_inventory.blankets ?? 2400);
  const [medicalTents, setMedicalTents] = useState<number>(activeOrg?.supplies_inventory.medical_tents ?? 12);
  const [volunteers, setVolunteers] = useState<number>(activeOrg?.volunteers_active ?? 85);
  const [vehicles, setVehicles] = useState<number>(activeOrg?.vehicles_available ?? 9);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectOrg = (id: string) => {
    setSelectedOrgId(id);
    const org = organizations.find((o) => o.id === id);
    if (org) {
      setFoodKits(org.supplies_inventory.food_kits);
      setWaterLiters(org.supplies_inventory.water_liters);
      setHygienePacks(org.supplies_inventory.hygiene_packs);
      setBlankets(org.supplies_inventory.blankets);
      setMedicalTents(org.supplies_inventory.medical_tents);
      setVolunteers(org.volunteers_active);
      setVehicles(org.vehicles_available);
    }
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.updateReliefInventory(activeOrg.id, {
        supplies: {
          food_kits: foodKits,
          water_liters: waterLiters,
          hygiene_packs: hygienePacks,
          blankets: blankets,
          medical_tents: medicalTents,
        },
        volunteers,
        vehicles,
        actor: activeOrg.lead_contact,
      });
      setSuccessMsg('Stockpile inventory synchronized with command logistics matrix.');
      onDataRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTaskProgress = async (taskId: string, currentProgress: number) => {
    if (!activeOrg) return;
    const newProgress = Math.min(100, currentProgress + 25);
    const newStatus = newProgress >= 100 ? 'Delivered' : 'In Transit';
    setIsLoading(true);
    try {
      await api.updateReliefTask(activeOrg.id, taskId, {
        progress: newProgress,
        status: newStatus,
        actor: activeOrg.lead_contact,
      });
      setSuccessMsg(`Task updated: ${newProgress}% (${newStatus})`);
      onDataRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update task.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{activeOrg?.name}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                Authorized Relief Agency
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mission Lead: {activeOrg?.lead_contact} | Comms: {activeOrg?.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium px-2">Agency:</span>
          <select
            value={selectedOrgId}
            onChange={(e) => handleSelectOrg(e.target.value)}
            className="bg-slate-900 text-white font-semibold rounded-lg px-3 py-1.5 border border-slate-700 outline-none"
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Update Form */}
        <form
          onSubmit={handleSaveInventory}
          className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
        >
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Stockpile Inventory & Deployable Assets</span>
            </span>
            <span className="text-[11px] text-slate-500">Live Logistics Data</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 mb-1 block">Ration / Meal Kits</label>
              <input
                type="number"
                min={0}
                value={foodKits}
                onChange={(e) => setFoodKits(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-white text-base focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 mb-1 block">Clean Water (Liters)</label>
              <input
                type="number"
                min={0}
                value={waterLiters}
                onChange={(e) => setWaterLiters(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-blue-400 text-base focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 mb-1 block">Hygiene Packs</label>
              <input
                type="number"
                min={0}
                value={hygienePacks}
                onChange={(e) => setHygienePacks(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-white text-base focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 mb-1 block">Warm Blankets</label>
              <input
                type="number"
                min={0}
                value={blankets}
                onChange={(e) => setBlankets(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-white text-base focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 mb-1 block">Medical Tents</label>
              <input
                type="number"
                min={0}
                value={medicalTents}
                onChange={(e) => setMedicalTents(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-amber-400 text-base focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 mb-1 block">Active Volunteers</label>
              <input
                type="number"
                min={0}
                value={volunteers}
                onChange={(e) => setVolunteers(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-emerald-400 text-base focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-500">
              Fleet Capacity: {vehicles} heavy trucks and delivery vans available
            </span>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Updating...' : 'Commit Stockpile Quantities'}</span>
            </button>
          </div>
        </form>

        {/* Assigned Relief Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>Assigned Relief Dispatches</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {activeOrg?.assigned_tasks.length || 0} Missions
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {activeOrg?.assigned_tasks && activeOrg.assigned_tasks.length > 0 ? (
              activeOrg.assigned_tasks.map((task) => (
                <div key={task.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{task.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        task.status === 'Delivered'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-950 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    📍 Destination: <span className="text-slate-200">{task.destination}</span>
                  </div>
                  <div className="text-[11px] text-amber-300/80">
                    📦 Payload: {task.supplies_summary}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Transit Progress</span>
                      <span className="font-bold font-mono text-white">{task.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {task.status !== 'Delivered' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleUpdateTaskProgress(task.id, task.progress)}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Advance Progress (+25%)</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                No active delivery tasks assigned. Command center will route aid tasks as supply requests arrive.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
