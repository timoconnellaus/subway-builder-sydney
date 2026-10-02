import { describe, expect, it } from "vitest";
import { SLOTS, startRound, type ServerMsg } from "../src/shared/protocol";
import { RoomCore } from "../src/shared/room";

function client(room: RoomCore, id: string) {
  const inbox: ServerMsg[] = [];
  room.connect({ id, send: (m) => inbox.push(JSON.parse(JSON.stringify(m))) });
  return {
    inbox,
    last<T extends ServerMsg["t"]>(t: T) {
      return [...inbox].reverse().find((m) => m.t === t) as Extract<ServerMsg, { t: T }> | undefined;
    }
  };
}

describe("room", () => {
  it("runs a two-player online game with a bot", () => {
    const room = new RoomCore("ABCD");
    const a = client(room, "c1");
    const b = client(room, "c2");
    room.message("c1", { t: "hello", name: "Dad", token: "tok-a" });
    room.message("c2", { t: "hello", name: "Son", token: "tok-b" });
    expect(a.last("welcome")?.you).toBe("P1");
    expect(b.last("welcome")?.you).toBe("P2");
    const lobby = a.last("lobby")!.lobby;
    expect(lobby.host).toBe("P1");
    expect(lobby.players.map((p) => p.color)).toEqual(["red", "blue"]);

    // only the host can add bots and start
    room.message("c2", { t: "addBot", style: "raider" });
    expect(a.last("lobby")!.lobby.players.length).toBe(2);
    room.message("c1", { t: "addBot", style: "raider" });
    expect(a.last("lobby")!.lobby.players.length).toBe(3);
    room.message("c1", { t: "start" });
    expect(a.last("lobby")!.lobby.phase).toBe("game");

    room.message("c2", { t: "cmd", id: 1, cmd: { type: "open", section: "granville~parramatta" } });
    expect(b.last("ack")).toEqual({ t: "ack", id: 1, ok: true });
    room.message("c2", { t: "cmd", id: 2, cmd: { type: "open", section: "central~redfern" } });
    expect(b.last("ack")?.ok).toBe(false);

    for (let i = 0; i < 40; i++) room.tick(0.25);
    const snap = a.last("snap")!.s;
    expect(snap.time).toBeGreaterThan(9);
    expect(snap.sections["granville~parramatta"].owner).toBe("P2");
    expect(snap.players.length).toBe(3);
    expect(snap.players.map((p) => p.hub)).toEqual(["central", "parramatta", "airport"]);
  });

  it("lets a player reconnect with their token and survives a save/restore", () => {
    const room = new RoomCore("WXYZ");
    client(room, "c1");
    room.message("c1", { t: "hello", name: "Dad", token: "tok-a" });
    room.message("c1", { t: "addBot", style: "builder" });
    room.message("c1", { t: "start" });
    room.message("c1", { t: "cmd", id: 1, cmd: { type: "open", section: "central~redfern" } });
    room.tick(1);
    room.disconnect("c1");

    const restored = RoomCore.restore(room.serialize());
    const again = client(restored, "c9");
    restored.message("c9", { t: "hello", name: "Dad", token: "tok-a" });
    expect(again.last("welcome")?.you).toBe("P1");
    const snap = again.last("snap")!.s;
    expect(snap.sections["central~redfern"].owner).toBe("P1");
    restored.tick(1);
    expect(again.last("snap")!.s.time).toBeGreaterThan(snap.time);
  });

  it("makes late joiners spectators once the game has started", () => {
    const room = new RoomCore("QQQQ");
    client(room, "c1");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c1", { t: "addBot", style: "banker" });
    room.message("c1", { t: "start" });
    const late = client(room, "c2");
    room.message("c2", { t: "hello", name: "B", token: "b" });
    expect(late.last("welcome")?.you).toBe("spectator");
    room.message("c2", { t: "cmd", id: 1, cmd: { type: "open", section: "central~redfern" } });
    expect(late.last("error")).toBeTruthy();
  });

  it("applies allowed house rules and ignores made-up ones", () => {
    const room = new RoomCore("RULE");
    const a = client(room, "c1");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c1", { t: "setOptions", options: { rules: { emptyToCapture: 2, startMoney: 999999, botSkill: 3 } } });
    expect(a.last("lobby")!.lobby.options.rules).toEqual({ emptyToCapture: 2, botSkill: 3 });
    room.message("c1", { t: "addBot", style: "raider" });
    room.message("c1", { t: "start" });
    const snap = a.last("snap") ?? (room.tick(0.25), a.last("snap"))!;
    expect(snap.s.settings.emptyToCapture).toBe(2);
    expect(snap.s.settings.startMoney).toBe(3000);
    expect(snap.s.settings.botSkill).toBe(3);
  });

  it("lets the host pause, and relays emotes", () => {
    const room = new RoomCore("PAWS");
    const a = client(room, "c1");
    const b = client(room, "c2");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c2", { t: "hello", name: "B", token: "b" });
    room.message("c1", { t: "start" });
    room.tick(1);
    const t0 = a.last("snap")!.s.time;
    room.message("c2", { t: "pause", paused: true }); // not the host: ignored
    expect(a.last("lobby")!.lobby.paused).toBe(false);
    room.message("c1", { t: "pause", paused: true });
    expect(b.last("lobby")!.lobby.paused).toBe(true);
    room.tick(1);
    expect(a.last("snap")!.s.time).toBe(t0);
    room.message("c1", { t: "pause", paused: false });
    room.tick(1);
    expect(a.last("snap")!.s.time).toBeGreaterThan(t0);
    room.message("c2", { t: "emote", e: "🎉" });
    room.message("c2", { t: "emote", e: "not an emote" });
    expect(a.inbox.filter((m) => m.t === "emote")).toEqual([{ t: "emote", from: "P2", e: "🎉" }]);
  });
});

describe("hardening", () => {
  it("removes trains properly when cutting a line from 12 to 1, and refunds on delete", async () => {
    const { Session, MAPS } = await import("../src/sim");
    const s = Session.create(MAPS.sydney, [{ id: "p", name: "P", color: "red", hub: "central" }], { startMoney: 100000 });
    s.command("p", { type: "open", section: "central~redfern" });
    s.command("p", { type: "createLine", stations: ["central", "redfern"] });
    const id = s.state.lines[0].id;
    for (let i = 0; i < 5; i++) {
      s.command("p", { type: "setTrains", line: id, trains: 12 });
      s.command("p", { type: "setTrains", line: id, trains: 1 });
    }
    expect(s.state.trains.length).toBe(1);
    expect(s.state.lines[0].trains).toBe(1);
    s.command("p", { type: "setTrains", line: id, trains: 6 });
    const before = s.state.players[0].money;
    s.command("p", { type: "deleteLine", line: id });
    expect(s.state.players[0].money).toBeGreaterThan(before);
    expect(s.state.trains.length).toBe(0);
  });

  it("rejects junk commands and messages without throwing", () => {
    const room = new RoomCore("JUNK");
    const a = client(room, "c1");
    const junk: unknown[] = [
      null, 5, "x", {}, { t: "hello" }, { t: "hello", name: 5, token: "a" }, { t: "setOptions" }, { t: "setSlot" },
      { t: "setSlot", slot: "x" }, { t: "cmd", id: 1, cmd: null }, { t: "addBot", style: "evil" }
    ];
    room.message("c1", { t: "hello", name: "A", token: "a" });
    for (const j of junk) expect(() => room.message("c1", j)).not.toThrow();
    expect(a.last("lobby")!.lobby.players.length).toBe(1);
    room.message("c1", { t: "addBot", style: "raider" });
    room.message("c1", { t: "start" });
    const bad = [
      { type: "createLine", stations: { length: 2 } }, { type: "createLine" }, { type: "setFare", line: "L1", fare: NaN },
      { type: "setTrains", line: "L1", trains: "9" }, { type: "nope" }
    ];
    bad.forEach((cmd, i) => {
      expect(() => room.message("c1", { t: "cmd", id: 10 + i, cmd })).not.toThrow();
      expect(a.last("ack")?.ok).toBe(false);
    });
    expect(() => room.tick(1)).not.toThrow();
  });

  it("keeps one identity per connection so the host can't become a ghost", () => {
    const room = new RoomCore("HOST");
    const h = client(room, "h");
    room.message("h", { t: "hello", name: "H", token: "h" });
    client(room, "x");
    room.message("x", { t: "hello", name: "X", token: "x1" });
    room.message("x", { t: "hello", name: "X2", token: "x2" });
    expect(h.last("lobby")!.lobby.players.length).toBe(2);
    room.disconnect("x");
    const f = client(room, "f");
    room.message("f", { t: "hello", name: "F", token: "f" });
    room.disconnect("h");
    expect(f.last("lobby")!.lobby.host).toBe(f.last("welcome")!.you);
  });

  it("lets players fix fares and build while paused, and says who paused", () => {
    const room = new RoomCore("PAUS");
    const a = client(room, "c1");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c1", { t: "addBot", style: "builder" });
    room.message("c1", { t: "start" });
    room.message("c1", { t: "pause", paused: true });
    room.message("c1", { t: "cmd", id: 1, cmd: { type: "open", section: "central~redfern" } });
    expect(a.last("ack")).toEqual({ t: "ack", id: 1, ok: true });
    const time = a.last("snap")?.s.time;
    room.tick(0.25); // paused: no game time passes, but the change goes out
    expect(a.last("snap")!.s.sections["central~redfern"].owner).toBe(a.last("welcome")!.you);
    expect(a.last("snap")!.s.time).toBe(time ?? 0);
    expect(a.last("lobby")!.lobby.pausedBy).toBe(a.last("welcome")!.you);
    const restored = RoomCore.restore(room.serialize());
    expect(restored.lobby().paused).toBe(true);
  });

  it("shows a player going away while the game is paused", () => {
    const room = new RoomCore("AWAY");
    const a = client(room, "c1");
    const b = client(room, "c2");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c2", { t: "hello", name: "B", token: "b" });
    room.message("c1", { t: "start" });
    room.message("c1", { t: "pause", paused: true });
    const bId = b.last("welcome")!.you;
    room.disconnect("c2");
    room.tick(0.25);
    expect(a.last("snap")!.s.players.find((p) => p.id === bId)!.connected).toBe(false);
    expect(a.last("lobby")!.lobby.players.find((p) => p.id === bId)!.connected).toBe(false);
  });

  it("moves a five-minute round to ten on a bigger map", () => {
    const room = new RoomCore("LONG");
    const a = client(room, "c1");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c1", { t: "setOptions", options: { roundMinutes: 300 } });
    room.message("c1", { t: "setOptions", options: { map: "paris" } });
    expect(a.last("lobby")!.lobby.options.roundMinutes).toBe(600);
    room.message("c1", { t: "setOptions", options: { roundMinutes: 300 } }); // still the host's choice
    expect(a.last("lobby")!.lobby.options.roundMinutes).toBe(300);
  });

  it("starts a round with players in the order given (seeded daily games depend on it)", () => {
    const s = startRound("sydney", [{ id: "P1", name: "You", slot: 2 }, { id: "P2", name: "Bot", slot: 0, botStyle: "builder" }], {}, 600, 7);
    expect(s.state.players.map((p) => [p.id, p.hub, !!p.isBot])).toEqual([["P1", "airport", false], ["P2", "central", true]]);
  });

  it("puts a bot in the seat the host picked", () => {
    const room = new RoomCore("SLOT");
    const a = client(room, "c1");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c1", { t: "addBot", style: "builder", slot: 2 });
    room.message("c1", { t: "addBot", style: "raider", slot: 2 }); // taken: first free seat instead
    const seats = a.last("lobby")!.lobby.players.map((p) => [p.botStyle ?? "human", p.color]);
    expect(seats).toEqual([["human", SLOTS[0].color], ["raider", SLOTS[1].color], ["builder", SLOTS[2].color]]);
  });

  it("frees lobby seats of players who left a minute ago", () => {
    const room = new RoomCore("SEAT");
    const a = client(room, "c1");
    client(room, "c2");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c2", { t: "hello", name: "B", token: "b" });
    room.disconnect("c2");
    room.housekeep(Date.now() + 30_000);
    expect(a.last("lobby")!.lobby.players.length).toBe(2);
    room.housekeep(Date.now() + 61_000);
    expect(a.last("lobby")!.lobby.players.length).toBe(1);
  });

  it("counts wins across rounds", () => {
    const room = new RoomCore("WINS");
    const a = client(room, "c1");
    room.message("c1", { t: "hello", name: "A", token: "a" });
    room.message("c1", { t: "addBot", style: "builder" });
    room.message("c1", { t: "setOptions", options: { roundMinutes: 300 } });
    room.message("c1", { t: "start" });
    for (let i = 0; i < 320; i++) room.tick(1);
    const lobby = a.last("lobby")!.lobby;
    expect(lobby.phase).toBe("over");
    expect(lobby.rounds).toBe(1);
    expect(Object.values(lobby.wins).reduce((x, y) => x + y, 0)).toBe(1);
    room.message("c1", { t: "rematch" });
    expect(RoomCore.restore(room.serialize()).lobby().rounds).toBe(1);
  });
});

describe("hosting", () => {
  it("gives hosting back to the room's creator when they reconnect", () => {
    const room = new RoomCore("HOST");
    client(room, "c1");
    const kid = client(room, "c2");
    room.message("c1", { t: "hello", name: "Dad", token: "tok-dad" });
    room.message("c2", { t: "hello", name: "Kid", token: "tok-kid" });
    room.message("c1", { t: "start" });
    room.disconnect("c1");
    expect(kid.last("lobby")!.lobby.host).toBe("P2");
    const again = client(room, "c3");
    room.message("c3", { t: "hello", name: "Dad", token: "tok-dad" });
    expect(again.last("lobby")!.lobby.host).toBe("P1");
    // and it survives a save
    const restored = RoomCore.restore(room.serialize());
    client(restored, "c4");
    restored.message("c4", { t: "hello", name: "Kid", token: "tok-kid" });
    expect(restored.serialize()).toContain('"owner":"P1"');
  });

  it("lets players change their name in the lobby", () => {
    const room = new RoomCore("NAME");
    const a = client(room, "c1");
    room.message("c1", { t: "hello", name: "", token: "tok-a" });
    expect(a.last("lobby")!.lobby.players[0].name).toBe("Player");
    room.message("c1", { t: "setName", name: "Sam<b>" });
    expect(a.last("lobby")!.lobby.players[0].name).toBe("Samb");
  });
});
