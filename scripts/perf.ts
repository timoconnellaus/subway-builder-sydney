import { MAPS, Session } from "../src/sim";
const s = Session.create(MAPS.sydney, ["builder", "raider", "banker", "builder"].map((b, i) => ({
  id: `P${i + 1}`, name: b, color: (["red", "blue", "gold", "green"] as const)[i], hub: MAPS.sydney.hubs[i], isBot: true, botStyle: b as any
})), { winShare: 2 });
let worst = 0, total = 0, n = 0, maxSnap = 0;
for (let t = 0; t < 900; t += 0.25) {
  const a = performance.now();
  s.tick(0.25);
  const snap = JSON.stringify(s.snapshot());
  const d = performance.now() - a;
  worst = Math.max(worst, d); total += d; n++;
  maxSnap = Math.max(maxSnap, snap.length);
  if (Math.abs(t % 150) < 0.01) console.log(`t=${t} groups=${Object.keys(s.state.groups).length} trains=${s.state.trains.length} tick+snap=${d.toFixed(2)}ms snap=${(snap.length / 1024).toFixed(1)}KB`);
}
console.log(`avg ${(total / n).toFixed(2)} ms, worst ${worst.toFixed(1)} ms, biggest snapshot ${(maxSnap / 1024).toFixed(1)} KB, state ${(JSON.stringify(s.state).length / 1024).toFixed(0)} KB`);
