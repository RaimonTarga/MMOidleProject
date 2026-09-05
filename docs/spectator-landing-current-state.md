# Spectator Landing Page — Current State

Last updated: 2026-08-04

> **PARKED on the landing page, 2026-09-05.** A visitor with no credential now
> boots no Phaser game and opens no spectator socket at all
> (`isLandingOnlySession` in `client/src/net/session.ts`); the landing page is
> the prerecorded video backdrop and the login panel. Everything below still
> describes the spectator as built, and the dev `?watch=` path still uses it.
> The live pane rendered black and the work was parked to focus on the video —
> see `docs/landing-cinematic-current-state.md`, "PARKED: the live spectator
> pane". The Clearing-fallback removal recorded below is NOT parked; it shipped.

## Player flow

Visitors without a session token or explicit development identity connect with
`handshake.auth.spectate === true`. The landing gate remains visible as a split
login/live-world view while the normal Phaser scene renders behind it. A compact,
translucent login capsule leaves most of the live world unobscured, while the status
pill identifies `LIVE — watching {name}` or `LIVE — the Clearing`.

Signing in with Discord navigates away and naturally disconnects the spectator.
Authenticated connections continue through the normal character lobby and never use
the spectator stream.

## Server authority and privacy

Spectator sockets have no player entity and do not register gameplay handlers.
Character create/select/delete requests are explicitly rejected. A dedicated manager
chooses from the highest-tier connected, foreground players, preferring active combat
within that tier and choosing randomly among remaining equals. It retargets after
disconnect, death, backgrounding, or node changes.

Anonymous viewers receive `spectate:snapshot`, not `state:sync` or `node:delta`.
Monsters and minions use their normal presentation slices. Players use a separately
audited allowlist plus `spectatorPlayer`, which contains only tier/class/archetype art
selection fields. The wire payload never includes `tracksProgression`,
`holdsInventory`, or `usesSkills`; the client creates empty presentation defaults only
after receiving the safe payload.

**There is no fallback view (changed 2026-09-05).** When no eligible player
exists the manager reports `mode: "idle"` with no `nodeId`, and the viewer
receives no snapshots at all. The previous behaviour pointed idle viewers at the
tier-0 Clearing and held a thaw lease on it; with nobody in it that is an empty
stone circle, a worse first impression than the landing page's own prerecorded
backdrop. The lease is gone with it — the Clearing is never thawed on a
spectator's behalf. See
[landing-cinematic-current-state.md](landing-cinematic-current-state.md).

## Dev-only target pinning (bot harness)

Added 2026-08-25 for the headless bot harness. When the server is not in
production it registers two extra events:

- `spectate:setTarget(playerId | null)` pins the camera to one character instead
  of the automatic pick, or clears the pin.
- `spectate:targets` pushes an identity-only roster (`id`, `name`, `playerTier`,
  `nodeId`).

The client reads `?watch=<playerId>` on spectator boot and emits the pin, so the
bot dashboard can link straight into a live view of one bot.

This is **selection only**. No field was added to the anonymous player
projection: `SPECTATOR_PLAYER_KEYS` and its privacy regression test are
unchanged, and neither event is registered in production, so the public landing
spectator behaves exactly as before and learns nothing new about who is online.

A pin is held across the target's death (the camera borrows the automatic pick as
cover and snaps back on respawn) and released only when that player entity is
gone. Covered by `server/test/spectatorManager.test.ts`.

## Guardrails

- 16 concurrent spectators server-wide.
- 2 concurrent spectators per socket address.
- High-volume streaming pauses when the tab is hidden.
- A 10-minute idle timeout pauses snapshots; pointer or keyboard interaction resumes.
- Privacy, per-IP capacity, idle pause, fallback, and spectator authentication have
  automated regression coverage.

## Client behavior

The spectator boot preloads only the shared sprite/effect/decor set plus the
clearing's ground art (the fallback view and spawn node) — a fraction of the full
asset payload — so the pane paints quickly. The remaining biomes, trees, and
overlord art stream in the background from `create()`; a retarget into a
not-yet-loaded biome falls back to the flat biome fill until the deferred pass
completes and re-skins the current node. Audio files are never fetched for
spectators.

The spectator client does not attach keyboard, gamepad, click-to-move, movement-tick,
HUD intent, or audio handlers; Phaser's sound manager is muted as a final backstop.
Sidebar and React HUD roots are hidden. The camera follows the
target interpolation base and moves with the target across nodes. The latest full spectator snapshot owns the rendered node without claiming
an `ownId`, so player-only HUD synchronization and gameplay settings intents remain inactive.
Same-node entities missing from a later full spectator snapshot are converted into
remove transitions so normal monster death dissolves still run. A watched player is
held for 1.8 seconds after death so their grave transition renders before retargeting.
The watched player's attack events drive their combat animation directly, preserving
the finishing blow even though the killed monster is absent from the resulting full
snapshot. Zone visuals change atomically with the first snapshot for the new node;
status updates alone do not repaint a zone ahead of its entities.

## Primary seams

- Shared protocol and allowlist: `shared/src/protocol/networkedEntity.ts`,
  `shared/src/protocol/socketEvents.ts`
- Authentication: `server/src/auth/socketAuth.ts`
- Selection/guardrails: `server/src/net/spectatorManager.ts`
- Safe projection: `server/src/world/spectatorSnapshot.ts`
- Broadcast/socket integration: `server/src/index.ts`
- Client connection and hydration: `client/src/net/socket.ts`,
  `client/src/net/spectatorSnapshot.ts`
- Landing and camera behavior: `client/src/auth/`, `client/src/scenes/game/`
