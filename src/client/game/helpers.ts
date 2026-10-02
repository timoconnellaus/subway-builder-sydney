import type { LineView, Snapshot } from "../../sim";
import { isNarrow } from "../util";

// Small helpers shared by the game screen: toasts, costs, little bits of HTML, and the help card.

export const maxToasts = () => (isNarrow() ? 2 : 3);

/** Show a toast at the top of a stack, keep at most `max`, and fade it out after `ms`. */
export function pushToast(stack: HTMLElement, t: HTMLElement, max: number, ms: number) {
  stack.prepend(t);
  while (stack.children.length > max) stack.lastChild?.remove();
  setTimeout(() => t.classList.add("out"), ms);
  setTimeout(() => t.remove(), ms + 600);
}

/** Cost of one more train on a line (its cars and speed). */
export function lineTrainCost(s: Snapshot, l: LineView) {
  return trainCost(s, l.cars) + (l.speed - 1) * s.settings.speedCost;
}

export function trainCost(s: Snapshot, cars: number) {
  return s.settings.trainBaseCost + s.settings.carCost * cars;
}
export function openCost(s: Snapshot, minutes: number, owned = 0) {
  return Math.round(s.settings.openBaseCost + s.settings.openCostPerMinute * minutes + s.settings.openCostPerOwned * owned);
}
export function dots(run: number, need: number, color: string) {
  let out = '<span class="dots">';
  for (let i = 0; i < need; i++) out += `<i class="${i < run ? "on" : ""}" style="--c:${color}"></i>`;
  return out + "</span>";
}
export function compact(n: number) {
  return n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export const HELP_HTML = `
  <h2>How to play</h2>
  <ol class="how">
    <li><b>Open track.</b> Tap a dotted section next to your hub and press Open. It's yours.</li>
    <li><b>Run trains.</b> Press New line and tap stations along opened track. Passengers start riding and paying fares.</li>
    <li><b>Grow.</b> Open more track, extend your lines, and add trains where they're full.</li>
    <li><b>Fight.</b> You can run trains on a rival's track (you pay them a small fee). Passengers wait for a cheaper train if it's coming soon and has room: <b>1 minute for every 50 cents</b> they save.</li>
    <li><b>Capture.</b> When nobody boards the owner's train on a section 3 times in a row (because they all took yours), the section is yours.</li>
    <li><b>Win.</b> Own 60% of the network, or own the most track when time runs out.</li>
    <li><b>Home hubs.</b> Only you can open the track touching your hub, and you can always start a line there, even if rivals have taken all your track.</li>
  </ol>
  <p class="muted small">Passengers pick routes by fare plus time (50 cents a minute), and changing trains costs them 4 minutes.</p>
  <p class="muted small">Keys: <b>N</b> new line · <b>Space</b> pause · <b>1 2 3</b> speed · <b>+ −</b> zoom · arrows move · <b>H</b> home · <b>Esc</b> cancel</p>`;
