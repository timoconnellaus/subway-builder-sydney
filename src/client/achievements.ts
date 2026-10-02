import type { Snapshot } from "../sim";
import { setStorage, storage } from "./util";

// Small goals that unlock once and are remembered in this browser.

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  how: string;
  check(s: Snapshot, you: string, ctx: { local: boolean; daily: boolean }): boolean;
}

const owns = (s: Snapshot, you: string, id: string) => s.sections[id]?.owner === you;

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-line", emoji: "🚆", name: "All aboard", how: "Run your first line", check: (s, you) => s.lines.some((l) => l.owner === you) },
  {
    id: "first-capture",
    emoji: "⚔️",
    name: "Track thief",
    how: "Capture a rival's section",
    check: (s, you) => s.events.some((e) => e.kind === "capture" && e.player === you && e.from !== null)
  },
  { id: "bridge", emoji: "🌉", name: "Bridge boss", how: "Own the Harbour Bridge", check: (s, you) => owns(s, you, "central~northsydney") },
  { id: "airport", emoji: "✈️", name: "Jet setter", how: "Own track at the Airport", check: (s, you) => owns(s, you, "airport~mascot") || owns(s, you, "airport~wollicreek") },
  { id: "ten", emoji: "🗺️", name: "Empire builder", how: "Own 10 sections in one game", check: (s, you) => (s.players.find((p) => p.id === you)?.owned ?? 0) >= 10 },
  { id: "busy", emoji: "👥", name: "Rush hour", how: "Carry 5,000 passengers in one game", check: (s, you) => (s.players.find((p) => p.id === you)?.carried ?? 0) >= 5000 },
  { id: "rich", emoji: "💰", name: "Money bags", how: "Have $10,000 at once", check: (s, you) => (s.players.find((p) => p.id === you)?.money ?? 0) >= 10000 },
  { id: "far", emoji: "⛰️", name: "Over the mountains", how: "Own track to Katoomba", check: (s, you) => owns(s, you, "katoomba~springwood") },
  {
    id: "win-easy",
    emoji: "🥉",
    name: "Winner",
    how: "Beat easy bots",
    check: (s, you, c) => c.local && s.phase === "over" && s.winner === you && s.players.some((p) => p.isBot) && s.settings.botSkill >= 1
  },
  {
    id: "win-normal",
    emoji: "🥈",
    name: "Champion",
    how: "Beat normal bots",
    check: (s, you, c) => c.local && s.phase === "over" && s.winner === you && s.players.some((p) => p.isBot) && s.settings.botSkill >= 2
  },
  {
    id: "win-hard",
    emoji: "🥇",
    name: "Legend",
    how: "Beat hard bots",
    check: (s, you, c) => c.local && s.phase === "over" && s.winner === you && s.players.some((p) => p.isBot) && s.settings.botSkill >= 3
  },
  {
    id: "win-daily",
    emoji: "📅",
    name: "Daily dasher",
    how: "Win a daily challenge",
    check: (s, you, c) => c.daily && s.phase === "over" && s.winner === you
  },
  {
    id: "win-online",
    emoji: "🏆",
    name: "Head of the family",
    how: "Win an online game against a person",
    check: (s, you, c) => !c.local && s.phase === "over" && s.winner === you && s.players.filter((p) => !p.isBot).length >= 2
  }
];

export function unlocked(): Set<string> {
  try {
    return new Set(JSON.parse(storage("achievements", "[]")) as string[]);
  } catch {
    return new Set();
  }
}

/** Check a snapshot; returns achievements unlocked for the first time. */
export function checkAchievements(s: Snapshot, you: string, local: boolean, daily = false): Achievement[] {
  const have = unlocked();
  const fresh = ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.check(s, you, { local, daily }));
  if (fresh.length) {
    for (const a of fresh) have.add(a.id);
    setStorage("achievements", JSON.stringify([...have]));
  }
  return fresh;
}
