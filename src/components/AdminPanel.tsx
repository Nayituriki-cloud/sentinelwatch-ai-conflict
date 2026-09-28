import React, { useState } from 'react';
import {
  ShieldAlert,
  Server,
  FileText,
  Sliders,
  CheckCircle2,
  Lock,
  UserCheck,
  AlertOctagon,
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { DataSource, AuditLog, UserProfile } from '../types';

interface AdminPanelProps {
  dataSources: DataSource[];
  auditLogs: AuditLog[];
  userProfiles: UserProfile[];
  currentUser: UserProfile;
  onToggleSource: (sourceId: string) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  dataSources,
  auditLogs,
  userProfiles,
  currentUser,
  onToggleSource,
}) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'audit' | 'privacy' | 'guardrails'>('sources');
  const [privacyMaskRadius, setPrivacyMaskRadius] = useState<number>(3.0);
  const [autoPurgeDays, setAutoPurgeDays] = useState<number>(30);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              System Administration, Telemetry Feeds &amp; Privacy Compliance
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Role-Based Access Control, Immutable Audit Logs, and Ethical AI Guardrail Verification
          </p>
        </div>

        <div className="text-right text-xs">
          <span className="text-slate-500 block text-[10px] uppercase font-mono">Current Session</span>
          <span className="font-semibold text-emerald-400">{currentUser.name}</span>
          <span className="text-slate-500 font-mono block text-[10px] capitalize">Clearance: {currentUser.clearanceLevel}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'sources'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Data Ingestion Sources ({dataSources.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'audit'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Immutable Audit Logs ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'privacy'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Privacy &amp; Data Retention
        </button>

        <button
          onClick={() => setActiveTab('guardrails')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'guardrails'
              ? 'bg-slate-800 text-emerald-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Ethical AI Safety Guardrails
        </button>
      </div>

      {/* Tab 1: Data Ingestion Sources */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Authorized sensor streams, dispatch APIs, and citizen reporting networks</span>
            <span>All streams encrypted in transit via TLS 1.3</span>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-xs">
            {dataSources.map((src) => (
              <div key={src.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{src.name}</span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                        src.trustLevel === 'high'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {src.trustLevel} Trust
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="capitalize">Type: {src.type.replace(/_/g, ' ')}</span>
                    <span>·</span>
                    <span>Reliability Index: <strong className="text-slate-200">{(src.reliabilityRating * 100).toFixed(0)}%</strong></span>
                    <span>·</span>
                    <span>Last Telemetry Ping: <strong className="text-slate-300">{src.lastPing}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-medium ${src.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {src.active ? 'Active & Ingesting' : 'Paused / Offline'}
                  </span>
                  <button
                    onClick={() => onToggleSource(src.id)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    {src.active ? (
                      <ToggleRight className="h-6 w-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cryptographically sealed action history for human verification &amp; alert approvals</span>
            <span className="font-mono text-[11px]">Retention: 90 days tamper-evident</span>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-1 hover:bg-slate-850/50 transition-colors">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{log.userName}</span>
                    <span className="text-slate-500">({log.userRole})</span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono uppercase text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900 text-[10px]">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{log.details}</p>

                <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 font-mono">
                  <span>Target Ref: {log.targetId}</span>
                  <span>Masked IP: {log.ipAddressMasked}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Privacy & Data Retention */}
      {activeTab === 'privacy' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              Civilian Location Blurring &amp; Minimization Controls
            </h3>
            <p className="text-slate-400 mt-1">
              To prevent retaliatory targeting or civil surveillance, citizen reports are aggregated into zone buffers rather than exact coordinates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-slate-300 font-medium block">
                Geographic Zone Aggregation Radius: <strong className="text-emerald-400">{privacyMaskRadius} km</strong>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={privacyMaskRadius}
                onChange={(e) => setPrivacyMaskRadius(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[11px] text-slate-500">
                Reports within this radius are merged into a centroid zone to protect citizen residential anonymity.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-slate-300 font-medium block">
                Automatic Data Retention Window: <strong className="text-emerald-400">{autoPurgeDays} Days</strong>
              </label>
              <input
                type="range"
                min="7"
                max="90"
                value={autoPurgeDays}
                onChange={(e) => setAutoPurgeDays(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[11px] text-slate-500">
                Citizen identifiers and unverified raw logs older than {autoPurgeDays} days are permanently purged from server memory.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Ethical AI Guardrails */}
      {activeTab === 'guardrails' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Ethical Non-Combat &amp; Defensive Mission Guardrails
              </h3>
              <p className="text-slate-400">
                SentinelWatch AI is engineered strictly for early detection and civilian protection.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                title: 'No Autonomous Combat or Attacks',
                desc: 'The AI cannot initiate kinetic strikes, deploy countermeasures, or conduct autonomous military operations.',
                status: 'Enforced via System Architecture',
              },
              {
                title: 'No Individual Human Targeting',
                desc: 'The system explicitly prohibits selecting people as targets or identifying individual civilians as enemies.',
                status: 'Enforced via NLP Guardrail Rules',
              },
              {
                title: 'No Weapon or Attack Instructions',
                desc: 'Prompts and responses filter out weapons fabrication, sabotage tutorials, and offensive tactics.',
                status: 'Strict System Instruction',
              },
              {
                title: 'Mandatory Human-in-the-Loop for Escalation',
                desc: 'All public emergency broadcasts, evacuation corridor declarations, and high-severity notices require signed authorization from human officers.',
                status: 'Hardcoded Approval Gate',
              },
              {
                title: 'Zero Covert Civilian Surveillance',
                desc: 'Personal citizen coordinates and phone numbers are redacted in memory before spatial clustering.',
                status: 'Automated Privacy Scrubber Active',
              },
            ].map((rule, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-4 rounded-xl border border-emerald-900/30 flex items-start justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <h5 className="font-bold text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {rule.title}
                  </h5>
                  <p className="text-slate-400 text-[11px] leading-relaxed pl-6">{rule.desc}</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
                  {rule.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
