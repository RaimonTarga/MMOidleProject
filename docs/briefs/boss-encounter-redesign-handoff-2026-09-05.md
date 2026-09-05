# Boss Encounter Redesign — session handoff, 2026-09-05

> Resume point for a fresh context. Phases 0–7 of
> [boss-encounter-redesign-implementation-plan-2026-09-04.md](../boss-encounter-redesign-implementation-plan-2026-09-04.md)
> are shipped and pushed to `develop`. **Phase 8 is the only phase left.**
>
> Living truth for what the encounters now DO is
> [boss-encounter-rework-current-state.md](../boss-encounter-rework-current-state.md).
> This file is the working context that doc does not carry: what is unverified, what
> is deliberately unresolved, and the traps this session actually fell into.

## 1. State

All of T1–T4 runs the redesign. `pnpm typecheck` clean, `pnpm test` 140/140,
`pnpm build` clean. Everything below is on `develop`.

Shipped primitives, in the order they were built:

| Phase | Primitive | Lives in |
|---|---|---|
| 1 | Shared zone geometry (circle / corridor / linked-circles) | `shared/src/world/groundZoneGeometry.ts` |
| 1 | Guardable-threat query | `server/src/systems/combat/ai/guardableThreats.ts` |
| 2 | Ordered boss patterns + committed travel | `shared/src/data/monsters/bossPatterns.ts`, `server/src/systems/combat/ai/bossPatterns.ts` |
| 2 | Source-owned barriers | `server/src/systems/combat/engine/sourceBarriers.ts` |
| 3 | Status policy (harmful / cleanse / environmental / hard control) | `shared/src/systems/statusPolicy.ts` |
| 3 | Plating-shred rider | `server/src/systems/combat/status/platingShred.ts` |
| 4 | Concealment (burrow / stealth) | `shared/src/components/targeting/isConcealed.ts` |
| 5 | Hazard flavours + ambient-ramp acceleration | `server/src/systems/world/groundZones.ts` |
| 6 | Corpse identity, views, reservation | `shared/src/world/corpses.ts`, `server/src/systems/world/corpses.ts` |
| 7 | Forced movement (push/pull, one resistance) | `server/src/systems/combat/damage/forcedMovement.ts` |

Test suites: `bossGeometryPhase1`, `bossStatusPayoffPhase3`, `bossConcealmentPhase4`,
`bossVolcanoPhase5`, `bossCorpsesPhase6`, `bossTrenchPhase7`, plus updates to
`bossRework`, `bossEncounterRework`, `desertPairs`, `trenchMonsterAbilities`,
`wave1AbilityReadability`.

## 2. What has actually been PLAYED

This is the important column, and it is mostly empty.

| Encounter | Played? | Result |
|---|---|---|
| Mountain T1 (Crag Behemoth) | ✅ | Working after four fixes. Telegraph approved. |
| Mountain T2 (Stoneplate Juggernaut) | ✅ | Working after two more fixes. |
| Mountain T3 / T4 | ❌ | Same primitives as T1/T2 — expected fine, unverified. |
| Cave T2 (Chitinous Dreadbore) | ✅ | Mechanically worked; **presentation and geometry both broken.** Fixed 2026-09-05 — see below. T1/T3 still unplayed. |
| Desert T2 / T3 / T4 | ❌ | Mark → Execution never seen. |
| Tundra T3 / T4 | ❌ | Chill gate never seen. |
| Jungle T2 / T3 / T4 | ❌ | Escape cycle never seen. |
| Volcano T3 / T4 | ❌ | Vent trade and Cataclysm never seen. |
| Wasteland T4 | ❌ | **Corpse rendering never seen.** |
| Trench T4 + 3 teaching mobs | ❌ | Pull never seen. |

Every fix this session came from PLAY, not from tests. The tests were green
throughout. Weight that accordingly.

## 2b. Cave T2 playtest, 2026-09-05 — three fixes

The mechanic worked and read as nonsense, which is the failure mode this project keeps
producing. All three causes are now fixed and covered by `bossConcealmentPhase4`:

1. **Concealment was never networked.** `IsConcealed` is server-only — it is not in
   `NETWORKED_MONSTER_KEYS`, and `MonsterView` had no field for it. The client drew the
   boss standing in the open, then teleported it. The "ground marker" the current-state
   doc described **did not exist in any form**; nothing was ever built for it. Now on
   `HasStatus.concealed`, with `client/src/render/burrow.ts` owning the presentation.
2. **The eruption could not hit a stationary player.** `emergeGap` 150 against a
   `radius` 140, resolved by point containment — a 10px miss, guaranteed, at both
   tiers. The relocation also teleported at burrow START, so the aim was locked ~2.6s
   before impact and the 1000ms telegraph was decoration. The burrow now travels
   (`travelSpeed`), tracks until `commitAtPct`, and the gap sits inside the radius.
3. **It always surfaced due east.** The `near-target` angle sweep started at world
   angle 0 and took the first standable candidate. Deterministic, but not readable.
   Now fanned from the boss's own bearing.

Note the shape of #1 and #2: **both were invisible to a green test suite, and both were
about geometry and presentation rather than logic.** The pattern from §3 below held
exactly — the tests drove the systems that decide *what happens* and never the ones
that decide *what the player sees*.

4. **It could not catch a kiting build.** Found on the T3 retest. Underground travel
   started at 170–190px/s against a player who moves at 120, so it closed 50–70px/s —
   and both Cave burrowers WALK at ~20, meaning the burrow is their only closer. The
   gorger surfaced **606px** from a sprinting player and telegraphed onto empty floor.
   Underground speed is now 500/520, in the same family as the Mountain charges
   (470–540), and it arrives ~136px away — inside its own eruption radius.

`boss-cave-burrowed.png` is now **packed** (`pnpm art:pack`, one frame added, nothing
else changed) and shared by both Cave burrowers. Per-tier mounds are a later option;
the tiers are already separated by the sequence around them. Note the fallback path is
what the first retest actually showed — a squashed, dimmed copy of the ordinary body —
so "the burrowed sprite looks like a badly resized boss" is the tell that the atlas is
stale, not that the art is bad.

## 3. The trap that produced every playtest bug

**Four separate bugs, one root cause: probes and tests that hand-picked which
systems to run.** Each passed while the real game was broken.

1. Charge appeared to stop halfway → `hasPosition.speed` still read the boss's
   WALKING speed, so the client's interpolator crawled after it. Tests never ran a
   client.
2. Barrier held forever → the `barrier` step BLOCKED waiting for a break that never
   came. No test drove an unbroken plate to the next step.
3. Charge stopped at ~29% of its lane → `updateGroundZones` swept the telegraph
   mid-run and the travel depended on it. **No probe ran `updateGroundZones`.**
4. Cast callout stayed on the first cast → the label `Text` was created once and
   never repainted. Purely client.

**Rule for the next session: any test touching pattern behaviour drives
`world.tick(...)`, not a subset.** `bossGeometryPhase1.test.ts` now has a `tick`
helper and a full-`World.tick` case; copy that shape.

Second rule that earned its place: **mutation-check every claim.** Three tests this
session passed with the code deliberately broken, and each was rewritten as a result.
Two guards are documented as DEFENSIVE and knowingly untested (`drop-barrier`'s
watch-clear, and — before it was made load-bearing — the leash exemption).

## 4. Phase 8 — what remains

Per the plan's §8:

- **Sweep three dead data surfaces**, all now with zero users:
  - the `shield` BossAction (flat `drAdd` for a duration)
  - `chargedAttack.marksTarget`
  - the `area-hit` monster-ability action
- **Machine-check the removal lists**; enumerate bosses from `DUNGEON_DEFS` joined to
  `MONSTER_DATABASE` so nothing was missed.
- **Write the numerical tuning packet.** The big one — see §5.

## 5. Balance drift, unquantified

**No number was tuned in seven phases.** Damage, casts and cooldowns were carried
over verbatim while nearly every T1–T4 boss changed shape. Known pulls:

- **Volcano, two ways at once on the same stat.** Heat can no longer be cleansed
  (harder) but its floor is gone so it now sheds completely (easier). Neither tuned.
- Jungle lost passive evasion at all three tiers — a straight damage-uptime gain for
  players that nothing compensates.
- Trench lost `aoeAttack` on every ordinary swing, plus the periodic shield.
- Tundra lost Ice Armor and the Chill damage multiplier.
- Mountain T4 lost `cadenceFinisher`; T2 lost its pre-cast stun.
- Wasteland lost its always-on DoT but regained an opening entourage.

## 6. Four reversals of previously-locked calls

Each is recorded with reasoning in the current-state doc, not quietly dropped. If any
is wrong, that doc is where to argue with it.

1. Tundra T4's `scalesWithAmbientRamp` (Chill damage scaling) — removed.
2. Mountain T4's `cadenceFinisher` — removed.
3. Volcano's Heat scaling and stoked floor — removed.
4. Wasteland's opening entourage — **restored**, with the rule refined to "no
   REPEATING add wave" rather than exempting the boss.

## 7. Plan errors found while implementing

The plan is left as written (it is the historical record); corrections live in its
header.

- §5.1 calls the Forest T1 Greatbear the "charged-attack reference". It has **no
  `chargedAttack` at all**.
- §5.5 names Jungle tiers that do not exist; `apex-timberclaw` is the T2 **Forest**
  boss. The real roster is `jungle-dread-gorger`, `apex-bramble-slasher`,
  `verdant-crown-predator`.
- §5.8's "reuse death frames desaturated" assumes an asset class the sprite system
  does not have — there are no death frames.
- §4.1's geometry sketch used `Point`; the codebase type is `Vec2`.

## 8. Open design questions for the owner

- **Recovery fires whether or not the charge connects.** Argued as correct (the cost
  of committing, and a player who ate the hit still deserves the window). Owner has
  not objected but has questioned it once. Alternatives offered: shorter recovery on
  a hit, or surfacing the per-step labels ("Winded" / "Overextended" / "Spent")
  instead of the generic "Stunned".
- **Art budget**: ~2000 PixelLab generations available. Recommendation was to spend
  NONE on corpse bodies (procedural reuse preserves per-monster identity for free;
  bespoke would be ~90 assets plus a permanent tax). The one asset worth considering
  is a floor sigil for the reserved-corpse state — **deferred until the procedural
  version has been seen in game**, which has not happened yet.
