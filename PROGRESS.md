# Metro Empire — build log

Overnight build, started 2026-10-02 20:30 AEST.

## Status
- [x] Simulation core (pure TypeScript, shared by browser and server) with tests and a fuzz test
- [x] Online multiplayer: Cloudflare Worker + Durable Object rooms, lobby with QR code, bots in seats,
      reconnect, spectators, host pause, emotes, chunked saves, idle-room cleanup
- [x] Browser client: PixiJS map, live trains, waiting passengers, panel, toasts, end screen with chart
- [x] Single player vs bots with pause, 1–3× speed, resume after closing the tab, personal record
- [x] House rules (capture count, win share, money, track fee, busyness, bot skill, events)
- [x] Sydney events (Swans at the SCG, Vivid, Easter Show…) announced ahead with crowds
- [x] Balance passes (flat fares, boarding-based capture, scaling open cost, hub protection, hub bonuses)
- [x] Polish: sounds, welcome card, hints, hover tooltips, capture flash, head-to-head panel, line names
- [x] Deploy config (wrangler.toml, GitHub Actions), README, CLAUDE.md
- [x] Code review pass: fixed ghost trains, refunds, input validation, host edge cases
- [x] Guided tutorial (9 steps with a coach and pulsing hints) and 12 achievements
- [x] Greater Sydney map (Gosford, Wollongong, Katoomba, Richmond, Leppington, Olympic Park)
- [x] "Watch the bots" mode, installable PWA (icons + manifest), phone layout
- [x] Line renaming/trimming, station destinations panel, online rooms keep score across rounds

## Ideas for later
- Interchanges between rival networks (from the design doc's version 1.5)
- Express trains that skip stations
- More stations (CBD split into Central / Town Hall / Wynyard, Metro City line)

## Log
- Sim core: network + gravity demand model, route choice (fare + 50c/min + 4 min per change),
  platform boarding rule, capture rule, track fees, running costs, bots (builder/raider/banker).
- Multiplayer: transport-agnostic RoomCore (tested) wrapped by a Durable Object; state saved every 10s.
- Verified in Cloudflare's runtime (wrangler dev): two browsers in one room, commands sync, reload rejoins,
  saves survive a server restart.
- Balance: flat fare per ride; "empty" = nobody boarded at that platform; opening track costs more the
  more you own; only the hub owner can open track at their hub; weaker hubs get extra starting cash.
