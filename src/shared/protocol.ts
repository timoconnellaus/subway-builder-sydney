import type { BotStyle, Color, Command, HouseRules, PlayerId, StationId } from "../sim/types";
import type { Snapshot } from "../sim/session";
import { cleanRules, MAPS, Session } from "../sim";

export const MAX_PLAYERS = 4;

export interface LobbyPlayer {
  id: PlayerId;
  name: string;
  color: Color;
  isBot: boolean;
  botStyle?: BotStyle;
  connected: boolean;
}

export interface RoomOptions {
  roundMinutes: number;
  rules: HouseRules;
  map: string;
}

export interface LobbyState {
  room: string;
  host: PlayerId | null;
  players: LobbyPlayer[];
  options: RoomOptions;
  phase: "lobby" | "game" | "over";
  paused: boolean;
  pausedBy?: PlayerId | null; // who pressed pause (not saved: a restored room just says "Paused")
  wins: Record<PlayerId, number>; // rounds won in this room
  rounds: number;
}

export const EMOTES = ["👍", "😂", "😮", "😡", "🚆", "🎉"] as const;

export type ClientMsg =
  | { t: "hello"; name: string; token: string }
  | { t: "addBot"; style: BotStyle; slot?: number }
  | { t: "removePlayer"; id: PlayerId }
  | { t: "setSlot"; slot: number }
  | { t: "setName"; name: string }
  | { t: "setOptions"; options: Partial<RoomOptions> }
  | { t: "start" }
  | { t: "rematch" }
  | { t: "pause"; paused: boolean }
  | { t: "emote"; e: string }
  | { t: "cmd"; id: number; cmd: Command }
  | { t: "ping"; at: number };

export type ServerMsg =
  | { t: "welcome"; you: PlayerId; room: string }
  | { t: "lobby"; lobby: LobbyState }
  | { t: "snap"; s: Snapshot }
  | { t: "ack"; id: number; ok: boolean; error?: string }
  | { t: "error"; message: string }
  | { t: "pong"; at: number }
  | { t: "emote"; from: PlayerId; e: string };

// Seat i plays colour SLOTS[i] and starts at the map's hubs[i].
export const SLOTS: { color: Color }[] = [{ color: "red" }, { color: "blue" }, { color: "gold" }, { color: "green" }];

/** Round lengths a game can be set to, in game minutes. */
export const ROUND_CHOICES = [300, 600, 900, 1200] as const;
/** Five minutes is only enough for a real fight on the small Sydney map. */
export function minRoundFor(mapId: string): number {
  return mapId === "sydney" ? 300 : 600;
}

/** Someone taking part in a new round: a seat number, plus a bot style for bots. */
export interface RoundSeat {
  id: PlayerId;
  name: string;
  slot: number;
  botStyle?: BotStyle;
}

/** Start a round: seats become colours and hubs on the map, house rules are cleaned. Used by
 * single player and online rooms alike. Players keep the order given (it decides bot turn order,
 * so a seeded daily challenge must always pass them the same way). */
export function startRound(mapId: string, seats: RoundSeat[], rules: HouseRules, roundMinutes: number, seed?: number): Session {
  const map = MAPS[mapId] ?? MAPS.sydney;
  return Session.create(
    map,
    seats.map((m) => ({ id: m.id, name: m.name, ...seat(map.id, m.slot), isBot: !!m.botStyle, botStyle: m.botStyle })),
    { ...cleanRules(rules), roundMinutes },
    seed
  );
}

/** The seats bots take when you sit in `slot` (-1 for none): the others, in order. */
export function botSeats(slot: number, count: number): number[] {
  return SLOTS.map((_, i) => i).filter((i) => i !== slot).slice(0, count);
}

/** Colour and starting hub for a seat on a map. */
export function seat(mapId: string, slot: number): { color: Color; hub: StationId } {
  const map = MAPS[mapId] ?? MAPS.sydney;
  return { color: SLOTS[slot].color, hub: map.hubs[slot] };
}

/** Player names: letters, numbers and simple punctuation, at most 16 characters. */
export function cleanPlayerName(name: unknown): string {
  return typeof name === "string" ? name.replace(/[^\p{L}\p{N} '._-]/gu, "").trim().slice(0, 16) : "";
}

export const BOT_TIPS: Record<BotStyle, string> = {
  builder: "Spreads fast, defends weakly",
  raider: "Undercuts your busiest track",
  banker: "Grabs the centre, lives off fees"
};

export const BOT_NAMES: Record<BotStyle, string> = {
  builder: "The Builder",
  raider: "The Raider",
  banker: "The Banker"
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export function makeRoomCode(rand: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)];
  return s;
}
export function isRoomCode(s: string): boolean {
  return /^[A-Z]{4}$/.test(s);
}
