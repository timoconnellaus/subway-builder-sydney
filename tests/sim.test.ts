import { describe, expect, it } from "vitest";
import { buildNetwork, MAPS, Session, type MapDef } from "../src/sim";

// A tiny three-station line. All demand is between A and C, so every passenger rides A–B–C.
const LINE_MAP: MapDef = {
  id: "test-line",
  name: "Test",
  bounds: { lon0: 151, lon1: 151.1, lat0: -33.8, lat1: -33.9 },
  hubs: ["A", "C"],
  stations: [
    { id: "A", name: "A", lon: 151.0, lat: -33.85, pop: 100, jobs: 0 },
    { id: "B", name: "B", lon: 151.03, lat: -33.85, pop: 0, jobs: 0 },
    { id: "C", name: "C", lon: 151.06, lat: -33.85, pop: 0, jobs: 100 }
  ],
  sections: [
    { a: "A", b: "B", minutes: 3 },
    { a: "B", b: "C", minutes: 3 }
  ]
};

function duel(red: { fare: number; trains: number; cars: number }, minutes = 150) {
  const s = Session.create(
    LINE_MAP,
    [
      { id: "blue", name: "Blue", color: "blue", hub: "A" },
      { id: "red", name: "Red", color: "red", hub: "C" }
    ],
    { startMoney: 100000, demandPerMinute: 20, winShare: 2 }
  );
  s.state.sections["A~B"].owner = "blue";
  s.state.sections["B~C"].owner = "red";
  s.state.netVersion++;
  expect(s.command("blue", { type: "createLine", stations: ["A", "B", "C"] })).toEqual({ ok: true });
  expect(s.command("red", { type: "createLine", stations: ["A", "B", "C"] })).toEqual({ ok: true });
  const blueLine = s.state.lines[0].id;
  const redLine = s.state.lines[1].id;
  s.command("blue", { type: "setTrains", line: blueLine, trains: 2 });
  s.command("blue", { type: "setCars", line: blueLine, cars: 4 });
  s.command("red", { type: "setFare", line: redLine, fare: red.fare });
  s.command("red", { type: "setTrains", line: redLine, trains: red.trains });
  s.command("red", { type: "setCars", line: redLine, cars: red.cars });
  s.tick(minutes);
  return s;
}

describe("network", () => {
  it("builds Sydney with valid, connected sections", () => {
    const net = buildNetwork(MAPS.sydney);
    expect(net.sections.length).toBeGreaterThan(35);
    // every station reachable from Central
    const seen = new Set(["central"]);
    const stack = ["central"];
    while (stack.length) {
      const s = stack.pop()!;
      for (const e of net.adj[s]) if (!seen.has(e.to)) (seen.add(e.to), stack.push(e.to));
    }
    expect(seen.size).toBe(net.stations.length);
    const total = net.od.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 6);
  });
});

describe("rules", () => {
  it("only lets you open track next to your network", () => {
    const s = Session.create(MAPS.sydney, [{ id: "p", name: "P", color: "red", hub: "central" }]);
    expect(s.command("p", { type: "open", section: "lidcombe~strathfield" }).ok).toBe(false);
    expect(s.command("p", { type: "open", section: "central~redfern" }).ok).toBe(true);
    expect(s.command("p", { type: "open", section: "ashfield~redfern" }).ok).toBe(true);
    expect(s.state.sections["ashfield~redfern"].owner).toBe("p");
  });

  it("requires lines to use opened track and one owned section", () => {
    const s = Session.create(MAPS.sydney, [
      { id: "p", name: "P", color: "red", hub: "central" },
      { id: "q", name: "Q", color: "blue", hub: "parramatta" }
    ]);
    expect(s.command("p", { type: "createLine", stations: ["central", "redfern"] }).ok).toBe(false);
    s.command("p", { type: "open", section: "central~redfern" });
    expect(s.command("p", { type: "createLine", stations: ["central", "redfern"] }).ok).toBe(true);
    // q owns nothing yet, so can't run on p's track
    expect(s.command("q", { type: "createLine", stations: ["central", "redfern"] }).ok).toBe(false);
  });

  it("carries passengers and earns fares", () => {
    const s = Session.create(MAPS.sydney, [{ id: "p", name: "P", color: "red", hub: "central" }]);
    s.command("p", { type: "open", section: "central~redfern" });
    s.command("p", { type: "open", section: "ashfield~redfern" });
    s.command("p", { type: "createLine", stations: ["central", "redfern", "ashfield"] });
    const before = s.state.players[0].money;
    s.tick(120);
    expect(s.state.players[0].carried).toBeGreaterThan(50);
    expect(s.state.players[0].income).toBeGreaterThan(0);
    expect(s.state.players[0].money).not.toBe(before);
  });
});

describe("fare wars", () => {
  it("cheap, frequent, roomy trains capture a rival section", () => {
    const s = duel({ fare: 0.75, trains: 4, cars: 6 });
    expect(s.state.sections["A~B"].owner).toBe("red");
    expect(s.state.events.some((e) => e.kind === "capture")).toBe(true);
  });

  it("a rare train at the same fare doesn't", () => {
    const s = duel({ fare: 1.5, trains: 1, cars: 2 });
    expect(s.state.sections["A~B"].owner).toBe("blue");
  });

  it("a cheap but rare train doesn't empty the rival's trains", () => {
    const s = duel({ fare: 1.25, trains: 1, cars: 2 });
    expect(s.state.sections["A~B"].owner).toBe("blue");
  });
});

describe("bots", () => {
  it("play a whole round without breaking", () => {
    const s = Session.create(
      MAPS.sydney,
      [
        { id: "a", name: "Builder", color: "red", hub: "central", isBot: true, botStyle: "builder" },
        { id: "b", name: "Raider", color: "blue", hub: "parramatta", isBot: true, botStyle: "raider" },
        { id: "c", name: "Banker", color: "gold", hub: "airport", isBot: true, botStyle: "banker" }
      ],
      { roundMinutes: 600 }
    );
    s.tick(600);
    expect(s.state.phase).toBe("over");
    for (const p of s.state.players) expect(Number.isFinite(p.money)).toBe(true);
    const owned = Object.values(s.state.sections).filter((x) => x.owner).length;
    expect(owned).toBeGreaterThan(8);
    expect(s.state.lines.length).toBeGreaterThan(2);
    const snap = s.snapshot();
    expect(JSON.stringify(snap).length).toBeLessThan(200_000);
  });
});

describe("editing lines", () => {
  it("shortens a line without losing trains or passengers' sanity", () => {
    const s = Session.create(MAPS.sydney, [{ id: "p", name: "P", color: "red", hub: "central" }], { startMoney: 50000 });
    for (const sec of ["central~redfern", "ashfield~redfern", "ashfield~strathfield"]) s.command("p", { type: "open", section: sec });
    expect(s.command("p", { type: "createLine", stations: ["central", "redfern", "ashfield", "strathfield"] }).ok).toBe(true);
    const id = s.state.lines[0].id;
    s.command("p", { type: "setTrains", line: id, trains: 6 });
    s.tick(37);
    expect(s.command("p", { type: "trimLine", line: id, end: "end" }).ok).toBe(true);
    expect(s.command("p", { type: "trimLine", line: id, end: "start" }).ok).toBe(true);
    expect(s.command("p", { type: "trimLine", line: id, end: "start" }).ok).toBe(false);
    const line = s.state.lines[0];
    expect(line.stations).toEqual(["redfern", "ashfield"]);
    for (const t of s.state.trains) {
      expect(t.at).toBeGreaterThanOrEqual(0);
      expect(t.at).toBeLessThan(line.stations.length);
    }
    s.tick(60);
    for (const t of s.state.trains) expect(t.at).toBeLessThan(line.stations.length);
    expect(s.state.players[0].carried).toBeGreaterThan(0);
  });
});
