import React from 'react';
import { Camera, RotateCcw, Pause, Sun, Moon, Sunset, Coins, Trophy, Flag, AlertCircle } from 'lucide-react';
import { MiniMap } from './MiniMap';
import { GameWorld } from '../game/GameWorld';
import { Mission, TimeOfDay } from '../types/game';

interface GameHUDProps {
  speedKmh: number;
  rpm: number;
  gear: number;
  driftScore: number;
  coins: number;
  activeMission: Mission | null;
  checkpointProgress: { current: number; total: number };
  missionTimeRemaining: number;
  recentLandmark: string | null;
  timeOfDay: TimeOfDay;
  gameWorld: GameWorld | null;
  onPause: () => void;
  onResetCar: () => void;
  onToggleCamera: () => void;
  onToggleTimeOfDay: () => void;
  onAbortMission: () => void;
  onMobileInput: (control: 'forward' | 'backward' | 'left' | 'right' | 'handbrake', value: boolean) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  speedKmh,
  rpm,
  gear,
  driftScore,
  coins,
  activeMission,
  checkpointProgress,
  missionTimeRemaining,
  recentLandmark,
  timeOfDay,
  gameWorld,
  onPause,
  onResetCar,
  onToggleCamera,
  onToggleTimeOfDay,
  onAbortMission,
  onMobileInput,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 overflow-hidden z-20">
      {/* TOP BAR */}
      <div className="flex items-start justify-between w-full pointer-events-auto">
        {/* Quick controls group */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
          <button
            onClick={onPause}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Pause Game (Esc)"
          >
            <Pause className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Pause</span>
          </button>
          <button
            onClick={onResetCar}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Reset Car Position (R)"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onToggleCamera}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Switch Camera View (C)"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Cam</span>
          </button>
          <button
            onClick={onToggleTimeOfDay}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Toggle Day/Sunset/Night"
          >
            {timeOfDay === 'night' && <Moon className="w-4 h-4 text-indigo-400" />}
            {timeOfDay === 'sunset' && <Sunset className="w-4 h-4 text-orange-400" />}
            {timeOfDay === 'day' && <Sun className="w-4 h-4 text-yellow-400" />}
            <span className="hidden sm:inline capitalize">{timeOfDay}</span>
          </button>
        </div>

        {/* Center: Mission tracker or Landmark banner */}
        <div className="flex flex-col items-center gap-2 max-w-sm text-center">
          {recentLandmark && (
            <div className="animate-bounce bg-gradient-to-r from-cyan-900/90 to-blue-900/90 border border-cyan-400/80 px-4 py-2 rounded-xl shadow-xl">
              <span className="text-[10px] tracking-widest text-cyan-300 uppercase font-mono block">Landmark Discovered</span>
              <span className="text-sm font-bold text-white tracking-wide">{recentLandmark}</span>
            </div>
          )}

          {activeMission && (
            <div className="bg-slate-950/90 border border-sky-500/50 rounded-2xl p-3 shadow-2xl min-w-[240px]">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white truncate max-w-[150px]">{activeMission.title}</span>
                </div>
                <button
                  onClick={onAbortMission}
                  className="text-[10px] text-red-400 hover:text-red-300 hover:underline px-1 py-0.5 rounded"
                >
                  Abort
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">
                  Gate: <strong className="text-sky-300">{checkpointProgress.current + 1}</strong> / {checkpointProgress.total}
                </span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  missionTimeRemaining < 10 ? 'bg-red-950 text-red-400 animate-pulse border border-red-500' : 'text-amber-400 bg-amber-950/60 border border-amber-600/40'
                }`}>
                  ⏱ {missionTimeRemaining.toFixed(1)}s
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Coin Balance & Drift Score */}
        <div className="flex flex-col items-end gap-2">
          <div className="bg-slate-900/85 border border-amber-500/40 px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-mono font-extrabold text-amber-300 text-sm tracking-wider">
              {coins.toLocaleString()}
            </span>
          </div>

          {driftScore > 0 && (
            <div className="bg-fuchsia-950/80 border border-fuchsia-500/50 px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-fuchsia-300 uppercase tracking-widest font-bold">DRIFT</span>
              <span className="font-mono text-xs font-extrabold text-white">+{driftScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Speedometer, Minimap, and Mobile Controls */}
      <div className="flex items-end justify-between w-full mt-auto">
        {/* Left: MiniMap & Controls Help */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <MiniMap gameWorld={gameWorld} />

          {/* Desktop quick keys info pill */}
          <div className="hidden md:flex items-center gap-2 bg-slate-950/70 border border-slate-800 text-[10px] font-mono text-slate-400 px-3 py-1 rounded-full">
            <span>WASD / Arrows: Drive</span>
            <span>•</span>
            <span>Space: Drift</span>
            <span>•</span>
            <span>C: Cam</span>
            <span>•</span>
            <span>R: Reset</span>
          </div>
        </div>

        {/* Center: Digital Dashboard & Tachometer */}
        <div className="flex flex-col items-center pointer-events-auto bg-slate-950/85 border border-sky-500/30 rounded-2xl px-5 py-3 shadow-2xl mb-1">
          {/* RPM Bar */}
          <div className="w-36 sm:w-48 h-2 bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-700">
            <div
              className={`h-full transition-all duration-75 ${
                rpm > 0.85 ? 'bg-gradient-to-r from-yellow-400 to-red-500' : 'bg-gradient-to-r from-sky-400 to-cyan-300'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, rpm * 100))}%` }}
            />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">
              {speedKmh}
            </span>
            <span className="text-xs font-mono font-bold text-sky-400 tracking-wider">KM/H</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-400">
            <span>GEAR <strong className="text-sky-300 text-xs">{gear}</strong></span>
            <span>•</span>
            <span className={speedKmh > 120 ? 'text-amber-400 font-bold' : ''}>TURBO ACTIVE</span>
          </div>
        </div>

        {/* Mobile Touch Controls Overlay (visible on mobile / touch screen) */}
        <div className="flex sm:hidden fixed bottom-4 inset-x-4 pointer-events-auto justify-between items-end gap-2">
          {/* Steer Left / Right */}
          <div className="flex gap-2">
            <button
              onPointerDown={() => onMobileInput('left', true)}
              onPointerUp={() => onMobileInput('left', false)}
              onPointerLeave={() => onMobileInput('left', false)}
              className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-sky-600 border border-slate-700 active:border-sky-400 text-white font-bold text-xl flex items-center justify-center shadow-2xl active:scale-95 touch-none"
            >
              ◀
            </button>
            <button
              onPointerDown={() => onMobileInput('right', true)}
              onPointerUp={() => onMobileInput('right', false)}
              onPointerLeave={() => onMobileInput('right', false)}
              className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-sky-600 border border-slate-700 active:border-sky-400 text-white font-bold text-xl flex items-center justify-center shadow-2xl active:scale-95 touch-none"
            >
              ▶
            </button>
          </div>

          {/* Handbrake, Reverse, Throttle */}
          <div className="flex gap-2 items-end">
            <button
              onPointerDown={() => onMobileInput('handbrake', true)}
              onPointerUp={() => onMobileInput('handbrake', false)}
              onPointerLeave={() => onMobileInput('handbrake', false)}
              className="w-12 h-12 rounded-xl bg-purple-900/80 active:bg-purple-600 border border-purple-500 text-purple-200 text-xs font-bold flex items-center justify-center shadow-lg active:scale-95 touch-none"
            >
              DRIFT
            </button>
            <button
              onPointerDown={() => onMobileInput('backward', true)}
              onPointerUp={() => onMobileInput('backward', false)}
              onPointerLeave={() => onMobileInput('backward', false)}
              className="w-14 h-14 rounded-2xl bg-rose-950/80 active:bg-rose-600 border border-rose-600 text-rose-200 font-bold text-sm flex items-center justify-center shadow-xl active:scale-95 touch-none"
            >
              BRAKE
            </button>
            <button
              onPointerDown={() => onMobileInput('forward', true)}
              onPointerUp={() => onMobileInput('forward', false)}
              onPointerLeave={() => onMobileInput('forward', false)}
              className="w-16 h-20 rounded-2xl bg-emerald-600 active:bg-emerald-500 border border-emerald-400 text-white font-black text-lg flex items-center justify-center shadow-2xl active:scale-95 touch-none"
            >
              GAS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
