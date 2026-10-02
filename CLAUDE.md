# Metro Empire — notes for working on this repo

Browser rail-strategy game set on the Sydney network, with online multiplayer on Cloudflare.

## Layout
- `src/sim/` — all game rules, pure TypeScript with no DOM or Workers APIs. Shared by the browser
  (single player) and the server (online). `game.ts` (commands, trains, boarding, captures, money),
  `routing.ts` (passenger route choice), `bots.ts`, `session.ts` (fixed-step tick + snapshots),
  `types.ts` (state, settings, house rules), `data/*.ts` (one file per map: stations, sections,
  hubs in seat order, events, water), registered in `index.ts` (`MAPS`, `MAP_CHOICES`).
- `src/shared/` — online protocol (`protocol.ts`) and `room.ts` (RoomCore: lobby, seats, tokens,
  reconnects, pause, emotes, message validation). Transport-agnostic so tests drive it directly.
- `src/server/worker.ts` — Worker routes (`/api/rooms`, `/api/rooms/:code/ws`) and the `GameRoom`
  Durable Object that wraps RoomCore, ticks at 4 Hz, saves state in chunks, and forgets idle rooms.
- `src/client/` — PixiJS map (`game/map.ts`), game screen and panel (`game/screen.ts`), menu and
  lobby (`main.ts`), connections (`conn.ts`: LocalGame / RemoteRoom), sounds, styles.

## Commands
- `npm test` — Vitest: rules, rooms, fuzz invariants.
- `npm run build` — typecheck client + worker, build to `dist/`.
- `npx wrangler dev` — serves `dist/` plus the multiplayer server on :8787. Restart it after a build.
- `npm run dev` — Vite on :5173 with `/api` proxied to wrangler for hot reload.
- `npm run balance -- 4 key=value` — bot-vs-bot games with economy printout.
- `npx vite-node scripts/perf.ts` — tick time and snapshot size.

## Conventions
- Every rule change goes in `src/sim` with a test; never put rules in the client or server.
- Validate anything from the network (`checkMessage` in room.ts, `checkCommand` in game.ts).
- State must stay JSON-serialisable (it's snapshotted, stored and sent over the wire).
- Tunable numbers live in `DEFAULT_SETTINGS`; player-changeable ones in `HOUSE_RULES`.
- 1 game minute = 1 real second; times in the sim are game minutes.
