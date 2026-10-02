import { describe, expect, it } from "vitest";
import type { ServerMsg } from "../src/shared/protocol";
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
    expect(lobby.players.map((p) => p.hub)).toEqual(["central", "parramatta"]);

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
});
