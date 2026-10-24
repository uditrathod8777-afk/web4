import * as THREE from 'three';
import { VehicleSpec } from '../types/game';

export const VEHICLE_LIST: VehicleSpec[] = [
  {
    id: 'apex_gt',
    name: 'Apex GT',
    category: 'Sports Coupe',
    price: 0,
    topSpeedKmh: 185,
    acceleration: 75,
    handling: 80,
    braking: 80,
    bodyColor: '#00f0ff',
    availableColors: ['#00f0ff', '#a855f7', '#ef4444', '#f59e0b', '#10b981', '#1e293b'],
    description: 'A nimble twin-turbo sports coupe with responsive rack-and-pinion steering and excellent balance.',
  },
  {
    id: 'viper_srt',
    name: 'Viper Phantom',
    category: 'Supercar',
    price: 500,
    topSpeedKmh: 230,
    acceleration: 92,
    handling: 85,
    braking: 88,
    bodyColor: '#a855f7',
    availableColors: ['#a855f7', '#ec4899', '#f43f5e', '#3b82f6', '#fbbf24', '#0f172a'],
    description: 'An aggressive track-tuned exotic boasting aerodynamic carbon diffusers and blisteringly high top speed.',
  },
  {
    id: 'cyber_rover',
    name: 'Cyber Rover',
    category: 'Armored SUV',
    price: 1000,
    topSpeedKmh: 165,
    acceleration: 70,
    handling: 68,
    braking: 75,
    bodyColor: '#f59e0b',
    availableColors: ['#f59e0b', '#84cc16', '#06b6d4', '#64748b', '#dc2626', '#18181b'],
    description: 'A reinforced urban off-road vehicle with elevated suspension, extreme durability, and heavy pushing power.',
  },
  {
    id: 'formula_neon',
    name: 'Formula Neon X',
    category: 'Hypercar',
    price: 2000,
    topSpeedKmh: 275,
    acceleration: 98,
    handling: 96,
    braking: 95,
    bodyColor: '#10b981',
    availableColors: ['#10b981', '#00f0ff', '#e11d48', '#8b5cf6', '#eab308', '#09090b'],
    description: 'Ultra-lightweight open-cockpit hypercar engineered for extreme downforce and hairpin drift precision.',
  },
];

export interface CarMeshes {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  bodyMaterial: THREE.MeshStandardMaterial;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  headlightL: THREE.Mesh;
  headlightR: THREE.Mesh;
  brakeLightL: THREE.Mesh;
  brakeLightR: THREE.Mesh;
  brakeMaterial: THREE.MeshStandardMaterial;
  headlightMaterial: THREE.MeshStandardMaterial;
  leftHeadlightLight?: THREE.SpotLight;
  rightHeadlightLight?: THREE.SpotLight;
  exhaustParticles?: THREE.Points;
}

// Helper to create a multi-piece tire and rim
function createWheel(isFront: boolean): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber tire
  const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.28, 24);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.85,
    metalness: 0.1,
  });
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  wheelGroup.add(tireMesh);

  // Rim outer ring
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.29, 16);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    metalness: 0.85,
    roughness: 0.2,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rimMesh);

  // Spokes
  const spokeGeo = new THREE.BoxGeometry(0.04, 0.38, 0.3);
  const spokeMesh1 = new THREE.Mesh(spokeGeo, rimMat);
  const spokeMesh2 = new THREE.Mesh(spokeGeo, rimMat);
  spokeMesh2.rotateX(Math.PI / 2);
  wheelGroup.add(spokeMesh1);
  wheelGroup.add(spokeMesh2);

  // Brake disc
  const discGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16);
  discGeo.rotateZ(Math.PI / 2);
  const discMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.9, roughness: 0.3 });
  const disc = new THREE.Mesh(discGeo, discMat);
  wheelGroup.add(disc);

  // Caliper (bright neon or red)
  const caliperGeo = new THREE.BoxGeometry(0.06, 0.1, 0.08);
  const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.5 });
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0, 0.12, 0);
  wheelGroup.add(caliper);

  return wheelGroup;
}

export function buildCarModel(vehicleId: string, colorHex: string, withSpotlights = true): CarMeshes {
  const root = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    metalness: 0.65,
    roughness: 0.25,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x111827,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.7,
    metalness: 0.3,
  });

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.2,
  });

  const brakeMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d,
    emissive: 0xef4444,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.1,
  });

  let bodyMesh: THREE.Mesh;
  const wheelBase = { x: 0.88, frontZ: 1.35, rearZ: -1.35, y: 0.36 };

  if (vehicleId === 'formula_neon') {
    // Open cockpit hypercar
    const mainBodyGeo = new THREE.BoxGeometry(1.2, 0.42, 4.4);
    bodyMesh = new THREE.Mesh(mainBodyGeo, bodyMaterial);
    bodyMesh.position.y = 0.42;
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // Front nose cone (tapered)
    const noseGeo = new THREE.ConeGeometry(0.48, 1.2, 4);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, bodyMaterial);
    nose.position.set(0, 0.4, 2.5);
    nose.castShadow = true;
    root.add(nose);

    // Front wing
    const fWingGeo = new THREE.BoxGeometry(1.9, 0.06, 0.4);
    const fWing = new THREE.Mesh(fWingGeo, trimMaterial);
    fWing.position.set(0, 0.22, 2.4);
    fWing.castShadow = true;
    root.add(fWing);

    // Rear wing
    const rWingGeo = new THREE.BoxGeometry(1.8, 0.08, 0.45);
    const rWing = new THREE.Mesh(rWingGeo, bodyMaterial);
    rWing.position.set(0, 1.05, -2.1);
    rWing.castShadow = true;
    root.add(rWing);

    // Wing struts
    const strutGeo = new THREE.BoxGeometry(0.06, 0.5, 0.1);
    const strutL = new THREE.Mesh(strutGeo, trimMaterial);
    strutL.position.set(-0.4, 0.75, -2.05);
    const strutR = new THREE.Mesh(strutGeo, trimMaterial);
    strutR.position.set(0.4, 0.75, -2.05);
    root.add(strutL);
    root.add(strutR);

    // Halo cockpit bar
    const haloGeo = new THREE.TorusGeometry(0.3, 0.04, 8, 16, Math.PI);
    haloGeo.rotateX(Math.PI / 2);
    const halo = new THREE.Mesh(haloGeo, trimMaterial);
    halo.position.set(0, 0.8, 0.1);
    root.add(halo);

    wheelBase.x = 0.98;
    wheelBase.frontZ = 1.6;
    wheelBase.rearZ = -1.5;
  } else if (vehicleId === 'cyber_rover') {
    // Robust high SUV
    const lowerBodyGeo = new THREE.BoxGeometry(1.95, 0.7, 4.4);
    bodyMesh = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
    bodyMesh.position.y = 0.7;
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.8, 2.6);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(0, 1.4, -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    // Large windshield & windows
    const windshieldGeo = new THREE.BoxGeometry(1.64, 0.72, 0.06);
    windshieldGeo.rotateX(0.25);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0, 1.42, 1.15);
    root.add(windshield);

    // Roof rack
    const rackGeo = new THREE.BoxGeometry(1.5, 0.08, 2.2);
    const rack = new THREE.Mesh(rackGeo, trimMaterial);
    rack.position.set(0, 1.84, -0.2);
    root.add(rack);

    // Bull bar bumper
    const barGeo = new THREE.BoxGeometry(1.85, 0.35, 0.2);
    const bullBar = new THREE.Mesh(barGeo, trimMaterial);
    bullBar.position.set(0, 0.55, 2.25);
    root.add(bullBar);

    wheelBase.x = 1.05;
    wheelBase.y = 0.46;
    wheelBase.frontZ = 1.4;
    wheelBase.rearZ = -1.4;
  } else if (vehicleId === 'viper_srt') {
    // Low aggressive exotic supercar
    const lowerBodyGeo = new THREE.BoxGeometry(1.92, 0.46, 4.5);
    bodyMesh = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
    bodyMesh.position.y = 0.45;
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // Sleek cockpit dome
    const cabinGeo = new THREE.BoxGeometry(1.48, 0.44, 2.1);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(0, 0.85, -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    // Raked aerodynamic windshield
    const windshieldGeo = new THREE.BoxGeometry(1.44, 0.5, 0.05);
    windshieldGeo.rotateX(0.48);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0, 0.85, 0.95);
    root.add(windshield);

    // Rear diffuser & huge carbon spoiler
    const spoilerGeo = new THREE.BoxGeometry(1.8, 0.06, 0.35);
    const spoiler = new THREE.Mesh(spoilerGeo, trimMaterial);
    spoiler.position.set(0, 0.95, -2.1);
    spoiler.castShadow = true;
    root.add(spoiler);

    const spoilerLegL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.08), trimMaterial);
    spoilerLegL.position.set(-0.5, 0.78, -2.1);
    const spoilerLegR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.08), trimMaterial);
    spoilerLegR.position.set(0.5, 0.78, -2.1);
    root.add(spoilerLegL);
    root.add(spoilerLegR);

    wheelBase.x = 0.94;
    wheelBase.frontZ = 1.45;
    wheelBase.rearZ = -1.45;
  } else {
    // Default Apex GT Sports Coupe
    const lowerBodyGeo = new THREE.BoxGeometry(1.85, 0.52, 4.3);
    bodyMesh = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
    bodyMesh.position.y = 0.5;
    bodyMesh.castShadow = true;
    root.add(bodyMesh);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.52, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(0, 0.95, -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(1.44, 0.5, 0.04);
    windshieldGeo.rotateX(0.35);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0, 0.95, 0.95);
    root.add(windshield);

    // Rear window
    const rearWindowGeo = new THREE.BoxGeometry(1.4, 0.44, 0.04);
    rearWindowGeo.rotateX(-0.4);
    const rearWindow = new THREE.Mesh(rearWindowGeo, glassMaterial);
    rearWindow.position.set(0, 0.95, -1.35);
    root.add(rearWindow);

    // Side windows
    const sideWinGeo = new THREE.BoxGeometry(0.04, 0.4, 1.6);
    const sideWinL = new THREE.Mesh(sideWinGeo, glassMaterial);
    sideWinL.position.set(-0.76, 0.95, -0.2);
    const sideWinR = new THREE.Mesh(sideWinGeo, glassMaterial);
    sideWinR.position.set(0.76, 0.95, -0.2);
    root.add(sideWinL);
    root.add(sideWinR);

    // Trunk Lip Spoiler
    const lipGeo = new THREE.BoxGeometry(1.6, 0.08, 0.15);
    const lip = new THREE.Mesh(lipGeo, trimMaterial);
    lip.position.set(0, 0.8, -2.12);
    root.add(lip);
  }

  // Underbody chassis plate (black)
  const chassisGeo = new THREE.BoxGeometry(1.7, 0.12, 4.0);
  const chassis = new THREE.Mesh(chassisGeo, trimMaterial);
  chassis.position.y = wheelBase.y - 0.1;
  root.add(chassis);

  // Wheels
  const frontLeftWheel = createWheel(true);
  frontLeftWheel.position.set(-wheelBase.x, wheelBase.y, wheelBase.frontZ);
  root.add(frontLeftWheel);

  const frontRightWheel = createWheel(true);
  frontRightWheel.position.set(wheelBase.x, wheelBase.y, wheelBase.frontZ);
  root.add(frontRightWheel);

  const rearLeftWheel = createWheel(false);
  rearLeftWheel.position.set(-wheelBase.x, wheelBase.y, wheelBase.rearZ);
  root.add(rearLeftWheel);

  const rearRightWheel = createWheel(false);
  rearRightWheel.position.set(wheelBase.x, wheelBase.y, wheelBase.rearZ);
  root.add(rearRightWheel);

  // Headlights
  const headlightGeo = new THREE.BoxGeometry(0.32, 0.12, 0.05);
  const headlightL = new THREE.Mesh(headlightGeo, headlightMaterial);
  headlightL.position.set(-0.65, bodyMesh.position.y + 0.08, 2.15);
  const headlightR = new THREE.Mesh(headlightGeo, headlightMaterial);
  headlightR.position.set(0.65, bodyMesh.position.y + 0.08, 2.15);
  root.add(headlightL);
  root.add(headlightR);

  // Brake / Tail lights
  const brakeGeo = new THREE.BoxGeometry(0.35, 0.12, 0.05);
  const brakeLightL = new THREE.Mesh(brakeGeo, brakeMaterial);
  brakeLightL.position.set(-0.65, bodyMesh.position.y + 0.08, -2.15);
  const brakeLightR = new THREE.Mesh(brakeGeo, brakeMaterial);
  brakeLightR.position.set(0.65, bodyMesh.position.y + 0.08, -2.15);
  root.add(brakeLightL);
  root.add(brakeLightR);

  // Twin Exhaust Pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12);
  exhaustGeo.rotateX(Math.PI / 2);
  const exhaustL = new THREE.Mesh(exhaustGeo, trimMaterial);
  exhaustL.position.set(-0.35, 0.25, -2.15);
  const exhaustR = new THREE.Mesh(exhaustGeo, trimMaterial);
  exhaustR.position.set(0.35, 0.25, -2.15);
  root.add(exhaustL);
  root.add(exhaustR);

  // Optional Forward Spotlights (headlight beam in night / dusk)
  let leftHeadlightLight: THREE.SpotLight | undefined;
  let rightHeadlightLight: THREE.SpotLight | undefined;

  if (withSpotlights) {
    leftHeadlightLight = new THREE.SpotLight(0xffffff, 2.5, 38, Math.PI / 6, 0.35, 1.2);
    leftHeadlightLight.position.set(-0.65, bodyMesh.position.y + 0.08, 2.2);
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.65, 0, 18);
    root.add(targetL);
    leftHeadlightLight.target = targetL;
    root.add(leftHeadlightLight);

    rightHeadlightLight = new THREE.SpotLight(0xffffff, 2.5, 38, Math.PI / 6, 0.35, 1.2);
    rightHeadlightLight.position.set(0.65, bodyMesh.position.y + 0.08, 2.2);
    const targetR = new THREE.Object3D();
    targetR.position.set(0.65, 0, 18);
    root.add(targetR);
    rightHeadlightLight.target = targetR;
    root.add(rightHeadlightLight);
  }

  // Contact shadow disc under vehicle
  const shadowGeo = new THREE.PlaneGeometry(2.4, 4.6);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 64;
  shadowCanvas.height = 64;
  const ctx = shadowCanvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    gradient.addColorStop(0, 'rgba(0,0,0,0.7)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.y = 0.03;
  root.add(shadowPlane);

  return {
    root,
    bodyMesh,
    bodyMaterial,
    frontLeftWheel,
    frontRightWheel,
    rearLeftWheel,
    rearRightWheel,
    headlightL,
    headlightR,
    brakeLightL,
    brakeLightR,
    brakeMaterial,
    headlightMaterial,
    leftHeadlightLight,
    rightHeadlightLight,
  };
}
