import type { Game } from "./game";
import { sectionBetween, sectionId } from "./network";
import type { BotStyle, Line, Player, SectionId, StationId } from "./types";

// Simple rule-based bots. They act through Game.apply like a human would, so they
// can never break the rules. Each style has one clear personality the player can learn.

interface StyleTuning {
  reserve: number; // money kept back
  openAppetite: number; // 0..1 how keen to open new track
  attack: number; // 0..1 how keen to fight rivals
  undercut: number; // dollars below the rival fare when attacking
  premium: boolean; // raise fares on safe lines
}

const STYLES: Record<BotStyle, StyleTuning> = {
  builder: { reserve: 250, openAppetite: 1, attack: 0.25, undercut: 0.25, premium: false },
  raider: { reserve: 300, openAppetite: 0.5, attack: 1, undercut: 0.75, premium: false },
  banker: { reserve: 600, openAppetite: 0.7, attack: 0.35, undercut: 0.25, premium: true }
};

export function runBots(game: Game, memory: Map<string, number>) {
  const st = game.state;
  if (st.phase !== "running") return;
  st.players.forEach((p, idx) => {
    if (!p.isBot) return;
    const next = memory.get(p.id) ?? 1 + idx * 0.7;
    if (st.time < next) return;
    memory.set(p.id, st.time + 2);
    botTurn(game, p);
  });
}

function botTurn(game: Game, p: Player) {
  const tune = STYLES[p.botStyle ?? "builder"];
  defend(game, p);
  cover(game, p, tune);
  manageTrains(game, p, tune);
  if (Math.random() < tune.attack || p.money > 2500) attack(game, p, tune);
  open(game, p, tune);
  if (tune.premium) adjustFares(game, p);
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
    const far = mine.has(s.a) ? s.b : s.a;
    const score = stationValue(game, far) / game.openCost(s.id) + Math.random() * 0.02;
    if (score > bestScore) {
      bestScore = score;
      best = s.id;
    }
  }
  if (!best) return;
  const cost = game.openCost(best) + game.trainCost(2);
  const keen = game.linesOf(p.id).length === 0 || Math.random() < tune.openAppetite;
  if (keen && p.money >= cost + tune.reserve) game.apply(p.id, { type: "open", section: best });
}

/** Make sure every owned section has one of our trains on it. */
function cover(game: Game, p: Player, tune: StyleTuning) {
  const lines = game.linesOf(p.id);
  for (const s of game.net.sections) {
    if (game.state.sections[s.id].owner !== p.id) continue;
    if (lines.some((l) => game.lineUses(l, s.id))) continue;
    // extend a line that ends at one side of this section
    let done = false;
    for (const l of lines) {
      const first = l.stations[0];
      const last = l.stations[l.stations.length - 1];
      for (const [end, st] of [["end", last], ["start", first]] as const) {
        if (st !== s.a && st !== s.b) continue;
        const other = st === s.a ? s.b : s.a;
        if (l.stations.includes(other) || l.stations.length >= 7) continue;
        if (game.apply(p.id, { type: "extendLine", line: l.id, station: other, end }).ok) {
          done = true;
          break;
        }
      }
      if (done) break;
    }
    if (done) continue;
    if (p.money >= game.trainCost(2) + tune.reserve / 2 || lines.length === 0) {
      game.apply(p.id, { type: "createLine", stations: [s.a, s.b] });
    }
    return; // one change per turn keeps bots readable
  }
}

function loadFactor(l: Line): number {
  return l.capSum > 0 ? l.loadSum / l.capSum : 0;
}

function manageTrains(game: Game, p: Player, tune: StyleTuning) {
  for (const l of game.linesOf(p.id)) {
    const lf = loadFactor(l);
    const cost = game.trainCost(l.cars);
    if (lf > 0.7 && p.money > cost + tune.reserve) {
      if (l.trains < 4 || l.cars >= 6) game.apply(p.id, { type: "setTrains", line: l.id, trains: l.trains + 1 });
      else game.apply(p.id, { type: "setCars", line: l.id, cars: l.cars + 2 });
    } else if (lf < 0.12 && l.trains > 1 && game.state.time > 60 && l.capSum > 50) {
      game.apply(p.id, { type: "setTrains", line: l.id, trains: l.trains - 1 });
    }
  }
}

function defend(game: Game, p: Player) {
  for (const s of game.net.sections) {
    const ss = game.state.sections[s.id];
    if (ss.owner !== p.id || ss.emptyRun < 1) continue;
    for (const l of game.linesOf(p.id)) {
      if (!game.lineUses(l, s.id)) continue;
      game.apply(p.id, { type: "setFare", line: l.id, fare: l.fare - 0.25 });
      if (p.money > game.trainCost(l.cars) + 150) game.apply(p.id, { type: "setTrains", line: l.id, trains: l.trains + 1 });
    }
  }
}

/** Run a line onto a busy rival section next to our network and undercut it. */
function attack(game: Game, p: Player, tune: StyleTuning) {
  const st = game.state;
  const lines = game.linesOf(p.id);
  if (lines.length >= st.settings.maxLinesPerPlayer) return;
  let best: { x: StationId; here: StationId; y: StationId; sec: SectionId } | null = null;
  let bestTraffic = 5;
  for (const s of game.net.sections) {
    const ss = st.sections[s.id];
    if (!ss.owner || ss.owner === p.id) continue;
    if (lines.some((l) => game.lineUses(l, s.id))) continue;
    for (const [here, y] of [[s.a, s.b], [s.b, s.a]] as const) {
      // need one of our own sections touching `here`
      const own = game.net.adj[here].find((e) => st.sections[e.section].owner === p.id && e.to !== y);
      if (!own) continue;
      const traffic = ss.traffic + stationValue(game, y) * 0.05;
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
  game.apply(p.id, { type: "setTrains", line: line.id, trains: line.trains + 1 });
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
