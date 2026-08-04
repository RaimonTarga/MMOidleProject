# Summoner Overhaul Implementation Plan

Status: initial implementation complete on 2026-08-04; placeholder balance and
production feature-gate approval remain. Based on
`design_docs/summoner-overhaul-design-source.md` and the live repository as of
2026-08-04.

This plan treats the locked design source as authoritative. Placeholder numbers
below are only first-pass values and must remain data-driven.

## Outcome

Rebuild Conduit as an autonomous, server-authoritative formation class:

- the Conduit normally does not attack;
- the equipped weapon supplies both attack and attack-speed identity to summons;
- a formation-sized offense and proc budget is divided among living logical
  summon slots;
- summon deaths enter one deterministic reconstruction queue and reconstruction
  costs Conduit HP without being able to kill the Conduit;
- frames control formation concentration, ranges control attack/protection policy,
  and nine frame-locked specializations extend the same core contract;
- the existing Summons HUD apparatus is preserved and extended rather than
  replaced.

The core contract, reconstruction, all frames/ranges, and all nine specialization
extensions are implemented behind the existing production feature flag. The flag
should remain in place until multiplayer entity/network profiling and a focused
balance playtest pass approve the placeholder values.

Implementation verification:

- `pnpm test`: 61/61 passed;
- `pnpm typecheck`: application and balance-bench projects passed;
- `pnpm dps:report` and `pnpm ehp:report`: regenerated successfully;
- the existing Summons HUD structure was retained and its chambers now project
  logical roles plus active/queued reconstruction state.

## Repository audit

### What already fits

- `summonsMinions` presence is the Summoner behavior gate and
  `World.summonerPlayers` is the canonical live-player query.
- The `cannotAttack` marker already suppresses normal Conduit attacks.
- Summons are full ECS entities with stable numeric slots, networked identity,
  health, movement, attack state, mitigation, and server-only AI.
- Minion attacks already pass through `runPlayerAttack` as the owner while keeping
  a minion physical source for aggro and presentation. This preserves owner reward
  credit and provides a seam for a typed formation-attack wrapper.
- Gate transitions relocate living summons without recreating them.
- Monster AI and collision already support minion targets, and monster AoE already
  hits minions.
- `player:commandSummons` already provides high-level focus/move intent. No new
  real-time pet-control surface is needed.
- The player view and React HUD already join owner slot state with live minion HP.
- The Summons widget already has active, reconstructing, and waiting visual states,
  reduced-motion/background-tab protection, compact mobile presentation, and a
  chamber-per-slot visual language that scales naturally from one to nine slots.
- Existing DPS/EHP reports and the server benchmark harness provide starting
  points for balance and performance work.

### Conflicts that must be replaced

| Area | Current behavior | Required behavior |
| --- | --- | --- |
| Weapon cadence | Every minion uses an independent fixed 1,000 ms cooldown. | Each minion inherits the final weapon/player attack-speed profile, with a data-driven summon APS modifier. |
| Offense budget | Each minion proxies the owner's full attack, then frames multiply it. | Per-slot offense weights divide one formation budget; living weights determine current DPS. |
| Flat on-hit/procs | Every physical minion hit receives the owner's full flat on-hit and advances generic hit counters. | Magnitudes and trigger progress are normalized by formation contribution weights. |
| Reconstruction | Every empty slot has an independent timer; Stone Sentinel alone is sequential. | All builds use one FIFO queue and only its head reconstructs. |
| Reconstruction cost | Free. | Pay from Conduit HP based on the reconstructed slot's defensive max HP, subject to a safety floor. |
| Recovery | Minions copy owner OOC regen; no queue-scoped Conduit recovery exists. | A small fraction of OOC regen remains active in combat only while reconstruction debt exists. |
| Range | Range nodes mostly change owner stats/leash. | Close/Mid/Far select attack mode, preferred distance, summon HP, protection, and formation policy. |
| Redirection | Damage is redirected to a random living minion and raw HP is changed without dirty marking. | Deterministic selection/allocation, range-scaled protection, and one centralized minion-damage helper. |
| Specializations | Old Cave/Plains/Mountain support paths, several with shared-source and order-dependent effects. | The nine locked Light/Balanced/Heavy specializations. |
| Ability/rune combat state | Generic systems mostly inspect the owner's target and owner-only aggro. | A shared formation target/engagement adapter feeds abilities and runes without making the client authoritative. |
| Runtime persistence | Summon entities, slot timers, and queue debt are ephemeral. | Entities stay ephemeral, but logical dead-slot/queue debt should survive autosave/reconnect. |

The current random redirect in `damageSponge.ts` directly violates the locked
determinism requirement. The old 12-minion Swarm also exceeds the new exceptional
8-9 entity target.

## Compatibility and migration decisions

### Skill-tree IDs

Keep these existing IDs:

- `summoner-root`;
- `summoner-light`, `summoner-balanced`, `summoner-heavy`;
- `summoner-range-close`, `summoner-range-mid`, `summoner-range-far`;
- all nine `summoner-<frame>-t3-[abc]` IDs.

Repository tier numbers are zero-based relative to the design document: root is
tier 0, frame tier 1, range tier 2, and the design's Tier 4 specialization is the
repository's tier 3 node.

Map existing specialization IDs by closest current identity where possible:

| Existing ID | New specialization |
| --- | --- |
| `summoner-light-t3-a` | Harrier Brood |
| `summoner-light-t3-b` | Endless Swarm |
| `summoner-light-t3-c` | Volatile Brood |
| `summoner-balanced-t3-a` | Coordinated Hunt |
| `summoner-balanced-t3-b` | Withering Chorus |
| `summoner-balanced-t3-c` | Grand Ritual |
| `summoner-heavy-t3-a` | Twin Covenant |
| `summoner-heavy-t3-b` | Battle Bond |
| `summoner-heavy-t3-c` | Colossus |

The IDs are only referenced by skill data, frame children, generated reports, and
persisted `usesSkills.unlockedSkills`; no quest, client behavior, or art lookup is
hard-coded to an individual old path ID. Reusing them avoids an irreversible skill
migration. Existing characters automatically receive the mapped behavior, and the
normal altar class reset remains available if they want a different choice. Add a
temporary release note/one-time login notice rather than mutating or deleting saved
skill selections.

### Formation persistence

Persist logical formation debt, not live summon entities:

- add a nullable component-shaped `summons_minions` JSON/text column;
- save slot identities/roles, dead-slot queue order, the current head's elapsed
  progress, and any specialization state that must survive reconnect;
- never save runtime entity IDs, positions, targets, aggro, attack timestamps,
  status effects, or live summon HP;
- on attach, respawn logically living slots with fresh entities and resume dead
  slots from the saved queue/progress;
- normalize absent/old data to a full ready formation for existing characters.

This makes the migration additive and reversible. Do not ship a destructive data
rewrite. If playtesting decides that reconnect should intentionally reset the
formation, omit the DB column but keep the same serializer boundary so the policy
can change later. The recommended policy is to persist queue debt because otherwise
disconnecting avoids reconstruction HP cost.

## Core data and contracts

### Shared formation profile

Add a pure shared resolver, for example
`shared/src/systems/summonerProfile.ts`, backed by typed tuning data in
`shared/src/data/summoner.ts`.

`resolveSummonerProfile(usesSkills, finalPlayerStats)` should return:

- root/frame/range/specialization identity;
- slot count, stable slot roles, and per-slot offense/defense/proc weights;
- formation offense and defense multipliers;
- inherited attack cooldown/APS modifier;
- attack mode, attack range, preferred distance, leash, and movement policy;
- summon size, move speed, HP, plating/DR share, and protection/redirection;
- reconstruction interval, minimum interval, HP-cost ratio, safety floor, and
  queue-scoped regen ratio;
- specialization parameters and hard entity-count cap.

All numeric knobs named in section 17 of the design source belong in this data
layer. Runtime code should consume the resolved profile instead of reading dozens
of unrelated passive keys. Skill nodes continue to own player-facing names,
descriptions, and selection IDs.

Start with the design's placeholder envelope:

- root 4, Light 6, Balanced 5, Heavy 2;
- Endless Swarm 8, Colossus 1, Battle Bond 1 summon plus Conduit;
- 5,000 ms reconstruction, bounded by a configurable minimum;
- 50% of reconstructed summon max HP as cost;
- 20% Conduit max-HP safety floor;
- 20% of OOC regeneration during combat while queue debt exists.

### Logical slots and queue state

Refactor `SummonsMinions` away from parallel `minionIds[]` and
`respawnTimers[]`. Recommended shape:

```ts
interface SummonSlotState {
  slotId: string;                 // stable across entity replacement
  role: SummonSlotRole;           // normal, bonded, colossus, offense/defense twin
  entityId?: string;              // runtime only
}

interface SummonReconstruction {
  queue: string[];                // slot ids, deterministic FIFO
  active?: {
    slotId: string;
    elapsedMs: number;
    durationMs: number;
  };
}

interface SummonsMinions {
  slots: SummonSlotState[];
  reconstruction: SummonReconstruction;
  redirectCursor: number;
  formationCycle: FormationCycleState;
  // Optional specialization runtime state lives here, not TracksCombat.
  volatileBrood?: VolatileBroodState;
  coordinatedHunt?: CoordinatedHuntState;
  grandRitual?: GrandRitualState;
  battleBond?: BattleBondState;
  twinCovenant?: TwinCovenantState;
}
```

Use deterministic slot IDs such as `normal:0`, `offense:0`, `defense:0`,
`bonded:0`, and `colossus:0`. Monster debuffs that need unique summon ownership
use `ownerId + slotId`, never the transient minion entity ID. Reconciliation maps
old numeric slots to the new role layout, removes only slots no longer in the
profile, and cleans their entities/status contributions.

### Typed formation attacks and proc normalization

Add one server-side `runFormationAttack` wrapper around `runPlayerAttack`. It
must stamp a typed contribution record, not ad-hoc untyped metadata:

- owner ID;
- physical entity ID;
- logical slot ID;
- direct-damage weight;
- flat-on-hit magnitude weight;
- proc contribution weight;
- target-specific formation-cycle serial/completion;
- Battle Bond side when applicable.

The combat calculation uses:

```text
slot direct basis = owner attack * formation offense multiplier * slot offense weight
slot cadence      = final owner/weapon attack cooldown * summon APS modifier
slot flat on-hit  = owner flat on-hit * slot proc/magnitude weight
```

Equivalent active slot weights sum to the formation budget. A dead slot removes
its weight; surviving slots do not automatically inherit it. This produces the
required proportional DPS loss while retaining Light's plating vulnerability and
Heavy's concentrated hits.

Use deterministic weighted accumulators for integer/trigger effects. Add each
physical hit's proc contribution and fire one logical trigger whenever the
accumulator reaches 1.0. Key target-specific effects by owner/effect/target; key
owner buffs/counters by owner/effect. This behaves correctly when summons split
targets and avoids arbitrary "first minion this tick" ordering.

Audit and explicitly cover these live effects:

- flat `onHitDamage` and `core.onhit-mult` (scale magnitude);
- Brittle stacks and shatter threshold (weighted target accumulator);
- Flurry stacks (weighted owner accumulator; resulting final cooldown must flow
  back into summon cadence);
- chaotic dead-swing counter and its vulnerability rider (logical formation
  contribution, not every body at full rate);
- reservoir weapon DoTs (the converted pool follows weighted hit damage and must
  not gain an extra flat per-body term);
- first strike (one target opener; only the winning physical hit consumes it);
- execute and elite/boss multipliers (safe on already-budgeted slot damage);
- empowered multipliers and `weapon.empowered-mult-bonus`;
- armed Technique riders, cleave/expose/empower effects, and cast strikes;
- on-kill effects such as core mobility refund, regen burst, rites, and mobility
  boots (one kill event credited to the owner);
- summon specialization marks, DoTs, explosions, ritual charges, and Bond
  contributions.

Other archetype listeners are gated by their own component/passive presence and
do not apply to a Summoner build, but regression tests must prove the new typed
attack options leave normal player attacks unchanged.

## Server implementation stages

### Phase 0 - Characterization and safety net

Before changing behavior:

1. Add `server/test/summonerCurrentWiring.test.ts` covering class selection,
   `cannotAttack`, slot creation, spawn/cleanup, owner reward credit, command
   intent, transition relocation, minion targeting, AoE damage, and feature-flag
   expectations.
2. Add tests that expose the current fixed cooldown, full per-minion attack, random
   redirect, independent timers, and ability/rune owner-target gaps. Mark these as
   replacement tests rather than preserving the wrong values.
3. Record baseline tick time and delta bytes for 1, 10, and 25 Conduits at 4, 7,
   and 9 summons against representative monster counts.

Exit: current behavior is reproducible and cleanup/network regressions are caught.

### Phase 1 - Shared profile, logical slots, and formation attacks

Affected primary files:

- `shared/src/data/summoner.ts` (new);
- `shared/src/systems/summonerProfile.ts` and test (new);
- `shared/src/components/archetypes/summoner/summonsMinions.ts`;
- `shared/src/components/archetypes/summoner/isMinion.ts`;
- `server/src/ecs/archetypeSliceSync.ts`;
- `server/src/systems/classes/archetypes/summoner/{summonerPrototype,spawn,ai}.ts`;
- `server/src/systems/combat/engine/{combat,combatPipeline}.ts`;
- `server/src/systems/combat/damage/weaponEffects.ts`;
- `server/src/systems/player/abilities/abilityEffects.ts`.

Work:

1. Resolve one authoritative formation profile from selections/final stats.
2. Introduce stable logical slot IDs/roles and normalize old live slices.
3. Make summon cooldown inherit final weapon/player cooldown.
4. Route every summon strike through `runFormationAttack`.
5. Apply offense and flat-on-hit weights.
6. Add weighted proc accumulators and migrate the generic effects listed above.
7. Preserve `aggroSource.kind === 'minion'`, owner reward attribution, and existing
   combat FX origin.
8. Replace random protection selection with deterministic round-robin/role-aware
   allocation.

Exit tests:

- fast and slow weapons produce the correct summon APS;
- 2/4/5/6/8 equivalent slots stay within a configured formation-DPS tolerance;
- killing one slot removes its exact offense share;
- fast/light attacks remain more plating-sensitive than slow/heavy attacks;
- flat on-hit, Brittle, Flurry, chaotic misses, and ability riders do not multiply
  with entity count;
- direct attacks for non-Summoners are byte-for-byte behavior-compatible in the
  characterization cases.

### Phase 2 - Shared reconstruction and persistence

Affected primary files:

- `summonsMinions.ts` and `summonerHud.ts`;
- new `server/src/systems/classes/archetypes/summoner/reconstruction.ts`;
- `summonerPrototype.ts`, `spawn.ts`, and every raw minion-damage caller;
- `server/src/db/{schema,playerRepo}.ts` plus an additive migration;
- `server/src/world/playerLifecycle.ts`;
- `shared/src/protocol/views.ts` and network allowlist only if the component key
  changes (prefer keeping `summonsMinions`).

Work:

1. Centralize minion death handling. Same-tick deaths enqueue in stable slot order;
   deliberate deaths call the same helper.
2. Run exactly one queue head timer. A new death never inherits another slot's
   partial progress.
3. Resolve the slot's current final defensive max HP independently of offensive
   modifiers at payment time and calculate reconstruction cost from it. A defensive
   gear/profile change may change both rebuilt HP and cost; an offensive change may
   not.
4. At completion, pay HP and spawn only when the configured safety floor remains.
   Otherwise keep the head ready/blocked without discarding progress.
5. Apply the queue-scoped in-combat recovery percentage through the existing
   anti-heal-aware player healing helper. It is inactive with a full formation.
6. Sanitize/persist only logical queue debt and resume it on attach.
7. Class reset, archetype change, player death/respawn, test-room transitions, and
   profile changes explicitly normalize/clear formation state without duplicate
   entities or surprise HP charges.

Exit tests include FIFO order, one-at-a-time completion, safety-floor pause/resume,
offense-independent cost, queue-scoped regen, autosave/hydrate normalization,
disconnect exploit prevention, and all lifecycle cleanup paths.

### Phase 3 - Frames

Implement placeholder Root/Light/Balanced/Heavy profiles from the shared data:

- Root: 4 equivalent slots;
- Light: 6 small/fast/fragile slots, cheap per-slot reconstruction, lower Conduit
  defense, no free total-DPS multiplication;
- Balanced: 5 reference slots;
- Heavy: 2 large/slow/durable slots, expensive reconstruction and visibly
  concentrated hits.

Make Heavy's progression-positive result explicit in the report: compare total
offense, total summon eHP, Conduit eHP, redirect value, and reconstruction pressure,
not entity count alone. Remove the unused `summoner.minion-hp-mult` seam rather
than perpetuating two HP formulas.

Exit: count/stat allocation, loss patterns, reconstruction costs, and hard caps
match the resolved profile and stay inside balance tolerances.

### Phase 4 - Close, Mid, and Far formation policies

Split `ai.ts` into shared targeting plus small movement/attack policies, for
example `policies/close.ts`, `mid.ts`, and `far.ts`.

- Close: melee approach/guard formation, highest summon HP and protection, lower
  Conduit defense allocation.
- Mid: short-range escort orbit that repositions around the Conduit/target rather
  than merely averaging numbers.
- Far: true ranged attacks with bounded kiting, low summon HP/protection, higher
  Conduit defense allocation.

Derive reconstruction cost from the resulting slot HP. Replace root sponge plus
range additions with one resolved protection value so Heavy + Close cannot receive
full offense, maximum Conduit defense, maximum summon defense, and maximum redirect
simultaneously.

Keep the existing focus/move command. Focus overrides autonomous target choice;
move remains leash-clamped. Automatic behavior must be sufficient without either.

Exit: distance, movement, attack mode, HP, redirect, reconstruction cost, bounded
kiting, boss AoE, and Far remote-tanking tests pass for all three frames.

### Phase 5 - Three vertical-slice specializations

Implement one specialization per frame before building all nine:

1. Volatile Brood (`summoner-light-t3-c`): proves deliberate death, deterministic
   marking, explosion attribution, shared queue insertion, and a Far-range delivery
   policy. Explosion damage uses the dead slot's offense allocation, never HP.
2. Withering Chorus (`summoner-balanced-t3-b`): proves logical slot identity on
   target statuses, one stack per unique slot, group refresh, target switching,
   and reconstructed-slot contribution.
3. Twin Covenant (`summoner-heavy-t3-a`): proves asymmetric role weights,
   role-aware redirect/AI/range conversion, and bounded survivor fallback.

Put each specialization in its own module under
`server/src/systems/classes/archetypes/summoner/specs/`, registered through the
Summoner mechanic module/combat bootstrap as appropriate. Runtime state belongs on
`summonsMinions`; target effects use normal status-effect helpers and source-safe
keys.

Exit: the extension pattern handles timed, on-hit/status, role, death, network, and
UI state without adding branches to `World.tick()`.

### Phase 6 - Remaining specializations

Implement in this order:

1. Endless Swarm: 8 initially, 9 only after profiling; normalize DPS/procs and
   verify cleanup/network cost.
2. Harrier Brood: unique-slot offensive mark and focus-fire preference.
3. Coordinated Hunt: target-specific opening state plus formation cycles, not raw
   hit counts; apply anti-swap reset rules.
4. Grand Ritual: fixed interval and per-living-slot finite empowered charges;
   reconstructed slots receive no retroactive charges.
5. Colossus: one distinct large role/profile with specialization reconstruction
   rules and range-specific attacks, not just two stats added together.
6. Battle Bond last: conditionally remove `cannotAttack`, split total offense and
   proc weight between Conduit and bonded summon, add deterministic event-count Bond
   progress, and handle bonded-summon death without restoring the Conduit's full
   budget.

Each path ships with the full deterministic test list from section 19.5 of the
locked design source.

### Phase 7 - Ability, rune, targeting, and party compatibility

Add a shared server-side formation combat adapter that resolves:

- authoritative focused/primary target;
- aggregated owner-plus-summon combat state;
- owner-plus-summon aggro count;
- living/queued slot counts and reconstruction timing;
- upcoming ritual/volatile/Bond state.

Abilities:

- armed effects become one budgeted formation package, not one full rider per
  summon;
- cleave/cast effects use one synchronized event or divided weighted events whose
  sum is one ability budget;
- casts acquire a stable formation target and define whether minion attacks
  continue during wind-up (default: continue unless the ability explicitly spends
  formation attacks);
- reposition still moves the Conduit, while summons follow their range policy;
- Guards remain owner-facing unless an ability explicitly budgets formation
  defense;
- Battle Bond uses the normal player-facing adapter for the Conduit half without
  duplicating the summon half.

Runes:

- update `runeConfig.ts` and ability fire context to use aggregated formation state;
- keep existing rune syntax and actions first;
- do not add example summon-specific conditions until a locked gameplay need cannot
  be expressed through existing conditions;
- keep command intent server-validated and rate-limited as it is today.

Party effects from the removed old paths should not be preserved accidentally.
Any future party-facing specialization must use actual party membership rather than
the current broad same-node `alliesInNodeWithin` helper.

Exit: target-required abilities, N-aggro/in-combat runes, focus commands, casts,
repositions, Guards, and Battle Bond all have explicit tests.

### Phase 8 - HUD adaptation and content

Preserve `MechanicFrame`, the existing Summons title, apparatus housing, conduit
bus, chamber shapes, colors/material tokens, transitions, reduced-motion behavior,
and compact mobile row.

Adapt the existing widget:

- active chamber: keep live HP fill;
- the one queue head: use the existing purple reconstruction animation/ring;
- queued dead slots: keep dim waiting chambers and add subtle queue-order notches;
- ready but HP-blocked head: hold the completed ring and use a warning edge/glow;
- Volatile Brood: deterministic marked chamber pulse;
- Grand Ritual: finite charge pips inside each living chamber;
- Colossus: one wider/larger chamber within the same housing;
- Twin Covenant: two chambers with offense/defense inner-core treatments;
- Battle Bond: split the existing bus between a Conduit node and bonded chamber;
- Harrier/Chorus marks remain target-frame status tiles, not duplicated in the
  Summons widget.

Extend `SummonSlotView`, `PlayerView`, atoms, view model, equality helpers, and ARIA
descriptions with queue position, head progress, blocked state, role, and only the
specialization state that changes player decisions. Do not network cosmetic timers
or recompute gameplay on the client.

`SkillTreePanel` is data-driven, so node name/description/effect updates should not
change its layout or interaction. Existing minion monster sprites and current class
bodies are acceptable placeholders until mechanics and counts pass. New minion
families, path icons, and final Conduit bodies stay in the art phase and must use the
existing art pipeline; packed atlases are never edited directly.

Exit: visual review at desktop/mobile widths for 1, 2, 4, 5, 6, 8, and 9 chambers,
including full, partial, rebuilding, queued, blocked, reduced-motion, and hidden-tab
states. Client typecheck and production build pass.

### Phase 9 - Balance and performance gate

Update `tools/dps-report.ts` and `tools/ehp-report.ts` to consume the same shared
formation profile. Add reconstruction pressure, expected partial-formation uptime,
plating/overkill sensitivity, and range defense allocation. Remove the report's old
fixed-cooldown/full-attack Summoner model.

Extend the server bench with scenarios for:

- 1/10/25 concurrent Conduits;
- Root, Light, Balanced, Heavy, Endless Swarm, and Colossus;
- split targets versus focus fire;
- repeated AoE deaths and queue churn;
- worst-case 9-summon movement/collision/targeting;
- 5 Hz delta volume and client entity/render counts.

Current target selection can approach `summons x monsters`, and old Swarm adds
nested scans over owner minions for every candidate. Replace repeated global scans
with per-owner/per-node candidate lists and per-tick target-assignment counts before
allowing nine summons. Record tick CPU, event-loop p99, heap, entity count, delta
bytes, and combat-event volume.

Initial acceptance targets should be set from the Phase 0 baseline rather than
invented in this document. No normal build may exceed seven persistent entities and
no exceptional build may exceed nine without a new profiling review. If nine real
entities fail, retain eight real summons and express additional swarm density through
visual/logical proxies.

### Phase 10 - Release and documentation

1. Run `pnpm typecheck`, `pnpm test`, relevant single suites during iteration,
   `pnpm build`, `pnpm bench:server`, and the updated balance reports.
2. Keep `CONDUIT_ENABLED` off by default until the vertical-slice and performance
   gates pass; then enable it deliberately for the playtest environment.
3. Replace `docs/conduit-current-state.md` with the shipped behavior.
4. Update the design bible, game overview, rework scoreboard/roadmap, relic notes,
   and generated mechanics report.
5. Once implemented, move this plan to `docs/archive/` with the required archive
   header and keep the current-state document as living truth.

## Test organization

Use focused plain-TS suites rather than one enormous file:

- `shared/src/systems/summonerProfile.test.ts` - data/profile invariants, weights,
  caps, offense/defense separation;
- `server/test/summonerCore.test.ts` - weapon cadence, damage/proc budget, commands,
  reward attribution;
- `server/test/summonerReconstruction.test.ts` - queue, cost, floor, regen,
  persistence/lifecycle;
- `server/test/summonerFramesRanges.test.ts` - frame/range allocation and AI;
- `server/test/summonerLightSpecs.test.ts`;
- `server/test/summonerBalancedSpecs.test.ts`;
- `server/test/summonerHeavySpecs.test.ts`;
- `server/test/summonerAbilitiesRunes.test.ts`;
- `server/test/summonerNetwork.test.ts` - view projection, authoritative state,
  forged-client-state rejection, entity cleanup.

Tests should assert wiring and invariants/tolerances, not freeze placeholder balance
numbers. Use exact numbers only for queue ordering, contribution sums, count caps,
and deterministic trigger sequences.

## Answers to the design source's compatibility questions

1. **Storage:** Summoner selections live in persisted `UsesSkills`:
   `unlockedSkills`, selected class/frame/range, and `combatArchetype`. Passives are
   rebuilt from skill IDs and equipment on attach.
2. **Old path references:** the nine path IDs are present in skill-tree data/frame
   children and generated reports. No quest, client behavior, or art lookup directly
   references an individual path ID. Runtime behavior is keyed by passive flags.
3. **Reset/mapping:** preserve IDs and map behavior automatically as listed above;
   retain the existing refundable altar reset. No destructive save rewrite is
   needed.
4. **Slot serialization:** today `summonsMinions` networks parallel `minionIds[]`,
   `respawnTimers[]`, and `targetCount`; it is not saved to Postgres.
5. **Timers:** reconstruction/respawn timers are not persisted today.
6. **Battle Bond fields:** no new generic player attack slice is required. The
   existing `cannotAttack` component can be conditionally absent, but Bond needs
   Summoner archetype runtime state for offense split, contribution count, threshold,
   and linked buff/strike state.
7. **Abilities:** yes. Fire/cast/reposition logic assumes owner combat state and
   owner target. Armed riders incidentally work because the first minion proxy hit
   consumes the owner-global charge, but that is not a budgeted formation adapter.
8. **Item source identity:** generic listeners see the attacker as the owning player;
   physical minion identity is only in `metadata.aggroSource` and presentation/log
   origin. Most effects do not currently inspect it.
9. **Kill credit:** ordinary minion proxy kills grant rewards/progression to the
   owner. Existing owner-sourced AoE/DoT helpers can also grant owner credit, but new
   explosion code must use those helpers/kill hooks rather than raw HP subtraction.
10. **Debuff keys:** generic effects are usually keyed by effect ID and player
    `sourceId`; current summon effects are not consistently source-instanced. The
    overhaul must key unique contributions by owner plus logical slot.
11. **Identity survival:** current numeric `isMinion.slot` survives replacement
    conceptually, but effects use transient entities or shared IDs. The proposed
    stable `slotId` makes survival explicit and supports role changes.
12. **Client state:** the networked owner slice currently supplies count and per-slot
    active/timer data; minion entity views supply HP. It does not expose shared queue
    order, logical role, blocked payment, marks, ritual charges, or Bond state. Extend
    the same projection rather than introducing client-owned state.
13. **Placeholder art/UI:** reuse existing monster sprites, hitboxes, attack styles,
    class bodies, skill-tree layout, target status tiles, and the full Summons HUD
    apparatus through mechanics testing. Only small state treatments are needed
    before the final art pass.

## Principal risks and review gates

- **Proc semantics:** do not start specialization work until weighted generic item
  effects and abilities pass across several counts/weapons.
- **Persistence:** the additive column and sanitizer need reconnect/crash tests so
  runtime entity IDs can never be resurrected.
- **Profile changes:** unlocking a frame/range/spec while summons are alive must not
  duplicate slots, charge reconstruction HP, or leave old status contributions.
- **Battle Bond:** this is the highest-risk path because it conditionally restores
  direct player attacks and touches targeting, abilities, animation, and every proc
  budget. Keep it last.
- **Party/source isolation:** old shared IDs and same-node ally helpers are not safe
  foundations for new unique-slot effects.
- **Performance:** no nine-entity path ships on design intent alone; it must pass the
  measured server/network/client gate.
- **UI scope:** preserve the approved apparatus. Any proposal to replace it needs a
  separate visual review and is outside this implementation plan.
