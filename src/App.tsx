import React, { useState, useEffect, useCallback } from 'react';
import {
  Incident,
  EmergencyAlert,
  Shelter,
  InfrastructureNode,
  DataSource,
  FamilyCheckIn,
  MissingPersonReport,
  AuditLog,
  UserProfile,
  VerificationStatus,
} from './types';
import {
  INITIAL_USER_PROFILES,
  INITIAL_INCIDENTS,
  INITIAL_ALERTS,
  INITIAL_SHELTERS,
  INITIAL_INFRASTRUCTURE,
  INITIAL_DATA_SOURCES,
  INITIAL_FAMILY_CHECK_INS,
  INITIAL_MISSING_PERSONS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { MapDashboard } from './components/MapDashboard';
import { GoogleMapDashboard } from './components/GoogleMapDashboard';
import { IncidentFeed } from './components/IncidentFeed';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { AIRiskAnalysisModal } from './components/AIRiskAnalysisModal';
import { AlertManagement } from './components/AlertManagement';
import { CivilianProtectionPortal } from './components/CivilianProtectionPortal';
import { AdminPanel } from './components/AdminPanel';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { InfrastructureStatus } from './components/InfrastructureStatus';
import { TimelineScrubber } from './components/TimelineScrubber';
import { playEmergencyChime, playCriticalSiren } from './utils/audio';

export default function App() {
  const [userProfiles] = useState<UserProfile[]>(INITIAL_USER_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USER_PROFILES[0]);
  const [activeView, setActiveView] = useState<'dashboard' | 'civilian' | 'alerts' | 'admin'>('dashboard');

  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [infrastructure, setInfrastructure] = useState<InfrastructureNode[]>(INITIAL_INFRASTRUCTURE);
  const [dataSources, setDataSources] = useState<DataSource[]>(INITIAL_DATA_SOURCES);
  const [familyCheckIns, setFamilyCheckIns] = useState<FamilyCheckIn[]>(INITIAL_FAMILY_CHECK_INS);
  const [missingPersons, setMissingPersons] = useState<MissingPersonReport[]>(INITIAL_MISSING_PERSONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Modals & UI States
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showAIRiskModal, setShowAIRiskModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [timelineHourOffset, setTimelineHourOffset] = useState<number>(0);
  const [mapEngine, setMapEngine] = useState<'google' | 'osm'>('google');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDvDiGxzJ1rUe8vUIOeDjl76xrn83w4lCg'
  );

  // Load live data from server endpoints
  const loadData = useCallback(async () => {
    try {
      const [incRes, altRes, shlRes, infRes, srcRes, chkRes, misRes, audRes, cfgRes] = await Promise.allSettled([
        fetch('/api/incidents').then((r) => r.json()),
        fetch('/api/alerts').then((r) => r.json()),
        fetch('/api/shelters').then((r) => r.json()),
        fetch('/api/infrastructure').then((r) => r.json()),
        fetch('/api/sources').then((r) => r.json()),
        fetch('/api/civilian/check-ins').then((r) => r.json()),
        fetch('/api/civilian/missing-persons').then((r) => r.json()),
        fetch('/api/audit-logs').then((r) => r.json()),
        fetch('/api/config').then((r) => r.json()),
      ]);

      if (incRes.status === 'fulfilled' && incRes.value.success) setIncidents(incRes.value.data);
      if (altRes.status === 'fulfilled' && altRes.value.success) setAlerts(altRes.value.data);
      if (shlRes.status === 'fulfilled' && shlRes.value.success) setShelters(shlRes.value.data);
      if (infRes.status === 'fulfilled' && infRes.value.success) setInfrastructure(infRes.value.data);
      if (srcRes.status === 'fulfilled' && srcRes.value.success) setDataSources(srcRes.value.data);
      if (chkRes.status === 'fulfilled' && chkRes.value.success) setFamilyCheckIns(chkRes.value.data);
      if (misRes.status === 'fulfilled' && misRes.value.success) setMissingPersons(misRes.value.data);
      if (audRes.status === 'fulfilled' && audRes.value.success) setAuditLogs(audRes.value.data);
      if (cfgRes.status === 'fulfilled' && cfgRes.value.googleMapsApiKey) {
        setGoogleMapsApiKey(cfgRes.value.googleMapsApiKey);
      }
    } catch (err) {
      console.warn('API polling fallback to initial mock memory:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Background polling every 12 seconds
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Verify Incident Status Update
  const handleUpdateIncidentStatus = async (
    incidentId: string,
    status: VerificationStatus,
    confidence: number,
    notes: string
  ) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          confidenceScore: confidence,
          notes,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === incidentId ? data.data : inc))
        );
        setSelectedIncident(data.data);
        if (soundEnabled) playEmergencyChime();
        loadData();
      }
    } catch (err) {
      console.error('Failed to verify incident:', err);
    }
  };

  // Run on-demand AI Verification Engine on an incident
  const handleRunAIVerification = async (incidentId: string) => {
    try {
      const res = await fetch('/api/ai/verify-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });
      const data = await res.json();
      if (data.success) {
        setIncidents((prev) =>
          prev.map((inc) => (inc.id === incidentId ? data.incident : inc))
        );
        setSelectedIncident(data.incident);
        if (soundEnabled) playEmergencyChime();
      }
    } catch (err) {
      console.error('Failed to run AI verification:', err);
    }
  };

  // Draft Alert from Incident
  const handleDraftAlertFromIncident = (incident: Incident) => {
    setSelectedIncident(null);
    setActiveView('alerts');
  };

  // Approve Alert (Human-in-the-Loop)
  const handleApproveAlert = async (alertId: string, officerName: string, role: UserProfile['role']) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerId: currentUser.id,
          officerName,
          role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.data : a)));
        if (soundEnabled) playEmergencyChime();
        loadData();
      }
    } catch (err) {
      console.error('Failed to approve alert:', err);
    }
  };

  // Broadcast Alert
  const handleBroadcastAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/broadcast`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.data : a)));
        if (soundEnabled) playCriticalSiren();
        loadData();
      }
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
    }
  };

  // Create Alert Draft
  const handleCreateAlertDraft = async (alertData: Partial<EmergencyAlert>) => {
    try {
      const res = await fetch('/api/alerts/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => [data.data, ...prev]);
        loadData();
      }
    } catch (err) {
      console.error('Failed to draft alert:', err);
    }
  };

  // Submit Public or Field Report
  const handleSubmitReport = async (reportData: any) => {
    try {
      const res = await fetch('/api/incidents/submit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });
      const data = await res.json();
      if (data.success) {
        setIncidents((prev) => [data.data, ...prev]);
        if (soundEnabled) playEmergencyChime();
        loadData();
      }
    } catch (err) {
      console.error('Failed to submit report:', err);
    }
  };

  // Submit Family Check-In
  const handleSubmitCheckIn = async (checkInData: Partial<FamilyCheckIn>) => {
    try {
      const res = await fetch('/api/civilian/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkInData),
      });
      const data = await res.json();
      if (data.success) {
        setFamilyCheckIns((prev) => [data.data, ...prev]);
      }
    } catch (err) {
      console.error('Failed to submit check-in:', err);
    }
  };

  // Submit Missing Person
  const handleSubmitMissingPerson = async (missingData: Partial<MissingPersonReport>) => {
    try {
      const res = await fetch('/api/civilian/missing-persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missingData),
      });
      const data = await res.json();
      if (data.success) {
        setMissingPersons((prev) => [data.data, ...prev]);
      }
    } catch (err) {
      console.error('Failed to submit missing person:', err);
    }
  };

  // Trigger Civilian Guidance Generation
  const handleTriggerGuidance = async (topic: string, language: string) => {
    try {
      const res = await fetch('/api/ai/civilian-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language }),
      });
      const data = await res.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Failed to trigger guidance:', err);
      return null;
    }
  };

  // Toggle Source active
  const handleToggleSource = async (sourceId: string) => {
    try {
      const res = await fetch(`/api/sources/${sourceId}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDataSources((prev) => prev.map((s) => (s.id === sourceId ? data.data : s)));
      }
    } catch (err) {
      console.error('Failed to toggle source:', err);
    }
  };

  // Trigger Sensor Simulation
  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/simulation/trigger-event', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIncidents((prev) => [data.data, ...prev]);
        setSelectedIncident(data.data);
        if (soundEnabled) playEmergencyChime();
        loadData();
      }
    } catch (err) {
      console.error('Failed to trigger simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        userProfiles={userProfiles}
        onSelectUser={setCurrentUser}
        activeView={activeView}
        onChangeView={setActiveView}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenReportModal={() => setShowReportModal(true)}
        onOpenAIRiskModal={() => setShowAIRiskModal(true)}
        onTriggerSimulation={handleTriggerSimulation}
        activeAlerts={alerts}
        isSimulating={isSimulating}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
            {/* Top Command Bar & Timeline Scrubber */}
            <TimelineScrubber
              incidents={incidents}
              currentHourOffset={timelineHourOffset}
              onChangeHourOffset={setTimelineHourOffset}
            />

            {/* Core Split: Geospatial Map Dashboard & Incident Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left: Google Location Intelligence Map (or Fallback OSM) */}
              <div className="lg:col-span-8 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Map Engine:</span>
                    <button
                      onClick={() => setMapEngine('google')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        mapEngine === 'google'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      Google Location (Google Maps)
                    </button>
                    <button
                      onClick={() => setMapEngine('osm')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        mapEngine === 'osm'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      OpenStreetMap (Offline Fallback)
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {mapEngine === 'google' ? '● Google Maps Platform Connected' : '● Leaflet Engine Active'}
                  </span>
                </div>

                {mapEngine === 'google' ? (
                  <GoogleMapDashboard
                    apiKey={googleMapsApiKey}
                    incidents={incidents}
                    shelters={shelters}
                    infrastructure={infrastructure}
                    alerts={alerts}
                    selectedIncident={selectedIncident}
                    onSelectIncident={(inc) => setSelectedIncident(inc)}
                    onOpenReportModal={() => setShowReportModal(true)}
                  />
                ) : (
                  <MapDashboard
                    incidents={incidents}
                    shelters={shelters}
                    infrastructure={infrastructure}
                    alerts={alerts}
                    selectedIncident={selectedIncident}
                    onSelectIncident={(inc) => setSelectedIncident(inc)}
                    onOpenReportModal={() => setShowReportModal(true)}
                  />
                )}
              </div>

              {/* Right: Live Incident Feed & Triage */}
              <div className="lg:col-span-4 h-[540px] lg:h-[620px]">
                <IncidentFeed
                  incidents={incidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={(inc) => setSelectedIncident(inc)}
                  onOpenReportModal={() => setShowReportModal(true)}
                />
              </div>
            </div>

            {/* Bottom Row: Lifeline Infrastructure Status */}
            <InfrastructureStatus infrastructure={infrastructure} />
          </div>
        )}

        {/* Civilian Protection Portal View */}
        {activeView === 'civilian' && (
          <CivilianProtectionPortal
            shelters={shelters}
            familyCheckIns={familyCheckIns}
            missingPersons={missingPersons}
            onSubmitCheckIn={handleSubmitCheckIn}
            onSubmitMissingPerson={handleSubmitMissingPerson}
            onTriggerGuidance={handleTriggerGuidance}
          />
        )}

        {/* Emergency Alerts & Evacuation View */}
        {activeView === 'alerts' && (
          <AlertManagement
            alerts={alerts}
            currentUser={currentUser}
            onApproveAlert={handleApproveAlert}
            onBroadcastAlert={handleBroadcastAlert}
            onCreateAlertDraft={handleCreateAlertDraft}
          />
        )}

        {/* Admin, Audit Logs & Privacy View */}
        {activeView === 'admin' && (
          <AdminPanel
            dataSources={dataSources}
            auditLogs={auditLogs}
            userProfiles={userProfiles}
            currentUser={currentUser}
            onToggleSource={handleToggleSource}
          />
        )}
      </main>

      {/* Incident Detail & AI Verification Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        currentUser={currentUser}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateIncidentStatus}
        onRunAIVerification={handleRunAIVerification}
        onDraftAlertFromIncident={handleDraftAlertFromIncident}
      />

      {/* AI Threat & Risk Assessment Modal */}
      <AIRiskAnalysisModal
        isOpen={showAIRiskModal}
        onClose={() => setShowAIRiskModal(false)}
        incidents={incidents}
      />

      {/* Report Threat / Public Submission Modal */}
      <ReportIncidentModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        currentUser={currentUser}
        onSubmitReport={handleSubmitReport}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">SentinelWatch AI</span>
            <span>·</span>
            <span>Civilian Protection &amp; Early-Warning Defensive Intelligence</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Strict Non-Combat Protocol · Human-in-the-Loop Verification · Privacy Zone Aggregation
          </div>
        </div>
      </footer>
    </div>
  );
}
