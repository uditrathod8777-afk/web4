import React from 'react';
import { X, Keyboard, Smartphone, Compass, Trophy } from 'lucide-react';
import { sound } from '../utils/audio';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide">How to Play</h2>
            <p className="text-xs text-slate-400 font-mono">DRIVER&apos;S MANUAL & VEHICLE CONTROLS</p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PC Keyboard Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-sky-400">
            <Keyboard className="w-4 h-4" /> PC Keyboard Controls
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
              <span className="text-slate-400">Accelerate / Throttle</span>
              <kbd className="px-2 py-1 bg-slate-700 rounded text-sky-300 font-bold border border-slate-600">W / ↑</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
              <span className="text-slate-400">Brake & Reverse</span>
              <kbd className="px-2 py-1 bg-slate-700 rounded text-rose-300 font-bold border border-slate-600">S / ↓</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
              <span className="text-slate-400">Steer Left / Right</span>
              <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-200 font-bold border border-slate-600">A / D or ← / →</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
              <span className="text-slate-400">Handbrake / Drift</span>
              <kbd className="px-2 py-1 bg-slate-700 rounded text-purple-300 font-bold border border-slate-600">Space</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
              <span className="text-slate-400">Switch Camera View</span>
              <kbd className="px-2 py-1 bg-slate-700 rounded text-emerald-300 font-bold border border-slate-600">C</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
              <span className="text-slate-400">Reset Car (Flip Upright)</span>
              <kbd className="px-2 py-1 bg-slate-700 rounded text-amber-300 font-bold border border-slate-600">R</kbd>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 col-span-2">
              <span className="text-slate-400">Orbit Camera Look</span>
              <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300 border border-slate-600">Click & Drag Mouse</kbd>
            </div>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <Smartphone className="w-4 h-4" /> Mobile & Touchscreen Controls
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p>• <strong>Left thumb:</strong> Hold the ◀ and ▶ buttons to steer.</p>
            <p>• <strong>Right thumb:</strong> Hold <strong>GAS</strong> to accelerate, <strong>BRAKE</strong> to slow down / reverse, and <strong>DRIFT</strong> to slide around corners.</p>
            <p>• On-screen icons allow quick camera toggles, vehicle reset, and pause anytime.</p>
          </div>
        </div>

        {/* Missions & City Features */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
            <Trophy className="w-4 h-4" /> Open World Objectives
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="font-bold text-white block mb-0.5">💰 Collect Hidden Coins</span>
              Grab golden spinning coins in alleys, plazas, and ramp tops to fund exotic vehicle purchases in the Garage.
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="font-bold text-white block mb-0.5">🏁 Complete Missions</span>
              Challenge Checkpoint Races, Rush Hour Time Trials, and the Landmark Grand Tour for huge cash rewards.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide transition cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
