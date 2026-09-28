import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  AlertOctagon,
  Shield,
  Zap,
  HeartHandshake,
  Download,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AIRiskReport, Incident } from '../types';

interface AIRiskAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
}

export const AIRiskAnalysisModal: React.FC<AIRiskAnalysisModalProps> = ({
  isOpen,
  onClose,
  incidents,
}) => {
  const [report, setReport] = useState<AIRiskReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRiskReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/escalation-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'usr-analyst-01', userRole: 'analyst' }),
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err) {
      console.error('Failed to load risk analysis report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report) {
      fetchRiskReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-950 border border-blue-600/40 flex items-center justify-center text-blue-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                AI Early-Warning Threat &amp; Insecurity Risk Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Automated multi-sensor synthesis &amp; defensive civilian protection projection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRiskReport}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              title="Regenerate Report"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-6">
          {/* Important Ethical Disclaimer Banner */}
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-200">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-blue-300">Defensive Analytical Principle:</span>
              <p className="text-blue-200/90 leading-relaxed">
                {report?.disclaimer ||
                  'These indicators are derived from multi-sensor statistical heuristics and natural language triage. They represent analytical risk assessments for civilian protection, not definitive future predictions.'}
              </p>
            </div>
          </div>

          {loading || !report ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                Synthesizing multi-zone telemetry &amp; generating defensive risk model with Gemini...
              </p>
              <p className="text-xs text-slate-500">Cross-referencing satellite sensors, emergency dispatch, and utility grids</p>
            </div>
          ) : (
            <>
              {/* Overall Composite Threat Index */}
              <div className="bg-slate-950 p-4.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Regional Insecurity Threat Index
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-extrabold text-amber-400 font-mono">
                      {report.overallThreatIndex}
                      <span className="text-sm text-slate-500 font-normal"> / 100</span>
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold uppercase rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                      Elevated Defensive Alert
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    {report.securitySituationSummary}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono block">Model Evaluation</span>
                  <span className="text-xs text-slate-400 font-mono">{new Date(report.timestamp).toLocaleTimeString()} UTC</span>
                </div>
              </div>

              {/* Emerging Incident Clusters */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Emerging Incident Clusters
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {report.emergingClusters.map((cluster, idx) => (
                    <div key={idx} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">{cluster.zone}</span>
                        <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                          {cluster.incidentCount} reports
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{cluster.dominantCategory}</p>
                      <div className="flex items-center gap-1.5 text-[11px] pt-1">
                        <span className="text-slate-500">Escalation:</span>
                        <span
                          className={`font-semibold capitalize ${
                            cluster.escalationTrend === 'accelerating'
                              ? 'text-red-400'
                              : cluster.escalationTrend === 'stable'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {cluster.escalationTrend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure Risk Vulnerabilities */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Critical Lifeline Infrastructure Risks
                </h4>

                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 text-xs">
                  {report.infrastructureRisks.map((inf, idx) => (
                    <div key={idx} className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{inf.nodeType}</span>
                        <span
                          className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                            inf.vulnerabilityLevel === 'critical'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {inf.vulnerabilityLevel} Vulnerability
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{inf.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Humanitarian Concerns & Escalation Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Humanitarian Concerns */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2.5">
                  <h5 className="font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide text-[11px]">
                    <HeartHandshake className="h-4 w-4 text-rose-400" />
                    Humanitarian Impact Projections
                  </h5>
                  <ul className="space-y-2 text-slate-300 text-[11px] list-disc list-inside">
                    {report.humanitarianConcerns.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Escalation Indicators */}
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2.5">
                  <h5 className="font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide text-[11px]">
                    <AlertOctagon className="h-4 w-4 text-amber-400" />
                    Early Escalation Indicators
                  </h5>
                  <ul className="space-y-2 text-slate-300 text-[11px] list-disc list-inside">
                    {report.escalationIndicators.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Civilian Protection Actions */}
              <div className="bg-emerald-950/30 border border-emerald-800/50 p-4 rounded-xl space-y-2.5 text-xs">
                <h5 className="font-bold text-emerald-300 flex items-center gap-2 uppercase tracking-wide text-[11px]">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Recommended Civilian-Safety Actions
                </h5>
                <div className="space-y-2 text-emerald-100/90 text-xs">
                  {report.recommendedCivilianProtectionActions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                      <p className="leading-relaxed">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
