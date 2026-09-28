import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Shield,
  EyeOff,
  CheckCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import { IncidentCategory, SeverityLevel, UserProfile } from '../types';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSubmitReport: (data: {
    title: string;
    category: IncidentCategory;
    severity: SeverityLevel;
    zoneName: string;
    summary: string;
    reporterRole: string;
    reporterName: string;
    userId: string;
  }) => Promise<void>;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitReport,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('civil_unrest');
  const [severity, setSeverity] = useState<SeverityLevel>('warning');
  const [zoneName, setZoneName] = useState('Central Urban Corridor (Zone Beta-2)');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute scrubbed preview to reassure user that citizen private info is stripped
  const scrubbedPreview = summary
    ? summary.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]')
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary) return;

    setIsSubmitting(true);
    try {
      await onSubmitReport({
        title,
        category,
        severity,
        zoneName,
        summary,
        reporterRole: currentUser.role,
        reporterName: currentUser.name,
        userId: currentUser.id,
      });
      onClose();
      setTitle('');
      setSummary('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-6">
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Submit Field Incident / Threat Telemetry
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-medium">Incident Summary Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Unexplained crowd gathering and transit stoppage near Liberty Bridge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Threat Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="armed_conflict">Armed Conflict / Perimeter Clash</option>
                <option value="civil_unrest">Civil Unrest / Demonstration</option>
                <option value="violence">Violence / Danger</option>
                <option value="explosion_hazard">Explosion or Blast Hazard</option>
                <option value="infrastructure_disruption">Infrastructure Disruption (Water/Power)</option>
                <option value="border_incident">Border / Perimeter Movement</option>
                <option value="natural_disaster">Natural Disaster / Flood</option>
                <option value="telecom_blackout">Communications Blackout</option>
                <option value="unexplained_gathering">Large Unexplained Gathering</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Observed Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              >
                <option value="critical">Critical (Immediate danger)</option>
                <option value="warning">Warning (High concern)</option>
                <option value="advisory">Advisory (Noticeable event)</option>
                <option value="information">Information (Informational only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">Observed Zone / Sector</label>
            <select
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
            >
              <option value="North Valley Border Sector (Zone Alpha-4)">North Valley Border Sector (Zone Alpha-4)</option>
              <option value="Central Urban Corridor (Zone Beta-2)">Central Urban Corridor (Zone Beta-2)</option>
              <option value="South Commercial District (Zone Gamma-1)">South Commercial District (Zone Gamma-1)</option>
              <option value="Western Port Authority (Zone Delta-3)">Western Port Authority (Zone Delta-3)</option>
              <option value="Eastern River Basin (Zone Epsilon-1)">Eastern River Basin (Zone Epsilon-1)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-medium">Detailed Observations</label>
            <textarea
              rows={3}
              required
              placeholder="Describe what occurred, visible smoke/damage, and whether emergency vehicles or civilians are in danger..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Automated Privacy Scrubber preview */}
          {summary && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <EyeOff className="h-3.5 w-3.5" />
                <span>Automated Civilian Privacy Scrubber Active:</span>
              </div>
              <p className="text-slate-400 font-mono italic">
                "{scrubbedPreview}"
              </p>
            </div>
          )}

          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-blue-400" /> Human Verification Guarantee:
            </span>
            <p>
              Your report will be reviewed by the AI Verification Engine for corroboration and routed to an authorized responder. It will remain tagged as <strong>Unverified</strong> until independently corroborated.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Submitting & Scrubbing...' : 'Submit Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
