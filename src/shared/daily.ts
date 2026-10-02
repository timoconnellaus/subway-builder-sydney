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

const TWISTS: { text: string; rules: HouseRules }[] = [
  { text: "A normal day on the rails.", rules: {} },
  { text: "Rush hour all day: Sydney is extra busy.", rules: { demandPerMinute: 200 } },
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
  const weekend = new Date(`${date}T12:00:00Z`).getUTCDay() % 6 === 0;
  return {
    date,
    seed,
    map: weekend ? "greater" : "sydney",
    slot: next(4),
    bots,
    rules: { botSkill: 2, ...twist.rules },
    roundMinutes: weekend ? 900 : 600,
    twist: twist.text
  };
}

/** Higher is better: any win beats any loss, and faster wins beat slower ones. */
export function dailyScore(won: boolean, minutes: number, share: number): number {
  return won ? WIN_BASE - Math.round(minutes) : Math.round(share * LOSS_MAX);
}

const isWin = (score: number) => score > LOSS_MAX;

export function dailyLabel(score: number): string {
  return isWin(score) ? `Won in ${WIN_BASE - score} min` : `Owned ${Math.round((score / LOSS_MAX) * 100)}%`;
}

export function validScore(score: unknown): score is number {
  return typeof score === "number" && Number.isInteger(score) && score >= 0 && score < WIN_BASE && (score <= LOSS_MAX || score > WIN_BASE - 5000);
}
