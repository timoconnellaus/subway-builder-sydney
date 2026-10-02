import { DurableObject } from "cloudflare:workers";
import { isRoomCode, makeRoomCode, type ClientMsg } from "../shared/protocol";
import { RoomCore } from "../shared/room";

export interface Env {
  ROOMS: DurableObjectNamespace<GameRoom>;
  ASSETS: Fetcher;
}

const TICK_MS = 250;
const SAVE_EVERY_MS = 10_000;
const IDLE_STOP_MS = 120_000;

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
    const saved = await this.ctx.storage.get<string>("room");
    this.core = saved ? RoomCore.restore(saved) : new RoomCore(code);
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
      let msg: ClientMsg;
      try {
        msg = JSON.parse(typeof ev.data === "string" ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer));
      } catch {
        return;
      }
      core.message(id, msg);
      this.ensureLoop();
      if (core.dirty && !core.running) this.save();
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
    if (core.humansConnected === 0) {
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
    core.tick(dt);
    if (now - this.lastSave > SAVE_EVERY_MS) this.save();
  }

  private save() {
    if (!this.core || !this.core.dirty) return;
    this.lastSave = Date.now();
    this.core.dirty = false;
    this.ctx.storage.put("room", this.core.serialize()).catch(() => {
      if (this.core) this.core.dirty = true;
    });
  }
}
