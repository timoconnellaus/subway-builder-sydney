import { describe, expect, it } from "vitest";
import { buildNetwork, createTutorial, MAPS, Session, type MapDef } from "../src/sim";
import { tuning } from "../src/sim/bots";

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

describe("greater sydney", () => {
  it("is a connected network and bots can play it", async () => {
    const { MAPS: maps } = await import("../src/sim");
    const map = maps.greater;
    const net = buildNetwork(map);
    const seen = new Set(["central"]);
    const stack = ["central"];
    while (stack.length) {
      const s = stack.pop()!;
      for (const e of net.adj[s]) if (!seen.has(e.to)) (seen.add(e.to), stack.push(e.to));
    }
    expect(seen.size).toBe(net.stations.length);
    const s = Session.create(map, [
      { id: "a", name: "A", color: "red", hub: "central", isBot: true, botStyle: "builder" },
      { id: "b", name: "B", color: "blue", hub: "parramatta", isBot: true, botStyle: "raider" }
    ], { roundMinutes: 300 });
    s.tick(300);
    expect(s.state.phase).toBe("over");
    expect(s.snapshot().mapId).toBe("greater");
  });
});

describe("line names", () => {
  it("cleans and stores names", () => {
    const s = Session.create(MAPS.sydney, [{ id: "p", name: "P", color: "red", hub: "central" }]);
    s.command("p", { type: "open", section: "central~redfern" });
    s.command("p", { type: "createLine", stations: ["central", "redfern"] });
    const id = s.state.lines[0].id;
    expect(s.command("p", { type: "renameLine", line: id, name: "  Dad <b>Express</b>!!  " }).ok).toBe(true);
    expect(s.state.lines[0].name).toBe("Dad bExpressb!!");
    expect(s.command("p", { type: "renameLine", line: id, name: "x".repeat(100) }).ok).toBe(false);
  });
});

describe("daily challenge", () => {
  it("is the same for everyone on a day and varies across days", async () => {
    const { dailyChallenge, dailyScore, dailyLabel, validScore } = await import("../src/shared/daily");
    const a = dailyChallenge("2026-10-02");
    expect(dailyChallenge("2026-10-02")).toEqual(a);
    const days = Array.from({ length: 30 }, (_, i) => dailyChallenge(`2026-11-${String(i + 1).padStart(2, "0")}`));
    expect(new Set(days.map((d) => d.twist)).size).toBeGreaterThan(3);
    expect(new Set(days.map((d) => d.slot)).size).toBe(4);
    for (const d of days) expect(new Set(d.bots).size).toBe(d.bots.length);
    expect(dailyScore(true, 300, 0.6)).toBeGreaterThan(dailyScore(true, 400, 0.7));
    expect(dailyScore(true, 900, 0.6)).toBeGreaterThan(dailyScore(false, 900, 0.59));
    expect(dailyLabel(dailyScore(true, 412, 0.6))).toBe("Won in 6:52");
    expect(dailyLabel(dailyScore(false, 600, 0.38))).toBe("Owned 38%");
    expect(validScore(dailyScore(true, 412, 0.6))).toBe(true);
    expect(validScore(3000)).toBe(false);
    expect(validScore(9999)).toBe(false); // "won in 1 minute" is not believable
  });

  it("seeded games start the same way", () => {
    const players = [
      { id: "A", name: "A", color: "red" as const, hub: "central", isBot: true, botStyle: "raider" as const },
      { id: "B", name: "B", color: "blue" as const, hub: "parramatta", isBot: true, botStyle: "builder" as const }
    ];
    const run = () => {
      const s = Session.create(MAPS.sydney, players, { roundMinutes: 300 }, 1234);
      s.tick(200);
      return JSON.stringify(s.snapshot().sections);
    };
    expect(run()).toBe(run());
  });
});

describe("world maps", () => {
  it("no track is drawn straight through a station it doesn't stop at", () => {
    for (const [id, m] of Object.entries(MAPS)) {
      const k = Math.cos((m.bounds.lat0 * Math.PI) / 180) * 111;
      const xy = (s: { lon: number; lat: number }) => [s.lon * k, s.lat * 111];
      const st = Object.fromEntries(m.stations.map((s) => [s.id, s]));
      for (const sec of m.sections) {
        const [ax, ay] = xy(st[sec.a]);
        const [bx, by] = xy(st[sec.b]);
        const L2 = (bx - ax) ** 2 + (by - ay) ** 2;
        for (const s of m.stations) {
          if (s.id === sec.a || s.id === sec.b) continue;
          const [px, py] = xy(s);
          const t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / L2;
          if (t <= 0.05 || t >= 0.95) continue;
          const km = Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
          expect(km, `${id}: ${sec.a}–${sec.b} passes ${s.id}`).toBeGreaterThan(0.6);
        }
      }
    }
  });

  it("every map is connected, has valid hubs and events, and plays a bot round", () => {
    for (const [id, map] of Object.entries(MAPS)) {
      const net = buildNetwork(map);
      expect(map.hubs.length, id).toBe(4);
      for (const h of map.hubs) expect(net.station[h], `${id} hub ${h}`).toBeTruthy();
      for (const e of map.events ?? []) expect(net.station[e.station], `${id} event ${e.station}`).toBeTruthy();
      // everything reachable from the first hub
      const seen = new Set([map.hubs[0]]);
      const queue = [map.hubs[0]];
      while (queue.length) for (const e of net.adj[queue.pop()!]) if (!seen.has(e.to)) (seen.add(e.to), queue.push(e.to));
      expect(seen.size, id).toBe(map.stations.length);
      const s = Session.create(
        map,
        map.hubs.slice(0, 3).map((hub, i) => ({ id: `P${i}`, name: `B${i}`, color: (["red", "blue", "gold"] as const)[i], hub, isBot: true, botStyle: (["builder", "raider", "banker"] as const)[i] })),
        { roundMinutes: 200 },
        7
      );
      s.tick(200);
      expect(s.snapshot().players.some((p) => p.owned > 0), id).toBe(true);
    }
  });
});

describe("tutorial", () => {
  it("undercutting Western Rail with more trains captures Ashfield – Strathfield quickly", () => {
    const s = createTutorial("You");
    const st = s.state;
    s.command("P1", { type: "open", section: "central~redfern" });
    s.command("P1", { type: "open", section: "ashfield~redfern" });
    s.command("P1", { type: "createLine", stations: ["central", "redfern", "ashfield"] });
    const line = st.lines.find((l) => l.owner === "P1")!.id;
    s.command("P1", { type: "setTrains", line, trains: 2 });
    s.tick(60);
    expect(s.command("P1", { type: "extendLine", line, station: "strathfield", end: "end" }).ok).toBe(true);
    s.command("P1", { type: "setFare", line, fare: 1.25 });
    s.command("P1", { type: "setTrains", line, trains: 4 });
    s.tick(120); // two real minutes
    expect(st.sections["ashfield~strathfield"].owner).toBe("P1");
    // the run that captures is announced as a capture, not as a last "nobody boarded" warning
    const need = st.settings.emptyToCapture;
    expect(st.events.some((e) => e.kind === "capture" && e.section === "ashfield~strathfield")).toBe(true);
    expect(st.events.some((e) => e.kind === "empty" && e.run >= need)).toBe(false);
  });
});

describe("winning on the clock", () => {
  it("goes to whoever owns the most track, not the most passengers", () => {
    const s = Session.create(
      MAPS.sydney,
      [
        { id: "A", name: "A", color: "red", hub: "central" },
        { id: "B", name: "B", color: "blue", hub: "parramatta" }
      ],
      { roundMinutes: 30, events: 0 }
    );
    const st = s.state;
    for (const id of ["central~redfern", "central~kingscross", "central~randwick"]) st.sections[id].owner = "A";
    for (const id of ["granville~parramatta", "blacktown~parramatta"]) st.sections[id].owner = "B";
    st.players[1].carried = 99999;
    s.tick(31);
    expect(st.phase).toBe("over");
    expect(st.winner).toBe("A");
  });
});

describe("easy bots", () => {
  it("never cut fares below the easy floor or run more than 4 lines", () => {
    const s = Session.create(
      MAPS.sydney,
      [
        { id: "A", name: "A", color: "red", hub: "central", isBot: true, botStyle: "raider" },
        { id: "B", name: "B", color: "blue", hub: "parramatta", isBot: true, botStyle: "banker" },
        { id: "C", name: "C", color: "gold", hub: "airport", isBot: true, botStyle: "builder" }
      ],
      { roundMinutes: 600, botSkill: 1 },
      11
    );
    for (let t = 0; t < 600 && s.state.phase === "running"; t += 20) {
      s.tick(20);
      for (const id of ["A", "B", "C"]) expect(s.state.lines.filter((l) => l.owner === id).length).toBeLessThanOrEqual(4);
    }
    expect(tuning("raider", 1)).toMatchObject({ fareFloor: 1.25, maxLines: 4, retake: false, richAttack: false });
    expect(tuning("raider", 2)).toMatchObject({ fareFloor: 0, retake: true });
  });
});

describe("easy bots and people", () => {
  it("never run trains on track a person owns", () => {
    const s = Session.create(
      MAPS.sydney,
      [
        { id: "H", name: "Kid", color: "red", hub: "central" },
        { id: "A", name: "A", color: "blue", hub: "parramatta", isBot: true, botStyle: "raider" },
        { id: "B", name: "B", color: "gold", hub: "airport", isBot: true, botStyle: "builder" }
      ],
      { roundMinutes: 900, botSkill: 1, startMoney: 20000 },
      5
    );
    // the kid owns a busy patch in the middle and never defends it
    for (const id of ["central~redfern", "ashfield~redfern", "ashfield~strathfield", "central~kingscross", "mascot~redfern"]) s.command("H", { type: "open", section: id });
    const human = new Set(Object.keys(s.state.sections).filter((k) => s.state.sections[k].owner === "H"));
    expect(human.size).toBeGreaterThanOrEqual(4);
    for (let t = 0; t < 900 && s.state.phase === "running"; t += 15) {
      s.tick(15);
      for (const l of s.state.lines) {
        if (l.owner === "H") continue;
        for (let i = 0; i < l.stations.length - 1; i++) {
          const sec = [l.stations[i], l.stations[i + 1]].sort().join("~");
          if (human.has(sec)) expect(s.state.sections[sec].owner).not.toBe("H"); // only allowed if it changed hands some other way
        }
      }
    }
    for (const id of human) expect(s.state.sections[id].owner).toBe("H");
  });
});

describe("comeback", () => {
  it("a company with no track can still run a line from its hub onto rival track", () => {
    const s = Session.create(
      MAPS.sydney,
      [
        { id: "A", name: "A", color: "red", hub: "central" },
        { id: "B", name: "B", color: "blue", hub: "parramatta" }
      ],
      { events: 0 }
    );
    s.state.sections["central~redfern"].owner = "B";
    s.state.sections["ashfield~redfern"].owner = "B";
    s.state.netVersion++;
    expect(s.command("A", { type: "createLine", stations: ["central", "redfern", "ashfield"] }).ok).toBe(true);
    // but not somewhere else entirely on rival track
    expect(s.command("A", { type: "createLine", stations: ["redfern", "ashfield"] }).ok).toBe(false);
  });
});

describe("bot comeback", () => {
  it("a bot with no track runs a line from its hub onto a rival's", () => {
    const s = Session.create(
      MAPS.sydney,
      [
        { id: "A", name: "A", color: "red", hub: "central" },
        { id: "B", name: "B", color: "blue", hub: "parramatta", isBot: true, botStyle: "builder" }
      ],
      { events: 0 }
    );
    for (const e of s.game.net.adj.parramatta) s.state.sections[e.section].owner = "A";
    s.state.netVersion++;
    s.tick(10);
    const lines = s.state.lines.filter((l) => l.owner === "B");
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0].stations).toContain("parramatta");
  });
});
