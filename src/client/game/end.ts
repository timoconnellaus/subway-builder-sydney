import { byStanding, MAPS, winNeed, type Snapshot, type PlayerView } from "../../sim";
import { ruleLabel } from "../../sim/types";
import { CSS_COLORS, esc, money } from "../util";
import { STAR_MINUTES, starText, stopName, TOUR } from "../tour";
import { boardHtml, submitScore } from "../daily";
import { dailyDateLabel, dailyLabel, mmss } from "../../shared/daily";

// The end-of-round card: result, chart, a tip for next time, standings and the daily leaderboard.

/** What the end card needs to know about the game it's showing. */
export interface EndContext {
  you: string;
  local: boolean;
  host: boolean;
  tour?: number;
  daily?: string;
  replay: boolean; // a World Tour city that was already unlocked before this round
  stars: number;
}

/** The end card's HTML. */
export function endHtml(s: Snapshot, c: EndContext): string {
  const winner = s.players.find((p) => p.id === s.winner);
  const reason = s.events.find((e) => e.kind === "win");
  const ranked = [...s.players].sort(byStanding);
  const youWon = s.winner === c.you;
  const me = s.players.find((p) => p.id === c.you);
  return `
      <div class="card end">
        ${winner ? `<img class="end-badge" src="/sprites/badge-${winner.color}.webp" alt="">` : ""}
        <h2>${youWon ? "You win!" : winner ? `${esc(winner.name)} wins` : "Round over"}</h2>
        ${
          !youWon && me && winner && winner.owned - me.owned <= 1
            ? `<p class="so-close">${winner.owned === me.owned ? "So close! Level on track, beaten on passengers." : "So close! You lost by just 1 section."}</p>`
            : !youWon && me && me.owned > 0
              ? `<p class="so-close cheer">Good effort! You built ${me.owned} ${me.owned === 1 ? "section" : "sections"} and carried ${me.carried.toLocaleString("en-AU")} passengers. Have another go!</p>`
              : ""
        }
        <p class="muted">${reason && reason.kind === "win" && reason.reason === "share" ? `${youWon ? "You own" : "They own"} ${Math.round(s.settings.winShare * 100)}% of ${esc(MAPS[s.mapId]?.name ?? "the")}'s network.` : "Most track when the clock ran out (passengers break a tie)."}</p>
        ${historyChart(s)}
        ${me && c.tour !== undefined ? tourEnd(c.tour, youWon, c.replay, c.stars, s.settings.winShare) : ""}
        ${me && c.local && !(c.tour !== undefined && youWon) ? `<p class="end-tip">💡 ${endTip(s, me, youWon)}</p>` : ""}
        <table class="ranks">
          <thead><tr><th></th><th>Company</th><th>Track</th><th>Passengers</th><th>Money</th></tr></thead>
          <tbody>${ranked
            .map(
              (p) =>
                `<tr><td><span class="chip" style="--c:${CSS_COLORS[p.color]}"></span></td><td>${esc(p.name)}${p.id === c.you && p.name !== "You" ? " (you)" : ""}</td><td class="num">${p.owned}</td><td class="num">${p.carried.toLocaleString("en-AU")}</td><td class="num">${money(p.money)}</td></tr>`
            )
            .join("")}</tbody>
        </table>
        <div class="row">
          ${c.local ? `<button class="btn primary" data-act="restart">Play again</button>` : c.host ? `<button class="btn primary" data-act="rematch">Back to the lobby</button>` : `<span class="waiting">Waiting for the host to start the next round…</span>`}
          ${c.local || c.host ? `<button class="btn" data-act="exit">Main menu</button>` : `<button class="btn ghost" data-act="exit">Leave the room</button>`}
          <button class="btn ghost" data-act="close-overlay">Look at the map</button>
        </div>
        ${c.daily && me ? `<div class="daily-end"><h3>Daily challenge · ${esc(dailyDateLabel(c.daily))}</h3><div id="daily-board"><p class="muted">Saving your score…</p></div></div>` : ""}
      </div>`;
}

/** World Tour result: unlock the next city on a win. */
export function tourEnd(stop: number, won: boolean, replay: boolean, stars: number, winShare: number): string {
  const next = stop + 1 < TOUR.length ? stopName(stop + 1) : "";
  if (!won)
    return `<div class="tour-end"><b>World Tour: ${esc(stopName(stop))}</b><p>${
      replay ? "You've beaten this city before. Press Play again for a rematch." : `Win here to unlock ${next ? esc(next) : "the title"}. Press Play again to have another go.`
    }</p></div>`;
  const how =
    stars < 2
      ? `Own ${Math.round(winShare * 100)}% of the track before time runs out for ★★.`
      : stars < 3
        ? `Do it before ${mmss(STAR_MINUTES)} on the clock for ★★★.`
        : "Perfect!";
  return `<div class="tour-end won"><b>🎉 ${esc(stopName(stop))} won!</b><div class="stars" aria-label="${stars} of 3 stars">${starText(stars)}</div><p class="muted small">${how}</p>${
    next ? `<p>Next stop: ${esc(next)}</p><button class="btn primary" data-act="tour-next">Fly to ${esc(next)} ✈️</button>` : "<p>You've won every city on the World Tour. World champion! 🏆</p>"
  }</div>`;
}

/** One piece of advice for next time, based on how the round went. */
export function endTip(s: Snapshot, me: PlayerView, won: boolean): string {
  const mine = s.lines.filter((l) => l.owner === me.id);
  const trains = mine.reduce((a, l) => a + l.trains, 0);
  const skill = s.settings.botSkill;
  if (won) return skill < 3 ? `Great win! Try ${ruleLabel("botSkill", skill + 1)} bots next time.` : "You beat the hard bots. Try the daily challenge, or a world city!";
  if (me.money > 3000) return `You finished with ${money(me.money)} unspent. Money in the bank doesn't win passengers: buy more trains and open more track.`;
  if (me.owned < 4) return "Open track early. Every section you own earns you fees when rivals use it, and counts towards the win.";
  if (mine.length && trains / mine.length < 2.5) return "Your lines had few trains, so rivals could win your passengers. Two or three trains per line keeps them loyal.";
  return "When a 'Nobody boarded your train' warning pops up, tap it and defend: lower that line's fare or add trains.";
}

/** Submit today's score, then show the leaderboard in the end card (unless it's gone by then). */
export async function sendDaily(overlay: HTMLElement, date: string, name: string, score: number, gone: () => boolean) {
  const board = await submitScore(date, name, score);
  const host = overlay.querySelector("#daily-board");
  if (!host || gone()) return;
  const head = `<p><b>Your score: ${esc(dailyLabel(score))}</b>${board && typeof board !== "string" && board.rank ? ` · rank ${board.rank}` : ""}</p>`;
  host.innerHTML = head + (typeof board === "string" ? `<p class="muted">${esc(board)}</p>` : boardHtml(board));
}

/** Track owned over the round, one line per company, drawn to scale. */
export function historyChart(s: Snapshot): string {
  const h = s.history;
  if (!h || h.length < 2) return "";
  // labels sit outside the plot so lines never cross them: title above, "win" to the right
  const W = 460, H = 160, L = 30, B = 22, T = 22, R = 34;
  const tMax = h[h.length - 1].t || 1;
  const need = winNeed(s.totalSections, s.settings.winShare);
  const yMax = Math.max(4, need, ...h.flatMap((x) => x.owned));
  const X = (t: number) => L + (t / tMax) * (W - L - R);
  const Y = (v: number) => T + (1 - v / yMax) * (H - T - B);
  let out = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Track owned by each company over the round">`;
  for (const v of [0, Math.round(yMax / 2), yMax]) out += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d9d5cc"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  out += `<line x1="${L}" x2="${W - R}" y1="${Y(need)}" y2="${Y(need)}" stroke="#1e2430" stroke-dasharray="4 4"/><text x="${W - R + 4}" y="${Y(need) + 4}" text-anchor="start">win</text>`;
  out += `<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">time →</text><text x="${L}" y="12" text-anchor="start">track owned</text>`;
  s.players.forEach((p, i) => {
    const d = h.map((x, k) => `${k ? "L" : "M"}${X(x.t).toFixed(1)},${Y(x.owned[i] ?? 0).toFixed(1)}`).join("");
    out += `<path d="${d}" fill="none" stroke="${CSS_COLORS[p.color]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
  });
  return out + "</svg>";
}
