/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserRole, EmergencyReport, RescueTeam, Hospital, Shelter, ReliefOrganization, MissingPerson, BlockedRoad, NotificationItem, AuditLog, ReplanScenario } from './types/disaster';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { CitizenPortal } from './components/CitizenPortal';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { RescuePortal } from './components/RescuePortal';
import { HospitalPortal } from './components/HospitalPortal';
import { ShelterPortal } from './components/ShelterPortal';
import { ReliefPortal } from './components/ReliefPortal';
import { TrackEmergencyModal } from './components/TrackEmergencyModal';
import { DynamicReplanModal } from './components/DynamicReplanModal';

export default function App() {
  // Default Role is 'citizen' per Section 3
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');

  // Application Data States
  const [stats, setStats] = useState<any>(null);
  const [emergencies, setEmergencies] = useState<EmergencyReport[]>([]);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [reliefOrgs, setReliefOrgs] = useState<ReliefOrganization[]>([]);
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [blockedRoads, setBlockedRoads] = useState<BlockedRoad[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [replanScenarios, setReplanScenarios] = useState<ReplanScenario[]>([]);

  // Modals
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackInitialId, setTrackInitialId] = useState('');
  const [isReplanModalOpen, setIsReplanModalOpen] = useState(false);

  // Fetch all live database state
  const refreshAllData = async () => {
    try {
      const [
        statsData,
        emgData,
        teamsData,
        hospData,
        shelterData,
        reliefData,
        mpData,
        roadsData,
        notifData,
        auditData,
        scenariosData,
      ] = await Promise.all([
        api.getStats().catch(() => null),
        api.getEmergencies().catch(() => []),
        api.getRescueTeams().catch(() => []),
        api.getHospitals().catch(() => []),
        api.getShelters().catch(() => []),
        api.getReliefOrgs().catch(() => []),
        api.getMissingPersons().catch(() => []),
        api.getBlockedRoads().catch(() => []),
        api.getNotifications().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getReplanScenarios().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (emgData) setEmergencies(emgData);
      if (teamsData) setRescueTeams(teamsData);
      if (hospData) setHospitals(hospData);
      if (shelterData) setShelters(shelterData);
      if (reliefData) setReliefOrgs(reliefData);
      if (mpData) setMissingPersons(mpData);
      if (roadsData) setBlockedRoads(roadsData);
      if (notifData) setNotifications(notifData);
      if (auditData) setAuditLogs(auditData);
      if (scenariosData) setReplanScenarios(scenariosData);
    } catch (err) {
      console.error('Failed to load disaster response data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Subscribe to Server-Sent Events for real-time live updates
    const unsubscribe = api.subscribeEvents((event) => {
      // Whenever an event is received, perform a seamless data refresh
      refreshAllData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenTrackWithId = (id: string) => {
    setTrackInitialId(id);
    setIsTrackModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Global Command Header with Role Switcher */}
      <Navbar
        currentRole={currentRole}
        onSelectRole={setCurrentRole}
        notifications={notifications}
        onOpenTrackModal={() => {
          setTrackInitialId('');
          setIsTrackModalOpen(true);
        }}
        onOpenReportModal={() => setCurrentRole('citizen')}
      />

      {/* Dynamic View by Selected Role */}
      <div className="flex-1">
        {currentRole === 'citizen' && (
          <CitizenPortal
            onOpenTrackModalWithId={handleOpenTrackWithId}
            onEmergencySubmitted={() => refreshAllData()}
          />
        )}

        {currentRole === 'authority' && (
          <AuthorityDashboard
            stats={stats}
            emergencies={emergencies}
            rescueTeams={rescueTeams}
            hospitals={hospitals}
            shelters={shelters}
            reliefOrgs={reliefOrgs}
            missingPersons={missingPersons}
            blockedRoads={blockedRoads}
            notifications={notifications}
            auditLogs={auditLogs}
            onDataRefresh={refreshAllData}
            onOpenReplanSimulator={() => setIsReplanModalOpen(true)}
          />
        )}

        {currentRole === 'rescue_team' && (
          <RescuePortal
            teams={rescueTeams}
            emergencies={emergencies}
            onDataRefresh={refreshAllData}
          />
        )}

        {currentRole === 'hospital' && (
          <HospitalPortal
            hospitals={hospitals}
            emergencies={emergencies}
            onDataRefresh={refreshAllData}
          />
        )}

        {currentRole === 'shelter_manager' && (
          <ShelterPortal
            shelters={shelters}
            onDataRefresh={refreshAllData}
          />
        )}

        {currentRole === 'relief_org' && (
          <ReliefPortal
            organizations={reliefOrgs}
            onDataRefresh={refreshAllData}
          />
        )}
      </div>

      {/* Global Modals */}
      <TrackEmergencyModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        initialId={trackInitialId}
      />

      <DynamicReplanModal
        isOpen={isReplanModalOpen}
        onClose={() => setIsReplanModalOpen(false)}
        scenarios={replanScenarios}
        onReplanApproved={() => {
          refreshAllData();
          setIsReplanModalOpen(false);
        }}
      />
    </div>
  );
}
