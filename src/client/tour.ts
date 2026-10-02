import { MAP_CHOICES, type BotStyle } from "../sim";
import { setStorage, storage } from "./util";

// World Tour: a run of single-player games, one per city, that unlock in order and get harder.

export interface TourStop {
  map: string;
  bots: BotStyle[];
  skill: 1 | 2 | 3;
}

export const TOUR: TourStop[] = [
  { map: "sydney", bots: ["builder", "banker"], skill: 1 },
  { map: "melbourne", bots: ["builder", "raider"], skill: 1 },
  { map: "london", bots: ["builder", "raider"], skill: 2 },
  { map: "paris", bots: ["banker", "raider"], skill: 2 },
  { map: "newyork", bots: ["builder", "raider", "banker"], skill: 2 },
  { map: "berlin", bots: ["builder", "raider", "banker"], skill: 2 },
  { map: "singapore", bots: ["raider", "banker"], skill: 3 },
  { map: "hongkong", bots: ["builder", "raider", "banker"], skill: 3 },
  { map: "tokyo", bots: ["builder", "raider", "banker"], skill: 3 }
];

export const TOUR_MINUTES = 600;

/** How many stops you've won so far (the next one to play). */
export function tourProgress(): number {
  return Math.min(TOUR.length, Math.max(0, Number(storage("tour", "0")) || 0));
}

/** Stars for a tour win: one for winning, one for owning enough track (not just leading at the
 * clock), one for winning before STAR_MINUTES. */
export const STAR_MINUTES = 420;
export function tourStarsFor(byShare: boolean, minutes: number): number {
  return 1 + (byShare ? 1 : 0) + (byShare && minutes <= STAR_MINUTES ? 1 : 0);
}

/** Best stars earned at a stop (0 if not won). */
export function tourStars(stop: number): number {
  // cities won before stars existed count as one star
  return Math.max(Number(storage(`tour-stars:${stop}`, "0")) || 0, stop < tourProgress() ? 1 : 0);
}

export const starText = (n: number) => "★".repeat(n) + "☆".repeat(3 - n);

/** Record a win at a stop (time and stars); only the next unbeaten stop moves you on. */
export function tourWon(stop: number, minutes: number, stars: number) {
  if (stop === tourProgress()) setStorage("tour", String(stop + 1));
  if (stars > tourStars(stop)) setStorage(`tour-stars:${stop}`, String(stars));
  const t = Math.round(minutes);
  const best = tourBest(stop);
  if (best === null || t < best) setStorage(`tour-best:${stop}`, String(t));
}

/** Fastest win at a stop, in game minutes (shown like the clock, m:ss). */
export function tourBest(stop: number): number | null {
  const v = Number(storage(`tour-best:${stop}`, ""));
  return v > 0 ? v : null;
}

/** The city at a stop (clamped to the tour). */
export function tourCity(stop: number): { flag: string; name: string } {
  const t = TOUR[Math.max(0, Math.min(stop, TOUR.length - 1))];
  return MAP_CHOICES.find((c) => c.id === t.map) ?? { flag: "", name: t.map };
}

export function stopName(stop: number): string {
  const m = tourCity(stop);
  return `${m.flag} ${m.name}`;
}
