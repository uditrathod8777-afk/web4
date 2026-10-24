/**
 * Procedural Web Audio Sound Engine for Udit's Open World.
 * Generates all sound effects and engine rumble in real-time with zero external audio files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Engine sound state
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Drift skid sound state
  private skidSource: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Volumes
  private masterVol = 0.7;
  private engineVol = 0.6;
  private sfxVol = 0.8;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVol;
      this.masterGain.connect(this.ctx.destination);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = this.engineVol;
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.masterGain);

      // Create 1-second white noise buffer for tire skids & wind
      const sampleRate = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, sampleRate, sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < sampleRate; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } catch {
      // AudioContext unavailable
    }
  }

  public unlock() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolumes(master: number, engine: number, sfx: number, muted = false) {
    this.masterVol = master;
    this.engineVol = engine;
    this.sfxVol = sfx;
    this.isMuted = muted;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : master, this.ctx.currentTime, 0.05);
    }
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(engine, this.ctx.currentTime, 0.05);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
    }
  }

  public startEngine() {
    this.initContext();
    if (!this.ctx || !this.engineGain || this.isEngineRunning) return;

    try {
      this.osc1 = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.osc1.type = 'sawtooth';
      this.osc2.type = 'triangle';

      this.osc1.frequency.setValueAtTime(45, this.ctx.currentTime);
      this.osc2.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      const oscGain1 = this.ctx.createGain();
      oscGain1.gain.value = 0.5;
      const oscGain2 = this.ctx.createGain();
      oscGain2.gain.value = 0.4;

      this.osc1.connect(oscGain1);
      this.osc2.connect(oscGain2);

      oscGain1.connect(this.engineFilter);
      oscGain2.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);

      this.osc1.start();
      this.osc2.start();
      this.isEngineRunning = true;
    } catch {
      // Audio node failure
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2.disconnect();
        this.osc2 = null;
      }
      this.isEngineRunning = false;
    } catch {
      // ignore
    }
  }

  public updateEnginePitch(rpmFactor: number, throttle: number) {
    if (!this.ctx || !this.isEngineRunning || !this.osc1 || !this.osc2 || !this.engineFilter) return;

    // rpmFactor ranges from 0.0 (idle) to 1.0 (redline)
    const baseFreq = 40 + rpmFactor * 130 + (throttle > 0 ? 15 : 0);
    const filterFreq = 180 + rpmFactor * 800 + (throttle > 0 ? 300 : 0);

    const now = this.ctx.currentTime;
    this.osc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.osc2.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
  }

  public updateTireSkid(intensity: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    if (intensity > 0.05) {
      if (!this.skidGain) {
        this.skidGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 1.8;

        this.skidSource = this.ctx.createBufferSource();
        this.skidSource.buffer = this.noiseBuffer;
        this.skidSource.loop = true;

        this.skidSource.connect(filter);
        filter.connect(this.skidGain);
        this.skidGain.connect(this.sfxGain);

        this.skidGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.skidSource.start();
      }

      const clamped = Math.min(1.0, Math.max(0.0, intensity));
      this.skidGain.gain.setTargetAtTime(clamped * 0.45, this.ctx.currentTime, 0.05);
    } else if (this.skidGain) {
      this.skidGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        if (this.skidGain && this.skidGain.gain.value < 0.01) {
          try {
            this.skidSource?.stop();
            this.skidSource?.disconnect();
            this.skidGain?.disconnect();
          } catch {
            // ignore
          }
          this.skidSource = null;
          this.skidGain = null;
        }
      }, 150);
    }
  }

  public playCrash(impactSpeed = 1.0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 * Math.min(2.0, impactSpeed), now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.28);

    const volume = Math.min(0.9, 0.3 + impactSpeed * 0.4);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);

    // Also burst noise for metal/crunch
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseGain = this.ctx.createGain();
      const noiseFilter = this.ctx.createBiquadFilter();

      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseGain.gain.setValueAtTime(volume * 0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.25);
    }
  }

  public playCoin() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    osc2.frequency.setValueAtTime(1975.53, now); // B6
    osc2.frequency.setValueAtTime(2637.02, now + 0.08); // E7

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  }

  public playCheckpoint() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.2, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.45);
    });
  }

  public playVictory() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    chords.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.28, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.85);
    });
  }

  public playFail() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [440, 415, 392, 349];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.2, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
  }

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const sound = new SoundEngine();
