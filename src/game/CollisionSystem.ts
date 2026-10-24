import * as THREE from 'three';
import { BUILDINGS, CITY_BOUNDS } from './cityData';
import { sound } from '../utils/audio';

export interface CollisionResult {
  collided: boolean;
  normal: THREE.Vector2;
  penetration: number;
  impactSpeed: number;
}

export interface BoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  name?: string;
}

export class CollisionSystem {
  private static buildingColliders: BoxCollider[] = [];

  public static init() {
    this.buildingColliders = BUILDINGS.map((b) => {
      const halfW = b.width / 2 + 0.3;
      const halfD = b.depth / 2 + 0.3;
      return {
        minX: b.x - halfW,
        maxX: b.x + halfW,
        minZ: b.z - halfD,
        maxZ: b.z + halfD,
        name: b.type,
      };
    });
  }

  /**
   * Checks player vehicle collision against static buildings and city perimeter boundaries.
   * Returns normal and penetration for impulse resolution.
   */
  public static checkCollision(
    carX: number,
    carZ: number,
    carRadius = 1.3,
    carSpeed = 0
  ): CollisionResult {
    if (this.buildingColliders.length === 0) {
      this.init();
    }

    // 1. Check City Boundaries
    const { minX, maxX, minZ, maxZ } = CITY_BOUNDS;
    if (carX - carRadius < minX) {
      sound.playCrash(Math.abs(carSpeed) / 15);
      return {
        collided: true,
        normal: new THREE.Vector2(1, 0),
        penetration: minX - (carX - carRadius),
        impactSpeed: Math.abs(carSpeed),
      };
    }
    if (carX + carRadius > maxX) {
      sound.playCrash(Math.abs(carSpeed) / 15);
      return {
        collided: true,
        normal: new THREE.Vector2(-1, 0),
        penetration: (carX + carRadius) - maxX,
        impactSpeed: Math.abs(carSpeed),
      };
    }
    if (carZ - carRadius < minZ) {
      sound.playCrash(Math.abs(carSpeed) / 15);
      return {
        collided: true,
        normal: new THREE.Vector2(0, 1),
        penetration: minZ - (carZ - carRadius),
        impactSpeed: Math.abs(carSpeed),
      };
    }
    if (carZ + carRadius > maxZ) {
      sound.playCrash(Math.abs(carSpeed) / 15);
      return {
        collided: true,
        normal: new THREE.Vector2(0, -1),
        penetration: (carZ + carRadius) - maxZ,
        impactSpeed: Math.abs(carSpeed),
      };
    }

    // 2. Check Buildings
    for (const box of this.buildingColliders) {
      // Find closest point on AABB to circle center
      const closestX = Math.max(box.minX, Math.min(carX, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(carZ, box.maxZ));

      const dx = carX - closestX;
      const dz = carZ - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < carRadius * carRadius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const penetration = carRadius - dist;
        const normal = new THREE.Vector2(dx / dist, dz / dist);

        // Play crash sound if car was moving
        if (Math.abs(carSpeed) > 2.0) {
          sound.playCrash(Math.abs(carSpeed) / 15);
        }

        return {
          collided: true,
          normal,
          penetration,
          impactSpeed: Math.abs(carSpeed),
        };
      }
    }

    return {
      collided: false,
      normal: new THREE.Vector2(0, 0),
      penetration: 0,
      impactSpeed: 0,
    };
  }
}
