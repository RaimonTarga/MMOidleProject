# Spectator Landing Page — Current State

Last updated: 2026-08-04

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

When no eligible player exists, active spectators watch the tier-0 Clearing. The
manager holds a thaw lease while that fallback is watched and freezes it after the last
fallback viewer leaves or pauses, provided no real player occupies it.

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
target interpolation base and moves with the target across nodes; Clearing mode centers
the camera. The latest full spectator snapshot owns the rendered node without claiming
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
