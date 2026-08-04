> ARCHIVED — implemented; live state in `docs/spectator-landing-current-state.md`.

# Spectator Landing Page — Implementation Plan

Origin: extracted from the completed Character Select & Discord Login plan on
2026-08-04.

## Settled direction

Before login, the landing page shows a read-only live view of a random active
player. If nobody is online, it shows the thawed tier-0 clearing with monsters
wandering. The presentation that makes “watching someone else's live gameplay”
unmistakable remains an open design item owned by the user; implementation should
leave a plain labeled placeholder until that direction is supplied.

## Server

1. Admit `handshake.auth.spectate === true` without a token and flag the socket as a
   spectator. Spectators never attach an entity, and every `character:*` handler must
   explicitly refuse them.
2. Add a spectator-safe player projection. It may include position, hitbox, motion,
   attack target, health, attack/status/emote/channel/death/party state, plus only the
   tier/class fields needed to select player art. It must never include inventory,
   essences, quest progress, or full progression/build slices. Build the slim node
   snapshot once per watched node per broadcast tick.
3. Add a spectator manager beside the broadcast loop:
   - choose a random connected, active player, preferring combat when cheap;
   - retarget on disconnect, death, or idle and follow node transitions;
   - with no eligible player, keep only the clearing thawed and ticking while at
     least one spectator watches it;
   - emit `spectate:status { mode: 'player' | 'clearing', targetName?, nodeId }` on
     subscribe and every retarget/node change.
4. Before shipping, enforce roughly 16 concurrent spectators, 2 per IP, and a
   10-minute idle pause that resumes after interaction.

## Client

1. With no session token, connect as a spectator instead of making an unauthorized
   player connection.
2. Render a split landing view with pitch/login content and the normal Phaser canvas.
   Disable game input and keep gameplay HUD roots hidden.
3. Follow the target entity from `spectate:status`; in clearing mode rest the camera
   at the node center.
4. The Discord login navigation naturally disconnects the spectator socket. A lobby
   background stream after login is optional, not v1.
5. Until art direction is supplied, label the view plainly as
   `LIVE — watching {name}` or `LIVE — the Clearing`.

## Verification

- With a player online: follow them, survive a node transition, and retarget when
  they leave.
- With nobody online: thaw the clearing, show wandering monsters, and re-freeze it
  after the last spectator leaves.
- Assert the spectator projection never includes full `holdsInventory`,
  `tracksProgression`, or `usesSkills` slices.
- Exercise concurrency, per-IP, and idle guardrails.
