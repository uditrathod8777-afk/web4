import React, { useState } from 'react';
import { Play, RotateCcw, Home, Settings, Wrench, Flag, CheckCircle, Clock } from 'lucide-react';
import { MISSIONS } from '../game/missions';
import { Mission } from '../types/game';
import { sound } from '../utils/audio';

interface PauseMenuProps {
  activeMission: Mission | null;
  completedMissionIds: string[];
  onResume: () => void;
  onRestartMission: () => void;
  onStartMission: (mission: Mission) => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onReturnToMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  activeMission,
  completedMissionIds,
  onResume,
  onRestartMission,
  onStartMission,
  onOpenGarage,
  onOpenSettings,
  onReturnToMainMenu,
}) => {
  const [tab, setTab] = useState<'main' | 'missions'>('main');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-sky-400 uppercase">Game Suspended</span>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">PAUSED</h2>
        </div>

        {tab === 'main' ? (
          <div className="space-y-3">
            <button
              onClick={() => {
                sound.playClick();
                onResume();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider transition shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Resume Driving
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setTab('missions');
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm uppercase tracking-wide transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Flag className="w-4 h-4 text-sky-400" />
              {activeMission ? 'Change Mission' : 'Select Mission'}
            </button>

            {activeMission && (
              <button
                onClick={() => {
                  sound.playClick();
                  onRestartMission();
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-bold text-sm uppercase tracking-wide transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" /> Restart Current Mission
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onOpenGarage();
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-purple-500/40 text-purple-300 font-bold text-sm uppercase tracking-wide transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Wrench className="w-4 h-4 text-purple-400" /> Vehicle Garage
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenSettings();
              }}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm uppercase tracking-wide transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4 text-slate-400" /> Settings
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onReturnToMainMenu();
              }}
              className="w-full py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/40 text-rose-300 font-bold text-sm uppercase tracking-wide transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <Home className="w-4 h-4 text-rose-400" /> Main Menu
            </button>
          </div>
        ) : (
          /* Missions Selection View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-sky-400 uppercase font-bold">Select Active Mission</span>
              <button
                onClick={() => {
                  sound.playClick();
                  setTab('main');
                }}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Back
              </button>
            </div>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
              {MISSIONS.map((m) => {
                const isCompleted = completedMissionIds.includes(m.id);
                const isCurrent = activeMission?.id === m.id;
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-sky-950/70 border-sky-400'
                        : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        {m.title}
                        {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">+{m.rewardCoins} Coins</span>
                    </div>

                    <p className="text-xs text-slate-400 mb-3">{m.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {m.timeLimitSec}s limit
                      </span>
                      <button
                        onClick={() => {
                          sound.playClick();
                          onStartMission(m);
                          onResume();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wide cursor-pointer active:scale-95 transition"
                      >
                        {isCurrent ? 'Restart' : 'Start'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
