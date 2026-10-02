import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { Delaunay } from "d3-delaunay";
import { buildNetwork, sectionBetween, type MapDef, type Network, type Snapshot, type StationId } from "../../sim";
import type { Color, PlayerId, SectionId } from "../../sim/types";
import { COLOR_BLIND, COLORS, SOFT } from "../util";

const LAND = 0xebe7de;
const WATER = 0x9cc8e8;
const INK = 0x1e2430;
const NEUTRAL = 0xa9aeb6;
const PAPER = 0xfbfaf7;
const LABEL_PX = 12; // station name font size
const MIN_LABEL_PX = 11; // smallest a label may appear on screen

export type Pick = { kind: "station"; id: StationId } | { kind: "section"; id: SectionId } | null;

interface TrainSprite {
  sprite: Sprite;
  x: number;
  y: number;
  rot: number;
  seen: number;
}

interface Frame {
  at: number;
  snap: Snapshot;
}

export class MapView {
  app = new Application();
  net: Network;
  world = new Container();
  private territory = new Graphics();
  private tracks = new Graphics();
  private overlay = new Graphics();
  private stationsG = new Graphics();
  private waitingG = new Graphics();
  private markers = new Graphics();
  private trainLayer = new Container();
  private labelLayer = new Container();
  private hubLayer = new Container();
  private selectG = new Graphics();
  private labels: { text: Text; station: StationId; major: boolean; rank: number }[] = [];
  private pos: Record<StationId, [number, number]> = {};
  private voronoi: [number, number][][] = [];
  private textures: Record<string, Texture> = {};
  private trains = new Map<string, TrainSprite>();
  private frames: Frame[] = [];
  private ownerSig = "";
  private colorOf: Record<PlayerId, Color> = {};
  private slotOf: Record<PlayerId, number> = {};
  private zoom = 1;
  private u = 1; // symbol scale: map symbols shrink a little as you zoom in so they don't balloon
  private lastSnap: Snapshot | null = null;
  private baseScale = 1;
  private destroyed = false;
  selected: Pick = null;
  highlight: StationId[] = []; // route preview or selected line
  highlightColor = INK;
  candidates: StationId[] = []; // stations you can tap next while building
  hintSections: SectionId[] = []; // sections to pulse as a hint (e.g. track you can open)
  private floats: { text: Text; born: number; x: number; y: number }[] = [];
  private lastLoad = new Map<string, number>();
  private floatLayer = new Container();
  private eventMarks = new Map<number, Text>();
  private flashes = new Map<SectionId, { at: number; color: number }>();
  private owners: Record<SectionId, PlayerId | null> = {};
  you: PlayerId = "";
  delay = 120; // ms of interpolation delay
  insets = { left: 0, top: 0, right: 0, bottom: 0 };

  private W = 1000;
  private H = 760;

  constructor(private host: HTMLElement, private map: MapDef) {
    this.net = buildNetwork(map);
    const b = map.bounds;
    // keep the map's true proportions: height follows from the latitude span
    const midLat = ((b.lat0 + b.lat1) / 2) * (Math.PI / 180);
    this.H = Math.round((this.W * Math.abs(b.lat1 - b.lat0)) / (Math.abs(b.lon1 - b.lon0) * Math.cos(midLat)));
    const W = this.W;
    const H = this.H;
    for (const s of map.stations) {
      this.pos[s.id] = [((s.lon - b.lon0) / (b.lon1 - b.lon0)) * W, ((s.lat - b.lat0) / (b.lat1 - b.lat0)) * H];
    }
    const pts = map.stations.map((s) => this.pos[s.id]);
    const vor = Delaunay.from(pts).voronoi([0, 0, W, H]);
    this.voronoi = map.stations.map((_, i) => (vor.cellPolygon(i) as [number, number][]) ?? []);
  }

  project(lon: number, lat: number): [number, number] {
    const b = this.map.bounds;
    return [((lon - b.lon0) / (b.lon1 - b.lon0)) * this.W, ((lat - b.lat0) / (b.lat1 - b.lat0)) * this.H];
  }

  ready = false;

  async init() {
    await this.app.init({
      background: LAND,
      resizeTo: this.host,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(2, window.devicePixelRatio || 1)
    });
    if (this.destroyed) return this.app.destroy(true, { children: true });
    this.host.appendChild(this.app.canvas);
    const names = [
      "city", "parramatta", "airport", "liverpool",
      ...(["red", "blue", "gold", "green", "neutral"] as const).flatMap((c) => [`train-suburban-${c}`, `train-metro-${c}`])
    ];
    const loaded = await Assets.load(names.map((n) => ({ alias: n, src: `/sprites/${n}.webp` })));
    if (this.destroyed) return this.app.destroy(true, { children: true });
    for (const n of names) this.textures[n] = loaded[n];
    this.buildStatic();
    this.app.stage.addChild(this.world);
    this.fit();
    this.app.renderer.on("resize", () => this.fit(true));
    this.app.ticker.add(() => this.frame());
    this.ready = true;
  }

  private buildStatic() {
    const { W, H } = this;
    const land = new Graphics().rect(-W, -H, W * 3, H * 3).fill(LAND);
    const water = new Graphics();
    const ocean = (this.map.water?.ocean ?? []).map(([lo, la]) => this.project(lo, la));
    if (ocean.length) water.poly(ocean.flat()).fill(WATER);
    // rivers: a round-capped stroke per segment, so bends, loops and north-south rivers keep their width
    for (const rib of this.map.water?.ribbons ?? []) {
      for (let i = 0; i < rib.length - 1; i++) {
        const [lo, la, w] = rib[i];
        const [lo2, la2, w2] = rib[i + 1];
        const a = this.project(lo, la);
        const b = this.project(lo2, la2);
        const width = Math.abs(this.project(lo, la + (w + w2) / 2)[1] - a[1]) * 2;
        water.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width, color: WATER, cap: "round" });
      }
    }
    this.world.addChild(land, this.territory, water, this.tracks, this.overlay, this.markers, this.stationsG, this.waitingG, this.hubLayer, this.trainLayer, this.selectG, this.labelLayer, this.floatLayer);

    for (const s of this.map.stations) {
      const [x, y] = this.pos[s.id];
      const major = !!s.icon || s.jobs >= 30 || s.pop >= 50;
      const text = new Text({
        text: s.icon ? s.name.toUpperCase() : s.name,
        style: {
          fontFamily: "Overpass, Arial, sans-serif",
          fontWeight: "800",
          fontSize: s.icon ? 15 : LABEL_PX,
          fill: INK,
          stroke: { color: LAND, width: 4, join: "round" }
        },
        resolution: 3
      });
      placeLabel(text, s.label, x, y, s.icon ? 22 : 9);
      this.labelLayer.addChild(text);
      this.labels.push({ text, station: s.id, major, rank: (s.icon ? 1000 : 0) + s.pop + s.jobs });
      if (s.icon) {
        const tile = new Graphics().circle(0, 0, 17).fill(PAPER).stroke({ width: 4, color: INK });
        tile.position.set(x, y);
        const icon = new Sprite(this.textures[s.icon]);
        icon.anchor.set(0.5);
        const k = 22 / Math.max(icon.texture.width, icon.texture.height);
        icon.scale.set(k);
        icon.position.set(x, y);
        tile.label = `hub-${s.id}`;
        icon.label = `icon-${s.id}`;
        this.hubLayer.addChild(tile, icon);
      }
    }
    this.labels.sort((a, b) => b.rank - a.rank); // most important first, for overlap checks
  }

  /** Fit the whole map into the view. */
  fit(keep = false) {
    const { W, H } = this;
    const { left, top, right, bottom } = this.insets;
    const sw = Math.max(200, this.app.screen.width - left - right);
    const sh = Math.max(200, this.app.screen.height - top - bottom);
    const s = Math.min(sw / W, sh / H) * 0.98;
    this.baseScale = s;
    if (!keep) {
      this.zoom = 1;
      this.world.scale.set(s);
      this.world.position.set(left + (sw - W * s) / 2, top + (sh - H * s) / 2);
    } else {
      this.world.scale.set(s * this.zoom);
    }
    this.updateLabelScale();
  }

  screenToWorld(sx: number, sy: number): [number, number] {
    const k = this.world.scale.x;
    return [(sx - this.world.x) / k, (sy - this.world.y) / k];
  }

  panBy(dx: number, dy: number) {
    if (!this.ready) return;
    this.world.x += dx;
    this.world.y += dy;
    this.clampView();
  }

  zoomAt(sx: number, sy: number, factor: number) {
    if (!this.ready) return;
    const nz = Math.max(0.8, Math.min(7, this.zoom * factor));
    const [wx, wy] = this.screenToWorld(sx, sy);
    this.zoom = nz;
    const k = this.baseScale * nz;
    this.world.scale.set(k);
    this.world.x = sx - wx * k;
    this.world.y = sy - wy * k;
    this.clampView();
    this.updateLabelScale();
  }

  /** A zoom at which the tracks around a station are long enough to tap (about 60px), at least `min`. */
  zoomFor(st: StationId, min: number): number {
    const [x, y] = this.pos[st];
    const shortest = Math.min(...this.net.adj[st].map((e) => Math.hypot(this.pos[e.to][0] - x, this.pos[e.to][1] - y)));
    return Math.min(5, Math.max(min, 60 / (shortest * this.baseScale)));
  }

  focus(st: StationId, zoom?: number) {
    if (!this.ready) return;
    if (zoom) {
      this.zoom = zoom;
      this.world.scale.set(this.baseScale * zoom);
      this.updateLabelScale();
    }
    const [x, y] = this.pos[st];
    const k = this.world.scale.x;
    const { left, top, right, bottom } = this.insets;
    this.world.x = left + (this.app.screen.width - left - right) / 2 - x * k;
    this.world.y = top + (this.app.screen.height - top - bottom) / 2 - y * k;
    this.clampView();
  }

  setInsets(i: Partial<MapView["insets"]>) {
    this.insets = { ...this.insets, ...i };
  }

  private clampView() {
    const { W, H } = this;
    const k = this.world.scale.x;
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    const minX = Math.min(0, sw - W * k) - sw * 0.3;
    const maxX = Math.max(0, sw - W * k) + sw * 0.3;
    const minY = Math.min(0, sh - H * k) - sh * 0.3;
    const maxY = Math.max(0, sh - H * k) + sh * 0.3;
    this.world.x = Math.max(minX, Math.min(maxX, this.world.x));
    this.world.y = Math.max(minY, Math.min(maxY, this.world.y));
  }

  private updateLabelScale() {
    const z = this.zoom;
    const u = 1 / Math.pow(Math.max(1, z), 0.7);
    if (Math.abs(u - this.u) / this.u > 0.04) {
      this.u = u;
      for (const c of this.hubLayer.children) {
        if (c.label?.startsWith("hub-")) c.scale.set(u);
        if (c.label?.startsWith("icon-")) {
          const sp = c as Sprite;
          sp.scale.set((22 / Math.max(sp.texture.width, sp.texture.height)) * u);
        }
      }
      if (this.lastSnap) {
        this.drawOwnership(this.lastSnap);
        this.drawWaiting(this.lastSnap);
      }
      for (const l of this.labels) {
        const st = this.net.station[l.station];
        const [x, y] = this.pos[st.id];
        placeLabel(l.text, st.label, x, y, (st.icon ? 22 : 9) * u);
      }
    }
    // labels grow a little with zoom, but never smaller than 11px on screen (small phone maps)
    const inv = Math.max(1 / Math.max(1, z * 0.75), MIN_LABEL_PX / (LABEL_PX * this.world.scale.x));
    const forced = new Set([...this.highlight, ...this.candidates]);
    for (const l of this.labels) {
      l.text.scale.set(inv);
      l.text.visible = l.major || this.world.scale.x > 1.15 || z >= 2.5 || forced.has(l.station);
    }
    this.hideOverlappingLabels(forced);
  }

  /** Drop labels that would sit on top of a more important one (labels are kept in priority order). */
  private hideOverlappingLabels(forced: Set<StationId>) {
    const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const pad = 2 / this.world.scale.x; // a couple of screen pixels apart
    for (const l of this.labels) {
      if (!l.text.visible) continue;
      const t = l.text;
      const w = t.width;
      const h = t.height;
      const r = { x0: t.x - t.anchor.x * w - pad, y0: t.y - t.anchor.y * h - pad, x1: t.x + (1 - t.anchor.x) * w + pad, y1: t.y + (1 - t.anchor.y) * h + pad };
      if (!forced.has(l.station) && placed.some((p) => r.x0 < p.x1 && r.x1 > p.x0 && r.y0 < p.y1 && r.y1 > p.y0)) {
        t.visible = false;
        continue;
      }
      placed.push(r);
    }
  }

  /** What is under a screen point: a station first, then a section. */
  pick(sx: number, sy: number): Pick {
    if (!this.ready) return null;
    const [x, y] = this.screenToWorld(sx, sy);
    const k = this.world.scale.x;
    let best: StationId | null = null;
    let bestD = Infinity;
    for (const s of this.map.stations) {
      const [px, py] = this.pos[s.id];
      const d = Math.hypot(px - x, py - y) * k;
      if (d < bestD) {
        bestD = d;
        best = s.id;
      }
    }
    let bestSec: SectionId | null = null;
    let bestSD = Infinity;
    for (const sec of this.net.sections) {
      const d = segDist(x, y, this.pos[sec.a], this.pos[sec.b]) * k;
      if (d < bestSD) {
        bestSD = d;
        bestSec = sec.id;
      }
    }
    // a direct hit on a station wins; otherwise the nearer of station or track
    if (best && bestD <= 9) return { kind: "station", id: best };
    if (bestSec && bestSD <= 14 && bestSD < bestD) return { kind: "section", id: bestSec };
    if (best && bestD <= 22) return { kind: "station", id: best };
    if (bestSec && bestSD <= 14) return { kind: "section", id: bestSec };
    return null;
  }

  stationScreen(st: StationId): [number, number] {
    const [x, y] = this.pos[st];
    return [x * this.world.scale.x + this.world.x, y * this.world.scale.y + this.world.y];
  }

  push(snap: Snapshot) {
    this.lastSnap = snap;
    const now = performance.now();
    this.frames.push({ at: now, snap });
    while (this.frames.length > 3) this.frames.shift();
    snap.players.forEach((p, i) => {
      this.colorOf[p.id] = p.color;
      this.slotOf[p.id] = i;
    });
    const sig = Object.entries(snap.sections)
      .map(([k, v]) => `${k}:${v.owner ?? ""}:${v.contested ? 1 : 0}`)
      .join("|");
    if (sig !== this.ownerSig) {
      // flash sections that just changed hands from one company to another
      for (const id in snap.sections) {
        const was = this.owners[id];
        const now = snap.sections[id].owner;
        if (was && now && was !== now) {
          const c = this.colorOf[now];
          if (c) this.flashes.set(id, { at: performance.now(), color: COLORS[c] });
        }
        this.owners[id] = now;
      }
      this.ownerSig = sig;
      this.drawOwnership(snap);
    }
    this.drawWaiting(snap);
  }

  private ownerColor(owner: PlayerId | null): Color | null {
    return owner ? this.colorOf[owner] ?? null : null;
  }

  private drawOwnership(snap: Snapshot) {
    // territory: each station's cell takes the colour of whoever owns most track there
    const t = this.territory;
    t.clear();
    const counts: Record<StationId, Record<string, number>> = {};
    for (const sec of this.net.sections) {
      const o = snap.sections[sec.id]?.owner;
      if (!o) continue;
      for (const s of [sec.a, sec.b]) {
        counts[s] ??= {};
        counts[s][o] = (counts[s][o] ?? 0) + 1;
      }
    }
    this.map.stations.forEach((s, i) => {
      const c = counts[s.id];
      if (!c) return;
      const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
      const col = this.ownerColor(top);
      const cell = this.voronoi[i];
      if (!col || !cell.length) return;
      t.poly(cell.flat()).fill({ color: SOFT[col], alpha: 0.85 });
    });
    for (const cell of this.voronoi) if (cell.length) t.poly(cell.flat()).stroke({ width: 2, color: 0xf3f1ec });

    const g = this.tracks;
    g.clear();
    for (const sec of this.net.sections) {
      const [ax, ay] = this.pos[sec.a];
      const [bx, by] = this.pos[sec.b];
      const st = snap.sections[sec.id];
      const col = this.ownerColor(st?.owner ?? null);
      if (!col) {
        dotted(g, ax, ay, bx, by, 9 * this.u, 2.2 * this.u, NEUTRAL);
        continue;
      }
      g.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 13 * this.u, color: PAPER, cap: "round" });
      g.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 8 * this.u, color: COLORS[col], cap: "round" });
    }
    // stations
    const s = this.stationsG;
    s.clear();
    for (const st of this.map.stations) {
      if (st.icon) continue;
      const [x, y] = this.pos[st.id];
      s.circle(x, y, 6 * this.u).fill(PAPER).stroke({ width: 3 * this.u, color: INK });
    }
    // hub rings in owner colour
    for (const st of this.map.stations) {
      if (!st.icon) continue;
      const owner = snap.players.find((p) => p.hub === st.id);
      const tile = this.hubLayer.children.find((c) => c.label === `hub-${st.id}`) as Graphics | undefined;
      if (tile) {
        tile.clear().circle(0, 0, 17).fill(PAPER).stroke({ width: 4, color: owner ? COLORS[owner.color] : INK });
      }
    }
  }

  private drawWaiting(snap: Snapshot) {
    const g = this.waitingG;
    g.clear();
    for (const st of this.map.stations) {
      const n = snap.waiting[st.id] ?? 0;
      if (n <= 0) continue;
      const [x, y] = this.pos[st.id];
      const dots = Math.min(12, Math.ceil(n / 8));
      for (let i = 0; i < dots; i++) {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const u = this.u;
        const dy = st.label === "b" ? -(10 + row * 3.4) : 10 + row * 3.4; // keep clear of a label underneath
        g.circle(x + (-8 + col * 3.4) * u, y + dy * u, 1.3 * u).fill(INK);
      }
    }
  }

  private drawOverlay(snap: Snapshot, t: number) {
    const g = this.overlay;
    g.clear();
    if (this.highlight.length > 1) {
      for (let i = 0; i < this.highlight.length - 1; i++) {
        const [ax, ay] = this.pos[this.highlight[i]];
        const [bx, by] = this.pos[this.highlight[i + 1]];
        g.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 20 * this.u, color: this.highlightColor, alpha: 0.28, cap: "round" });
      }
    }
    for (const id of this.hintSections) {
      const sec = this.net.section[id];
      if (!sec) continue;
      const [ax, ay] = this.pos[sec.a];
      const [bx, by] = this.pos[sec.b];
      const a = 0.5 + 0.3 * Math.sin(t / 220);
      g.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 14 * this.u, color: this.highlightColor || 0x1e2430, alpha: a, cap: "round" });
    }
    for (const c of this.candidates) {
      const [x, y] = this.pos[c];
      const r = (11 + Math.sin(t / 180) * 2) * this.u;
      g.circle(x, y, r).stroke({ width: 3 * this.u, color: this.highlightColor, alpha: 0.8 });
    }
    // contested sections: pulsing marker with the empty-run dots
    const m = this.markers;
    m.clear();
    for (const sec of this.net.sections) {
      const st = snap.sections[sec.id];
      if (!st || (!st.contested && st.emptyRun === 0)) continue;
      const [ax, ay] = this.pos[sec.a];
      const [bx, by] = this.pos[sec.b];
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const pulse = 0.5 + 0.5 * Math.sin(t / 250);
      const u = this.u;
      m.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 16 * u, color: 0xffffff, alpha: 0.25 + pulse * 0.25, cap: "round" });
      const need = snap.settings.emptyToCapture;
      const w = (need * 7 + 6) * u;
      m.roundRect(mx - w / 2, my - 7 * u, w, 14 * u, 7 * u).fill({ color: INK, alpha: 0.9 });
      const col = this.ownerColor(st.owner);
      for (let i = 0; i < need; i++) {
        const cx = mx - w / 2 + (6.5 + i * 7) * u;
        if (i < st.emptyRun) m.circle(cx, my, 2.6 * u).fill(col ? COLORS[col] : PAPER);
        else m.circle(cx, my, 2.6 * u).stroke({ width: 1.4 * u, color: col ? COLORS[col] : PAPER });
      }
    }
    for (const [id, f] of this.flashes) {
      const age = (t - f.at) / 1000;
      if (age > 1.6) {
        this.flashes.delete(id);
        continue;
      }
      const sec = this.net.section[id];
      const [ax, ay] = this.pos[sec.a];
      const [bx, by] = this.pos[sec.b];
      const k = age / 1.6;
      m.moveTo(ax, ay).lineTo(bx, by).stroke({ width: (14 + 40 * k) * this.u, color: f.color, alpha: 0.6 * (1 - k), cap: "round" });
    }
    // selection
    const s = this.selectG;
    s.clear();
    if (this.selected?.kind === "station") {
      const [x, y] = this.pos[this.selected.id];
      s.circle(x, y, 14 * this.u).stroke({ width: 3 * this.u, color: INK });
    } else if (this.selected?.kind === "section") {
      const sec = this.net.section[this.selected.id];
      const [ax, ay] = this.pos[sec.a];
      const [bx, by] = this.pos[sec.b];
      s.moveTo(ax, ay).lineTo(bx, by).stroke({ width: 22 * this.u, color: INK, alpha: 0.18, cap: "round" });
    }
  }

  private frame() {
    if (!this.frames.length) return;
    const now = performance.now();
    const t = now - this.delay;
    // find the two frames around t
    let a = this.frames[0];
    let b = this.frames[this.frames.length - 1];
    for (let i = 0; i < this.frames.length - 1; i++) {
      if (this.frames[i].at <= t && this.frames[i + 1].at >= t) {
        a = this.frames[i];
        b = this.frames[i + 1];
        break;
      }
    }
    const span = b.at - a.at;
    const alpha = span > 0 ? Math.max(0, Math.min(1, (t - a.at) / span)) : 1;
    this.drawOverlay(b.snap, now);
    this.drawEvents(b.snap, now);
    this.drawTrains(a.snap, b.snap, alpha);
  }

  private trainPos(snap: Snapshot, id: string): [number, number, number] | null {
    const tr = snap.trains.find((x) => x.id === id);
    if (!tr) return null;
    const [fx, fy] = this.pos[tr.from];
    if (!tr.to) return [fx, fy, NaN];
    const [tx, ty] = this.pos[tr.to];
    return [fx + (tx - fx) * tr.p, fy + (ty - fy) * tr.p, Math.atan2(ty - fy, tx - fx)];
  }

  private drawTrains(a: Snapshot, b: Snapshot, alpha: number) {
    const lineOwner = new Map(b.lines.map((l) => [l.id, l]));
    const seen = new Set<string>();
    for (const tr of b.trains) {
      const line = lineOwner.get(tr.line);
      if (!line) continue;
      seen.add(tr.id);
      const col = this.colorOf[line.owner] ?? "red";
      // colour-blind palette: tint the grey train instead of using the painted one
      const art = COLOR_BLIND ? "neutral" : col;
      const tex = this.textures[line.speed >= 3 ? `train-metro-${art}` : `train-suburban-${art}`];
      let ts = this.trains.get(tr.id);
      if (!ts) {
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        if (COLOR_BLIND) sprite.tint = COLORS[col];
        this.trainLayer.addChild(sprite);
        ts = { sprite, x: 0, y: 0, rot: 0, seen: 0 };
        this.trains.set(tr.id, ts);
      }
      if (ts.sprite.texture !== tex) ts.sprite.texture = tex;
      const pb = this.trainPos(b, tr.id)!;
      const pa = this.trainPos(a, tr.id) ?? pb;
      let x = pa[0] + (pb[0] - pa[0]) * alpha;
      let y = pa[1] + (pb[1] - pa[1]) * alpha;
      let rot = !isNaN(pb[2]) ? pb[2] : !isNaN(pa[2]) ? pa[2] : ts.rot;
      if (isNaN(pb[2]) && isNaN(pa[2])) {
        // dwelling at a station: face along the line
        const st = line.stations;
        const i = st.indexOf(tr.from);
        const other = st[i + 1] ?? st[i - 1];
        if (other) {
          const [ox, oy] = this.pos[other];
          rot = Math.atan2(oy - y, ox - x);
        }
      }
      // keep trains upright-ish and offset by owner so rivals sharing track are both visible
      const slot = this.slotOf[line.owner] ?? 0;
      const off = (slot - 1.5) * Math.max(3.2, 4 / this.world.scale.x);
      x += -Math.sin(rot) * off;
      y += Math.cos(rot) * off;
      ts.x = x;
      ts.y = y;
      ts.rot = rot;
      // keep trains readable when zoomed out: never smaller than ~22px on screen
      const k = this.world.scale.x;
      const minLen = 22 / k;
      const len = Math.max(minLen, 9 + line.cars * 2.4);
      ts.sprite.width = len;
      ts.sprite.height = len / (line.speed >= 3 ? 4.6 : 5.6);
      ts.sprite.position.set(x, y);
      ts.sprite.rotation = rot;
      ts.sprite.alpha = tr.load > 0 ? 1 : 0.75;
      // a little "+N" when your train picks people up
      const prev = this.lastLoad.get(tr.id);
      this.lastLoad.set(tr.id, tr.load);
      if (line.owner === this.you && prev !== undefined && tr.load > prev && !tr.to) this.float(`+${tr.load - prev}`, x, y, COLORS[col]);
    }
    this.animateFloats();
    for (const [id, ts] of this.trains) {
      if (!seen.has(id)) {
        ts.sprite.destroy();
        this.trains.delete(id);
        this.lastLoad.delete(id);
      }
    }
  }

  private drawEvents(snap: Snapshot, t: number) {
    const live = new Set<number>();
    const g = this.overlay;
    for (const ev of snap.cityEvents ?? []) {
      live.add(ev.id);
      const [x, y] = this.pos[ev.station];
      const on = snap.time >= ev.start && snap.time < ev.end;
      const pulse = 0.5 + 0.5 * Math.sin(t / 200);
      g.circle(x, y, (on ? 26 : 22) * this.u + pulse * 4 * this.u).stroke({ width: 3 * this.u, color: 0xf4a300, alpha: on ? 0.9 : 0.6 });
      let label = this.eventMarks.get(ev.id);
      if (!label) {
        label = new Text({ text: "", style: { fontFamily: "Overpass, Arial, sans-serif", fontWeight: "900", fontSize: 13, fill: 0x1e2430, stroke: { color: 0xfff7e0, width: 5, join: "round" } }, resolution: 3 });
        label.anchor.set(0.5, 1);
        this.floatLayer.addChild(label);
        this.eventMarks.set(ev.id, label);
      }
      const mins = Math.ceil(ev.start - snap.time);
      label.text = snap.time < ev.start ? `${ev.emoji} in ${mins} min` : snap.time < ev.end ? `${ev.emoji} now!` : `${ev.emoji} heading home`;
      label.scale.set(this.u);
      label.position.set(x, y - 26 * this.u);
    }
    for (const [id, label] of this.eventMarks) {
      if (!live.has(id)) {
        label.destroy();
        this.eventMarks.delete(id);
      }
    }
  }

  private float(text: string, x: number, y: number, color: number) {
    if (this.floats.length > 24) return;
    const t = new Text({
      text,
      style: { fontFamily: "Overpass, Arial, sans-serif", fontWeight: "900", fontSize: 14, fill: color, stroke: { color: 0xffffff, width: 4, join: "round" } },
      resolution: 3
    });
    t.anchor.set(0.5);
    t.scale.set(this.u * 0.8);
    t.position.set(x, y - 8 * this.u);
    this.floatLayer.addChild(t);
    this.floats.push({ text: t, born: performance.now(), x, y: y - 8 * this.u });
  }

  private animateFloats() {
    const now = performance.now();
    this.floats = this.floats.filter((f) => {
      const age = (now - f.born) / 1000;
      if (age > 1.2) {
        f.text.destroy();
        return false;
      }
      f.text.position.set(f.x, f.y - age * 18 * this.u);
      f.text.alpha = 1 - age / 1.2;
      return true;
    });
  }

  setHighlight(stations: StationId[], color: number, candidates: StationId[] = []) {
    const same = color === this.highlightColor && stations.join() === this.highlight.join() && candidates.join() === this.candidates.join();
    if (same) return; // called on every render while building a line
    this.highlight = stations;
    this.highlightColor = color;
    this.candidates = candidates;
    this.updateLabelScale();
  }

  sectionBetween(a: StationId, b: StationId) {
    return sectionBetween(this.net, a, b);
  }

  destroy() {
    this.destroyed = true;
    if (!this.ready) return; // init() will clean up when it notices
    try {
      this.app.destroy(true, { children: true });
    } catch {
      /* already gone */
    }
  }
}

function placeLabel(t: Text, side: "l" | "r" | "t" | "b" | undefined, x: number, y: number, gap: number) {
  switch (side) {
    case "l":
      t.anchor.set(1, 0.5);
      t.position.set(x - gap, y);
      break;
    case "t":
      t.anchor.set(0.5, 1);
      t.position.set(x, y - gap * 0.8);
      break;
    case "b":
      t.anchor.set(0.5, 0);
      t.position.set(x, y + gap * 0.8);
      break;
    default:
      t.anchor.set(0, 0.5);
      t.position.set(x + gap, y);
  }
}

function segDist(x: number, y: number, a: [number, number], b: [number, number]): number {
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const L = dx * dx + dy * dy;
  let t = L ? ((x - ax) * dx + (y - ay) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

function dotted(g: Graphics, ax: number, ay: number, bx: number, by: number, gap: number, r: number, color: number) {
  const L = Math.hypot(bx - ax, by - ay);
  const n = Math.max(1, Math.floor(L / gap));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    g.circle(ax + (bx - ax) * t, ay + (by - ay) * t, r);
  }
  g.fill(color);
}
