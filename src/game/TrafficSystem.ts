import * as THREE from 'three';
import { TRAFFIC_ROUTES, TrafficRoute } from './cityData';
import { sound } from '../utils/audio';

export interface TrafficCar {
  mesh: THREE.Group;
  route: TrafficRoute;
  currentWaypointIdx: number;
  progressAlongSegment: number;
  speed: number;
  targetSpeed: number;
  width: number;
  length: number;
  wheels: THREE.Mesh[];
  x: number;
  z: number;
  rotation: number;
}

const TRAFFIC_COLORS = [
  0x3b82f6, // Blue
  0xef4444, // Red
  0xeab308, // Yellow Taxi
  0x10b981, // Emerald
  0xf97316, // Orange
  0x94a3b8, // Silver
  0x0f172a, // Obsidian
  0xa855f7, // Purple
];

export class TrafficSystem {
  public cars: TrafficCar[] = [];
  private group: THREE.Group;
  private sharedWheelGeo: THREE.CylinderGeometry;
  private sharedWheelMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.sharedWheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12);
    this.sharedWheelGeo.rotateZ(Math.PI / 2);
    this.sharedWheelMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.8,
    });

    this.spawnInitialTraffic();
  }

  private createTrafficCarMesh(colorHex: number): { mesh: THREE.Group; wheels: THREE.Mesh[] } {
    const carGroup = new THREE.Group();
    const wheels: THREE.Mesh[] = [];

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.5,
    });
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.5, 3.6);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    body.castShadow = true;
    carGroup.add(body);

    // Cabin
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.2,
      metalness: 0.3,
    });
    const cabinGeo = new THREE.BoxGeometry(1.35, 0.45, 1.9);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.82, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.25, 0.1, 0.05);
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffedd5,
      emissiveIntensity: 0.8,
    });
    const hlL = new THREE.Mesh(hlGeo, hlMat);
    hlL.position.set(-0.55, 0.45, 1.82);
    const hlR = new THREE.Mesh(hlGeo, hlMat);
    hlR.position.set(0.55, 0.45, 1.82);
    carGroup.add(hlL);
    carGroup.add(hlR);

    // Taillights
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.6,
    });
    const tlL = new THREE.Mesh(hlGeo, tlMat);
    tlL.position.set(-0.55, 0.45, -1.82);
    const tlR = new THREE.Mesh(hlGeo, tlMat);
    tlR.position.set(0.55, 0.45, -1.82);
    carGroup.add(tlL);
    carGroup.add(tlR);

    // 4 Wheels
    const wheelPositions = [
      [-0.85, 0.32, 1.1],
      [0.85, 0.32, 1.1],
      [-0.85, 0.32, -1.1],
      [0.85, 0.32, -1.1],
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(this.sharedWheelGeo, this.sharedWheelMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      carGroup.add(wheel);
      wheels.push(wheel);
    });

    return { mesh: carGroup, wheels };
  }

  private spawnInitialTraffic() {
    const numCars = 10;

    for (let i = 0; i < numCars; i++) {
      const route = TRAFFIC_ROUTES[i % TRAFFIC_ROUTES.length];
      const color = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
      const { mesh, wheels } = this.createTrafficCarMesh(color);

      const startWaypoint = i % route.waypoints.length;
      const initialProgress = ((i * 1.5) % 4) / 4;

      const car: TrafficCar = {
        mesh,
        route,
        currentWaypointIdx: startWaypoint,
        progressAlongSegment: initialProgress,
        speed: 10 + Math.random() * 5,
        targetSpeed: 14,
        width: 1.7,
        length: 3.8,
        wheels,
        x: 0,
        z: 0,
        rotation: 0,
      };

      this.group.add(mesh);
      this.cars.push(car);
    }
  }

  public update(delta: number, playerX: number, playerZ: number) {
    for (let i = 0; i < this.cars.length; i++) {
      const car = this.cars[i];
      const wpList = car.route.waypoints;
      const curWp = wpList[car.currentWaypointIdx];
      const nextWp = wpList[(car.currentWaypointIdx + 1) % wpList.length];

      // Segment vector
      const segX = nextWp.x - curWp.x;
      const segZ = nextWp.z - curWp.z;
      const segLen = Math.hypot(segX, segZ) || 1;

      // Normal for lane offset
      const normX = -segZ / segLen;
      const normZ = segX / segLen;

      // Desired heading angle
      const targetRotation = Math.atan2(segX, segZ);
      car.rotation = targetRotation;

      // Check distance to player car ahead
      const distToPlayer = Math.hypot(car.x - playerX, car.z - playerZ);
      let obstacleAhead = false;

      if (distToPlayer < 9.0) {
        // Check if player is roughly in front of traffic car
        const toPlayerX = playerX - car.x;
        const toPlayerZ = playerZ - car.z;
        const forwardX = Math.sin(car.rotation);
        const forwardZ = Math.cos(car.rotation);
        const dot = (toPlayerX * forwardX + toPlayerZ * forwardZ) / distToPlayer;
        if (dot > 0.4) {
          obstacleAhead = true;
        }
      }

      // Check distance to other traffic cars ahead
      for (let j = 0; j < this.cars.length; j++) {
        if (i === j) continue;
        const other = this.cars[j];
        const distOther = Math.hypot(other.x - car.x, other.z - car.z);
        if (distOther < 7.0) {
          const toOtherX = other.x - car.x;
          const toOtherZ = other.z - car.z;
          const forwardX = Math.sin(car.rotation);
          const forwardZ = Math.cos(car.rotation);
          const dot = (toOtherX * forwardX + toOtherZ * forwardZ) / distOther;
          if (dot > 0.4) {
            obstacleAhead = true;
            break;
          }
        }
      }

      // Smooth deceleration or acceleration
      if (obstacleAhead) {
        car.speed = Math.max(0, car.speed - 18 * delta);
      } else {
        car.speed = Math.min(car.targetSpeed, car.speed + 8 * delta);
      }

      // Advance along segment
      car.progressAlongSegment += (car.speed * delta) / segLen;
      if (car.progressAlongSegment >= 1.0) {
        car.progressAlongSegment = 0;
        car.currentWaypointIdx = (car.currentWaypointIdx + 1) % wpList.length;
      }

      // Compute current interpolated position with lane offset
      const posX = curWp.x + segX * car.progressAlongSegment + normX * car.route.laneOffset;
      const posZ = curWp.z + segZ * car.progressAlongSegment + normZ * car.route.laneOffset;

      car.x = posX;
      car.z = posZ;

      car.mesh.position.set(posX, 0, posZ);
      car.mesh.rotation.y = targetRotation;

      // Wheel spin
      const spinAngle = (car.speed * delta) / 0.32;
      for (const w of car.wheels) {
        w.rotation.x += spinAngle;
      }
    }
  }

  /**
   * Check collision between player car and any traffic vehicle.
   */
  public checkPlayerCollision(playerX: number, playerZ: number, playerRadius: number, playerSpeed: number): boolean {
    for (const car of this.cars) {
      const dx = playerX - car.x;
      const dz = playerZ - car.z;
      const dist = Math.hypot(dx, dz);

      if (dist < playerRadius + car.width * 0.8) {
        // Crash impact with traffic!
        sound.playCrash(Math.max(1.0, Math.abs(playerSpeed) / 10));
        // Push traffic car slightly
        car.speed = Math.max(0, car.speed * 0.2);
        return true;
      }
    }
    return false;
  }

  public dispose() {
    this.sharedWheelGeo.dispose();
    this.sharedWheelMat.dispose();
    this.group.clear();
  }
}
