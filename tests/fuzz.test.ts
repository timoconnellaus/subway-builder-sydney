import { describe, expect, it } from "vitest";
import { MAPS, Session, type Command } from "../src/sim";

// Random commands from every player while bots play: the game must never break its own rules.
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

describe("fuzz", () => {
  for (const seed of [1, 2, 3]) {
    it(`keeps trains, passengers and money consistent (seed ${seed})`, () => {
      const r = rng(seed);
      const s = Session.create(
        MAPS.sydney,
        [
          { id: "a", name: "A", color: "red", hub: "central" },
          { id: "b", name: "B", color: "blue", hub: "parramatta" },
          { id: "c", name: "C", color: "gold", hub: "airport", isBot: true, botStyle: "raider" }
        ],
        { startMoney: 20000, winShare: 2 }
      );
      const net = s.game.net;
      const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
      for (let step = 0; step < 1500; step++) {
        const who = r() < 0.5 ? "a" : "b";
        const mine = s.state.lines.filter((l) => l.owner === who);
        const line = mine.length ? pick(mine).id : "L0";
        const st = pick(net.stations).id;
        const cmds: Command[] = [
          { type: "open", section: pick(net.sections).id },
          { type: "createLine", stations: [st, ...net.adj[st].slice(0, 1).map((e) => e.to)] },
          { type: "extendLine", line, station: pick(net.stations).id, end: r() < 0.5 ? "start" : "end" },
          { type: "trimLine", line, end: r() < 0.5 ? "start" : "end" },
          { type: "setTrains", line, trains: Math.floor(r() * 14) - 1 },
          { type: "setCars", line, cars: Math.floor(r() * 10) },
          { type: "setSpeed", line, speed: (1 + Math.floor(r() * 3)) as 1 | 2 | 3 },
          { type: "setFare", line, fare: r() * 6 - 1 },
          { type: "deleteLine", line }
        ];
        s.command(who, pick(cmds));
        if (step % 5 === 0) s.tick(1 + r() * 3);
      }
      const state = s.state;
      for (const l of state.lines) {
        const trains = state.trains.filter((t) => t.line === l.id);
        expect(trains.length).toBe(l.trains);
        expect(l.trains).toBeLessThanOrEqual(state.settings.maxTrainsPerLine);
        for (const t of trains) {
          expect(t.at).toBeGreaterThanOrEqual(0);
          expect(t.at).toBeLessThan(l.stations.length);
          expect(t.load).toBeGreaterThanOrEqual(0);
          expect(t.load).toBeLessThanOrEqual(l.cars * state.settings.carSeats);
        }
      }
      // every group is either waiting at one station or on one train
      const seen = new Map<number, number>();
      for (const sid in state.waiting) for (const g of state.waiting[sid]) seen.set(g, (seen.get(g) ?? 0) + 1);
      for (const t of state.trains) for (const g of t.groups) seen.set(g, (seen.get(g) ?? 0) + 1);
      for (const [, n] of seen) expect(n).toBe(1);
      for (const id in state.groups) expect(seen.has(Number(id))).toBe(true);
      for (const p of state.players) expect(Number.isFinite(p.money)).toBe(true);
    });
  }
});
