import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, GameSettings, PlayerProgress, Mission, VehicleSpec, TimeOfDay } from './types/game';
import { loadProgress, saveProgress, loadSettings, saveSettings } from './utils/storage';
import { sound } from './utils/audio';
import { GameWorld } from './game/GameWorld';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { Garage } from './components/Garage';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PauseMenu } from './components/PauseMenu';
import { MissionCompleteModal } from './components/MissionCompleteModal';
import { MISSIONS } from './game/missions';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Saved Data
  const [progress, setProgress] = useState<PlayerProgress>(loadProgress);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  // Live Gameplay Telemetry
  const [speedKmh, setSpeedKmh] = useState(0);
  const [rpm, setRpm] = useState(0.2);
  const [gear, setGear] = useState(1);
  const [driftScore, setDriftScore] = useState(0);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [checkpointProgress, setCheckpointProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [missionTimeRemaining, setMissionTimeRemaining] = useState(0);
  const [recentLandmark, setRecentLandmark] = useState<string | null>(null);
  const [missionModalData, setMissionModalData] = useState<{ mission: Mission; success: boolean } | null>(null);

  // Three.js Game Engine Ref
  const gameMountRef = useRef<HTMLDivElement | null>(null);
  const gameWorldRef = useRef<GameWorld | null>(null);

  // Save progress changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Save settings changes and sync audio
  useEffect(() => {
    saveSettings(settings);
    sound.setVolumes(settings.masterVolume, settings.engineVolume, settings.sfxVolume, !settings.soundEnabled);
  }, [settings]);

  // Handle ESC key for Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState === 'playing' && !showSettings && !showHowToPlay && !missionModalData) {
        setIsPaused((prev) => {
          const next = !prev;
          if (gameWorldRef.current) {
            gameWorldRef.current.isPaused = next;
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showSettings, showHowToPlay, missionModalData]);

  // Landmark toast dismiss timer
  useEffect(() => {
    if (!recentLandmark) return;
    const timer = setTimeout(() => {
      setRecentLandmark(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [recentLandmark]);

  // Teardown or initialize GameWorld when transitioning into / out of 'playing'
  useEffect(() => {
    if (gameState === 'playing') {
      if (!gameMountRef.current) return;

      const world = new GameWorld(gameMountRef.current, settings, {
        onSpeedUpdate: (speed, r, g, drift) => {
          setSpeedKmh(speed);
          setRpm(r);
          setGear(g);
          setDriftScore(drift);
          if (gameWorldRef.current?.activeMission) {
            setMissionTimeRemaining(gameWorldRef.current.missionTimeRemaining);
          }
        },
        onCoinCollected: (total) => {
          setProgress((prev) => ({
            ...prev,
            coins: prev.coins + 25,
          }));
        },
        onCheckpointPassed: (current, total) => {
          setCheckpointProgress({ current, total });
        },
        onMissionCompleted: (success) => {
          const finishedMission = gameWorldRef.current?.activeMission || activeMission;
          if (finishedMission) {
            if (success) {
              setProgress((prev) => ({
                ...prev,
                coins: prev.coins + finishedMission.rewardCoins,
                completedMissionIds: Array.from(new Set([...prev.completedMissionIds, finishedMission.id])),
              }));
            }
            setMissionModalData({ mission: finishedMission, success });
          }
          setActiveMission(null);
        },
        onLandmarkDiscovered: (id, name) => {
          setProgress((prev) => ({
            ...prev,
            coins: prev.coins + 50,
            landmarksDiscovered: Array.from(new Set([...prev.landmarksDiscovered, id])),
          }));
          setRecentLandmark(name);
        },
      });

      world.spawnCar(progress.selectedCarId, progress.selectedColor);
      gameWorldRef.current = world;

      return () => {
        world.dispose();
        gameWorldRef.current = null;
      };
    } else {
      if (gameWorldRef.current) {
        gameWorldRef.current.dispose();
        gameWorldRef.current = null;
      }
    }
  }, [gameState]);

  // Start Playing
  const handleStartGame = () => {
    sound.unlock();
    setGameState('playing');
    setIsPaused(false);
  };

  // Car Selection
  const handleSelectCar = (carId: string, color: string) => {
    setProgress((prev) => ({
      ...prev,
      selectedCarId: carId,
      selectedColor: color,
    }));
    if (gameWorldRef.current) {
      gameWorldRef.current.spawnCar(carId, color);
    }
  };

  // Car Purchase
  const handlePurchaseCar = (car: VehicleSpec) => {
    if (progress.coins < car.price) return;
    setProgress((prev) => ({
      ...prev,
      coins: prev.coins - car.price,
      unlockedCarIds: [...prev.unlockedCarIds, car.id],
      selectedCarId: car.id,
      selectedColor: car.bodyColor,
    }));
    sound.playVictory();
  };

  // Pause / Resume
  const handleTogglePause = () => {
    sound.playClick();
    const nextState = !isPaused;
    setIsPaused(nextState);
    if (gameWorldRef.current) {
      gameWorldRef.current.isPaused = nextState;
    }
  };

  // Reset Car
  const handleResetCar = () => {
    if (gameWorldRef.current) {
      gameWorldRef.current.resetCar();
    }
  };

  // Switch Camera
  const handleToggleCamera = () => {
    if (gameWorldRef.current) {
      gameWorldRef.current.toggleCamera();
    }
  };

  // Toggle Time of Day in-game
  const handleToggleTimeOfDay = () => {
    sound.playClick();
    const cycle: Record<TimeOfDay, TimeOfDay> = {
      day: 'sunset',
      sunset: 'night',
      night: 'day',
    };
    const next = cycle[settings.timeOfDay];
    const updated = { ...settings, timeOfDay: next };
    setSettings(updated);
    if (gameWorldRef.current) {
      gameWorldRef.current.applyTimeOfDay(next);
    }
  };

  // Start Mission
  const handleStartMission = (mission: Mission) => {
    setActiveMission(mission);
    setCheckpointProgress({ current: 0, total: mission.checkpoints.length });
    setMissionTimeRemaining(mission.timeLimitSec);
    if (gameWorldRef.current) {
      gameWorldRef.current.startMission(mission);
    }
    setIsPaused(false);
  };

  const handleAbortMission = () => {
    sound.playClick();
    setActiveMission(null);
    if (gameWorldRef.current) {
      gameWorldRef.current.cancelMission();
    }
  };

  // Mobile virtual joystick / button handler
  const handleMobileInput = useCallback(
    (control: 'forward' | 'backward' | 'left' | 'right' | 'handbrake', value: boolean) => {
      sound.unlock();
      if (gameWorldRef.current) {
        gameWorldRef.current.setInput(control, value);
      }
    },
    []
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. MAIN MENU SCREEN */}
      {gameState === 'menu' && (
        <MainMenu
          onPlay={handleStartGame}
          onContinue={handleStartGame}
          onOpenGarage={() => setGameState('garage')}
          onOpenSettings={() => setShowSettings(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          coins={progress.coins}
          hasSaveData={progress.completedMissionIds.length > 0 || progress.coins !== 250}
          selectedCarId={progress.selectedCarId}
          selectedCarColor={progress.selectedColor}
        />
      )}

      {/* 2. GARAGE SCREEN */}
      {gameState === 'garage' && (
        <Garage
          coins={progress.coins}
          unlockedCarIds={progress.unlockedCarIds}
          selectedCarId={progress.selectedCarId}
          selectedColor={progress.selectedColor}
          onSelectCar={handleSelectCar}
          onPurchaseCar={handlePurchaseCar}
          onBack={() => setGameState('menu')}
        />
      )}

      {/* 3. ACTIVE GAME WORLD VIEW */}
      {gameState === 'playing' && (
        <div className="relative w-full h-full">
          {/* 3D WebGL Canvas Container */}
          <div ref={gameMountRef} className="absolute inset-0 z-0" />

          {/* HUD Overlay */}
          <GameHUD
            speedKmh={speedKmh}
            rpm={rpm}
            gear={gear}
            driftScore={driftScore}
            coins={progress.coins}
            activeMission={activeMission}
            checkpointProgress={checkpointProgress}
            missionTimeRemaining={missionTimeRemaining}
            recentLandmark={recentLandmark}
            timeOfDay={settings.timeOfDay}
            gameWorld={gameWorldRef.current}
            onPause={handleTogglePause}
            onResetCar={handleResetCar}
            onToggleCamera={handleToggleCamera}
            onToggleTimeOfDay={handleToggleTimeOfDay}
            onAbortMission={handleAbortMission}
            onMobileInput={handleMobileInput}
          />
        </div>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'playing' && isPaused && (
        <PauseMenu
          activeMission={activeMission}
          completedMissionIds={progress.completedMissionIds}
          onResume={() => {
            setIsPaused(false);
            if (gameWorldRef.current) gameWorldRef.current.isPaused = false;
          }}
          onRestartMission={() => {
            if (activeMission) handleStartMission(activeMission);
          }}
          onStartMission={handleStartMission}
          onOpenGarage={() => {
            setIsPaused(false);
            setGameState('garage');
          }}
          onOpenSettings={() => setShowSettings(true)}
          onReturnToMainMenu={() => {
            setIsPaused(false);
            setGameState('menu');
          }}
        />
      )}

      {/* MISSION COMPLETE / FAILED MODAL */}
      {missionModalData && (
        <MissionCompleteModal
          mission={missionModalData.mission}
          success={missionModalData.success}
          onRetry={() => {
            const m = missionModalData.mission;
            setMissionModalData(null);
            handleStartMission(m);
          }}
          onContinueDriving={() => {
            setMissionModalData(null);
          }}
          onReturnToMainMenu={() => {
            setMissionModalData(null);
            setGameState('menu');
          }}
        />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            if (gameWorldRef.current) {
              gameWorldRef.current.applyTimeOfDay(newSettings.timeOfDay);
            }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </main>
  );
}
