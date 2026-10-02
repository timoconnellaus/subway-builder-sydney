# Metro Empire — build log

Overnight build, started 2026-10-02 20:30 AEST.

## Plan
1. Simulation core (pure TypeScript, shared by browser and server) — **done**
2. Browser client: PixiJS map, trains, passengers, UI, single player vs bots
3. Online multiplayer: Cloudflare Worker + Durable Object rooms, lobby, reconnect
4. Bots, balance, polish, tutorial, mobile/touch
5. Deploy config (wrangler, GitHub Action), docs

## Log
- Sim core: network + gravity demand model, route choice (fare + 50c/min + 4 min per change),
  platform boarding rule (wait for a cheaper train within saving/50c minutes if it has room),
  capture after 3 empty owner trains, track fees, running costs, bots (builder/raider/banker).
