# Core and Relic validation — 2026-09-12

Audit of the current, dirty working tree based on `3a0c8e58e5af3e261665fa4f6d3e7806a6ef30bf`. Existing concurrent changes are included in the observed behavior. No gameplay or UI implementation was changed by this audit.

## Assessment

The basic equipment plumbing and most ordinary Core stat layers work. There are confirmed combat omissions, stale class adapters, and misleading presentation. Passing existing tests does not establish that the complete system works as designed.

The user's clarification overrides the older relic text: discrete mechanics may remain unchanged between breakpoints. Do not increase coefficients merely to force every rating to change an integer.

Design sources reviewed: `design_docs/relics-design.md`, `design_docs/CORE_DESIGN_PHILOSOPHY.md`, `docs/core-rework-design-balance-handoff.md`. Implementation context: `docs/cores-current-state.md`, `docs/relics-current-state.md`, and `docs/conduit-current-state.md`. The later Core handoff supersedes the foundation's older power bands. Live source establishes what happens, not whether a discrepancy from the user's intended design is acceptable.

## Confirmed findings

### 1. Catalyst fails on laser and Frenzy on-hit damage — high priority

Normal attacks use the correct multiplier in `server/src/systems/combat/engine/combat.ts`: existing on-hit damage is multiplied by 2.15, after plating/DR, and composes with per-shot/formation weights. Catalyst supplies nothing when the base is zero.

Two other sources bypass that path:

- `server/src/systems/classes/archetypes/reload/t3/ticks/laser.ts` adds `player.dealsDamage.onHitDamage` directly. Melter's laser receives Catalyst's attack penalty but no on-hit amplification.
- `server/src/systems/classes/archetypes/dot/t3/index.ts` adds Zealot's advertised Frenzy on-hit bonus directly to `ctx.damage`, before the common on-hit term. Catalyst never sees it.

Isolated runtime probes hold attack constant to measure the multiplier separately from the Core's attack penalty:

| Path | No Catalyst multiplier | +115% multiplier | Result |
|---|---:|---:|---|
| Normal, 100 attack + 20 on-hit | 120 | 143 | Correct |
| Laser, 100 tick damage + 20 on-hit | 120 | 120 | Missing amplification |
| Frenzy, 50 direct damage after conversion + 20 advertised on-hit | 70 | 70 | Missing amplification |

Frenzy's addition also occurs after direct-hit mitigation, but outside the common on-hit multiplier channel. The fix should route all explicitly designated on-hit damage through one semantic calculation, preserving source ownership, per-shot rules, and mitigation placement. It should not multiply arbitrary procs just because they trigger on a hit.

### 2. Catalyst is invisible in the character sheet's on-hit number — high priority

`shared/src/protocol/views.ts` publishes the raw `dealsDamage.onHitDamage`; `client/src/hud/atoms.ts` forwards that value; `client/src/ui/inventory/StatSheet.tsx` displays and adds it directly. The runtime probe's sheet input remains 20 while the normal attack actually adds 43.

The DPS estimator also ignores `core.onhit-mult`. A player can therefore see the attack penalty without the matching on-hit gain. This is a presentation defect even on the attack paths where combat is correct.

Expose the effective ordinary on-hit amount and its source breakdown. Keep temporary/per-shot effects conditional. Moving the multiplier into the raw stat without removing the combat application would double-apply it.

### 3. Summoner relic potency is unused, and previews describe the old class — high priority

`shared/src/systems/summonerProfile.ts` builds slots from frame/specialization, calls `resolveSummonerRelicProfile`, and consumes only `respawnMs.after`. It never uses `summonCount.after`. Both positive potency and negative potency are ineffective on formation count.

`resolveRelicPreview` still reads legacy `summoner.minion-count` / `minion-respawn-ms` values and defaults, rather than the current formation profile. For the balanced frame with Hastebound Dial:

| Value | Item preview | Current runtime |
|---|---|---|
| Summons | 3 → 2 | 5 |
| Reconstruction interval | 5.0s → 3.704s | 2.593s after the relic, from a 3.5s baseline |

All eight summoner relic cases have preview/runtime disagreement in the diagnostic.

This needs a design adapter, not merely assigning the returned count. The newer formation model distributes offense/defense/proc weights across logical slots. More bodies do not automatically mean more total output, and specializations deliberately use one Colossus or two distinct twins. Decide how potency magnifies these formations while preserving their identity, then use that same resolver in gameplay and previews. Until then, the current universal potency promise is false for Conduit.

### 4. Melter's replacement mechanic ignores both primary relic axes — high priority

The laser loop uses a fixed heat ceiling of 100 and its own heat gain/cooling passives in `reload/t3/ticks/laser.ts`. It does not consume the relic-adjusted ammo count or reload duration. Changing magazine/reload values therefore does not change this specialization's firing/overheat rhythm, although its relic card still promises magazine and reload changes.

A replacement mechanic needs an explicit mapping, such as frequency affecting cooling and potency affecting heat capacity, if that matches the intended design. Those are proposals, not approved numerical changes. A generic Reload preview is insufficient here.

### 5. Relic application order is wrong for Berserker's Rampage — medium priority

The relic design says to resolve the build's mechanic first, then apply the relic and round/clamp. `cadence/t3/core/rampage.ts` applies the relic to the starting threshold, rounds, then subtracts Rampage stacks.

With base threshold 5, two Rampage stacks, and Colossus Heart's −30% frequency under the current coefficient:

- Current runtime: `round(5 / 0.4) - 2 = 11`.
- Relic after the ramp: `round((5 - 2) / 0.4) = 8`.

The diagnostic reproduces 11. Resolve the intended ordering and floor policy once, including Rampage, instead of maintaining separate versions. The passive-only item preview also cannot describe the live ramped state. Reload Momentum similarly has runtime adjustments absent from the static preview, although its runtime relic ordering is correct.

### 6. Character-sheet DPS omits relic frequency across five roots — medium priority

`shared/src/systems/dpsEstimate.ts` uses pre-relic Cadence threshold, Cooldown interval, Reload magazine/reload, DoT throughput normalization, and Energy gain. It partially includes relic potency through empowered multipliers and Energy capacity, making the omission asymmetric.

In five isolated root probes, adding +35% frequency changes none of the displayed DPS results. DoT potency also fails to increase the estimator's stack throughput. The file acknowledges some omissions in its caveats, but that does not satisfy the requested equipment evaluation experience.

Use resolved class profiles for both sides of the estimate, and clearly distinguish baseline/sustained assumptions from live temporary effects. The estimate itself is not an adequate balance oracle.

### 7. Equipment comparison arrows omit Core mechanic modifiers — medium priority

`StatSheet.tsx:getItemContribs` compares `statModifiers` and upgrade bonuses only. Cores author their benefits and penalties in `mechanicEffects`; their ordinary stat contribution object is empty. Selecting a Core therefore cannot show its real attack/HP/speed changes through this calculation.

Relic text separately compares a pre-relic profile to the candidate, not the currently equipped relic to its replacement. An unequip action still displays the item's application direction. These are incomplete comparison semantics, not server equip failures.

Build a hypothetical equipment loadout through shared formulas, resolving eligibility and replacing the equipped item, then compare the two resulting profiles.

### 8. Relic presentation hides the useful class-specific information — medium priority

`client/src/ui/crafting/itemDisplay.ts:formatResolvedRelicProfile` does select a class branch; Striker text is not universally hardcoded onto every class. However, generic ratings lead the card, root labels are inconsistent, and concrete secondary buff/debuff effects are never previewed. Static root previews also miss replacement mechanics and live specialization state.

The recommended primary presentation is the actual class result:

```text
Finisher: every 4 → 3 attacks
Finisher damage: ×2.00 → ×1.75
```

For a rating that does not cross a breakpoint:

```text
Finisher: every 4 attacks — unchanged
Finisher damage: ×2.00 → ×2.10
```

Put universal ratings in secondary detail for cross-class comparison. For buff/debuff ratings, name eligible effects and their changed magnitudes, or say that the current build has no eligible effect. Do not silently broaden the registry to every buff or debuff.

## Frequency recommendation

Keep the user's rate model and intentional breakpoints:

`effective attacks = max(2, round(base attacks / (1 + frequency)))`

This is a design recommendation, not a change made by this audit. Use coefficient 1 for Cadence unless a separately justified balance decision changes it. The current coefficient 2 was explicitly added to stop small ratings rounding away; that rationale conflicts with the clarified intent. Summoner also has a coefficient 2 on count potency for the same reason, and needs reconsideration within its newer formation design.

For a four-attack starting cycle:

| Relic | Frequency | Current coefficient 2 | Proposed coefficient 1 |
|---|---:|---:|---:|
| Hastebound Dial | +35% | 2 | 3 |
| Verdant Flywheel / Virulent Hourglass | +20% | 3 | 3 |
| Equilibrium Shard | +10% | 3 | 4 |
| Haunted Prism | −10% | 5 | 4 |
| Glacial Bell / Withering Lens | −20% | 7 | 5 |
| Colossus Heart | −30% | 10 | 6 |

+100% frequency halves four attacks to two, exactly as requested. With nearest-integer rounding, the four-to-three breakpoint is just above +14.29%; three is reached before the underlying fractional value becomes exactly three. If a stricter “earn the whole reduction” policy is desired, ceiling is an alternative, but it would make small negative ratings immediately add an attack and is harsher. Nearest rounding is my recommendation.

Do not use fractional carry/alternating cycle lengths: that would make sub-breakpoint ratings affect average frequency, contrary to the requested no-change intervals.

Balance is a separate question. Ignoring secondary effects, a simple finisher cycle's average direct-hit multiplier is `1 + (finisher multiplier - 1) / attacks`. At a four-hit, ×2 baseline this is 1.25. Hastebound under coefficient 1 gives three hits at ×1.75, also 1.25: the same average damage with a different rhythm. Colossus gives six at ×2.4, approximately 1.233. These examples demonstrate meaningful trade shapes, not universal balance approval; finisher-triggered effects, short fights, armor, and specializations change their value.

## What validated successfully

- Nine existing suites passed: server `cores`, `coreRangeGate`, `coreMechanics`, `coreCombat`, `coreAuthoring`, `relics`; shared `relics`, `mechanicEffectScaling`, `relicEquipment`.
- Those cover equipment eligibility, authored cast/gates, passive folding, independent DR, Recovery's single application, Focus ownership/ramp, mobility hooks, Core swap state preservation, relic upgrade/evolution rules, and registered field scaling.
- The diagnostic equipped all eight relics on each of six balanced root fixtures, ticked real Worlds, and inspected runtime/profile values. The 40 non-summoner cases matched the selected primary quantities: Cadence threshold; Cooldown timer; Reload magazine; DoT interval/cap; Energy gain/capacity. This is not full attack-cycle or all-specialization certification.
- Normal-attack Catalyst amplification and the absence of free on-hit damage are covered by the existing runtime suite; the additional probe independently confirms 20 → 43.

The existing server relic test uses Cooldown for all eight items and checks initialization/safe timers. Shared resolver tests validate isolated arithmetic. Neither catches the stale Summoner adapter, laser omissions, or character-sheet discrepancies.

## Limits and next implementation scope

This is a source/runtime audit, not a live browser playtest or an exhaustive balance simulation. All frames/specializations, every registered effect's producer/consumer, every Technique, persistent reloads/reconnects, and long encounter power bands have not been exhaustively exercised. In particular, registered-effect-only buff/debuff scaling is intentional in the current design; absence of an unregistered effect is not automatically a wiring bug.

Suggested order: fix the common on-hit calculation and sheet reporting; settle replacement-mechanic mappings for Conduit/Melter; adopt the agreed breakpoint and ordering rules; replace static comparisons with class-resolved before/after profiles; then run specialization/encounter balance sweeps. Preserve the user's concrete design rather than compensating for broken wiring with stronger numbers.

Reproducible diagnostic: `server/test/_coreRelicAudit.ts` (intentionally excluded from the normal regression runner by its underscore prefix). Successful-run evidence: `reports/core-relic-audit-evidence.txt`. The script reports current defects; it does not assert that those defects are correct behavior. Early fixture-construction errors were corrected before the recorded successful run and are not gameplay evidence.
