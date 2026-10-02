# Metro Empire

A rail strategy game for the browser, set on real city networks (Sydney first, then the world),
with online multiplayer.

Each player is a train company starting at a home hub on a real rail map. Open
track next to your network, run lines, and win passengers. You can run your trains on rivals' track
(paying them a fee); passengers wait for a cheaper train if it's coming soon and has room. When
nobody boards the owner's train on a section three times in a row, the section is yours. Own 60% of
the network, or own the most track when the clock runs out (passengers carried break a tie). You can
always start a line at your own hub, so a company that loses all its track can fight back.

## Play

- **Maps:** *Sydney* (37 stations, quick games), *Greater Sydney* (49 stations, out to Gosford,
  Wollongong and Katoomba), *Melbourne*, and world cities: *London*, *New York*, *Tokyo*, *Paris*,
  *Berlin*, *Hong Kong* and *Singapore*. Each map has
  its own four starting hubs (seat 1 is the city centre) and local events.
- **Tutorial:** a guided practice game that teaches the whole loop in about two minutes.
- **Against bots:** pick 1–3 bots (the Builder, the Raider, the Banker), their skill (Easy until
  you've won a game), your starting hub and a round length. Runs entirely in the browser, with pause
  and 1×/2×/3× speed.
- **World Tour:** nine cities in a row, from Sydney (easy bots) to Tokyo (hard bots). Win a city to
  unlock the next. Each city scores up to three stars (win, own the winning share, do it before 7:00);
  stamps on the menu show stars and best times.
- **Daily challenge:** one setup per Sydney day (your hub, the bots, a twist like "Rush hour" or
  "Toll roads"), the same random seed for everyone, and a shared leaderboard. Fastest win ranks first.
  Saturdays are in a world city, Sundays on Greater Sydney.
- **Online:** create a room, share the link or the four-letter code, and add bots to any empty seats.
  Close the tab and come back: you rejoin as the same player.

Install it from the browser (Add to Home Screen) and single-player games keep working offline.
Works with a mouse or touch: drag to pan, scroll or pinch to zoom, tap stations and sections.
Also: 15 achievements, optional music, a colour-blind palette, and phone/iPad layouts.

## Rules in numbers

| Rule | Value |
| --- | --- |
| Passenger patience | waits 1 minute for every 50¢ saved |
| Route choice | fare + 50¢ per minute of travel, plus 4 minutes for each change |
| Fares | flat fare per ride, $0.50–$4.00 |
| Capture | nobody boards the owner's train 3 times in a row while a rival takes passengers there |
| Track fee | $4 to the owner each time a rival train uses their section |
| Instant win | own 60% of all sections |
| Time | 1 game minute = 1 real second; rounds are 5–20 minutes |
| Events | about every 2.5–3.5 minutes a local event (Swans at the SCG, Wimbledon, Yankees at Yankee Stadium…) is announced 45 seconds ahead and sends crowds to one station |
| Bot skill | Easy bots defend gently (fares no lower than $1.25), run at most 4 lines and stay off your track |

All of these live in `DEFAULT_SETTINGS` in `src/sim/types.ts`.

## How it's built

```
src/sim/      game rules: network, demand, routing, boarding, captures, money, bots (pure TypeScript)
src/shared/   online protocol and the room logic (lobby, players, reconnects)
src/server/   Cloudflare Worker + one Durable Object per room, running the game at 4 ticks a second
src/client/   PixiJS map and trains, game panel, menu and lobby
tests/        Vitest tests for the rules and rooms
scripts/      balance.ts plays bot-vs-bot games and prints the economy
```

The same simulation runs in the browser (single player) and in the Durable Object (online), so the
rules can't drift apart. Online, the server is authoritative: browsers send commands and receive
snapshots, and trains are interpolated between snapshots.

## Run it locally

```bash
npm install
npm test            # rules + rooms
npm run build       # typecheck + build the client into dist/
npx wrangler dev    # serves the game and the multiplayer server on http://localhost:8787
```

For client hot reload, run `npx wrangler dev` in one terminal and `npm run dev` in another, then open
http://localhost:5173 (Vite proxies `/api` to the Worker). Rebuild (`npm run build`) and restart
`wrangler dev` after changing anything in `dist/`.

`npm run e2e` drives two browsers through single player and an online room against a running
`wrangler dev` (needs Playwright: `npm i -D playwright && npx playwright install chromium`).

`npm run balance -- 5 winShare=0.6` plays five bot games and prints money, track and passengers per
minute; any setting can be overridden on the command line.

## Deploy to Cloudflare

One-off setup:

1. `npx wrangler login`
2. `npm run deploy` (builds, then `wrangler deploy`). Wrangler prints the `*.workers.dev` URL.

Automatic deploys: add two repository secrets, `CLOUDFLARE_API_TOKEN` (a token with the "Edit
Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID`. Every push to `main` then runs the tests and
deploys (`.github/workflows/deploy.yml`). Until the secrets exist the deploy step is skipped.

To keep it private, put the Worker behind Cloudflare Access (Zero Trust → Access → Applications).

What gets deployed: one Worker serving the built game from `dist/`, plus two Durable Object classes:
`GameRoom` (one per online room, ticks the game at 4 Hz and saves it) and `DailyBoard` (one per day's
leaderboard, forgotten after two weeks). Both use SQLite-backed storage, which the Workers free plan
includes. Migrations `v1` and `v2` in `wrangler.toml` create them on the first deploy.

Playing on an iPad: open the URL in Safari, then Share → Add to Home Screen. It opens full screen and
single-player games work offline after the first visit.

## Art

Sprite sheets and the atlas are in `assets/metro-empire/`. The game uses trimmed copies in
`public/sprites/`.
