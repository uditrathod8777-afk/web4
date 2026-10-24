import React, { useEffect, useRef } from 'react';
import { GameWorld } from '../game/GameWorld';
import { LANDMARKS, ROAD_SEGMENTS } from '../game/cityData';

interface MiniMapProps {
  gameWorld: GameWorld | null;
}

export const MiniMap: React.FC<MiniMapProps> = ({ gameWorld }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      if (!canvasRef.current || !gameWorld) {
        animId = requestAnimationFrame(render);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const zoom = 0.55; // pixels per world meter

      const playerData = gameWorld.getPlayerCarData();
      const px = playerData.x;
      const pz = playerData.z;

      // Clear with dark transparent radial background
      ctx.clearRect(0, 0, width, height);

      // Radar circular mask
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 4, 0, Math.PI * 2);
      ctx.clip();

      // Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Concentric range circles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      [25, 50, 75].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Transform world coordinates relative to player position
      const toScreenX = (wx: number) => cx + (wx - px) * zoom;
      const toScreenY = (wz: number) => cy + (wz - pz) * zoom;

      // Draw Roads
      ctx.strokeStyle = '#334155';
      ctx.lineCap = 'round';
      ROAD_SEGMENTS.forEach((road) => {
        const x1 = toScreenX(road.startX);
        const y1 = toScreenY(road.startZ);
        const x2 = toScreenX(road.endX);
        const y2 = toScreenY(road.endZ);

        ctx.lineWidth = Math.max(4, road.width * zoom);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      // Draw Landmarks
      LANDMARKS.forEach((lm) => {
        const lx = toScreenX(lm.x);
        const ly = toScreenY(lm.z);
        ctx.fillStyle = '#818cf8';
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Coins
      const coins = gameWorld.getRemainingCoinsData();
      ctx.fillStyle = '#facc15';
      coins.forEach((c) => {
        const sx = toScreenX(c.x);
        const sy = toScreenY(c.z);
        if (Math.hypot(sx - cx, sy - cy) < cx - 6) {
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Traffic Cars
      const traffic = gameWorld.getTrafficData();
      ctx.fillStyle = '#ef4444';
      traffic.forEach((t) => {
        const tx = toScreenX(t.x);
        const ty = toScreenY(t.z);
        if (Math.hypot(tx - cx, ty - cy) < cx - 6) {
          ctx.beginPath();
          ctx.arc(tx, ty, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Active Mission Checkpoint Target
      const activeCp = gameWorld.getActiveCheckpointData();
      if (activeCp) {
        const cpx = toScreenX(activeCp.x);
        const cpy = toScreenY(activeCp.z);
        const pulse = 6 + Math.sin(Date.now() * 0.01) * 3;

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cpx, cpy, pulse, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(cpx, cpy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Player Arrow
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(playerData.heading);

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, 9);
      ctx.lineTo(-6, -7);
      ctx.lineTo(0, -4);
      ctx.lineTo(6, -7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // Outer bezel border
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 3, 0, Math.PI * 2);
      ctx.stroke();

      // North indicator
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('N', cx, 14);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameWorld]);

  return (
    <div className="relative rounded-full shadow-2xl p-1 bg-slate-900/90 border border-sky-500/40 backdrop-blur-xs select-none">
      <canvas
        ref={canvasRef}
        width={170}
        height={170}
        className="rounded-full block"
      />
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-950 px-2.5 py-0.5 rounded-full border border-sky-500/50 text-[10px] font-mono tracking-wider text-sky-400">
        GPS RADAR
      </div>
    </div>
  );
};
