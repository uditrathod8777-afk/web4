export type GameState = 'menu' | 'playing' | 'garage' | 'settings' | 'paused';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  soundEnabled: boolean;
  masterVolume: number;
  engineVolume: number;
  sfxVolume: number;
  graphicsQuality: GraphicsQuality;
  timeOfDay: TimeOfDay;
  cameraDistance: number;
  cameraFov: number;
}

export interface VehicleSpec {
  id: string;
  name: string;
  category: string;
  price: number;
  topSpeedKmh: number;
  acceleration: number; // 0 - 100 scale
  handling: number;     // 0 - 100 scale
  braking: number;      // 0 - 100 scale
  bodyColor: string;
  availableColors: string[];
  description: string;
}

export interface PlayerProgress {
  coins: number;
  selectedCarId: string;
  selectedColor: string;
  unlockedCarIds: string[];
  completedMissionIds: string[];
  bestTimes: Record<string, number>;
  landmarksDiscovered: string[];
}

export interface MissionCheckpoint {
  x: number;
  z: number;
  radius: number;
  label?: string;
}

export type MissionType = 'checkpoint_race' | 'time_trial' | 'city_explorer';

export interface Mission {
  id: string;
  title: string;
  type: MissionType;
  description: string;
  rewardCoins: number;
  timeLimitSec: number;
  checkpoints: MissionCheckpoint[];
  startPosition: [number, number, number];
  startRotation: number;
}

export interface Landmark {
  id: string;
  name: string;
  x: number;
  z: number;
  description: string;
}

export interface RoadSegment {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  width: number;
  lanes: number;
}

export interface BuildingData {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  type: 'skyscraper' | 'commercial' | 'apartment' | 'warehouse';
  color: number;
  roofColor: number;
  neonColor?: number;
}

export interface CoinPickup {
  id: string;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface TrafficCarData {
  id: number;
  routeIndex: number;
  progress: number;
  speed: number;
  maxSpeed: number;
  color: number;
  width: number;
  length: number;
  x: number;
  z: number;
  rotation: number;
}
