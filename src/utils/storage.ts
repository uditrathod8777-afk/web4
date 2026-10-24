import { GameSettings, PlayerProgress } from '../types/game';

const PROGRESS_KEY = 'udits_open_world_progress_v1';
const SETTINGS_KEY = 'udits_open_world_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  masterVolume: 0.75,
  engineVolume: 0.7,
  sfxVolume: 0.8,
  graphicsQuality: 'high',
  timeOfDay: 'day',
  cameraDistance: 7.5,
  cameraFov: 65,
};

export const DEFAULT_PROGRESS: PlayerProgress = {
  coins: 250, // Starting bonus so player has some coins to customize or save up
  selectedCarId: 'apex_gt',
  selectedColor: '#00f0ff',
  unlockedCarIds: ['apex_gt'],
  completedMissionIds: [],
  bestTimes: {},
  landmarksDiscovered: [],
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      unlockedCarIds: Array.isArray(parsed.unlockedCarIds) ? parsed.unlockedCarIds : DEFAULT_PROGRESS.unlockedCarIds,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}
