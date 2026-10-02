import "./styles.css";
import { HOUSE_RULES, type BotStyle, type HouseRuleKey, type HouseRules } from "../sim/types";
import { DEFAULT_SETTINGS } from "../sim/types";
import { isRoomCode, SLOTS, type LobbyState } from "../shared/protocol";
import { LocalGame, RemoteRoom } from "./conn";
import { GameScreen, HELP_HTML } from "./game/screen";
import { COLOR_NAMES, CSS_COLORS, esc, patch, setStorage, storage, token } from "./util";

const app = document.getElementById("app")!;
let cleanup: (() => void) | null = null;

function route() {
  cleanup?.();
  cleanup = null;
  app.innerHTML = "";
  const hash = location.hash.replace(/^#\/?/, "");
  const [page, arg] = hash.split("/");
  if (page === "play") return playLocal();
  if (page === "room" && arg && isRoomCode(arg.toUpperCase())) return online(arg.toUpperCase());
  return menu();
}
window.addEventListener("hashchange", route);

function loadRules(): HouseRules {
  try {
    return JSON.parse(storage("rules", "{}")) as HouseRules;
  } catch {
    return {};
  }
}

function ruleLabel(k: HouseRuleKey, v: number): string {
  const r = HOUSE_RULES[k] as { values: readonly number[]; format?: string; names?: readonly string[] };
  const i = r.values.indexOf(v);
  if (r.names) return r.names[i];
  if (r.format === "percent") return `${Math.round(v * 100)}%`;
  if (r.format === "money") return `$${v.toLocaleString("en-AU")}`;
  return String(v);
}

/** Selects for the house rules. Unset rules show the default. */
function rulesHtml(rules: HouseRules, disabled = false): string {
  return (Object.keys(HOUSE_RULES) as HouseRuleKey[])
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

function recordLine(): string {
  try {
    const r = JSON.parse(storage("record", "{}")) as { played?: number; wins?: number; best?: number };
    if (!r.played) return "";
    return `<p class="record">Your record: <b>${r.wins ?? 0}</b> ${r.wins === 1 ? "win" : "wins"} from <b>${r.played}</b> ${r.played === 1 ? "game" : "games"} · best <b>${(r.best ?? 0).toLocaleString("en-AU")}</b> passengers</p>`;
  } catch {
    return "";
  }
}

function go(hash: string) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

// ---------- menu ----------
function menu() {
  const name = storage("me-name", "");
  const bots = storage("bots", "builder,raider").split(",").filter(Boolean) as BotStyle[];
  const minutes = storage("round", "900");
  const el = document.createElement("div");
  el.className = "menu";
  el.innerHTML = `
    <div class="menu-card">
      <img class="logo" src="/sprites/logo-full.webp" alt="Metro Empire">
      <p class="tagline">Own Sydney's rail network, one section at a time.</p>
      <label class="field"><span>Your name</span><input id="name" maxlength="16" placeholder="Your name" value="${esc(name)}" autocomplete="nickname"></label>

      <section class="menu-sec">
        <h2>Play against bots</h2>
        <div class="bots">
          ${(["builder", "raider", "banker"] as BotStyle[])
            .map(
              (b, i) => `<label class="bot-opt"><input type="checkbox" value="${b}" ${bots.includes(b) ? "checked" : ""}>
              <img src="/sprites/badge-${SLOTS[i + 1].color}.webp" alt=""><span><b>${b === "builder" ? "The Builder" : b === "raider" ? "The Raider" : "The Banker"}</b>
              <small>${b === "builder" ? "Spreads fast, defends weakly" : b === "raider" ? "Undercuts your busiest track" : "Grabs the centre, lives off fees"}</small></span></label>`
            )
            .join("")}
        </div>
        ${recordLine()}
        <label class="field inline"><span>Round length</span>
          <select id="round">${[300, 600, 900, 1200].map((m) => `<option value="${m}" ${String(m) === minutes ? "selected" : ""}>${m / 60} minutes</option>`).join("")}</select>
        </label>
        <details class="rules"><summary>House rules</summary><div class="rules-grid">${rulesHtml(loadRules())}</div></details>
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
      <button class="link" id="how">How to play</button>
    </div>`;
  app.append(el);
  const nameIn = el.querySelector<HTMLInputElement>("#name")!;
  const saveName = () => setStorage("me-name", nameIn.value.trim());
  nameIn.addEventListener("change", saveName);
  el.querySelector("#play")!.addEventListener("click", () => {
    saveName();
    const chosen = [...el.querySelectorAll<HTMLInputElement>(".bot-opt input:checked")].map((i) => i.value);
    setStorage("bots", (chosen.length ? chosen : ["builder"]).join(","));
    setStorage("round", el.querySelector<HTMLSelectElement>("#round")!.value);
    setStorage("rules", JSON.stringify(readRules(el.querySelector(".rules")!)));
    go("#/play");
  });
  const err = el.querySelector<HTMLElement>("#online-err")!;
  el.querySelector("#create")!.addEventListener("click", async () => {
    saveName();
    try {
      const r = await fetch("/api/rooms", { method: "POST" });
      if (!r.ok) throw new Error();
      const { code } = await r.json();
      setStorage("rules", JSON.stringify(readRules(el.querySelector(".rules")!)));
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
  el.querySelector("#how")!.addEventListener("click", () => {
    const ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML = `<div class="card help">${HELP_HTML}<div class="row"><button class="btn primary">Got it</button></div></div>`;
    ov.querySelector("button")!.addEventListener("click", () => ov.remove());
    el.append(ov);
  });
}

// ---------- single player ----------
function playLocal() {
  const bots = storage("bots", "builder,raider").split(",").filter(Boolean) as BotStyle[];
  const conn = new LocalGame({
    name: storage("me-name", "") || "You",
    bots: bots.slice(0, 3),
    roundMinutes: Number(storage("round", "900")) || 900,
    rules: loadRules()
  });
  const screen = new GameScreen(conn, { onExit: () => go("#/") });
  app.append(screen.el);
  cleanup = () => {
    screen.destroy();
    conn.close();
  };
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

  const lobbyHtml = (l: LobbyState) => {
    const isHost = l.host === room.you;
    const link = `${location.origin}/#/room/${l.room}`;
    const slots = SLOTS.map((slot, i) => {
      const p = l.players.find((x) => x.color === slot.color);
      const hubName = slot.hub[0].toUpperCase() + slot.hub.slice(1);
      if (p)
        return `<div class="slot" data-key="s${i}" style="--c:${CSS_COLORS[slot.color]}"><img src="/sprites/badge-${slot.color}.webp" alt=""><div><b>${esc(p.name)}${p.id === room.you ? " (you)" : ""}</b><small>${COLOR_NAMES[slot.color]} · starts at ${hubName}${p.id === l.host ? " · host" : ""}${!p.connected && !p.isBot ? " · away" : ""}</small></div>${isHost && p.id !== room.you ? `<button class="link" data-act="kick" data-arg="${p.id}">Remove</button>` : ""}</div>`;
      return `<div class="slot empty" data-key="s${i}" style="--c:${CSS_COLORS[slot.color]}"><img src="/sprites/badge-${slot.color}.webp" alt=""><div><b>Empty seat</b><small>${COLOR_NAMES[slot.color]} · starts at ${hubName}</small></div>
        <div class="slot-actions">${l.phase === "lobby" && l.players.some((x) => x.id === room.you) ? `<button class="link" data-act="slot" data-arg="${i}">Sit here</button>` : ""}
        ${isHost ? `<button class="link" data-act="bot" data-arg="builder">+ Builder</button><button class="link" data-act="bot" data-arg="raider">+ Raider</button><button class="link" data-act="bot" data-arg="banker">+ Banker</button>` : ""}</div></div>`;
    }).join("");
    return `<div class="menu-card lobby">
      <img class="logo small" src="/sprites/logo-full.webp" alt="Metro Empire">
      <div class="room-code"><span class="muted">Room</span><b class="mono">${l.room}</b></div>
      <div class="share"><input readonly value="${esc(link)}" aria-label="Invite link"><button class="btn" data-act="copy">Copy link</button></div>
      <div class="slots">${slots}</div>
      <label class="field inline"><span>Round length</span>
        <select id="round" ${isHost ? "" : "disabled"} data-act-change="round">${[300, 600, 900, 1200].map((m) => `<option value="${m}" ${m === l.options.roundMinutes ? "selected" : ""}>${m / 60} minutes</option>`).join("")}</select>
      </label>
      <details class="rules" ${isHost ? "" : "open"}><summary>House rules${isHost ? "" : " (set by the host)"}</summary><div class="rules-grid">${rulesHtml(l.options.rules, !isHost)}</div></details>
      ${message ? `<p class="error">${esc(message)}</p>` : ""}
      <div class="row">
        ${isHost ? `<button class="btn primary big" data-act="start" ${l.players.length < 2 ? "disabled" : ""}>Start game</button>` : `<p class="muted">Waiting for the host to start…</p>`}
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
        room.send({ t: "addBot", style: arg as BotStyle });
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
  wrap.addEventListener("change", (e) => {
    const t = e.target as HTMLSelectElement;
    if (t.id === "round") room.send({ t: "setOptions", options: { roundMinutes: Number(t.value) } });
    if (t.dataset.rule && room.lobby) {
      const rules = { ...room.lobby.options.rules, [t.dataset.rule]: Number(t.value) };
      setStorage("rules", JSON.stringify(rules));
      room.send({ t: "setOptions", options: { rules } });
    }
  });

  let rulesSent = false;
  const offLobby = room.onLobby((l) => {
    if (!rulesSent && l.host === room.you && l.phase === "lobby" && Object.keys(l.options.rules).length === 0) {
      rulesSent = true;
      const saved = loadRules();
      if (Object.keys(saved).length) room.send({ t: "setOptions", options: { rules: saved } });
    }
    if (l.phase === "lobby") showLobby(l);
    else showGame();
  });
  const offStatus = room.onStatus((_s, msg) => {
    if (msg) message = msg;
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
