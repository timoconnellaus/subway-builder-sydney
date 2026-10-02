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

/** Record a win at a stop; only the next unbeaten stop moves you on. */
export function tourWon(stop: number) {
  if (stop === tourProgress()) setStorage("tour", String(stop + 1));
}

export function stopName(stop: number): string {
  const m = MAP_CHOICES.find((c) => c.id === TOUR[stop]?.map);
  return m ? `${m.flag} ${m.name}` : "";
}
