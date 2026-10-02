import type { Network } from "./network";
import { sectionBetween } from "./network";
import type { GameState, Line, StationId } from "./types";

// Route choice: passengers minimise fare + time x valueOfTime, with a penalty for each change.
// Searched over (station, line) states so changing lines costs extra.

export function lineRunMinutes(net: Network, line: Line, a: number, b: number): number {
  const sec = sectionBetween(net, line.stations[a], line.stations[b]);
  return (sec ? sec.minutes : 3) / speedFactor(line.speed);
}

export function speedFactor(speed: 1 | 2 | 3): number {
  return speed === 1 ? 1 : speed === 2 ? 1.25 : 1.5;
}

export function lineRoundTrip(net: Network, state: GameState, line: Line): number {
  let t = 0;
  for (let i = 0; i < line.stations.length - 1; i++) t += lineRunMinutes(net, line, i, i + 1);
  return 2 * t + 2 * (line.stations.length - 1) * state.settings.dwellMinutes;
}

export function lineHeadway(net: Network, state: GameState, line: Line): number {
  if (line.trains <= 0) return Infinity;
  return lineRoundTrip(net, state, line) / line.trains;
}

interface HeapItem {
  cost: number;
  node: number;
}

class MinHeap {
  private a: HeapItem[] = [];
  get size() {
    return this.a.length;
  }
  push(x: HeapItem) {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].cost <= a[i].cost) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): HeapItem {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].cost < a[m].cost) m = l;
        if (r < a.length && a[r].cost < a[m].cost) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

export interface RouteTable {
  version: number;
  // paths[origin][dest] = station path or null when unreachable
  paths: Map<StationId, Map<StationId, StationId[] | null>>;
  costs: Map<StationId, Map<StationId, number>>;
}

export class Router {
  private table: RouteTable | null = null;
  constructor(private net: Network) {}

  invalidate() {
    this.table = null;
  }

  private ensure(state: GameState): RouteTable {
    if (!this.table || this.table.version !== state.netVersion) {
      this.table = { version: state.netVersion, paths: new Map(), costs: new Map() };
    }
    return this.table;
  }

  path(state: GameState, from: StationId, to: StationId): StationId[] | null {
    const t = this.ensure(state);
    let m = t.paths.get(from);
    if (!m) {
      this.solve(state, from, t);
      m = t.paths.get(from)!;
    }
    return m.get(to) ?? null;
  }

  cost(state: GameState, from: StationId, to: StationId): number {
    const t = this.ensure(state);
    if (!t.costs.has(from)) this.solve(state, from, t);
    return t.costs.get(from)!.get(to) ?? Infinity;
  }

  private solve(state: GameState, origin: StationId, table: RouteTable) {
    const net = this.net;
    const S = state.settings;
    const lines = state.lines.filter((l) => l.trains > 0 && l.stations.length >= 2);
    const nS = net.stations.length;
    // node ids: station node = stationIndex; line node = nS + offset(line) + position
    const offsets: number[] = [];
    let total = nS;
    for (const l of lines) {
      offsets.push(total);
      total += l.stations.length;
    }
    // where each station appears on each line
    const boardAt: { line: number; pos: number }[][] = Array.from({ length: nS }, () => []);
    lines.forEach((l, li) => l.stations.forEach((s, pos) => boardAt[net.stationIndex[s]].push({ line: li, pos })));
    const headways = lines.map((l) => lineHeadway(net, state, l));

    const dist = new Float64Array(total).fill(Infinity);
    const prev = new Int32Array(total).fill(-1);
    const o = net.stationIndex[origin];
    dist[o] = 0;
    const heap = new MinHeap();
    heap.push({ cost: 0, node: o });
    while (heap.size) {
      const { cost, node } = heap.pop();
      if (cost > dist[node]) continue;
      if (node < nS) {
        // at a station, not on a train: board any line here
        const transfer = node === o ? 0 : S.transferMinutes;
        for (const { line, pos } of boardAt[node]) {
          const wait = Math.min(headways[line] / 2, 30);
          const nn = offsets[line] + pos;
          // flat fare per ride: you pay again every time you board
          const c = cost + lines[line].fare + S.valueOfTime * (wait + transfer);
          if (c < dist[nn]) {
            dist[nn] = c;
            prev[nn] = node;
            heap.push({ cost: c, node: nn });
          }
        }
      } else {
        // on a line: ride to a neighbour, or get off here
        let li = 0;
        while (li + 1 < lines.length && offsets[li + 1] <= node) li++;
        const line = lines[li];
        const pos = node - offsets[li];
        const st = net.stationIndex[line.stations[pos]];
        if (cost < dist[st]) {
          dist[st] = cost;
          prev[st] = node;
          heap.push({ cost, node: st });
        }
        for (const np of [pos - 1, pos + 1]) {
          if (np < 0 || np >= line.stations.length) continue;
          const c = cost + S.valueOfTime * lineRunMinutes(net, line, pos, np);
          const nn = offsets[li] + np;
          if (c < dist[nn]) {
            dist[nn] = c;
            prev[nn] = node;
            heap.push({ cost: c, node: nn });
          }
        }
      }
    }

    const paths = new Map<StationId, StationId[] | null>();
    const costs = new Map<StationId, number>();
    const stationOf = (node: number): StationId => {
      if (node < nS) return net.stations[node].id;
      let li = 0;
      while (li + 1 < lines.length && offsets[li + 1] <= node) li++;
      return lines[li].stations[node - offsets[li]];
    };
    for (let d = 0; d < nS; d++) {
      const id = net.stations[d].id;
      if (d === o || !isFinite(dist[d])) {
        paths.set(id, null);
        continue;
      }
      costs.set(id, dist[d]);
      const seq: StationId[] = [];
      let cur = d;
      while (cur !== -1) {
        const s = stationOf(cur);
        if (seq[seq.length - 1] !== s) seq.push(s);
        cur = prev[cur];
      }
      seq.reverse();
      paths.set(id, seq);
    }
    table.paths.set(origin, paths);
    table.costs.set(origin, costs);
  }
}
