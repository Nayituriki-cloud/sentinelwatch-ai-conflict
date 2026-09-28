import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Brain,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  Send,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Incident, UserProfile, VerificationStatus } from '../types';

interface IncidentDetailModalProps {
  incident: Incident | null;
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateStatus: (incidentId: string, status: VerificationStatus, confidence: number, notes: string) => void;
  onRunAIVerification: (incidentId: string) => Promise<void>;
  onDraftAlertFromIncident: (incident: Incident) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  currentUser,
  onClose,
  onUpdateStatus,
  onRunAIVerification,
  onDraftAlertFromIncident,
}) => {
  if (!incident) return null;

  const [selectedStatus, setSelectedStatus] = useState<VerificationStatus>(incident.status);
  const [confidenceInput, setConfidenceInput] = useState<number>(incident.confidenceScore);
  const [analystNotes, setAnalystNotes] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const isAuthorizedAnalystOrResponder = [
    'emergency_responder',
    'analyst',
    'government_admin',
    'system_admin',
  ].includes(currentUser.role);

  const handleTriggerAIVerification = async () => {
    setIsVerifying(true);
    try {
      await onRunAIVerification(incident.id);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveStatus = () => {
    onUpdateStatus(incident.id, selectedStatus, confidenceInput, analystNotes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider">
                ID: {incident.id}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 capitalize">{incident.category.replace('_', ' ')}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 font-medium">{incident.zoneName}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-1 leading-snug">
              {incident.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Severity</span>
              <span className="font-bold text-slate-200 uppercase tracking-wide mt-0.5 block">
                {incident.severity}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Verification</span>
              <span className="font-semibold text-emerald-400 capitalize mt-0.5 block">
                {incident.status.replace('_', ' ')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Confidence Level</span>
              <span className="font-mono font-bold text-blue-400 text-sm mt-0.5 block">
                {incident.confidenceScore}%
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Civilian Exposure</span>
              <span className="font-medium text-slate-300 mt-0.5 block">
                ~{(incident.impactedCivilianEstimate || 1500).toLocaleString()} people
              </span>
            </div>
          </div>

          {/* AI Verification Engine Breakdown Section */}
          <div className="bg-slate-950/90 border border-emerald-900/40 rounded-xl p-4.5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-emerald-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                  AI Multi-Source Corroboration Engine
                </h4>
              </div>

              <button
                onClick={handleTriggerAIVerification}
                disabled={isVerifying}
                className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 rounded text-xs flex items-center gap-1.5 transition-colors font-medium"
              >
                <RefreshCw className={`h-3 w-3 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Analyzing Sources...' : 'Re-verify with Gemini'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Independent Signals</span>
                <span className="font-bold text-slate-100 text-sm mt-0.5 block">
                  {incident.aiVerificationDetails?.independentSourcesCount || incident.sources.length} Nodes
                </span>
                <span className="text-[10px] text-slate-500">Dispatch, Sat, Civilian</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Misinformation Probability</span>
                <span
                  className={`font-bold text-sm mt-0.5 block ${
                    (incident.aiVerificationDetails?.misinformationProbability || 10) > 40
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {incident.aiVerificationDetails?.misinformationProbability || 10}%
                </span>
                <span className="text-[10px] text-slate-500">Reverse-image & NLP check</span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Escalation Risk Tier</span>
                <span className="font-bold text-amber-400 uppercase text-sm mt-0.5 block">
                  {incident.aiVerificationDetails?.escalationRisk || 'Moderate'}
                </span>
                <span className="text-[10px] text-slate-500">Defensive trajectory</span>
              </div>
            </div>

            {/* AI Explanation Text */}
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800/90">
              <span className="font-semibold text-emerald-400 block mb-1">Step-by-Step AI Reasoning:</span>
              {incident.aiVerificationDetails?.explanation || incident.aiAnalysisSummary}
            </div>

            {/* Civilian Guidance Recommendation */}
            <div className="text-xs text-amber-200/90 bg-amber-950/30 border border-amber-800/40 p-3 rounded-lg">
              <span className="font-semibold text-amber-300 block mb-1">Recommended Civilian Protection Action:</span>
              {incident.recommendedCivilianAction}
            </div>
          </div>

          {/* Independent Data Sources Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              Independent Source Reports ({incident.sources.length})
            </h4>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              {incident.sources.map((src, idx) => (
                <div key={src.id || idx} className="p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{src.sourceName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 capitalize">{src.sourceType.replace('_', ' ')}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">{src.timestamp}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{src.summary}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                    <span>Reliability Index: <strong>{(src.reliabilityScore * 100).toFixed(0)}%</strong></span>
                    <span>Media Verification: <strong>{src.mediaVerified ? 'Confirmed Authenticated' : 'Unauthenticated'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Human-in-the-Loop Verification Action (For Authorized Responders & Analysts) */}
          {isAuthorizedAnalystOrResponder ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Authorized Human Verification & Audit
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  Officer: {currentUser.name} ({currentUser.role})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Set Verification Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as VerificationStatus)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="unverified">Unverified (Pending Inquiry)</option>
                    <option value="investigating">Investigating (Field Dispatch)</option>
                    <option value="corroborated">Corroborated (Multiple Signals)</option>
                    <option value="verified">Verified (Confirmed Truth)</option>
                    <option value="discredited_misinformation">Discredited Misinformation</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Confidence Score: {confidenceInput}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidenceInput}
                    onChange={(e) => setConfidenceInput(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Verification Audit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Cross-referenced with Civil Defense radar and local municipal hospital intake..."
                  value={analystNotes}
                  onChange={(e) => setAnalystNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => onDraftAlertFromIncident(incident)}
                  className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span>Draft Public Emergency Alert</span>
                </button>

                <button
                  onClick={handleSaveStatus}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Commit Status & Sign Audit Log
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
              You are viewing in Public Citizen mode. Verification state modifications and alert drafting require authorized responder or analyst credentials.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
