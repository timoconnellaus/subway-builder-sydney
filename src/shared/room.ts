import { MAPS, Session, type GameState, type PlayerId } from "../sim";
import {
  BOT_NAMES,
  MAX_PLAYERS,
  SLOTS,
  type ClientMsg,
  type LobbyPlayer,
  type LobbyState,
  type RoomOptions,
  type ServerMsg
} from "./protocol";

// Transport-agnostic game room: the Durable Object wraps this, and tests drive it directly.

export interface Conn {
  id: string;
  send(msg: ServerMsg): void;
}

interface Member extends LobbyPlayer {
  token: string | null; // null for bots
  slot: number;
}

interface Saved {
  code: string;
  members: Member[];
  host: PlayerId | null;
  options: RoomOptions;
  phase: LobbyState["phase"];
  game: GameState | null;
  nextPlayer: number;
}

export const GAME_MINUTES_PER_SECOND = 1;

export class RoomCore {
  private members: Member[] = [];
  private host: PlayerId | null = null;
  private options: RoomOptions = { roundMinutes: 900 };
  private phase: LobbyState["phase"] = "lobby";
  private session: Session | null = null;
  private conns = new Map<string, { conn: Conn; player: PlayerId | null }>();
  private nextPlayer = 1;
  dirty = true;

  constructor(public code: string) {}

  static restore(json: string): RoomCore {
    const s: Saved = JSON.parse(json);
    const r = new RoomCore(s.code);
    r.members = s.members.map((m) => ({ ...m, connected: m.isBot }));
    r.host = s.host;
    r.options = s.options;
    r.phase = s.phase;
    r.nextPlayer = s.nextPlayer;
    if (s.game) {
      r.session = new Session(MAPS[s.game.mapId] ?? MAPS.sydney, s.game);
      for (const p of r.session.state.players) p.connected = p.isBot;
    }
    r.dirty = false;
    return r;
  }

  serialize(): string {
    const s: Saved = {
      code: this.code,
      members: this.members,
      host: this.host,
      options: this.options,
      phase: this.phase,
      game: this.session ? this.session.state : null,
      nextPlayer: this.nextPlayer
    };
    return JSON.stringify(s);
  }

  get running(): boolean {
    return this.phase === "game" && !!this.session;
  }

  get humansConnected(): number {
    let n = 0;
    for (const c of this.conns.values()) if (c.player) n++;
    return n;
  }

  get connectionCount(): number {
    return this.conns.size;
  }

  connect(conn: Conn) {
    this.conns.set(conn.id, { conn, player: null });
  }

  disconnect(connId: string) {
    const c = this.conns.get(connId);
    this.conns.delete(connId);
    if (!c?.player) return;
    const still = [...this.conns.values()].some((x) => x.player === c.player);
    if (still) return;
    const m = this.members.find((x) => x.id === c.player);
    if (m) m.connected = false;
    const gp = this.session?.state.players.find((p) => p.id === c.player);
    if (gp) gp.connected = false;
    if (this.host === c.player) {
      const next = this.members.find((x) => !x.isBot && x.connected);
      if (next) this.host = next.id;
    }
    this.dirty = true;
    this.broadcastLobby();
  }

  message(connId: string, msg: ClientMsg) {
    const c = this.conns.get(connId);
    if (!c) return;
    const send = (m: ServerMsg) => c.conn.send(m);
    if (msg.t === "ping") return send({ t: "pong", at: msg.at });
    if (msg.t === "hello") return this.hello(c, msg.name, msg.token);
    const me = c.player;
    if (!me) return send({ t: "error", message: "Say hello first." });
    const isHost = me === this.host;
    switch (msg.t) {
      case "cmd": {
        if (!this.session || this.phase !== "game") return send({ t: "ack", id: msg.id, ok: false, error: "The game hasn't started." });
        const r = this.session.command(me, msg.cmd);
        this.dirty = true;
        return send(r.ok ? { t: "ack", id: msg.id, ok: true } : { t: "ack", id: msg.id, ok: false, error: r.error });
      }
      case "addBot": {
        if (!isHost || this.phase !== "lobby") return;
        const slot = this.freeSlot();
        if (slot < 0) return send({ t: "error", message: "The room is full." });
        this.members.push({
          id: `P${this.nextPlayer++}`,
          name: BOT_NAMES[msg.style],
          color: SLOTS[slot].color,
          hub: SLOTS[slot].hub,
          isBot: true,
          botStyle: msg.style,
          connected: true,
          token: null,
          slot
        });
        break;
      }
      case "removePlayer": {
        if (!isHost || this.phase !== "lobby" || msg.id === me) return;
        this.members = this.members.filter((m) => m.id !== msg.id);
        for (const x of this.conns.values()) if (x.player === msg.id) x.player = null;
        break;
      }
      case "setSlot": {
        if (this.phase !== "lobby") return;
        const slot = Math.floor(msg.slot);
        if (slot < 0 || slot >= SLOTS.length || this.members.some((m) => m.slot === slot)) return;
        const m = this.members.find((x) => x.id === me)!;
        m.slot = slot;
        m.color = SLOTS[slot].color;
        m.hub = SLOTS[slot].hub;
        break;
      }
      case "setOptions": {
        if (!isHost || this.phase !== "lobby") return;
        const rm = msg.options.roundMinutes;
        if (rm && [300, 600, 900, 1200].includes(rm)) this.options.roundMinutes = rm;
        break;
      }
      case "start": {
        if (!isHost || this.phase !== "lobby") return;
        if (this.members.length < 2) return send({ t: "error", message: "Add a bot or wait for a friend to join." });
        this.startGame();
        break;
      }
      case "rematch": {
        if (!isHost || this.phase === "lobby") return;
        this.phase = "lobby";
        this.session = null;
        break;
      }
    }
    this.dirty = true;
    this.broadcastLobby();
  }

  private hello(c: { conn: Conn; player: PlayerId | null }, rawName: string, token: string) {
    const name = (rawName || "Player").replace(/[^\p{L}\p{N} '._-]/gu, "").trim().slice(0, 16) || "Player";
    let m = token ? this.members.find((x) => x.token === token) : undefined;
    if (!m && this.phase === "lobby") {
      const slot = this.freeSlot();
      if (slot >= 0) {
        m = {
          id: `P${this.nextPlayer++}`,
          name,
          color: SLOTS[slot].color,
          hub: SLOTS[slot].hub,
          isBot: false,
          connected: true,
          token,
          slot
        };
        this.members.push(m);
      }
    }
    if (m) {
      m.connected = true;
      if (this.phase === "lobby") m.name = name;
      c.player = m.id;
      const gp = this.session?.state.players.find((p) => p.id === m!.id);
      if (gp) gp.connected = true;
      if (!this.host || !this.members.find((x) => x.id === this.host && x.connected)) this.host = m.id;
    }
    c.conn.send({ t: "welcome", you: c.player ?? "spectator", room: this.code });
    if (!m && this.phase === "lobby") c.conn.send({ t: "error", message: "This room is full. You're watching." });
    this.dirty = true;
    this.broadcastLobby();
    if (this.session) c.conn.send({ t: "snap", s: this.session.snapshot() });
  }

  private freeSlot(): number {
    if (this.members.length >= MAX_PLAYERS) return -1;
    for (let i = 0; i < SLOTS.length; i++) if (!this.members.some((m) => m.slot === i)) return i;
    return -1;
  }

  private startGame() {
    const map = MAPS.sydney;
    const sorted = [...this.members].sort((a, b) => a.slot - b.slot);
    this.session = Session.create(
      map,
      sorted.map((m) => ({ id: m.id, name: m.name, color: m.color, hub: m.hub, isBot: m.isBot, botStyle: m.botStyle })),
      { roundMinutes: this.options.roundMinutes }
    );
    for (const p of this.session.state.players) p.connected = p.isBot || this.members.find((m) => m.id === p.id)!.connected;
    this.phase = "game";
  }

  lobby(): LobbyState {
    return {
      room: this.code,
      host: this.host,
      players: [...this.members]
        .sort((a, b) => a.slot - b.slot)
        .map(({ token: _t, slot: _s, ...p }) => p),
      options: this.options,
      phase: this.phase
    };
  }

  private broadcastLobby() {
    const msg: ServerMsg = { t: "lobby", lobby: this.lobby() };
    for (const c of this.conns.values()) c.conn.send(msg);
  }

  /** Advance the game by real seconds and broadcast a snapshot. */
  tick(seconds: number) {
    if (!this.session || this.phase !== "game") return;
    this.session.tick(seconds * GAME_MINUTES_PER_SECOND);
    this.dirty = true;
    const snap = this.session.snapshot();
    const msg: ServerMsg = { t: "snap", s: snap };
    for (const c of this.conns.values()) c.conn.send(msg);
    if (this.session.state.phase === "over") {
      this.phase = "over";
      this.broadcastLobby();
    }
  }
}
