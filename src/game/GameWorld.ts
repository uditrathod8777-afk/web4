import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BUILDINGS, CITY_BOUNDS, INITIAL_COINS, LANDMARKS, ROAD_SEGMENTS } from './cityData';
import { buildCarModel, CarMeshes, VEHICLE_LIST } from './vehicles';
import { CollisionSystem } from './CollisionSystem';
import { TrafficSystem } from './TrafficSystem';
import { sound } from '../utils/audio';
import { GameSettings, Mission, TimeOfDay } from '../types/game';

export interface GameWorldCallbacks {
  onSpeedUpdate: (speedKmh: number, rpm: number, gear: number, driftScore: number) => void;
  onCoinCollected: (totalCount: number) => void;
  onCheckpointPassed: (currentIdx: number, total: number) => void;
  onMissionCompleted: (success: boolean) => void;
  onLandmarkDiscovered: (id: string, name: string) => void;
}

export type CameraViewMode = 'chase' | 'hood' | 'helicopter';

// Preallocated math objects for zero GC in animation loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _vCam = new THREE.Vector3();
const _vTarget = new THREE.Vector3();

export class GameWorld {
  public isRunning = false;
  public isPaused = false;

  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock = new THREE.Clock();
  private frameId = 0;
  private isSoftwareGl = false;

  // Environment & Lights
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private streetLightsGroup = new THREE.Group();

  // Systems
  private trafficSystem!: TrafficSystem;
  private callbacks: GameWorldCallbacks;
  private settings: GameSettings;

  // Player Vehicle
  private currentVehicleId = 'apex_gt';
  private currentCarColor = '#00f0ff';
  private carMeshes!: CarMeshes;
  private carPos = new THREE.Vector3(0, 0.35, 20);
  private carVelocity = 0; // m/s
  private carAngle = 0; // heading in radians
  private carSteerAngle = 0;
  private carPitch = 0;
  private carRoll = 0;
  private isHandbraking = false;
  private isDrifting = false;
  private driftScore = 0;
  private totalCoins = 0;

  // Camera
  private cameraMode: CameraViewMode = 'chase';
  private camDistance = 7.5;
  private camHeight = 2.8;
  private camPitchOffset = 0;
  private camYawOffset = 0;
  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;

  // Controls input state
  private input = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
  };

  // Coins
  private coinMeshes: { id: string; mesh: THREE.Mesh; x: number; y: number; z: number; collected: boolean }[] = [];

  // Active Mission
  public activeMission: Mission | null = null;
  public currentCheckpointIdx = 0;
  public missionTimeRemaining = 0;
  private checkpointMarkerGroup = new THREE.Group();
  private checkpointGateOuter!: THREE.Mesh;
  private checkpointGateInner!: THREE.Mesh;

  // Discovered landmarks tracker
  private discoveredLandmarks = new Set<string>();

  constructor(container: HTMLElement, settings: GameSettings, callbacks: GameWorldCallbacks) {
    this.container = container;
    this.settings = settings;
    this.callbacks = callbacks;

    // Detect Software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(
      this.isSoftwareGl || settings.graphicsQuality === 'low'
        ? 1
        : Math.min(window.devicePixelRatio, settings.graphicsQuality === 'medium' ? 1.5 : 2)
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      settings.cameraFov,
      container.clientWidth / container.clientHeight,
      0.2,
      600
    );

    // Environment reflections
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch {
      // Ignore if unavailable
    }

    // 3. Build Lighting & Sky
    this.initLighting();
    this.applyTimeOfDay(settings.timeOfDay);

    // 4. Build City Scenery
    this.buildCityWorld();

    // 5. Build Coins
    this.buildCoins();

    // 6. Build Checkpoint Gates
    this.buildCheckpointMarkers();

    // 7. Traffic System
    this.trafficSystem = new TrafficSystem(this.scene);

    // 8. Player Car
    this.spawnCar(this.currentVehicleId, this.currentCarColor);

    // 9. Input & Resizing listeners
    this.bindEvents();

    // 10. Start Loop
    this.isRunning = true;
    sound.startEngine();
    this.animate();
  }

  private initLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x334155, 0.7);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    this.dirLight.position.set(70, 110, 50);
    this.dirLight.castShadow = !this.isSoftwareGl && this.settings.graphicsQuality !== 'low';
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 300;
    const d = 160;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    this.scene.add(this.streetLightsGroup);
  }

  public applyTimeOfDay(time: TimeOfDay) {
    if (time === 'night') {
      this.scene.background = new THREE.Color(0x060913);
      this.scene.fog = new THREE.FogExp2(0x060913, 0.006);
      this.dirLight.intensity = 0.35;
      this.dirLight.color.setHex(0x38bdf8);
      this.hemiLight.intensity = 0.4;
      this.hemiLight.color.setHex(0x1e1b4b);
      this.hemiLight.groundColor.setHex(0x030712);
      this.streetLightsGroup.visible = true;
      if (this.carMeshes?.leftHeadlightLight) this.carMeshes.leftHeadlightLight.intensity = 3.5;
      if (this.carMeshes?.rightHeadlightLight) this.carMeshes.rightHeadlightLight.intensity = 3.5;
    } else if (time === 'sunset') {
      this.scene.background = new THREE.Color(0xfdba74);
      this.scene.fog = new THREE.FogExp2(0xfdba74, 0.004);
      this.dirLight.intensity = 1.4;
      this.dirLight.color.setHex(0xf97316);
      this.hemiLight.intensity = 0.65;
      this.hemiLight.color.setHex(0xfb923c);
      this.hemiLight.groundColor.setHex(0x431407);
      this.streetLightsGroup.visible = true;
      if (this.carMeshes?.leftHeadlightLight) this.carMeshes.leftHeadlightLight.intensity = 2.0;
      if (this.carMeshes?.rightHeadlightLight) this.carMeshes.rightHeadlightLight.intensity = 2.0;
    } else {
      // Day
      this.scene.background = new THREE.Color(0x7dd3fc);
      this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.003);
      this.dirLight.intensity = 1.8;
      this.dirLight.color.setHex(0xffffff);
      this.hemiLight.intensity = 0.75;
      this.hemiLight.color.setHex(0xb1e1ff);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.streetLightsGroup.visible = false;
      if (this.carMeshes?.leftHeadlightLight) this.carMeshes.leftHeadlightLight.intensity = 0.8;
      if (this.carMeshes?.rightHeadlightLight) this.carMeshes.rightHeadlightLight.intensity = 0.8;
    }
  }

  private buildCityWorld() {
    // 1. Terrain Ground
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.position.y = 0;
    this.scene.add(ground);

    // 2. Ocean Bay on North edge (Z < -170)
    const oceanGeo = new THREE.PlaneGeometry(500, 100);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.8,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(0, -0.2, -210);
    this.scene.add(ocean);

    // Ocean Pier / Promenade Boardwalk
    const pierGeo = new THREE.BoxGeometry(120, 0.5, 30);
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 });
    const pier = new THREE.Mesh(pierGeo, pierMat);
    pier.position.set(40, 0.25, -165);
    pier.receiveShadow = true;
    this.scene.add(pier);

    // 3. Road Network
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const markingMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.85,
    });

    const whiteLineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });

    ROAD_SEGMENTS.forEach((road) => {
      const dx = road.endX - road.startX;
      const dz = road.endZ - road.startZ;
      const len = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);

      const rGeo = new THREE.PlaneGeometry(road.width, len);
      rGeo.rotateX(-Math.PI / 2);
      rGeo.rotateY(angle);

      const rMesh = new THREE.Mesh(rGeo, roadMat);
      rMesh.position.set((road.startX + road.endX) / 2, 0.02, (road.startZ + road.endZ) / 2);
      rMesh.receiveShadow = true;
      this.scene.add(rMesh);

      // Center dashed line
      const dashGeo = new THREE.PlaneGeometry(0.3, len);
      dashGeo.rotateX(-Math.PI / 2);
      dashGeo.rotateY(angle);
      const dashMesh = new THREE.Mesh(dashGeo, markingMat);
      dashMesh.position.set((road.startX + road.endX) / 2, 0.03, (road.startZ + road.endZ) / 2);
      this.scene.add(dashMesh);

      // Sidewalk Curbs
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
      const curbGeo = new THREE.BoxGeometry(1.2, 0.25, len);
      curbGeo.rotateY(angle);

      const normalX = -Math.cos(angle);
      const normalZ = Math.sin(angle);

      const curbL = new THREE.Mesh(curbGeo, curbMat);
      curbL.position.set(
        (road.startX + road.endX) / 2 + normalX * (road.width / 2 + 0.6),
        0.12,
        (road.startZ + road.endZ) / 2 + normalZ * (road.width / 2 + 0.6)
      );
      this.scene.add(curbL);

      const curbR = new THREE.Mesh(curbGeo, curbMat);
      curbR.position.set(
        (road.startX + road.endX) / 2 - normalX * (road.width / 2 + 0.6),
        0.12,
        (road.startZ + road.endZ) / 2 - normalZ * (road.width / 2 + 0.6)
      );
      this.scene.add(curbR);
    });

    // 4. Elevated Highway Bridge (Neon Sky Bridge at x: -80, z: -50)
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const bridgeGeo = new THREE.BoxGeometry(14, 0.8, 80);
    const bridge = new THREE.Mesh(bridgeGeo, rampMat);
    bridge.position.set(-80, 4.5, -50);
    bridge.receiveShadow = true;
    bridge.castShadow = true;
    this.scene.add(bridge);

    // Bridge ramps
    const rampGeo = new THREE.BoxGeometry(14, 0.8, 30);
    rampGeo.rotateX(0.15);
    const rampSouth = new THREE.Mesh(rampGeo, rampMat);
    rampSouth.position.set(-80, 2.25, -5);
    rampSouth.receiveShadow = true;
    this.scene.add(rampSouth);

    const rampNorth = new THREE.Mesh(rampGeo, rampMat);
    rampNorth.rotation.x = -0.15;
    rampNorth.position.set(-80, 2.25, -95);
    rampNorth.receiveShadow = true;
    this.scene.add(rampNorth);

    // Bridge support pillars
    const pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 4.5, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    [-65, -35].forEach((pz) => {
      const p1 = new THREE.Mesh(pillarGeo, pillarMat);
      p1.position.set(-85, 2.25, pz);
      const p2 = new THREE.Mesh(pillarGeo, pillarMat);
      p2.position.set(-75, 2.25, pz);
      this.scene.add(p1);
      this.scene.add(p2);
    });

    // 5. Buildings
    BUILDINGS.forEach((b) => {
      const bGroup = new THREE.Group();

      // Main structure
      const bGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
      const bMat = new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: 0.4,
        metalness: 0.4,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.y = b.height / 2;
      bMesh.castShadow = !this.isSoftwareGl;
      bMesh.receiveShadow = true;
      bGroup.add(bMesh);

      // Roof cap
      const roofGeo = new THREE.BoxGeometry(b.width * 0.94, 1.2, b.depth * 0.94);
      const roofMat = new THREE.MeshStandardMaterial({ color: b.roofColor, roughness: 0.5 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = b.height + 0.6;
      roof.castShadow = true;
      bGroup.add(roof);

      // Spire for Udit Tower
      if (b.height >= 110) {
        const spireGeo = new THREE.CylinderGeometry(0.3, 1.6, 25, 12);
        const spireMat = new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00f0ff,
          emissiveIntensity: 1.5,
          roughness: 0.2,
          metalness: 0.8,
        });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = b.height + 13;
        bGroup.add(spire);

        // Blinking beacon light at spire peak
        const beaconGeo = new THREE.SphereGeometry(0.8, 12, 12);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = b.height + 25.5;
        bGroup.add(beacon);
      }

      // Neon edge stripes on luxury skyscrapers
      if (b.neonColor) {
        const neonGeo = new THREE.BoxGeometry(b.width * 1.02, 0.8, b.depth * 1.02);
        const neonMat = new THREE.MeshBasicMaterial({ color: b.neonColor });
        const neon1 = new THREE.Mesh(neonGeo, neonMat);
        neon1.position.y = b.height * 0.6;
        bGroup.add(neon1);

        const neon2 = new THREE.Mesh(neonGeo, neonMat);
        neon2.position.y = b.height * 0.95;
        bGroup.add(neon2);
      }

      bGroup.position.set(b.x, 0, b.z);
      this.scene.add(bGroup);
    });

    // 6. Trees & Greenery in Emerald City Park (x: 80, z: 70)
    const parkGroundGeo = new THREE.PlaneGeometry(50, 50);
    parkGroundGeo.rotateX(-Math.PI / 2);
    const parkGroundMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });
    const parkGround = new THREE.Mesh(parkGroundGeo, parkGroundMat);
    parkGround.position.set(80, 0.05, 70);
    this.scene.add(parkGround);

    // Park Fountain
    const fountainBaseGeo = new THREE.CylinderGeometry(4.5, 5, 0.8, 16);
    const fountainMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const fountain = new THREE.Mesh(fountainBaseGeo, fountainMat);
    fountain.position.set(80, 0.4, 70);
    this.scene.add(fountain);

    const waterGeo = new THREE.CylinderGeometry(4.1, 4.1, 0.4, 16);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 });
    const fountainWater = new THREE.Mesh(waterGeo, waterMat);
    fountainWater.position.set(80, 0.7, 70);
    this.scene.add(fountainWater);

    // Instanced Trees
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const foliageGeo = new THREE.ConeGeometry(2.2, 5, 8);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });

    const treePositions: [number, number][] = [
      [65, 55], [95, 55], [65, 85], [95, 85],
      [75, 52], [85, 52], [75, 88], [85, 88],
      [-50, -145], [-30, -145], [0, -145], [30, -145], [60, -145], // Palm avenue along beach
      [-125, 45], [-125, 75], [-125, 120], // Near stadium
    ];

    treePositions.forEach(([tx, tz]) => {
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 4.5;
      foliage.castShadow = true;
      treeGroup.add(foliage);

      treeGroup.position.set(tx, 0, tz);
      this.scene.add(treeGroup);
    });

    // 7. Streetlights along Roads
    const lampPoleGeo = new THREE.CylinderGeometry(0.1, 0.12, 5.5, 8);
    const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const lampArmGeo = new THREE.BoxGeometry(1.6, 0.1, 0.1);
    const lampHeadGeo = new THREE.BoxGeometry(0.4, 0.15, 0.25);
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    const lampPositions = [
      [-70, -35], [-70, 35], [70, -35], [70, 35],
      [-35, -70], [35, -70], [-35, 70], [35, 70],
      [0, -100], [0, 100], [-100, 0], [100, 0],
    ];

    lampPositions.forEach(([lx, lz]) => {
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(lampPoleGeo, lampPoleMat);
      pole.position.y = 2.75;
      lamp.add(pole);

      const arm = new THREE.Mesh(lampArmGeo, lampPoleMat);
      arm.position.set(0.6, 5.4, 0);
      lamp.add(arm);

      const head = new THREE.Mesh(lampHeadGeo, lampGlowMat);
      head.position.set(1.2, 5.3, 0);
      lamp.add(head);

      lamp.position.set(lx, 0, lz);
      this.streetLightsGroup.add(lamp);
    });

    // 8. Outer City Perimeter Barriers
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.8 });
    const bW = CITY_BOUNDS.maxX - CITY_BOUNDS.minX;
    const bD = CITY_BOUNDS.maxZ - CITY_BOUNDS.minZ;

    // Glowing security barrier rim
    const barGeoX = new THREE.BoxGeometry(bW, 1.2, 0.8);
    const barGeoZ = new THREE.BoxGeometry(0.8, 1.2, bD);

    const bNorth = new THREE.Mesh(barGeoX, wallMat);
    bNorth.position.set(0, 0.6, CITY_BOUNDS.minZ);
    this.scene.add(bNorth);

    const bSouth = new THREE.Mesh(barGeoX, wallMat);
    bSouth.position.set(0, 0.6, CITY_BOUNDS.maxZ);
    this.scene.add(bSouth);

    const bWest = new THREE.Mesh(barGeoZ, wallMat);
    bWest.position.set(CITY_BOUNDS.minX, 0.6, 0);
    this.scene.add(bWest);

    const bEast = new THREE.Mesh(barGeoZ, wallMat);
    bEast.position.set(CITY_BOUNDS.maxX, 0.6, 0);
    this.scene.add(bEast);
  }

  private buildCoins() {
    const coinGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.12, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.9,
    });

    INITIAL_COINS.forEach((c) => {
      const mesh = new THREE.Mesh(coinGeo, coinMat);
      mesh.position.set(c.x, c.y, c.z);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.coinMeshes.push({
        id: c.id,
        mesh,
        x: c.x,
        y: c.y,
        z: c.z,
        collected: false,
      });
    });
  }

  private buildCheckpointMarkers() {
    this.scene.add(this.checkpointMarkerGroup);
    this.checkpointMarkerGroup.visible = false;

    // Glowing holographic outer ring
    const ringGeo = new THREE.TorusGeometry(3.5, 0.25, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
    });
    this.checkpointGateOuter = new THREE.Mesh(ringGeo, ringMat);
    this.checkpointGateOuter.position.y = 3.5;
    this.checkpointMarkerGroup.add(this.checkpointGateOuter);

    // Inner pulsing disc
    const innerGeo = new THREE.CylinderGeometry(3.2, 3.2, 0.1, 24);
    innerGeo.rotateX(Math.PI / 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    this.checkpointGateInner = new THREE.Mesh(innerGeo, innerMat);
    this.checkpointGateInner.position.y = 3.5;
    this.checkpointMarkerGroup.add(this.checkpointGateInner);

    // Vertical light beam column
    const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 30, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.4,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 15;
    this.checkpointMarkerGroup.add(beam);
  }

  public spawnCar(vehicleId: string, colorHex: string) {
    this.currentVehicleId = vehicleId;
    this.currentCarColor = colorHex;

    if (this.carMeshes?.root) {
      this.scene.remove(this.carMeshes.root);
    }

    this.carMeshes = buildCarModel(vehicleId, colorHex, true);
    this.carMeshes.root.position.copy(this.carPos);
    this.carMeshes.root.rotation.y = this.carAngle;
    this.scene.add(this.carMeshes.root);
  }

  public setCarColor(colorHex: string) {
    this.currentCarColor = colorHex;
    if (this.carMeshes?.bodyMaterial) {
      this.carMeshes.bodyMaterial.color.set(colorHex);
    }
  }

  public resetCar() {
    // Upright car and snap to nearest roadway
    this.carVelocity = 0;
    this.carPitch = 0;
    this.carRoll = 0;
    this.carSteerAngle = 0;

    // Reset to center avenue if outside bounds
    if (
      this.carPos.x < CITY_BOUNDS.minX + 5 ||
      this.carPos.x > CITY_BOUNDS.maxX - 5 ||
      this.carPos.z < CITY_BOUNDS.minZ + 5 ||
      this.carPos.z > CITY_BOUNDS.maxZ - 5
    ) {
      this.carPos.set(0, 0.35, 20);
      this.carAngle = 0;
    } else {
      this.carPos.y = 0.35;
    }

    if (this.carMeshes?.root) {
      this.carMeshes.root.position.copy(this.carPos);
      this.carMeshes.root.rotation.set(0, this.carAngle, 0);
    }
    sound.playClick();
  }

  public startMission(mission: Mission) {
    this.activeMission = mission;
    this.currentCheckpointIdx = 0;
    this.missionTimeRemaining = mission.timeLimitSec;

    // Teleport car to start
    this.carPos.set(mission.startPosition[0], mission.startPosition[1], mission.startPosition[2]);
    this.carAngle = mission.startRotation;
    this.carVelocity = 0;
    this.resetCar();

    this.updateCheckpointMarkerPosition();
    this.checkpointMarkerGroup.visible = true;
    sound.playCheckpoint();
  }

  public cancelMission() {
    this.activeMission = null;
    this.checkpointMarkerGroup.visible = false;
  }

  private updateCheckpointMarkerPosition() {
    if (!this.activeMission || this.currentCheckpointIdx >= this.activeMission.checkpoints.length) {
      this.checkpointMarkerGroup.visible = false;
      return;
    }
    const cp = this.activeMission.checkpoints[this.currentCheckpointIdx];
    this.checkpointMarkerGroup.position.set(cp.x, 0, cp.z);
    this.checkpointMarkerGroup.visible = true;
  }

  public toggleCamera() {
    if (this.cameraMode === 'chase') {
      this.cameraMode = 'hood';
    } else if (this.cameraMode === 'hood') {
      this.cameraMode = 'helicopter';
    } else {
      this.cameraMode = 'chase';
    }
    sound.playClick();
  }

  public setInput(control: 'forward' | 'backward' | 'left' | 'right' | 'handbrake', value: boolean) {
    this.input[control] = value;
  }

  private bindEvents() {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      sound.unlock();

      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.input.forward = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.input.backward = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.input.left = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.input.right = true;
      if (e.key === ' ') this.input.handbrake = true;
      if (e.key === 'c' || e.key === 'C') this.toggleCamera();
      if (e.key === 'r' || e.key === 'R') this.resetCar();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.input.forward = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.input.backward = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.input.left = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.input.right = false;
      if (e.key === ' ') this.input.handbrake = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse drag orbit controls for camera
    const dom = this.renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouseX;
      const dy = e.clientY - this.prevMouseY;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;

      this.camYawOffset -= dx * 0.006;
      this.camPitchOffset = THREE.MathUtils.clamp(this.camPitchOffset + dy * 0.005, -0.4, 0.6);
    };
    const onPointerUp = () => {
      this.isDragging = false;
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
  }

  private animate = () => {
    if (!this.isRunning) return;

    const delta = Math.min(this.clock.getDelta(), 0.08);

    if (!this.isPaused) {
      this.updatePhysics(delta);
      this.updateTraffic(delta);
      this.updateCoins(delta);
      this.updateMissions(delta);
      this.updateLandmarks();
      this.updateCamera(delta);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.animate);
    } else {
      this.frameId = requestAnimationFrame(this.animate);
    }
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush?.();
    const poll = () => {
      const state = sync && gl.getSyncParameter?.(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync?.(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updatePhysics(delta: number) {
    const spec = VEHICLE_LIST.find((v) => v.id === this.currentVehicleId) || VEHICLE_LIST[0];

    const maxSpeedMs = (spec.topSpeedKmh * 1000) / 3600; // convert km/h to m/s
    const accelRate = 18 * (spec.acceleration / 80);
    const brakeRate = 32 * (spec.braking / 80);
    const turnRate = 2.4 * (spec.handling / 80);

    const throttle = this.input.forward ? 1 : 0;
    const reverse = this.input.backward ? 1 : 0;
    this.isHandbraking = this.input.handbrake;

    // Acceleration & Reverse
    if (throttle > 0) {
      if (this.carVelocity < 0) {
        // Braking while going in reverse
        this.carVelocity += brakeRate * delta;
      } else {
        const topSpeedFactor = Math.max(0.1, 1 - this.carVelocity / maxSpeedMs);
        this.carVelocity += accelRate * topSpeedFactor * delta;
      }
    } else if (reverse > 0) {
      if (this.carVelocity > 0.5) {
        // Active Braking
        this.carVelocity -= brakeRate * delta;
        // Brighten brake lights
        if (this.carMeshes?.brakeMaterial) {
          this.carMeshes.brakeMaterial.emissiveIntensity = 2.4;
        }
      } else {
        // Reversing
        this.carVelocity -= accelRate * 0.5 * delta;
        this.carVelocity = Math.max(-12, this.carVelocity);
      }
    } else {
      // Natural rolling friction
      if (this.carVelocity > 0) {
        this.carVelocity = Math.max(0, this.carVelocity - 6.5 * delta);
      } else if (this.carVelocity < 0) {
        this.carVelocity = Math.min(0, this.carVelocity + 6.5 * delta);
      }
      if (this.carMeshes?.brakeMaterial) {
        this.carMeshes.brakeMaterial.emissiveIntensity = 0.6;
      }
    }

    // Handbrake physics
    if (this.isHandbraking) {
      this.carVelocity = Math.max(0, this.carVelocity - 24 * delta);
      if (this.carMeshes?.brakeMaterial) {
        this.carMeshes.brakeMaterial.emissiveIntensity = 2.8;
      }
    }

    // Steering
    const steerInput = (this.input.left ? 1 : 0) - (this.input.right ? 1 : 0);
    const speedRatio = Math.min(1.0, Math.abs(this.carVelocity) / 10);
    const targetSteerAngle = steerInput * (0.55 - speedRatio * 0.25);
    this.carSteerAngle = THREE.MathUtils.damp(this.carSteerAngle, targetSteerAngle, 12, delta);

    // Apply turning to car heading
    if (Math.abs(this.carVelocity) > 0.2) {
      const directionSign = this.carVelocity > 0 ? 1 : -1;
      const turnMultiplier = this.isHandbraking ? 1.6 : 1.0;
      this.carAngle += this.carSteerAngle * turnRate * directionSign * turnMultiplier * delta;
    }

    // Drift Detection
    const lateralG = Math.abs(this.carSteerAngle * this.carVelocity);
    if ((this.isHandbraking || lateralG > 8.0) && Math.abs(this.carVelocity) > 8.0) {
      this.isDrifting = true;
      this.driftScore += Math.floor(lateralG * 5 * delta);
      sound.updateTireSkid(Math.min(1.0, lateralG / 15));
    } else {
      this.isDrifting = false;
      sound.updateTireSkid(0);
    }

    // Advance position
    const forwardX = Math.sin(this.carAngle);
    const forwardZ = Math.cos(this.carAngle);

    this.carPos.x += forwardX * this.carVelocity * delta;
    this.carPos.z += forwardZ * this.carVelocity * delta;

    // Check ramp/bridge elevation at x: -80, z: -50
    if (Math.abs(this.carPos.x - -80) < 6.5 && this.carPos.z > -105 && this.carPos.z < 5) {
      if (this.carPos.z > -15 && this.carPos.z < 5) {
        // South ramp
        const t = (5 - this.carPos.z) / 20;
        this.carPos.y = 0.35 + t * 4.15;
      } else if (this.carPos.z < -85 && this.carPos.z > -105) {
        // North ramp
        const t = (this.carPos.z - -105) / 20;
        this.carPos.y = 0.35 + t * 4.15;
      } else {
        // Main deck
        this.carPos.y = 4.5;
      }
    } else {
      this.carPos.y = THREE.MathUtils.damp(this.carPos.y, 0.35, 14, delta);
    }

    // Collision check against buildings & perimeter
    const col = CollisionSystem.checkCollision(this.carPos.x, this.carPos.z, 1.4, this.carVelocity);
    if (col.collided) {
      // Reposition out of collision
      this.carPos.x += col.normal.x * col.penetration;
      this.carPos.z += col.normal.y * col.penetration;
      // Bounce and kill velocity
      this.carVelocity *= -0.35;
    }

    // Check collision against traffic
    const hitTraffic = this.trafficSystem.checkPlayerCollision(this.carPos.x, this.carPos.z, 1.4, this.carVelocity);
    if (hitTraffic) {
      this.carVelocity *= -0.3;
    }

    // Dynamic car chassis suspension tilt
    const targetPitch = (throttle - reverse) * 0.05 - (this.input.backward && this.carVelocity > 2 ? 0.08 : 0);
    this.carPitch = THREE.MathUtils.damp(this.carPitch, targetPitch, 8, delta);

    const targetRoll = -this.carSteerAngle * Math.min(1.5, Math.abs(this.carVelocity) / 8) * 0.08;
    this.carRoll = THREE.MathUtils.damp(this.carRoll, targetRoll, 8, delta);

    // Update car 3D mesh
    if (this.carMeshes?.root) {
      this.carMeshes.root.position.copy(this.carPos);
      this.carMeshes.root.rotation.set(this.carPitch, this.carAngle, this.carRoll);

      // Wheel rotations
      const wheelSpin = (this.carVelocity * delta) / 0.36;
      this.carMeshes.frontLeftWheel.rotation.x += wheelSpin;
      this.carMeshes.frontRightWheel.rotation.x += wheelSpin;
      this.carMeshes.rearLeftWheel.rotation.x += wheelSpin;
      this.carMeshes.rearRightWheel.rotation.x += wheelSpin;

      // Wheel steering angles
      this.carMeshes.frontLeftWheel.rotation.y = this.carSteerAngle;
      this.carMeshes.frontRightWheel.rotation.y = this.carSteerAngle;
    }

    // Audio & HUD speed update
    const speedKmh = Math.abs(Math.round((this.carVelocity * 3600) / 1000));
    const rpm = Math.min(1.0, 0.2 + (speedKmh % 45) / 45);
    const gear = Math.min(6, Math.max(1, Math.floor(speedKmh / 35) + 1));
    sound.updateEnginePitch(rpm, throttle);

    this.callbacks.onSpeedUpdate(speedKmh, rpm, gear, this.driftScore);
  }

  private updateTraffic(delta: number) {
    this.trafficSystem.update(delta, this.carPos.x, this.carPos.z);
  }

  private updateCoins(delta: number) {
    for (const c of this.coinMeshes) {
      if (c.collected) continue;
      // Rotate and bob
      c.mesh.rotation.z += 2.5 * delta;
      c.mesh.position.y = c.y + Math.sin(Date.now() * 0.004 + c.x) * 0.15;

      // Check pickup
      const dx = this.carPos.x - c.x;
      const dz = this.carPos.z - c.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.5) {
        c.collected = true;
        this.scene.remove(c.mesh);
        this.totalCoins += 25;
        sound.playCoin();
        this.callbacks.onCoinCollected(this.totalCoins);
      }
    }
  }

  private updateMissions(delta: number) {
    if (!this.activeMission) return;

    this.missionTimeRemaining = Math.max(0, this.missionTimeRemaining - delta);

    // Pulse checkpoint gates
    if (this.checkpointGateOuter && this.checkpointGateInner) {
      this.checkpointGateOuter.rotation.z += 1.8 * delta;
      const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.12;
      this.checkpointGateOuter.scale.set(pulse, pulse, pulse);
      this.checkpointGateInner.scale.set(pulse * 0.9, pulse * 0.9, pulse * 0.9);
    }

    const currentCp = this.activeMission.checkpoints[this.currentCheckpointIdx];
    if (currentCp) {
      const dist = Math.hypot(this.carPos.x - currentCp.x, this.carPos.z - currentCp.z);
      if (dist < currentCp.radius) {
        // Reached checkpoint!
        sound.playCheckpoint();
        this.currentCheckpointIdx++;
        this.callbacks.onCheckpointPassed(this.currentCheckpointIdx, this.activeMission.checkpoints.length);

        if (this.currentCheckpointIdx >= this.activeMission.checkpoints.length) {
          // Mission Success!
          sound.playVictory();
          this.checkpointMarkerGroup.visible = false;
          const completedMission = this.activeMission;
          this.activeMission = null;
          this.callbacks.onMissionCompleted(true);
        } else {
          this.updateCheckpointMarkerPosition();
        }
      }
    }

    // Time ran out
    if (this.missionTimeRemaining <= 0) {
      sound.playFail();
      this.checkpointMarkerGroup.visible = false;
      this.activeMission = null;
      this.callbacks.onMissionCompleted(false);
    }
  }

  private updateLandmarks() {
    for (const lm of LANDMARKS) {
      if (this.discoveredLandmarks.has(lm.id)) continue;
      const dist = Math.hypot(this.carPos.x - lm.x, this.carPos.z - lm.z);
      if (dist < 18) {
        this.discoveredLandmarks.add(lm.id);
        sound.playCheckpoint();
        this.callbacks.onLandmarkDiscovered(lm.id, lm.name);
      }
    }
  }

  private updateCamera(delta: number) {
    if (this.cameraMode === 'hood') {
      // First person from car hood
      const hoodOffset = _v1.set(0, 1.1, 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.carAngle);
      this.camera.position.copy(this.carPos).add(hoodOffset);

      const lookTarget = _v2
        .set(Math.sin(this.carAngle) * 30, 0.8, Math.cos(this.carAngle) * 30)
        .add(this.camera.position);
      this.camera.lookAt(lookTarget);
    } else if (this.cameraMode === 'helicopter') {
      // High bird's eye chase view
      const targetCamPos = _vCam.set(
        this.carPos.x - Math.sin(this.carAngle) * 16,
        this.carPos.y + 22,
        this.carPos.z - Math.cos(this.carAngle) * 16
      );
      this.camera.position.lerp(targetCamPos, 8 * delta);
      this.camera.lookAt(this.carPos.x, this.carPos.y + 1, this.carPos.z);
    } else {
      // Third-person chase camera with smooth spring damping
      const effectiveAngle = this.carAngle + this.camYawOffset;
      const targetCamPos = _vCam.set(
        this.carPos.x - Math.sin(effectiveAngle) * this.camDistance,
        Math.max(1.2, this.carPos.y + this.camHeight + this.camPitchOffset * 5),
        this.carPos.z - Math.cos(effectiveAngle) * this.camDistance
      );

      this.camera.position.lerp(targetCamPos, 10 * delta);

      _vTarget.set(
        this.carPos.x + Math.sin(this.carAngle) * 4,
        this.carPos.y + 1.2,
        this.carPos.z + Math.cos(this.carAngle) * 4
      );
      this.camera.lookAt(_vTarget);
    }
  }

  public getPlayerCarData() {
    return {
      x: this.carPos.x,
      z: this.carPos.z,
      heading: this.carAngle,
      speed: this.carVelocity,
    };
  }

  public getTrafficData() {
    return this.trafficSystem.cars.map((c) => ({
      x: c.x,
      z: c.z,
      rotation: c.rotation,
    }));
  }

  public getRemainingCoinsData() {
    return this.coinMeshes
      .filter((c) => !c.collected)
      .map((c) => ({ x: c.x, z: c.z }));
  }

  public getActiveCheckpointData() {
    if (!this.activeMission || this.currentCheckpointIdx >= this.activeMission.checkpoints.length) {
      return null;
    }
    return this.activeMission.checkpoints[this.currentCheckpointIdx];
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    sound.stopEngine();
    this.trafficSystem.dispose();
    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}
