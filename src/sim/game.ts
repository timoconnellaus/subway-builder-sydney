import { buildNetwork, sectionBetween, sectionId, type Network } from "./network";
import { Router, lineRunMinutes, lineHeadway } from "./routing";
import {
  DEFAULT_SETTINGS,
  type BotStyle,
  type CityEvent,
  type Color,
  type Command,
  type CommandResult,
  type GameEvent,
  type GameState,
  type Line,
  type MapDef,
  type PassengerGroup,
  type Player,
  type PlayerId,
  type SectionId,
  type Settings,
  type StationId,
  type Train
} from "./types";

export interface PlayerSetup {
  id: PlayerId;
  name: string;
  color: Color;
  hub: StationId;
  isBot?: boolean;
  botStyle?: BotStyle;
}

const MAX_EVENTS = 60;

const EVENT_LIST: Omit<CityEvent, "id" | "announce" | "start" | "end" | "crowd">[] = [
  { station: "randwick", title: "Swans at the SCG", emoji: "🏉" },
  { station: "randwick", title: "Cricket at the SCG", emoji: "🏏" },
  { station: "lidcombe", title: "Concert at Olympic Park", emoji: "🎸" },
  { station: "lidcombe", title: "The Royal Easter Show", emoji: "🎡" },
  { station: "parramatta", title: "Eels game at CommBank Stadium", emoji: "🏉" },
  { station: "northsydney", title: "Vivid lights on the harbour", emoji: "✨" },
  { station: "central", title: "New Year's Eve fireworks", emoji: "🎆" },
  { station: "bondijn", title: "Hot day at Bondi Beach", emoji: "🏖️" },
  { station: "airport", title: "Holiday rush at the airport", emoji: "✈️" },
  { station: "cronulla", title: "Surf carnival at Cronulla", emoji: "🏄" },
  { station: "penrith", title: "Panthers game at Penrith", emoji: "🏉" },
  { station: "macpark", title: "Big tech expo", emoji: "💻" }
];

export function createGame(map: MapDef, players: PlayerSetup[], settings: Partial<Settings> = {}): GameState {
  const net = buildNetwork(map);
  const S: Settings = { ...DEFAULT_SETTINGS, ...settings };
  const sections: GameState["sections"] = {};
  for (const s of net.sections) {
    sections[s.id] = { owner: null, emptyRun: 0, rivalSince: {}, tally: {}, absentTimer: 0, traffic: 0 };
  }
  const waiting: GameState["waiting"] = {};
  for (const s of net.stations) waiting[s.id] = [];
  const state: GameState = {
    mapId: map.id,
    time: 0,
    phase: "running",
    players: players.map<Player>((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      hub: p.hub,
      money: S.startMoney,
      isBot: !!p.isBot,
      botStyle: p.botStyle,
      carried: 0,
      income: 0,
      connected: true
    })),
    sections,
    lines: [],
    trains: [],
    groups: {},
    waiting,
    demandAcc: new Array(net.stations.length * net.stations.length).fill(0),
    nextId: 1,
    netVersion: 1,
    events: [],
    eventSeq: 0,
    winner: null,
    settings: S,
    lost: 0,
    cityEvents: [],
    nextEventAt: 120
  };
  return state;
}

export class Game {
  readonly net: Network;
  readonly router: Router;
  constructor(public state: GameState, map: MapDef) {
    this.net = buildNetwork(map);
    this.router = new Router(this.net);
  }

  // ---------- queries ----------
  player(id: PlayerId): Player | undefined {
    return this.state.players.find((p) => p.id === id);
  }
  line(id: string): Line | undefined {
    return this.state.lines.find((l) => l.id === id);
  }
  linesOf(id: PlayerId): Line[] {
    return this.state.lines.filter((l) => l.owner === id);
  }
  trainsOf(line: Line): Train[] {
    return this.state.trains.filter((t) => t.line === line.id);
  }
  ownedCount(id: PlayerId): number {
    let n = 0;
    for (const k in this.state.sections) if (this.state.sections[k].owner === id) n++;
    return n;
  }
  /** Stations a player can expand from: their hub plus every end of a section they own. */
  networkStations(id: PlayerId): Set<StationId> {
    const p = this.player(id);
    const set = new Set<StationId>();
    if (p) set.add(p.hub);
    for (const s of this.net.sections) {
      if (this.state.sections[s.id].owner === id) {
        set.add(s.a);
        set.add(s.b);
      }
    }
    return set;
  }
  /** Opening track gets dearer the more you own, which slows down whoever is ahead. */
  openCost(section: SectionId, player?: PlayerId): number {
    const s = this.net.section[section];
    const S = this.state.settings;
    const owned = player ? this.ownedCount(player) : 0;
    return Math.round(S.openBaseCost + S.openCostPerMinute * s.minutes + S.openCostPerOwned * owned);
  }
  canOpen(id: PlayerId, section: SectionId): CommandResult {
    const sec = this.net.section[section];
    if (!sec) return fail("That section doesn't exist.");
    if (this.state.sections[section].owner) return fail("Someone already owns that section.");
    const mine = this.networkStations(id);
    if (!mine.has(sec.a) && !mine.has(sec.b)) return fail("You can only open track next to your own network.");
    const hubOwner = this.state.players.find((p) => p.id !== id && (p.hub === sec.a || p.hub === sec.b));
    if (hubOwner) return fail(`Only ${hubOwner.name} can open track at their home hub. You can still win it later by taking its passengers.`);
    const p = this.player(id)!;
    const cost = this.openCost(section, id);
    if (p.money < cost) return fail(`You need $${cost} to open this section.`);
    return { ok: true };
  }
  trainCost(cars: number): number {
    const S = this.state.settings;
    return S.trainBaseCost + S.carCost * cars;
  }
  validateRoute(id: PlayerId, stations: StationId[]): CommandResult {
    if (stations.length < 2) return fail("A line needs at least two stations.");
    if (new Set(stations).size !== stations.length) return fail("A line can't visit the same station twice.");
    let ownsOne = false;
    for (let i = 0; i < stations.length - 1; i++) {
      const sec = sectionBetween(this.net, stations[i], stations[i + 1]);
      if (!sec) return fail(`There's no track between ${this.name(stations[i])} and ${this.name(stations[i + 1])}.`);
      const owner = this.state.sections[sec.id].owner;
      if (!owner) return fail(`${this.name(stations[i])} to ${this.name(stations[i + 1])} hasn't been opened yet.`);
      if (owner === id) ownsOne = true;
    }
    if (!ownsOne) return fail("A line must use at least one section you own.");
    return { ok: true };
  }
  name(st: StationId): string {
    return this.net.station[st]?.name ?? st;
  }
  sectionName(id: SectionId): string {
    const s = this.net.section[id];
    return s ? `${this.name(s.a)} – ${this.name(s.b)}` : id;
  }

  // ---------- commands ----------
  apply(playerId: PlayerId, cmd: Command): CommandResult {
    const st = this.state;
    if (st.phase !== "running") return fail("The round is over.");
    const p = this.player(playerId);
    if (!p) return fail("Unknown player.");
    const S = st.settings;
    switch (cmd.type) {
      case "open": {
        const r = this.canOpen(playerId, cmd.section);
        if (!r.ok) return r;
        p.money -= this.openCost(cmd.section, playerId);
        st.sections[cmd.section].owner = playerId;
        this.emit({ t: st.time, kind: "open", player: playerId, section: cmd.section });
        st.netVersion++;
        return { ok: true };
      }
      case "createLine": {
        if (this.linesOf(playerId).length >= S.maxLinesPerPlayer) return fail(`You can run up to ${S.maxLinesPerPlayer} lines.`);
        const r = this.validateRoute(playerId, cmd.stations);
        if (!r.ok) return r;
        const cost = this.trainCost(2);
        if (p.money < cost) return fail(`A new line with one train costs $${cost}.`);
        p.money -= cost;
        const line: Line = {
          id: `L${st.nextId++}`,
          owner: playerId,
          stations: [...cmd.stations],
          fare: S.defaultFare,
          cars: 2,
          speed: 1,
          trains: 0,
          loadSum: 0,
          capSum: 0
        };
        st.lines.push(line);
        this.addTrain(line);
        st.netVersion++;
        this.emit({ t: st.time, kind: "line", player: playerId, line: line.id });
        return { ok: true };
      }
      case "extendLine": {
        const line = this.ownLine(playerId, cmd.line);
        if (!line) return fail("That isn't your line.");
        const next = cmd.end === "end" ? [...line.stations, cmd.station] : [cmd.station, ...line.stations];
        const r = this.validateRoute(playerId, next);
        if (!r.ok) return r;
        line.stations = next;
        if (cmd.end === "start") for (const t of this.trainsOf(line)) t.at += 1;
        st.netVersion++;
        return { ok: true };
      }
      case "trimLine": {
        const line = this.ownLine(playerId, cmd.line);
        if (!line) return fail("That isn't your line.");
        if (line.stations.length <= 2) return fail("A line needs at least two stations.");
        const next = cmd.end === "end" ? line.stations.slice(0, -1) : line.stations.slice(1);
        const r = this.validateRoute(playerId, next);
        if (!r.ok) return r;
        const last = next.length - 1;
        for (const t of this.trainsOf(line)) {
          if (cmd.end === "start") t.at -= 1;
          // a train on the removed piece jumps to the new end and lets everyone off there
          if (t.at < 0 || t.at > last || (t.phase === "move" && (t.at + t.dir < 0 || t.at + t.dir > last))) {
            t.at = Math.max(0, Math.min(last, t.at));
            t.phase = "dwell";
            t.timer = S.dwellMinutes;
            t.dir = t.at === 0 ? 1 : -1;
            this.unload(t, next[t.at]);
          }
        }
        line.stations = next;
        st.netVersion++;
        return { ok: true };
      }
      case "deleteLine": {
        const line = this.ownLine(playerId, cmd.line);
        if (!line) return fail("That isn't your line.");
        for (const t of this.trainsOf(line)) this.removeTrain(t, line);
        p.money += Math.round((this.trainCost(line.cars) * line.trains) / 2);
        st.lines = st.lines.filter((l) => l !== line);
        st.netVersion++;
        return { ok: true };
      }
      case "setFare": {
        const line = this.ownLine(playerId, cmd.line);
        if (!line) return fail("That isn't your line.");
        const f = Math.round(clamp(cmd.fare, S.minFare, S.maxFare) * 4) / 4;
        if (f !== line.fare) {
          line.fare = f;
          st.netVersion++;
        }
        return { ok: true };
      }
      case "setTrains": {
        const line = this.ownLine(playerId, cmd.line);
        if (!line) return fail("That isn't your line.");
        const target = Math.round(clamp(cmd.trains, 1, S.maxTrainsPerLine));
        if (target > line.trains) {
          const cost = this.trainCost(line.cars) + (line.speed - 1) * S.speedCost;
          const add = target - line.trains;
          if (p.money < cost) return fail(`A train costs $${cost}.`);
          for (let i = 0; i < add && p.money >= cost; i++) {
            p.money -= cost;
            this.addTrain(line);
          }
        } else if (target < line.trains) {
          const trains = this.trainsOf(line).sort((a, b) => a.load - b.load);
          for (let i = 0; i < line.trains - target; i++) {
            this.removeTrain(trains[i], line);
            p.money += Math.round(this.trainCost(line.cars) / 2);
          }
          line.trains = target;
        }
        st.netVersion++;
        return { ok: true };
      }
      case "setCars": {
        const line = this.ownLine(playerId, cmd.line);
        if (!line) return fail("That isn't your line.");
        const cars = Math.round(clamp(cmd.cars, 1, 8));
        const diff = cars - line.cars;
        if (diff > 0) {
          const cost = diff * S.carCost * line.trains;
          if (p.money < cost) return fail(`That costs $${cost}.`);
          p.money -= cost;
        } else if (diff < 0) {
          p.money += Math.round((-diff * S.carCost * line.trains) / 2);
        }
        line.cars = cars;
        return { ok: true };
      }
      case "setSpeed": {
        const line = this.ownLine(playerId, cmd.line);
        if (!line) return fail("That isn't your line.");
        const speed = clamp(Math.round(cmd.speed), 1, 3) as 1 | 2 | 3;
        const diff = speed - line.speed;
        if (diff > 0) {
          const cost = diff * S.speedCost * line.trains;
          if (p.money < cost) return fail(`That costs $${cost}.`);
          p.money -= cost;
        }
        line.speed = speed;
        st.netVersion++;
        return { ok: true };
      }
    }
    return fail("Unknown command.");
  }

  private ownLine(playerId: PlayerId, id: string): Line | undefined {
    const l = this.line(id);
    return l && l.owner === playerId ? l : undefined;
  }

  private addTrain(line: Line) {
    const st = this.state;
    // space new trains out: start at the station furthest (in time) from existing trains
    const existing = this.trainsOf(line);
    let at = 0;
    let dir: 1 | -1 = 1;
    if (existing.length) {
      const n = line.stations.length;
      const k = existing.length;
      const slot = (k * 2 * (n - 1)) / (k + 1);
      const s = Math.round(slot) % (2 * (n - 1));
      if (s < n - 1) {
        at = s;
        dir = 1;
      } else {
        at = 2 * (n - 1) - s;
        dir = -1;
      }
      if (at === n - 1) dir = -1;
      if (at === 0) dir = 1;
    }
    st.trains.push({
      id: `T${st.nextId++}`,
      line: line.id,
      at,
      dir,
      phase: "dwell",
      timer: st.settings.dwellMinutes,
      segTotal: 0,
      load: 0,
      groups: []
    });
    line.trains++;
  }

  /** Put everyone on a train off at a station; they re-plan from there. */
  private unload(t: Train, station: StationId) {
    const st = this.state;
    for (const gid of t.groups) {
      const g = st.groups[gid];
      if (!g) continue;
      g.train = null;
      g.since = st.time;
      const dest = g.path[g.path.length - 1];
      const fresh = dest === station ? null : this.router.path(st, station, dest);
      if (!fresh) {
        delete st.groups[gid];
        continue;
      }
      g.path = fresh;
      g.i = 0;
      st.waiting[station].push(gid);
    }
    t.groups = [];
    t.load = 0;
  }

  private removeTrain(t: Train, line: Line) {
    const st = this.state;
    const station = line.stations[t.at];
    for (const gid of t.groups) {
      const g = st.groups[gid];
      if (!g) continue;
      g.train = null;
      const idx = g.path.indexOf(station);
      if (idx >= 0) {
        g.i = idx;
        g.since = st.time;
        st.waiting[station].push(gid);
      } else {
        delete st.groups[gid];
      }
    }
    st.trains = st.trains.filter((x) => x !== t);
    line.trains = Math.max(0, line.trains - 1);
  }

  emit(e: GameEvent) {
    const st = this.state;
    st.events.push(e);
    st.eventSeq++;
    if (st.events.length > MAX_EVENTS) st.events.splice(0, st.events.length - MAX_EVENTS);
  }

  // ---------- simulation ----------
  step(dt: number) {
    const st = this.state;
    if (st.phase !== "running") return;
    st.time += dt;
    this.spawn(dt);
    this.runEvents(dt);
    this.runCosts(dt);
    for (const t of [...st.trains]) this.moveTrain(t, dt);
    this.absentOwners(dt);
    this.expireWaiting();
    for (const k in st.sections) st.sections[k].traffic *= Math.exp(-dt / 20);
    for (const l of st.lines) {
      const d = Math.exp(-dt / 30);
      l.loadSum *= d;
      l.capSum *= d;
    }
    this.checkWin();
  }

  private runEvents(dt: number) {
    const st = this.state;
    if (!st.settings.events) return;
    st.cityEvents ??= [];
    st.nextEventAt ??= 120;
    const end = st.settings.roundMinutes;
    if (st.time >= st.nextEventAt && st.time < end - 90) {
      const options = EVENT_LIST.filter((e) => this.net.station[e.station] && !st.cityEvents.some((c) => c.station === e.station && c.end > st.time));
      const pick = options[Math.floor(Math.random() * options.length)];
      if (pick) {
        const ev: CityEvent = { id: st.nextId++, ...pick, announce: st.time, start: st.time + 45, end: st.time + 45 + 40, crowd: st.settings.demandPerMinute * 0.35 };
        st.cityEvents.push(ev);
        this.emit({ t: st.time, kind: "event", phase: "soon", event: ev });
      }
      st.nextEventAt = st.time + 150 + Math.random() * 60;
    }
    for (const ev of st.cityEvents) {
      if (ev.start <= st.time && ev.start > st.time - dt) this.emit({ t: st.time, kind: "event", phase: "start", event: ev });
      if (ev.end <= st.time && ev.end > st.time - dt) this.emit({ t: st.time, kind: "event", phase: "end", event: ev });
      // crowds travel there before and during the event, and home again afterwards
      const going = st.time >= ev.start - 20 && st.time < ev.end;
      const leaving = st.time >= ev.end && st.time < ev.end + 30;
      if (!going && !leaving) continue;
      const S = st.settings;
      const key = `ev${ev.id}`;
      this.eventAcc[key] = (this.eventAcc[key] ?? 0) + ev.crowd * dt;
      while (this.eventAcc[key] >= S.groupSize) {
        this.eventAcc[key] -= S.groupSize;
        const other = this.randomStationByPop(ev.station);
        const [from, to] = going ? [other, ev.station] : [ev.station, other];
        const path = this.router.path(st, from, to);
        if (!path) continue;
        const g: PassengerGroup = { id: st.nextId++, n: S.groupSize, path, i: 0, train: null, since: st.time };
        st.groups[g.id] = g;
        st.waiting[from].push(g.id);
      }
    }
    st.cityEvents = st.cityEvents.filter((e) => e.end + 30 > st.time);
  }

  private eventAcc: Record<string, number> = {};

  private randomStationByPop(not: StationId): StationId {
    const list = this.net.stations.filter((s) => s.id !== not);
    let total = 0;
    for (const s of list) total += s.pop;
    let r = Math.random() * total;
    for (const s of list) {
      r -= s.pop;
      if (r <= 0) return s.id;
    }
    return list[0].id;
  }

  private spawn(dt: number) {
    const st = this.state;
    const S = st.settings;
    const n = this.net.stations.length;
    const od = this.net.od;
    const rate = S.demandPerMinute * dt;
    for (let i = 0; i < n; i++) {
      const from = this.net.stations[i].id;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const k = i * n + j;
        st.demandAcc[k] += od[k] * rate;
        if (st.demandAcc[k] < S.groupSize) continue;
        st.demandAcc[k] -= S.groupSize;
        const to = this.net.stations[j].id;
        const path = this.router.path(st, from, to);
        if (!path) continue; // nobody can make this trip yet
        const g: PassengerGroup = { id: st.nextId++, n: S.groupSize, path, i: 0, train: null, since: st.time };
        st.groups[g.id] = g;
        st.waiting[from].push(g.id);
      }
    }
  }

  private runCosts(dt: number) {
    const st = this.state;
    const per = st.settings.carCostPerMinute * dt;
    for (const l of st.lines) {
      const p = this.player(l.owner);
      if (p) p.money -= per * l.cars * l.trains;
    }
  }

  /** Passengers give up after waiting a long time with no useful train. */
  private expireWaiting() {
    const st = this.state;
    for (const sid in st.waiting) {
      const list = st.waiting[sid];
      if (!list.length) continue;
      const keep: number[] = [];
      for (const gid of list) {
        const g = st.groups[gid];
        if (!g) continue;
        if (st.time - g.since > 60) {
          st.lost += g.n;
          delete st.groups[gid];
        } else keep.push(gid);
      }
      st.waiting[sid] = keep;
    }
  }

  private moveTrain(t: Train, dt: number) {
    const line = this.line(t.line);
    if (!line) return;
    let remaining = dt;
    let guard = 0;
    while (remaining > 0 && guard++ < 8) {
      if (t.timer > remaining) {
        t.timer -= remaining;
        return;
      }
      remaining -= t.timer;
      t.timer = 0;
      if (t.phase === "dwell") this.depart(t, line);
      else this.arrive(t, line);
    }
  }

  private depart(t: Train, line: Line) {
    const st = this.state;
    const S = st.settings;
    const n = line.stations.length;
    if (n < 2) {
      t.timer = 1;
      return;
    }
    if (t.at + t.dir < 0 || t.at + t.dir >= n) t.dir = t.dir === 1 ? -1 : 1;
    const here = line.stations[t.at];
    const next = line.stations[t.at + t.dir];
    const sec = sectionBetween(this.net, here, next)!;
    const boarded = this.board(t, line, here, next);

    const op = this.player(line.owner)!;
    const ss = st.sections[sec.id];
    // flat fare per ride, paid when boarding
    if (boarded > 0) {
      const fares = boarded * line.fare;
      op.money += fares;
      op.income += fares;
    }
    if (t.load > 0) ss.traffic += t.load;
    // track fee to the owner
    if (ss.owner && ss.owner !== line.owner) {
      const owner = this.player(ss.owner);
      op.money -= S.trackFee;
      if (owner) {
        owner.money += S.trackFee;
        owner.income += S.trackFee;
      }
    }
    line.loadSum += t.load;
    line.capSum += line.cars * S.carSeats;

    // capture rule: the owner's train "leaves empty" when nobody boarded it here,
    // while a rival's trains have been taking passengers from this platform onto this section
    if (ss.owner) {
      if (line.owner === ss.owner) {
        const rivalCarried = sum(ss.rivalSince);
        if (boarded === 0 && rivalCarried > 0 && this.rivalRuns(sec.id, ss.owner)) {
          ss.emptyRun++;
          addInto(ss.tally, ss.rivalSince);
          this.emit({ t: st.time, kind: "empty", player: ss.owner, section: sec.id, run: ss.emptyRun });
          if (ss.emptyRun >= S.emptyToCapture) this.capture(sec.id);
        } else if (boarded > 0) {
          ss.emptyRun = 0;
          ss.tally = {};
        }
        ss.rivalSince = {};
      } else if (boarded > 0) {
        ss.rivalSince[line.owner] = (ss.rivalSince[line.owner] ?? 0) + boarded;
      }
    }

    t.phase = "move";
    t.segTotal = lineRunMinutes(this.net, line, t.at, t.at + t.dir);
    t.timer = t.segTotal;
  }

  /** Is any rival of `owner` running trains over this section? */
  private rivalRuns(section: SectionId, owner: PlayerId): boolean {
    return this.state.lines.some((l) => l.owner !== owner && l.trains > 0 && this.lineUses(l, section));
  }

  lineUses(l: Line, section: SectionId): boolean {
    for (let i = 0; i < l.stations.length - 1; i++) if (sectionId(l.stations[i], l.stations[i + 1]) === section) return true;
    return false;
  }

  /** If the owner runs no trains over a section a rival is serving, it counts as empty trains. */
  private absentOwners(dt: number) {
    const st = this.state;
    for (const sec of this.net.sections) {
      const ss = st.sections[sec.id];
      if (!ss.owner) continue;
      const ownerRuns = st.lines.some((l) => l.owner === ss.owner && l.trains > 0 && this.lineUses(l, sec.id));
      if (ownerRuns) {
        ss.absentTimer = 0;
        continue;
      }
      if (sum(ss.rivalSince) <= 0) continue;
      ss.absentTimer += dt;
      if (ss.absentTimer >= 6) {
        ss.absentTimer = 0;
        ss.emptyRun++;
        addInto(ss.tally, ss.rivalSince);
        ss.rivalSince = {};
        this.emit({ t: st.time, kind: "empty", player: ss.owner, section: sec.id, run: ss.emptyRun });
        if (ss.emptyRun >= st.settings.emptyToCapture) this.capture(sec.id);
      }
    }
  }

  private capture(section: SectionId) {
    const st = this.state;
    const ss = st.sections[section];
    let best: PlayerId | null = null;
    let bestN = 0;
    for (const pid in ss.tally) {
      if (pid !== ss.owner && ss.tally[pid] > bestN) {
        best = pid;
        bestN = ss.tally[pid];
      }
    }
    if (!best) return;
    const from = ss.owner;
    ss.owner = best;
    ss.emptyRun = 0;
    ss.tally = {};
    ss.rivalSince = {};
    ss.absentTimer = 0;
    st.netVersion++;
    this.emit({ t: st.time, kind: "capture", player: best, from, section });
  }

  /** Board waiting passengers; returns how many got on here. */
  private board(t: Train, line: Line, here: StationId, next: StationId): number {
    const st = this.state;
    const S = st.settings;
    const cap = line.cars * S.carSeats;
    const list = st.waiting[here];
    if (!list.length) return 0;
    let boarded = 0;
    const keep: number[] = [];
    // cheaper competitors heading the same way, with when they'll leave here
    const rivals = this.competitors(line, here, next);
    for (const gid of list) {
      const g = st.groups[gid];
      if (!g) continue;
      const wantsThisWay = g.path[g.i + 1] === next;
      if (!wantsThisWay || t.load + g.n > cap) {
        keep.push(gid);
        continue;
      }
      // wait for a cheaper train if it's coming soon and has room
      let wait = false;
      for (const r of rivals) {
        if (r.fare >= line.fare) continue;
        const patience = (line.fare - r.fare) / S.valueOfTime;
        if (r.eta <= patience && r.free >= g.n) {
          wait = true;
          break;
        }
      }
      if (wait) {
        keep.push(gid);
        continue;
      }
      g.train = t.id;
      t.groups.push(gid);
      t.load += g.n;
      boarded += g.n;
      const op = this.player(line.owner)!;
      op.carried += g.n;
    }
    st.waiting[here] = keep;
    return boarded;
  }

  /** Other lines' trains that will leave `here` towards `next`, with fare, eta and free seats. */
  competitors(line: Line, here: StationId, next: StationId): { fare: number; eta: number; free: number; owner: PlayerId }[] {
    const out: { fare: number; eta: number; free: number; owner: PlayerId }[] = [];
    for (const l of this.state.lines) {
      if (l === line || l.trains <= 0) continue;
      const k = l.stations.indexOf(here);
      if (k < 0) continue;
      let dir: 1 | -1;
      if (l.stations[k + 1] === next) dir = 1;
      else if (l.stations[k - 1] === next) dir = -1;
      else continue;
      for (const tr of this.trainsOf(l)) {
        const eta = this.etaDepart(tr, l, k, dir);
        if (eta === Infinity) continue;
        out.push({ fare: l.fare, eta, free: l.cars * this.state.settings.carSeats - tr.load, owner: l.owner });
      }
    }
    return out;
  }

  /** Minutes until train `t` next departs station index k heading in `dir`. */
  etaDepart(t: Train, line: Line, k: number, dir: 1 | -1): number {
    const n = line.stations.length;
    const dwell = this.state.settings.dwellMinutes;
    let time = t.timer;
    let at = t.at;
    let d = t.dir;
    let phase = t.phase;
    for (let guard = 0; guard < 4 * n; guard++) {
      if (phase === "dwell") {
        // departs at `time`; direction flips at the ends before departure
        let dd = d;
        if (at + dd < 0 || at + dd >= n) dd = dd === 1 ? -1 : 1;
        if (at === k && dd === dir) return time;
        d = dd;
        time += lineRunMinutes(this.net, line, at, at + d);
        at += d;
        phase = "dwell";
        time += dwell;
      } else {
        at += d;
        phase = "dwell";
        time += dwell;
      }
    }
    return Infinity;
  }

  private arrive(t: Train, line: Line) {
    const st = this.state;
    const S = st.settings;
    t.at += t.dir;
    const here = line.stations[t.at];
    const n = line.stations.length;
    let nextDir = t.dir;
    if (t.at + nextDir < 0 || t.at + nextDir >= n) nextDir = nextDir === 1 ? -1 : 1;
    const next = line.stations[t.at + nextDir];
    const stay: number[] = [];
    for (const gid of t.groups) {
      const g = st.groups[gid];
      if (!g) continue;
      g.i++;
      if (g.path[g.i] !== here) {
        // path drifted (line edited); re-plan from here
        const idx = g.path.indexOf(here);
        if (idx >= 0) g.i = idx;
      }
      t.load -= g.n;
      if (g.i >= g.path.length - 1) {
        delete st.groups[gid]; // arrived
        continue;
      }
      if (g.path[g.i + 1] === next) {
        t.load += g.n;
        stay.push(gid);
        continue;
      }
      // change trains here: re-plan with the network as it is now
      g.train = null;
      g.since = st.time;
      const dest = g.path[g.path.length - 1];
      const fresh = this.router.path(st, here, dest);
      if (!fresh) {
        st.lost += g.n;
        delete st.groups[gid];
        continue;
      }
      g.path = fresh;
      g.i = 0;
      st.waiting[here].push(gid);
    }
    t.groups = stay;
    t.load = Math.max(0, t.load);
    t.dir = nextDir as 1 | -1;
    t.phase = "dwell";
    t.timer = S.dwellMinutes;
  }

  private checkWin() {
    const st = this.state;
    const total = this.net.sections.length;
    for (const p of st.players) {
      if (this.ownedCount(p.id) >= Math.ceil(total * st.settings.winShare)) {
        st.phase = "over";
        st.winner = p.id;
        this.emit({ t: st.time, kind: "win", player: p.id, reason: "share" });
        return;
      }
    }
    if (st.time >= st.settings.roundMinutes - 1e-6) {
      const best = [...st.players].sort((a, b) => b.carried - a.carried)[0];
      st.phase = "over";
      st.winner = best?.id ?? null;
      if (best) this.emit({ t: st.time, kind: "win", player: best.id, reason: "time" });
    }
  }

  headway(line: Line): number {
    return lineHeadway(this.net, this.state, line);
  }
}

function fail(error: string): CommandResult {
  return { ok: false, error };
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, isFinite(v) ? v : lo));
}
function sum(r: Record<string, number>) {
  let s = 0;
  for (const k in r) s += r[k];
  return s;
}
function addInto(a: Record<string, number>, b: Record<string, number>) {
  for (const k in b) a[k] = (a[k] ?? 0) + b[k];
}
