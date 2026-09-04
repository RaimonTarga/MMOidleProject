# Boss Encounter Redesign — Implementation Plan and Design Template

> **IN PROGRESS (2026-09-04). Phases 0-7 are SHIPPED; Phase 8 (cleanup and tuning handoff) remains.**
>
> Design source: [BOSS_ENCOUNTER_REDESIGN_IMPLEMENTATION_HANDOFF_2026-09-04.md](BOSS_ENCOUNTER_REDESIGN_IMPLEMENTATION_HANDOFF_2026-09-04.md). Live code and data remain authoritative for current behavior.
>
> **Delivered so far — see [§8 Phased delivery](#8-phased-delivery) for what each phase covered:**
>
> - Shared geometry union in `shared/src/world/groundZoneGeometry.ts` (circle / corridor / linked-circles) with containment, covering circles, bounds, nearest-exit, and segment clamping. Every runtime ground zone now carries a `geometry`, and the client view ships that same instance.
> - Step Back (`telegraphEvasion.ts`) and dynamic hazard avoidance (`dynamicHazardAvoidance.ts`) resolve containment through the shared geometry instead of their own radius maths; the Step Back escape sampler is seeded from `nearestGeometryExit`, so a corridor is answered perpendicular rather than by luck.
> - Committed charge lanes: `charge-corridor` zone kind, `publishChargeCorridor` / `reaimChargeCorridor`, and a `chargedAttack.corridor` rider that tracks for the first half of the wind-up and then commits.
> - Guardable-threat query in `server/src/systems/combat/ai/guardableThreats.ts`. `Enemy Charging` now sees generic `MonsterAbility` damage casts as well as charged attacks, and still ignores utility casts.
> - Proof slice: **T1 Crag Behemoth** converted from the circular Ground Slam to the committed **Crag Charge** lane, with `chargeOnAggro` removed. Damage, cast time and cooldown carried over untouched.
> - **Phase 2 — ordered patterns, committed travel, barriers.** `MonsterDefinition.bossPattern` plus a closed step union (`cast` / `charge` / `impact` / `fault-lines` / `barrier` / `drop-barrier` / `wait` / `recovery`) in `shared/src/data/monsters/bossPatterns.ts`, run by `server/src/systems/combat/ai/bossPatterns.ts`. A running pattern OWNS its boss: rooted, ordinary attacks suppressed, AI skipped, and all teardown through one `endPattern` path.
> - **Committed travel** — the boss now physically runs its locked lane, damaging each body at most once, and ends in a visible `recovery` window mirrored onto `hasStatus.bossEffects` so the punish opportunity is legible rather than an invisible cooldown.
> - **Source-owned barriers** (`server/src/systems/combat/engine/sourceBarriers.ts`) on the existing absorb-ward pool: raise/query/clear by source, with break detection polled by the owning pattern step.
> - **Mountain T1-T4 converted.** T1 lane -> charge -> recovery; T2 adds a breakable Stoneplate barrier that staggers the boss when broken; T3 adds an endpoint-anchored Cragbreaker; T4 adds Earthshatter plus delayed fault lines and a long reset.
> - **Phase 3 — status policy, conditional payoff, shred rider.** `shared/src/systems/statusPolicy.ts` splits one question into four independent axes (harmful / cleanse policy / environmental / hard control). Cleanse now consults the policy: Heat is **immune**, Chill is **partial** (reduced, capped, never deleted), everything else is unchanged.
> - **Conditional payoff** — a `payoff` pattern step whose damage is amplified by, and which consumes, a setup status. Cleanse removes the AMPLIFICATION, not the payoff: a cleansed target still eats the Execution at its unmarked value.
> - **Chill gate** — an `apply-status` step with a `requires` clause, checked at cast start. Below the threshold the step is skipped (and recorded in `skippedStepIndexes`), not retried.
> - **Breach** — a `plating-shred` monster-ability action applying a larger dose of the caster's OWN corrosion, extracted into `server/src/systems/combat/status/platingShred.ts` and shared with the ordinary per-hit path.
> - **Converted:** Desert T2/T3/T4 (Death Sting -> window -> Execution), Cave T1 (ordinary hits erode, Breach erodes more), Tundra T3/T4 (Chill check -> Deep Freeze -> Shatter).
> - **Phase 4 — concealment, burrow/emergence, Jungle escape.** New `IsConcealed` component (`shared/src/components/targeting/isConcealed.ts`): a concealed monster leaves every target list AND is cancelled at the damage seam. Deliberately NOT `isInvulnerable`, which stays targetable — "you can see it but cannot hurt it" and "it is not there" are different lessons.
> - **Pattern steps added:** `conceal` (burrow or stealth, with deterministic `near-target` / `leash-edge` relocation) and `escape-guard` (a barrier whose break fails the retreat and banks capped Escape Instinct). `payoff`'s amplifier is now optional, so a plain telegraphed hit needs no dummy status to consume.
> - **Health gate** (`armAboveHpPct` / `armBelowHpPct`) — how a lineage STOPS doing something at low health rather than doing a new thing. Jungle's wounded frenzy is the ABSENCE of the escape cycle, not a fourth mechanic.
> - **Converted:** Cave T2/T3 (erode -> burrow -> emerge -> erupt) and Jungle T2/T3/T4 (Escape Guard -> break for a stumble, or let it vanish and ambush).
> - **Phase 5 — generalized hazards, Vent/Heat, Cataclysm.** `RuntimeToxicPool` generalized into the one persistent-hazard family with a `flavor` tag (`toxic` / `magma-vent`) and an optional `rampAccelMult`. Swamp rot and the Plague Hound death pool are provably unchanged (parity assertions run first in the suite).
> - **The Vent ACCELERATES the room's Heat** rather than minting a second Heat source — the biome already owns what Heat is, and a hazard with its own stack counter would give the player two numbers where the design has one. Standing in it heats you faster; stepping out returns you to the node baseline.
> - **A Vent is NOT auto-avoided** (`movementResponse: 'none'`). This is why avoidance keys off zone semantics rather than texture: staying is a legal, rewarded choice, and a rune dragging the player out would answer a question the encounter meant them to answer.
> - **Cataclysm** — a `oncePerLife` pattern gated to the final quarter: a long, explicitly uninterruptible cast, a room-wide blast, then recovery. Surviving it is a legitimate outcome and the fight continues.
> - **Converted:** Volcano T3 (shell + vent cycle) and T4 (the same cycle plus the Cataclysm).
> - **Phase 6 — corpses and Wasteland.** Corpses gained stable ids and a client view (`shared/src/world/corpses.ts`), broadcast on the node delta and the spectator snapshot, and omitted entirely on a node with no dead. Necromancy was previously invisible bookkeeping — bodies simply reappeared.
> - **Reservation at CAST START.** A Raise Dead claims the bodies it intends to take before it resolves, so the client can mark them and draw the tether while the wind-up runs. Claims are exclusive (two raisers cannot tether one body) and released on cancel, reset and death — a stranded claim would leave a corpse permanently marked and raisable by nobody.
> - **Converted:** Wasteland T4 — one opening entourage (Bone Crawler / Plague Hound / Carrion Vulture), selective Raise Dead on its cadence, and ONE Mass Resurrection.
> - **Phase 7 — forced movement, pull, and the Trench.** `server/src/systems/combat/damage/forcedMovement.ts` is the single entry point: push and pull share one resistance stat, one clamping path, and one reason-tagged event. Every knockback caller routes through it, so no boss writes player coordinates.
> - **Undertow** is a `pull` pattern step — a bounded, resisted, obstacle-respecting drag, never a speed buff and never a teleport. Clamped so it can never fling the player *through* the boss.
> - **Simplified:** the three Trench teaching monsters down to one lesson each (Wound / standoff / committed bite), removing nine secondary abilities between them.
> - **Converted:** Elder Trench Serpent — Wound bite → Undertow → Constrict → Devour that heals only on a landed hit, with Blood in the Water tightening gaps rather than adding attacks.
> - **Client:** corpses now render (`client/src/render/corpses.ts`) — procedural, reusing each monster's own sprite laid flat and drained, with a pulsing ring and boss-to-corpse tether for the reserved state.
> - Coverage in `server/test/bossTrenchPhase7.test.ts` and `server/test/bossCorpsesPhase6.test.ts` and `server/test/bossVolcanoPhase5.test.ts` and `server/test/bossConcealmentPhase4.test.ts` and `server/test/bossStatusPayoffPhase3.test.ts` and `server/test/bossGeometryPhase1.test.ts` (Phase 0 parity for the committed circle, the Swamp pool and node teardown; Phase 1 geometry properties, lane lock/commit, one-hit-per-lane, Step Back, and the guardable classifier).
>
> **Corrections to this plan found during implementation** — the plan is left as written below, since it is the historical record:
>
> - §5.1 calls the Forest T1 Gnarled Greatbear "the charged-attack and `Enemy Charging` compatibility reference". It is not: the Greatbear has **no `chargedAttack` at all** — its identity is `consecutiveHits: 2` plus the repeating Bestial Frenzy cast. Phase 0 parity therefore anchors on the Cave brute's committed slam (the oldest `chargedAttack.aoe` consumer) and the Toadeater's Bile Pool instead.
> - §3 lists `chargedAttack.marksTarget` among shipped capabilities. The rider exists and is implemented, but **no monster in the database uses it**, so it is untested authoring surface rather than a working reference.
> - §4.1's `GroundZoneGeometry` sketch used `Point`; the codebase type is `Vec2`, and the union is defined in terms of it.
> - §5.2's T2 Stoneplate contract says "breaking the barrier during preparation causes an early stagger". Implemented, but note the barrier is sized as a fraction of the boss's max HP and is deliberately small (6%) so sustained damage answers it — the plan's own "tests chase/contact, not one mandatory burst build" requirement rules out a barrier only a burst spike can break. The exact fraction is a **BALANCE OWNER** value.
> - Phase 1's `chargedAttack.corridor` rider was **removed** during Phase 2. It was scaffolding for the T1 proof slice; once the pattern layer landed it was a second way to author the same committed charge, with no remaining users — exactly the untested-authoring-surface trap flagged above for `marksTarget`.
> - §5.5 names the Jungle tiers "Dread-Gorger / Apex Timberclaw / Sovereign Bloodfang". Only the first exists: **`apex-timberclaw` is the T2 FOREST boss**, and the real Jungle T3/T4 are `apex-bramble-slasher` and `verdant-crown-predator`. Treated as drafting errors and the real roster converted; the Forest boss is untouched. (Same class of error as the §5.1 Greatbear claim.)
> - **A bug the plan did not anticipate, found in Phase 4.** The AI loop must skip a patterning monster entirely, or chase and leash logic fight the pattern for the same body every tick — but that also means the AI's leash check never sees these bosses, and a pattern that RELOCATES (burrow, retreat) could walk itself outside its leash and never reset. The pattern now owns its own leash and target-loss guards for its duration.
> - §5.6 says to remove Tundra's "ambient-stack damage multiplier". Done — but note this REVERSES a 2026-08-23 identity assertion (`scalesWithAmbientRamp.chargedOnly`, tested as "T4 Tundra's Collapse should feed on Chill, and only the Collapse"). A hidden multiplier on an already-unavoidable hit is the least readable escalation available, and the rule "damage never secretly scales with Chill" cannot coexist with it.
> - §5.8's opening entourage is a **third reversal of a documented locked call**: the 2026-08-23 pass removed Wasteland's opener under the rule "adds are Plains' identity". That rule is still right about WAVES, but Wasteland's mechanic is raising the dead and corpses come from kills — with no seed bodies a solo boss pull had nothing to raise until the player happened to clear ambient monsters first, so the encounter could not express its own identity in the fight it is the boss of. The invariant was therefore refined rather than exempted: **no REPEATING add wave**, with a one-shot opener at `hpPct: 1.0` allowed as a starting condition.
> - §5.7's "remove the private Heat-based boss multiplier" is a **second reversal of a documented locked call**: `scalesWithAmbientRamp` on the Caldera Sovereign was defended in the current-state doc as "for the apex of the Heat biome the ramp is the whole encounter". Heat already raises the damage the player takes, visibly, on their own status bar; an invisible boss-side multiplier on top counted the same escalation twice.
> - §5.7's "remove repeated floor/cap stokes" also removes the Heat FLOOR the T4 used to hold. Consequence worth stating plainly: Heat now sheds completely when the player disengages, where it previously could not cool below the stoked minimum. That is the point — leaving is a real answer again — but it is a live difficulty reduction pending the balance pass, on top of the Phase 3 Heat non-cleanse nerf pushing the other way.
> - §5.8's art note ("reuse death frames desaturated") assumes an asset class that **does not exist** — `MONSTER_FRAMES` is one flat sprite per monster, with no death frames anywhere. The corpse renderer therefore reuses the LIVING sprite, laid flat and drained. This turns out to be the better answer regardless: a corpse must stay identifiable as the monster it came from (the boss raises those specific bodies back), and bespoke corpse art would mean ~90 assets plus a permanent tax on every monster added later, while one generic corpse sprite would throw that identity away.
> - **Three data surfaces are now dead** and are candidates for deletion in Phase 8. The `shield` BossAction (flat `drAdd` for a duration) and the `area-hit` **monster ability** action both have **no users left anywhere** — the redesign replaced every flat-DR window with either a real absorb barrier or a genuine concealment. `chargedAttack.marksTarget` still has none either (flagged in Phase 1).
> - §5.6's Tundra contract also removes Ice Armor. That deletes the lineage's only `enemyShield.shatter`, so the shatter payoff no longer has a consumer at T3/T4 — the machinery stays for Volcano's casted wards, but if no lineage ends up using `enemyShield.shatter`, it becomes dead surface worth deleting in Phase 8.
> - §4.4 specifies "lock direction at wind-up completion". The implementation locks at an authored `lockAtCastPct` **within** the wind-up (default halfway) and never re-aims after, which satisfies the requirement strictly and buys a visible commit moment before the charge starts.

## 1. Purpose and scope

This plan turns the encounter handoff into an implementation-ready design for the active T1–T4 bosses. It specifies shared engine work, encounter contracts, legacy mechanics to remove, automation and telemetry, art needs, tests, and delivery order.

It is not a tuning packet. Exact damage, timings, radii, stacks, shield sizes, health gates, and cooldowns are **BALANCE OWNER** values for later playtests.

Vocabulary:

- **FACT** — verified in the live checkout on 2026-09-04.
- **LOCKED DESIGN** — required by the source handoff.
- **PROPOSAL** — recommended implementation choice, reviewable before coding.

In scope are Mountain, Cave, Desert, Jungle, Tundra, Volcano, Wasteland, the Trench boss, the three Trench teaching monsters, and regressions for preserved Plains/Forest/Swamp identities. Out of scope are new tiers, new roster slots, new player runes, numerical balancing, and art generation in this session.

## 2. Executive decisions

1. Keep combat server-authoritative and resolve new actions through existing damage, shield, status, cast-event, death, and snapshot systems.
2. Add a small ordered encounter-pattern layer. Do not build one bespoke controller per boss or a universal scripting language.
3. Use one serialized geometry instance for rendering, hits, Step Back, avoidance, and telemetry.
4. Generalize Swamp’s persistent pool for Volcano Vents and death pools instead of adding a parallel hazard system.
5. Reuse the true enemy absorb barrier for Stoneplate and Jungle; flat damage reduction is not a substitute.
6. Split “harmful” from “cleanseable” so Heat can remain harmful but immune to ordinary Cleanse.
7. Remove superseded mechanics as part of every conversion. New sequences must not sit underneath old slams, passive evasion, vulnerability windows, or generic enrage.
8. No new base monster sprites are required. Bespoke FX are optional except Cave burrow/emergence may become required if a procedural prototype is unreadable.

## 3. Verified baseline

| Area | FACT | Design consequence |
|---|---|---|
| Boss scripts | Health phases and independent repeating actions exist; ordered multi-step cycles do not. | Add ordered patterns without replacing working phases wholesale. |
| Charged attacks | Casts already support damage, knockback, marks, control, anti-heal, self-heal, circles, pools, and fault lines. | Extend geometry/payoff gates; reuse resolution. |
| Monster abilities | Visible cast scheduling supports hits, circle hits, buffs, shields, and limited player effects. | Reuse cast events and bars; no silent mechanic timers. |
| Guard automation | `Enemy Charging` currently sees charged attacks, not all dangerous scripted casts. | Add a cross-cast guardable-threat query. |
| Ground zones | Slam, toxic-pool, and fault-line views exist; most logic assumes circles. | Generalize geometry before Mountain charge. |
| Persistent hazards | Swamp pools already have persistence and movement-response semantics. | Generalize and keep a compatibility constructor. |
| Barriers | `enemyShield` is a true absorb pool and exposes amount/timing. | Add source ownership and a one-shot break hook. |
| Ambient ramps | Heat/Chill use node-feature status machinery; harmful cleanup can currently remove Heat. | Add explicit cleanse policy. |
| Control | Break Free already recognizes Frozen alongside other hard control. | Reuse for Deep Freeze and Constrict. |
| Kiting | Existing kiter AI maintains a catchable distance band within leash limits. | Reuse for Desert and Hadal. |
| Movement | Knockback exists; pull does not. | Generalize forced displacement, then add pull. |
| Corpses | Corpses are consumed once and risen enemies cannot make reusable corpses; corpse views/reservations do not exist. | Preserve recursion safety and add visible identity/reservation. |
| Art | All target bosses and Trench monsters have base sprites; ice and volcanic environment FX already exist. | No portrait or silhouette production dependency. |

## 4. Shared implementation architecture

### 4.1 Authoritative zone geometry

**PROPOSAL:** introduce a shared geometry union:

```ts
type GroundZoneGeometry =
  | { kind: 'circle'; center: Point; radius: number }
  | { kind: 'corridor'; start: Point; end: Point; halfWidth: number }
  | { kind: 'linked-circles'; points: Point[]; radius: number };
```

A corridor uses start/end rather than angle/length so the charge travels along the exact segment the client renders. Required shared operations are containment, nearest safe exit, bounds, and rendering. Each zone gets a stable ID.

Migration rules:

- Keep compatibility constructors such as `publishSlamTelegraph()` and `publishToxicPool()` while callers migrate.
- Never duplicate rectangle mathematics in combat, automation, and client code.
- The same geometry and zone ID must drive Step Back, dynamic avoidance, hit resolution, telemetry, and rendering.
- Fault lines may remain linked circles; they do not need a new strip shape.

### 4.2 Ordered encounter patterns

Add `BossPattern` data and a server-only active-pattern component with ordered `cast`, `action`, `wait`, and `recovery` steps. A pattern owns captured target/position, step cursor, timing, and cleanup.

Runtime invariants:

- Only one primary pattern owns movement and normal-attack suppression at once.
- Every cast declares interruptible, guardable, movement-blocking, attack-blocking, and target-loss policies.
- Target position/direction is captured only where commitment is intended.
- Existing `monster-cast-start/end` events remain the cast-bar path.
- Recovery is authored visible behavior, not just cooldown residue.
- Death, leash/reset, phase replacement, and target loss clear owned zones, barriers, reservations, concealment, and movement locks.

### 4.3 Guardable threat

Add a shared query over charged attacks, monster abilities, and pattern casts. Only casts explicitly tagged `guardable` qualify for `Enemy Charging`; utility casts such as Raise Dead, stealth, transitions, and recovery do not. Expose cast name, completion time, target, optional zone ID, and valid response tags to telemetry and automation.

### 4.4 Committed movement

The generic committed-charge flow is:

1. Capture origin and target position; clamp the endpoint to valid/leashed space.
2. Publish the corridor during wind-up.
3. Lock direction at wind-up completion.
4. Travel along the segment without tracking.
5. Resolve each eligible target at most once using the same geometry.
6. Enter visible recovery.

**PROPOSAL:** hard control may interrupt wind-up; travel is committed once begun. `chargeOnAggro` is not reused because it is only a speed burst.

### 4.5 Tagged persistent hazards

Generalize `RuntimeToxicPool` to a persistent hazard carrying geometry, visual kind, tags, disposition, movement response, expiry, optional tick effect, and optional ambient-ramp modifier.

- Swamp keeps a toxic-pool wrapper and must retain behavior.
- Plague Hound uses the same family for its death pool.
- Volcano uses a `magma-vent` visual/tag that maintains/builds Heat.
- Cleanup remains owner/node/reset aware.
- Avoidance keys off semantic `movementResponse`, never texture name.

### 4.6 Barrier lifecycle

Extend existing enemy barriers with source ownership, source-specific clear, remaining-amount query, and a one-shot break result/event. Stoneplate preparation and Jungle Escape Guard use this system. No private shield HP or flat-DR imitation.

### 4.7 Status policy and payoff

Separate harmful/helpful classification, Cleanse eligibility, Break Free eligibility, environmental ownership, maximum stacks, and partial removal.

- Heat: harmful, environmental, not ordinarily cleanseable.
- Chill: harmful, environmental, partially cleanseable.
- Death Mark and Wound: harmful and cleanseable.
- Frozen and Constrict: visible hard control recognized by Break Free.

Add a generic conditional status payoff/consume rider. Desert Execution still happens after a Cleanse but loses its marked amplification; this preserves the telegraphed sequence while rewarding Cleanse.

### 4.8 Forced movement

Refactor knockback’s authoritative path into a direction-neutral forced-movement helper with collision-valid destination and reason-tagged event. Push and pull become wrappers. No boss directly rewrites player coordinates.

### 4.9 Visible corpse reservation

Give corpses stable IDs and a minimal node/spectator view. Resurrection reserves corpse IDs at cast start, marks them visually, consumes them on success, and releases them on cancellation/reset. Preserve claim-once and “risen never leave reusable corpses” invariants.

### 4.10 Specialized states

Keep distinct presence-gated components for distinct semantics:

- committed hostile travel;
- Jungle escape attempt;
- Cave burrow state;
- shared ordered-pattern cursor.

They may share movement/cast helpers, but should not become one string-switched mode component.

### 4.11 Likely code ownership map

This is a navigation map, not permission to edit every file listed:

| Responsibility | Primary live touchpoints |
|---|---|
| Encounter data contracts | `shared/src/data/monsters/types.ts`, active boss/monster definition modules |
| Boss pattern execution | `server/src/systems/combat/ai/bossScripts.ts` |
| Charged hits and riders | `server/src/systems/combat/engine/combat.ts`, `server/src/systems/combat/engine/monsterMechanics.ts` |
| Ground-zone runtime/views | `server/src/systems/world/groundZones.ts`, `shared/src/world/groundZones.ts` |
| Step Back and spatial responses | `server/src/systems/combat/ai/telegraphEvasion.ts` |
| Persistent-hazard avoidance | `server/src/systems/combat/ai/dynamicHazardAvoidance.ts`, `server/src/systems/world/pathMotion.ts` |
| Client zone presentation | `client/src/render/groundZones.ts` |
| Player/spectator propagation | `server/src/world/nodeDelta.ts`, `server/src/world/spectatorSnapshot.ts` |
| Corpse lifecycle | `server/src/systems/world/corpses.ts` plus death/raise callers |
| Source art | `art/src`, referenced through the appropriate manifest and pack process |

Prefer colocated focused tests for each helper plus encounter-level tests around the boss script/combat boundary. Re-read live paths at implementation time; modules may move before this plan is scheduled.

## 5. Boss encounter contracts

### 5.1 Preserved references

- **Plains:** preserve swarm/rally; regression-check spawn caps, ownership, and cleanup.
- **Forest T1 Greatbear:** preserve as the charged-attack and `Enemy Charging` compatibility reference.
- **Swamp:** migrate through hazard compatibility wrappers only; assert identical damage, duration, avoidance, cleanup, and presentation.
- **Art:** no new assets.

### 5.2 Mountain — committed impact

#### T1 Crag Behemoth

- Loop: wind-up → locked corridor → committed charge → large hit → pronounced recovery.
- Reuse cast events, damage pipeline, Guard, Step Back, collision/leash helpers.
- Remove `chargeOnAggro` and the circular Ground Slam that duplicates the payoff.
- A cue must distinguish “aiming” from “direction locked.”
- **Art:** none required; procedural lane, dust, impact, and recovery treatment. Debris strip optional.
- Acceptance: perpendicular movement after lock avoids it; the boss never rotates mid-charge; hit/render/Step Back share one zone ID.

#### T2 Stoneplate Juggernaut

- Loop: raise visible barrier → prepare line charge → committed charge → barrier drops or breaks → exposed recovery.
- Breaking the barrier during preparation causes an early stagger; otherwise dodge/tank and punish recovery. It tests chase/contact, not one mandatory burst build.
- Remove flat-DR repeating shield, Stoneplate Lock, circular Stunning Earthshatter, precast stun, and `chargeOnAggro`.
- **Art:** none required; current barrier plus tint/cracks. Crack overlay optional.
- Acceptance: barrier amount is visible; break fires one stagger; no barrier survives reset/recovery.

#### T3 Crag-Gorged Colossus

- Loop: committed rectangular charge → endpoint-centered circular Cragbreaker → recovery.
- Remove legacy engage speed/`chargeOnAggro` and unrelated duplicate slam loops.
- **Art:** reuse T1/T2 language.
- Acceptance: Cragbreaker centers on the captured endpoint, not the player’s later location.

#### T4 Iron-Crest Mountain King

- Loop: committed impact → Earthshatter circle → delayed fault lines → long reset.
- Remove `chargeOnAggro`, legacy engage sequence, and independent cadence finisher.
- Fault lines end the finite payoff; they are not persistent terrain.
- **Art:** reuse existing fault-line FX.

### 5.3 Cave — erosion and emergence

#### T1 Obsidian Carapace

- Basic hits build plating shred; visible Breach applies a larger dose.
- Add a generic “apply N plating-shred stacks” ability rider.
- Remove generic circle damage that does not teach erosion.
- **PROPOSAL:** retain Breach so the lineage is legible before T2 burrowing.
- **Art:** none; status and hit feedback suffice.

#### T2 Dreadbore

- Loop: erode → burrow → reserve valid emergence near target → show circle → erupt with heavy hit plus shred → recover.
- Burrow means untargetable/concealed with a visible ground marker, not flat DR.
- Step Back avoids, Guard absorbs, and tanking remains possible.
- Remove Chitin Slam, `chargeOnAggro`, Carapace Seal, and DR-only burrow.
- **Art:** **conditional/high-value new FX**: burrow-hole/trail loop and emergence burst. Procedural rings/debris are the mandatory first prototype.
- Acceptance: valid endpoint, one circle for render/hit, and reset always restores targetability.

#### T3 Deep-Core Burrower

- Continue the evolved burrow/eruption; poison/corrosion begins only after the existing defense-breach threshold.
- Remove generic Deep-Core Slam, `chargeOnAggro`, and DR-only Deep Burrow.
- **Art:** reuse/recolor T2 FX; no new base sprite.

### 5.4 Desert — mark and execution

#### T2 Dune-Stalker Emperor

- Loop: visible Death Sting → Death Mark window → charged Execution payoff/consume → reset.
- Cleanse removes the mark bonus; Execution remains visible and resolves at reduced unmarked value. Guard/tanking answers the hit.
- Remove basic slow, basic mark/marked-strike alternation, opening strike, Sandburst, and independent speed/empower phases.
- **Art:** none; overhead/status mark, cast pulse, execution trail.
- Acceptance: one mark source, one payoff, no hidden marked damage elsewhere.

#### T3 Dune-Stalker Monarch

- Loop: melee mark/execute → visible posture transition → actual catchable ranged kiter → visible melee return.
- Mark persists across posture unless cleansed.
- Remove basic slow/mark loop and generic Sandburst/Rupture filler.
- **Art:** none; posture icon/tint.
- Acceptance: behavior really changes and boss never teleports to preserve range.

#### T4 Dune-Stalker Sovereign

- Three acts: hunter melee → ranged kiter → cornered melee. Mark/Execution is the throughline.
- Transitions are named one-shot casts with recovery.
- Remove generic circle slam and unrelated enrage/cadence damage.
- **Art:** none; posture FX and cast labels carry the acts.

### 5.5 Jungle — pursuit and failed escape

Shared loop:

1. Escape Guard appears and the boss runs toward the farthest reachable leash-boundary point away from its target.
2. If the barrier breaks, retreat fails, boss stumbles, and capped Escape Instinct makes the next attempt faster.
3. If the threshold is reached, boss briefly enters visible stealth, resets Instinct without meaningful HP healing, chooses a valid re-entry point, and performs an empowered ambush.
4. Resume combat.

**PROPOSAL:** attempts recur on cooldown after an initial health gate; T4 wounded frenzy disables them. Barrier damage—not physical contact—is the test, so ranged builds remain valid. Reset clears guard, destination, stealth, instinct, and ambush.

- **T2 Dread-Gorger:** teach the plain cycle. Remove opening strike and one-shot speed-phase substitutes.
- **T3 Apex Timberclaw:** successful ambush adds venom burst/aftermath. Remove passive evasion, opening strike, Bramble Pounce, and evasion surge.
- **T4 Sovereign Bloodfang:** full cycle until low-health wounded frenzy; venom only follows successful ambush. Remove passive evasion, opening strike, always-on venom, Killing Leap, and redundant cadence burst.
- **Art:** no required asset. Procedural barrier, path, fade, re-entry ring, stumble, and tint first. Optional stealth eyes, ambush slash, venom burst, or wounded overlay; bespoke frame animation would also require client animation work.
- Acceptance: broken guard cannot finish the same escape; successful escape cannot erase meaningful progress; speed increases only to cap; reset cannot leave an invisible untargetable boss.

### 5.6 Tundra — Chill check and Shatter

Shared loop: environment builds Chill → unavoidable targeted Deep Freeze checks stacks → sufficiently chilled target becomes Frozen → large dodgeable Shatter/Collapse circle → shed meaningful Chill → reset.

- Lower-Chill targets remain mobile. Frozen targets can Break Free then Step Back; Guard/tanking remains a fallback.
- Cleanse reduces Chill but does not delete the environmental system.
- Damage never secretly scales with Chill.
- **T3 Frostbound Ancient:** base Deep Freeze → Shatter. Remove boss-hit Chill, Ice Armor/vulnerability, and generic slam.
- **T4 Glacial Worldbreaker:** larger Glacial Collapse, same response chain. Also remove ambient-stack damage multiplier.
- **Art:** none; reuse `freezing_cold`, `permafrost`, and `glacial_fracture` plus circle telegraph.
- Acceptance: Chill is captured at Freeze resolution, Frozen is visible/Break-Free compatible, and shedding fires once after payoff.

### 5.7 Volcano — Heat, Vent, catastrophe

Shared Vent contract:

- Shell owns a visible tagged magma Vent. Staying maintains/builds Heat for greater dealt and taken damage; leaving cools and lowers both.
- Heat owns escalation; no hidden boss enrage multiplier. Ordinary Cleanse does not remove Heat.
- Simmering Burn is low-damage, high-cap, long-duration, and cleanseable.
- Avoidance is optional; remaining inside/tanking is legal.

#### T3 Ember-Shelled

- Loop: normal → Shell plus Vent → stay/leave while attacking barrier → shell ends/breaks → normal.
- Remove independent Eruption and threshold Vent that duplicate the cycle.
- **Art:** none required; reuse `fumarole-crack.png` or procedural magma. Animated vent optional.

#### T4 Caldera Sovereign

- Run the full loop. Near the final quarter, begin one long, obvious, uninterruptible room-wide Cataclysm; boss stops attacking.
- Primary answer is kill before completion; a very tanky/guarded build may survive through normal damage resolution.
- Remove private Heat-based boss multiplier, generic Eruption, repeated floor/cap stokes, and unrelated enrage.
- **Art:** none required; room color grade, expanding ring, boss pulse, and cast bar. Eruption sheet optional.
- Acceptance: Shell/Vent cannot desynchronize; Cataclysm triggers once and cleans up on death/reset.

### 5.8 Wasteland — authored necromancy

#### T4 Charnel-Crown Sovereign

- Loop: one opening entourage → visible corpses → selective Raise Dead → one major-threshold Mass Resurrection → risen deaths are permanent.
- Proposed entourage: Bone Crawler as corpse fodder, Plague Hound as limited plague/death-pool pressure, Carrion Vulture as ranged support through its existing undead haste.
- Reserve corpse IDs at cast start and show glow plus boss-to-corpse tether. Consume reserved corpses on success; release on cancel/reset.
- Remove generic Charnel Burst, broad always-on boss DoT, and Deathless Tide/cadence damage competing with necromancy.
- **Art:** no creature sprites. Reuse death frames desaturated; make sigils/tethers procedural. Dedicated floor sigil optional.
- Acceptance: each corpse rises once; opening entourage never respawns; no reservation survives boss death/reset.

### 5.9 Trench teaching monsters

There are three suitable regular-monster slots; do not invent a fourth.

- **Abyssal Serpent:** one readable Abyssal Bite with non-stacking anti-heal Wound; retain hunter movement if needed. Remove extra sweep/surge/cast clutter.
- **Hadal Stalker:** actual catchable ranged kiter with one readable Pressure Lance, optionally applying modest slow/brief control. Remove mine/current/bolt layers.
- **Elder Leviathan:** one huge committed Devour-like attack with broad defenses; an uncomplicated visible carapace may remain. Remove lantern pulse/body sweep.
- **Art:** no new assets; existing sprites and projectile/current FX suffice.

### 5.10 Elder Trench Serpent

- Loop: Wound bite → announced Undertow pulls disengaged target → brief Constrict if needed → long Devour → huge damage and heal on hit → recovery.
- Wound is non-stacking, anti-heal, and cleanseable. Constrict is hard control. Undertow catches without permanent speed or teleportation.
- Answers: Cleanse; Step Back; Break Free then Step Back; Guard; tank.
- Low-health Blood in the Water tightens gaps but adds no attacks.
- Remove boss AoE, shield, Pressure/Crushing Tide/haste suite, generic slam, anti-heal spam, `chargeOnAggro`, and unrelated enrage.
- **Art:** none; strengthen existing/procedural current and constriction ring. Animated current strip optional.
- Acceptance: pull destination is valid; ranged remains viable; Devour heals only on hit and is the sole headline lethal cast.

## 6. Presentation and art workflow

Every action must visibly answer: what is happening, who is targeted, when it resolves, where danger lies, which response works, whether the response succeeded, and when recovery begins.

- Use existing cast/status language before boss-specific HUD widgets.
- Distinguish tracking from direction-locked telegraphs.
- Do not rely on hue alone; geometry, pulse, icon, and label carry meaning.
- Spectators receive the same authoritative state.
- Reserve screen-wide callouts for act changes, Mass Resurrection, and Cataclysm.

Art production matrix:

| Encounter | Base sprite | Required new FX | Optional FX |
|---|---:|---:|---|
| Mountain | Existing | None | Debris/streak strip |
| Cave | Existing | Conditional after prototype | Burrow loop + emergence burst |
| Desert | Existing | None | Execution slash |
| Jungle | Existing | None | Stealth eyes/ambush/wounded overlay |
| Tundra | Existing | None | None expected |
| Volcano | Existing | None | Animated vent/catastrophe |
| Wasteland | Existing | None | Necromancy sigil |
| Trench | Existing | None | Animated current strip |

Use PixelLab for production pixel FX requiring atlas consistency. Use Codex generation for concepts, variants, and FX-sheet references; generated output still needs pixel-art review. Store sources under `art/src`, never edit packed atlases, and before any PixelLab batch follow the sprite methodology, seed → prompt review → dry-run → approved generation flow.

## 7. Automation and telemetry

The server owns movement/rune automation; the headless bot must not implement a parallel geometry simulator.

Automation requirements:

- Step Back/avoidance consume authoritative geometry.
- `Enemy Charging` consumes guardable-threat state.
- Break Free recognizes Frozen/Constrict.
- Cleanse follows explicit policy and can partially reduce Chill.
- Targeting ignores burrowed/stealthed untargetable bosses.
- Chase continues to damage Escape Guard and catchable kiters.

Telemetry should correlate pattern instance, cast, zone, barrier source, corpse, and target. Record pattern steps/cancel, dangerous casts, zone enter/exit/hit, charge lock/contact/miss, barrier break, escape success/failure/instinct, status setup/cleanse/payoff, corpse reserve/raise, forced movement, and Cataclysm outcome.

Key metrics: named-payoff deaths, manual versus automated response success, recovery uptime, Jungle break/escape rate by archetype, Volcano Heat bands and Vent time, corpses per resurrection, and Devour hit/guard/dodge/heal rates.

## 8. Phased delivery

### Phase 0 — characterization ✅ SHIPPED 2026-09-04

- Snapshot current definitions and forbidden legacy mechanics.
- Add parity tests for Greatbear charge and Swamp pool.
- Cover death, leash/reset, target death, and node teardown.
- Establish telemetry assertions.

### Phase 1 — geometry and threats ✅ SHIPPED 2026-09-04

- Add shared geometry/stable IDs; migrate circles without behavior change.
- Route render, hit, Step Back, avoidance, and telemetry through it.
- Add corridor and guardable-threat query.
- Proof slice: T1 Crag Behemoth.

### Phase 2 — patterns, movement, barriers ✅ SHIPPED 2026-09-04

- Add ordered patterns, cast policy, recovery, teardown, committed travel, and barrier hooks.
- Convert Mountain T2–T4.

### Phase 3 — status setup/payoff ✅ SHIPPED 2026-09-04

- Add cleanse policy, conditional payoff/consume, and shred rider.
- Convert Desert, Cave T1, and Tundra.

### Phase 4 — concealment and escape ✅ SHIPPED 2026-09-04 (procedural FX only; no art authorized)

- Add Cave burrow/emergence; convert Cave T2–T3.
- Add Jungle escape, deterministic destination/re-entry, instinct, and ambush; convert Jungle.
- Review procedural Cave/Jungle FX before authorizing art spend.

### Phase 5 — hazards and Volcano ✅ SHIPPED 2026-09-04

- Generalize pools with Swamp/Plague Hound parity.
- Add Vent/Heat, Burn, Shell ownership, and Cataclysm; convert Volcano.

### Phase 6 — corpses and Wasteland ✅ SHIPPED 2026-09-04

- Add corpse identity/view/reservation.
- Add opening entourage, Raise Dead presentation, and one Mass Resurrection.

### Phase 7 — pull and Trench ✅ SHIPPED 2026-09-04

- Generalize forced movement/add pull.
- Simplify teaching monsters.
- Convert Elder Trench Serpent and Blood in the Water variant.

### Phase 8 — cleanup and tuning handoff

- Machine-check removal lists and enumerate bosses from `DUNGEON_DEFS` joined to `MONSTER_DATABASE`.
- Run targeted/full tests and human/bot playtests for melee, ranged, fragile, and tanky builds.
- Create a separate numerical tuning packet from telemetry.
- Update current-state docs after shipment and archive this plan per lifecycle.

## 9. Test matrix

Unit/property coverage:

- geometry containment/exit and valid endpoint clamping;
- one hit per committed charge;
- pattern order/cancel/teardown;
- one-shot source-owned barrier break;
- status policy combinations and payoff consumption;
- Heat non-cleanse, partial Chill cleanse;
- deterministic exclusive corpse reservation and no risen recursion;
- valid pull destinations.

Integration coverage:

- serialized client geometry equals server damage geometry;
- Step Back exits the resolving zone;
- Guard reacts to dangerous patterns, ignores utility casts;
- Mountain direction locks;
- Stoneplate/Jungle barrier transitions;
- Cave reset restores targetability;
- Desert Cleanse removes only mark payoff;
- Jungle success/failure return to normal combat;
- Tundra Break Free leaves an authored movement window;
- Volcano Shell cleanup removes Vent;
- resurrection reset releases reservations;
- Devour heals only after a hit.

Visual QA: test native zoom/UI scales/color-blind simulation, verify boundaries stay unobscured, and capture one success and one failure clip per major loop.

## 10. Per-boss implementation card

```md
### <Boss and tier>
Design source:
Dominant fantasy:
Teaching dependency:

Loop:
1. Setup —
2. Response window —
3. Payoff —
4. Recovery/reset —

Server state/components:
Existing systems reused:
New shared primitive:
Target capture/retarget policy:
Interruptibility policy:
Death/reset/leash cleanup:

Player answers: manual movement / Step Back / Guard / Break Free / Cleanse / tank or kill pressure
Legacy mechanics removed:
Client telegraph/status/callout:
Automation behavior:
Telemetry IDs/events:
Art verdict/source path:

Balance values: damage / timing / cooldown or health gate / geometry / stacks or shield
Tests:
Acceptance evidence:
```

## 11. Review gates and definition of done

Architecture:

- Shared primitives have multiple consumers or are unavoidable authoritative capabilities such as pull.
- Nothing bypasses combat/status/death/event pipelines.
- Specialized behavior is presence-gated and fully tears down.

Design:

- One dominant fantasy is apparent in play.
- Setup, answer, payoff, and recovery are visible.
- Manual and automated responses are valid; tanking remains valid where required.
- Legacy deletion list is approved.

Art:

- Existing/procedural presentation is tested first.
- Generated assets have a readability job, size/frames/palette reference, and fallback.
- Source enters the normal `art/src` manifest/pack path.

Completion:

- Targeted tests, typecheck, full suite, roster checks, and visual QA pass; unrelated failures are reported precisely.
- Human/bot evidence covers success and failure.
- Telemetry attributes deaths and responses to named steps.
- Current-state docs match shipped behavior.

## 12. Kickoff decisions

Recommended answers, to confirm before implementation:

1. Committed charge: interruptible wind-up, committed travel.
2. Cave T1: retain visible heavier-shred Breach.
3. Jungle: recurring cooldown retreats after an initial health gate; T4 frenzy disables them.
4. Desert: Cleanse removes the mark payoff but does not cancel Execution.
5. Wasteland: one major Mass Resurrection and no generic low-health nuke.
6. Cave art: decide only after the procedural prototype whether PixelLab FX are release-required.

These choices preserve the handoff’s core rule: each boss expresses one authored visible sequence instead of accumulating independent mechanics.
