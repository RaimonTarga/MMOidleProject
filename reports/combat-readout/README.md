# Combat readout run — evidence (2026-10-06)

Report: [docs/briefs/combat-readout-report-2026-10-06.md](../../docs/briefs/combat-readout-report-2026-10-06.md).

- `mockup.html` — wave 0, committed before any code: the three scenes (a T1 Striker on a
  Moss Rat, the Crag Behemoth, a Slinger in a swarm) at desktop and 390 wide, from real
  event shapes through a port of the shipped rules; number language A vs B side by side
  with a "today" toggle. Open it from the repo (the bodies are the atlas at
  `../../client/public/assets/sprites.png`). `?freeze=<ms>` pins every scene for a still;
  `mockup-still-3100ms.png` is one.
- `capture.cjs` — the real-client driver. A production build (`VITE_DEV_TOOLS=true`) served
  by a capture server on its own port (`NODE_ENV=production DEV_TOOLS=true`, its own game DB,
  its own Redis index, `ADMIN_TOKEN`), a guest character in headless Chromium, fights staged
  through the admin namespace and dev-only debug events sent on the page's own websocket
  (tier-entry profile, teleport, fast boss retry, the altar), monsters tracked through a
  spectator socket, a second anonymous page on `/?watch=<socket id>` for the live boss fight.
  `node capture.cjs <baseUrl> <outDir> <before|after> [rat,boss,swarm,low]` with
  `PROFILES=<tier-entry profiles json>`; the guest token is cached outside the repo.
- `screens/` — the selected shots, `<item>-before.png` (develop `677c9f99`) and
  `<item>-after.png` (this branch), indexed in the report's "Before / after" table.
