import { dailyChallenge, sydneyDate, type DailyEntry } from "../shared/daily";
import { esc, setStorage, storage, token } from "./util";

export interface BoardView {
  top: DailyEntry[];
  players: number;
  you: DailyEntry | null;
  rank: number;
}

export const today = () => sydneyDate();
export const todaysChallenge = () => dailyChallenge(today());

export async function fetchBoard(date: string): Promise<BoardView | null> {
  try {
    const r = await fetch(`/api/daily/${date}?token=${encodeURIComponent(token())}`);
    return r.ok ? ((await r.json()) as BoardView) : null;
  } catch {
    return null;
  }
}

export async function submitScore(date: string, name: string, score: number): Promise<BoardView | null> {
  // remember the best score locally too, for when the server can't be reached
  const key = `daily-best:${date}`;
  if (score > Number(storage(key, "-1"))) setStorage(key, String(score));
  try {
    const r = await fetch(`/api/daily/${date}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, token: token(), score })
    });
    return r.ok ? ((await r.json()) as BoardView) : null;
  } catch {
    return null;
  }
}

export function localBest(date: string): number | null {
  const v = Number(storage(`daily-best:${date}`, "-1"));
  return v >= 0 ? v : null;
}

export function boardHtml(b: BoardView | null, limit = 10): string {
  if (!b) return `<p class="muted">The leaderboard needs the online server.</p>`;
  if (!b.top.length) return `<p class="muted">Nobody has finished today's challenge yet. Be the first!</p>`;
  const rows = b.top
    .slice(0, limit)
    .map((e, i) => `<tr class="${e.you ? "me" : ""}"><td class="num">${i + 1}</td><td>${esc(e.name)}</td><td class="num">${esc(e.label)}</td></tr>`)
    .join("");
  const extra = b.you && b.rank > limit ? `<tr class="me"><td class="num">${b.rank}</td><td>${esc(b.you.name)}</td><td class="num">${esc(b.you.label)}</td></tr>` : "";
  return `<table class="ranks daily-ranks"><tbody>${rows}${extra}</tbody></table><p class="muted small">${b.players} ${b.players === 1 ? "player" : "players"} today</p>`;
}
