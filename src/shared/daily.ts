import { seeded, type BotStyle, type HouseRules } from "../sim";

// The daily challenge: one setup per Sydney day, the same for everyone, with a shared leaderboard.

export interface DailyChallenge {
  date: string; // YYYY-MM-DD in Sydney
  seed: number;
  map: string;
  slot: number; // which seat (colour and hub) you play
  bots: BotStyle[];
  rules: HouseRules;
  roundMinutes: number;
  twist: string;
}

// Scores: a loss scores share-owned × 1000 (0–1000); a win scores WIN_BASE minus the minutes it took,
// so any win beats any loss and faster wins beat slower ones.
const WIN_BASE = 10000;
const LOSS_MAX = 1000;

export interface DailyEntry {
  name: string;
  score: number;
  label: string; // "Won in 412 min" or "Owned 38%"
  you?: boolean;
}

/** What the leaderboard returns. */
export interface BoardView {
  top: DailyEntry[];
  players: number;
  you: DailyEntry | null;
  rank: number;
}

// Saturday world cities. Append only: changing this list reshuffles past days' challenges.
const SATURDAY_MAPS = ["london", "newyork", "tokyo", "paris"];

const TWISTS: { text: string; rules: HouseRules }[] = [
  { text: "A normal day on the rails.", rules: {} },
  { text: "Rush hour all day: the whole city is extra busy.", rules: { demandPerMinute: 200 } },
  { text: "Shoestring budget: you start with less money.", rules: { startMoney: 2000 } },
  { text: "Quick grabs: only 2 empty trains to capture.", rules: { emptyToCapture: 2 } },
  { text: "Free track: no fee for using rival track.", rules: { trackFee: 0 } },
  { text: "Hard bots today. Good luck!", rules: { botSkill: 3 } },
  { text: "Toll roads: using rival track costs $10.", rules: { trackFee: 10 } },
  { text: "Rich start: everyone gets $5,000.", rules: { startMoney: 5000 } },
  { text: "Quick win: own half the network to win.", rules: { winShare: 0.5 } }
];

const SYDNEY_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" });

/** Today's date in Sydney as YYYY-MM-DD. */
export function sydneyDate(now = new Date()): string {
  return SYDNEY_DAY.format(now);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function dailyChallenge(date: string): DailyChallenge {
  const seed = hash(`metro-empire:${date}`);
  const rand = seeded(seed);
  const next = (n: number) => Math.floor(rand() * n);
  // two or three different bots, in a shuffled order
  const styles: BotStyle[] = ["builder", "raider", "banker"];
  for (let i = styles.length - 1; i > 0; i--) {
    const j = next(i + 1);
    [styles[i], styles[j]] = [styles[j], styles[i]];
  }
  const bots = styles.slice(0, 2 + next(2));
  const twist = TWISTS[next(TWISTS.length)];
  // weekdays in Sydney, Saturdays in a world city (a different one each week), Sundays on the big map
  const noon = new Date(`${date}T12:00:00Z`);
  const day = noon.getUTCDay();
  const week = Math.floor(noon.getTime() / (7 * 86400000));
  const map = day === 6 ? SATURDAY_MAPS[week % SATURDAY_MAPS.length] : day === 0 ? "greater" : "sydney";
  return {
    date,
    seed,
    map,
    slot: next(4),
    bots,
    rules: { botSkill: 2, ...twist.rules },
    roundMinutes: map === "sydney" ? 600 : 900,
    twist: twist.text
  };
}

/** "Saturday 3 October" for a YYYY-MM-DD date. */
export function dailyDateLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** Whole seconds (or game minutes) as m:ss. */
export function mmss(n: number): string {
  const s = Math.max(0, Math.floor(n));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Higher is better: any win beats any loss, and faster wins beat slower ones. */
export function dailyScore(won: boolean, minutes: number, share: number): number {
  return won ? WIN_BASE - Math.round(minutes) : Math.round(share * LOSS_MAX);
}

const isWin = (score: number) => score > LOSS_MAX;

export function dailyLabel(score: number): string {
  // game minutes pass at one a second, so show them the way the in-game clock does (m:ss)
  return isWin(score) ? `Won in ${mmss(WIN_BASE - score)}` : `Owned ${Math.round((score / LOSS_MAX) * 100)}%`;
}

export function validScore(score: unknown): score is number {
  // no real win takes under an hour of game time
  return typeof score === "number" && Number.isInteger(score) && score >= 0 && score <= WIN_BASE - 60 && (score <= LOSS_MAX || score > WIN_BASE - 5000);
}
