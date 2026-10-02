export * from "./types";
export * from "./network";
export * from "./routing";
export * from "./game";
export * from "./session";
export * from "./random";
export { SYDNEY, SYDNEY_WATER } from "./data/sydney";

import { SYDNEY } from "./data/sydney";
import { GREATER } from "./data/greater";
import type { MapDef } from "./types";
export const MAPS: Record<string, MapDef> = { sydney: SYDNEY, greater: GREATER };
export const MAP_CHOICES = [
  { id: "sydney", name: "Sydney", blurb: "quick games" },
  { id: "greater", name: "Greater Sydney", blurb: "Gosford to Wollongong, longer games" }
];
