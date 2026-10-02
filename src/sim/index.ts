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
import { MELBOURNE } from "./data/melbourne";
import { HONG_KONG } from "./data/hongkong";
import { BERLIN } from "./data/berlin";
import { SINGAPORE } from "./data/singapore";
import { BRISBANE } from "./data/brisbane";
import { MADRID } from "./data/madrid";
import { SEOUL } from "./data/seoul";
import type { MapDef } from "./types";
export const MAPS: Record<string, MapDef> = { sydney: SYDNEY, greater: GREATER, london: LONDON, newyork: NEW_YORK, tokyo: TOKYO, paris: PARIS, melbourne: MELBOURNE, hongkong: HONG_KONG, berlin: BERLIN, singapore: SINGAPORE, brisbane: BRISBANE, madrid: MADRID, seoul: SEOUL };
export const MAP_CHOICES: { id: string; name: string; blurb: string; flag: string; region: "Australia" | "World" }[] = [
  { id: "sydney", name: "Sydney", blurb: "quick games", flag: "🇦🇺", region: "Australia" },
  { id: "greater", name: "Greater Sydney", blurb: "Gosford to Wollongong, longer games", flag: "🇦🇺", region: "Australia" },
  { id: "melbourne", name: "Melbourne", blurb: "Flinders Street, Box Hill, Tullamarine", flag: "🇦🇺", region: "Australia" },
  { id: "brisbane", name: "Brisbane", blurb: "Central, the Airport, Ipswich, Beenleigh", flag: "🇦🇺", region: "Australia" },
  { id: "london", name: "London", blurb: "Bank vs Canary Wharf vs Heathrow", flag: "🇬🇧", region: "World" },
  { id: "newyork", name: "New York", blurb: "Times Square, Newark, JFK", flag: "🇺🇸", region: "World" },
  { id: "tokyo", name: "Tokyo", blurb: "the Yamanote loop and beyond", flag: "🇯🇵", region: "World" },
  { id: "paris", name: "Paris", blurb: "Châtelet, La Défense, Orly", flag: "🇫🇷", region: "World" },
  { id: "berlin", name: "Berlin", blurb: "Alexanderplatz, Zoo, BER, Spandau", flag: "🇩🇪", region: "World" },
  { id: "hongkong", name: "Hong Kong", blurb: "harbour crossings and the Airport Express", flag: "🇭🇰", region: "World" },
  { id: "singapore", name: "Singapore", blurb: "Raffles Place, Jurong East, Changi", flag: "🇸🇬", region: "World" },
  { id: "seoul", name: "Seoul", blurb: "Seoul Station, Gangnam, Gimpo, Suwon", flag: "🇰🇷", region: "World" },
  { id: "madrid", name: "Madrid", blurb: "Sol, Barajas, Móstoles, Alcobendas", flag: "🇪🇸", region: "World" }
];
/** Cities outside Australia, for the daily challenge's world-city Saturdays. */
export const WORLD_MAPS = MAP_CHOICES.filter((m) => m.region === "World").map((m) => m.id);
