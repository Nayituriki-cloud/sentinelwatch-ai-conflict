import React, { useState } from 'react';
import {
  Bell,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  Navigation,
  FileCheck,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { EmergencyAlert, UserProfile, SeverityLevel } from '../types';

interface AlertManagementProps {
  alerts: EmergencyAlert[];
  currentUser: UserProfile;
  onApproveAlert: (alertId: string, officerName: string, role: UserProfile['role']) => Promise<void>;
  onBroadcastAlert: (alertId: string) => Promise<void>;
  onCreateAlertDraft: (alertData: Partial<EmergencyAlert>) => Promise<void>;
}

export const AlertManagement: React.FC<AlertManagementProps> = ({
  alerts,
  currentUser,
  onApproveAlert,
  onBroadcastAlert,
  onCreateAlertDraft,
}) => {
  const [showDraftModal, setShowDraftModal] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftType, setDraftType] = useState<EmergencyAlert['type']>('evacuation_notice');
  const [draftSeverity, setDraftSeverity] = useState<SeverityLevel>('warning');
  const [draftZones, setDraftZones] = useState<string>('North Valley Border Sector');
  const [draftMessage, setDraftMessage] = useState<string>('');
  const [draftInstructions, setDraftInstructions] = useState<string>(
    '1. Evacuate via Green Corridor Highway 12.\n2. Proceed to Al-Salam Shelter.'
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isAuthorizedOfficer = [
    'emergency_responder',
    'government_admin',
    'analyst',
    'system_admin',
  ].includes(currentUser.role);

  const pendingReviewAlerts = alerts.filter((a) => a.status === 'pending_human_review');
  const broadcastedAlerts = alerts.filter((a) => a.status === 'broadcasted' || a.status === 'approved');

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle || !draftMessage) return;

    setIsSubmitting(true);
    try {
      const instructionsArray = draftInstructions
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await onCreateAlertDraft({
        title: draftTitle,
        type: draftType,
        severity: draftSeverity,
        affectedZones: [draftZones],
        message: draftMessage,
        instructions: instructionsArray,
      });

      setShowDraftModal(false);
      setDraftTitle('');
      setDraftMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-amber-400 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-100">
              Emergency Alerts &amp; Evacuation Corridor Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Human-in-the-Loop Early Warning System. All public alerts require human officer authorization before transmission across civilian channels.
          </p>
        </div>

        {isAuthorizedOfficer && (
          <button
            onClick={() => setShowDraftModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Draft New Emergency Alert</span>
          </button>
        )}
      </div>

      {/* Human-in-the-Loop Review Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Pending Human Review Queue ({pendingReviewAlerts.length})
          </h3>
          <span className="text-[11px] text-amber-400 font-medium">
            Requires Responder / Administrator Sign-off
          </span>
        </div>

        {pendingReviewAlerts.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl text-center text-xs text-slate-500">
            No pending alerts awaiting review. All current drafts have been verified and processed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReviewAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900 border-2 border-amber-500/40 p-4.5 rounded-xl space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      {alert.severity} · {alert.type.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-sm text-slate-100 mt-1">{alert.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Drafted: {new Date(alert.createdAt).toLocaleTimeString()}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {alert.message}
                </p>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Instructions to Public:</span>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {alert.instructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>

                {isAuthorizedOfficer ? (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Operator: <strong className="text-slate-300">{currentUser.name}</strong>
                    </span>
                    <button
                      onClick={() => onApproveAlert(alert.id, currentUser.name, currentUser.role)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Authorize &amp; Approve</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-400 italic pt-2 border-t border-slate-800">
                    Switch to Emergency Responder or Government Admin to review and authorize.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Broadcasts & Distribution Channels */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Active Public Broadcasts ({broadcastedAlerts.length})
        </h3>

        <div className="space-y-3">
          {broadcastedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4.5 rounded-xl border ${
                alert.severity === 'critical'
                  ? 'bg-red-950/20 border-red-800/80'
                  : 'bg-slate-900 border-slate-800'
              } space-y-3`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      alert.severity === 'critical'
                        ? 'bg-red-900 text-red-200'
                        : 'bg-amber-900 text-amber-200'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <h4 className="font-bold text-sm text-slate-100">{alert.title}</h4>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Broadcast Active
                  </span>
                  {alert.status === 'approved' && isAuthorizedOfficer && (
                    <button
                      onClick={() => onBroadcastAlert(alert.id)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" /> Transmit Push / Cell Broadcast
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>

              {/* Evacuation Routes if included */}
              {alert.evacuationRoutes && alert.evacuationRoutes.length > 0 && (
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wide flex items-center gap-1">
                    <Navigation className="h-3 w-3 text-emerald-400" /> Designated Evacuation Corridors
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {alert.evacuationRoutes.map((route, i) => (
                      <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{route.name}</span>
                          <span
                            className={`font-mono text-[10px] uppercase font-bold ${
                              route.status === 'safe'
                                ? 'text-emerald-400'
                                : route.status === 'caution'
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}
                          >
                            {route.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px] mt-0.5">{route.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Authorization Signature Line */}
              {alert.authorizedBy && (
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                  <span>
                    Authorized By:{' '}
                    <strong className="text-slate-300">
                      {alert.authorizedBy.officerName} ({alert.authorizedBy.role})
                    </strong>
                  </span>
                  <span>
                    Channels: <strong className="text-slate-400">{alert.distributionChannels.join(', ')}</strong>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal for drafting new emergency alert */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-400" />
                Draft New Emergency Alert (Human-in-the-Loop)
              </h3>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MANDATORY EVACUATION NOTICE: Sector Alpha Lowlands"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Alert Type</label>
                  <select
                    value={draftType}
                    onChange={(e) => setDraftType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="evacuation_notice">Evacuation Notice</option>
                    <option value="public_safety_warning">Public Safety Warning</option>
                    <option value="shelter_advisory">Shelter Advisory</option>
                    <option value="road_closure">Road / Bridge Closure</option>
                    <option value="humanitarian_aid">Humanitarian Aid Distribution</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Severity Tier</label>
                  <select
                    value={draftSeverity}
                    onChange={(e) => setDraftSeverity(e.target.value as SeverityLevel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="critical">Critical (Life-Safety Immediate)</option>
                    <option value="warning">Warning (High Urgency)</option>
                    <option value="advisory">Advisory (Precautionary)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Target Zone / Sector</label>
                <input
                  type="text"
                  value={draftZones}
                  onChange={(e) => setDraftZones(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Public Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the hazard clearly and plainly for affected civilians..."
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Direct Instructions (One per line)
                </label>
                <textarea
                  rows={3}
                  value={draftInstructions}
                  onChange={(e) => setDraftInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>

              <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-lg text-amber-200/90 text-[11px]">
                <strong className="block text-amber-300 mb-0.5">Human Verification Requirement:</strong>
                Submitting this form places the alert into the Human Review Queue. It will not be broadcast to the public until signed by an authorized responder.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
                >
                  {isSubmitting ? 'Creating Draft...' : 'Submit to Review Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
