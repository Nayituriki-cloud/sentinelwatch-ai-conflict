import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';
import { Incident } from '../types';

interface TimelineScrubberProps {
  incidents: Incident[];
  currentHourOffset: number; // 0 = now, -1 = 1 hr ago, -6 = 6 hrs ago, etc.
  onChangeHourOffset: (offset: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  incidents,
  currentHourOffset,
  onChangeHourOffset,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onChangeHourOffset(currentHourOffset >= 0 ? -12 : currentHourOffset + 1);
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentHourOffset, onChangeHourOffset]);

  const timeLabel =
    currentHourOffset === 0
      ? 'Live Telemetry (Real-Time)'
      : `${Math.abs(currentHourOffset)} hours ago`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-lg">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 flex items-center justify-center transition-colors"
          title={isPlaying ? 'Pause Timeline' : 'Play Timeline Progression'}
        >
          {isPlaying ? <Pause className="h-4 w-4 text-amber-400" /> : <Play className="h-4 w-4 text-emerald-400" />}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onChangeHourOffset(0);
          }}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="Jump to Real-Time"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 font-medium text-slate-200">
          <Clock className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-mono text-xs">{timeLabel}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="flex-1 max-w-md w-full flex items-center gap-2">
        <span className="text-[10px] text-slate-500 font-mono">-12h</span>
        <input
          type="range"
          min="-12"
          max="0"
          step="1"
          value={currentHourOffset}
          onChange={(e) => {
            setIsPlaying(false);
            onChangeHourOffset(Number(e.target.value));
          }}
          className="w-full accent-emerald-500"
        />
        <span className="text-[10px] text-emerald-400 font-mono font-bold">NOW</span>
      </div>

      {/* Timeline active events summary */}
      <div className="text-[11px] text-slate-400 font-mono hidden md:block">
        Playback window: Last 12h
      </div>
    </div>
  );
};
