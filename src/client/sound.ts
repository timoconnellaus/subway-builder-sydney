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

/** One enveloped note. */
function tone(ctx: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, gain: number, attack: number, out: AudioNode = ctx.destination) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(gain, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

// background music: C – G – Am – F at 96 bpm, each chord as a rising and falling arpeggio
const EIGHTH = 60 / 96 / 2;
const CHORDS = [
  [261.6, 329.6, 392.0, 523.3],
  [196.0, 246.9, 293.7, 392.0],
  [220.0, 261.6, 329.6, 440.0],
  [174.6, 220.0, 261.6, 349.2]
];
const ARPEGGIO = [0, 1, 2, 3, 2, 1, 2, 1];

class Sound {
  private ctx: AudioContext | null = null;
  muted = storage("muted") === "1";

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      // browsers only allow audio after the player has tapped or clicked something
      if (!(navigator.userActivation?.hasBeenActive ?? true)) return null;
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
    for (const [freq, start, dur, type = "sine", gain = 0.08] of SOUNDS[name]) tone(ctx, freq, t0 + start, dur, type, gain, 0.01);
  }

  toggle() {
    this.muted = !this.muted;
    setStorage("muted", this.muted ? "1" : "0");
    if (this.muted) this.stopMusic(false);
    else {
      this.play("click");
      if (this.musicOn) this.startMusic();
    }
  }

  // ---- background music: a gentle looping arpeggio, scheduled a little ahead of time ----
  musicOn = storage("music") === "1";
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicOut: GainNode | null = null;
  private nextNote = 0;
  private step = 0;

  toggleMusic() {
    this.musicOn = !this.musicOn;
    setStorage("music", this.musicOn ? "1" : "0");
    if (this.musicOn) this.startMusic();
    else this.stopMusic(false);
  }

  private inGame = false; // music only plays on the game screen

  /** Start (or, from a tap, unlock) the music. Safe to call repeatedly. */
  startMusic() {
    this.inGame = true;
    if (!this.musicOn || document.hidden) return;
    const ctx = this.ensure(); // resumes a suspended context when called from a tap
    if (!ctx || this.musicTimer) return;
    // music has its own volume control, so stopping can silence notes already queued
    this.musicOut = ctx.createGain();
    this.musicOut.connect(ctx.destination);
    this.nextNote = ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.schedule(), 200);
  }

  /** Stop the music; `leaving` the game screen means it stays off until the next game. */
  stopMusic(leaving = true) {
    if (leaving) this.inGame = false;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.musicOut && this.ctx) {
      const out = this.musicOut;
      out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      setTimeout(() => out.disconnect(), 400);
    }
    this.musicOut = null;
  }

  /** Background tabs pause the music; coming back resumes it if a game is on screen. */
  visibility(hidden: boolean) {
    if (hidden) this.stopMusic(false);
    else if (this.inGame) this.startMusic();
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || this.muted) return this.stopMusic(false);
    // after a stall (background tab) skip ahead rather than playing a pile of late notes
    this.nextNote = Math.max(this.nextNote, ctx.currentTime + 0.05);
    while (this.nextNote < ctx.currentTime + 0.4) {
      const chord = CHORDS[Math.floor(this.step / 8) % CHORDS.length];
      const out = this.musicOut ?? ctx.destination;
      tone(ctx, chord[ARPEGGIO[this.step % 8]], this.nextNote, EIGHTH * 0.9, "triangle", 0.018, 0.02, out);
      if (this.step % 8 === 0) tone(ctx, chord[0] / 2, this.nextNote, EIGHTH * 7.5, "sine", 0.03, 0.02, out);
      this.nextNote += EIGHTH;
      this.step++;
    }
  }
}

export const sound = new Sound();

// no music from a hidden tab
document.addEventListener("visibilitychange", () => sound.visibility(document.hidden));
