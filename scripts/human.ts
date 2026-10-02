// A scripted "human" plays against one bot and tries to steal a section with a fare war.
import { MAPS, Session } from "../src/sim";
const s = Session.create(MAPS.sydney, [
  { id: "me", name: "Me", color: "red", hub: "central" },
  { id: "bot", name: "Builder", color: "blue", hub: "parramatta", isBot: true, botStyle: "builder" }
]);
const me = () => s.state.players[0];
const say = (m: string) => console.log(`[${Math.round(s.state.time)}] ${m}  money=${Math.round(me().money)}`);
for (const sec of ["central~redfern", "ashfield~redfern"]) say(`open ${sec}: ${JSON.stringify(s.command("me", { type: "open", section: sec }))}`);
say("line " + JSON.stringify(s.command("me", { type: "createLine", stations: ["central", "redfern", "ashfield"] })));
s.tick(120);
say(`carried ${me().carried}`);
// find a bot section touching our network
const owner = (id: string) => s.state.sections[id]?.owner;
say("ashfield~strathfield owner=" + owner("ashfield~strathfield") + " lidcombe~strathfield=" + owner("lidcombe~strathfield"));
if (!owner("ashfield~strathfield")) say("open a~s " + JSON.stringify(s.command("me", { type: "open", section: "ashfield~strathfield" })));
s.tick(60);
const line = s.state.lines.find((l) => l.owner === "me")!;
if (owner("ashfield~strathfield") === "me") say("extend to strathfield " + JSON.stringify(s.command("me", { type: "extendLine", line: line.id, station: "strathfield", end: "end" })));
s.tick(120);
// push west along the main line until we meet the bot's track
const path = ["strathfield", "lidcombe", "granville", "parramatta"];
let target: string | undefined;
for (let i = 0; i < path.length - 1 && !target; i++) {
  const sec = [path[i], path[i + 1]].sort().join("~");
  if (owner(sec) === "bot") target = sec;
  else if (!owner(sec)) {
    say(`open ${sec} ` + JSON.stringify(s.command("me", { type: "open", section: sec })));
    say("extend " + JSON.stringify(s.command("me", { type: "extendLine", line: line.id, station: path[i + 1], end: "end" })));
    s.tick(60);
  }
}
say("target " + target + " bot lines: " + s.state.lines.filter((l) => l.owner === "bot").map((l) => l.stations.join("-") + "@" + l.fare).join(" | "));
if (target) {
  const other = target.split("~").find((x) => !line.stations.includes(x))!;
  say("extend onto bot track " + JSON.stringify(s.command("me", { type: "extendLine", line: line.id, station: other, end: "end" })));
  say("fare " + JSON.stringify(s.command("me", { type: "setFare", line: line.id, fare: 1 })));
  say("trains " + JSON.stringify(s.command("me", { type: "setTrains", line: line.id, trains: 5 })));
  say("cars " + JSON.stringify(s.command("me", { type: "setCars", line: line.id, cars: 4 })));
  for (let i = 0; i < 15; i++) {
    s.tick(20);
    const ss = s.state.sections[target];
    const evs = s.state.events.filter((e) => (e.kind === "empty" || e.kind === "capture") && "section" in e && e.section === target).slice(-2).map((e) => e.kind + ("run" in e ? e.run : ""));
    say(`${target}: owner=${ss.owner} empty=${ss.emptyRun} rival=${JSON.stringify(ss.rivalSince)} ${evs.join(",")} bot=${s.state.lines.filter((l) => l.owner === "bot" && s.game.lineUses(l, target!)).map((l) => l.fare + "x" + l.trains).join(",")} me=${line.fare}x${line.trains}`);
    if (ss.owner === "me") break;
  }
}
