export * from "./types";
export * from "./network";
export * from "./routing";
export * from "./game";
export * from "./session";
export * from "./random";
export * from "./tutorial";
export { SYDNEY, SYDNEY_WATER } from "./data/sydney";

import { SYDNEY } from "./data/sydney";
import { GREATER } from "./data/greater";
import { LONDON } from "./data/london";
import { NEW_YORK } from "./data/newyork";
import { PARIS } from "./data/paris";
import { TOKYO } from "./data/tokyo";
import type { MapDef } from "./types";
export const MAPS: Record<string, MapDef> = { sydney: SYDNEY, greater: GREATER, london: LONDON, newyork: NEW_YORK, tokyo: TOKYO, paris: PARIS };
export const MAP_CHOICES: { id: string; name: string; blurb: string; flag: string; region: "Australia" | "World" }[] = [
  { id: "sydney", name: "Sydney", blurb: "quick games", flag: "🇦🇺", region: "Australia" },
  { id: "greater", name: "Greater Sydney", blurb: "Gosford to Wollongong, longer games", flag: "🇦🇺", region: "Australia" },
  { id: "london", name: "London", blurb: "Bank vs Canary Wharf vs Heathrow", flag: "🇬🇧", region: "World" },
  { id: "newyork", name: "New York", blurb: "Times Square, Newark, JFK", flag: "🇺🇸", region: "World" },
  { id: "tokyo", name: "Tokyo", blurb: "the Yamanote loop and beyond", flag: "🇯🇵", region: "World" },
  { id: "paris", name: "Paris", blurb: "Châtelet, La Défense, Orly", flag: "🇫🇷", region: "World" }
];
/** Cities outside Australia, for the daily challenge's world-city Saturdays. */
export const WORLD_MAPS = MAP_CHOICES.filter((m) => m.region === "World").map((m) => m.id);
