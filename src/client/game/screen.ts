import { MAPS, type Snapshot, type StationId, type LineView, type PlayerView, type SectionId } from "../../sim";
import { ruleLabel, type GameEvent } from "../../sim/types";
import type { GameConn } from "../conn";
import { COLORS, CSS_COLORS, esc, fare, h, money, patch, readRecord, remaining, setStorage, storage } from "../util";
import { EMOTES } from "../../shared/protocol";
import { MapView, type Pick } from "./map";
import { sound } from "../sound";
import { STEPS } from "./tutorial";
import { checkAchievements } from "../achievements";
import { boardHtml, submitScore } from "../daily";
import { dailyLabel, dailyScore } from "../../shared/daily";

type Mode = { kind: "idle" } | { kind: "build"; stations: StationId[] } | { kind: "extend"; line: string; end: "start" | "end" };

type Sel = Pick | { kind: "line"; id: string };

const maxToasts = () => (window.innerWidth <= 760 ? 2 : 3);

/** Show a toast at the top of a stack, keep at most `max`, and fade it out after `ms`. */
function pushToast(stack: HTMLElement, t: HTMLElement, max: number, ms: number) {
  stack.prepend(t);
  while (stack.children.length > max) stack.lastChild?.remove();
  setTimeout(() => t.classList.add("out"), ms);
  setTimeout(() => t.remove(), ms + 600);
}

export interface GameScreenHooks {
  onExit(): void;
  onRestart?(): void;
  onRematch?(): void;
  isHost?(): boolean;
}

export class GameScreen {
  el: HTMLElement;
  private mapHost: HTMLElement;
  private hud: HTMLElement;
  private panel: HTMLElement;
  private board: HTMLElement;
  private toasts: HTMLElement;
  private trophies: HTMLElement;
  private overlay: HTMLElement;
  private tip: HTMLElement;
  private coach: HTMLElement;
  private step = -1; // tutorial step, -1 when not a tutorial
  private map: MapView;
  private snap: Snapshot | null = null;
  private sel: Sel = null;
  private mode: Mode = { kind: "idle" };
  private lastSeq = -1;
  private unsub: () => void;
  private confirmDelete = "";
  private busy = false;
  private flash = "";
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private panelOpen = true;
  private renderQueued = false;
  private incomeLog: { t: number; v: number }[] = [];

  constructor(private conn: GameConn, private hooks: GameScreenHooks) {
    this.el = h("div", { class: "game" });
    this.mapHost = h("div", { class: "map" });
    this.hud = h("div", { class: "hud" });
    this.panel = h("aside", { class: "panel" });
    this.board = h("div", { class: "board" });
    this.toasts = h("div", { class: "toasts", "aria-live": "polite" });
    this.trophies = h("div", { class: "trophy-toasts", "aria-live": "polite" });
    this.overlay = h("div", { class: "overlay", hidden: true });
    this.tip = h("div", { class: "maptip", hidden: true });
    this.coach = h("div", { class: "coach", hidden: true, "aria-live": "polite" });
    if ((conn as { tutorial?: boolean }).tutorial) this.step = 0;
    this.el.append(this.mapHost, this.tip, this.hud, this.board, this.coach, this.panel, this.toasts, this.trophies, this.overlay);
    this.map = new MapView(this.mapHost, MAPS[conn.mapId] ?? MAPS.sydney);
    this.map.you = conn.you;
    if (!conn.local) this.map.delay = 300;
    this.bindInput();
    this.bindPanel();
    const offSnap = conn.onSnapshot((s) => this.onSnap(s));
    const offEmote = conn.onEmote?.((from, e) => this.showEmote(from, e));
    const lobbyConn = conn as unknown as { onLobby?: (cb: () => void) => () => void };
    const offLobby = lobbyConn.onLobby?.(() => this.queueRender());
    this.unsub = () => {
      offSnap();
      offEmote?.();
      offLobby?.();
    };
    void this.map.init().then(() => {
      if (this.destroyed) return;
      this.mapReady = true;
      this.layoutInsets();
      this.map.fit();
      this.focusHome();
    });
    window.addEventListener("resize", this.onResize);
    (window as unknown as { __screen?: GameScreen }).__screen = this; // handy for tests and debugging
  }

  private onResize = () => this.layoutInsets();
  private mapReady = false;
  private focused = false;

  private focusHome() {
    if (!this.mapReady || !this.snap || this.focused) return;
    this.focused = true;
    const me = this.snap.players.find((p) => p.id === this.you);
    if (me) this.map.focus(me.hub, this.map.zoomFor(me.hub, window.innerWidth <= 760 ? 3 : 1.7));
    if (me && this.conn.local && storage("seen-intro") !== "1" && this.step < 0) this.showIntro(me);
  }

  private showIntro(me: PlayerView) {
    const wasPaused = !!this.conn.paused;
    if (this.conn.local) this.conn.setPaused?.(true);
    const hub = this.map.net.station[me.hub]?.name ?? me.hub;
    this.overlay.hidden = false;
    this.overlay.innerHTML = `
      <div class="card intro">
        <img class="end-badge" src="/sprites/badge-${me.color}.webp" alt="">
        <h2>Welcome to Metro Empire</h2>
        <p>You run a train company starting at <b>${esc(hub)}</b>. Three steps to get going:</p>
        <ol class="how">
          <li><b>Open track.</b> Tap a pulsing section next to ${esc(hub)} and press <b>Open</b>.</li>
          <li><b>Run a line.</b> Press <b>New line</b> and tap stations along your track. Passengers start riding.</li>
          <li><b>Steal track.</b> Run your trains onto a rival's line, charge less and add trains. When nobody boards their train ${this.snap?.settings.emptyToCapture ?? 3} times in a row, it's yours.</li>
        </ol>
        <div class="row"><button class="btn primary big" data-act="intro-done">Let's go</button></div>
      </div>`;
    this.introPaused = !wasPaused;
  }
  private introPaused = false;

  private layoutInsets() {
    const narrow = window.innerWidth <= 760;
    const panel = this.panel.getBoundingClientRect();
    // keep what the tutorial coach points at clear of the coach card
    const coach = this.coach.hidden ? null : this.coach.getBoundingClientRect();
    this.map.setInsets(
      narrow
        ? { right: 0, bottom: coach ? window.innerHeight - coach.top + 8 : this.panelOpen ? panel.height : 30, top: 140 }
        : { right: panel.width + 24, bottom: 0, top: 56 + (coach ? coach.height + 8 : 0) }
    );
  }

  private get you() {
    return this.conn.you;
  }

  private onSnap(s: Snapshot) {
    if (this.destroyed) return;
    const first = !this.snap;
    this.snap = s;
    this.map.push(s);
    if (first) {
      this.lastSeq = s.eventSeq;
      this.focusHome();
    }
    this.handleEvents(s);
    if (this.step < 0 && this.you !== "spectator" && (s.phase === "over" || Math.floor(s.time) % 2 === 0)) {
      for (const a of checkAchievements(s, this.you, { local: this.conn.local, daily: !!this.conn.daily })) {
        const t = h("div", { class: "trophy" });
        t.innerHTML = `<span class="e">${a.emoji}</span><span><b>${esc(a.name)}</b><small>${esc(a.how)}</small></span>`;
        pushToast(this.trophies, t, 3, 4500);
        sound.play("good");
      }
    }
    if (first || (this.map.hintSections.length && s.players.find((p) => p.id === this.you)?.owned)) this.updateHighlight();
    const me = s.players.find((p) => p.id === this.you);
    if (me && me.money < 0 && !this.warnedBroke) {
      this.warnedBroke = true;
      this.toastText("Your money has run out. Remove empty trains or raise fares to recover.", "bad");
      sound.play("warn");
    }
    if (me && me.money > 200) this.warnedBroke = false;
    if (me) {
      this.incomeLog.push({ t: s.time, v: me.income });
      while (this.incomeLog.length > 2 && s.time - this.incomeLog[0].t > 20) this.incomeLog.shift();
    }
    this.queueRender();
  }

  private destroyed = false;

  private queueRender() {
    if (this.renderQueued || this.destroyed) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      if (!this.destroyed) this.render();
    });
  }

  // ---------- input ----------
  private bindInput() {
    const host = this.mapHost;
    const pointers = new Map<number, { x: number; y: number; sx: number; sy: number }>();
    let moved = false;
    let pinchDist = 0;
    host.addEventListener("pointerdown", (e) => {
      host.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY, sx: e.offsetX, sy: e.offsetY });
      if (pointers.size === 1) moved = false;
      else moved = true; // a second finger means pinch, never a tap
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    host.addEventListener("pointerleave", () => (this.tip.hidden = true));
    host.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) {
        if (e.pointerType === "mouse") this.hover(e.offsetX, e.offsetY);
        return;
      }
      this.tip.hidden = true;
      const dx = e.offsetX - p.x;
      const dy = e.offsetY - p.y;
      p.x = e.offsetX;
      p.y = e.offsetY;
      if (Math.hypot(e.offsetX - p.sx, e.offsetY - p.sy) > 6) moved = true;
      if (pointers.size === 1) this.map.panBy(dx, dy);
      else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) this.map.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinchDist);
        pinchDist = d;
      }
    });
    const up = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (p && !moved && pointers.size === 0) this.tap(e.offsetX, e.offsetY);
    };
    host.addEventListener("pointerup", up);
    host.addEventListener("pointercancel", (e) => pointers.delete(e.pointerId));
    host.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.map.zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * 0.0015));
      },
      { passive: false }
    );
    window.addEventListener("keydown", this.onKey);
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.mapReady || this.destroyed) return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || e.metaKey || e.ctrlKey || e.altKey) return;
    const cx = this.map.app.screen.width / 2;
    const cy = this.map.app.screen.height / 2;
    switch (e.key) {
      case "Escape":
        this.mode = { kind: "idle" };
        this.select(null);
        break;
      case " ":
        if (!this.conn.canPause?.()) return;
        e.preventDefault();
        this.conn.setPaused?.(!this.conn.paused);
        this.render();
        break;
      case "n":
      case "N":
        this.mode = { kind: "build", stations: [] };
        this.sel = null;
        this.map.selected = null;
        this.updateHighlight();
        this.render();
        break;
      case "1":
      case "2":
      case "3":
        if (this.conn.local) {
          this.conn.setSpeed?.(Number(e.key));
          this.render();
        }
        break;
      case "+":
      case "=":
        this.map.zoomAt(cx, cy, 1.25);
        break;
      case "-":
      case "_":
        this.map.zoomAt(cx, cy, 0.8);
        break;
      case "ArrowLeft":
        this.map.panBy(60, 0);
        break;
      case "ArrowRight":
        this.map.panBy(-60, 0);
        break;
      case "ArrowUp":
        this.map.panBy(0, 60);
        break;
      case "ArrowDown":
        this.map.panBy(0, -60);
        break;
      case "h":
      case "H": {
        const me = this.snap?.players.find((p) => p.id === this.you);
        if (me) this.map.focus(me.hub);
        break;
      }
      default:
        return;
    }
  };

  private hover(sx: number, sy: number) {
    const s = this.snap;
    const pick = this.map.pick(sx, sy);
    if (!s || !pick) {
      this.tip.hidden = true;
      return;
    }
    let html = "";
    if (pick.kind === "station") {
      const st = this.map.net.station[pick.id];
      const ev = (s.cityEvents ?? []).find((x) => x.station === pick.id);
      html = `<b>${esc(st.name)}</b><span>${s.waiting[pick.id] ?? 0} waiting${ev ? ` · ${ev.emoji} ${esc(ev.title)}` : ""}</span>`;
    } else {
      const ss = s.sections[pick.id];
      const owner = s.players.find((p) => p.id === ss.owner);
      html = `<b>${esc(this.secName(pick.id))}</b><span>${owner ? `${owner.id === this.you ? "Yours" : esc(owner.name)}${ss.emptyRun ? ` · ${ss.emptyRun}/${s.settings.emptyToCapture} empty` : ""}` : "Not opened"}</span>`;
    }
    this.tip.innerHTML = html;
    this.tip.hidden = false;
    this.tip.style.transform = `translate(${sx + 14}px, ${sy + 14}px)`;
  }

  private tap(sx: number, sy: number) {
    const pick = this.map.pick(sx, sy);
    if (this.mode.kind === "build") {
      if (pick?.kind === "station") this.buildTap(pick.id);
      return;
    }
    if (this.mode.kind === "extend") {
      if (pick?.kind === "station") void this.extendTap(pick.id);
      return;
    }
    this.select(pick);
  }

  private select(sel: Sel) {
    this.sel = sel;
    this.confirmDelete = "";
    this.map.selected = sel && sel.kind !== "line" ? sel : null;
    if (sel) this.panelOpen = true;
    this.updateHighlight();
    this.render();
  }

  private updateHighlight() {
    const s = this.snap;
    if (this.mode.kind === "build") {
      this.map.setHighlight(this.mode.stations, COLORS[this.myColor()], this.buildCandidates());
    } else if (this.mode.kind === "extend") {
      const line = s?.lines.find((l) => l.id === (this.mode as { line: string }).line);
      this.map.setHighlight(line?.stations ?? [], COLORS[this.myColor()], this.extendCandidates());
    } else if (this.sel?.kind === "line" && s) {
      const line = s.lines.find((l) => l.id === (this.sel as { id: string }).id);
      const owner = s.players.find((p) => p.id === line?.owner);
      this.map.setHighlight(line?.stations ?? [], owner ? COLORS[owner.color] : 0x1e2430);
    } else {
      this.map.setHighlight([], COLORS[this.myColor()]);
    }
    // first steps: pulse the track you can open from your hub
    this.map.hintSections = [];
    if (this.step >= 0) {
      this.map.hintSections = STEPS[this.step]?.hint ?? [];
    } else if (this.mode.kind === "idle" && s) {
      const me = s.players.find((p) => p.id === this.you);
      if (me && me.owned === 0) {
        this.map.hintSections = this.map.net.adj[me.hub].filter((e) => !s.sections[e.section].owner).map((e) => e.section);
      }
    }
  }

  private myColor() {
    return this.snap?.players.find((p) => p.id === this.you)?.color ?? "red";
  }

  // ---------- line building ----------
  private usable(a: StationId, b: StationId): boolean {
    const sec = this.map.sectionBetween(a, b);
    return !!sec && !!this.snap?.sections[sec.id]?.owner;
  }

  private buildCandidates(): StationId[] {
    if (this.mode.kind !== "build" || !this.snap) return [];
    const st = this.mode.stations;
    if (!st.length) {
      // any station touching opened track
      const out = new Set<StationId>();
      for (const sec of this.map.net.sections) if (this.snap.sections[sec.id].owner) (out.add(sec.a), out.add(sec.b));
      return [...out];
    }
    const last = st[st.length - 1];
    return this.map.net.adj[last].filter((e) => !st.includes(e.to) && this.snap!.sections[e.section].owner).map((e) => e.to);
  }

  private extendCandidates(): StationId[] {
    if (this.mode.kind !== "extend" || !this.snap) return [];
    const line = this.snap.lines.find((l) => l.id === (this.mode as { line: string }).line);
    if (!line) return [];
    const end = this.mode.end === "end" ? line.stations[line.stations.length - 1] : line.stations[0];
    return this.map.net.adj[end].filter((e) => !line.stations.includes(e.to) && this.snap!.sections[e.section].owner).map((e) => e.to);
  }

  private buildTap(st: StationId) {
    if (this.mode.kind !== "build") return;
    const route = this.mode.stations;
    if (route[route.length - 1] === st) {
      route.pop();
    } else if (!route.length) {
      route.push(st);
    } else if (this.usable(route[route.length - 1], st) && !route.includes(st)) {
      route.push(st);
    } else if (route[0] && this.usable(st, route[0]) && !route.includes(st)) {
      route.unshift(st);
    } else {
      this.say("Pick a station joined to the end of your route by opened track.");
    }
    this.updateHighlight();
    this.render();
  }

  private async extendTap(st: StationId) {
    if (this.mode.kind !== "extend") return;
    const { line, end } = this.mode;
    const ok = await this.run({ type: "extendLine", line, station: st, end });
    if (ok) {
      this.mode = { kind: "idle" };
      this.select({ kind: "line", id: line });
    }
  }

  private async run(cmd: Parameters<GameConn["command"]>[0]): Promise<boolean> {
    if (this.busy) return false;
    this.busy = true;
    const r = await this.conn.command(cmd);
    this.busy = false;
    if (!r.ok) {
      this.say(r.error);
      sound.play("error");
    } else if (cmd.type === "open") sound.play("open");
    else if (cmd.type === "createLine" || cmd.type === "extendLine") sound.play("line");
    else sound.play("click");
    this.render();
    return r.ok;
  }

  private say(text: string) {
    this.flash = text;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.flash = "";
      if (!this.destroyed) this.render();
    }, 3500);
    this.render();
  }

  // ---------- panel actions ----------
  private bindPanel() {
    const handler = async (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
      if (!btn || btn.hasAttribute("disabled")) return;
      e.preventDefault();
      const act = btn.dataset.act!;
      const arg = btn.dataset.arg ?? "";
      const s = this.snap;
      const lineOf = (id: string) => s?.lines.find((l) => l.id === id);
      switch (act) {
        case "open":
          await this.run({ type: "open", section: arg });
          break;
        case "select-section":
          this.select({ kind: "section", id: arg });
          break;
        case "select-station":
          this.select({ kind: "station", id: arg });
          this.map.focus(arg);
          break;
        case "select-line":
          this.select({ kind: "line", id: arg });
          break;
        case "back":
          this.select(null);
          break;
        case "new-line":
          this.mode = { kind: "build", stations: arg ? arg.split(",") : [] };
          this.sel = null;
          this.map.selected = null;
          this.updateHighlight();
          this.render();
          break;
        case "undo":
          if (this.mode.kind === "build") this.mode.stations.pop();
          this.updateHighlight();
          this.render();
          break;
        case "cancel":
          this.mode = { kind: "idle" };
          this.updateHighlight();
          this.render();
          break;
        case "create":
          if (this.mode.kind === "build") {
            const stations = [...this.mode.stations];
            const before = new Set(s?.lines.map((l) => l.id));
            if (await this.run({ type: "createLine", stations })) {
              this.mode = { kind: "idle" };
              const fresh = this.snap?.lines.find((l) => l.owner === this.you && !before.has(l.id));
              this.select(fresh ? { kind: "line", id: fresh.id } : null);
            }
          }
          break;
        case "fare": {
          const l = lineOf(arg);
          if (l) await this.run({ type: "setFare", line: l.id, fare: l.fare + Number(btn.dataset.d) });
          break;
        }
        case "trains": {
          const l = lineOf(arg);
          if (l) await this.run({ type: "setTrains", line: l.id, trains: l.trains + Number(btn.dataset.d) });
          break;
        }
        case "cars": {
          const l = lineOf(arg);
          if (l) await this.run({ type: "setCars", line: l.id, cars: l.cars + Number(btn.dataset.d) });
          break;
        }
        case "speed": {
          await this.run({ type: "setSpeed", line: arg, speed: Number(btn.dataset.d) as 1 | 2 | 3 });
          break;
        }
        case "extend":
          this.mode = { kind: "extend", line: arg, end: btn.dataset.d as "start" | "end" };
          this.updateHighlight();
          this.render();
          break;
        case "rename": {
          const input = this.panel.querySelector<HTMLInputElement>("#line-name");
          if (input) {
            await this.run({ type: "renameLine", line: arg, name: input.value });
            input.blur();
          }
          break;
        }
        case "trim":
          await this.run({ type: "trimLine", line: arg, end: btn.dataset.d as "start" | "end" });
          break;
        case "delete":
          if (this.confirmDelete === arg) {
            if (await this.run({ type: "deleteLine", line: arg })) this.select(null);
          } else {
            this.confirmDelete = arg;
            this.render();
          }
          break;
        case "pause":
          this.conn.setPaused?.(!this.conn.paused);
          this.render();
          break;
        case "speedx":
          this.conn.setSpeed?.(Number(arg));
          this.render();
          break;
        case "fit":
          this.map.fit();
          break;
        case "toggle-panel":
          this.panelOpen = !this.panelOpen;
          this.render();
          break;
        case "exit":
          this.hooks.onExit();
          break;
        case "restart":
          if (this.hooks.onRestart) this.hooks.onRestart();
          else {
            this.overlay.hidden = true;
            this.recorded = false;
            this.dailySent = false;
            this.lastSeq = -1;
            this.snap = null;
            this.conn.restart?.();
          }
          break;
        case "rematch":
          this.hooks.onRematch?.();
          break;
        case "help":
          this.showHelp();
          break;
        case "emote":
          this.conn.emote?.(arg);
          break;
        case "mute":
          sound.toggle();
          this.render();
          break;
        case "close-overlay":
          this.overlay.hidden = true;
          break;
        case "intro-done":
          this.overlay.hidden = true;
          setStorage("seen-intro", "1");
          if (this.conn.local && this.introPaused) this.conn.setPaused?.(false);
          this.render();
          break;
      }
    };
    this.el.addEventListener("click", handler);
    this.panel.addEventListener("keydown", (e) => {
      const t = e.target as HTMLInputElement;
      if (t.id === "line-name" && e.key === "Enter") {
        e.preventDefault();
        void this.run({ type: "renameLine", line: t.dataset.line ?? "", name: t.value }).then(() => t.blur());
      }
    });
  }

  // ---------- events ----------
  private handleEvents(s: Snapshot) {
    if (this.lastSeq < 0) {
      this.lastSeq = s.eventSeq;
      return;
    }
    const fresh = s.eventSeq - this.lastSeq;
    this.lastSeq = s.eventSeq;
    if (fresh <= 0) return;
    const evs = s.events.slice(-Math.min(fresh, s.events.length));
    for (const e of evs) this.toast(e, s);
  }

  private pname(s: Snapshot, id: string | null): string {
    if (!id) return "nobody";
    if (id === this.you) return "You";
    return s.players.find((p) => p.id === id)?.name ?? "Someone";
  }

  private secName(id: SectionId): string {
    const sec = this.map.net.section[id];
    if (!sec) return id;
    const n = (st: string) => this.map.net.station[st]?.name ?? st;
    return `${n(sec.a)} – ${n(sec.b)}`;
  }

  private toast(e: GameEvent, s: Snapshot) {
    let text = "";
    let cls = "";
    let tap: { "data-act": string; "data-arg": string; role: string } | undefined; // what tapping the toast does
    const color = "player" in e ? s.players.find((p) => p.id === e.player)?.color : undefined;
    switch (e.kind) {
      case "capture":
        text = `${this.pname(s, e.player)} captured ${this.secName(e.section)}${e.from ? ` from ${this.pname(s, e.from)}` : ""}!`;
        cls = e.player === this.you ? "big good" : e.from === this.you ? "big bad" : "big";
        if (e.player === this.you) sound.play("capture");
        else if (e.from === this.you) sound.play("lost");
        break;
      case "open": {
        if (e.player === this.you) return;
        // only worth a toast when it's next to your network
        const sec = this.map.net.section[e.section];
        const me = s.players.find((p) => p.id === this.you);
        if (!sec || !me) return;
        const mine = new Set<string>([me.hub]);
        for (const x of this.map.net.sections) if (s.sections[x.id]?.owner === this.you) (mine.add(x.a), mine.add(x.b));
        if (!mine.has(sec.a) && !mine.has(sec.b)) return;
        text = `${this.pname(s, e.player)} opened ${this.secName(e.section)}, next to you`;
        break;
      }
      case "empty": {
        const need = s.settings.emptyToCapture;
        if (e.player === this.you) {
          text = `Nobody boarded your train on ${this.secName(e.section)} (${e.run} of ${need}). Tap to defend it.`;
          cls = "bad";
          tap = { "data-act": "select-section", "data-arg": e.section, role: "button" };
          sound.play("warn");
        } else {
          const runsThere = s.lines.some((l) => l.owner === this.you && this.lineUses(l, e.section));
          if (!runsThere) return;
          text = `Nobody boarded ${this.pname(s, e.player)}'s train on ${this.secName(e.section)} (${e.run} of ${need})`;
          cls = "good";
          sound.play("good");
        }
        break;
      }
      case "event": {
        const where = this.map.net.station[e.event.station]?.name ?? e.event.station;
        if (e.phase === "soon") {
          text = `${e.event.emoji} ${e.event.title} soon! Crowds are heading to ${where}.`;
          cls = "big event";
          sound.play("warn");
        } else if (e.phase === "start") {
          text = `${e.event.emoji} ${e.event.title} has started${e.event.title.includes(where) ? "" : ` at ${where}`}.`;
          cls = "event";
        } else return;
        break;
      }
      case "win":
        if (e.player === this.you) sound.play("win");
        this.showEnd(s);
        return;
      default:
        return;
    }
    // one toast per section for empty-train updates, and per city event: replace the older one
    const key = e.kind === "empty" ? `empty-${e.section}` : e.kind === "event" ? `event-${e.event.id}` : "";
    if (key) this.toasts.querySelector(`[data-key="${key}"]`)?.remove();
    const t = h("div", { class: `toast ${cls}`, "data-key": key || undefined, ...tap });
    if (color) t.style.setProperty("--c", CSS_COLORS[color]);
    t.textContent = text;
    pushToast(this.toasts, t, maxToasts(), cls.includes("big") ? 5000 : 3200);
  }

  private warnedBroke = false;

  private toastText(text: string, cls = "") {
    const t = h("div", { class: `toast ${cls}` });
    t.textContent = text;
    pushToast(this.toasts, t, maxToasts(), 4000);
  }

  private showEmote(from: string, e: string) {
    const s = this.snap;
    const p = s?.players.find((x) => x.id === from);
    const t = h("div", { class: "toast emote" });
    if (p) t.style.setProperty("--c", CSS_COLORS[p.color]);
    t.innerHTML = `<b>${esc(from === this.you ? "You" : p?.name ?? "Someone")}</b> <span class="emoji">${esc(e)}</span>`;
    pushToast(this.toasts, t, maxToasts(), 2600);
  }

  private lineUses(l: LineView, section: SectionId): boolean {
    for (let i = 0; i < l.stations.length - 1; i++) {
      const sec = this.map.sectionBetween(l.stations[i], l.stations[i + 1]);
      if (sec?.id === section) return true;
    }
    return false;
  }

  private recorded = false;
  /** Keep a personal record of games against bots. */
  private recordResult(s: Snapshot) {
    if (this.recorded || !this.conn.local) return;
    this.recorded = true;
    const me = s.players.find((p) => p.id === this.you);
    if (!me) return;
    const rec = readRecord();
    rec.played++;
    if (s.winner === this.you) rec.wins++;
    rec.best = Math.max(rec.best, me.carried);
    setStorage("record", JSON.stringify(rec));
  }

  private showEnd(s: Snapshot) {
    this.recordResult(s);
    const winner = s.players.find((p) => p.id === s.winner);
    const reason = s.events.find((e) => e.kind === "win");
    const ranked = [...s.players].sort((a, b) => b.carried - a.carried);
    const youWon = s.winner === this.you;
    const host = this.hooks.isHost?.() ?? false;
    const me = s.players.find((p) => p.id === this.you);
    this.overlay.hidden = false;
    this.overlay.innerHTML = `
      <div class="card end">
        ${winner ? `<img class="end-badge" src="/sprites/badge-${winner.color}.webp" alt="">` : ""}
        <h2>${youWon ? "You win!" : winner ? `${esc(winner.name)} wins` : "Round over"}</h2>
        <p class="muted">${reason && reason.kind === "win" && reason.reason === "share" ? `${youWon ? "You own" : "They own"} ${Math.round(s.settings.winShare * 100)}% of ${esc(MAPS[s.mapId]?.name ?? "the")}'s network.` : "Most passengers carried when the clock ran out."}</p>
        ${historyChart(s)}
        ${me && this.conn.local ? `<p class="end-tip">💡 ${this.endTip(s, me, youWon)}</p>` : ""}
        <table class="ranks">
          <thead><tr><th></th><th>Company</th><th>Track</th><th>Passengers</th><th>Money</th></tr></thead>
          <tbody>${ranked
            .map(
              (p) =>
                `<tr><td><span class="chip" style="--c:${CSS_COLORS[p.color]}"></span></td><td>${esc(p.name)}${p.id === this.you && p.name !== "You" ? " (you)" : ""}</td><td class="num">${p.owned}</td><td class="num">${p.carried.toLocaleString("en-AU")}</td><td class="num">${money(p.money)}</td></tr>`
            )
            .join("")}</tbody>
        </table>
        <div class="row">
          ${this.conn.local ? `<button class="btn primary" data-act="restart">Play again</button>` : host ? `<button class="btn primary" data-act="rematch">Back to the lobby</button>` : `<span class="muted">Waiting for the host…</span>`}
          <button class="btn" data-act="exit">Main menu</button>
          <button class="btn ghost" data-act="close-overlay">Look at the map</button>
        </div>
        ${this.conn.daily && me ? `<div class="daily-end"><h3>Daily challenge · ${esc(this.conn.daily)}</h3><div id="daily-board"><p class="muted">Saving your score…</p></div></div>` : ""}
      </div>`;
    if (this.conn.daily && me) this.sendDaily(this.conn.daily, me.name, dailyScore(youWon, s.time, me.owned / s.totalSections));
  }

  /** One piece of advice for next time, based on how the round went. */
  private endTip(s: Snapshot, me: PlayerView, won: boolean): string {
    const mine = s.lines.filter((l) => l.owner === me.id);
    const trains = mine.reduce((a, l) => a + l.trains, 0);
    const skill = s.settings.botSkill;
    if (won) return skill < 3 ? `Great win! Try ${ruleLabel("botSkill", skill + 1)} bots next time.` : "You beat the hard bots. Try the daily challenge, or a world city!";
    if (me.money > 3000) return `You finished with ${money(me.money)} unspent. Money in the bank doesn't win passengers: buy more trains and open more track.`;
    if (me.owned < 4) return "Open track early. Every section you own earns you fees when rivals use it, and counts towards the win.";
    if (mine.length && trains / mine.length < 2.5) return "Your lines had few trains, so rivals could win your passengers. Two or three trains per line keeps them loyal.";
    return "When a 'Nobody boarded your train' warning pops up, tap it and defend: lower that line's fare or add trains.";
  }

  private dailySent = false;
  private async sendDaily(date: string, name: string, score: number) {
    if (this.dailySent) return;
    this.dailySent = true;
    const board = await submitScore(date, name, score);
    const host = this.overlay.querySelector("#daily-board");
    if (!host || this.destroyed) return;
    const head = `<p><b>Your score: ${esc(dailyLabel(score))}</b>${board && typeof board !== "string" && board.rank ? ` · rank ${board.rank}` : ""}</p>`;
    host.innerHTML = head + (typeof board === "string" ? `<p class="muted">${esc(board)}</p>` : boardHtml(board));
  }

  private showHelp() {
    this.overlay.hidden = false;
    this.overlay.innerHTML = `<div class="card help">${HELP_HTML}<div class="row"><button class="btn primary" data-act="close-overlay">Got it</button></div></div>`;
  }

  // ---------- rendering ----------
  private render() {
    const s = this.snap;
    if (!s) return;
    const me = s.players.find((p) => p.id === this.you);
    this.renderHud(s, me);
    this.renderBoard(s);
    this.renderCoach(s);
    this.el.classList.toggle("panel-closed", !this.panelOpen);
    patch(this.panel, this.panelHtml(s, me));
    if (this.mode.kind !== "idle") this.updateHighlight();
  }

  private incomeRate(): number {
    const a = this.incomeLog[0];
    const b = this.incomeLog[this.incomeLog.length - 1];
    if (!a || !b || b.t - a.t < 2) return 0;
    return (b.v - a.v) / (b.t - a.t);
  }

  private renderHud(s: Snapshot, me: PlayerView | undefined) {
    const need = Math.ceil(s.totalSections * s.settings.winShare);
    // spectators follow the leader
    const shown = me ?? [...s.players].sort((a, b) => b.owned - a.owned)[0];
    const owned = shown?.owned ?? 0;
    const pct = Math.min(100, (owned / need) * 100);
    const left = s.duration - s.time;
    const local = this.conn.local;
    const html = `
      <div class="hud-l">
        <button class="hud-btn" data-act="exit" title="Main menu" aria-label="Main menu"><img src="/sprites/logo-icon.webp" alt=""></button>
        ${me ? `<div class="pill you"><img src="/sprites/badge-${me.color}.webp" alt=""><span>${esc(me.name)}</span></div>` : `<div class="pill">Watching</div>`}
        ${me ? `<div class="pill money ${me.money < 0 ? "neg" : ""}" title="Money, and fares coming in each minute"><img src="/sprites/money.webp" alt="">${money(me.money)}${this.incomeRate() >= 1 ? `<span class="rate">+${money(this.incomeRate())}/min</span>` : ""}</div>` : ""}
      </div>
      <div class="pill goal" title="Own ${need} of ${s.totalSections} sections to win">
        <span class="lbl">${me ? "Track to win" : shown ? esc(shown.name) : "Track"}</span>
        <span class="meter"><b style="width:${pct}%;background:${shown ? CSS_COLORS[shown.color] : "#888"}"></b></span>
        <span class="mono">${owned}/${need}</span>
      </div>
      <div class="hud-r">
        <div class="pill mono ${left < 120 ? "warn" : ""}" title="Time left">${remaining(left)}</div>
        ${this.conn.canPause?.() ? `<button class="hud-btn" data-act="pause" aria-label="${this.conn.paused ? "Resume" : "Pause"}" title="${this.conn.paused ? "Resume" : "Pause"}"><img src="/sprites/${this.conn.paused ? "play" : "pause"}.webp" alt=""></button>` : ""}
        ${local ? `<div class="seg small">${[1, 2, 3].map((x) => `<button data-act="speedx" data-arg="${x}" class="${this.conn.speed === x ? "on" : ""}">${x}×</button>`).join("")}</div>` : ""}
        <button class="hud-btn" data-act="mute" aria-label="${sound.muted ? "Sound on" : "Sound off"}" title="${sound.muted ? "Sound on" : "Sound off"}">${sound.muted ? "🔇" : "🔊"}</button>
        <button class="hud-btn" data-act="help" aria-label="How to play">?</button>
      </div>`;
    patch(this.hud, html + (this.conn.paused && s.phase === "running" ? `<div class="paused-banner">Paused${this.conn.local || this.conn.canPause?.() ? "" : " by the host"}</div>` : ""));
  }

  private renderCoach(s: Snapshot) {
    if (this.step < 0) return;
    const before = this.step;
    while (this.step < STEPS.length - 1 && STEPS[this.step].done(s, this.you)) this.step++;
    const st = STEPS[this.step];
    const first = this.coach.hidden;
    this.coach.hidden = false;
    patch(
      this.coach,
      `<div class="coach-step">Step ${Math.min(this.step + 1, STEPS.length)} of ${STEPS.length}</div><h3>${st.title}</h3><p>${typeof st.text === "function" ? st.text(s, this.you) : st.text}</p>` +
        (this.step === STEPS.length - 1 ? `<div class="row"><button class="btn primary" data-act="exit">Back to the menu</button></div>` : "")
    );
    if (this.step !== before || first) {
      if (this.step !== before) sound.play("good");
      // after opening track, go back to the lines list so "New line" is in view
      if (before <= 1 && this.step !== before) this.select(null);
      this.layoutInsets();
      const hint = st.hint?.[0] && this.map.net.section[st.hint[0]];
      if (hint) this.map.focus(hint.a);
      this.updateHighlight();
    }
  }

  private renderBoard(s: Snapshot) {
    const ranked = s.players;
    patch(
      this.board,
      `<div class="board-row board-title"><span></span><span>Companies</span><span title="Sections owned">Track</span><span title="Passengers carried">Riders</span></div>` +
        ranked
          .map(
            (p) =>
              `<div class="board-row ${p.id === this.you ? "me" : ""}" data-key="${p.id}"><img src="/sprites/badge-${p.color}.webp" alt=""><span class="nm">${esc(p.name)}${!p.connected && !p.isBot ? " · away" : ""}</span><span class="mono" title="Sections owned">${p.owned}</span><span class="mono dim" title="Passengers carried">${compact(p.carried)}</span></div>`
          )
          .join("")
    );
  }

  private panelHtml(s: Snapshot, me: PlayerView | undefined): string {
    const head = `<button class="panel-toggle" data-act="toggle-panel" aria-label="${this.panelOpen ? "Hide panel" : "Show panel"}">${this.panelOpen ? "▾" : "▴"}</button>`;
    const flash = this.flash ? `<div class="flash">${esc(this.flash)}</div>` : "";
    let body = "";
    if (this.mode.kind === "build") body = this.buildHtml(s, me);
    else if (this.mode.kind === "extend") body = this.extendHtml(s);
    else if (this.sel?.kind === "station") body = this.stationHtml(s, this.sel.id, me);
    else if (this.sel?.kind === "section") body = this.sectionHtml(s, this.sel.id, me);
    else if (this.sel?.kind === "line") body = this.lineHtml(s, this.sel.id, me);
    else body = this.homeHtml(s, me);
    return head + flash + `<div class="panel-body">${body}</div>`;
  }

  /** A line's name, or its two ends. */
  private lineTitle(l: LineView): string {
    return l.name || `${this.stationName(l.stations[0])} – ${this.stationName(l.stations[l.stations.length - 1])}`;
  }

  private stationName(id: StationId) {
    return this.map.net.station[id]?.name ?? id;
  }

  private chip(s: Snapshot, owner: string | null) {
    const p = s.players.find((x) => x.id === owner);
    return p ? `<span class="chip" style="--c:${CSS_COLORS[p.color]}" title="${esc(p.name)}"></span>` : `<span class="chip none"></span>`;
  }

  private homeHtml(s: Snapshot, me: PlayerView | undefined): string {
    if (!me)
      return `<h3>Watching</h3><p class="muted">${this.conn.local ? `Three bots are fighting over ${esc(MAPS[s.mapId]?.name ?? "the city")}. Tap stations, track and lines to see what they're doing.` : "The game started before you joined. Enjoy the show."}</p>
        <div class="lines">${s.lines.map((l) => this.lineRow(s, l)).join("")}</div>`;
    const mine = s.lines.filter((l) => l.owner === me.id);
    const owned = me.owned;
    let tip = "";
    if (me.money < 0) tip = `<b>You're spending more than you earn.</b> Take trains off quiet lines (look for low "seats full"), shorten long trains, or raise fares where nobody competes with you.`;
    else if (owned === 0) tip = `Tap a <b>dotted section</b> next to your hub, <b>${esc(this.stationName(me.hub))}</b>, then press <b>Open</b>.`;
    else if (!mine.length) tip = `Now press <b>New line</b> and tap the stations along your track to start running trains.`;
    else if (s.time < 120) tip = `Open more track and extend your lines. Busy lines need more trains.`;
    else tip = `Run a line onto a rival's track, then cut your fare and add trains to win their passengers.`;
    return `
      <h3>Your lines</h3>
      <div class="tip">${tip}</div>
      ${mine.length ? `<div class="lines">${mine.map((l) => this.lineRow(s, l)).join("")}</div>` : ""}
      <button class="btn primary wide" data-act="new-line" ${mine.length >= s.settings.maxLinesPerPlayer ? "disabled" : ""}>New line · ${money(trainCost(s, 2))}</button>
      <p class="muted small">Drag to move the map. Scroll or pinch to zoom. Tap a station or a section for details.</p>
      ${this.conn.emote ? `<div class="emotes" aria-label="Send a reaction">${EMOTES.map((e) => `<button data-act="emote" data-arg="${e}" aria-label="Send ${e}">${e}</button>`).join("")}</div>` : ""}`;
  }

  private lineRow(s: Snapshot, l: LineView): string {
    const owner = s.players.find((p) => p.id === l.owner);
    const lf = Math.round(l.loadFactor * 100);
    return `<button class="line-row" data-act="select-line" data-arg="${l.id}" data-key="${l.id}">
      <span class="chip" style="--c:${owner ? CSS_COLORS[owner.color] : "#888"}"></span>
      <span class="lr-name">${esc(this.lineTitle(l))}</span>
      <span class="lr-meta mono">${l.trains}🚆 ${fare(l.fare)}</span>
      <span class="load"><b style="width:${lf}%"></b></span>
    </button>`;
  }

  private stationHtml(s: Snapshot, id: StationId, me: PlayerView | undefined): string {
    const st = this.map.net.station[id];
    const waiting = s.waiting[id] ?? 0;
    const ev = (s.cityEvents ?? []).find((x) => x.station === id);
    const lines = s.lines.filter((l) => l.stations.includes(id));
    const out = this.map.net.adj[id];
    const canStart = me && out.some((e) => s.sections[e.section].owner);
    const hubOf = s.players.find((p) => p.hub === id);
    return `
      <button class="back" data-act="back">← Back</button>
      <h3>${esc(st.name)}</h3>
      ${hubOf ? `<div class="tag">${hubOf.id === this.you ? "Your home hub" : `${esc(hubOf.name)}'s home hub`}</div>` : ""}
      ${ev ? `<div class="tip">${ev.emoji} <b>${esc(ev.title)}</b>: ${s.time < ev.start ? `starts in ${Math.ceil(ev.start - s.time)} minutes` : s.time < ev.end ? "happening now" : "crowds heading home"}. Extra passengers are travelling here.</div>` : ""}
      <div class="stats">
        <div><span class="v mono">${waiting}</span><span class="k">waiting now</span></div>
        <div><span class="v mono">${st.pop}k</span><span class="k">people nearby</span></div>
        <div><span class="v mono">${st.jobs}k</span><span class="k">jobs nearby</span></div>
      </div>
      ${this.destinationsHtml(s, id)}
      <h4>Track from here</h4>
      <div class="list">${out
        .map((e) => {
          const ss = s.sections[e.section];
          return `<button class="list-row" data-act="select-section" data-arg="${e.section}" data-key="${e.section}">${this.chip(s, ss.owner)}<span>to ${esc(this.stationName(e.to))}</span><span class="dim small">${ss.owner ? (ss.owner === this.you ? "yours" : "owned") : "not opened"}</span></button>`;
        })
        .join("")}</div>
      ${lines.length ? `<h4>Lines stopping here</h4><div class="lines">${lines.map((l) => this.lineRow(s, l)).join("")}</div>` : ""}
      ${canStart ? `<button class="btn wide" data-act="new-line" data-arg="${id}">Start a new line here</button>` : ""}`;
  }

  /** Where people starting here want to go, from the demand model, and how many trips start here. */
  private destinationsHtml(s: Snapshot, id: StationId): string {
    const net = this.map.net;
    const n = net.stations.length;
    const i = net.stationIndex[id];
    let row = 0;
    const dests: { id: StationId; w: number }[] = [];
    for (let j = 0; j < n; j++) {
      const w = net.od[i * n + j];
      row += w;
      if (w > 0) dests.push({ id: net.stations[j].id, w });
    }
    if (row <= 0) return "";
    const perMin = row * s.settings.demandPerMinute;
    const top = dests.sort((a, b) => b.w - a.w).slice(0, 4);
    return `<h4>Where people here want to go</h4>
      <div class="dests">${top
        .map((d) => {
          const pct = Math.round((d.w / row) * 100);
          return `<button class="dest" data-act="select-station" data-arg="${d.id}" data-key="${d.id}"><span>${esc(this.stationName(d.id))}</span><span class="bar"><b style="width:${Math.min(100, pct * 2)}%"></b></span><span class="mono">${pct}%</span></button>`;
        })
        .join("")}</div>
      <p class="muted small">About ${perMin.toFixed(1)} trips a minute start here once there's a way to make them.</p>`;
  }

  private sectionHtml(s: Snapshot, id: SectionId, me: PlayerView | undefined): string {
    const sec = this.map.net.section[id];
    const ss = s.sections[id];
    const owner = s.players.find((p) => p.id === ss.owner);
    const users = s.lines.filter((l) => this.lineUses(l, id));
    const need = s.settings.emptyToCapture;
    let action = "";
    if (!ss.owner && me) {
      const cost = openCost(s, sec.minutes, me.owned);
      const mine = new Set<string>([me.hub]);
      for (const x of this.map.net.sections) if (s.sections[x.id].owner === me.id) (mine.add(x.a), mine.add(x.b));
      const adjacent = mine.has(sec.a) || mine.has(sec.b);
      action = adjacent
        ? `<button class="btn primary wide" data-act="open" data-arg="${id}" ${me.money < cost ? "disabled" : ""}>Open this section · ${money(cost)}</button>${me.money < cost ? `<p class="muted small">You need ${money(cost - me.money)} more.</p>` : ""}`
        : `<p class="muted">You can only open track that touches your own network.</p>`;
    } else if (ss.owner && ss.owner !== this.you && me) {
      const runs = users.some((l) => l.owner === this.you);
      action = runs
        ? `<div class="tip">To take it, win the passengers here: when nobody boards ${esc(owner?.name ?? "the owner")}'s train ${need} times in a row, it's yours. Charge less, and run enough trains with room for everyone.</div>`
        : `<div class="tip">Run one of your lines over this section, then undercut ${esc(owner?.name ?? "the owner")}'s fare to win their passengers. You'll pay them ${money(s.settings.trackFee)} each time your train uses it.</div>`;
    } else if (ss.owner === this.you && ss.emptyRun > 0) {
      const mine = users.filter((l) => l.owner === this.you);
      action =
        `<div class="tip bad">Nobody boarded ${ss.emptyRun === 1 ? "your last train" : `your last ${ss.emptyRun} trains`} here. At ${need} in a row you lose this track. Lower your fare or add trains, fast!</div>` +
        mine.map((l) => `<button class="btn primary wide" data-act="select-line" data-arg="${l.id}">Defend with ${esc(this.lineTitle(l))}</button>`).join("");
    } else if (ss.owner === this.you && !users.some((l) => l.owner === this.you)) {
      action = `<div class="tip">You own this track but none of your trains run on it yet.</div><button class="btn primary wide" data-act="new-line" data-arg="${sec.a},${sec.b}">Run a line here · ${money(trainCost(s, 2))}</button>`;
    }
    return `
      <button class="back" data-act="back">← Back</button>
      <h3>${esc(this.stationName(sec.a))} – ${esc(this.stationName(sec.b))}</h3>
      ${sec.landmark ? `<div class="tag">${esc(sec.landmark)}</div>` : ""}
      <div class="owner-line">${this.chip(s, ss.owner)}<span>${owner ? `Owned by <b>${esc(owner.id === this.you ? "you" : owner.name)}</b>` : "Not opened yet"}</span></div>
      <div class="stats">
        <div><span class="v mono">${sec.minutes} min</span><span class="k">trip</span></div>
        <div><span class="v mono">${ss.traffic}</span><span class="k">recent riders</span></div>
        <div><span class="v">${dots(ss.emptyRun, need, owner ? CSS_COLORS[owner.color] : "#888")}</span><span class="k">empty trains</span></div>
      </div>
      ${action}
      ${this.headToHead(s, users)}
      ${users.length ? `<h4>Lines on this track</h4><div class="lines">${users.map((l) => this.lineRow(s, l)).join("")}</div>` : ""}
      <div class="row small-row"><button class="link" data-act="select-station" data-arg="${sec.a}">${esc(this.stationName(sec.a))}</button><button class="link" data-act="select-station" data-arg="${sec.b}">${esc(this.stationName(sec.b))}</button></div>`;
  }

  /** When two or more companies run here, compare them the way a passenger would. */
  private headToHead(s: Snapshot, users: LineView[]): string {
    const owners = new Set(users.map((l) => l.owner));
    if (owners.size < 2) return "";
    const rows = [...users].sort((a, b) => a.fare - b.fare);
    const cheap = rows[0];
    const dear = rows[rows.length - 1];
    const wait = (dear.fare - cheap.fare) / s.settings.valueOfTime;
    const cheapOwner = s.players.find((p) => p.id === cheap.owner);
    return `<h4>Head to head</h4>
      <table class="h2h"><thead><tr><th></th><th>Fare</th><th>Train every</th><th>Seats</th></tr></thead><tbody>
      ${rows
        .map((l) => {
          const p = s.players.find((x) => x.id === l.owner);
          return `<tr data-key="${l.id}"><td><span class="chip" style="--c:${p ? CSS_COLORS[p.color] : "#888"}"></span> ${esc(p?.id === this.you ? "You" : p?.name ?? "")}</td><td class="num">${fare(l.fare)}</td><td class="num">${isFinite(l.headway) ? l.headway.toFixed(1) : "–"} min</td><td class="num">${l.cars * s.settings.carSeats}</td></tr>`;
        })
        .join("")}
      </tbody></table>
      <p class="muted small">${wait > 0 ? `Passengers will wait up to <b>${wait % 1 ? wait.toFixed(1) : wait} min</b> for ${esc(cheapOwner?.id === this.you ? "your" : `${cheapOwner?.name}'s`)} cheaper train, if it has room. Otherwise they take the first train.` : "Same fare, so passengers take whichever train comes first."}</p>`;
  }

  private lineHtml(s: Snapshot, id: string, me: PlayerView | undefined): string {
    const l = s.lines.find((x) => x.id === id);
    if (!l) return `<button class="back" data-act="back">← Back</button><p class="muted">That line has gone.</p>`;
    const owner = s.players.find((p) => p.id === l.owner)!;
    const mine = l.owner === this.you && !!me;
    const lf = Math.round(l.loadFactor * 100);
    const S = s.settings;
    const route = l.stations.map((st) => `<button class="stop" data-act="select-station" data-arg="${st}">${esc(this.stationName(st))}</button>`).join('<span class="dash"></span>');
    const stats = `
      <div class="stats">
        <div><span class="v mono">${isFinite(l.headway) ? `${l.headway.toFixed(1)} min` : "–"}</span><span class="k">between trains</span></div>
        <div><span class="v mono">${lf}%</span><span class="k">seats full</span></div>
        <div><span class="v mono">${l.cars * S.carSeats}</span><span class="k">seats/train</span></div>
      </div>
      <div class="loadbar"><b style="width:${lf}%"></b></div>`;
    if (!mine) {
      return `<button class="back" data-act="back">← Back</button>
        <div class="owner-line"><img class="badge" src="/sprites/badge-${owner.color}.webp" alt=""><h3>${l.name ? esc(l.name) : `${esc(owner.name)}'s line`}</h3></div>
        ${l.name ? `<div class="tag">${esc(owner.name)}</div>` : ""}
        <div class="route">${route}</div>
        ${stats}
        <div class="stats"><div><span class="v mono">${fare(l.fare)}</span><span class="k">per ride</span></div><div><span class="v mono">${l.trains}</span><span class="k">trains</span></div><div><span class="v mono">${l.speed}</span><span class="k">speed</span></div></div>`;
    }
    const tc = trainCost(s, l.cars) + (l.speed - 1) * S.speedCost;
    const first = l.stations[0];
    const last = l.stations[l.stations.length - 1];
    return `
      <button class="back" data-act="back">← Back</button>
      <div class="owner-line"><img class="badge" src="/sprites/badge-${owner.color}.webp" alt=""><h3>${esc(this.lineTitle(l))}</h3></div>
      <div class="route">${route}</div>
      ${stats}
      <div class="ctrl">
        <span class="ctrl-k">Fare per ride</span>
        <button class="step" data-act="fare" data-arg="${l.id}" data-d="-0.25" ${l.fare <= S.minFare ? "disabled" : ""} aria-label="Lower fare">−</button>
        <span class="ctrl-v mono">${fare(l.fare)}</span>
        <button class="step" data-act="fare" data-arg="${l.id}" data-d="0.25" ${l.fare >= S.maxFare ? "disabled" : ""} aria-label="Raise fare">+</button>
      </div>
      <div class="ctrl">
        <span class="ctrl-k">Trains <small>${money(tc)} each</small></span>
        <button class="step" data-act="trains" data-arg="${l.id}" data-d="-1" ${l.trains <= 1 ? "disabled" : ""} aria-label="Fewer trains">−</button>
        <span class="ctrl-v mono">${l.trains}</span>
        <button class="step" data-act="trains" data-arg="${l.id}" data-d="1" ${l.trains >= S.maxTrainsPerLine || (me?.money ?? 0) < tc ? "disabled" : ""} aria-label="More trains">+</button>
      </div>
      <div class="ctrl">
        <span class="ctrl-k">Cars per train <small>+1 car: ${money(S.carCost * l.trains)}${l.trains > 1 ? ` (all ${l.trains} trains)` : ""}</small></span>
        <button class="step" data-act="cars" data-arg="${l.id}" data-d="-1" ${l.cars <= 1 ? "disabled" : ""} aria-label="Shorter trains">−</button>
        <span class="ctrl-v mono">${l.cars}</span>
        <button class="step" data-act="cars" data-arg="${l.id}" data-d="1" ${l.cars >= 8 || (me?.money ?? 0) < S.carCost * l.trains ? "disabled" : ""} aria-label="Longer trains">+</button>
      </div>
      <div class="ctrl">
        <span class="ctrl-k">Speed <small>${money(S.speedCost * l.trains)} a level${l.trains > 1 ? ` (all ${l.trains} trains)` : ""}</small></span>
        <div class="seg">${[1, 2, 3].map((x) => `<button data-act="speed" data-arg="${l.id}" data-d="${x}" class="${l.speed === x ? "on" : ""}" ${x < l.speed ? "disabled" : ""}>${x === 1 ? "Normal" : x === 2 ? "Fast" : "Metro"}</button>`).join("")}</div>
      </div>
      <p class="muted small">Running cost: ${fare(S.carCostPerMinute * l.cars * l.trains)}/min for ${l.trains} ${l.trains === 1 ? "train" : "trains"} of ${l.cars} ${l.cars === 1 ? "car" : "cars"}.</p>
      <div class="row">
        <button class="btn" data-act="extend" data-arg="${l.id}" data-d="start">Extend from ${esc(this.stationName(first))}</button>
        <button class="btn" data-act="extend" data-arg="${l.id}" data-d="end">Extend from ${esc(this.stationName(last))}</button>
      </div>
      ${l.stations.length > 2 ? `<div class="row small-row"><button class="link" data-act="trim" data-arg="${l.id}" data-d="start">Drop ${esc(this.stationName(first))}</button><button class="link" data-act="trim" data-arg="${l.id}" data-d="end">Drop ${esc(this.stationName(last))}</button></div>` : ""}
      <div class="rename"><input id="line-name" data-line="${l.id}" maxlength="24" placeholder="Give it a name" value="${esc(l.name ?? "")}" aria-label="Line name"><button class="btn" data-act="rename" data-arg="${l.id}">Save name</button></div>
      <button class="btn danger wide" data-act="delete" data-arg="${l.id}">${this.confirmDelete === l.id ? "Tap again to close this line" : "Close this line"}</button>`;
  }

  private buildHtml(s: Snapshot, me: PlayerView | undefined): string {
    if (this.mode.kind !== "build") return "";
    const st = this.mode.stations;
    const cost = trainCost(s, 2);
    const ownsOne = st.some((x, i) => i < st.length - 1 && s.sections[this.map.sectionBetween(x, st[i + 1])!.id]?.owner === this.you);
    return `
      <h3>New line</h3>
      <div class="tip">${st.length ? "Tap the next station along opened track. Tap the last station again to remove it." : "Tap the first station. It must touch opened track."}</div>
      <div class="route">${st.map((x) => `<span class="stop">${esc(this.stationName(x))}</span>`).join('<span class="dash"></span>') || '<span class="muted">No stations yet</span>'}</div>
      ${st.length >= 2 && !ownsOne ? `<p class="muted small">A line must use at least one section you own.</p>` : ""}
      <div class="row">
        <button class="btn primary" data-act="create" ${st.length < 2 || !ownsOne || (me?.money ?? 0) < cost ? "disabled" : ""}>Create line · ${money(cost)}</button>
        <button class="btn" data-act="undo" ${st.length ? "" : "disabled"}>Undo</button>
        <button class="btn ghost" data-act="cancel">Cancel</button>
      </div>`;
  }

  private extendHtml(s: Snapshot): string {
    if (this.mode.kind !== "extend") return "";
    const l = s.lines.find((x) => x.id === (this.mode as { line: string }).line);
    const end = l ? (this.mode.end === "end" ? l.stations[l.stations.length - 1] : l.stations[0]) : "";
    return `
      <h3>Extend line</h3>
      <div class="tip">Tap a station next to <b>${esc(this.stationName(end))}</b>, joined by opened track.</div>
      <button class="btn ghost" data-act="cancel">Cancel</button>`;
  }

  destroy() {
    this.destroyed = true;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.unsub();
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("resize", this.onResize);
    this.map.destroy();
    this.el.remove();
  }
}

/** Track owned over the round, one line per company, drawn to scale. */
function historyChart(s: Snapshot): string {
  const h = s.history;
  if (!h || h.length < 2) return "";
  const W = 460, H = 150, L = 30, B = 22, T = 8, R = 8;
  const tMax = h[h.length - 1].t || 1;
  const yMax = Math.max(4, ...h.flatMap((x) => x.owned));
  const X = (t: number) => L + (t / tMax) * (W - L - R);
  const Y = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const need = Math.ceil(s.totalSections * s.settings.winShare);
  let out = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Track owned by each company over the round">`;
  for (const v of [0, Math.round(yMax / 2), yMax]) out += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d9d5cc"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  if (need <= yMax) out += `<line x1="${L}" x2="${W - R}" y1="${Y(need)}" y2="${Y(need)}" stroke="#1e2430" stroke-dasharray="4 4"/><text x="${W - R}" y="${Y(need) - 4}" text-anchor="end">win</text>`;
  out += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">time →</text><text x="${L}" y="10" text-anchor="start">track owned</text>`;
  s.players.forEach((p, i) => {
    const d = h.map((x, k) => `${k ? "L" : "M"}${X(x.t).toFixed(1)},${Y(x.owned[i] ?? 0).toFixed(1)}`).join("");
    out += `<path d="${d}" fill="none" stroke="${CSS_COLORS[p.color]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  return out + "</svg>";
}

function trainCost(s: Snapshot, cars: number) {
  return s.settings.trainBaseCost + s.settings.carCost * cars;
}
function openCost(s: Snapshot, minutes: number, owned = 0) {
  return Math.round(s.settings.openBaseCost + s.settings.openCostPerMinute * minutes + s.settings.openCostPerOwned * owned);
}
function dots(run: number, need: number, color: string) {
  let out = '<span class="dots">';
  for (let i = 0; i < need; i++) out += `<i class="${i < run ? "on" : ""}" style="--c:${color}"></i>`;
  return out + "</span>";
}
function compact(n: number) {
  return n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export const HELP_HTML = `
  <h2>How to play</h2>
  <ol class="how">
    <li><b>Open track.</b> Tap a dotted section next to your hub and press Open. It's yours.</li>
    <li><b>Run trains.</b> Press New line and tap stations along opened track. Passengers start riding and paying fares.</li>
    <li><b>Grow.</b> Open more track, extend your lines, and add trains where they're full.</li>
    <li><b>Fight.</b> You can run trains on a rival's track (you pay them a small fee). Passengers wait for a cheaper train if it's coming soon and has room: <b>1 minute for every 50 cents</b> they save.</li>
    <li><b>Capture.</b> When nobody boards the owner's train on a section 3 times in a row (because they all took yours), the section is yours.</li>
    <li><b>Win.</b> Own 60% of the network, or carry the most passengers when time runs out.</li>
    <li><b>Home hubs.</b> Only you can open the track touching your hub, so nobody can box you in at the start.</li>
  </ol>
  <p class="muted small">Passengers pick routes by fare plus time (50 cents a minute), and changing trains costs them 4 minutes.</p>
  <p class="muted small">Keys: <b>N</b> new line · <b>Space</b> pause · <b>1 2 3</b> speed · <b>+ −</b> zoom · arrows move · <b>H</b> home · <b>Esc</b> cancel</p>`;
