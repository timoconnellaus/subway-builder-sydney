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
- [x] Guided tutorial (9 steps with a coach and pulsing hints) and 15 achievements
- [x] Greater Sydney map (Gosford, Wollongong, Katoomba, Richmond, Leppington, Olympic Park)
- [x] "Watch the bots" mode, installable PWA (icons + manifest), phone layout
- [x] World cities: London, New York, Tokyo, Paris, Berlin, Hong Kong, Singapore, plus Melbourne (each with hubs, events, rivers; tested for connectivity)
- [x] World Tour campaign: nine cities that unlock in order, bots getting harder
- [x] Daily challenge with a seeded sim and a leaderboard (one Durable Object per day)
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
- Fresh-eyes playtest (subagent) found the tutorial's last step could never finish, the coach
  covering the target on phones, beginners being wiped out on Normal, tiny phone labels. All fixed:
  tutorial setup moved into the sim with a test; Easy bots by default until your first win.
- World cities added by four parallel subagents (one per city), then registered, tested for
  connectivity / no track through stations, and balance-tuned for 3 and 4 players.
- /simplify passes (reuse, simplification, efficiency, altitude reviewers) after each batch.
- Second playtest (online + world cities): host handover on reconnect, lobby names, label
  overlaps, starting zoom, water-coloured territory — fixed. A correctness review found 7 bugs — fixed.
- Four more cities (Melbourne, Berlin, Hong Kong, Singapore) and a World Tour campaign.
- "Can a kid win?" test: a scripted tutorial-level player won 2/12 on Easy and often lost while
  owning the most track. Changed the clock rule to most track (passengers break ties) and made
  Easy bots gentler; now 4/6. Hub bonuses retuned for the new rule.
