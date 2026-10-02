import { setStorage, storage } from "./util";

// Tiny synthesised sound effects: no audio files to download.
type Note = [freq: number, start: number, dur: number, type?: OscillatorType, gain?: number];

const SOUNDS: Record<string, Note[]> = {
  click: [[660, 0, 0.06, "square", 0.05]],
  open: [[523, 0, 0.09, "triangle"], [784, 0.08, 0.14, "triangle"]],
  line: [[523, 0, 0.08, "triangle"], [659, 0.07, 0.08, "triangle"], [784, 0.14, 0.18, "triangle"]],
  capture: [[523, 0, 0.1, "square", 0.06], [659, 0.1, 0.1, "square", 0.06], [784, 0.2, 0.1, "square", 0.06], [1047, 0.3, 0.3, "square", 0.07]],
  lost: [[392, 0, 0.18, "sawtooth", 0.05], [311, 0.16, 0.18, "sawtooth", 0.05], [262, 0.32, 0.35, "sawtooth", 0.05]],
  warn: [[880, 0, 0.08, "square", 0.04], [880, 0.14, 0.08, "square", 0.04]],
  good: [[784, 0, 0.07, "triangle"], [988, 0.07, 0.12, "triangle"]],
  error: [[220, 0, 0.15, "square", 0.04]],
  win: [[523, 0, 0.15, "triangle"], [659, 0.15, 0.15, "triangle"], [784, 0.3, 0.15, "triangle"], [1047, 0.45, 0.5, "triangle"]]
};

class Sound {
  private ctx: AudioContext | null = null;
  muted = storage("muted") === "1";

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  play(name: keyof typeof SOUNDS) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.01;
    for (const [freq, start, dur, type = "sine", gain = 0.08] of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t0 + start);
      g.gain.linearRampToValueAtTime(gain, t0 + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0 + start);
      osc.stop(t0 + start + dur + 0.02);
    }
  }

  toggle() {
    this.muted = !this.muted;
    setStorage("muted", this.muted ? "1" : "0");
    if (this.muted) this.stopMusic();
    else {
      this.play("click");
      if (this.musicOn) this.startMusic();
    }
  }

  // ---- background music: a gentle looping arpeggio, scheduled a little ahead of time ----
  musicOn = storage("music") === "1";
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private step = 0;

  toggleMusic() {
    this.musicOn = !this.musicOn;
    setStorage("music", this.musicOn ? "1" : "0");
    if (this.musicOn) this.startMusic();
    else this.stopMusic();
  }

  startMusic() {
    if (!this.musicOn || this.musicTimer) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.nextNote = ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.schedule(), 200);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || this.muted) return this.stopMusic();
    const eighth = 60 / 96 / 2; // 96 bpm
    // C – G – Am – F, each chord as a rising and falling arpeggio, with a soft bass note per bar
    const chords = [
      [261.6, 329.6, 392.0, 523.3],
      [196.0, 246.9, 293.7, 392.0],
      [220.0, 261.6, 329.6, 440.0],
      [174.6, 220.0, 261.6, 349.2]
    ];
    const order = [0, 1, 2, 3, 2, 1, 2, 1];
    while (this.nextNote < ctx.currentTime + 0.4) {
      const bar = Math.floor(this.step / 8) % chords.length;
      const chord = chords[bar];
      this.tone(ctx, chord[order[this.step % 8]] , this.nextNote, eighth * 0.9, "triangle", 0.018);
      if (this.step % 8 === 0) this.tone(ctx, chord[0] / 2, this.nextNote, eighth * 7.5, "sine", 0.03);
      this.nextNote += eighth;
      this.step++;
    }
  }

  private tone(ctx: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, gain: number) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }
}

export const sound = new Sound();
