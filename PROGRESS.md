# Metro Empire — build log

Overnight build, started 2026-10-02 20:30 AEST.

## Status
- [x] Simulation core (pure TypeScript, shared by browser and server) with tests
- [x] Online multiplayer: Cloudflare Worker + Durable Object rooms, lobby, bots in seats, reconnect, spectators
- [x] Browser client: PixiJS map, live trains, waiting passengers, panel, toasts, end screen
- [x] Single player vs bots with pause and speed
- [x] Balance pass (flat fares, boarding-based capture, scaling open costs, hub protection)
- [x] Deploy config (wrangler.toml, GitHub Actions)
- [ ] More polish (see below)

## Next ideas
- Sound effects, a short interactive tutorial, line colours/names, more bot cleverness
- Settings panel for the co-designer (empty trains to capture, minimum fare…)

## Log
- Sim core: network + gravity demand model, route choice (fare + 50c/min + 4 min per change),
  platform boarding rule, capture rule, track fees, running costs, bots (builder/raider/banker).
- Multiplayer: transport-agnostic RoomCore (tested) wrapped by a Durable Object; state saved every 10s.
- Client: menu, lobby with invite link, map with territory colours, track ownership, contested markers.
- Verified in Cloudflare's runtime (wrangler dev): two browsers in one room, commands sync, reload rejoins.
- Balance: switched to flat fare per ride; "empty" now means nobody boarded at that platform;
  opening track costs more the more you own; only the hub owner can open track at their hub.
