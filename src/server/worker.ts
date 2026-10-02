import { DurableObject } from "cloudflare:workers";
import { isRoomCode, makeRoomCode } from "../shared/protocol";
import { RoomCore } from "../shared/room";
import { dailyLabel, isDailyDate, sydneyDate, validScore, type DailyEntry } from "../shared/daily";

export interface Env {
  ROOMS: DurableObjectNamespace<GameRoom>;
  BOARDS: DurableObjectNamespace<DailyBoard>;
  ASSETS: Fetcher;
}

const TICK_MS = 250;
const SAVE_EVERY_MS = 10_000;
const IDLE_STOP_MS = 120_000;
const FORGET_AFTER_MS = 7 * 24 * 60 * 60 * 1000; // rooms nobody has touched for a week are deleted

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return Response.json({ ok: true });
    if (url.pathname === "/api/rooms" && request.method === "POST") {
      return Response.json({ code: makeRoomCode() });
    }
    const m = url.pathname.match(/^\/api\/rooms\/([A-Za-z]{4})\/ws$/);
    if (m) {
      const code = m[1].toUpperCase();
      if (!isRoomCode(code)) return new Response("Bad room code", { status: 400 });
      if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
      return stub.fetch(new Request(`https://room/${code}`, request));
    }
    const d = url.pathname.match(/^\/api\/daily\/(\d{4}-\d{2}-\d{2})$/);
    if (d) {
      const date = d[1];
      if (!isDailyDate(date)) return new Response("Bad date", { status: 400 });
      const stub = env.BOARDS.get(env.BOARDS.idFromName(date));
      const token = url.searchParams.get("token") ?? "";
      if (request.method === "GET") return Response.json(await stub.top(token));
      if (request.method === "POST") {
        // only today's (or yesterday's, for late finishers) board takes new scores
        const now = Date.now();
        if (date !== sydneyDate(new Date(now)) && date !== sydneyDate(new Date(now - 86400000))) return new Response("That day is over", { status: 409 });
        let body: { name?: unknown; token?: unknown; score?: unknown };
        try {
          body = await request.json();
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }
        const name = typeof body.name === "string" ? body.name.replace(/[^\p{L}\p{N} '._-]/gu, "").trim().slice(0, 16) : "";
        const tok = typeof body.token === "string" && /^[A-Za-z0-9_-]{6,64}$/.test(body.token) ? body.token : "";
        if (!name || !tok || !validScore(body.score)) return new Response("Bad entry", { status: 400 });
        return Response.json(await stub.submit(tok, name, body.score));
      }
      return new Response("Method not allowed", { status: 405 });
    }
    if (url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;

/** One Durable Object per room code. It owns the authoritative game and runs the tick loop. */
export class GameRoom extends DurableObject<Env> {
  private core: RoomCore | null = null;
  private loop: ReturnType<typeof setInterval> | null = null;
  private lastTick = 0;
  private lastSave = 0;
  private idleSince = 0;
  private sockets = new Map<string, WebSocket>();
  private nextConn = 1;

  private async load(code: string): Promise<RoomCore> {
    if (this.core) return this.core;
    let saved: string | null = null;
    try {
      const n = (await this.ctx.storage.get<number>("chunks")) ?? 0;
      if (n > 0) {
        const parts = await this.ctx.storage.get<string>(Array.from({ length: n }, (_, i) => `room:${i}`));
        saved = Array.from({ length: n }, (_, i) => parts.get(`room:${i}`) ?? "").join("");
      }
      this.core = saved ? RoomCore.restore(saved) : new RoomCore(code);
    } catch {
      this.core = new RoomCore(code); // corrupt save: start fresh rather than lock the room
    }
    return this.core;
  }

  async fetch(request: Request): Promise<Response> {
    const code = new URL(request.url).pathname.slice(1).toUpperCase();
    const core = await this.load(code);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const id = `c${this.nextConn++}`;
    this.sockets.set(id, server);
    core.connect({
      id,
      send: (msg) => {
        try {
          server.send(JSON.stringify(msg));
        } catch {
          /* socket closed */
        }
      }
    });
    server.addEventListener("message", (ev) => {
      let msg: unknown;
      try {
        msg = JSON.parse(typeof ev.data === "string" ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer));
      } catch {
        return;
      }
      try {
        core.message(id, msg);
      } catch (err) {
        console.error("message failed", err);
      }
      this.ensureLoop();
      if (core.dirty && !core.running) this.saveSoon();
    });
    const close = () => {
      if (!this.sockets.has(id)) return;
      this.sockets.delete(id);
      core.disconnect(id);
      this.save();
    };
    server.addEventListener("close", close);
    server.addEventListener("error", close);
    this.ensureLoop();
    return new Response(null, { status: 101, webSocket: client });
  }

  private ensureLoop() {
    if (this.loop) return;
    this.lastTick = Date.now();
    this.idleSince = 0;
    this.loop = setInterval(() => this.onTick(), TICK_MS);
  }

  private onTick() {
    const core = this.core;
    if (!core) return;
    const now = Date.now();
    const dt = Math.min(1, (now - this.lastTick) / 1000);
    this.lastTick = now;
    if (core.connectionCount === 0) {
      // nobody is watching: pause the game, and stop the loop after a while
      if (!this.idleSince) this.idleSince = now;
      if (now - this.idleSince > IDLE_STOP_MS) {
        clearInterval(this.loop!);
        this.loop = null;
        this.save();
      }
      return;
    }
    this.idleSince = 0;
    try {
      core.housekeep(now);
      core.tick(dt);
    } catch (err) {
      console.error("tick failed", err);
    }
    if (now - this.lastSave > SAVE_EVERY_MS) this.save();
  }

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  /** Lobby changes can come in bursts: save at most once a second. */
  private saveSoon() {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.save();
    }, 1000);
  }

  /** Save in 100 KB chunks so a big game never hits the per-value storage limit. */
  private save() {
    if (!this.core || !this.core.dirty) return;
    this.lastSave = Date.now();
    this.core.dirty = false;
    const json = this.core.serialize();
    const CHUNK = 100_000;
    const entries: Record<string, string | number> = {};
    const n = Math.ceil(json.length / CHUNK);
    for (let i = 0; i < n; i++) entries[`room:${i}`] = json.slice(i * CHUNK, (i + 1) * CHUNK);
    entries.chunks = n;
    this.ctx.storage.put(entries).catch(() => {
      if (this.core) this.core.dirty = true;
    });
    void this.ctx.storage.setAlarm(Date.now() + FORGET_AFTER_MS);
  }

  /** A week with no activity: forget the room entirely. */
  async alarm() {
    if (this.sockets.size > 0) {
      await this.ctx.storage.setAlarm(Date.now() + FORGET_AFTER_MS);
      return;
    }
    await this.ctx.storage.deleteAll();
    this.core = null;
  }
}

/** One leaderboard per Sydney day. Keeps each player's best score (by browser token). */
export class DailyBoard extends DurableObject<Env> {
  private async entries(): Promise<Record<string, { name: string; score: number }>> {
    return (await this.ctx.storage.get<Record<string, { name: string; score: number }>>("entries")) ?? {};
  }

  async top(token: string): Promise<{ top: DailyEntry[]; players: number; you: DailyEntry | null; rank: number }> {
    const all = await this.entries();
    const sorted = Object.entries(all).sort((a, b) => b[1].score - a[1].score);
    const view = ([tok, e]: [string, { name: string; score: number }]): DailyEntry => ({ name: e.name, score: e.score, label: dailyLabel(e.score), you: tok === token || undefined });
    const i = token ? sorted.findIndex(([tok]) => tok === token) : -1;
    return { top: sorted.slice(0, 10).map(view), players: sorted.length, you: i >= 0 ? view(sorted[i]) : null, rank: i + 1 };
  }

  async submit(token: string, name: string, score: number) {
    const all = await this.entries();
    const had = all[token];
    if (!had || score > had.score || name !== had.name) all[token] = { name, score: Math.max(score, had?.score ?? 0) };
    // keep the board small: drop the lowest if it grows huge
    const keys = Object.keys(all);
    if (keys.length > 500) {
      keys.sort((a, b) => all[a].score - all[b].score);
      for (const k of keys.slice(0, keys.length - 500)) if (k !== token) delete all[k];
    }
    await this.ctx.storage.put("entries", all);
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return this.top(token);
  }

  async alarm() {
    await this.ctx.storage.deleteAll(); // old boards are forgotten after two weeks
  }
}
