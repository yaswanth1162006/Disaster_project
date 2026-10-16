import React from 'react';
import { UserRole, NotificationItem } from '../types/disaster';
import {
  ShieldAlert,
  Radio,
  Search,
  Activity,
  UserCheck,
  LifeBuoy,
  Building2,
  Tent,
  Truck,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  notifications: NotificationItem[];
  onOpenTrackModal: () => void;
  onOpenReportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  notifications,
  onOpenTrackModal,
  onOpenReportModal,
}) => {
  const criticalAlerts = notifications.filter(
    (n) => n.level === 'critical' && !n.is_read
  );

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Critical Alert Ribbon Marquee */}
      {criticalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white text-xs px-4 py-1.5 flex items-center justify-between font-medium shadow-inner animate-pulse">
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />
            <span className="font-bold uppercase tracking-wider text-[11px] bg-red-950/60 px-2 py-0.5 rounded">
              High Priority Alert
            </span>
            <span className="truncate">{criticalAlerts[0].title}: {criticalAlerts[0].message}</span>
          </div>
          <span className="text-[10px] text-red-100 font-mono shrink-0 ml-4">
            Active Threat Level: RED
          </span>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Branding & Mission */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-white font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700">
                PS-2
              </span>
              <h1 className="font-bold text-slate-100 text-sm sm:text-base tracking-tight truncate max-w-[260px] sm:max-w-md">
                When Every Minute Changes the Answer
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Intelligent Disaster Response & Relief Coordination Engine
            </p>
          </div>
        </div>

        {/* Action Group: Citizen Quick Actions & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Track Request Button */}
          <button
            onClick={onOpenTrackModal}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:border-slate-500 shadow-sm"
            title="Track report status using unique request ID"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Track</span> Status
          </button>

          {/* Quick Report Emergency Button */}
          {currentRole !== 'citizen' && (
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition-all active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report Emergency</span>
            </button>
          )}

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-inner">
            <span className="text-[11px] text-slate-400 px-2 font-medium hidden lg:inline">
              Active Portal:
            </span>
            <select
              value={currentRole}
              onChange={(e) => onSelectRole(e.target.value as UserRole)}
              className="bg-slate-800 text-white text-xs font-semibold rounded-lg px-2.5 py-1 outline-none border border-slate-700 focus:border-amber-500 cursor-pointer"
            >
              <option value="citizen">👤 Citizen Emergency Portal</option>
              <option value="authority">🏛️ Disaster Command Authority</option>
              <option value="rescue_team">🚤 Rescue Team (NDRF SAR-01)</option>
              <option value="hospital">🏥 Hospital Staff (Apex Trauma)</option>
              <option value="shelter_manager">⛺ Shelter Manager (East Arena)</option>
              <option value="relief_org">🚚 Relief Org (Red Crescent)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
