# T2 Jungle Node Investigation — `node-t2-jungle-04` Engagement Collapse

Closeout date: 2026-09-10
Scope: root-cause diagnosis of the `node-t2-jungle-04` stall wall reported in
`docs/briefs/t2-focused-experiment-2026-09-10.md`, plus a fix and regression
test for the confirmed technical defect. **No balance values were changed.**

## Executive summary

The wall is a genuine engine bug, not a node-authoring or class/build problem.
A player who is below full HP with a "Recover First"-style rune equipped
(`RUNE_WAIT_FOR_REGEN_FLAG`) holds still and refuses to seek a new target until
HP returns to max. Out-of-combat HP regen was gated by a **generic** "standing
in any node-feature contact" flag, which a harmless Jungle thicket (a
`denseBush` — slow + detection only, no damage) also sets. A player who stops
to recover while standing inside a thicket therefore regenerates **zero** HP,
which means the rune never releases, which means the player never moves again.
It is a full, permanent softlock: full node population, valid pathing to every
monster, and a player that will sit motionless until the process restarts.

Every jungle T2 node has 4–6 of these thickets covering a meaningful fraction
of its area, so any jungle node can produce this softlock. The reason every
real-bot stall converged on exactly `node-t2-jungle-04` and never any sibling
node is a second, separate mechanism: `node-t2-jungle-04` is the only T2
jungle node bordering Swamp on the region map, and the auto-traverse system
pins a farming player to whichever node they are currently on for as long as
the biome has any unlocked recipe outstanding (`resolveDesiredNodeId`,
`server/src/systems/world/autoTraverse.ts`). A route that enters Jungle from
Swamp therefore spends its **entire** unlock grind on that one node with no
mechanism to ever leave it — so 100% of any regen-softlock incidents accumulate
there, even though the softlock itself has nothing to do with which node it is.

Fixed the regen-suppression check to distinguish an actual hazard (a feature
with a `damage` field — a swamp rot pool, a lava vent) from cosmetic terrain
contact (a jungle thicket). Verified: 26 in-process farm runs (Squire, Striker,
and an energy-root control, 10 sim-minutes each) and 20 one-simulated-hour
`_probeWedge2.ts` runs against `node-t2-jungle-04`, all post-fix, show **zero**
regen-softlock wedges. The requested real-bot validation then completed Squire
Balanced 3/3 and Striker Balanced 3/3 from the existing J0 checkpoints, with
normal node-04 engagement and kills on every run. `pnpm typecheck` and
`pnpm test` (150/150) are clean.

---

## 1. What the node itself looks like

Traced `node-t2-jungle-04` ("Ironvine Wall") from authoring through runtime:

- **Modifier**: `fortified` (plating ×1.2, incoming damage ×0.9 at T2 — a
  defense-only reshape, no effect on spawn count, aggro, or movement).
- **Mob density**: 40, identical to every other T2 jungle node (`fortified`
  does not touch `modifierSpawnFactor`).
- **Monster pool**: `jungle-snake` ×2 weight, `jungle-ape`, `jungle-blowdarter`
  — the same pool every T2 jungle node draws from.
- **Bush arrangement**: `ring` (6 thickets, radius 194–2166px from the
  node's spawn-adjacent centre, individually 372–434px radius) — one of four
  deterministic per-node layouts (`gauntlet`/`ring`/`cluster`/`scatter`) rolled
  from a shuffled deck across the biome's 15 nodes. Not uniquely large or
  differently authored from its siblings; `node-t2-jungle-01` (`cluster`) has
  comparable coverage.
- **Trees**: 10 small (radius ~55–90px) non-clustering trunks, deterministically
  placed with a minimum-separation constraint. No wall, no dead-end pocket, no
  broken pathing — despite the display name, there is no `blocksMovement`
  geometry associated with a jungle node beyond these small trunks.
- **Neighbors**: north=`mountain-02`, south=`jungle-03`, west=`swamp-02`,
  east=`mountain-03`. It is the **only** T2 jungle node bordering Swamp; every
  other jungle node borders only Mountain, Desert, or another jungle node.

Fresh runtime population checks agree with the authoring data: after
`ensurePopulation`, node-03 held 37 monsters (the expected `dominion` spawn
factor), node-04 held 40, and node-05 held 40. Node-04's sampled Jungle
definitions had ordinary pull/leash/wander values (snake 270/740/290, ape
240/660/250, blowdarter 250/660/250; blowdarter attack range 190), and no
special dormant state. Spawn placement accepted all samples and reported no
blocking feature geometry.

None of this is anomalous. A pathfinding/geometry audit of the node in
isolation finds nothing broken — which is itself informative: it ruled out
categories 1 ("insufficient spawns"), 2 ("unreachable/pathing-broken spawns"),
and 4 ("modifier-driven behavior") from the investigation brief before the real
mechanism was found.

## 2. Ruling out spawn/geometry causes, confirming an engagement mechanism

An in-process farm bench (`server/bench/balance/runFarm.ts`, driven via
`pnpm --filter @mmo-idle/server bench:balance -- --mode farm --node <id>`)
reproduces the live server's exact `World.tick()` — spawning, AI, movement,
combat, Recovery — without Docker/Postgres/Redis, and reports
`combat.concurrency` histograms matching the campaign's own telemetry
(`pct_in_range_0` ≈ the "unengaged" metric; `combat_uptime` ≈ fraction of time
anything is aggroed at all).

The runtime AI audit also found normal target acquisition: when the recovery
gate is not holding, `nearestEngageableMonster` returns live node-04 targets
and `steerTowardTarget` produces a path. The post-fix bot traces recorded
target switches while holding 39–40 live monsters in the node, so the monsters
were alive and targetable rather than stranded outside the engagement system.

A 5-node × 5-replicate sweep (Squire, unseeded RNG) showed **no reliable
per-node ranking** — `node-t2-jungle-04`'s mean kills/hr (170) was
*mid-to-good* among the five, and every node showed 8–20× spread across
identical replicates (e.g. `node-t2-jungle-01`: 14 to 118 kills/hr). That
ruled out "node-04's authored content is worse than its siblings" as the
primary story and pointed at something stochastic and *node-independent* in
the underlying combat/movement loop — worth chasing directly rather than by
further node-vs-node comparison.

## 3. Finding the live wedge

Instrumenting a farm run to flag "position frozen AND zero monsters aggroed"
found the state reliably: 3/3 targeted reproductions on `node-t2-jungle-04`
showed the bot going motionless with 0 HP damage, 0 movement, and 0 aggro for
the *entire remainder* of a 15-simulated-minute run (position bit-identical
across 75 consecutive ticks). This matches a **pre-existing, documented**
defect class: `docs/next-playtest-implementation-plan.md` §5.8, "the
auto-combat wedge," previously investigated on Mountain and reportedly fixed
2026-08-10 (two causes, both closed, pinned by
`server/test/navWaypointWedge.test.ts`). Running the project's own repro tool,
`server/test/_probeWedge2.ts`, against `node-t2-jungle-04` confirmed a live
wedge reproduces there too — a **third**, previously-undiscovered cause, since
the doc's own fix note says "It is not mountain-specific in principle — any
node can produce it," but jungle was never the node under test in that pass.

Live-traced the wedge with temporary instrumentation in
`updateAutoTargets`/`steerTowardTarget`/`requestNavMotion` (added, verified,
then reverted — no diagnostic code remains in the tree). The trace showed:

```
[WEDGE] loop-entry auto=true ... isMoving=false hasMovePath=false
[WEDGE]   STOPPED by RUNE_WAIT_FOR_REGEN_FLAG hp=248.24/308 inCombat=false recovery=16
```

repeating identically for the full observation window, with HP frozen at
exactly the same value for 60+ simulated seconds despite `inCombat=false` and
a non-zero `recovery` stat — both of which should produce 100% Recovery per
`server/src/systems/defense/regen/recovery.ts`'s documented contract. Cross-
referencing player position against `getJungleBushes(nodeId)` confirmed the
bot was standing 194px from a bush centre with radius 372px — **inside** it —
and `bot.hasNodeFeatureEffect` was set.

## 4. Root cause

`server/src/systems/defense/index.ts` (pre-fix):

```ts
runRecovery(world, player, dt, inCombat, player.hasNodeFeatureEffect !== undefined);
```

`hasNodeFeatureEffect` is a generic marker set whenever a player has *any*
active contact with *any* node feature (`server/src/systems/world/nodeFeatures.ts`),
including a jungle thicket (`denseBush`), which carries only
`detectionMultWhileInside` and a `statusWhileInside` slow — no `damage` field.
`runRecovery`'s `oocSuppressed` parameter exists, by its own doc comment, so
"standing in lava does not heal you" — i.e. it is meant to gate on being in an
actual hazard, not on any terrain contact whatsoever. Passing the generic
marker suppressed Recovery for a player resting in a perfectly safe bush too.

Combine that with `RUNE_WAIT_FOR_REGEN_FLAG` (`server/src/systems/combat/ai/autoTarget.ts`):
while set, the auto-combat loop calls `stopEntity` and returns *before* ever
reaching target acquisition — no movement, no new target, every tick — until
`hasHealth.hp === maxHp`. A player who stops below full HP while standing in a
thicket therefore enters a genuine fixed point: **can't move until healed,
can't heal while standing in the very thicket the player stopped in**, and
nothing in the auto-combat/movement system ever considers stepping out of a
non-blocking, non-damaging feature while that gate holds. This reproduces the
campaign's exact signature: full mob population, 0 deaths, 90%+ of samples
with zero engaged attackers, and — because nothing ever resolves it — an
eventual 12-minute "no progress" guard trip.

## 5. Why it was always `node-t2-jungle-04` and never a sibling

`server/src/systems/world/autoTraverse.ts`, `resolveDesiredNodeId`, `"mob"`
phase:

```ts
if (currentIsRelevantRegular &&
    (!currentBiomeUnlocksDone || !isNodeCleared(progression, currentNodeId))) {
  return currentNodeId;   // stay exactly where you are
}
```

While *any* biome recipe remains locked (true for the whole "farm Jungle to
level ≥ 6" tail these routes run), a player already standing on a normal node
of the target biome simply **stays there** — there is no logic anywhere in
this phase that ever re-evaluates whether the current node is still worth
farming. The node a route ends up parked on for the entire grind is decided
once, by whichever node it physically walked onto when it crossed into the
biome. `node-t2-jungle-04` is the *only* T2 jungle node bordering Swamp
(confirmed via the world map registry — every other jungle node touches only
Mountain, Desert, or another jungle node), so a route continuing a
Swamp-then-Jungle progression crosses the region border precisely there.

This is consistent with, and explains, the original campaign's finding better
than a node-authoring defect would: **every** class, frame, and weapon arm
that stalled did so at the identical node, because the traversal system never
gave any of them a chance to be anywhere else. It also explains why the
farm-bench's node-vs-node comparison (§2 above) found node-04 unremarkable in
expectation — the bug is not a property of the node's content, it's that this
one specific node is the sole recipient of 100% of the affected route's
farming time.

This traversal "never leave a node while unlocks are pending" behavior may
itself be worth a design look (a farming player currently has no escape valve
from a node that goes cold), but it is not obviously a bug in its own right —
it is plausibly intentional, to avoid node-hopping churn while a biome still
has content to teach. It is **not fixed** in this session; only the regen
softlock is, since that is the piece with an unambiguous "should never happen"
contract (out-of-combat Recovery not applying at all, forever, while
`inCombat === false`).

## 6. The fix

`server/src/systems/world/nodeFeatures.ts` — new exported helper,
`isPlayerInHazardousNodeFeature(world, player)`, which reuses the same
per-feature contact check the tick loop already computes but restricts it to
features carrying a `damage` field targeting the player (rot pools, lava
vents, the void throne) — i.e. an actual hazard, matching the "standing in
lava" intent in `runRecovery`'s own doc comment.

`server/src/systems/defense/index.ts` — `updateDefensiveSystems` now calls
`runRecovery(world, player, dt, inCombat, isPlayerInHazardousNodeFeature(world, player))`
instead of gating on the generic `hasNodeFeatureEffect` marker. Nothing else
changed: `hasNodeFeatureEffect` itself is untouched and still drives whatever
else reads it (client rendering, detection multiplier, etc.).

Regression test: `server/test/nodeFeatureRegenSuppression.test.ts` — pins (1)
that a jungle thicket sets the old generic contact marker but is *not*
reported as hazardous, (2) that Recovery actually restores HP to a player
resting in a thicket out of combat, and (3) that a real hazard (a swamp rot
pool) still suppresses OOC Recovery, so the fix cannot regress the original
"standing in lava" behavior. `pnpm test`: 150/150 passing, including this test
and the pre-existing `navWaypointWedge.test.ts`.

## 7. Before / after measurements

**Before** (pre-fix, `node-t2-jungle-04`, live-traced): 3/3 targeted
reproductions showed a permanent regen-softlock wedge (full remaining run
duration, no recovery). Ad hoc frozen-streak sampling across earlier
diagnostic runs recorded stalls up to 255 continuous simulated seconds before
truncation.

**After** (post-fix):

| Check | Runs | Result |
|---|---:|---|
| `_probeWedge2.ts node-t2-jungle-04 cooldown-root`, 1 sim-hour each | 20 | **0 live wedges**, 0 deaths |
| In-process farm bench, Squire (`cooldown-root`), 10 sim-min each | 10 | **0** below-full-HP freezes; kills 52–90 per run |
| In-process farm bench, Striker (`cadence-root`), 10 sim-min each | 10 | **0** below-full-HP freezes; kills 69–106 per run |
| In-process farm bench, control (`energy-root`), 10 sim-min each | 6 | **0** below-full-HP freezes; kills 18–107 per run |

26/26 post-fix runs show zero occurrences of the regen-softlock signature.
`nodeFeatureRegenSuppression.test.ts` mechanically confirms HP now increases
within 1 simulated second of standing in a thicket out of combat, which by
construction breaks the `RUNE_WAIT_FOR_REGEN_FLAG` deadlock the moment it
would otherwise have latched.

The focused post-fix node A/B used the same fully upgraded Squire
(`cooldown-root+cooldown-balanced`) for three 10-simulated-minute replicates
per Jungle-order control (`node-03` before, `node-04`, and `node-05` after).
The node-04 result is ordinary: its 46.2–47.5% zero-in-range share is close to
node-03's 45.7–48.6% and below node-05's 51.4–55.6%; it has 40 live mobs,
89–91 kills per hour, and no deaths. Node-03's 37 live mobs are explained by
its `dominion` spawn factor; node-04 and node-05 both hold 40. There is no
node-04-specific population or reachability collapse.

| Control | Replicates | Live mobs | Kills/hour | Zero-in-range | Combat uptime | Deaths |
|---|---:|---:|---:|---:|---:|---:|
| `node-t2-jungle-03` | 3 | 37 | 510–522 | 45.7–48.6% | 66.0–68.7% | 0 |
| `node-t2-jungle-04` | 3 | 40 | 534–546 | 46.2–47.5% | 67.2–70.2% | 0 |
| `node-t2-jungle-05` | 3 | 40 | 516–552 | 51.4–55.6% | 60.5–62.7% | 0 |

The real socket/bot validation used the exact J0 checkpoint files, the
existing Balanced routes, 25× rewards, and a 15-minute watchdog per run. It is
noncanonical progression evidence (`NON_CANONICAL_REWARD_MULTIPLIER` and
`SYNTHETIC_TIER_ENTRY` taints), not economy evidence, but it exercises the
actual bot decision loop and persistence path:

| Route | Replicates | Completed | Node-04 samples | Zero attackers | Jungle kills | Deaths |
|---|---:|---:|---:|---:|---:|---:|
| Squire Balanced | 3 | 3/3 | 318 total | 39.6% weighted | 16–17/run | 1 total |
| Striker Balanced | 3 | 3/3 | 312 total | 46.5% weighted | 16–17/run | 9 total |

All six runs observed 39–40 monsters in node-04 and target-switch activity;
none entered the prior 90–96% unengaged/no-progress signature. Squire run
durations were 4.55–7.29 minutes; Striker durations were 7.24–12.21 minutes.
The Striker deaths and slower spread are ordinary class/build evidence to
revisit later, but not the former node engagement collapse.

The 26 bench/probe runs used the in-process farm bench (`bench/balance/runFarm.ts` and the
project's existing `_probeWedge2.ts` probe) rather than the full Docker/bot
harness, because both drive the identical live-server systems
(`World.tick()`, `updateAutoTargets`, `runRecovery`) without needing
Postgres/Redis/the bot process — the same substitution the project's own
`docs/next-playtest-implementation-plan.md` §5.8 investigation used for the
original mountain wedge. The six-run bot pass above closes the remaining
socket/persistence/decision-loop gap; it confirms the same post-fix result on
the real J0-derived routes.

## 8. Secondary finding — not fixed, out of scope

Both `_probeWedge2.ts` and the farm bench's own `runFarm.ts` revive a dead bot
via `respawnPlayer` but never re-enable `usesAutocombat.auto`, which
`killPlayer` deliberately turns off on death (`server/src/systems/world/playerIncapacitation.ts`,
explicitly documented: "Resuming auto on respawn is a future opt-in setting").
That is correct behavior for a human player, who must manually resume, but a
farming *bot* should resume automatically the way the real bot harness
presumably does. Neither bench tool replicates that resume step, so any bench
measurement touching a build/node with a nonzero death rate silently truncates
at the first death for the rest of that run. This was visible once during this
investigation (`_probeWedge2.ts`, attempt 3: `hp=325/325`, `auto=false`,
permanently motionless after a respawn) and is unrelated to the regen-softlock
bug above — full HP, no rune gate involved, a different code path entirely.
Flagging it because it likely explains some of the very high run-to-run
variance seen in ad hoc farm-bench comparisons (this session's own 5-node
sweep included), not because it is part of this node's stall.

This distinction also appeared in the direct post-fix sibling probe: one
`node-t2-jungle-03` attempt reported a motionless state after a death, but its
trace was full HP with `auto=false` and an existing target/path plan. It was
not the below-full-HP, `RUNE_WAIT_FOR_REGEN_FLAG`, zero-attacker signature;
`node-t2-jungle-04` had no such post-fix wedge in three attempts, and the real
bot harness (which resumes its own auto loop) completed all six J0 validations.

## 9. What T2 evidence remains valid vs. now-confounded

**Unaffected — still valid as reported in `t2-focused-experiment-2026-09-10.md`:**
sections 2–4 and 6 of that brief (Spirit/Conduit weapon A/B, Apprentice/Slinger
Contagion A/B, Tempered-vs-Survivalist on Desert, the Conduit weapon gap).
None of that evidence touches `node-t2-jungle-04` or the regen mechanism.

**Now confounded — should be re-tested, not trusted as class/frame evidence:**
every conclusion drawn from the shape of a `node-t2-jungle-04` stall itself.
Concretely: the Squire 65% Jungle stall rate, the "Balanced frame stays weak
both times" read on Striker, and the Balanced+Ruinous/Light+Ruinous Squire
combo results in section 5 of that brief were all measured against a node that
was — for reasons having nothing to do with class, frame, or weapon — subject
to a real engine softlock for however many of those runs' bots happened to
stop below full HP inside a thicket while carrying a Recover First-style rune.
Per the source brief's own decision rule ("If the Squire/Striker wall largely
disappears after fixing `node-t2-jungle-04` ... classify the previous
frame/weapon stall results as node-confounded"): the post-fix validation in §7
above shows the wall disappears in both the bench and the small bot pass, so
those class/frame/weapon-specific stall reads should be treated as confounded
pending a new controlled treatment re-run, not as evidence about Squire,
Striker, or any specific frame/weapon combination. The bot pass here is fix
validation, not that broader balance re-test.

## Artifacts

- Fix: `server/src/systems/world/nodeFeatures.ts` (+`isPlayerInHazardousNodeFeature`),
  `server/src/systems/defense/index.ts`.
- Regression test: `server/test/nodeFeatureRegenSuppression.test.ts`.
- Existing repro tool used for validation (unmodified): `server/test/_probeWedge2.ts`.
- Real-bot validation artifacts: `C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260909t-postfix-t2-jungle-j0-validation\batch-2026-09-09T14-30-42-604Z`.
- No balance values, monster stats, node modifiers, or reward numbers were
  changed anywhere in this session.
