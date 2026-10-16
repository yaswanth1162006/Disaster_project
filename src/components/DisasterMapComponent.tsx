import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  EmergencyReport,
  RescueTeam,
  Hospital,
  Shelter,
  BlockedRoad,
} from '../types/disaster';
import { Layers, Eye, RefreshCw, AlertTriangle, Shield, HeartPulse, Home } from 'lucide-react';

interface DisasterMapProps {
  emergencies: EmergencyReport[];
  rescueTeams: RescueTeam[];
  hospitals: Hospital[];
  shelters: Shelter[];
  blockedRoads: BlockedRoad[];
  onSelectEmergency?: (report: EmergencyReport) => void;
  centerCoordinates?: [number, number];
}

export const DisasterMapComponent: React.FC<DisasterMapProps> = ({
  emergencies,
  rescueTeams,
  hospitals,
  shelters,
  blockedRoads,
  onSelectEmergency,
  centerCoordinates = [17.72, 83.31],
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer filters
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showBlockedRoads, setShowBlockedRoads] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: centerCoordinates,
        zoom: 13,
        zoomControl: true,
      });

      // OpenStreetMap Standard Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Disaster Response GIS Engine',
        maxZoom: 19,
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Recenter when centerCoordinates prop changes
  useEffect(() => {
    if (mapInstanceRef.current && centerCoordinates) {
      mapInstanceRef.current.setView(centerCoordinates, 14);
    }
  }, [centerCoordinates]);

  // Update Markers and Overlays whenever data or filter toggles change
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    layersGroupRef.current.clearLayers();

    // 1. Blocked Roads (Danger Polylines / Warning Markers)
    if (showBlockedRoads) {
      blockedRoads.forEach((road) => {
        if (road.status === 'Active') {
          const circle = L.circle([road.latitude, road.longitude], {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.35,
            radius: 400,
          });

          const roadIcon = L.divIcon({
            className: 'custom-road-icon',
            html: `
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold text-xs shadow-lg border-2 border-white animate-pulse">
                🛑
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([road.latitude, road.longitude], { icon: roadIcon });
          marker.bindPopup(`
            <div class="p-2 font-sans text-slate-900">
              <div class="font-bold text-red-600 flex items-center gap-1 text-sm">
                <span>⛔ ROAD BLOCKAGE</span>
              </div>
              <div class="font-semibold mt-1">${road.name}</div>
              <div class="text-xs text-slate-600 mt-1">${road.description}</div>
              <div class="mt-2 text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono">
                Severity: ${road.severity}
              </div>
            </div>
          `);

          layersGroupRef.current?.addLayer(circle);
          layersGroupRef.current?.addLayer(marker);
        }
      });
    }

    // 2. Emergency Reports
    if (showEmergencies) {
      emergencies.forEach((report) => {
        if (priorityFilter !== 'All' && report.priority !== priorityFilter) return;

        let pinColor = '#3b82f6';
        let badgeBg = 'bg-blue-600';
        let emoji = '⚠️';

        if (report.priority === 'Critical') {
          pinColor = '#ef4444';
          badgeBg = 'bg-red-600';
          emoji = '🚨';
        } else if (report.priority === 'High') {
          pinColor = '#f97316';
          badgeBg = 'bg-orange-600';
          emoji = '⚠️';
        } else if (report.priority === 'Medium') {
          pinColor = '#eab308';
          badgeBg = 'bg-amber-600';
          emoji = '📍';
        }

        const emergencyIcon = L.divIcon({
          className: 'custom-emergency-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer transform hover:scale-125 transition-transform duration-200">
              <div class="w-8 h-8 rounded-full ${badgeBg} text-white flex items-center justify-center text-xs font-bold shadow-xl border-2 border-white">
                ${emoji}
              </div>
              ${
                report.priority === 'Critical'
                  ? `<div class="absolute -inset-1 rounded-full bg-red-500 opacity-75 animate-ping"></div>`
                  : ''
              }
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([report.latitude, report.longitude], { icon: emergencyIcon });

        // Threat radius circle for critical incidents
        if (report.priority === 'Critical') {
          const zone = L.circle([report.latitude, report.longitude], {
            color: '#ef4444',
            fillColor: '#fca5a5',
            fillOpacity: 0.2,
            radius: 500,
          });
          layersGroupRef.current?.addLayer(zone);
        }

        marker.bindPopup(`
          <div class="p-2 font-sans text-slate-900 max-w-[240px]">
            <div class="flex items-center justify-between gap-2 border-b pb-1 mb-1">
              <span class="font-bold text-xs ${report.priority === 'Critical' ? 'text-red-600' : 'text-blue-600'}">${report.id}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                report.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }">${report.priority}</span>
            </div>
            <div class="font-bold text-sm text-slate-900">${report.category}</div>
            <div class="text-xs text-slate-600 line-clamp-2 mt-1">${report.description}</div>
            <div class="text-[11px] text-slate-500 mt-1">📍 ${report.address}</div>
            <div class="mt-2 text-xs font-semibold text-slate-700">
              Affected: ${report.people_affected} | Status: <span class="text-indigo-600">${report.status}</span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectEmergency) onSelectEmergency(report);
        });

        layersGroupRef.current?.addLayer(marker);
      });
    }

    // 3. Rescue Teams
    if (showTeams) {
      rescueTeams.forEach((team) => {
        const isFree = team.current_status === 'Available';
        const teamIcon = L.divIcon({
          className: 'custom-team-marker',
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full ${
              isFree ? 'bg-emerald-600' : 'bg-indigo-600'
            } text-white font-bold text-xs shadow-lg border-2 border-white hover:scale-110 transition-transform">
              ${team.type === 'Boat Rescue' ? '🚤' : team.type === 'Medical First Response' ? '🚑' : '🛡️'}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([team.latitude, team.longitude], { icon: teamIcon });
        marker.bindPopup(`
          <div class="p-2 font-sans text-slate-900">
            <div class="font-bold text-xs text-emerald-700">${team.type}</div>
            <div class="font-bold text-sm text-slate-900 mt-0.5">${team.name}</div>
            <div class="text-xs text-slate-600 mt-1">Status: <span class="font-semibold ${
              isFree ? 'text-emerald-600' : 'text-indigo-600'
            }">${team.current_status}</span></div>
            <div class="text-xs text-slate-500 mt-1">Personnel: ${team.personnel_count} | Base: ${team.base_station}</div>
            <div class="text-[10px] text-slate-400 mt-1 font-mono">Contact: ${team.contact_phone}</div>
          </div>
        `);
        layersGroupRef.current?.addLayer(marker);
      });
    }

    // 4. Hospitals
    if (showHospitals) {
      hospitals.forEach((hosp) => {
        const hospIcon = L.divIcon({
          className: 'custom-hosp-marker',
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-xs shadow-lg border-2 border-white hover:scale-110 transition-transform">
              🏥
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([hosp.latitude, hosp.longitude], { icon: hospIcon });
        marker.bindPopup(`
          <div class="p-2 font-sans text-slate-900">
            <div class="font-bold text-xs text-rose-600">HOSPITAL TRIAGE</div>
            <div class="font-bold text-sm text-slate-900 mt-0.5">${hosp.name}</div>
            <div class="text-xs mt-1">Available Beds: <span class="font-bold text-emerald-600">${hosp.available_beds}</span> / ${hosp.total_beds}</div>
            <div class="text-xs">ICU Open: <span class="font-bold text-rose-600">${hosp.available_icu}</span> | Ambulances: ${hosp.ambulances_available}</div>
            <div class="text-[10px] text-slate-500 mt-1">${hosp.address}</div>
          </div>
        `);
        layersGroupRef.current?.addLayer(marker);
      });
    }

    // 5. Shelters
    if (showShelters) {
      shelters.forEach((shelter) => {
        const remaining = shelter.total_capacity - shelter.current_occupancy;
        const shelterIcon = L.divIcon({
          className: 'custom-shelter-marker',
          html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs shadow-lg border-2 border-white hover:scale-110 transition-transform">
              ⛺
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([shelter.latitude, shelter.longitude], { icon: shelterIcon });
        marker.bindPopup(`
          <div class="p-2 font-sans text-slate-900">
            <div class="font-bold text-xs text-teal-700">EVACUATION SHELTER</div>
            <div class="font-bold text-sm text-slate-900 mt-0.5">${shelter.name}</div>
            <div class="text-xs mt-1">Occupancy: <b>${shelter.current_occupancy}</b> / ${shelter.total_capacity}</div>
            <div class="text-xs">Remaining Spots: <span class="font-bold ${
              remaining > 0 ? 'text-teal-600' : 'text-red-600'
            }">${remaining}</span></div>
            <div class="text-xs text-slate-500 mt-1">Food/Water: ${shelter.food_water_status}</div>
          </div>
        `);
        layersGroupRef.current?.addLayer(marker);
      });
    }
  }, [
    emergencies,
    rescueTeams,
    hospitals,
    shelters,
    blockedRoads,
    showEmergencies,
    showTeams,
    showHospitals,
    showShelters,
    showBlockedRoads,
    priorityFilter,
  ]);

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-950">
      {/* Map Target Div */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Control Overlay: Layers & Filters */}
      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 text-xs text-slate-200 shadow-xl max-w-xs space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 font-semibold text-slate-100">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>GIS Map Layers</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Live</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showEmergencies}
              onChange={(e) => setShowEmergencies(e.target.checked)}
              className="rounded bg-slate-800 text-amber-500 focus:ring-0"
            />
            <span className="text-red-400 font-medium">🚨 Incidents ({emergencies.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showTeams}
              onChange={(e) => setShowTeams(e.target.checked)}
              className="rounded bg-slate-800 text-emerald-500 focus:ring-0"
            />
            <span className="text-emerald-400 font-medium">🛡️ Teams ({rescueTeams.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showHospitals}
              onChange={(e) => setShowHospitals(e.target.checked)}
              className="rounded bg-slate-800 text-rose-500 focus:ring-0"
            />
            <span className="text-rose-400 font-medium">🏥 Hospitals ({hospitals.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showShelters}
              onChange={(e) => setShowShelters(e.target.checked)}
              className="rounded bg-slate-800 text-teal-500 focus:ring-0"
            />
            <span className="text-teal-400 font-medium">⛺ Shelters ({shelters.length})</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white col-span-2">
            <input
              type="checkbox"
              checked={showBlockedRoads}
              onChange={(e) => setShowBlockedRoads(e.target.checked)}
              className="rounded bg-slate-800 text-red-500 focus:ring-0"
            />
            <span className="text-amber-300 font-medium">⛔ Blocked Roads ({blockedRoads.filter(r => r.status === 'Active').length})</span>
          </label>
        </div>

        {/* Priority Filter */}
        <div className="pt-2 border-t border-slate-800">
          <div className="text-[10px] text-slate-400 mb-1">Filter Incidents by Priority:</div>
          <div className="flex gap-1">
            {(['All', 'Critical', 'High', 'Medium'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setPriorityFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  priorityFilter === lvl
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Legend Footer */}
      <div className="absolute bottom-2 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-4 shadow-lg">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Critical Threat
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High Priority
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Ready Team
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Hospital Bed
        </span>
      </div>
    </div>
  );
};
