import "./styles.css";
import { HOUSE_RULES, ruleLabel, type BotStyle, type HouseRuleKey, type HouseRules } from "../sim/types";
import { DEFAULT_SETTINGS } from "../sim/types";
import { BOT_NAMES, BOT_TIPS, botSeats, cleanPlayerName, isRoomCode, minRoundFor, ROUND_CHOICES, SLOTS, type LobbyState } from "../shared/protocol";
import qrcode from "qrcode-generator";
import { MAP_CHOICES, MAPS, stationName } from "../sim";
import { clearLocalSave, LocalGame, RemoteRoom, savedLocalGame, type LocalOptions } from "./conn";
import { ACHIEVEMENTS, unlocked } from "./achievements";
import { boardHtml, fetchBoard, localBest } from "./daily";
import { starText, stopName, TOUR, TOUR_MINUTES, tourBest, tourCity, tourProgress, tourStars } from "./tour";
import { dailyChallenge, dailyDateLabel, dailyLabel, mmss, sydneyDate, type DailyChallenge } from "../shared/daily";
import { GameScreen } from "./game/screen";
import { HELP_HTML } from "./game/helpers";
import { COLOR_BLIND, COLOR_NAMES, CSS_COLORS, esc, patch, readRecord, setStorage, storage, token } from "./util";

const app = document.getElementById("app")!;
let cleanup: (() => void) | null = null;

function route() {
  cleanup?.();
  cleanup = null;
  app.innerHTML = "";
  const hash = location.hash.replace(/^#\/?/, "");
  const [page, arg] = hash.split("/");
  if (page === "play") {
    // a bare #/play resumes a saved game (reload, Back button); Play and the daily challenge ask for a fresh one
    const fresh = storage("new-game");
    setStorage("new-game", "");
    if (fresh === "daily") return playLocal(new LocalGame(dailyOptions()));
    if (fresh === "tour") return playLocal(new LocalGame(tourOptions(Number(storage("tour-stop")) || 0)));
    const saved = fresh ? null : savedLocalGame();
    return playLocal(saved ? new LocalGame(saved.opts, saved.state) : new LocalGame(menuOptions()));
  }
  if (page === "tutorial") return playTutorial();
  if (page === "watch") return watchBots();
  if (page === "room" && arg && isRoomCode(arg.toUpperCase())) return online(arg.toUpperCase());
  return menu();
}
window.addEventListener("hashchange", route);

// offline play once loaded (production builds only; the dev server serves files fresh)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    // hand the worker what this page loaded before it took charge, so the first visit is enough for
    // offline play (once in charge, it caches everything else as it's fetched)
    navigator.serviceWorker.ready.then((reg) =>
      reg.active?.postMessage({ cache: [location.origin + "/", ...performance.getEntriesByType("resource").map((r) => r.name)] })
    );
  });
}

function loadRules(): HouseRules {
  try {
    return JSON.parse(storage("rules", "{}")) as HouseRules;
  } catch {
    return {};
  }
}

/** New players start against easy bots until they've won a game. */
const defaultSkill = () => (readRecord().wins > 0 ? 2 : 1);

/** Saved house rules with the bot skill filled in. */
function effectiveRules(): HouseRules {
  const r = loadRules();
  r.botSkill ??= defaultSkill();
  return r;
}

/** Selects for the house rules. Unset rules show the default. */
const RULE_KEYS = Object.keys(HOUSE_RULES) as HouseRuleKey[];
const BOT_STYLES = Object.keys(BOT_NAMES) as BotStyle[];
// bot skill sits next to the bots, outside the house rules
const OTHER_RULES = RULE_KEYS.filter((k) => k !== "botSkill");

function rulesHtml(rules: HouseRules, disabled = false, keys = RULE_KEYS): string {
  return keys
    .map((k) => {
      const r = HOUSE_RULES[k];
      const cur = rules[k] ?? (DEFAULT_SETTINGS[k] as number);
      return `<label class="field inline rule"><span>${r.label}</span><select data-rule="${k}" ${disabled ? "disabled" : ""}>${(r.values as readonly number[])
        .map((v) => `<option value="${v}" ${v === cur ? "selected" : ""}>${ruleLabel(k, v)}${v === DEFAULT_SETTINGS[k] && ruleLabel(k, v) !== "Normal" ? " (normal)" : ""}</option>`)
        .join("")}</select></label>`;
    })
    .join("");
}

function readRules(root: HTMLElement): HouseRules {
  const out: HouseRules = {};
  root.querySelectorAll<HTMLSelectElement>("select[data-rule]").forEach((sel) => (out[sel.dataset.rule as HouseRuleKey] = Number(sel.value)));
  return out;
}

function achievementsHtml(): string {
  const have = unlocked();
  return `<section class="menu-sec trophies"><h2>Achievements <span class="muted small">${have.size} of ${ACHIEVEMENTS.length}</span></h2>
    <div class="badges">${ACHIEVEMENTS.map((a) => `<div class="ach ${have.has(a.id) ? "on" : ""}" title="${esc(a.name)}: ${esc(a.how)}"><span class="e">${have.has(a.id) ? a.emoji : "🔒"}</span><span class="n">${esc(a.name)}</span><span class="h">${esc(a.how)}</span></div>`).join("")}</div></section>`;
}

/** Your starting hub (and colour) on a map; the bots take the other seats. */
function seatOptions(mapId: string, current: number): string {
  const map = MAPS[mapId] ?? MAPS.sydney;
  return SLOTS.map((slot, i) => `<option value="${i}" ${i === current ? "selected" : ""}>${esc(stationName(map, map.hubs[i]))} (${COLOR_NAMES[slot.color]})</option>`).join("");
}

function mapOptions(current: string): string {
  return (["Australia", "World"] as const)
    .map(
      (region) =>
        `<optgroup label="${region}">${MAP_CHOICES.filter((m) => m.region === region)
          .map((m) => `<option value="${m.id}" ${m.id === current ? "selected" : ""}>${m.flag} ${esc(m.name)} (${esc(m.blurb)})</option>`)
          .join("")}</optgroup>`
    )
    .join("");
}

function recordLine(): string {
  const r = readRecord();
  if (!r.played) return "";
  return `<p class="record">Your record: <b>${r.wins}</b> ${r.wins === 1 ? "win" : "wins"} from <b>${r.played}</b> ${r.played === 1 ? "game" : "games"} · best <b>${r.best.toLocaleString("en-AU")}</b> passengers</p>`;
}

function roundOptions(current: number): string {
  return ROUND_CHOICES.map((m) => `<option value="${m}" ${m === current ? "selected" : ""}>${m / 60} minutes</option>`).join("");
}

function qrSvg(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

function go(hash: string) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

// ---------- menu ----------
function menu() {
  const name = storage("me-name", "");
  const menuRules = effectiveRules();
  const saved = savedLocalGame();
  const challenge = dailyChallenge(sydneyDate());
  // new players see the World Tour (easy bots first) before the daily challenge
  const newPlayer = tourProgress() === 0 && readRecord().wins === 0;
  const bots = storage("bots", "builder,raider").split(",").filter(Boolean) as BotStyle[];
  const minutes = storage("round", "900");
  const el = document.createElement("div");
  el.className = "menu";
  el.innerHTML = `
    <div class="menu-card">
      <img class="logo" src="/sprites/logo-full.webp" alt="Metro Empire">
      <p class="tagline">Own the city's rail network, one section at a time, from Sydney to London, Tokyo and beyond.</p>
      <label class="field"><span>Your name</span><input id="name" maxlength="16" placeholder="Your name" value="${esc(name)}" autocomplete="nickname"></label>

      ${storage("tutorial-done") !== "1" ? `<div class="newbie"><span>New to Metro Empire?</span><button class="btn primary" id="tutorial-top">Learn to play (2 minutes)</button></div>` : ""}
      ${saved ? `<button class="btn primary big" id="continue">Continue your ${saved.opts.daily ? "daily challenge" : saved.opts.tour !== undefined ? `World Tour game (${esc(stopName(saved.opts.tour))})` : "game"}</button>` : ""}
      ${newPlayer ? tourHtml() + dailyHtml(challenge) : dailyHtml(challenge) + tourHtml()}
      <section class="menu-sec bots-sec">
        <h2>Play against bots</h2>
        <div class="bots">
          ${BOT_STYLES
            .map(
              (b, i) => `<label class="bot-opt"><input type="checkbox" value="${b}" ${bots.includes(b) ? "checked" : ""}>
              <img src="/sprites/badge-${SLOTS[i + 1].color}.webp" alt=""><span><b>${BOT_NAMES[b]}</b>
              <small>${BOT_TIPS[b]}</small></span></label>`
            )
            .join("")}
        </div>
        ${recordLine()}
        <label class="field inline"><span>Map</span>
          <select id="map">${mapOptions(storage("map", "sydney"))}</select>
        </label>
        <label class="field inline"><span>Start at</span>
          <select id="seat">${seatOptions(storage("map", "sydney"), Number(storage("seat", "0")) || 0)}</select>
        </label>
        <label class="field inline"><span>Round length</span>
          <select id="round">${roundOptions(Number(minutes))}</select>
        </label>
        ${rulesHtml(menuRules, false, ["botSkill"])}
        <details class="rules"><summary>House rules</summary><div class="rules-grid">${rulesHtml(menuRules, false, OTHER_RULES)}</div></details>
        <button class="btn primary big" id="play">Play</button>
      </section>

      <section class="menu-sec">
        <h2>Play online</h2>
        <p class="muted">Start a room and send the link to friends. Bots can fill empty seats.</p>
        <div class="row">
          <button class="btn primary" id="create">Create a room</button>
          <input id="code" class="code-in" maxlength="4" placeholder="CODE" autocomplete="off" aria-label="Room code">
          <button class="btn" id="join">Join</button>
        </div>
        <p class="error" id="online-err" hidden></p>
      </section>

      ${storage("last-room") ? `<button class="btn" id="rejoin">Rejoin room ${esc(storage("last-room"))}</button>` : ""}
      ${achievementsHtml()}
      <label class="cb-opt"><input type="checkbox" id="cb" ${COLOR_BLIND ? "checked" : ""}> Colour-blind friendly colours</label>
      <div class="row center"><button class="btn" id="tutorial">Learn to play (2 minutes)</button><button class="btn" id="watch">Watch the bots</button><button class="link" id="how">How to play</button></div>
    </div>`;
  app.append(el);
  const nameIn = el.querySelector<HTMLInputElement>("#name")!;
  // the rules to remember; bot skill only once picked, so the easy-until-you-win default can move up
  // the hub list follows the map
  const seatSel = el.querySelector<HTMLSelectElement>("#seat")!;
  // bot badges show the colour each ticked bot will actually play: the seats you didn't take, in order
  const botBadges = () => {
    const boxes = [...el.querySelectorAll<HTMLInputElement>(".bot-opt input")];
    const seats = botSeats(Number(seatSel.value), boxes.length);
    let k = 0;
    boxes.forEach((box) => {
      const img = box.parentElement!.querySelector("img")!;
      const seat = box.checked ? seats[k++] : undefined;
      img.style.opacity = seat === undefined ? "0.35" : "1";
      if (seat !== undefined) img.src = `/sprites/badge-${SLOTS[seat].color}.webp`;
    });
  };
  seatSel.addEventListener("change", botBadges);
  el.querySelectorAll(".bot-opt input").forEach((box) => box.addEventListener("change", botBadges));
  botBadges();
  el.querySelector<HTMLSelectElement>("#map")!.addEventListener("change", (e) => {
    seatSel.innerHTML = seatOptions((e.target as HTMLSelectElement).value, Number(seatSel.value) || 0);
  });
  let skillPicked = loadRules().botSkill !== undefined;
  el.querySelector('select[data-rule="botSkill"]')!.addEventListener("change", () => (skillPicked = true));
  const chosenRules = (): HouseRules => {
    const r = readRules(el.querySelector(".bots-sec")!);
    if (!skillPicked) delete r.botSkill;
    return r;
  };
  const saveName = () => setStorage("me-name", nameIn.value.trim());
  nameIn.addEventListener("change", saveName);
  el.querySelector("#continue")?.addEventListener("click", () => go("#/play"));
  el.querySelector("#daily")!.addEventListener("click", () => {
    if (!cleanPlayerName(nameIn.value)) {
      // the leaderboard needs a name
      nameIn.classList.add("need");
      nameIn.placeholder = "Your name";
      const err = el.querySelector<HTMLElement>("#daily-err")!;
      err.hidden = false;
      err.textContent = "Type your name at the top first (letters or numbers), so you can go on the leaderboard.";
      nameIn.scrollIntoView({ block: "center", behavior: "smooth" });
      nameIn.focus();
      return;
    }
    saveName();
    startFresh("daily");
  });
  el.querySelectorAll<HTMLButtonElement>("[data-tour]").forEach((b) =>
    b.addEventListener("click", () => {
      saveName();
      playTour(Number(b.dataset.tour));
    })
  );
  fetchBoard(challenge.date).then((b) => {
    const host = el.querySelector("#daily-top");
    if (host && b) host.innerHTML = boardHtml(b, 3);
  });
  el.querySelector("#play")!.addEventListener("click", () => {
    saveName();
    const chosen = [...el.querySelectorAll<HTMLInputElement>(".bot-opt input:checked")].map((i) => i.value);
    setStorage("bots", (chosen.length ? chosen : ["builder"]).join(","));
    setStorage("round", el.querySelector<HTMLSelectElement>("#round")!.value);
    setStorage("map", el.querySelector<HTMLSelectElement>("#map")!.value);
    setStorage("seat", el.querySelector<HTMLSelectElement>("#seat")!.value);
    setStorage("rules", JSON.stringify(chosenRules()));
    startFresh("menu");
  });
  const err = el.querySelector<HTMLElement>("#online-err")!;
  el.querySelector("#create")!.addEventListener("click", async () => {
    saveName();
    try {
      const r = await fetch("/api/rooms", { method: "POST" });
      if (!r.ok) throw new Error();
      const { code } = await r.json();
      setStorage("rules", JSON.stringify(chosenRules()));
      setStorage("map", el.querySelector<HTMLSelectElement>("#map")!.value);
      go(`#/room/${code}`);
    } catch {
      err.hidden = false;
      err.textContent = "Couldn't reach the game server. Online play needs the Cloudflare server running.";
    }
  });
  const codeIn = el.querySelector<HTMLInputElement>("#code")!;
  codeIn.addEventListener("input", () => (codeIn.value = codeIn.value.toUpperCase().replace(/[^A-Z]/g, "")));
  const join = () => {
    saveName();
    if (isRoomCode(codeIn.value)) go(`#/room/${codeIn.value}`);
    else {
      err.hidden = false;
      err.textContent = "Room codes are four letters.";
    }
  };
  el.querySelector("#join")!.addEventListener("click", join);
  codeIn.addEventListener("keydown", (e) => e.key === "Enter" && join());
  el.querySelector("#rejoin")?.addEventListener("click", () => go(`#/room/${storage("last-room")}`));
  const startTutorial = () => {
    saveName();
    setStorage("seen-intro", "1");
    setStorage("tutorial-done", "1");
    go("#/tutorial");
  };
  el.querySelector("#tutorial")!.addEventListener("click", startTutorial);
  el.querySelector("#watch")!.addEventListener("click", () => go("#/watch"));
  el.querySelector<HTMLInputElement>("#cb")!.addEventListener("change", (e) => {
    setStorage("color-blind", (e.target as HTMLInputElement).checked ? "1" : "");
    location.reload(); // colours are read once at start-up
  });
  el.querySelector("#tutorial-top")?.addEventListener("click", startTutorial);
  el.querySelector("#how")!.addEventListener("click", () => {
    const ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML = `<div class="card help">${HELP_HTML}<div class="row"><button class="btn primary">Got it</button></div></div>`;
    ov.querySelector("button")!.addEventListener("click", () => ov.remove());
    el.append(ov);
  });
}

/** Start a new single-player game, dropping any saved one. */
function startFresh(kind: "menu" | "daily" | "tour") {
  clearLocalSave();
  setStorage("new-game", kind);
  go("#/play");
}

function dailyHtml(c: DailyChallenge): string {
  const hub = stationName(MAPS[c.map], MAPS[c.map].hubs[c.slot]);
  const best = localBest(c.date);
  return `<section class="menu-sec daily">
    <h2>Daily challenge <small class="muted">${dailyDateLabel(c.date)}</small></h2>
    <p class="twist">${esc(c.twist)}</p>
    <p class="muted">You start at <b>${esc(hub)}</b> against ${c.bots.map((b) => BOT_NAMES[b]).join(", ")} on the ${esc(MAPS[c.map].name)} map. ${c.roundMinutes / 60} minutes. Win as fast as you can!</p>
    ${best !== null ? `<p>Your best today: <b>${esc(dailyLabel(best))}</b></p>` : ""}
    <div id="daily-top"></div>
    <p class="error" id="daily-err" hidden></p>
    <button class="btn primary big" id="daily">Play today's challenge</button>
  </section>`;
}

// ---------- single player ----------
const playerName = () => storage("me-name", "") || "You";

/** A game set up from the menu choices. */
function menuOptions(): LocalOptions {
  const bots = storage("bots", "builder,raider").split(",").filter(Boolean) as BotStyle[];
  return {
    name: playerName(),
    bots: bots.slice(0, 3),
    roundMinutes: Number(storage("round", "900")) || 900,
    rules: effectiveRules(),
    map: storage("map", "sydney"),
    slot: Number(storage("seat", "0")) || 0
  };
}

/** A World Tour stop as an ordinary game. */
function tourOptions(stop: number): LocalOptions {
  const i = Math.max(0, Math.min(stop, TOUR.length - 1));
  const t = TOUR[i];
  return { name: playerName(), bots: t.bots, roundMinutes: TOUR_MINUTES, rules: { botSkill: t.skill }, map: t.map, tour: i };
}

function playTour(stop: number) {
  setStorage("tour-stop", String(stop));
  startFresh("tour");
}

function tourHtml(): string {
  const done = tourProgress();
  const stamps = TOUR.map((t, i) => {
    const m = tourCity(i);
    const best = tourBest(i);
    const state = i < done ? "done" : i === done ? "next" : "locked";
    return `<button class="stamp ${state}" data-tour="${i}" ${state === "locked" ? "disabled" : ""} title="${esc(m.name)}">
      <span class="flag">${state === "locked" ? "🔒" : m.flag}</span><span class="nm">${esc(m.name)}</span>
      <span class="st">${state === "done" ? `<span class="stars">${starText(tourStars(i))}</span> ${best ? mmss(best) : ""}` : state === "next" ? "play" : ruleLabel("botSkill", t.skill)}</span></button>`;
  }).join("");
  const stars = TOUR.reduce((a, _, i) => a + tourStars(i), 0);
  const head = done >= TOUR.length ? `You've won every city. World champion! ${stars} of ${TOUR.length * 3} stars.` : done ? `${done} of ${TOUR.length} cities won · ${stars} of ${TOUR.length * 3} ★. Next stop: ${stopName(done)}.` : "Win a city to unlock the next. The bots get tougher as you go.";
  return `<section class="menu-sec tour"><h2>World Tour</h2><p class="muted">${head}</p><div class="stamps">${stamps}</div></section>`;
}

/** Today's daily challenge as an ordinary game with a fixed seat and seed. */
function dailyOptions(): LocalOptions {
  const c = dailyChallenge(sydneyDate());
  return { name: playerName(), bots: c.bots, roundMinutes: c.roundMinutes, rules: c.rules, map: c.map, slot: c.slot, seed: c.seed, daily: c.date };
}

function playLocal(conn: LocalGame) {
  let screen: GameScreen;
  const mount = () => {
    screen = new GameScreen(conn, {
      onExit: () => go("#/"),
      onRestart: () => {
        screen.destroy();
        conn.restart();
        mount();
      },
      onTourNext: () => playTour((conn.tour ?? 0) + 1)
    });
    app.append(screen.el);
  };
  mount();
  cleanup = () => {
    screen.destroy();
    conn.close();
  };
}

function watchBots() {
  const conn = new LocalGame({ name: "", bots: ["builder", "raider", "banker"], roundMinutes: 900, rules: {}, map: storage("map", "sydney"), watch: true });
  conn.setSpeed(2);
  playLocal(conn);
}

function playTutorial() {
  playLocal(new LocalGame({ name: playerName(), bots: [], roundMinutes: 3600, rules: {}, tutorial: true }));
}

// ---------- online ----------
function online(code: string) {
  const name = storage("me-name", "") || "Player";
  setStorage("last-room", code);
  const room = new RemoteRoom(code, name, token());
  const wrap = document.createElement("div");
  wrap.className = "online";
  app.append(wrap);
  let screen: GameScreen | null = null;
  let lobbyEl: HTMLElement | null = null;
  let message = "";

  const showLobby = (l: LobbyState) => {
    screen?.destroy();
    screen = null;
    if (!lobbyEl) {
      lobbyEl = document.createElement("div");
      lobbyEl.className = "menu";
      lobbyEl.addEventListener("click", onLobbyClick);
      wrap.append(lobbyEl);
    }
    patch(lobbyEl, lobbyHtml(l));
  };
  const showGame = () => {
    if (screen) return;
    lobbyEl?.remove();
    lobbyEl = null;
    screen = new GameScreen(room, {
      onExit: () => go("#/"),
      onRematch: () => room.send({ t: "rematch" }),
      isHost: () => room.lobby?.host === room.you
    });
    wrap.append(screen.el);
  };

  // the invite link and its QR code never change for this room
  const link = `${location.origin}/#/room/${code}`;
  const qr = qrSvg(link);
  const lobbyHtml = (l: LobbyState) => {
    const isHost = l.host === room.you;
    const map = MAPS[l.options.map] ?? MAPS.sydney;
    const slots = SLOTS.map((slot, i) => {
      const p = l.players.find((x) => x.color === slot.color);
      const hubName = stationName(map, map.hubs[i]);
      const bonus = map.hubBonus?.[map.hubs[i]] ?? 0;
      const bonusText = bonus ? ` · +$${bonus.toLocaleString("en-AU")} to start` : "";
      const won = p ? l.wins?.[p.id] ?? 0 : 0;
      if (p)
        return `<div class="slot" data-key="s${i}" style="--c:${CSS_COLORS[slot.color]}"><img src="/sprites/badge-${slot.color}.webp" alt=""><div><b>${esc(p.name)}${p.id === room.you ? " (you)" : ""}${l.rounds ? ` · ${won} ${won === 1 ? "win" : "wins"}` : ""}</b><small>${[
          `${COLOR_NAMES[slot.color]} · starts at ${hubName}${bonusText}`,
          p.id === l.host && "host",
          p.isBot && ruleLabel("botSkill", l.options.rules.botSkill ?? DEFAULT_SETTINGS.botSkill),
          !p.connected && !p.isBot && "away"
        ].filter(Boolean).join(" · ")}</small></div>${isHost && p.id !== room.you ? `<button class="link" data-act="kick" data-arg="${p.id}">Remove</button>` : ""}</div>`;
      return `<div class="slot empty" data-key="s${i}" style="--c:${CSS_COLORS[slot.color]}"><img src="/sprites/badge-${slot.color}.webp" alt=""><div><b>Empty seat</b><small>${COLOR_NAMES[slot.color]} · starts at ${hubName}${bonusText}</small></div>
        <div class="slot-actions">${l.phase === "lobby" && l.players.some((x) => x.id === room.you) ? `<button class="link" data-act="slot" data-arg="${i}">Sit here</button>` : ""}
        ${isHost ? BOT_STYLES.map((b) => `<button class="link" data-act="bot" data-arg="${b}" data-slot="${i}" title="${BOT_TIPS[b]}">+ ${BOT_NAMES[b].replace("The ", "")}</button>`).join("") : ""}</div></div>`;
    }).join("");
    return `<div class="menu-card lobby">
      <img class="logo small" src="/sprites/logo-full.webp" alt="Metro Empire">
      <div class="room-code"><span class="muted">Room</span><b class="mono">${l.room}</b></div>
      <div class="share-wrap">
        <div class="qr" title="Scan to join on a phone or tablet">${qr}</div>
        <div class="share-text"><p class="muted small">Send this link, or scan the code on a phone or iPad.</p>
        <div class="share"><input readonly value="${esc(link)}" aria-label="Invite link"><button class="btn" data-act="copy">Copy link</button></div></div>
      </div>
      ${isHost ? "" : `<p class="waiting">Waiting for the host to start…</p>`}
      <div class="slots">${slots}</div>
      ${isHost ? rulesHtml(l.options.rules, false, ["botSkill"]) : ""}
      ${l.players.some((p) => p.id === room.you) ? `<label class="field inline"><span>Your name</span><input id="lobby-name" maxlength="16" placeholder="Type your name" value="${storage("me-name", "") ? esc(l.players.find((p) => p.id === room.you)!.name) : ""}" autocomplete="nickname"></label>` : ""}
      <label class="field inline"><span>Map</span>
        <select id="map" ${isHost ? "" : "disabled"}>${mapOptions(l.options.map ?? "sydney")}</select>
      </label>
      <label class="field inline"><span>Round length</span>
        <select id="round" ${isHost ? "" : "disabled"} data-act-change="round">${roundOptions(l.options.roundMinutes)}</select>
      </label>
      ${l.options.roundMinutes < minRoundFor(l.options.map) ? `<p class="muted small">Bigger maps need 10 minutes or more for a real fight.</p>` : ""}
      <details class="rules"><summary>House rules${isHost ? "" : " (set by the host)"}</summary><div class="rules-grid">${rulesHtml(l.options.rules, !isHost, isHost ? OTHER_RULES : RULE_KEYS)}</div></details>
      ${message ? `<p class="error">${esc(message)}</p>` : ""}
      <div class="row">
        ${isHost ? `<button class="btn primary big" data-act="start" ${l.players.length < 2 ? "disabled" : ""}>Start game</button>` : ""}
        <button class="btn ghost" data-act="leave">Leave</button>
      </div>
      ${room.status !== "open" ? `<p class="muted small">Connecting…</p>` : ""}
    </div>`;
  };

  function onLobbyClick(e: Event) {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
    if (!b) return;
    const arg = b.dataset.arg ?? "";
    switch (b.dataset.act) {
      case "bot":
        room.send({ t: "addBot", style: arg as BotStyle, slot: Number(b.dataset.slot) });
        break;
      case "kick":
        room.send({ t: "removePlayer", id: arg });
        break;
      case "slot":
        room.send({ t: "setSlot", slot: Number(arg) });
        break;
      case "start":
        room.send({ t: "start" });
        break;
      case "leave":
        go("#/");
        break;
      case "copy": {
        const input = lobbyEl?.querySelector<HTMLInputElement>(".share input");
        if (!input) break;
        navigator.clipboard?.writeText(input.value).then(
          () => (b.textContent = "Copied!"),
          () => input.select()
        );
        break;
      }
    }
  }
  // names go out as they're typed, a moment after the last key
  let nameTimer = 0;
  const sendName = (value: string) => {
    clearTimeout(nameTimer);
    const name = cleanPlayerName(value);
    if (!name || name === room.lobby?.players.find((p) => p.id === room.you)?.name) return;
    setStorage("me-name", name);
    room.setName(name);
  };
  wrap.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id !== "lobby-name") return;
    clearTimeout(nameTimer);
    nameTimer = window.setTimeout(() => sendName(t.value), 400);
  });
  wrap.addEventListener("change", (e) => {
    const t = e.target as HTMLSelectElement;
    if (t.id === "lobby-name") sendName(t.value);
    if (t.id === "round") room.send({ t: "setOptions", options: { roundMinutes: Number(t.value) } });
    if (t.id === "map") {
      setStorage("map", t.value);
      room.send({ t: "setOptions", options: { map: t.value } });
    }
    if (t.dataset.rule && room.lobby) {
      const rules = { ...room.lobby.options.rules, [t.dataset.rule]: Number(t.value) };
      setStorage("rules", JSON.stringify(rules));
      room.send({ t: "setOptions", options: { rules } });
    }
  });

  let rulesSent = false;
  let wasIn = false;
  const offLobby = room.onLobby((l) => {
    const inRoom = l.players.some((p) => p.id === room.you);
    if (wasIn && !inRoom && l.phase === "lobby") {
      message = "The host removed you from this room.";
      room.close();
      showLobby(l);
      return;
    }
    wasIn = inRoom;
    if (!rulesSent && l.host === room.you && l.phase === "lobby" && Object.keys(l.options.rules).length === 0) {
      rulesSent = true;
      const saved = loadRules();
      if (Object.keys(saved).length) room.send({ t: "setOptions", options: { rules: saved } });
      const savedMap = storage("map", "sydney");
      if (savedMap !== l.options.map) room.send({ t: "setOptions", options: { map: savedMap } });
    }
    if (l.phase === "lobby") showLobby(l);
    else showGame();
  });
  const offStatus = room.onStatus((status, msg) => {
    message = status === "open" ? msg ?? "" : msg ?? message;
    if (room.lobby && room.lobby.phase === "lobby") showLobby(room.lobby);
  });
  wrap.innerHTML = `<div class="menu"><div class="menu-card"><p class="muted">Joining room ${code}…</p></div></div>`;
  const clearJoining = room.onLobby(() => {
    wrap.querySelector(".menu-card:not(.lobby)")?.parentElement?.remove();
  });
  cleanup = () => {
    offLobby();
    offStatus();
    clearJoining();
    screen?.destroy();
    room.close();
  };
}

route();
