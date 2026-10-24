import { BuildingData, CoinPickup, Landmark, RoadSegment } from '../types/game';

// City dimensions: 400m x 400m explorable sandbox
export const CITY_BOUNDS = {
  minX: -190,
  maxX: 190,
  minZ: -190,
  maxZ: 190,
};

// Landmarks with coordinates
export const LANDMARKS: Landmark[] = [
  {
    id: 'udit_tower',
    name: "Udit Grand Spire",
    x: 0,
    z: 0,
    description: 'The monumental centerpiece of the city featuring a 130m skyscraper and illuminated apex.',
  },
  {
    id: 'bay_marina',
    name: 'Coastline Bay Marina',
    x: 40,
    z: -150,
    description: 'Scenic ocean boulevard featuring harbor boardwalks, palm trees, and ocean views.',
  },
  {
    id: 'grand_park',
    name: 'Emerald City Park',
    x: 80,
    z: 70,
    description: 'Expansive recreational grounds with stone pathways, central fountain, and lush foliage.',
  },
  {
    id: 'sky_overpass',
    name: 'Neon Sky Bridge',
    x: -80,
    z: -50,
    description: 'High-speed elevated multi-lane highway overpass spanning across the district.',
  },
  {
    id: 'apex_plaza',
    name: 'Apex Motor Stadium',
    x: -110,
    z: 90,
    description: 'The high-octane motorsport plaza with open drift areas and stunt ramps.',
  },
];

// Roads grid
export const ROAD_SEGMENTS: RoadSegment[] = [
  // Major North-South Avenues
  { startX: 0, startZ: -180, endX: 0, endZ: 180, width: 14, lanes: 4 }, // Central Grand Ave
  { startX: -70, startZ: -180, endX: -70, endZ: 180, width: 12, lanes: 2 }, // West Boulevard
  { startX: 70, startZ: -180, endX: 70, endZ: 180, width: 12, lanes: 2 }, // East Boulevard
  { startX: -140, startZ: -160, endX: -140, endZ: 160, width: 10, lanes: 2 }, // Outer West
  { startX: 140, startZ: -160, endX: 140, endZ: 160, width: 10, lanes: 2 }, // Outer East

  // Major East-West Streets
  { startX: -180, startZ: 0, endX: 180, endZ: 0, width: 14, lanes: 4 }, // Central Cross St
  { startX: -180, startZ: -70, endX: 180, endZ: -70, width: 12, lanes: 2 }, // North Broadway
  { startX: -180, startZ: 70, endX: 180, endZ: 70, width: 12, lanes: 2 }, // South Way
  { startX: -160, startZ: -140, endX: 160, endZ: -140, width: 10, lanes: 2 }, // Marina Coastal Hwy
  { startX: -160, startZ: 140, endX: 160, endZ: 140, width: 10, lanes: 2 }, // South Ring

  // Diagonal / Connector Stunt Road
  { startX: -110, startZ: 90, endX: -70, endZ: 50, width: 10, lanes: 2 },
];

// Procedural buildings layout
export const BUILDINGS: BuildingData[] = [
  // Landmark: Udit Spire Center Block (x: 0, z: 0 has roads nearby, building at offset)
  { x: 30, z: 30, width: 28, depth: 28, height: 120, type: 'skyscraper', color: 0x1e293b, roofColor: 0x0ea5e9, neonColor: 0x00f0ff },
  { x: -30, z: 30, width: 24, depth: 26, height: 85, type: 'skyscraper', color: 0x334155, roofColor: 0x6366f1, neonColor: 0x818cf8 },
  { x: -30, z: -30, width: 26, depth: 24, height: 95, type: 'skyscraper', color: 0x0f172a, roofColor: 0xec4899, neonColor: 0xf43f5e },
  { x: 30, z: -30, width: 22, depth: 22, height: 75, type: 'commercial', color: 0x1e293b, roofColor: 0x10b981, neonColor: 0x34d399 },

  // Northwest District (High tech business & luxury lofts)
  { x: -105, z: -105, width: 26, depth: 28, height: 65, type: 'commercial', color: 0x1e293b, roofColor: 0x38bdf8 },
  { x: -105, z: -35, width: 24, depth: 22, height: 50, type: 'apartment', color: 0x475569, roofColor: 0xa855f7 },
  { x: -35, z: -105, width: 28, depth: 22, height: 70, type: 'commercial', color: 0x334155, roofColor: 0x06b6d4 },
  { x: -160, z: -105, width: 20, depth: 26, height: 42, type: 'apartment', color: 0x334155, roofColor: 0x94a3b8 },
  { x: -160, z: -35, width: 22, depth: 20, height: 35, type: 'commercial', color: 0x1e293b, roofColor: 0x3b82f6 },

  // Northeast District (Marina & Financial)
  { x: 105, z: -105, width: 28, depth: 24, height: 80, type: 'skyscraper', color: 0x0f172a, roofColor: 0x38bdf8, neonColor: 0x38bdf8 },
  { x: 105, z: -35, width: 24, depth: 26, height: 55, type: 'commercial', color: 0x1e293b, roofColor: 0xf59e0b },
  { x: 35, z: -105, width: 26, depth: 24, height: 60, type: 'apartment', color: 0x334155, roofColor: 0x10b981 },
  { x: 160, z: -105, width: 20, depth: 24, height: 38, type: 'commercial', color: 0x475569, roofColor: 0x64748b },
  { x: 160, z: -35, width: 22, depth: 26, height: 45, type: 'apartment', color: 0x1e293b, roofColor: 0xa855f7 },

  // Southwest District (Industrial & Stadium Area)
  { x: -160, z: 35, width: 24, depth: 26, height: 32, type: 'warehouse', color: 0x334155, roofColor: 0x64748b },
  { x: -160, z: 105, width: 22, depth: 24, height: 28, type: 'warehouse', color: 0x1e293b, roofColor: 0xef4444 },
  { x: -105, z: 35, width: 24, depth: 22, height: 45, type: 'commercial', color: 0x475569, roofColor: 0x06b6d4 },
  { x: -105, z: 140, width: 26, depth: 20, height: 35, type: 'apartment', color: 0x334155, roofColor: 0xf59e0b },
  { x: -35, z: 105, width: 26, depth: 24, height: 58, type: 'apartment', color: 0x1e293b, roofColor: 0x8b5cf6 },

  // Southeast District (Around Grand Park)
  { x: 35, z: 105, width: 26, depth: 24, height: 52, type: 'apartment', color: 0x334155, roofColor: 0x10b981 },
  { x: 105, z: 105, width: 24, depth: 24, height: 44, type: 'commercial', color: 0x1e293b, roofColor: 0x38bdf8 },
  { x: 105, z: 35, width: 24, depth: 20, height: 40, type: 'commercial', color: 0x475569, roofColor: 0xec4899 },
  { x: 160, z: 35, width: 22, depth: 24, height: 36, type: 'apartment', color: 0x334155, roofColor: 0x64748b },
  { x: 160, z: 105, width: 24, depth: 26, height: 48, type: 'commercial', color: 0x0f172a, roofColor: 0x00f0ff },
];

// Collectible coins placed throughout the city
export const INITIAL_COINS: CoinPickup[] = [
  // Central crossroads & alley treasures
  { id: 'c1', x: 0, y: 1.2, z: 20, collected: false },
  { id: 'c2', x: 20, y: 1.2, z: 0, collected: false },
  { id: 'c3', x: 0, y: 1.2, z: -20, collected: false },
  { id: 'c4', x: -20, y: 1.2, z: 0, collected: false },

  // Udit Spire plaza perimeter
  { id: 'c5', x: 48, y: 1.2, z: 48, collected: false },
  { id: 'c6', x: -48, y: 1.2, z: 48, collected: false },
  { id: 'c7', x: -48, y: 1.2, z: -48, collected: false },
  { id: 'c8', x: 48, y: 1.2, z: -48, collected: false },

  // Park greenery corners
  { id: 'c9', x: 80, y: 1.2, z: 60, collected: false },
  { id: 'c10', x: 95, y: 1.2, z: 75, collected: false },
  { id: 'c11', x: 65, y: 1.2, z: 80, collected: false },

  // Marina waterfront
  { id: 'c12', x: 30, y: 1.2, z: -140, collected: false },
  { id: 'c13', x: 60, y: 1.2, z: -140, collected: false },
  { id: 'c14', x: 90, y: 1.2, z: -140, collected: false },

  // Stadium & Drift Zone
  { id: 'c15', x: -110, y: 1.2, z: 90, collected: false },
  { id: 'c16', x: -125, y: 1.2, z: 105, collected: false },
  { id: 'c17', x: -95, y: 1.2, z: 75, collected: false },

  // Highway Overpass Ramp coins (elevated)
  { id: 'c18', x: -80, y: 3.5, z: -50, collected: false },
  { id: 'c19', x: -70, y: 4.8, z: -50, collected: false },
  { id: 'c20', x: -90, y: 2.2, z: -50, collected: false },

  // Outer corners
  { id: 'c21', x: 140, y: 1.2, z: 140, collected: false },
  { id: 'c22', x: -140, y: 1.2, z: -140, collected: false },
  { id: 'c23', x: 140, y: 1.2, z: -140, collected: false },
  { id: 'c24', x: -140, y: 1.2, z: 140, collected: false },
];

// Traffic circuit loops for AI vehicles
export interface TrafficRoute {
  waypoints: { x: number; z: number }[];
  laneOffset: number;
}

export const TRAFFIC_ROUTES: TrafficRoute[] = [
  // Outer Ring Clockwise
  {
    laneOffset: 2.5,
    waypoints: [
      { x: -140, z: -140 },
      { x: 140, z: -140 },
      { x: 140, z: 140 },
      { x: -140, z: 140 },
    ],
  },
  // Inner Core Boulevard Counter-Clockwise
  {
    laneOffset: -2.5,
    waypoints: [
      { x: -70, z: -70 },
      { x: -70, z: 70 },
      { x: 70, z: 70 },
      { x: 70, z: -70 },
    ],
  },
  // Grand Central Spine Cross
  {
    laneOffset: 3.0,
    waypoints: [
      { x: 0, z: -170 },
      { x: 0, z: 170 },
      { x: 140, z: 70 },
      { x: 140, z: -70 },
    ],
  },
];
