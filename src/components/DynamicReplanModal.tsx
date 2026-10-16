import React, { useState } from 'react';
import { ReplanScenario } from '../types/disaster';
import { api } from '../services/api';
import {
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Cpu,
  RefreshCw,
  Sliders,
  ShieldAlert,
  X,
} from 'lucide-react';

interface DynamicReplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: ReplanScenario[];
  onReplanApproved: (updatedScenario: ReplanScenario) => void;
}

export const DynamicReplanModal: React.FC<DynamicReplanModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  onReplanApproved,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarios[0]?.id || 'SCENARIO-1'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalRationale, setApprovalRationale] = useState('');
  const [simulationOutput, setSimulationOutput] = useState<{
    scenario: ReplanScenario;
    activeDatabaseState: any;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleRunSimulation = async (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setSuccessMessage('');
    setErrorMessage('');
    setIsSimulating(true);
    try {
      const result = await api.simulateReplan(scenarioId);
      setSimulationOutput(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation execution failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!currentScenario) return;
    setIsApproving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.approveReplan(
        currentScenario.id,
        'Cmdr. K. Rao (Disaster Command Authority)',
        approvalRationale.trim() || 'Dynamic re-allocation approved to eliminate logistical bottleneck.'
      );
      setSuccessMessage(res.message);
      onReplanApproved(res.scenario);
    } catch (err: any) {
      setErrorMessage(err.message || 'Approval execution failed.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Dynamic Response Planner</h3>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  Simulation Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Test disaster contingencies, compare previous vs proposed allocations, and commit human-authorized plans.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Scenario Selector Pills */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              1. Select Disaster Contingency Scenario to Simulate:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {scenarios.map((sc) => {
                const isSelected = sc.id === selectedScenarioId;
                return (
                  <button
                    key={sc.id}
                    onClick={() => handleRunSimulation(sc.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{sc.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                        {sc.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2">{sc.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Scenario Detailed Impact Breakdown */}
          {currentScenario && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Simulated Disaster Bottleneck</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">{currentScenario.impact_summary}</p>
            </div>
          )}

          {/* Side-by-Side Plan Comparison (Previous vs Proposed) */}
          {currentScenario && (
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                2. Allocation Plan Comparison (Solver Recommendation)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Previous Active Plan */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-xs text-slate-300">Previous / Baseline Allocation</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      Baseline
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Incident:</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {currentScenario.previous_plan.emergency_id}
                      </span>
                    </div>
                    {currentScenario.previous_plan.assigned_team_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Rescue Squad:</span>
                        <span className="text-white font-medium">
                          {currentScenario.previous_plan.assigned_team_id}
                        </span>
                      </div>
                    )}
                    {currentScenario.previous_plan.assigned_hospital_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Triage Hospital:</span>
                        <span className="text-white font-medium">
                          {currentScenario.previous_plan.assigned_hospital_id}
                        </span>
                      </div>
                    )}
                    {currentScenario.previous_plan.assigned_shelter_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Designated Shelter:</span>
                        <span className="text-white font-medium">
                          {currentScenario.previous_plan.assigned_shelter_id}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-900">
                      <span className="text-slate-400">Operational Status:</span>
                      <span className="text-slate-300 font-semibold">
                        {currentScenario.previous_plan.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proposed Revised Plan */}
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                    <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Proposed Revised Plan
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 font-mono font-bold">
                      Adaptive Optimization
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Incident:</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {currentScenario.proposed_plan.emergency_id}
                      </span>
                    </div>
                    {currentScenario.proposed_plan.assigned_team_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Revised Rescue Unit:</span>
                        <span className="text-emerald-400 font-bold">
                          {currentScenario.proposed_plan.assigned_team_id}
                        </span>
                      </div>
                    )}
                    {currentScenario.proposed_plan.assigned_hospital_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Revised Hospital:</span>
                        <span className="text-rose-400 font-bold">
                          {currentScenario.proposed_plan.assigned_hospital_id}
                        </span>
                      </div>
                    )}
                    {currentScenario.proposed_plan.assigned_shelter_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Revised Shelter:</span>
                        <span className="text-teal-400 font-bold">
                          {currentScenario.proposed_plan.assigned_shelter_id}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-amber-500/20">
                      <span className="text-slate-400">Proposed Strategy:</span>
                      <span className="text-amber-200 font-semibold">
                        {currentScenario.proposed_plan.status}
                      </span>
                    </div>
                  </div>

                  {/* Algorithmic Reason for Change */}
                  <div className="mt-3 pt-2 border-t border-amber-500/20 text-[11px] text-amber-100/90 leading-relaxed bg-amber-950/40 p-2.5 rounded-lg">
                    <div className="font-bold text-amber-300 mb-0.5">Optimization Rationale:</div>
                    {currentScenario.proposed_plan.reason_for_change}
                  </div>

                  {/* Operational Tradeoffs */}
                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300">Tradeoffs / Impact: </span>
                    {currentScenario.proposed_plan.tradeoffs}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commander Approval & Audit Sign-Off */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Human-In-The-Loop Approval & Audit Trail
            </div>
            <p className="text-[11px] text-slate-400">
              In accordance with disaster safety doctrine, no active emergency deployment is overridden without explicit commander sign-off and recorded operational reason.
            </p>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Commander Recorded Rationale:
              </label>
              <input
                type="text"
                value={approvalRationale}
                onChange={(e) => setApprovalRationale(e.target.value)}
                placeholder="e.g. Approved detour route due to river overflow on main causeway."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close Simulator
              </button>
              <button
                type="button"
                onClick={handleApprovePlan}
                disabled={isApproving}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isApproving ? 'Executing & Committing...' : 'Approve & Execute Revised Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
