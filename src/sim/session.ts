import { runBots } from "./bots";
import { createGame, Game, type PlayerSetup } from "./game";
import type { Color, Command, CommandResult, GameEvent, GameState, Line, MapDef, PlayerId, SectionId, Settings, StationId } from "./types";

/** A running game plus its bots. Used by both the browser (single player) and the server (online). */
export class Session {
  game: Game;
  private botMemory = new Map<string, number>();
  constructor(public map: MapDef, state: GameState) {
    this.game = new Game(state, map);
  }

  static create(map: MapDef, players: PlayerSetup[], settings?: Partial<Settings>): Session {
    return new Session(map, createGame(map, players, settings));
  }

  get state() {
    return this.game.state;
  }

  command(player: PlayerId, cmd: Command): CommandResult {
    return this.game.apply(player, cmd);
  }

  /** Advance by `dt` game minutes, in small fixed steps. */
  tick(dt: number) {
    const STEP = 0.2;
    let left = dt;
    while (left > 1e-9) {
      const d = Math.min(STEP, left);
      runBots(this.game, this.botMemory);
      this.game.step(d);
      left -= d;
    }
  }

  snapshot(): Snapshot {
    return toSnapshot(this.game);
  }
}

export interface PlayerView {
  id: PlayerId;
  name: string;
  color: Color;
  hub: StationId;
  money: number;
  carried: number;
  income: number;
  isBot: boolean;
  connected: boolean;
  owned: number;
}

export interface SectionView {
  owner: PlayerId | null;
  emptyRun: number;
  contested: boolean;
  traffic: number;
}

export interface LineView extends Line {
  headway: number;
  loadFactor: number;
}

export interface TrainView {
  id: string;
  line: string;
  from: StationId;
  to: StationId | null;
  p: number;
  load: number;
  cap: number;
}

export interface Snapshot {
  time: number;
  duration: number;
  phase: GameState["phase"];
  winner: PlayerId | null;
  players: PlayerView[];
  sections: Record<SectionId, SectionView>;
  lines: LineView[];
  trains: TrainView[];
  waiting: Record<StationId, number>;
  events: GameEvent[];
  eventSeq: number;
  settings: Settings;
  totalSections: number;
  lost: number;
}

export function toSnapshot(game: Game): Snapshot {
  const st = game.state;
  const sections: Record<SectionId, SectionView> = {};
  for (const s of game.net.sections) {
    const ss = st.sections[s.id];
    const users = new Set(st.lines.filter((l) => l.trains > 0 && game.lineUses(l, s.id)).map((l) => l.owner));
    const contested = !!ss.owner && [...users].some((u) => u !== ss.owner);
    sections[s.id] = { owner: ss.owner, emptyRun: ss.emptyRun, contested, traffic: Math.round(ss.traffic) };
  }
  const waiting: Record<StationId, number> = {};
  for (const sid in st.waiting) {
    let n = 0;
    for (const gid of st.waiting[sid]) n += st.groups[gid]?.n ?? 0;
    waiting[sid] = n;
  }
  const lineById = new Map(st.lines.map((l) => [l.id, l]));
  return {
    time: st.time,
    duration: st.settings.roundMinutes,
    phase: st.phase,
    winner: st.winner,
    players: st.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      hub: p.hub,
      money: Math.round(p.money),
      carried: p.carried,
      income: Math.round(p.income),
      isBot: p.isBot,
      connected: p.connected,
      owned: game.ownedCount(p.id)
    })),
    sections,
    lines: st.lines.map((l) => ({
      ...l,
      stations: [...l.stations],
      headway: game.headway(l),
      loadFactor: l.capSum > 0 ? l.loadSum / l.capSum : 0
    })),
    trains: st.trains.map((t) => {
      const l = lineById.get(t.line)!;
      const from = l.stations[t.at];
      const moving = t.phase === "move";
      return {
        id: t.id,
        line: t.line,
        from,
        to: moving ? l.stations[t.at + t.dir] ?? null : null,
        p: moving && t.segTotal > 0 ? 1 - t.timer / t.segTotal : 0,
        load: t.load,
        cap: l.cars * st.settings.carSeats
      };
    }),
    waiting,
    events: st.events.slice(-20),
    eventSeq: st.eventSeq,
    settings: st.settings,
    totalSections: game.net.sections.length,
    lost: st.lost
  };
}
