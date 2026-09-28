import React from 'react';
import {
  ShieldAlert,
  Radio,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  LifeBuoy,
  PlusCircle,
  Activity,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { UserProfile, UserRole, EmergencyAlert } from '../types';

interface NavbarProps {
  currentUser: UserProfile;
  userProfiles: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  activeView: 'dashboard' | 'civilian' | 'alerts' | 'admin';
  onChangeView: (view: 'dashboard' | 'civilian' | 'alerts' | 'admin') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenReportModal: () => void;
  onOpenAIRiskModal: () => void;
  onTriggerSimulation: () => void;
  activeAlerts: EmergencyAlert[];
  isSimulating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  userProfiles,
  onSelectUser,
  activeView,
  onChangeView,
  soundEnabled,
  onToggleSound,
  onOpenReportModal,
  onOpenAIRiskModal,
  onTriggerSimulation,
  activeAlerts,
  isSimulating,
}) => {
  const criticalBroadcasts = activeAlerts.filter(
    (a) => a.status === 'broadcasted' && a.severity === 'critical'
  );

  return (
    <header className="border-b border-slate-800 bg-slate-950 text-slate-100 sticky top-0 z-40 select-none">
      {/* Top Emergency Broadcast Ticker if critical alerts active */}
      {criticalBroadcasts.length > 0 && (
        <div className="bg-red-950/80 border-b border-red-800 px-4 py-1.5 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2 truncate">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="font-bold tracking-wider uppercase text-red-400">ACTIVE PUBLIC BROADCAST:</span>
            <span className="truncate">{criticalBroadcasts[0].title}</span>
          </div>
          <button
            onClick={() => onChangeView('alerts')}
            className="text-red-300 hover:text-white underline text-xs ml-4 shrink-0 font-medium"
          >
            View Evacuation Routes &rarr;
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base text-white">SENTINELWATCH</span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                DEFENSE AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Civilian Early-Warning & Conflict Insecurity Detection
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => onChangeView('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeView === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <span>Command Center</span>
          </button>

          <button
            onClick={() => onChangeView('civilian')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeView === 'civilian'
                ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700/60 shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
            }`}
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            <span>Civilian Portal</span>
          </button>

          <button
            onClick={() => onChangeView('alerts')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeView === 'alerts'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="h-3.5 w-3.5 text-amber-400" />
            <span>Alerts & Evac</span>
            {activeAlerts.filter((a) => a.status === 'pending_human_review').length > 0 && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1 rounded font-mono">
                {activeAlerts.filter((a) => a.status === 'pending_human_review').length} Review
              </span>
            )}
          </button>

          {['analyst', 'government_admin', 'system_admin'].includes(currentUser.role) && (
            <button
              onClick={() => onChangeView('admin')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeView === 'admin'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-300" />
              <span className="hidden md:inline">Admin & Audit</span>
            </button>
          )}
        </nav>

        {/* Right utility actions */}
        <div className="flex items-center gap-2">
          {/* AI Risk Brief Generator */}
          <button
            onClick={onOpenAIRiskModal}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/80 text-blue-200 text-xs rounded-lg transition-colors font-medium shadow-sm"
            title="Generate AI Threat & Risk Brief"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>AI Risk Brief</span>
          </button>

          {/* Report Incident button */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition-colors font-medium"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Report Threat</span>
          </button>

          {/* Test Simulation trigger */}
          <button
            onClick={onTriggerSimulation}
            disabled={isSimulating}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-800 transition-colors"
            title="Simulate incoming sensor anomaly or civilian report"
          >
            <Radio className={`h-3 w-3 text-amber-400 ${isSimulating ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">Simulate Feed</span>
          </button>

          {/* Sound audio toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={soundEnabled ? 'Mute Alert Audio' : 'Enable Alert Audio'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* User Role Switcher Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs hover:border-slate-700 transition-colors">
              <div className="text-left hidden md:block">
                <p className="text-[11px] font-semibold text-slate-200 truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[9px] text-emerald-400 uppercase tracking-wider">{currentUser.role.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown list */}
            <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                Select Active Operator Role
              </div>
              {userProfiles.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between transition-colors ${
                    currentUser.id === user.id ? 'bg-slate-800/80 text-emerald-300' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role.replace('_', ' ')} · {user.organization}</p>
                  </div>
                  {currentUser.id === user.id && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
