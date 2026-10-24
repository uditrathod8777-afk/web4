import React from 'react';
import { X, Volume2, VolumeX, Monitor, Sun, Moon, Sunset, Sliders } from 'lucide-react';
import { GameSettings, GraphicsQuality, TimeOfDay } from '../types/game';
import { sound } from '../utils/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings, onClose }) => {
  const handleVolumeChange = (type: 'master' | 'engine' | 'sfx', val: number) => {
    const updated = {
      ...settings,
      [`${type}Volume`]: val,
    };
    onUpdateSettings(updated);
    sound.setVolumes(
      type === 'master' ? val : settings.masterVolume,
      type === 'engine' ? val : settings.engineVolume,
      type === 'sfx' ? val : settings.sfxVolume,
      !settings.soundEnabled
    );
  };

  const handleMuteToggle = () => {
    const newSoundEnabled = !settings.soundEnabled;
    const updated = { ...settings, soundEnabled: newSoundEnabled };
    onUpdateSettings(updated);
    sound.setVolumes(settings.masterVolume, settings.engineVolume, settings.sfxVolume, !newSoundEnabled);
  };

  const handleGraphicsChange = (q: GraphicsQuality) => {
    sound.playClick();
    onUpdateSettings({ ...settings, graphicsQuality: q });
  };

  const handleTimeChange = (t: TimeOfDay) => {
    sound.playClick();
    onUpdateSettings({ ...settings, timeOfDay: t });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-wide">Game Settings</h2>
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

        {/* Audio Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              Audio Synthesis
            </span>
            <button
              onClick={handleMuteToggle}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition ${
                settings.soundEnabled ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
              }`}
            >
              {settings.soundEnabled ? 'MUTED: OFF' : 'MUTED: ON'}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Master Volume</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Engine Pitch & Rumble</span>
                <span>{Math.round(settings.engineVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.engineVolume}
                onChange={(e) => handleVolumeChange('engine', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Sound FX (Skid, Impact, Chimes)</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Graphics Preset */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-sky-400" /> Graphics Quality
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => handleGraphicsChange(q)}
                className={`py-2 rounded-xl text-xs font-mono uppercase font-bold border transition cursor-pointer ${
                  settings.graphicsQuality === q
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Time of Day */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
            Lighting Ambience
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleTimeChange('day')}
              className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                settings.timeOfDay === 'day'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-yellow-400" /> Day
            </button>
            <button
              onClick={() => handleTimeChange('sunset')}
              className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                settings.timeOfDay === 'sunset'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-400'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700'
              }`}
            >
              <Sunset className="w-3.5 h-3.5 text-orange-400" /> Sunset
            </button>
            <button
              onClick={() => handleTimeChange('night')}
              className={`py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                settings.timeOfDay === 'night'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-purple-400" /> Night
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm tracking-wide transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
