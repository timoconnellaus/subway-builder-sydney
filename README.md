# Metro Empire

A Sydney rail strategy game for the browser, with online multiplayer.

Each player is a train company starting at a home hub on the real Sydney Trains and Metro map. Open
track next to your network, run lines, and win passengers. You can run your trains on rivals' track
(paying them a fee); passengers wait for a cheaper train if it's coming soon and has room. When
nobody boards the owner's train on a section three times in a row, the section is yours. Own 60% of
the network, or carry the most passengers before the clock runs out.

## Play

- **Against bots:** pick 1–3 bots (the Builder, the Raider, the Banker) and a round length. Runs
  entirely in the browser, with pause and 1×/2×/3× speed.
- **Online:** create a room, share the link or the four-letter code, and add bots to any empty seats.
  Close the tab and come back: you rejoin as the same player.

Works with a mouse or touch: drag to pan, scroll or pinch to zoom, tap stations and sections.

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

## Art

Sprite sheets and the atlas are in `assets/metro-empire/`. The game uses trimmed copies in
`public/sprites/`.
