export * from "./types";
export * from "./network";
export * from "./routing";
export * from "./game";
export * from "./session";
export { SYDNEY, SYDNEY_WATER } from "./data/sydney";

import { SYDNEY } from "./data/sydney";
import type { MapDef } from "./types";
export const MAPS: Record<string, MapDef> = { sydney: SYDNEY };
