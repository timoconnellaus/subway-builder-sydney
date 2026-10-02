import { MAPS, type Snapshot, type StationId, type LineView, type PlayerView, type SectionId } from "../../sim";
import type { GameEvent } from "../../sim/types";
import type { GameConn } from "../conn";
import { COLORS, CSS_COLORS, esc, fare, h, money, patch, remaining } from "../util";
import { MapView, type Pick } from "./map";

type Mode = { kind: "idle" } | { kind: "build"; stations: StationId[] } | { kind: "extend"; line: string; end: "start" | "end" };

type Sel = Pick | { kind: "line"; id: string };

export interface GameScreenHooks {
  onExit(): void;
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
  private overlay: HTMLElement;
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

  constructor(private conn: GameConn, private hooks: GameScreenHooks) {
    this.el = h("div", { class: "game" });
    this.mapHost = h("div", { class: "map" });
    this.hud = h("div", { class: "hud" });
    this.panel = h("aside", { class: "panel" });
    this.board = h("div", { class: "board" });
    this.toasts = h("div", { class: "toasts", "aria-live": "polite" });
    this.overlay = h("div", { class: "overlay", hidden: true });
    this.el.append(this.mapHost, this.hud, this.board, this.panel, this.toasts, this.overlay);
    this.map = new MapView(this.mapHost, MAPS.sydney);
    this.map.you = conn.you;
    if (!conn.local) this.map.delay = 300;
    this.bindInput();
    this.bindPanel();
    this.unsub = conn.onSnapshot((s) => this.onSnap(s));
    void this.map.init().then(() => {
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
    if (me) this.map.focus(me.hub, 1.7);
  }

  private layoutInsets() {
    const narrow = window.innerWidth <= 760;
    const panel = this.panel.getBoundingClientRect();
    this.map.setInsets(narrow ? { right: 0, bottom: this.panelOpen ? panel.height : 30, top: 110 } : { right: panel.width + 24, bottom: 0, top: 56 });
  }

  private get you() {
    return this.conn.you;
  }

  private onSnap(s: Snapshot) {
    const first = !this.snap;
    this.snap = s;
    this.map.push(s);
    if (first) {
      this.lastSeq = s.eventSeq;
      this.focusHome();
    }
    this.handleEvents(s);
    this.queueRender();
  }

  private queueRender() {
    if (this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      this.render();
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
      moved = false;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    host.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
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
    if ((e.target as HTMLElement)?.tagName === "INPUT") return;
    if (e.key === "Escape") {
      this.mode = { kind: "idle" };
      this.select(null);
    } else if (e.key === " " && this.conn.local) {
      e.preventDefault();
      this.conn.setPaused?.(!this.conn.paused);
      this.render();
    }
  };

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
      this.map.setHighlight([], 0);
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
    if (!r.ok) this.say(r.error);
    this.render();
    return r.ok;
  }

  private say(text: string) {
    this.flash = text;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.flash = "";
      this.render();
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
          this.mode = { kind: "build", stations: arg ? [arg] : [] };
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
          this.overlay.hidden = true;
          this.lastSeq = -1;
          this.snap = null;
          this.conn.restart?.();
          break;
        case "rematch":
          this.hooks.onRematch?.();
          break;
        case "help":
          this.showHelp();
          break;
        case "close-overlay":
          this.overlay.hidden = true;
          break;
      }
    };
    this.el.addEventListener("click", handler);
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
    const color = "player" in e ? s.players.find((p) => p.id === e.player)?.color : undefined;
    switch (e.kind) {
      case "capture":
        text = `${this.pname(s, e.player)} captured ${this.secName(e.section)}${e.from ? ` from ${this.pname(s, e.from)}` : ""}!`;
        cls = e.player === this.you ? "big good" : e.from === this.you ? "big bad" : "big";
        break;
      case "open":
        if (e.player === this.you) return;
        text = `${this.pname(s, e.player)} opened ${this.secName(e.section)}`;
        break;
      case "empty": {
        const need = s.settings.emptyToCapture;
        if (e.player === this.you) {
          text = `Your train left ${this.secName(e.section)} empty (${e.run} of ${need})`;
          cls = "bad";
        } else {
          const runsThere = s.lines.some((l) => l.owner === this.you && this.lineUses(l, e.section));
          if (!runsThere) return;
          text = `${this.pname(s, e.player)}'s train left ${this.secName(e.section)} empty (${e.run} of ${need})`;
          cls = "good";
        }
        break;
      }
      case "win":
        this.showEnd(s);
        return;
      default:
        return;
    }
    const t = h("div", { class: `toast ${cls}` });
    if (color) t.style.setProperty("--c", CSS_COLORS[color]);
    t.textContent = text;
    this.toasts.prepend(t);
    while (this.toasts.children.length > 4) this.toasts.lastChild?.remove();
    setTimeout(() => t.classList.add("out"), cls.includes("big") ? 5000 : 3200);
    setTimeout(() => t.remove(), cls.includes("big") ? 5600 : 3800);
  }

  private lineUses(l: LineView, section: SectionId): boolean {
    for (let i = 0; i < l.stations.length - 1; i++) {
      const sec = this.map.sectionBetween(l.stations[i], l.stations[i + 1]);
      if (sec?.id === section) return true;
    }
    return false;
  }

  private showEnd(s: Snapshot) {
    const winner = s.players.find((p) => p.id === s.winner);
    const reason = s.events.find((e) => e.kind === "win");
    const ranked = [...s.players].sort((a, b) => b.carried - a.carried);
    const youWon = s.winner === this.you;
    const host = this.hooks.isHost?.() ?? false;
    this.overlay.hidden = false;
    this.overlay.innerHTML = `
      <div class="card end">
        ${winner ? `<img class="end-badge" src="/sprites/badge-${winner.color}.webp" alt="">` : ""}
        <h2>${youWon ? "You win!" : winner ? `${esc(winner.name)} wins` : "Round over"}</h2>
        <p class="muted">${reason && reason.kind === "win" && reason.reason === "share" ? "They own half of Sydney's network." : "Most passengers carried when the clock ran out."}</p>
        <table class="ranks">
          <thead><tr><th></th><th>Company</th><th>Track</th><th>Passengers</th><th>Money</th></tr></thead>
          <tbody>${ranked
            .map(
              (p) =>
                `<tr><td><span class="chip" style="--c:${CSS_COLORS[p.color]}"></span></td><td>${esc(p.name)}${p.id === this.you ? " (you)" : ""}</td><td class="num">${p.owned}</td><td class="num">${p.carried.toLocaleString("en-AU")}</td><td class="num">${money(p.money)}</td></tr>`
            )
            .join("")}</tbody>
        </table>
        <div class="row">
          ${this.conn.local ? `<button class="btn primary" data-act="restart">Play again</button>` : host ? `<button class="btn primary" data-act="rematch">Back to the lobby</button>` : `<span class="muted">Waiting for the host…</span>`}
          <button class="btn" data-act="exit">Main menu</button>
          <button class="btn ghost" data-act="close-overlay">Look at the map</button>
        </div>
      </div>`;
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
    this.el.classList.toggle("panel-closed", !this.panelOpen);
    patch(this.panel, this.panelHtml(s, me));
    if (this.mode.kind !== "idle") this.updateHighlight();
  }

  private renderHud(s: Snapshot, me: PlayerView | undefined) {
    const need = Math.ceil(s.totalSections * s.settings.winShare);
    const owned = me?.owned ?? 0;
    const pct = Math.min(100, (owned / need) * 100);
    const left = s.duration - s.time;
    const local = this.conn.local;
    const html = `
      <div class="hud-l">
        <button class="hud-btn" data-act="exit" title="Main menu" aria-label="Main menu"><img src="/sprites/logo-icon.webp" alt=""></button>
        ${me ? `<div class="pill you"><img src="/sprites/badge-${me.color}.webp" alt=""><span>${esc(me.name)}</span></div>` : `<div class="pill">Watching</div>`}
        ${me ? `<div class="pill money ${me.money < 0 ? "neg" : ""}"><img src="/sprites/money.webp" alt="">${money(me.money)}</div>` : ""}
      </div>
      <div class="pill goal" title="Own ${need} of ${s.totalSections} sections to win">
        <span class="lbl">Track</span>
        <span class="meter"><b style="width:${pct}%;background:${me ? CSS_COLORS[me.color] : "#888"}"></b></span>
        <span class="mono">${owned}/${need}</span>
      </div>
      <div class="hud-r">
        <div class="pill mono ${left < 120 ? "warn" : ""}" title="Time left">${remaining(left)}</div>
        ${
          local
            ? `<button class="hud-btn" data-act="pause" aria-label="${this.conn.paused ? "Resume" : "Pause"}"><img src="/sprites/${this.conn.paused ? "play" : "pause"}.webp" alt=""></button>
               <div class="seg small">${[1, 2, 3].map((x) => `<button data-act="speedx" data-arg="${x}" class="${this.conn.speed === x ? "on" : ""}">${x}×</button>`).join("")}</div>`
            : ""
        }
        <button class="hud-btn" data-act="help" aria-label="How to play">?</button>
      </div>`;
    patch(this.hud, html);
  }

  private renderBoard(s: Snapshot) {
    const ranked = s.players;
    patch(
      this.board,
      `<div class="board-title">Companies</div>` +
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

  private stationName(id: StationId) {
    return this.map.net.station[id]?.name ?? id;
  }

  private chip(s: Snapshot, owner: string | null) {
    const p = s.players.find((x) => x.id === owner);
    return p ? `<span class="chip" style="--c:${CSS_COLORS[p.color]}" title="${esc(p.name)}"></span>` : `<span class="chip none"></span>`;
  }

  private homeHtml(s: Snapshot, me: PlayerView | undefined): string {
    if (!me) return `<h3>Watching</h3><p class="muted">The game started before you joined. Enjoy the show.</p>`;
    const mine = s.lines.filter((l) => l.owner === me.id);
    const owned = me.owned;
    let tip = "";
    if (owned === 0) tip = `Tap a <b>dotted section</b> next to your hub, <b>${esc(this.stationName(me.hub))}</b>, then press <b>Open</b>.`;
    else if (!mine.length) tip = `Now press <b>New line</b> and tap the stations along your track to start running trains.`;
    else if (s.time < 120) tip = `Open more track and extend your lines. Busy lines need more trains.`;
    else tip = `Run a line onto a rival's track, then cut your fare and add trains to win their passengers.`;
    return `
      <h3>Your lines</h3>
      <div class="tip">${tip}</div>
      ${mine.length ? `<div class="lines">${mine.map((l) => this.lineRow(s, l)).join("")}</div>` : ""}
      <button class="btn primary wide" data-act="new-line" ${mine.length >= s.settings.maxLinesPerPlayer ? "disabled" : ""}>New line · ${money(trainCost(s, 2))}</button>
      <p class="muted small">Drag to move the map. Scroll or pinch to zoom. Tap a station or a section for details.</p>`;
  }

  private lineRow(s: Snapshot, l: LineView): string {
    const owner = s.players.find((p) => p.id === l.owner);
    const lf = Math.round(l.loadFactor * 100);
    return `<button class="line-row" data-act="select-line" data-arg="${l.id}" data-key="${l.id}">
      <span class="chip" style="--c:${owner ? CSS_COLORS[owner.color] : "#888"}"></span>
      <span class="lr-name">${esc(this.stationName(l.stations[0]))} → ${esc(this.stationName(l.stations[l.stations.length - 1]))}</span>
      <span class="lr-meta mono">${l.trains}🚆 ${fare(l.fare)}</span>
      <span class="load"><b style="width:${lf}%"></b></span>
    </button>`;
  }

  private stationHtml(s: Snapshot, id: StationId, me: PlayerView | undefined): string {
    const st = this.map.net.station[id];
    const waiting = s.waiting[id] ?? 0;
    const lines = s.lines.filter((l) => l.stations.includes(id));
    const out = this.map.net.adj[id];
    const canStart = me && out.some((e) => s.sections[e.section].owner);
    const hubOf = s.players.find((p) => p.hub === id);
    return `
      <button class="back" data-act="back">← Back</button>
      <h3>${esc(st.name)}</h3>
      ${hubOf ? `<div class="tag">${hubOf.id === this.you ? "Your home hub" : `${esc(hubOf.name)}'s home hub`}</div>` : ""}
      <div class="stats">
        <div><span class="v mono">${waiting}</span><span class="k">waiting now</span></div>
        <div><span class="v mono">${st.pop}k</span><span class="k">people nearby</span></div>
        <div><span class="v mono">${st.jobs}k</span><span class="k">jobs nearby</span></div>
      </div>
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
        ? `<div class="tip">To take it, make ${esc(owner?.name ?? "the owner")}'s trains run empty ${need} times in a row: charge less than them, and run enough trains with enough room for everyone.</div>`
        : `<div class="tip">Run one of your lines over this section, then undercut ${esc(owner?.name ?? "the owner")}'s fare to win their passengers. You'll pay them ${money(s.settings.trackFee)} each time your train uses it.</div>`;
    } else if (ss.owner === this.you && ss.emptyRun > 0) {
      action = `<div class="tip bad">Your trains have left empty ${ss.emptyRun} of ${need} times. Lower your fare or add trains, fast!</div>`;
    }
    return `
      <button class="back" data-act="back">← Back</button>
      <h3>${esc(this.stationName(sec.a))} – ${esc(this.stationName(sec.b))}</h3>
      ${sec.landmark ? `<div class="tag">${esc(sec.landmark)}</div>` : ""}
      <div class="owner-line">${this.chip(s, ss.owner)}<span>${owner ? `Owned by <b>${esc(owner.id === this.you ? "you" : owner.name)}</b>` : "Not opened yet"}</span></div>
      <div class="stats">
        <div><span class="v mono">${sec.minutes} min</span><span class="k">trip</span></div>
        <div><span class="v mono">${ss.traffic}</span><span class="k">recent riders</span></div>
        <div><span class="v">${dots(ss.emptyRun, need, owner ? CSS_COLORS[owner.color] : "#888")}</span><span class="k">empty in a row</span></div>
      </div>
      ${action}
      ${users.length ? `<h4>Lines on this track</h4><div class="lines">${users.map((l) => this.lineRow(s, l)).join("")}</div>` : ""}
      <div class="row small-row"><button class="link" data-act="select-station" data-arg="${sec.a}">${esc(this.stationName(sec.a))}</button><button class="link" data-act="select-station" data-arg="${sec.b}">${esc(this.stationName(sec.b))}</button></div>`;
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
        <div><span class="v mono">${isFinite(l.headway) ? `${l.headway.toFixed(1)} min` : "–"}</span><span class="k">train every</span></div>
        <div><span class="v mono">${lf}%</span><span class="k">seats full</span></div>
        <div><span class="v mono">${l.cars * S.carSeats}</span><span class="k">seats/train</span></div>
      </div>
      <div class="loadbar"><b style="width:${lf}%"></b></div>`;
    if (!mine) {
      return `<button class="back" data-act="back">← Back</button>
        <div class="owner-line"><img class="badge" src="/sprites/badge-${owner.color}.webp" alt=""><h3>${esc(owner.name)}'s line</h3></div>
        <div class="route">${route}</div>
        ${stats}
        <div class="stats"><div><span class="v mono">${fare(l.fare)}</span><span class="k">per ride</span></div><div><span class="v mono">${l.trains}</span><span class="k">trains</span></div><div><span class="v mono">${l.speed}</span><span class="k">speed</span></div></div>`;
    }
    const tc = trainCost(s, l.cars) + (l.speed - 1) * S.speedCost;
    const first = l.stations[0];
    const last = l.stations[l.stations.length - 1];
    return `
      <button class="back" data-act="back">← Back</button>
      <div class="owner-line"><img class="badge" src="/sprites/badge-${owner.color}.webp" alt=""><h3>Your line</h3></div>
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
        <span class="ctrl-k">Cars per train <small>${money(S.carCost * l.trains)} per car</small></span>
        <button class="step" data-act="cars" data-arg="${l.id}" data-d="-1" ${l.cars <= 1 ? "disabled" : ""} aria-label="Shorter trains">−</button>
        <span class="ctrl-v mono">${l.cars}</span>
        <button class="step" data-act="cars" data-arg="${l.id}" data-d="1" ${l.cars >= 8 || (me?.money ?? 0) < S.carCost * l.trains ? "disabled" : ""} aria-label="Longer trains">+</button>
      </div>
      <div class="ctrl">
        <span class="ctrl-k">Speed <small>${money(S.speedCost * l.trains)} per step</small></span>
        <div class="seg">${[1, 2, 3].map((x) => `<button data-act="speed" data-arg="${l.id}" data-d="${x}" class="${l.speed === x ? "on" : ""}" ${x < l.speed ? "disabled" : ""}>${x === 1 ? "Normal" : x === 2 ? "Fast" : "Metro"}</button>`).join("")}</div>
      </div>
      <p class="muted small">Running cost: ${money(S.carCostPerMinute * l.cars * l.trains * 60)} per hour of game time.</p>
      <div class="row">
        <button class="btn" data-act="extend" data-arg="${l.id}" data-d="start">Extend from ${esc(this.stationName(first))}</button>
        <button class="btn" data-act="extend" data-arg="${l.id}" data-d="end">Extend from ${esc(this.stationName(last))}</button>
      </div>
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
    this.unsub();
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("resize", this.onResize);
    this.map.destroy();
    this.el.remove();
  }
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
    <li><b>Capture.</b> When the owner's trains leave a section empty 3 times in a row, it's yours.</li>
    <li><b>Win.</b> Own half the network, or carry the most passengers when time runs out.</li>
  </ol>
  <p class="muted small">Passengers pick routes by fare plus time (50 cents a minute), and changing trains costs them 4 minutes.</p>`;
