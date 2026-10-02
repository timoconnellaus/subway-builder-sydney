import type { Game } from "./game";
import { hubLock, sectionBetween, sectionId } from "./network";
import type { BotStyle, Line, Player, SectionId, StationId } from "./types";

// Simple rule-based bots. They act through Game.apply like a human would, so they
// can never break the rules. Each style has one clear personality the player can learn.

interface StyleTuning {
  reserve: number; // money kept back
  openAppetite: number; // 0..1 how keen to open new track
  attack: number; // 0..1 how keen to fight rivals
  undercut: number; // dollars below the rival fare when attacking
  premium: boolean; // raise fares on safe lines
  fareFloor: number; // never cut fares below this when defending
  defendTrains: number; // most trains a defended line gets
  defendAfter: number; // empty trains in a row before defending
  rivalTrack: number; // how much new routes like rival track (1 = as much as our own)
  retake: boolean; // fight back for track just lost
  maxLines: number; // most lines this bot runs
  richAttack: boolean; // attack whenever it has money to spare
}

type Style = Pick<StyleTuning, "reserve" | "openAppetite" | "attack" | "undercut" | "premium">;
const STYLES: Record<BotStyle, Style> = {
  builder: { reserve: 200, openAppetite: 1, attack: 0.3, undercut: 0.25, premium: false },
  raider: { reserve: 150, openAppetite: 0.5, attack: 1, undercut: 0.75, premium: false },
  banker: { reserve: 400, openAppetite: 0.7, attack: 0.45, undercut: 0.5, premium: true }
};

const NORMAL = { fareFloor: 0, defendTrains: Infinity, defendAfter: 1, rivalTrack: 0.4, retake: true, maxLines: Infinity, richAttack: true };

/** A style adjusted for the bot skill house rule. */
export function tuning(style: BotStyle | undefined, skill: number): StyleTuning {
  const base = STYLES[style ?? "builder"] ?? STYLES.builder;
  if (skill === 1)
    // easy bots keep more money back, rarely fight, defend gently and keep off your track, so a fare war can be won
    return {
      ...base,
      ...NORMAL,
      reserve: base.reserve + 300,
      attack: base.attack * 0.25,
      undercut: 0.25,
      openAppetite: base.openAppetite * 0.5,
      fareFloor: 1.25,
      defendTrains: 4,
      defendAfter: 2,
      rivalTrack: 0.1,
      retake: false,
      maxLines: 4,
      richAttack: false
    };
  if (skill === 3) return { ...base, ...NORMAL, reserve: Math.max(100, base.reserve - 100), attack: Math.min(1, base.attack * 1.8), undercut: base.undercut + 0.25 };
  return { ...base, ...NORMAL };
}

export function runBots(game: Game, memory: Map<string, number>) {
  const st = game.state;
  if (st.phase !== "running") return;
  st.players.forEach((p, idx) => {
    if (!p.isBot) return;
    const next = memory.get(p.id) ?? 1 + idx * 0.7;
    if (st.time < next) return;
    const skill = st.settings.botSkill ?? 2;
    memory.set(p.id, st.time + (skill === 1 ? 4.5 : skill === 2 ? 2 : 1));
    botTurn(game, p);
  });
}

function botTurn(game: Game, p: Player) {
  const skill = game.state.settings.botSkill ?? 2;
  const tune = tuning(p.botStyle, skill);
  if (skill === 1 && p.botStyle === "raider" && game.random() < 0.6) {
    defend(game, p, tune);
    cover(game, p, tune);
    manageTrains(game, p, tune);
    open(game, p, tune);
    return;
  }
  if (p.money < 0) {
    sellEmptiest(game, p);
    return;
  }
  if (comeback(game, p)) return;
  defend(game, p, tune);
  if (tune.retake) retake(game, p, tune);
  cover(game, p, tune);
  if (p.botStyle === "raider") {
    attack(game, p, tune);
    manageTrains(game, p, tune);
    open(game, p, tune);
  } else {
    open(game, p, tune);
    manageTrains(game, p, tune);
    if (game.random() < tune.attack || (p.money > 2500 && tune.richAttack)) attack(game, p, tune);
  }
  if (tune.premium) adjustFares(game, p);
}

/** Lost everything: run a line from home onto the busiest neighbouring track (lines may start at your hub). */
function comeback(game: Game, p: Player): boolean {
  if (game.ownedCount(p.id) > 0 || game.linesOf(p.id).length > 0) return false;
  const options = game.net.adj[p.hub].filter((e) => game.state.sections[e.section].owner);
  if (!options.length || p.money < game.trainCost(2)) return false;
  const best = options.sort((a, b) => stationValue(game, b.to) - stationValue(game, a.to))[0];
  const r = game.apply(p.id, { type: "createLine", stations: [p.hub, best.to] });
  if (r.ok) {
    const line = game.linesOf(p.id).at(-1)!;
    game.apply(p.id, { type: "setFare", line: line.id, fare: Math.max(game.state.settings.minFare, line.fare - 0.75) });
  }
  return r.ok;
}

function stationValue(game: Game, s: StationId): number {
  const d = game.net.station[s];
  return d.pop + d.jobs;
}

function open(game: Game, p: Player, tune: StyleTuning) {
  const mine = game.networkStations(p.id);
  let best: SectionId | null = null;
  let bestScore = -Infinity;
  for (const s of game.net.sections) {
    if (game.state.sections[s.id].owner) continue;
    if (!mine.has(s.a) && !mine.has(s.b)) continue;
    if (hubLock(game.state.players, p.id, s.a, s.b)) continue;
    const far = mine.has(s.a) ? s.b : s.a;
    const score = stationValue(game, far) / game.openCost(s.id, p.id) + game.random() * 0.02;
    if (score > bestScore) {
      bestScore = score;
      best = s.id;
    }
  }
  if (!best) return;
  const cost = game.openCost(best, p.id) + game.trainCost(2);
  const keen = game.linesOf(p.id).length === 0 || game.random() < tune.openAppetite;
  if (keen && p.money >= cost + tune.reserve) game.apply(p.id, { type: "open", section: best });
}

/** Make sure every owned section has one of our trains on it, preferring long lines. */
function cover(game: Game, p: Player, tune: StyleTuning) {
  const lines = game.linesOf(p.id);
  for (const s of game.net.sections) {
    if (game.state.sections[s.id].owner !== p.id) continue;
    if (lines.some((l) => game.lineUses(l, s.id))) continue;
    // extend a line that ends at one side of this section
    for (const l of lines) {
      const first = l.stations[0];
      const last = l.stations[l.stations.length - 1];
      for (const [end, st] of [["end", last], ["start", first]] as const) {
        if (st !== s.a && st !== s.b) continue;
        const other = st === s.a ? s.b : s.a;
        if (l.stations.includes(other) || l.stations.length >= 8) continue;
        if (game.apply(p.id, { type: "extendLine", line: l.id, station: other, end }).ok) return;
      }
    }
    if ((p.money >= game.trainCost(2) + tune.reserve / 2 && lines.length < tune.maxLines) || lines.length === 0) {
      const route = longRoute(game, p, s.a, s.b, tune.rivalTrack);
      const r = game.apply(p.id, { type: "createLine", stations: route });
      if (!r.ok) game.apply(p.id, { type: "createLine", stations: [s.a, s.b] });
    }
    return; // one change per turn keeps bots readable
  }
}

/** Grow a route out from a section along opened track, towards busy stations. */
function longRoute(game: Game, p: Player, a: StationId, b: StationId, rivalTrack: number): StationId[] {
  const st = game.state;
  const route = [a, b];
  const grow = (atEnd: boolean) => {
    for (let k = 0; k < 3 && route.length < 7; k++) {
      const end = atEnd ? route[route.length - 1] : route[0];
      let best: StationId | null = null;
      let bestV = -1;
      for (const e of game.net.adj[end]) {
        if (route.includes(e.to)) continue;
        const owner = st.sections[e.section].owner;
        if (!owner) continue;
        // prefer our own track; rival track costs us fees
        const v = stationValue(game, e.to) * (owner === p.id ? 1 : rivalTrack);
        if (v > bestV) {
          bestV = v;
          best = e.to;
        }
      }
      if (!best) return;
      if (atEnd) route.push(best);
      else route.unshift(best);
    }
  };
  grow(true);
  grow(false);
  return route;
}

function loadFactor(l: Line): number {
  return l.capSum > 0 ? l.loadSum / l.capSum : 0;
}

function manageTrains(game: Game, p: Player, tune: StyleTuning) {
  const st = game.state;
  const busy = new Set((st.cityEvents ?? []).filter((e) => e.end > st.time).map((e) => e.station));
  for (const l of game.linesOf(p.id)) {
    const lf = loadFactor(l);
    const cost = game.trainCost(l.cars);
    const eventLine = l.stations.some((s) => busy.has(s));
    if ((lf > 0.7 || (eventLine && lf > 0.35 && l.trains < 6)) && p.money > cost + tune.reserve) {
      if (l.trains < 4 || l.cars >= 6) game.apply(p.id, { type: "setTrains", line: l.id, trains: l.trains + 1 });
      else game.apply(p.id, { type: "setCars", line: l.id, cars: l.cars + 2 });
    } else if (lf < 0.12 && l.trains > 1 && game.state.time > 60 && l.capSum > 50) {
      game.apply(p.id, { type: "setTrains", line: l.id, trains: l.trains - 1 });
    }
  }
}

/** Broke: sell the train doing least work. */
function sellEmptiest(game: Game, p: Player) {
  const lines = game.linesOf(p.id).filter((l) => l.trains > 1);
  if (!lines.length) return;
  const worst = lines.sort((a, b) => loadFactor(a) - loadFactor(b))[0];
  game.apply(p.id, { type: "setTrains", line: worst.id, trains: worst.trains - 1 });
}

/** Fight back on track we just lost: undercut the new owner if our trains still run there. */
function retake(game: Game, p: Player, tune: StyleTuning) {
  const st = game.state;
  const recent = st.events.filter((e) => e.kind === "capture" && e.from === p.id && st.time - e.t < 30);
  for (const e of recent) {
    if (e.kind !== "capture") continue;
    const mine = game.linesOf(p.id).filter((l) => game.lineUses(l, e.section));
    const theirs = st.lines.filter((l) => l.owner === e.player && game.lineUses(l, e.section));
    if (!mine.length || !theirs.length) continue;
    const target = Math.min(...theirs.map((l) => l.fare)) - 0.25;
    for (const l of mine) {
      if (l.fare > target) game.apply(p.id, { type: "setFare", line: l.id, fare: target });
      if (p.money > game.trainCost(l.cars) + tune.reserve) game.apply(p.id, { type: "setTrains", line: l.id, trains: l.trains + 1 });
    }
  }
}

function defend(game: Game, p: Player, tune: StyleTuning) {
  for (const s of game.net.sections) {
    const ss = game.state.sections[s.id];
    if (ss.owner !== p.id || ss.emptyRun < tune.defendAfter) continue;
    for (const l of game.linesOf(p.id)) {
      if (!game.lineUses(l, s.id)) continue;
      if (l.fare - 0.25 >= tune.fareFloor) game.apply(p.id, { type: "setFare", line: l.id, fare: l.fare - 0.25 });
      if (l.trains < tune.defendTrains && p.money > game.trainCost(l.cars) + 150) game.apply(p.id, { type: "setTrains", line: l.id, trains: l.trains + 1 });
    }
  }
}

/** Run a line onto a busy rival section next to our network and undercut it. */
function attack(game: Game, p: Player, tune: StyleTuning) {
  const st = game.state;
  const lines = game.linesOf(p.id);
  if (lines.length >= Math.min(st.settings.maxLinesPerPlayer, tune.maxLines)) return;
  let best: { x: StationId; here: StationId; y: StationId; sec: SectionId } | null = null;
  let bestTraffic = 1;
  for (const s of game.net.sections) {
    const ss = st.sections[s.id];
    if (!ss.owner || ss.owner === p.id) continue;
    if (lines.some((l) => game.lineUses(l, s.id))) continue;
    for (const [here, y] of [[s.a, s.b], [s.b, s.a]] as const) {
      // need one of our own sections touching `here`
      const own = game.net.adj[here].find((e) => st.sections[e.section].owner === p.id && e.to !== y);
      if (!own) continue;
      const waiting = (st.waiting[here]?.length ?? 0) + (st.waiting[y]?.length ?? 0);
      const traffic = ss.traffic + waiting * 2 + stationValue(game, y) * 0.05;
      if (traffic > bestTraffic) {
        bestTraffic = traffic;
        best = { x: own.to, here, y, sec: s.id };
      }
    }
  }
  if (!best) return;
  const cost = game.trainCost(2) * 2;
  if (p.money < cost + tune.reserve) return;
  // extend an existing line if it ends at `here`
  let line: Line | undefined;
  for (const l of lines) {
    const last = l.stations[l.stations.length - 1];
    const first = l.stations[0];
    if (last === best.here && !l.stations.includes(best.y)) {
      if (game.apply(p.id, { type: "extendLine", line: l.id, station: best.y, end: "end" }).ok) line = l;
    } else if (first === best.here && !l.stations.includes(best.y)) {
      if (game.apply(p.id, { type: "extendLine", line: l.id, station: best.y, end: "start" }).ok) line = l;
    }
    if (line) break;
  }
  if (!line) {
    const r = game.apply(p.id, { type: "createLine", stations: [best.x, best.here, best.y] });
    if (!r.ok) return;
    line = game.linesOf(p.id).at(-1);
  }
  if (!line) return;
  const rivalFare = Math.min(
    ...st.lines.filter((l) => l.owner !== p.id && game.lineUses(l, best!.sec)).map((l) => l.fare),
    st.settings.defaultFare
  );
  game.apply(p.id, { type: "setFare", line: line.id, fare: rivalFare - tune.undercut });
  game.apply(p.id, { type: "setTrains", line: line.id, trains: Math.max(3, line.trains + 1) });
}

function adjustFares(game: Game, p: Player) {
  const st = game.state;
  for (const l of game.linesOf(p.id)) {
    const contested = l.stations.some((s, i) => {
      if (i === l.stations.length - 1) return false;
      const sec = sectionBetween(game.net, s, l.stations[i + 1]);
      if (!sec) return false;
      return st.lines.some((o) => o.owner !== p.id && game.lineUses(o, sec.id));
    });
    if (!contested && loadFactor(l) > 0.6 && l.fare < 2.5) game.apply(p.id, { type: "setFare", line: l.id, fare: l.fare + 0.25 });
    if (contested && l.fare > st.settings.defaultFare) game.apply(p.id, { type: "setFare", line: l.id, fare: st.settings.defaultFare });
  }
}

export { sectionId };
