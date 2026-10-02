import type { Snapshot, PlayerView, StationId } from "../../sim";
import { ruleLabel } from "../../sim/types";
import { COLOR_NAMES, esc } from "../util";
import { BOT_TIPS } from "../../shared/protocol";
import { stopName, TOUR } from "../tour";
import { dailyChallenge } from "../../shared/daily";

// The cards shown over the map before the clock starts. Each returns the card's inner HTML;
// the game screen wraps it and adds the "Let's go" button.

/** First game: who you are and the three steps to get going. */
export function welcomeHtml(me: PlayerView, hub: string, emptyToCapture: number): string {
  return `
        <img class="end-badge" src="/sprites/badge-${me.color}.webp" alt="">
        <h2>Welcome to Metro Empire</h2>
        <p>You're the <b>${COLOR_NAMES[me.color]}</b> train company, starting at <b>${esc(hub)}</b>. Three steps to get going:</p>
        <ol class="how">
          <li><b>Open track.</b> Tap a pulsing section next to ${esc(hub)} and press <b>Open</b>.</li>
          <li><b>Run a line.</b> Press <b>New line</b> and tap stations along your track. Passengers start riding.</li>
          <li><b>Steal track.</b> Run your trains onto a rival's line, charge less and add trains. When nobody boards their train ${emptyToCapture} times in a row, it's yours.</li>
        </ol>`;
}

/** Today's challenge: the twist, the rivals and how the leaderboard ranks you. */
export function dailyIntroHtml(s: Snapshot, date: string, stationName: (id: StationId) => string): string {
  const c = dailyChallenge(date);
  const rivals = s.players.filter((p) => p.isBot);
  const me = s.players.find((p) => !p.isBot);
  return `
        <h2>📅 Daily challenge</h2>
        <p class="twist"><b>${esc(c.twist)}</b></p>
        <ul class="rivals">${me ? `<li><img src="/sprites/badge-${me.color}.webp" alt=""><b>You</b> at ${esc(stationName(me.hub))}</li>` : ""}${rivals.map((p) => `<li><img src="/sprites/badge-${p.color}.webp" alt=""><b>${esc(p.name)}</b> at ${esc(stationName(p.hub))}</li>`).join("")}</ul>
        <p>Everyone gets the same start today. Win as fast as you can: the fastest win tops the leaderboard (if nobody wins, the most track does).</p>`;
}

/** Arriving in a World Tour city: who you're up against, before the clock starts. */
export function tourIntroHtml(s: Snapshot, stop: number, stationName: (id: StationId) => string): string {
  const rivals = s.players.filter((p) => p.isBot);
  const me = s.players.find((p) => !p.isBot);
  return `
        <h2>✈️ Welcome to ${esc(stopName(stop))}</h2>
        <p>World Tour, city ${stop + 1} of ${TOUR.length} · ${esc(ruleLabel("botSkill", s.settings.botSkill))} bots</p>
        <ul class="rivals">${me ? `<li><img src="/sprites/badge-${me.color}.webp" alt=""><b>You</b> at ${esc(stationName(me.hub))}</li>` : ""}${rivals
          .map((p) => `<li><img src="/sprites/badge-${p.color}.webp" alt=""><b>${esc(p.name)}</b> at ${esc(stationName(p.hub))}${p.botStyle ? ` <span class="muted">· ${esc(BOT_TIPS[p.botStyle])}</span>` : ""}</li>`)
          .join("")}</ul>
        <p>Own ${Math.round(s.settings.winShare * 100)}% of the track to win, or own the most when the ${Math.round(s.settings.roundMinutes / 60)} minutes are up.</p>`;
}
