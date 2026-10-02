import type { BotStyle, Color, Command, HouseRules, PlayerId, StationId } from "../sim/types";
import type { Snapshot } from "../sim/session";

export const MAX_PLAYERS = 4;

export interface LobbyPlayer {
  id: PlayerId;
  name: string;
  color: Color;
  hub: StationId;
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
}

export const EMOTES = ["👍", "😂", "😮", "😡", "🚆", "🎉"] as const;

export type ClientMsg =
  | { t: "hello"; name: string; token: string }
  | { t: "addBot"; style: BotStyle }
  | { t: "removePlayer"; id: PlayerId }
  | { t: "setSlot"; slot: number }
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

export const SLOTS: { color: Color; hub: StationId }[] = [
  { color: "red", hub: "central" },
  { color: "blue", hub: "parramatta" },
  { color: "gold", hub: "airport" },
  { color: "green", hub: "liverpool" }
];

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
