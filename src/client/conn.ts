import { cleanRules, createTutorial, MAPS, Session, type BotStyle, type Command, type CommandResult, type HouseRules, type PlayerId, type Snapshot } from "../sim";
import { BOT_NAMES, botSeats, seat, type ClientMsg, type LobbyState, type ServerMsg } from "../shared/protocol";
import type { GameState } from "../sim";
import { setStorage, storage } from "./util";

const SAVE_KEY = "local-save";

/** A saved single-player game, if there is one still running. */
export function savedLocalGame(): { opts: LocalOptions; state: GameState } | null {
  try {
    const raw = storage(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as { opts: LocalOptions; state: GameState };
    return save.state?.phase === "running" ? save : null;
  } catch {
    return null;
  }
}
export function clearLocalSave() {
  setStorage(SAVE_KEY, "");
}

/** What the game screen needs, whether the game runs in this browser or on the server. */
export interface GameConn {
  readonly you: PlayerId;
  readonly mapId: string;
  readonly local: boolean;
  readonly daily?: string;
  readonly tour?: number; // World Tour stop being played
  onSnapshot(cb: (s: Snapshot) => void): () => void;
  command(cmd: Command): Promise<CommandResult>;
  close(): void;
  // local only
  speed?: number;
  setSpeed?(x: number): void;
  paused?: boolean;
  setPaused?(p: boolean): void;
  restart?(): void;
  canPause?(): boolean;
  // online only
  emote?(e: string): void;
  onEmote?(cb: (from: PlayerId, e: string) => void): () => void;
}

export interface LocalOptions {
  name: string;
  bots: BotStyle[];
  roundMinutes: number;
  rules: HouseRules;
  tutorial?: boolean;
  map?: string;
  watch?: boolean; // bots only, you just watch
  daily?: string; // date of the daily challenge being played (a label; the setup is in the fields above)
  tour?: number; // World Tour stop
  slot?: number; // your seat, default 0
  seed?: number; // fixed random seed
}

export class LocalGame implements GameConn {
  get you() {
    return this.opts.watch ? "spectator" : "P1";
  }
  readonly local = true;
  speed = 1;
  paused = false;
  private session!: Session;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(s: Snapshot) => void>();
  private last = 0;

  private lastSave = 0;
  constructor(private opts: LocalOptions, resume?: GameState) {
    if (resume) {
      this.session = new Session(MAPS[resume.mapId] ?? MAPS.sydney, resume);
      this.paused = true; // resume paused so nobody is caught out
      this.last = performance.now();
      this.timer = setInterval(() => this.loop(), 100);
      this.emit();
    } else this.restart();
    window.addEventListener("pagehide", this.save);
  }

  /** Save the game so it can be continued after closing the tab. */
  save = () => {
    try {
      if (this.opts.tutorial || this.opts.watch) return;
      if (this.session.state.phase !== "running") return clearLocalSave();
      setStorage(SAVE_KEY, JSON.stringify({ opts: this.opts, state: this.session.state }));
    } catch {
      /* storage full or unavailable */
    }
  };

  get tutorial() {
    return !!this.opts.tutorial;
  }
  get daily() {
    return this.opts.daily;
  }
  get tour() {
    return this.opts.tour;
  }
  get mapId() {
    return this.opts.tutorial ? "sydney" : this.opts.map && MAPS[this.opts.map] ? this.opts.map : "sydney";
  }

  restart() {
    if (this.opts.tutorial) return this.startTutorial();
    // you take your seat (default the first); bots fill the other seats in order
    const slot = this.opts.watch ? -1 : (this.opts.slot ?? 0);
    const human = slot < 0 ? [] : [{ id: "P1", name: this.opts.name || "You", ...seat(this.mapId, slot) }];
    const free = botSeats(slot, this.opts.bots.length);
    const bots = this.opts.bots.map((style, i) => ({
      id: `P${i + 1 + human.length}`,
      name: BOT_NAMES[style],
      ...seat(this.mapId, free[i]),
      isBot: true,
      botStyle: style
    }));
    this.session = Session.create(MAPS[this.mapId], [...human, ...bots], { ...cleanRules(this.opts.rules), roundMinutes: this.opts.roundMinutes }, this.opts.seed);
    this.begin();
  }

  /** Start running this.session. */
  private begin() {
    this.paused = false;
    if (!this.timer) {
      this.last = performance.now();
      this.timer = setInterval(() => this.loop(), 100);
    }
    this.emit();
  }

  /** A calm practice game: one sleepy rival that never changes its line. */
  private startTutorial() {
    this.session = createTutorial(this.opts.name || "You");
    this.begin();
  }

  private loop() {
    const now = performance.now();
    const dt = Math.min(0.5, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused && this.session.state.phase === "running") this.session.tick(dt * this.speed);
    if (now - this.lastSave > 10_000) {
      this.lastSave = now;
      this.save();
    }
    this.emit();
  }

  private emit() {
    const s = this.session.snapshot();
    for (const l of this.listeners) l(s);
  }

  onSnapshot(cb: (s: Snapshot) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async command(cmd: Command): Promise<CommandResult> {
    const r = this.session.command(this.you, cmd);
    this.emit();
    return r;
  }

  setSpeed(x: number) {
    this.speed = x;
  }
  setPaused(p: boolean) {
    this.paused = p;
  }
  canPause() {
    return true;
  }

  close() {
    this.save();
    window.removeEventListener("pagehide", this.save);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.listeners.clear();
  }
}

/** A connection to an online room. Reconnects automatically. */
export class RemoteRoom implements GameConn {
  readonly local = false;
  you: PlayerId = "spectator";
  lobby: LobbyState | null = null;
  status: "connecting" | "open" | "closed" = "connecting";
  lastSnapshot: Snapshot | null = null;
  private ws: WebSocket | null = null;
  private snapListeners = new Set<(s: Snapshot) => void>();
  private lobbyListeners = new Set<(l: LobbyState) => void>();
  private statusListeners = new Set<(s: RemoteRoom["status"], message?: string) => void>();
  private emoteListeners = new Set<(from: PlayerId, e: string) => void>();
  private pending = new Map<number, (r: CommandResult) => void>();
  private nextId = 1;
  private closed = false;
  private retry = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  latency = 0;

  constructor(public code: string, private name: string, private token: string) {
    this.open();
  }

  private open() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/api/rooms/${this.code}/ws`);
    this.ws = ws;
    this.setStatus("connecting");
    ws.onopen = () => {
      this.retry = 0;
      this.send({ t: "hello", name: this.name, token: this.token });
      this.setStatus("open");
      this.pingTimer = setInterval(() => this.send({ t: "ping", at: performance.now() }), 5000);
    };
    ws.onmessage = (ev) => {
      let msg: ServerMsg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      this.handle(msg);
    };
    ws.onclose = () => {
      if (this.pingTimer) clearInterval(this.pingTimer);
      this.pingTimer = null;
      for (const [, res] of this.pending) res({ ok: false, error: "Connection lost." });
      this.pending.clear();
      if (this.closed) return;
      this.setStatus("closed", "Reconnecting…");
      const wait = Math.min(8000, 500 * 2 ** this.retry++);
      setTimeout(() => !this.closed && this.open(), wait);
    };
  }

  private handle(msg: ServerMsg) {
    switch (msg.t) {
      case "welcome":
        this.you = msg.you;
        break;
      case "lobby":
        if (msg.lobby.phase === "lobby") this.lastSnapshot = null; // the next game starts fresh
        this.lobby = msg.lobby;
        for (const l of this.lobbyListeners) l(msg.lobby);
        break;
      case "snap":
        this.lastSnapshot = msg.s;
        for (const l of this.snapListeners) l(msg.s);
        break;
      case "ack": {
        const res = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        res?.(msg.ok ? { ok: true } : { ok: false, error: msg.error ?? "That didn't work." });
        break;
      }
      case "error":
        for (const l of this.statusListeners) l(this.status, msg.message);
        break;
      case "pong":
        this.latency = performance.now() - msg.at;
        break;
      case "emote":
        for (const l of this.emoteListeners) l(msg.from, msg.e);
        break;
    }
  }

  private setStatus(s: RemoteRoom["status"], message?: string) {
    this.status = s;
    for (const l of this.statusListeners) l(s, message);
  }

  send(msg: ClientMsg) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  onSnapshot(cb: (s: Snapshot) => void) {
    this.snapListeners.add(cb);
    if (this.lastSnapshot) cb(this.lastSnapshot);
    return () => this.snapListeners.delete(cb);
  }
  onLobby(cb: (l: LobbyState) => void) {
    this.lobbyListeners.add(cb);
    if (this.lobby) cb(this.lobby);
    return () => this.lobbyListeners.delete(cb);
  }
  onStatus(cb: (s: RemoteRoom["status"], message?: string) => void) {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  get paused() {
    return !!this.lobby?.paused;
  }
  get mapId() {
    return this.lobby?.options.map ?? this.lastSnapshot?.mapId ?? "sydney";
  }
  setPaused(p: boolean) {
    this.send({ t: "pause", paused: p });
  }
  canPause() {
    return this.lobby?.host === this.you;
  }
  emote(e: string) {
    this.send({ t: "emote", e });
  }
  onEmote(cb: (from: PlayerId, e: string) => void) {
    this.emoteListeners.add(cb);
    return () => this.emoteListeners.delete(cb);
  }

  command(cmd: Command): Promise<CommandResult> {
    return new Promise((resolve) => {
      if (this.ws?.readyState !== WebSocket.OPEN) return resolve({ ok: false, error: "Not connected." });
      const id = this.nextId++;
      this.pending.set(id, resolve);
      this.send({ t: "cmd", id, cmd });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          resolve({ ok: false, error: "The server didn't answer." });
        }
      }, 8000);
    });
  }

  /** Change your name in the lobby; reconnects say hello with it too. */
  setName(name: string) {
    this.name = name;
    this.send({ t: "setName", name });
  }

  close() {
    this.closed = true;
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.ws?.close();
    this.snapListeners.clear();
    this.lobbyListeners.clear();
    this.statusListeners.clear();
    this.emoteListeners.clear();
  }
}
