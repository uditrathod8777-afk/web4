import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Play, PlayCircle, Wrench, Settings, HelpCircle, Sparkles, Trophy } from 'lucide-react';
import { buildCarModel } from '../game/vehicles';
import { sound } from '../utils/audio';

interface MainMenuProps {
  onPlay: () => void;
  onContinue: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  coins: number;
  hasSaveData: boolean;
  selectedCarId: string;
  selectedCarColor: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onContinue,
  onOpenGarage,
  onOpenSettings,
  onOpenHowToPlay,
  coins,
  hasSaveData,
  selectedCarId,
  selectedCarColor,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070f);
    scene.fog = new THREE.FogExp2(0x05070f, 0.015);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 2.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Studio lights
    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.8);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    keyLight.position.set(6, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 2.2);
    rimLight.position.set(-6, 4, -4);
    scene.add(rimLight);

    // Showroom reflective platform
    const platformGeo = new THREE.CylinderGeometry(5.2, 5.5, 0.4, 48);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.85,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.2;
    platform.receiveShadow = true;
    scene.add(platform);

    // Glowing neon circular ring on platform
    const ringGeo = new THREE.TorusGeometry(5.1, 0.08, 16, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.02;
    scene.add(ring);

    // Background architectural columns
    const colGeo = new THREE.BoxGeometry(0.8, 16, 0.8);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    for (let i = -4; i <= 4; i += 2) {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(i * 3.5, 6, -10);
      scene.add(col);
    }

    // Vehicle
    const car = buildCarModel(selectedCarId, selectedCarColor, false);
    scene.add(car.root);

    let frameId = 0;
    let angle = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      angle += 0.008;

      // Rotate car slowly
      car.root.rotation.y = angle;

      // Gentle camera sway
      camera.position.x = Math.sin(angle * 0.4) * 1.5;
      camera.position.y = 2.0 + Math.cos(angle * 0.3) * 0.4;
      camera.lookAt(0, 0.6, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [selectedCarId, selectedCarColor]);

  const handleButtonClick = (action: () => void) => {
    sound.unlock();
    sound.playClick();
    action();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden font-sans">
      {/* 3D Background Showroom */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Cyberpunk Vignette & Grid Overlay */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950 pointer-events-none z-10" />

      {/* Foreground Menu Content */}
      <div className="relative z-20 flex flex-col justify-between h-full p-8 md:p-14 max-w-7xl mx-auto">
        {/* Header / Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen 3D Sandbox Driving Experience
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase drop-shadow-[0_0_30px_rgba(56,189,248,0.4)]">
            UDIT&apos;S <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-500">OPEN WORLD</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg font-medium leading-relaxed">
            Roam an expansive city with realistic car physics, high-speed overpass highways, AI traffic, drift challenges, and rewarding missions.
          </p>
        </div>

        {/* Action Menu Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-6 my-auto sm:my-0">
          <div className="flex flex-col gap-3 w-full sm:w-72">
            <button
              onClick={() => handleButtonClick(onPlay)}
              className="group relative flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-base tracking-wider uppercase shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                Play Game
              </span>
              <span className="text-xs font-mono text-cyan-200 group-hover:translate-x-1 transition-transform">GO ➔</span>
            </button>

            {hasSaveData && (
              <button
                onClick={() => handleButtonClick(onContinue)}
                className="group flex items-center justify-between px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-sky-500/40 hover:border-sky-400 text-sky-300 font-bold text-sm tracking-wide uppercase transition-all active:scale-98 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-sky-400" />
                  Continue
                </span>
                <span className="text-xs font-mono text-slate-400">RESUME</span>
              </button>
            )}

            <button
              onClick={() => handleButtonClick(onOpenGarage)}
              className="group flex items-center justify-between px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-purple-500/40 hover:border-purple-400 text-purple-300 font-bold text-sm tracking-wide uppercase transition-all active:scale-98 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-400" />
                Garage
              </span>
              <span className="text-xs font-mono text-slate-400">VEHICLES</span>
            </button>

            <button
              onClick={() => handleButtonClick(onOpenSettings)}
              className="group flex items-center justify-between px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 text-slate-200 font-semibold text-sm transition-all active:scale-98 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </span>
              <span className="text-xs font-mono text-slate-500">CONFIG</span>
            </button>

            <button
              onClick={() => handleButtonClick(onOpenHowToPlay)}
              className="group flex items-center justify-between px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 text-slate-200 font-semibold text-sm transition-all active:scale-98 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                How to Play
              </span>
              <span className="text-xs font-mono text-slate-500">KEYS</span>
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-col gap-2 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm self-end">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>COIN WALLET:</span>
              <strong className="text-amber-300 text-sm font-extrabold">{coins.toLocaleString()}</strong>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              ACTIVE VEHICLE: <strong className="text-cyan-400 uppercase">{selectedCarId.replace('_', ' ')}</strong>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-4 border-t border-slate-800/80">
          <span>UDIT&apos;S OPEN WORLD v1.0 • 3D BROWSER ENGINE</span>
          <span>PC & MOBILE COMPATIBLE</span>
        </div>
      </div>
    </div>
  );
};
