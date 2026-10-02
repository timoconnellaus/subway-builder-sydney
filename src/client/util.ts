import type { Color } from "../sim/types";

export const COLORS: Record<Color, number> = {
  red: 0xe63946,
  blue: 0x1d7fe0,
  gold: 0xf4a300,
  green: 0x2ba84a
};
export const SOFT: Record<Color, number> = {
  red: 0xf6c3c7,
  blue: 0xc8cbf0, // periwinkle rather than sky blue, so blue territory doesn't read as water
  gold: 0xfbe0a6,
  green: 0xbfe6c8
};
export const CSS_COLORS: Record<Color, string> = {
  red: "#e63946",
  blue: "#1d7fe0",
  gold: "#f4a300",
  green: "#2ba84a"
};
// Colour-blind friendly palette (Okabe–Ito): swaps green for pink and spreads the rest apart.
const CB: Record<Color, [number, number]> = {
  red: [0xd55e00, 0xf3c9a8],
  blue: [0x0072b2, 0xb3d4ea],
  gold: [0xe8c700, 0xf7eda6],
  green: [0xcc79a7, 0xf0d2e3]
};
export const colorBlind = () => storage("color-blind") === "1";
// read once at start-up; the menu toggle reloads the page
if (colorBlind()) {
  for (const c of Object.keys(CB) as Color[]) {
    COLORS[c] = CB[c][0];
    SOFT[c] = CB[c][1];
    CSS_COLORS[c] = `#${CB[c][0].toString(16).padStart(6, "0")}`;
    document.documentElement.style.setProperty(`--${c}`, CSS_COLORS[c]);
  }
}

export const COLOR_NAMES: Record<Color, string> = { red: "Red", blue: "Blue", gold: "Gold", green: "Green" };

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | undefined> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === "class") el.className = String(v);
    else if (k === "html") el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function money(n: number): string {
  const v = Math.round(n);
  return (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-AU");
}

export function fare(n: number): string {
  return "$" + n.toFixed(2);
}

export function clock(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** Remaining real time as m:ss (1 game minute = 1 second). */
export function remaining(gameMinutesLeft: number): string {
  const s = Math.max(0, Math.ceil(gameMinutesLeft));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function storage(key: string, fallback = ""): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
export function setStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function token(): string {
  let t = storage("me-token");
  if (!t) {
    t = (crypto.randomUUID?.() ?? String(Math.random()).slice(2)) + Date.now().toString(36);
    setStorage("me-token", t);
  }
  return t;
}

/**
 * Patch `target`'s children to match `html` without replacing elements that are unchanged.
 * Keeps buttons stable across frequent re-renders so clicks and focus aren't lost.
 */
export function patch(target: HTMLElement, html: string) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(target, tpl.content);
}

function patchChildren(a: Node, b: Node) {
  const ac = Array.from(a.childNodes);
  const bc = Array.from(b.childNodes);
  for (let i = 0; i < bc.length; i++) {
    const x = ac[i];
    const y = bc[i];
    if (!x) {
      a.appendChild(y.cloneNode(true));
      continue;
    }
    if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName || (x as Element).getAttribute?.("data-key") !== (y as Element).getAttribute?.("data-key")) {
      a.replaceChild(y.cloneNode(true), x);
      continue;
    }
    if (x.nodeType === Node.TEXT_NODE) {
      if (x.textContent !== y.textContent) x.textContent = y.textContent;
      continue;
    }
    const xe = x as Element;
    const ye = y as Element;
    // leave a <details> open or closed as the user left it
    for (const attr of Array.from(xe.attributes)) if (!ye.hasAttribute(attr.name) && !(attr.name === "open" && xe.tagName === "DETAILS")) xe.removeAttribute(attr.name);
    for (const attr of Array.from(ye.attributes)) {
      if (attr.name === "open" && xe.tagName === "DETAILS") continue;
      if (xe.getAttribute(attr.name) !== attr.value) xe.setAttribute(attr.name, attr.value);
    }
    if (xe instanceof HTMLInputElement && ye instanceof HTMLInputElement && document.activeElement !== xe) xe.value = ye.value;
    patchChildren(x, y);
  }
  for (let i = ac.length - 1; i >= bc.length; i--) a.removeChild(ac[i]);
}

export interface PlayRecord {
  played: number;
  wins: number;
  best: number; // most passengers in one game
}

/** The player's record against bots in this browser. */
export function readRecord(): PlayRecord {
  try {
    return { played: 0, wins: 0, best: 0, ...JSON.parse(storage("record", "{}")) };
  } catch {
    return { played: 0, wins: 0, best: 0 };
  }
}
