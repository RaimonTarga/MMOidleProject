# Player movement consistency: implementation specification

> ARCHIVED 2026-09-10: implementation completed; live state and outstanding browser acceptance are in [player-movement-current-state.md](../player-movement-current-state.md). This preserves the original specification and smaller-model handoff; use the live document for implemented behavior and validation results.

## Objective and boundary

Make player WASD/gamepad steering and click movement predictable around dense terrain, particularly mountain ledges. Keep server authority, 10 Hz simulation, 5 Hz broadcasts, existing navigation body dimensions, terrain, speed formulas, gates, and combat ownership. Do not resize art or hitboxes, change monster steering, add acceleration, replace A* with a navmesh, change economy, or deploy/commit as part of this task.

The shared workspace contains unrelated art and documentation changes. Edit only the files needed below; preserve all other work. Read `CLAUDE.md` before implementation. Tests are plain tsx scripts, not Vitest/Jest.

## Evidence, not assumptions

- `client/src/input/movement.ts` currently chooses a collision-deflected target 600 px ahead every 100 ms. `server/src/systems/world/movement.ts` instead clamps the next short step and tries angular deflection only when almost stationary. A synthetic rectangle probe at (200,200), half-size (40,40), from (100,200), produced client target (524.264,624.264) for right input while the server's 20 px step was (120,200).
- `slideMoveAgainstBlocks` chooses among fixed angles, without a stable contact normal. It is also used by autonomous movers. Preserve its behavior for those callers.
- Both waypoint followers discard points within 24 px, although grid spacing is 32 px. Planning checks the full route but execution does not check the shortcut after discarding a point.
- `advanceMotion` spends an entire tick on one waypoint and decrements intended magnitude even after collision displacement differs. Landing on an intermediate waypoint can call `stopEntity`, which clears the remaining route.
- Client click replanning runs on incoming player updates and falls back to a direct segment on failure; the server stops on failure. Server path completion can steer back at the original blocked goal after reaching a safe substitute endpoint.
- Blocked handling detaches `isMoving`, while its watchdog runs from the moving query. A single manual click has no recurring AI request to guarantee a retry.
- Client reconciliation occurs after collision checks and can move the predicted base through terrain.
- Existing `pnpm test:spatial` passed during investigation. This does not establish temporal correctness or live feel.

## Required player behavior

1. Pressing a direction responds immediately in client prediction and sends the changed intent immediately. Held input retains the 100 ms refresh. Preserve the existing 40 ms zero-vector rollover debounce, hold-still, focus loss, death, transition, and auto cancellation behavior. Continuous gamepad samples must not flood the socket: use a small direction-change threshold and the periodic refresh.
2. Input directly into a flat wall stops against it. Diagonal input preserves only its tangential component after contact; do not renormalize it to full speed, choose an arbitrary side, or begin turning before contact. Moving away from contact must work immediately.
3. Collision displacement must be finite, outside existing padded blockers, and no longer than the requested movement budget, except explicitly separate authoritative depenetration of an invalid starting position.
4. Clicking reachable ground follows collision-clear segments and arrives at the resolved endpoint. Clicking blocked ground may resolve to a safe endpoint chosen by the existing planner. Never walk back into the original blocked destination after reaching that endpoint. An unreachable click stops prediction when the server rejects it.
5. A path corner is reached exactly (small numerical tolerance only) before turning. Consume the remaining movement budget toward subsequent waypoints in the same tick/frame. This conservative rule avoids corner-cutting; long-range smoothing is deferred.
6. New clicks, keyboard input, stop, auto, death, resync, and node changes supersede old click responses. An old network acknowledgement must never revive an obsolete path.
7. Manual movement retains ownership during a transient blockage. A blocked direct heading waits for the next refreshed or changed input; it must not trigger a teleport just because a player holds a key into a wall. A blocked click has a bounded replan then terminates cleanly if it cannot resume. Normal manual collision does not use nearest-cell teleport recovery.

## Stage A: shared movement primitives

Owner: bounded implementation agent. Files: `shared/src/collision/playerMotion.ts` (new), `shared/src/collision/index.ts`, minimal exports in `shared/src/systems/spatial.ts`, and a new focused shared test file. Do not change the existing angular `slideMoveAgainstBlocks` algorithm.

### `movePlayerWithCollisions(from, to, shapes, pad): Vec2`

Pure player-only swept movement. Reuse/export the existing shape inflation and segment entry math rather than inventing another collider. All circle, ellipse, and rectangle rules must agree with `moverOverlapsBlockShapes` (including its current inflation conventions).

Algorithm:

1. If the start overlaps, return the start unchanged. Depenetration is a distinct server operation. Zero displacement returns the start. Clear displacement returns the destination.
2. Sweep the desired displacement against every padded shape and find the earliest entering contact. Ignore tangencies or motion away from a surface. Obtain outward unit contact normals: rectangle face normal; circle radial normal; ellipse normalized gradient `(dx/a^2, dy/b^2)`. Simultaneous rectangle faces/colliders must constrain both axes at an inside corner.
3. Move to just before contact (use the existing 0.5 px separation convention). Compute the remaining displacement after the travel consumed. Remove only inward components: `remaining -= normal * min(0, dot(remaining, normal))`. Do not normalize or rotate by guessed angles.
4. Sweep the projected remainder again. Bound contact iterations (4 is sufficient for this stage). Validate every committed segment/end against existing collision geometry. Stop safely if progress is negligible or the iteration bound is reached. Shape ordering must not change a simultaneous-corner result.
5. Do not use the generic resolver's escape-from-overlap shortcut to cross terrain. Do not silently return an overlapping endpoint on numerical failure.

Tests: free movement; head-on rectangle stop with no lateral drift over repeated steps; diagonal flat-wall slide; moving away; circle and ellipse glancing contacts; two-wall inside corner; reversed shape order; closely spaced blockers; large displacement cannot tunnel; invalid start remains unchanged; displacement never exceeds budget. Compare 100 ms steps with 30/60/144 Hz steps on the flat-wall case (within 1 px), and quantify curved-contact divergence rather than claiming bit-identical variable-step prediction.

### `advancePlayerPath(from, waypoints, distance, shapes, pad)`

Pure function returning `{ position, waypoints, blocked }`, with a copied remaining waypoint array. Exact waypoint tolerance `0.01 px`. No angular sliding for a planned path. Move along each segment using existing collision clamping; spend actual traveled distance; on a blocked segment stop this update and preserve its head. Drop a waypoint only when reached within tolerance; consume leftover budget toward the next waypoint. Bound work naturally by original queue length plus one, not a small arbitrary number that slows long paths. An empty queue means completion at the resolved endpoint. Test multiple waypoints in one step, preserved corner, blocked head retention, and stationary/zero-budget behavior. Export via the shared collision barrel.

## Stage B: authoritative integration

Owner: server implementation agent, after the Stage A API is fixed. Files: `server/src/systems/world/movement.ts`, `pathMotion.ts`, `server/src/net/playerHandlers.ts`, focused server tests. Root owns shared protocol declarations.

- Use `movePlayerWithCollisions` for manual direct player movement (`hasManualMoveIntent` and no path). Preserve autonomous/monster angular steering. Direct movement must not enter the old stuck teleport watchdog. Keep the intent alive while blocked, with the existing finite motion budget/refresh behavior; decrement its intended distance as before so disconnected input cannot last forever.
- Use `advancePlayerPath` for manual player click paths. Run it before generic waypoint advancement, consume the tick's full effective speed budget, store remaining waypoints, update motion toward their head from the actual position, and mark position/motion dirty. Completion clears path, moving, and manual ownership without trying the original goal again.
- Ensure a path starting at its first waypoint gets a nonzero motion toward the next point immediately. For shared `advanceMovePath`, remove unsafe 24 px skipping (use exact tolerance) and stop at the last planned endpoint. Do not change chase goal reuse tolerance or hazard policy.
- Manual path blockage retains motion/path/manual ownership so the next tick can run. Measure progress along the current path, not arbitrary sideways displacement. Replan once after 800 ms without progress; after 1800 ms of continued blockage stop cleanly. Successful forward progress resets the timer. Keep timer state entity-local (WeakMap is acceptable) and clear it on stop/new user intent; no cross-World entity-ID leakage. Root/channel/death cancellation remains authoritative. Keep legacy autonomous recovery unless needed for shared waypoint correctness.
- For directional keyboard input, an optional `direction` on direct move options is validated (finite, nonzero), normalized server-side, and used to construct a bounded target 600 px from the authoritative position. The coordinate payload remains for compatibility and position-based stop/direct callers. This prevents a predicted origin from skewing the server heading. Do not apply directional mode to path intents. Keep node clamp/gate behavior intact.
- The `player:move` event gains an OPTIONAL acknowledgement callback. Reply to all callback-bearing requests (including dead/channel/root rejection) with `{ accepted: boolean, nodeId: string, goal: Vec2 }`. `goal` is the last planned waypoint for path moves, or the authoritative stop position on rejection/no movement. A request already at its reachable goal is a successful stationary arrival. Validate input before using it. Legacy callers without callback continue to work. This is not a position acknowledgement/replay protocol.

Server tests must use real World/entities without DB: single manual click around mountain corner completes without a second request; blocked endpoint finishes safely; waypoint landing does not clear the rest; blocked manual route watchdog advances without AI; direct wall hold never teleports; stop/cancellation clears recovery state; autonomous collision recovery and hazard avoidance regressions stay passing. Test the factored intent helper or existing handler harness for normalization, rejection replies, and resolved goals.

## Stage C: client integration

Owner: client implementation agent, after shared API/protocol is fixed. Files: `client/src/input/movement.ts`, `pathPrediction.ts`, `moveOwnership.ts` as necessary, `clickToMove.ts`, `client/src/net/intents.ts`, `client/src/render/interpolation.ts`, `players.ts`, minimal movement state changes/tests if needed.

- Remove the 600 px collision-deflected prediction target. Keyboard prediction uses the current normalized input direction each frame, with `speed * dt`, through `movePlayerWithCollisions`. The 600 px wire target remains a compatibility horizon, supplemented with the normalized direction option. Input changes trigger a send immediately through the existing intent helper; periodic refresh remains. Dispose any active-scene callback on scene teardown.
- Do not accidentally implement variable stick speed: preserve current full movement speed for nonzero stick intent. Movement is gated by hold-still/death/transition as before.
- Click prediction uses `advancePlayerPath` and its remaining budget behavior. Use the planner's last waypoint as the local resolved goal. No direct-motion fallback on failed planning. A stationary failed local plan may still send the request so server authority can accept it.
- `sendMove` accepts the optional acknowledgement. Use a monotonically increasing local generation plus own ID/node checks; invalidate on every superseding movement/cancel path. An accepted current response confirms the server-resolved endpoint; only replan if that endpoint differs or the retained path is unusable. Rejection clears the current click and holds safely until authoritative state catches up. Update the marker to the resolved destination (currently it shows the first steering waypoint).
- Remove unconditional click A* on each player delta. Retain the route while valid. A hard authoritative snap invalidates/replans from that authoritative origin to the confirmed endpoint, only when the same click remains active. Node/death/resync clears it. No speculative old route survives transition.
- Ordinary reconciliation corrections use collision clamping from the predicted position to the corrected position, without angular deflection. If authoritative and predicted positions are separated by terrain, do not ease through it: use the existing hard correction/replan path with a safe authoritative endpoint. Keep existing backward-lead/stop grace behavior where compatible; do not increase dead zones to hide errors.
- Keep auto-combat/remote-player presentation on its existing path. Preserve moving-away-from-walls, stop responsiveness, hold-still/summon commands, and map transitions.

## Stage D: root review and acceptance

Review all changed call sites and component lifetimes, particularly stop, path completion, node changes, and stale callbacks. The smaller model must report exact files, assumptions, tests, and unresolved concerns. Do not accept changes merely because they typecheck.

Run focused new tests, `pnpm test:spatial`, server navigation/autocollision/hazard regressions, then `pnpm typecheck` and `pnpm test`. Distinguish pre-existing/environment failures from regressions; never weaken assertions to make the suite green. Check `git diff --check` and preserve unrelated work.

Live acceptance matrix (record pass/fail/not run, not inferred from tests):

| Scenario | Required observation |
|---|---|
| Open ground: WASD and reversals | Immediate heading response, normalized diagonal speed, clean release |
| Mountain wall: head-on and diagonal, 5 seconds | Head-on stop without side choice; stable tangential slide; no teleport |
| Mountain inner corner and pass | No corner clipping, oscillation, or permanent stuck state |
| Click across mountain ring | Reach resolved endpoint from one click, no pauses at every tile |
| Click inside ledge or unreachable region | Safe resolved endpoint or clear stop, no repeated wall push |
| Click then WASD/stop/auto/node change | Old callback never restores the click |
| 30/60/144 Hz and simulated network delay | No wall penetration; document correction size and remaining feel differences |
| Root/channel/death/blur/resync | Authority wins, no stale path resumes |

Do not start paid art tools or use production accounts for validation. If browser/runtime prerequisites are unavailable, finish static/focused validation and explicitly report the live acceptance gap. Do not claim the feel is verified without observation.

## Deferred work

Collision-checked long-range path smoothing, finer grid/navmesh, geometry changes, full input-sequence replay, and broad movement redesign are separate follow-ups. Changing a shared primitive for NPCs requires its own review. After implementation, create `docs/player-movement-current-state.md`, retain the design rules there, and archive this plan with a link to the live document.
