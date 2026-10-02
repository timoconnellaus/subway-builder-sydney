// End-to-end smoke test against a running server (npx wrangler dev).
// Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`.
// Usage: node scripts/e2e-smoke.mjs [baseUrl]   (default http://127.0.0.1:8787)
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8787";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl"]
});
const errors = [];
let failed = false;
const check = (ok, what) => {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) failed = true;
};

async function page(name, viewport = { width: 1200, height: 800 }) {
  const ctx = await browser.newContext({ viewport });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  await p.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await p.addInitScript(() => {
    localStorage.setItem("seen-intro", "1");
    localStorage.setItem("tutorial-done", "1");
  });
  return p;
}
// the map loads its sprites asynchronously; wait until it can be tapped
const mapReady = (p) => p.waitForFunction(() => window.__screen?.mapReady, null, { timeout: 20000 });
const stationXY = (p, id) => p.evaluate((id) => window.__screen.map.stationScreen(id), id);
async function tapBetween(p, a, b) {
  const A = await stationXY(p, a);
  const B = await stationXY(p, b);
  await p.mouse.click((A[0] + B[0]) / 2, (A[1] + B[1]) / 2);
  await p.waitForTimeout(250);
}

// single player: open track, build a line, earn fares
{
  const p = await page("solo");
  await p.goto(`${BASE}/#/play`, { waitUntil: "networkidle" });
  await mapReady(p);
  await tapBetween(p, "central", "redfern");
  await p.click("[data-act=open]");
  await tapBetween(p, "redfern", "ashfield");
  await p.click("[data-act=open]");
  await p.click("[data-act=back]");
  await p.click("[data-act=new-line]");
  for (const s of ["central", "redfern", "ashfield"]) {
    const [x, y] = await stationXY(p, s);
    await p.mouse.click(x, y);
    await p.waitForTimeout(200);
  }
  await p.click("[data-act=create]");
  await p.evaluate(() => window.__screen.conn.session.tick(60));
  await p.waitForTimeout(500);
  const me = await p.evaluate(() => window.__screen.snap.players[0]);
  check(me.owned === 2, "solo: opened two sections");
  check(me.carried > 0, "solo: carried passengers");
}

// online: two players in one room, a move syncs, reload rejoins
{
  const dad = await page("dad");
  await dad.goto(BASE, { waitUntil: "networkidle" });
  await dad.fill("#name", "Dad");
  await dad.dispatchEvent("#name", "change");
  await dad.click("#create");
  await dad.waitForSelector(".lobby");
  const code = (await dad.textContent(".room-code b")).trim();
  const son = await page("son");
  await son.goto(`${BASE}/#/room/${code}`, { waitUntil: "networkidle" });
  await son.waitForSelector(".lobby");
  await dad.waitForTimeout(400);
  await dad.click("[data-act=bot][data-arg=raider]");
  await dad.waitForTimeout(300);
  await dad.click("[data-act=start]");
  await son.waitForSelector(".game");
  await mapReady(son);
  await tapBetween(son, "parramatta", "granville");
  await son.click("[data-act=open]");
  await dad.waitForTimeout(1200);
  const owner = await dad.evaluate(() => window.__screen.snap.sections["granville~parramatta"].owner);
  const sonId = await son.evaluate(() => window.__screen.conn.you);
  check(owner === sonId, "online: son's move shows up for dad");
  await son.reload({ waitUntil: "networkidle" });
  await son.waitForSelector(".game");
  await son.waitForTimeout(800);
  check((await son.evaluate(() => window.__screen.conn.you)) === sonId, "online: reload rejoins as the same player");
}

check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
await browser.close();
process.exit(failed ? 1 : 0);
