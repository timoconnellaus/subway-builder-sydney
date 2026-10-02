// Shared types for the Metro Empire simulation. Everything in GameState is plain JSON
// so it can be snapshotted, sent over the wire, and stored in a Durable Object.

export type PlayerId = string;
export type StationId = string;
export type SectionId = string;
export type LineId = string;
export type Color = "red" | "blue" | "gold" | "green";
export type BotStyle = "builder" | "raider" | "banker";

export interface StationDef {
  id: StationId;
  name: string;
  lon: number;
  lat: number;
  pop: number;
  jobs: number;
  icon?: string;
}

export interface SectionDef {
  a: StationId;
  b: StationId;
  minutes?: number;
  landmark?: string;
}

export interface MapDef {
  id: string;
  name: string;
  bounds: { lon0: number; lon1: number; lat0: number; lat1: number };
  hubs: StationId[];
  stations: StationDef[];
  sections: SectionDef[];
}

export interface Settings {
  roundMinutes: number; // game minutes (1 game minute = 1 real second at normal speed)
  startMoney: number;
  emptyToCapture: number; // owner trains leaving empty in a row before a section flips
  valueOfTime: number; // dollars per minute, used for patience and route choice
  transferMinutes: number; // penalty for changing trains
  demandPerMinute: number; // passengers spawned per game minute across the whole map
  groupSize: number; // passengers per simulated group
  carSeats: number;
  carCostPerMinute: number; // running cost per car per game minute
  trainBaseCost: number;
  carCost: number;
  speedCost: number; // per train per speed tier
  openBaseCost: number;
  openCostPerMinute: number;
  openCostPerOwned: number; // extra cost per section you already own
  trackFee: number; // paid to the section owner each time a rival train runs over it
  minFare: number;
  maxFare: number;
  defaultFare: number;
  dwellMinutes: number;
  winShare: number; // share of sections needed for an instant win
  maxLinesPerPlayer: number;
  maxTrainsPerLine: number;
  botSkill: 1 | 2 | 3; // 1 easy, 2 normal, 3 hard
}

export const DEFAULT_SETTINGS: Settings = {
  roundMinutes: 900,
  startMoney: 3000,
  emptyToCapture: 3,
  valueOfTime: 0.5,
  transferMinutes: 4,
  demandPerMinute: 140,
  groupSize: 4,
  carSeats: 30,
  carCostPerMinute: 0.35,
  trainBaseCost: 300,
  carCost: 60,
  speedCost: 200,
  openBaseCost: 250,
  openCostPerMinute: 25,
  openCostPerOwned: 50,
  trackFee: 4,
  minFare: 0.5,
  maxFare: 4,
  defaultFare: 2,
  dwellMinutes: 0.4,
  winShare: 0.6,
  maxLinesPerPlayer: 8,
  maxTrainsPerLine: 12,
  botSkill: 2
};

/** Rules players may change ("house rules"), with the values offered in the menus. */
export const HOUSE_RULES = {
  emptyToCapture: { label: "Empty trains to capture", values: [2, 3, 4, 5] },
  winShare: { label: "Track needed to win", values: [0.5, 0.6, 0.75], format: "percent" },
  startMoney: { label: "Starting money", values: [2000, 3000, 5000], format: "money" },
  trackFee: { label: "Fee for using rival track", values: [0, 4, 10], format: "money" },
  demandPerMinute: { label: "How busy Sydney is", values: [100, 140, 200], names: ["Quiet", "Normal", "Rush hour"] },
  botSkill: { label: "Bot skill", values: [1, 2, 3], names: ["Easy", "Normal", "Hard"] }
} as const;
export type HouseRuleKey = keyof typeof HOUSE_RULES;
export type HouseRules = Partial<Record<HouseRuleKey, number>>;

/** Keep only allowed house-rule values. */
export function cleanRules(r: unknown): Partial<Settings> {
  const out: Record<string, number> = {};
  if (!r || typeof r !== "object") return out;
  for (const k of Object.keys(HOUSE_RULES) as HouseRuleKey[]) {
    const v = (r as Record<string, unknown>)[k];
    if (typeof v === "number" && (HOUSE_RULES[k].values as readonly number[]).includes(v)) out[k] = v;
  }
  return out as Partial<Settings>;
}

export interface Player {
  id: PlayerId;
  name: string;
  color: Color;
  hub: StationId;
  money: number;
  isBot: boolean;
  botStyle?: BotStyle;
  carried: number; // passengers boarded on this player's trains
  income: number; // total fares + fees earned
  connected: boolean;
}

export interface SectionState {
  owner: PlayerId | null;
  emptyRun: number;
  // passengers carried over this section by rivals since the owner's last departure
  rivalSince: Record<PlayerId, number>;
  // tally across the current empty run, decides who captures
  tally: Record<PlayerId, number>;
  absentTimer: number; // minutes the owner has had no trains here while a rival has
  traffic: number; // decayed passengers per minute, for display and bots
}

export interface Line {
  id: LineId;
  owner: PlayerId;
  stations: StationId[];
  fare: number; // dollars per ride (flat)
  cars: number;
  speed: 1 | 2 | 3;
  trains: number;
  loadSum: number; // decayed passengers on board at departures
  capSum: number; // decayed seats at departures
}

export interface PassengerGroup {
  id: number;
  n: number;
  path: StationId[];
  i: number; // index in path of the station they are at / last left
  train: string | null;
  since: number; // time they started waiting
}

export interface Train {
  id: string;
  line: LineId;
  at: number; // index into line.stations of the station it is at or just left
  dir: 1 | -1; // direction it will travel next (dwell) or is travelling (move)
  phase: "dwell" | "move";
  timer: number; // minutes left in this phase
  segTotal: number; // minutes for the current move
  load: number;
  groups: number[]; // passenger group ids on board
}

export type GameEvent =
  | { t: number; kind: "open"; player: PlayerId; section: SectionId }
  | { t: number; kind: "capture"; player: PlayerId; from: PlayerId | null; section: SectionId }
  | { t: number; kind: "line"; player: PlayerId; line: LineId }
  | { t: number; kind: "empty"; player: PlayerId; section: SectionId; run: number }
  | { t: number; kind: "win"; player: PlayerId; reason: "share" | "time" }
  | { t: number; kind: "info"; text: string };

export interface GameState {
  mapId: string;
  time: number;
  phase: "running" | "over";
  players: Player[];
  sections: Record<SectionId, SectionState>;
  lines: Line[];
  trains: Train[];
  groups: Record<number, PassengerGroup>;
  waiting: Record<StationId, number[]>; // group ids waiting at each station
  demandAcc: number[]; // flattened origin x destination accumulator
  nextId: number;
  netVersion: number;
  events: GameEvent[];
  eventSeq: number; // total events ever emitted
  winner: PlayerId | null;
  settings: Settings;
  lost: number; // passengers who gave up
}

export type Command =
  | { type: "open"; section: SectionId }
  | { type: "createLine"; stations: StationId[] }
  | { type: "extendLine"; line: LineId; station: StationId; end: "start" | "end" }
  | { type: "deleteLine"; line: LineId }
  | { type: "setFare"; line: LineId; fare: number }
  | { type: "setTrains"; line: LineId; trains: number }
  | { type: "setCars"; line: LineId; cars: number }
  | { type: "setSpeed"; line: LineId; speed: 1 | 2 | 3 };

export type CommandResult = { ok: true } | { ok: false; error: string };
