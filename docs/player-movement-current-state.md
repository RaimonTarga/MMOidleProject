# Player movement current state

Updated 2026-09-10. Implementation and automated validation are complete; live browser feel has not been verified. The implementation specification and smaller-model handoff are preserved in [the archived plan](archive/player-movement-implementation-plan.md).

## Behavior

WASD/gamepad input is a direction. Changes send immediately; held input refreshes every 100 ms. Keyboard retains the existing 40 ms release rollover debounce. Gamepad noise below the change threshold waits for the periodic refresh, and a release always updates. Both controls keep full movement speed for a nonzero direction, with normalized diagonals.

Manual player steps use shared swept contact geometry. A flat wall stops head-on input. Diagonal input retains its tangential component without renormalizing it or choosing an arbitrary side. No 600 px collision lookahead chooses the displayed direction. The 600 px wire destination remains as a compatibility horizon, supplemented by a direction normalized relative to the server's authoritative origin. Direct input remains bounded if refreshes stop.

Click movement retains an A* route on the client, and both manual followers consume one distance budget across exact waypoints (0.01 px numerical tolerance). Blocked path segments stop instead of sliding. Completion stops at the final planned endpoint; a click inside terrain never causes a final attempt to walk back into the raw click. The same-cell planner shortcut also validates its endpoint and approach. The target marker shows the resolved destination rather than the first waypoint.

`player:move` accepts an optional acknowledgement returning `{ accepted, nodeId, goal }`. This confirms the endpoint, not position replay. Client generation/player/node checks reject obsolete acknowledgements. Keyboard, another click, cancel, auto, death, full sync, and transitions invalidate the preceding click. Ordinary player deltas retain the route; a hard position correction replans from the corrected origin. Server termination after the acknowledgement releases the retained click.

Player path blockage (click or auto) retains the movement owner so its watchdog can run on later ticks without another user/AI request. It tries one replan at 800 ms of blockage and stops after 1800 ms of continued blockage. Progress along the route resets this timer. A blocked held direction does not enter nearest-cell recovery or teleport along the wall. Authoritative depenetration for invalid starting positions remains a separate existing failsafe.

Auto player paths now use the same distance-budget follower as clicks. Intermediate arrivals preserve the route and carry leftover distance into the next segment; only completion or cancellation stops the order. This fixes repeated short ticks introduced by exact waypoint arrival. `isMoving.pathPreview` carries the authoritative origin and up to eight upcoming waypoints. The local player's auto renderer follows that bounded preview through corners between snapshots, accounting for waypoints already passed by prediction and checking terrain collision. It stops at the preview endpoint rather than extrapolating indefinitely. Manual prediction and pending stops take priority, and removal of `isMoving` removes the preview.

Ordinary client position corrections are collision-clamped. If terrain separates a needed correction from the authoritative position, the client uses a hard correction to the safe authoritative position and rebuilds the active click route. A displaced route also gets one local replan when its next segment blocks; continued blockage does not run A* every frame. This avoids visually interpolating through terrain, but can still produce a visible correction under latency. The existing 80 px reconciliation dead zone and 220 px hard-snap threshold were not enlarged.

## Ownership and compatibility

- Server simulation remains 10 Hz; node broadcasts remain 5 Hz. The client predicts presentation only.
- Navigation body sizes, movement stat formulas, mountain geometry/art, gates, and persistence schemas are unchanged.
- Monster and direct autonomous angular steering remains in `slideMoveAgainstBlocks`; player paths use continuous exact waypoint execution. The swept sliding contact rule is used for manual directional movement.
- User movement bypasses optional hazard avoidance, preserving its committed ownership. Root/channel/death remain authoritative cancellation conditions.
- Legacy clients/bots that send only position/options remain accepted. New click acknowledgements are optional. This is not an input-sequence acknowledgement/replay architecture.
- Active held directional controls take priority over a click. Hold-still/summon commands retain their existing behavior.
- Focus loss clears held keyboard input; full resync invalidates local click prediction and rebases retained player sprites. Remote-player presentation follows observed positions; own-player autonomous paths use the bounded server preview.

## Player synchronization review (2026-09-24, not deployed)

Reviewed node delta encoding/membership, transition baseline resets, private state
syncs, visibility/reconnect handlers, retained entity views, local movement
ownership, remote interpolation, death/respawn, and reposition/knockback effects.

Corrections prepared locally:

- A retained player's node change resets its interpolation base, target, and
  lunge offset, including remote party members sharing a destination snapshot.
- Remote players interpolate a bounded history of authoritative positions,
  250 ms behind the server timeline. This replaces the per-packet easing that
  repeatedly accelerated and decelerated at 5 Hz. Every packet samples stationary
  players too. Playback holds the latest confirmed position during packet silence;
  node changes, explicit resyncs, death/respawn, long interruptions, and position
  jumps above 240 px discard stale history. Own-player prediction is unchanged.
- Returning from a hidden tab restores the last observed position, not a possibly
  distant movement target. Explicit state syncs rebase same-node player sprites;
  ordinary full membership refreshes still preserve smoothing.
- Dead-player updates refresh authoritative position and clear target/speed.
  Death/respawn transitions also reset interpolation and old attack offsets.

The server's destination membership reset and private resync baseline isolation
already provide the required full state. No protocol, simulation, or tick-rate
changes were made. Reposition events are not uniformly teleport destinations:
Charge also uses one for a projected visual endpoint, so blindly snapping to
every event's `to` would introduce a separate synchronization error.

Validation: `playerNodePosition.test.ts` covers all four crossings and both party
update orders. `playerSync.test.ts` covers 5 Hz turns/stops, zero-speed remote
correction through the actual frame renderer, packet silence, frame-rate
independence, large displacement, tab return, and same-node resync. Workspace
typecheck and production client build pass. Full gameplay suite was started but
stopped before completion; it is not a pass claim for this patch.

Remaining acceptance: two clients under latency/jitter, short reposition skills,
death/respawn, and reconnect/tab-return during party travel. Remote buffering adds
250 ms of presentation delay behind the server timeline; assess that feel
before deployment. Local input still has no sequence-based replay and retains
its existing correction thresholds; this review does not claim all sync issues
are eliminated.

## Code map

| Concern | Files |
|---|---|
| Swept contact movement and distance-budget path follower | `shared/src/collision/playerMotion.ts` |
| Path endpoint validation | `shared/src/collision/pathfind.ts` |
| Move intent contract | `shared/src/protocol/socketEvents.ts` |
| Input validation and resolved endpoint | `server/src/systems/world/manualMove.ts`, `server/src/net/playerHandlers.ts` |
| Manual movement, recovery, waypoint lifecycle | `server/src/systems/world/movement.ts`, `pathMotion.ts` |
| Client input, click generation, prediction | `client/src/input/movement.ts`, `pathPrediction.ts`, `clickOrder.ts`, `clickToMove.ts` |
| Prediction and authoritative corrections | `client/src/render/interpolation.ts`, `movementCorrection.ts`, `players.ts` |
| Full-sync invalidation | `client/src/net/deltaApplier.ts` |

## Validation evidence

- `playerMotion.test.ts`: direct wall contact, diagonal slides, moving away, curved blockers, inside corner, large displacement, invalid starts, exact path budget/blocked-segment behavior. Flat-wall endpoints agree within 1 px at 10/30/60/144 updates per second. The tested two-second ellipse glance differs by **4.765 px** across those update rates: variable-step curved prediction is not bit-identical.
- `playerMotionProperties.test.ts`: **1,161** deterministic admissible clear-start cases across mixed/overlapping rectangles, circle, and ellipse. Finite endpoints, nonpenetration, no distance-budget gain, and reversed-shape-order agreement.
- `pathEndpoint.test.ts`: blocked same-cell click resolves safely; clear same-cell click retains its exact endpoint.
- `manualPlayerMovement.test.ts`: real World single-click mountain traversal (671 ticks for the fixture), blocked mountain endpoint, repeated head-on wall hold, autonomous-input-free blocked-click watchdog, moving away, stopping, invalid input, and rooted rejection.
- `clientMovementState.test.ts`: retained mountain route through per-frame prediction, resolved-goal acknowledgement, safe completion, stale/node-mismatched callbacks, rejection, correction geometry, and optional wire callback compatibility.
- `pnpm test:spatial`: passed both existing suites.
- `pnpm typecheck`: passed, including benchmark typechecking.
- Production client build: passed (`pnpm build:client`), with a large-chunk advisory.
- Full suite: **158/158 passed** (`pnpm test`). Final focused movement checks and typechecking also passed after review fixes. `git diff --check` passed for the changed tracked scope.

Live browser acceptance: **NOT RUN**. Browser runtime setup succeeded, but selection returned `No browser is available` and discovery returned an empty list. Neither a local client nor server was listening when prerequisites were checked. Automated tests are not a claim that camera/sprite/input feel under real network delay has been observed.

## Remaining acceptance and deferred changes

Play the matrix in the specification on a connected local browser: mountain pass/inside corner, head-on and diagonal wall contact, reversals, click/keyboard/auto handoffs, root/channel/death, blur/resync, and varying latency/frame rate. In particular, assess visible hard corrections and curved-contact drift. Do not change reconciliation thresholds to conceal geometry disagreement.

Path shortcut smoothing, a finer grid/navmesh, changing hitboxes or mountain walls, and full sequence replay remain outside this implementation. Monster and direct autonomous recovery retain their previous behavior; autonomous player paths now share the bounded player-path watchdog.

Auto smoothness follow-up validation: `autoMovementSmoothness.test.ts` covers constant tick distance, retained routes, 5 Hz preview updates rendered at 60 Hz, corner carryover, bounded prediction, collision safety, stopping/root/direct handoffs, and the real mountain route. The existing manual movement, client movement state, auto collision recovery, and waypoint wedge tests passed, as did workspace typechecking. The full suite was not rerun for this follow-up, at the user's request. Live browser feel remains unverified.

## Mountain rendering follow-up (2026-09-11)

The movement trace also exposed repeated rendering work: the rectangular mountain
corner patches produced 24 filled paths (9,816 vertices) per node per frame in
Phaser's WebGL renderer, including off-screen neighbor graphics. These corners
now use four shared 84-by-84 textures, one per orientation. Each texture bakes the
original three fills and lip stroke once; node teardown destroys image instances
while the game's texture manager retains the small reusable cache. The active
node and neighbor previews use the same construction path. Collision geometry,
movement, and circular dungeon arena rendering are unchanged.

`mountainCornerTextures.test.ts` verifies that live mountain graphics no longer
contain rounded fills, both rings retain their corners, placement and preview
depth are preserved, texture bounds include padding, and rebuilds reuse the
four textures. Browser appearance and frame-time improvement still require a
same-scene live comparison; CPU geometry probes are not measured FPS gains.

## Implementation handoff outcome

The root agent wrote the specification and split shared/server/client work among three `gpt-5.6-luna` agents. They hit a usage limit before completing their assignments. The root completed integration, corrected partial edits (including an accidentally recursive server branch and a sliding path follower), added independent tests, and performed final review. No commit, push, deployment, paid art generation, or art packing was part of this work.

Remote smoothness follow-up: `playerSync.test.ts` verifies constant rendered
velocity for 5 Hz walking with 0-40 ms arrival jitter at 30/60/144 FPS, widely
different server clock origins, retained corner samples, no extrapolation, and
history reset on node changes, large jumps, interruption, and explicit resync.
Live two-client visual acceptance remains pending; this work is not deployed.
