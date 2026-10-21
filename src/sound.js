// ASMR Web Audio API Synthesizer - Ultra-Satisfying Acoustic & Harmonic Textures
class SoundFX {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // ASMR Wooden Key / Marimba Thock (Soft, warm, tactile click)
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sine';
    // Gentle drop from 680Hz to 280Hz gives tactile wooden marble click
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.038);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // ASMR Water Droplet / Crystal Chime Harmonic (Soft ascending shimmer)
  playStepNext() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    
    // Fundamental tone
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, t); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, t + 0.14); // E5

    gain1.gain.setValueAtTime(0.08, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    // Subtle overtone shimmer (Major 9th - D6)
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, t + 0.03); // D6
    gain2.gain.setValueAtTime(0.03, t + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);

    osc1.start(t);
    osc1.stop(t + 0.18);
    osc2.start(t + 0.03);
    osc2.stop(t + 0.22);
  }

  // ASMR Velvet Breath / Soft Ambient Reverse Air Puff
  playStepPrev() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.16);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.16);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // ASMR Crystal Cutting Laser / Tibetan Singing Bowl Resonant Chime
  playCutLaser() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const freqs = [587.33, 880.0, 1318.51]; // D5, A5, E6 (Open pure fifth)

    freqs.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.045 / (i + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.48);
    });
  }

  // ASMR Tactile Wooden Tumbler Tick
  playSuspenseTick(freq = 720) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.024);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.024);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.025);
  }

  // ASMR Ethereal Major 9th Ambient Bloom (Dreamy, euphoric win state)
  playRollRevealFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    // C Major 9th chord: C4, G4, B4, D5, G5
    const chord = [261.63, 392.00, 493.88, 587.33, 783.99];

    chord.forEach((note, idx) => {
      const noteDelay = idx * 0.04;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, t + noteDelay);

      gain.gain.setValueAtTime(0.001, t + noteDelay);
      gain.gain.linearRampToValueAtTime(0.07, t + noteDelay + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + noteDelay + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t + noteDelay);
      osc.stop(t + noteDelay + 1.25);
    });
  }

  // ASMR Soft Tactile Bubble Pop (For font scale, toggles, switches)
  playBubblePop(pitchMod = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    const startF = 420 * pitchMod;
    const endF = 840 * pitchMod;
    osc.frequency.setValueAtTime(startF, t);
    osc.frequency.exponentialRampToValueAtTime(endF, t + 0.04);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Audience Applause & Cheering (Layered pink-noise bursts with high-frequency handclap envelope)
  playApplause() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const duration = 1.6;
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 2.8;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.Q.setValueAtTime(1.8, t);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.25);
    gain.gain.linearRampToValueAtTime(0.10, t + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(t);
    noise.stop(t + duration);

    // Staccato individual handclap impacts
    for (let k = 0; k < 12; k++) {
      const clapTime = t + 0.08 + Math.random() * 1.3;
      const osc = this.audioCtx.createOscillator();
      const clapGain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 + Math.random() * 300, clapTime);
      clapGain.gain.setValueAtTime(0.045, clapTime);
      clapGain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.04);
      osc.connect(clapGain);
      clapGain.connect(this.audioCtx.destination);
      osc.start(clapTime);
      osc.stop(clapTime + 0.045);
    }
  }

  // Dramatic Game-Show "Wrong Answer" Buzzer (Dual low sawtooth with vibrato)
  playBuzzer() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    [130.81, 138.59].forEach((freq) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq - 12, t + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.setValueAtTime(0.09, t + 0.28);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.40);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.42);
    });
  }

  // Suspense Drum Roll (Rapid accelerating snare impacts leading to a crash)
  playDrumRoll() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const hits = 18;
    for (let i = 0; i < hits; i++) {
      const hitTime = t + (i * 0.065);
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + (i * 4), hitTime);
      gain.gain.setValueAtTime(0.03 + (i * 0.004), hitTime);
      gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.035);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(hitTime);
      osc.stop(hitTime + 0.04);
    }

    // Final cymbal / thud impact
    const crashTime = t + (hits * 0.065);
    const crashOsc = this.audioCtx.createOscillator();
    const crashGain = this.audioCtx.createGain();
    crashOsc.type = 'sine';
    crashOsc.frequency.setValueAtTime(120, crashTime);
    crashOsc.frequency.exponentialRampToValueAtTime(45, crashTime + 0.35);
    crashGain.gain.setValueAtTime(0.12, crashTime);
    crashGain.gain.exponentialRampToValueAtTime(0.001, crashTime + 0.4);

    crashOsc.connect(crashGain);
    crashGain.connect(this.audioCtx.destination);
    crashOsc.start(crashTime);
    crashOsc.stop(crashTime + 0.42);
  }

  // Futuristic High-Voltage Laser Slicing Blast
  playLaserBlast() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.28);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(450, t + 0.28);
    filter.Q.setValueAtTime(3.5, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  // ASMR Eureka Chime (Sparkling major arpeggio: C6, E6, G6, C7)
  playEurekaChime() {
    if (this.muted) return;
    this.init();
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    const notes = [1046.50, 1318.51, 1567.98, 2093.00];

    notes.forEach((freq, idx) => {
      const noteTime = t + (idx * 0.06);
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0005, noteTime + 0.55);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.6);
    });
  }
}

export const sound = new SoundFX();
