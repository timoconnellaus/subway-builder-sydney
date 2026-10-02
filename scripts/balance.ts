// Plays bot-vs-bot games headlessly and prints how the economy develops.
// Usage: npm run balance -- [games] [key=value settings...]
import { MAPS, Session, type BotStyle, type Settings } from "../src/sim";

const args = process.argv.slice(2);
const games = Number(args.find((a) => /^\d+$/.test(a)) ?? 3);
const overrides: Partial<Settings> = {};
const mapId = args.find((a) => a.startsWith("map="))?.slice(4) ?? "sydney";
for (const a of args) {
  const m = a.match(/^(\w+)=([\d.]+)$/);
  if (a.startsWith("map=") || a.startsWith("players=")) continue;
  if (m) (overrides as Record<string, number>)[m[1]] = Number(m[2]);
}

const styles: BotStyle[] = ["builder", "raider", "banker", "builder"];
const hubs = MAPS[mapId].hubs;
const colors = ["red", "blue", "gold", "green"] as const;
const totals = { captures: 0, opens: 0, earlyWins: 0, endMinutes: 0 };
const hubWins: Record<string, number> = {};
const hubStats: Record<string, { carried: number; owned: number }> = {};

for (let g = 0; g < games; g++) {
  const n = Number(args.find((a) => a.startsWith("players="))?.slice(8) ?? 3);
  const s = Session.create(
    MAPS[mapId],
    // rotate styles across hubs each game so hub advantage shows up separately from bot style
    Array.from({ length: n }, (_, i) => {
      const style = styles[(i + g) % Math.min(n, 3)];
      return { id: `P${i + 1}`, name: `${style}@${hubs[i]}`.slice(0, 8), color: colors[i], hub: hubs[i], isBot: true, botStyle: style };
    }),
    overrides
  );
  console.log(`\n=== game ${g + 1} ===`);
  console.log("min  | " + s.state.players.map((p) => `${p.name.padEnd(8)} money  own carried lines trains`).join(" | "));
  let captures = 0;
  let seq = 0;
  for (let t = 60; t <= s.state.settings.roundMinutes && s.state.phase === "running"; t += 60) {
    s.tick(60);
    for (const e of s.state.events.slice(-(s.state.eventSeq - seq))) if (e.kind === "capture") captures++;
    seq = s.state.eventSeq;
    const snap = s.snapshot();
    console.log(
      String(Math.round(s.state.time)).padStart(4) +
        " | " +
        snap.players
          .map((p) => {
            const lines = snap.lines.filter((l) => l.owner === p.id);
            const trains = lines.reduce((a, l) => a + l.trains, 0);
            return `${"".padEnd(8)} ${String(p.money).padStart(6)} ${String(p.owned).padStart(3)} ${String(p.carried).padStart(7)} ${String(lines.length).padStart(5)} ${String(trains).padStart(6)}`;
          })
          .join(" | ") +
        `   waiting ${Object.values(snap.waiting).reduce((a, b) => a + b, 0)} lost ${snap.lost}`
    );
  }
  const opens = s.state.eventSeq;
  totals.captures += captures;
  totals.opens += opens;
  totals.endMinutes += s.state.time;
  if (s.state.time < s.state.settings.roundMinutes - 1) totals.earlyWins++;
  const winner = s.state.players.find((p) => p.id === s.state.winner);
  hubWins[winner?.hub ?? "none"] = (hubWins[winner?.hub ?? "none"] ?? 0) + 1;
  for (const p of s.state.players) {
    const h = (hubStats[p.hub] ??= { carried: 0, owned: 0 });
    h.carried += p.carried / games;
    h.owned += s.game.ownedCount(p.id) / games;
  }
  console.log(`winner: ${winner?.botStyle} at ${winner?.hub} (${Math.round(s.state.time)} min), captures: ${captures}  carried: ${s.state.players.map((p) => `${p.hub}=${p.carried}/${s.game.ownedCount(p.id)}`).join(" ")}`);
}
console.log("wins by hub:", JSON.stringify(hubWins));
console.log("average at the end:", Object.entries(hubStats).map(([h, v]) => `${h} carried ${Math.round(v.carried)} owned ${v.owned.toFixed(1)}`).join(", "));
console.log(`\nAverage over ${games}: captures ${(totals.captures / games).toFixed(1)}, early wins ${totals.earlyWins}, length ${(totals.endMinutes / games).toFixed(0)} min`);
