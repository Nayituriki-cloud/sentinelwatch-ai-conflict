import React from 'react';
import {
  Zap,
  Droplet,
  HeartPulse,
  Radio,
  Navigation,
  Fuel,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { InfrastructureNode } from '../types';

interface InfrastructureStatusProps {
  infrastructure: InfrastructureNode[];
}

export const InfrastructureStatus: React.FC<InfrastructureStatusProps> = ({ infrastructure }) => {
  const getIcon = (type: InfrastructureNode['type']) => {
    switch (type) {
      case 'power_grid':
        return <Zap className="h-4 w-4 text-amber-400" />;
      case 'water_facility':
        return <Droplet className="h-4 w-4 text-blue-400" />;
      case 'hospital':
        return <HeartPulse className="h-4 w-4 text-rose-400" />;
      case 'telecom_tower':
        return <Radio className="h-4 w-4 text-indigo-400" />;
      case 'bridge_crossing':
        return <Navigation className="h-4 w-4 text-emerald-400" />;
      case 'fuel_depot':
      default:
        return <Fuel className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: InfrastructureNode['operationalStatus']) => {
    switch (status) {
      case 'operational':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900 font-semibold">
            <CheckCircle className="h-2.5 w-2.5" /> 100% Online
          </span>
        );
      case 'degraded':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900 font-semibold">
            <AlertTriangle className="h-2.5 w-2.5" /> Degraded
          </span>
        );
      case 'offline':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900 font-semibold">
            <XCircle className="h-2.5 w-2.5" /> Offline
          </span>
        );
      case 'threatened':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-900 font-semibold">
            <AlertTriangle className="h-2.5 w-2.5" /> Threatened
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          Lifeline Infrastructure Status
        </h4>
        <span className="text-[10px] font-mono text-slate-400">
          {infrastructure.filter((n) => n.operationalStatus === 'operational').length} / {infrastructure.length} Functional
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {infrastructure.map((node) => (
          <div
            key={node.id}
            className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              {getIcon(node.type)}
              {getStatusBadge(node.operationalStatus)}
            </div>
            <h5 className="font-semibold text-slate-100 text-xs truncate" title={node.name}>
              {node.name}
            </h5>
            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
              <span>{node.zone}</span>
              <span>Gen: {node.backupAvailable ? 'Yes' : 'No'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
