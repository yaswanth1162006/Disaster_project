import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Search,
  X,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Truck,
  PhoneCall,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface TrackEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialId?: string;
}

export const TrackEmergencyModal: React.FC<TrackEmergencyModalProps> = ({
  isOpen,
  onClose,
  initialId = '',
}) => {
  const [requestId, setRequestId] = useState(initialId);
  const [isLoading, setIsLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialId) {
      setRequestId(initialId);
      performSearch(initialId);
    }
  }, [initialId, isOpen]);

  if (!isOpen) return null;

  const performSearch = async (id: string) => {
    const cleanId = id.trim();
    if (!cleanId) {
      setErrorMessage('Please enter an Emergency Request ID.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    try {
      const data = await api.trackEmergency(cleanId);
      setTrackResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Request ID not found. Please double-check your code.');
      setTrackResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(requestId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Track Emergency Request</h3>
              <p className="text-[11px] text-slate-400">Real-time status verified against dispatch registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value.toUpperCase())}
              placeholder="e.g. EMG-2026-1001"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:border-amber-500 focus:outline-none uppercase"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Checking...' : 'Check Status'}</span>
            </button>
          </form>

          {errorMessage && (
            <div className="mt-3 text-xs text-red-400 bg-red-950/40 border border-red-500/30 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Result Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {trackResult ? (
            <div className="space-y-4">
              {/* ID & Status Pill */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">INCIDENT CODE</div>
                  <div className="text-lg font-black text-amber-400 font-mono">{trackResult.id}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      trackResult.status === 'Resolved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : trackResult.status === 'Dispatched' || trackResult.status === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    ● {trackResult.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Verification: <span className="text-slate-200">{trackResult.verification_status}</span>
                  </div>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="py-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Response Progress Timeline
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold">
                  <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                    ✓ Submitted
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      ['Verified', 'Dispatched', 'In Progress', 'Resolved'].includes(trackResult.status) ||
                      trackResult.verification_status === 'Verified'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    Triage Evaluated
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      ['Dispatched', 'In Progress', 'Resolved'].includes(trackResult.status)
                        ? 'bg-blue-950/60 border-blue-500/40 text-blue-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    Units Dispatched
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      trackResult.status === 'Resolved'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    Resolved
                  </div>
                </div>
              </div>

              {/* Key Incident Metadata */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-white">{trackResult.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reported Address:</span>
                  <span className="font-semibold text-white text-right max-w-[240px] truncate">
                    {trackResult.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">People Impacted:</span>
                  <span className="font-semibold text-white">{trackResult.people_affected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Logged Time:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(trackResult.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Assigned Responders */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Assigned Emergency Units ({trackResult.assigned_teams?.length || 0})
                </div>
                {trackResult.assigned_teams && trackResult.assigned_teams.length > 0 ? (
                  <div className="space-y-2">
                    {trackResult.assigned_teams.map((t: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="font-bold text-white">{t.name}</div>
                            <div className="text-[10px] text-slate-400">{t.type}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center">
                    Dispatch team queue in progress. You will see your assigned units appear here as soon as orders are issued.
                  </div>
                )}
              </div>

              {/* Emergency Hotline Info */}
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold">Need Immediate Police / Medical Hotline?</div>
                  <div className="text-[11px] text-amber-300/80">Call 112 / 108 or contact Central Command directly.</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              Enter your Emergency Request ID to view live verified tracking information.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
