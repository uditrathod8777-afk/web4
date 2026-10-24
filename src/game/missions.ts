import { Mission } from '../types/game';

export const MISSIONS: Mission[] = [
  {
    id: 'mission_checkpoint_sprint',
    title: 'Neon Checkpoint Sprint',
    type: 'checkpoint_race',
    description: 'Race through 7 glowing holographic gates scattered across the downtown grid before the clock runs out.',
    rewardCoins: 250,
    timeLimitSec: 65,
    startPosition: [0, 0.4, 25],
    startRotation: Math.PI,
    checkpoints: [
      { x: 0, z: -35, radius: 6.5, label: 'Gate 1/7' },
      { x: -35, z: -70, radius: 6.5, label: 'Gate 2/7' },
      { x: -70, z: 0, radius: 6.5, label: 'Gate 3/7' },
      { x: -70, z: 70, radius: 6.5, label: 'Gate 4/7' },
      { x: 0, z: 70, radius: 6.5, label: 'Gate 5/7' },
      { x: 70, z: 35, radius: 6.5, label: 'Gate 6/7' },
      { x: 0, z: 0, radius: 7.0, label: 'Finish Gate' },
    ],
  },
  {
    id: 'mission_rush_hour_trial',
    title: 'Rush Hour Time Trial',
    type: 'time_trial',
    description: 'High-speed coastal dash from downtown Udit Tower straight to the Bay Marina Pier through heavy traffic!',
    rewardCoins: 350,
    timeLimitSec: 42,
    startPosition: [0, 0.4, 10],
    startRotation: 0,
    checkpoints: [
      { x: 0, z: -70, radius: 7.0, label: 'Sector 1' },
      { x: 40, z: -110, radius: 7.0, label: 'Sector 2' },
      { x: 40, z: -150, radius: 8.0, label: 'Marina Pier Goal' },
    ],
  },
  {
    id: 'mission_landmark_tour',
    title: 'Landmark Grand Tour',
    type: 'city_explorer',
    description: 'Explore the city by visiting 4 major metropolitan landmarks: Sky Bridge, Apex Stadium, Emerald Park, and Grand Spire.',
    rewardCoins: 500,
    timeLimitSec: 95,
    startPosition: [0, 0.4, 0],
    startRotation: -Math.PI / 2,
    checkpoints: [
      { x: -80, z: -50, radius: 8.5, label: 'Neon Sky Bridge' },
      { x: -110, z: 90, radius: 8.5, label: 'Apex Motor Stadium' },
      { x: 80, z: 70, radius: 8.5, label: 'Emerald City Park' },
      { x: 0, z: 0, radius: 9.0, label: 'Udit Grand Spire' },
    ],
  },
];
