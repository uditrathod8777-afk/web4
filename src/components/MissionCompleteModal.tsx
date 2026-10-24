import React from 'react';
import { Trophy, AlertCircle, Coins, RotateCcw, ArrowRight, Home } from 'lucide-react';
import { Mission } from '../types/game';
import { sound } from '../utils/audio';

interface MissionCompleteModalProps {
  mission: Mission;
  success: boolean;
  onRetry: () => void;
  onContinueDriving: () => void;
  onReturnToMainMenu: () => void;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  mission,
  success,
  onRetry,
  onContinueDriving,
  onReturnToMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-center space-y-6">
        {/* Banner */}
        <div className="flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              success
                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                : 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
            }`}
          >
            {success ? <Trophy className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>

          <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-bold">
            {mission.title}
          </span>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">
            {success ? 'MISSION COMPLETE!' : 'TIME EXPIRED'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {success
              ? 'Outstanding driving! You nailed every checkpoint and dominated the course.'
              : 'You ran out of time before reaching all checkpoints. Try again!'}
          </p>
        </div>

        {/* Reward Box */}
        {success && (
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              <Coins className="w-6 h-6 text-yellow-400" />
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">REWARD EARNED</span>
                <span className="text-sm font-bold text-white">Cash Bonus</span>
              </div>
            </div>
            <span className="font-mono text-2xl font-black text-amber-300">+{mission.rewardCoins}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          {success ? (
            <button
              onClick={() => {
                sound.playClick();
                onContinueDriving();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider transition shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              Continue Free Roam <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onRetry();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wider transition shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onReturnToMainMenu();
            }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wide transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-400" /> Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
