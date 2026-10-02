import type { BoardView } from "../shared/daily";
import { esc, setStorage, storage, token } from "./util";

export async function fetchBoard(date: string): Promise<BoardView | null> {
  try {
    const r = await fetch(`/api/daily/${date}?token=${encodeURIComponent(token())}`);
    return r.ok ? ((await r.json()) as BoardView) : null;
  } catch {
    return null;
  }
}

/** Sends a score. Returns the board, a reason it wasn't taken, or null if the server can't be reached. */
export async function submitScore(date: string, name: string, score: number): Promise<BoardView | string | null> {
  // remember the best score locally too, for when the server can't be reached
  if (score > (localBest(date) ?? -1)) setStorage(`daily-best:${date}`, String(score));
  try {
    const r = await fetch(`/api/daily/${date}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, token: token(), score })
    });
    if (r.ok) return (await r.json()) as BoardView;
    if (r.status === 409) return "That day's leaderboard has closed, so this game was just for practice.";
    if (r.status === 400) return "The leaderboard couldn't take this score (check your name has letters or numbers).";
    return null;
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
