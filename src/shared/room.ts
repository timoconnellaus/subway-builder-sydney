import { cleanRules, MAPS, Session, type GameState, type PlayerId } from "../sim";
import {
  BOT_NAMES,
  EMOTES,
  MAX_PLAYERS,
  cleanPlayerName,
  minRoundFor,
  ROUND_CHOICES,
  SLOTS,
  startRound,
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
  leftAt?: number; // when they last disconnected
}

interface Saved {
  code: string;
  members: Member[];
  host: PlayerId | null;
  owner?: PlayerId | null;
  options: RoomOptions;
  phase: LobbyState["phase"];
  game: GameState | null;
  nextPlayer: number;
  paused?: boolean; // older saves
  pausedBy?: PlayerId | null;
  wins?: Record<PlayerId, number>;
  rounds?: number;
}

export const GAME_MINUTES_PER_SECOND = 1;

/** Check a message from a client has the right shape; returns null if not. */
export function checkMessage(raw: unknown): ClientMsg | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Record<string, unknown>;
  const str = (v: unknown, max = 200) => typeof v === "string" && v.length <= max;
  switch (m.t) {
    case "hello":
      return str(m.name, 64) && str(m.token, 200) ? (m as ClientMsg) : null;
    case "addBot":
      return str(m.style, 20) ? (m as ClientMsg) : null;
    case "removePlayer":
      return str(m.id, 20) ? (m as ClientMsg) : null;
    case "setSlot":
      return typeof m.slot === "number" ? (m as ClientMsg) : null;
    case "setName":
      return str(m.name, 64) ? (m as ClientMsg) : null;
    case "setOptions":
      return m.options && typeof m.options === "object" ? (m as ClientMsg) : null;
    case "start":
    case "rematch":
      return m as ClientMsg;
    case "pause":
      return typeof m.paused === "boolean" ? (m as ClientMsg) : null;
    case "emote":
      return str(m.e, 16) ? (m as ClientMsg) : null;
    case "cmd":
      return typeof m.id === "number" && m.cmd && typeof m.cmd === "object" ? (m as ClientMsg) : null;
    case "ping":
      return typeof m.at === "number" ? (m as ClientMsg) : null;
    default:
      return null;
  }
}

export class RoomCore {
  private members: Member[] = [];
  private host: PlayerId | null = null;
  // whoever made the room: hosting passes to someone else while they're away, and back when they return
  private owner: PlayerId | null = null;
  private options: RoomOptions = { roundMinutes: 900, rules: {}, map: "sydney" };
  private phase: LobbyState["phase"] = "lobby";
  private session: Session | null = null;
  private conns = new Map<string, { conn: Conn; player: PlayerId | null; greeted: boolean; bucket: number; last: number }>();
  private nextPlayer = 1;
  private pausedBy: PlayerId | null = null; // who pressed pause; null while running
  private snapDue = false; // a change clients haven't seen yet (matters while paused, when nothing ticks)
  private wins: Record<PlayerId, number> = {};
  private rounds = 0;
  private lastEmote = new Map<string, number>();
  dirty = true;

  constructor(public code: string) {}

  static restore(json: string): RoomCore {
    const s: Saved = JSON.parse(json);
    const r = new RoomCore(s.code);
    r.members = s.members.map((m) => ({ ...m, connected: m.isBot }));
    r.host = s.host;
    r.owner = s.owner ?? s.host;
    r.options = { roundMinutes: s.options.roundMinutes ?? 900, rules: s.options.rules ?? {}, map: s.options.map ?? "sydney" };
    r.phase = s.phase;
    r.nextPlayer = s.nextPlayer;
    r.pausedBy = s.pausedBy ?? (s.paused ? s.host : null);
    r.wins = s.wins ?? {};
    r.rounds = s.rounds ?? 0;
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
      owner: this.owner,
      options: this.options,
      phase: this.phase,
      game: this.session ? this.session.state : null,
      nextPlayer: this.nextPlayer,
      pausedBy: this.pausedBy,
      wins: this.wins,
      rounds: this.rounds
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
    this.conns.set(conn.id, { conn, player: null, greeted: false, bucket: 20, last: Date.now() });
  }

  /** Is anyone actually connected as this player right now? */
  private live(id: PlayerId): boolean {
    for (const c of this.conns.values()) if (c.player === id) return true;
    return false;
  }

  disconnect(connId: string) {
    const c = this.conns.get(connId);
    this.conns.delete(connId);
    if (!c?.player) return;
    const still = [...this.conns.values()].some((x) => x.player === c.player);
    if (still) return;
    const m = this.members.find((x) => x.id === c.player);
    if (m) {
      m.connected = false;
      m.leftAt = Date.now();
    }
    const gp = this.session?.state.players.find((p) => p.id === c.player);
    if (gp) {
      gp.connected = false;
      this.snapDue = true;
    }
    if (this.host === c.player) {
      const next = this.members.find((x) => !x.isBot && this.live(x.id));
      if (next) this.host = next.id;
    }
    this.dirty = true;
    this.broadcastLobby();
  }

  message(connId: string, raw: unknown) {
    const c = this.conns.get(connId);
    if (!c) return;
    const send = (m: ServerMsg) => c.conn.send(m);
    // simple rate limit: 20 messages per second burst, refilled at 10 per second
    const now = Date.now();
    c.bucket = Math.min(20, c.bucket + ((now - c.last) / 1000) * 10);
    c.last = now;
    if (c.bucket < 1) return;
    c.bucket -= 1;
    const msg = checkMessage(raw);
    if (!msg) return send({ t: "error", message: "That message didn't make sense." });
    if (msg.t === "ping") return send({ t: "pong", at: msg.at });
    if (msg.t === "hello") {
      if (c.greeted) return; // one identity per connection
      c.greeted = true;
      return this.hello(c, msg.name, msg.token);
    }
    const me = c.player;
    if (!me) return send({ t: "error", message: "Say hello first." });
    const isHost = me === this.host;
    switch (msg.t) {
      case "cmd": {
        if (!this.session || this.phase !== "game") return send({ t: "ack", id: msg.id, ok: false, error: "The game hasn't started." });
        const r = this.session.command(me, msg.cmd);
        this.dirty = true;
        if (r.ok) this.snapDue = true; // a paused room still sends it on the next tick
        return send(r.ok ? { t: "ack", id: msg.id, ok: true } : { t: "ack", id: msg.id, ok: false, error: r.error });
      }
      case "addBot": {
        if (!isHost || this.phase !== "lobby") return;
        if (!Object.prototype.hasOwnProperty.call(BOT_NAMES, msg.style)) return;
        // the row the host tapped, or the first free seat
        const slot = msg.slot !== undefined && this.slotFree(msg.slot) ? msg.slot : this.freeSlot();
        if (slot < 0) return send({ t: "error", message: "The room is full." });
        this.members.push({
          id: `P${this.nextPlayer++}`,
          name: BOT_NAMES[msg.style],
          color: SLOTS[slot].color,
          isBot: true,
          botStyle: msg.style,
          connected: true,
          token: null,
          slot
        });
        break;
      }
      case "setName": {
        if (this.phase !== "lobby") return;
        const m = this.members.find((x) => x.id === me);
        const name = cleanPlayerName(msg.name);
        if (!m || !name) return;
        m.name = name;
        break;
      }
      case "removePlayer": {
        if (!isHost || this.phase !== "lobby" || msg.id === me) return;
        this.members = this.members.filter((m) => m.id !== msg.id);
        for (const x of this.conns.values()) if (x.player === msg.id) x.player = null;
        if (this.owner === msg.id) this.owner = me;
        break;
      }
      case "setSlot": {
        if (this.phase !== "lobby") return;
        const slot = msg.slot;
        if (!this.slotFree(slot)) return;
        const m = this.members.find((x) => x.id === me)!;
        m.slot = slot;
        m.color = SLOTS[slot].color;
        break;
      }
      case "setOptions": {
        if (!isHost || this.phase !== "lobby") return;
        const rm = msg.options.roundMinutes;
        if (rm && (ROUND_CHOICES as readonly number[]).includes(rm)) this.options.roundMinutes = rm;
        if (msg.options.rules) this.options.rules = cleanRules(msg.options.rules) as RoomOptions["rules"];
        if (typeof msg.options.map === "string" && Object.prototype.hasOwnProperty.call(MAPS, msg.options.map)) {
          this.options.map = msg.options.map;
          if (!rm) this.options.roundMinutes = Math.max(this.options.roundMinutes, minRoundFor(this.options.map));
        }
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
        this.pausedBy = null;
        break;
      }
      case "pause": {
        if (!isHost || this.phase !== "game") return;
        this.pausedBy = msg.paused ? me : null;
        break;
      }
      case "emote": {
        if (!(EMOTES as readonly string[]).includes(msg.e)) return;
        const now = Date.now();
        if (now - (this.lastEmote.get(me) ?? 0) < 1200) return;
        this.lastEmote.set(me, now);
        const out: ServerMsg = { t: "emote", from: me, e: msg.e };
        for (const x of this.conns.values()) x.conn.send(out);
        return;
      }
    }
    this.dirty = true;
    this.broadcastLobby();
  }

  private hello(c: { conn: Conn; player: PlayerId | null }, rawName: string, token: string) {
    const name = cleanPlayerName(rawName) || "Player";
    let m = token ? this.members.find((x) => x.token === token) : undefined;
    if (!m && this.phase === "lobby") {
      const slot = this.freeSlot();
      if (slot >= 0) {
        m = {
          id: `P${this.nextPlayer++}`,
          name,
          color: SLOTS[slot].color,
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
      m.leftAt = undefined;
      if (this.phase === "lobby") m.name = name;
      c.player = m.id;
      const gp = this.session?.state.players.find((p) => p.id === m!.id);
      if (gp) {
        gp.connected = true;
        this.snapDue = true;
      }
      this.owner ??= m.id;
      if (!this.host || !this.live(this.host) || m.id === this.owner) this.host = m.id;
    }
    c.conn.send({ t: "welcome", you: c.player ?? "spectator", room: this.code });
    if (!m && this.phase === "lobby") c.conn.send({ t: "error", message: "This room is full. You're watching." });
    this.dirty = true;
    this.broadcastLobby();
    if (this.session) c.conn.send({ t: "snap", s: this.session.snapshot() });
  }

  private slotFree(i: number): boolean {
    return Number.isInteger(i) && i >= 0 && i < SLOTS.length && !this.members.some((m) => m.slot === i);
  }

  private freeSlot(): number {
    if (this.members.length >= MAX_PLAYERS) return -1;
    for (let i = 0; i < SLOTS.length; i++) if (this.slotFree(i)) return i;
    return -1;
  }

  private startGame() {
    const bySeat = [...this.members].sort((a, b) => a.slot - b.slot);
    const session = startRound(this.options.map, bySeat, this.options.rules, this.options.roundMinutes);
    this.session = session;
    for (const p of session.state.players) p.connected = p.isBot || this.members.find((m) => m.id === p.id)!.connected;
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
      phase: this.phase,
      paused: !!this.pausedBy,
      pausedBy: this.pausedBy,
      wins: this.wins,
      rounds: this.rounds
    };
  }

  private broadcastSnapshot() {
    if (!this.session) return;
    const msg: ServerMsg = { t: "snap", s: this.session.snapshot() };
    for (const c of this.conns.values()) c.conn.send(msg);
  }

  private broadcastLobby() {
    const msg: ServerMsg = { t: "lobby", lobby: this.lobby() };
    for (const c of this.conns.values()) c.conn.send(msg);
  }

  /** Free lobby seats of people who left more than a minute ago. */
  housekeep(now = Date.now()) {
    if (this.phase !== "lobby") return;
    const gone = this.members.filter((m) => !m.isBot && !m.connected && m.leftAt && now - m.leftAt > 60_000 && !this.live(m.id));
    if (!gone.length) return;
    this.members = this.members.filter((m) => !gone.includes(m));
    if (this.host && !this.members.some((m) => m.id === this.host)) this.host = this.members.find((m) => !m.isBot && this.live(m.id))?.id ?? null;
    if (this.owner && !this.members.some((m) => m.id === this.owner)) this.owner = this.host;
    this.dirty = true;
    this.broadcastLobby();
  }

  /** Advance the game by real seconds and broadcast a snapshot. */
  tick(seconds: number) {
    if (!this.session || this.phase !== "game") return;
    if (this.pausedBy) {
      if (this.snapDue) this.broadcastSnapshot();
      this.snapDue = false;
      return;
    }
    this.snapDue = false;
    this.session.tick(seconds * GAME_MINUTES_PER_SECOND);
    this.dirty = true;
    this.broadcastSnapshot();
    if (this.session.state.phase === "over") {
      this.phase = "over";
      this.rounds++;
      const w = this.session.state.winner;
      if (w) this.wins[w] = (this.wins[w] ?? 0) + 1;
      this.broadcastLobby();
    }
  }
}
