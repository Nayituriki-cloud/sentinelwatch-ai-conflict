import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  XCircle,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Incident, IncidentCategory, SeverityLevel, VerificationStatus } from '../types';

interface IncidentFeedProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  onOpenReportModal: () => void;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onOpenReportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filtered = incidents.filter((inc) => {
    if (selectedCategory !== 'all' && inc.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && inc.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.zoneName.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityStyle = (sev: SeverityLevel) => {
    switch (sev) {
      case 'critical':
        return {
          textColor: 'text-red-400',
          borderColor: 'border-l-red-500',
          bgLight: 'bg-red-950/20',
        };
      case 'warning':
        return {
          textColor: 'text-amber-400',
          borderColor: 'border-l-amber-500',
          bgLight: 'bg-amber-950/20',
        };
      case 'advisory':
        return {
          textColor: 'text-blue-400',
          borderColor: 'border-l-blue-500',
          bgLight: 'bg-blue-950/20',
        };
      case 'information':
      default:
        return {
          textColor: 'text-slate-400',
          borderColor: 'border-l-slate-500',
          bgLight: 'bg-slate-900/40',
        };
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span title="Multi-source Verified">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          </span>
        );
      case 'corroborated':
        return (
          <span title="Corroborated by Sensors">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          </span>
        );
      case 'investigating':
        return (
          <span title="Active Investigation">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </span>
        );
      case 'unverified':
        return (
          <span title="Unconfirmed Field Report">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
          </span>
        );
      case 'discredited_misinformation':
        return (
          <span title="Discredited Misinformation">
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header and Live Count */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-100 tracking-tight">Active Insecurity & Conflict Telemetry</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filtered.length} of {incidents.length} events
          </span>
        </div>

        {/* Search bar */}
        <div className="mt-3 relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search zones, threat type, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
              selectedStatus === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setSelectedStatus('verified')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
              selectedStatus === 'verified'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Verified Only
          </button>
          <button
            onClick={() => setSelectedStatus('unverified')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
              selectedStatus === 'unverified'
                ? 'bg-slate-800 text-slate-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unverified
          </button>
          <button
            onClick={() => setSelectedStatus('discredited_misinformation')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
              selectedStatus === 'discredited_misinformation'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Misinformation Debunked
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No incidents match your current search and filter criteria.
          </div>
        ) : (
          filtered.map((inc) => {
            const style = getSeverityStyle(inc.severity);
            const isSelected = selectedIncident?.id === inc.id;

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`p-3.5 rounded-lg border-l-4 ${style.borderColor} ${
                  isSelected
                    ? 'bg-slate-800/90 border-slate-700 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800/60'
                } cursor-pointer transition-all`}
              >
                {/* Top line: Category and Status */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${style.textColor}`}>
                      {inc.severity}
                    </span>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {inc.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    {getStatusIcon(inc.status)}
                    <span className="capitalize">{inc.status.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-xs font-semibold text-slate-100 mt-1.5 line-clamp-2 leading-relaxed">
                  {inc.title}
                </h4>

                {/* Unboxed Metadata (Zone, report count, time) */}
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                  <span className="text-slate-300 font-medium">{inc.zoneName}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>{inc.reportCount} reports</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>{inc.sources.length} independent sources</span>
                </div>

                {/* AI Confidence & Summary Snippet */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Confidence:</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        inc.confidenceScore >= 80
                          ? 'text-emerald-400'
                          : inc.confidenceScore >= 50
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {inc.confidenceScore}%
                    </span>
                  </div>

                  <span className="text-[11px] text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-medium">
                    AI Verification &rarr;
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer report CTA */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400">Civilian observer or responder?</span>
        <button
          onClick={onOpenReportModal}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          + Submit Report
        </button>
      </div>
    </div>
  );
};
