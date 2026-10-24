import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Check, Lock, Coins, Gauge, Zap, Compass, Shield, Palette } from 'lucide-react';
import { VEHICLE_LIST, buildCarModel, CarMeshes } from '../game/vehicles';
import { VehicleSpec } from '../types/game';
import { sound } from '../utils/audio';

interface GarageProps {
  coins: number;
  unlockedCarIds: string[];
  selectedCarId: string;
  selectedColor: string;
  onSelectCar: (carId: string, color: string) => void;
  onPurchaseCar: (car: VehicleSpec) => void;
  onBack: () => void;
}

export const Garage: React.FC<GarageProps> = ({
  coins,
  unlockedCarIds,
  selectedCarId,
  selectedColor,
  onSelectCar,
  onPurchaseCar,
  onBack,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [viewedCarId, setViewedCarId] = useState<string>(selectedCarId);
  const [currentColor, setCurrentColor] = useState<string>(selectedColor);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const carMeshesRef = useRef<CarMeshes | null>(null);

  const activeVehicle = VEHICLE_LIST.find((v) => v.id === viewedCarId) || VEHICLE_LIST[0];
  const isUnlocked = unlockedCarIds.includes(viewedCarId);
  const isSelected = selectedCarId === viewedCarId && selectedColor === currentColor;
  const canAfford = coins >= activeVehicle.price;

  // 3D Showroom setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060814);
    scene.fog = new THREE.FogExp2(0x060814, 0.015);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(3.5, 2.2, 5.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Showroom Lighting
    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.85);
    scene.add(hemi);

    const spot1 = new THREE.SpotLight(0x00f0ff, 4, 30, Math.PI / 4, 0.5);
    spot1.position.set(5, 8, 5);
    spot1.castShadow = true;
    scene.add(spot1);

    const spot2 = new THREE.SpotLight(0xa855f7, 3.5, 30, Math.PI / 4, 0.5);
    spot2.position.set(-5, 6, -5);
    scene.add(spot2);

    // Floor turntable
    const floorGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.3, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.15;
    floor.receiveShadow = true;
    scene.add(floor);

    // Ambient grid lines
    const grid = new THREE.GridHelper(20, 20, 0x0284c7, 0x1e293b);
    grid.position.y = -0.16;
    scene.add(grid);

    // Build vehicle
    const carMeshes = buildCarModel(viewedCarId, currentColor, false);
    carMeshesRef.current = carMeshes;
    scene.add(carMeshes.root);

    let frameId = 0;
    let angle = 0;
    let isDragging = false;
    let prevX = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!isDragging) {
        angle += 0.005;
      }
      if (carMeshesRef.current) {
        carMeshesRef.current.root.rotation.y = angle;
      }
      camera.lookAt(0, 0.6, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      prevX = e.clientX;
      angle += dx * 0.01;
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // When viewedCarId or currentColor changes, rebuild car in 3D scene
  useEffect(() => {
    if (!sceneRef.current) return;
    if (carMeshesRef.current) {
      sceneRef.current.remove(carMeshesRef.current.root);
    }
    const newMeshes = buildCarModel(viewedCarId, currentColor, false);
    carMeshesRef.current = newMeshes;
    sceneRef.current.add(newMeshes.root);
  }, [viewedCarId, currentColor]);

  const handleCarSelectTab = (id: string) => {
    sound.playClick();
    setViewedCarId(id);
    const car = VEHICLE_LIST.find((v) => v.id === id);
    if (car && !car.availableColors.includes(currentColor)) {
      setCurrentColor(car.bodyColor);
    }
  };

  const handleColorChange = (hex: string) => {
    sound.playClick();
    setCurrentColor(hex);
  };

  const handleConfirmAction = () => {
    sound.playClick();
    if (isUnlocked) {
      onSelectCar(viewedCarId, currentColor);
    } else if (canAfford) {
      onPurchaseCar(activeVehicle);
      onSelectCar(viewedCarId, currentColor);
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950 font-sans">
      {/* 3D Turntable Background */}
      <div ref={mountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Top Header */}
      <div className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition active:scale-95 cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          Back to Menu
        </button>

        <div className="flex items-center gap-3 bg-slate-900/90 border border-amber-500/50 px-5 py-2.5 rounded-xl shadow-xl">
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="font-mono text-xs text-slate-300">BALANCE:</span>
          <span className="font-mono font-extrabold text-amber-300 text-base">{coins.toLocaleString()} COINS</span>
        </div>
      </div>

      {/* Main Garage UI Overlay */}
      <div className="relative z-20 flex flex-col md:flex-row justify-between items-end p-6 md:p-10 max-w-7xl mx-auto gap-6 pointer-events-none mt-auto">
        {/* Left: Car Picker Carousel Tabs */}
        <div className="flex flex-col gap-3 w-full md:w-80 pointer-events-auto">
          <span className="text-xs font-mono tracking-widest text-sky-400 uppercase font-bold">Showroom Fleet</span>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
            {VEHICLE_LIST.map((v) => {
              const unlocked = unlockedCarIds.includes(v.id);
              const isCurrent = viewedCarId === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => handleCarSelectTab(v.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition active:scale-98 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900/95 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-mono text-slate-400 uppercase">{v.category}</div>
                    <div className="text-sm font-bold text-white tracking-wide">{v.name}</div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xs">
                    {unlocked ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5" /> OWNED
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-bold">
                        <Lock className="w-3.5 h-3.5" /> {v.price}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Vehicle Specs, Paint Customizer, & Action Button */}
        <div className="flex flex-col gap-4 w-full md:w-96 bg-slate-950/90 border border-slate-800 p-6 rounded-2xl shadow-2xl pointer-events-auto">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-sky-400 uppercase">{activeVehicle.category}</span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {activeVehicle.price === 0 ? 'DEFAULT' : `${activeVehicle.price} COINS`}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide">{activeVehicle.name}</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{activeVehicle.description}</p>
          </div>

          {/* Performance Bars */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-cyan-400" /> Top Speed</span>
                <span className="font-bold text-white">{activeVehicle.topSpeedKmh} KM/H</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${(activeVehicle.topSpeedKmh / 280) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Acceleration</span>
                <span className="font-bold text-white">{activeVehicle.acceleration}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${activeVehicle.acceleration}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-purple-400" /> Handling</span>
                <span className="font-bold text-white">{activeVehicle.handling}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full" style={{ width: `${activeVehicle.handling}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Braking</span>
                <span className="font-bold text-white">{activeVehicle.braking}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activeVehicle.braking}%` }} />
              </div>
            </div>
          </div>

          {/* Color Finish Picker */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5 text-sky-400" /> Custom Paint Finishes:
            </span>
            <div className="flex items-center gap-2">
              {activeVehicle.availableColors.map((hex) => (
                <button
                  key={hex}
                  onClick={() => handleColorChange(hex)}
                  style={{ backgroundColor: hex }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-90 cursor-pointer ${
                    currentColor === hex ? 'border-white scale-110 shadow-lg' : 'border-slate-700 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action / Buy / Equip button */}
          <button
            onClick={handleConfirmAction}
            disabled={!isUnlocked && !canAfford}
            className={`w-full py-3.5 rounded-xl font-extrabold uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 ${
              isSelected
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                : isUnlocked
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                : canAfford
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4" /> Equipped
              </>
            ) : isUnlocked ? (
              'Select Vehicle'
            ) : canAfford ? (
              <>
                <Coins className="w-4 h-4" /> Buy for {activeVehicle.price} Coins
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Needs {activeVehicle.price} Coins ({activeVehicle.price - coins} more)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
