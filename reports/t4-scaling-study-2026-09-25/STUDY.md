# Tier 4 scaling study and patch recommendations

2026-09-25. Assessment and isolated runtime experiments only. **No production balance changes, commit, merge, or deployment.**

## Recommendation

Use targeted ceiling reductions and a correctness repair. Do not raise every class and then buff all monsters. The tested low-upgrade characters already fail encounters that mature builds clear; increasing monster pressure would widen that problem.

| Candidate | Proposed change | Disposition |
|---|---|---|
| Voidwalker | Resolve the stored-energy discharge through normal target mitigation, and use the same damage calculation for its early-execute prediction. Preserve energy expenditure and the stored-energy identity. | Highest-priority correctness proposal; numerical repair not yet implemented/tested. |
| Berserker | `cadence.rampage-aps-per-stack-ms`: **60 → 30**. Keep threshold floor 2, damage bonus, regular-hit penalty, stack cap and overload reset. | Recommend as the first conservative numerical patch. It moderates, rather than eliminates, the strongest combinations. |
| Juggernaut | Cap Crescendo's additional finisher multiplier at **+100%**. Keep +45% over the first 15 seconds and +1 percentage point/second afterward, reaching the ceiling at 70 seconds. | Recommend a bounded tail. This is a 2× multiplier on the otherwise resolved finisher, not a 2×-ATK finisher. |
| Melter | Laser-only flat on-hit delivery: **first 30 at full value; excess at 60%**, before Catalyst amplification and target mitigation. Leave direct laser damage, heat cycle and generic proc events unchanged in this candidate. | Preferred T4 numerical candidate after rejecting uniform cuts. Needs broader weapon/ability and mitigation-parity coverage before adoption. |
| Invoker | `energy.critical-mass-gain-per-stack`: **0.20 → 0.10**; retain +20% discharge damage/stack and three-stack limit. | Modest, lower-priority proposal. Useful ceiling reduction; no evidence that every Invoker build is overpowered. |
| Devout Priest / Apprentice paths | No numerical change in this patch. | Hold. Channel delivery and high theoretical damage alone do not justify blanket reductions. |

The Melter rule is a diminishing-return curve, not a hard damage cap. For pre-Catalyst flat on-hit input `x`, use `min(x, 30) + 0.60 * max(0, x - 30)`. Its threshold is a T4 study proposal; later-tier scaling and player-facing wording need deliberate design before extending it across progression.

## Evidence and boundaries

The study completed **185 World-based observations**, plus **8 direct attack probes** and two preliminary 10-second harness smokes. Repeated controls are included in that count; they are not 185 independent statistical samples. All seven main stages have manifests, per-case receipts, timestamped damage/state samples, results and terminal completion files. **23 repeated-baseline comparisons matched** on damage, kills, elapsed time, outcome and incoming logged damage.

- Current working tree based on `ff98ba4513cb9fcb1e5752acfd56495268aff416`, using `--conditions=development`. Unrelated existing edits were preserved. `provenance.json` records close-of-study source/hitbox hashes and worktree state; it is not a pre-run seal.
- This is an exploratory, adaptive study. Followups were chosen to resolve findings; it is not a frozen experiment or a confirmation of predeclared statistical hypotheses.
- Production `World.tick` and combat bootstrap, 100 ms simulation ticks; local baked hitbox artifact; deterministic seeds 173/947 for farming. No network bots, database writes or production telemetry queries.
- Builds use existing breadth-package definitions, legal gear and skill paths, cores, relics, explicit abilities, stance and Rune policies. **No rites.** Receipts, rather than the generic package labels, identify actual gear and values.
- Both +0 and +5 retain mature biome mastery and ownership. **+0 is a lower-upgrade sensitivity, not an earned Tier 4 entry character.** No acquisition-time, affordability, or economy conclusions.
- Controlled probes pin the owner and one effectively immortal, non-attacking target in range. Owner HP is restored each tick. Actual incoming logged damage was zero. These measure damage delivery under ideal access, not survival or farming strength. Windows include 10/30/60/120 seconds; Juggernaut additionally runs to 600 seconds.
- Farming uses `node-t4-graveyard-03`, native behavior and repopulation, and a five-minute ceiling. Stops at death; no respawn. Do not compare a death-censored kill count with a full-window count as a normalized throughput result.
- Boss checks start the actual **Iron-Crest Titan** in the T4 Mountain dungeon at full player resources, after removing the guardian phase. They do not test gauntlet attrition, every T4 boss, or the late-tier ceiling. The two seeds produced identical boss outcomes and are duplicates of one deterministic encounter.
- Core/weapon swaps are mechanism probes, not a search for every class's optimal loadout or an equal-cost universal ranking. Short-target ramp, packs, terrain, party utility, PvP, and human behavior are not comprehensively covered.

## 1. Berserker: keep the identity, reduce the acceleration

Runtime Rampage simultaneously lowers the cycle threshold, subtracts milliseconds from attack delay, and strengthens finishers. Subtracting a fixed delay is particularly valuable near the attack-cooldown floor. Relic frequency/potency and buff-effect scaling add further interactions.

120-second controlled results at +5, matched baseline/candidate gear:

| Weapon / relic | Baseline DPS | 30 ms/stack DPS | Change |
|---|---:|---:|---:|
| Warmaul / Colossus Heart | 820 | 760 | -7.3% |
| Earthsunder / Colossus Heart | 1,249 | 1,238 | -0.9% |
| Deathfang / Colossus Heart | 1,660 | 1,415 | -14.8% |
| Abyssal Axe / Colossus Heart | 1,844 | 1,578 | -14.4% |
| Plague Axe / Colossus Heart | 2,491 | 2,142 | -14.0% |
| Plague Axe / Equilibrium Shard | 2,725 | 2,240 | -17.8% |
| Plague Axe / Glacial Bell | 2,861 | 2,290 | -20.0% |

This supports the proposed delay change: it reduces the fastest combinations more than a slow-weapon identity. In native +5 Plague Axe farming, both controls and candidates survived five minutes: **91 → 86** and **88 → 83** kills. The Mountain boss remained clearable, **43.1 → 43.8 seconds**.

It does not establish full parity. With Plague Axe/Glacial Bell, the current Berserker reached 2,861 DPS while comparison packages using that weapon/relic reached Wavecrest 1,546, Hemomancer 1,302 and Swiftblade 1,163. Other class stats/cores remain different, and this is sustained single-target access, not a universal ranking. Even the 30 ms candidate remains strong.

We also tested threshold floor **2 → 3**, alone and with 30 ms. The combined candidate reduced Plague/Bell to 2,013 DPS, but Warmaul fell from 820 to 660, versus 760 with speed-only. Threshold-only barely reduced Deathfang (1,660 → 1,647) while penalizing Warmaul (820 → 708). **Hold the threshold change**: its burden is less selective, and it has no paired farming/boss validation here.

Evidence: `probes` rows 30–53, `followup` rows 0–1 and 8–21, `structural`, `farm-followup` rows 4–5/10–11, `boss` rows 0–1/10–11.

## 2. Juggernaut: the unlimited tail is a separate defect in the balance envelope

Current additional finisher bonus is 45% at 15 seconds, 90% at 60 seconds, 330% at five minutes and 630% at ten minutes. It resets when `hasAttackTarget` disappears, rather than tracking a universal encounter duration. Continuous target retention is the relevant condition.

The runtime candidate limits the accumulated timer to the point corresponding to +100%; this emulates the proposed damage ceiling without changing production code. Across the ten-minute pinned-target probe, average DPS fell **1,123 → 616**. The first minute is unaffected. The actual Mountain boss clear was **149.3 seconds in both arms**: the sustained-fixture ceiling did not translate into a penalty in that native encounter.

Recommend `min(1.0, existingCrescendoBonus)` in the multiplier calculation, with truthful tooltip text. Do not cap or rewrite unrelated combat clocks. Evidence: `probes` rows 69–70 and `boss` rows 8–9/18–19.

## 3. Voidwalker: fix damage-path consistency before selecting a nerf percentage

The normal attack pipeline computes plating/DR before `onHit`. Voidwalker's empowered handler replaces that already-mitigated value with `attack * empoweredMult * storedEnergy/100`. Subsequent final-damage layers do not reapply plating/DR. Its early-execute projection also uses the raw expression.

Eight direct, real-pipeline attacks reproduced the issue. Same 727 Attack, no flat on-hit, fixed 200 stored energy for the charged probe:

| Attack | No armor | 50 plating + 40% DR |
|---|---:|---:|
| Voidwalker ordinary hit | 814 | 455 |
| Voidwalker discharge | **9,771** | **9,771** |
| Invoker ordinary hit | 814 | 455 |
| Invoker discharge | 7,813 | 4,364 |

This is a confirmed mitigation bypass, not merely an inference from large floating numbers. The nodes do not describe armor bypass as Voidwalker's identity. Proposed repair: compute its stored-energy payload through the normal direct-hit mitigation contract, and share the same projection with the early execute check. Explicitly decide how universal empowered item bonuses and relic capacity apply, exactly once; replacing the raw formula without checking that contract could introduce a different scaling error.

No candidate repair was installed, so this study does **not** predict its final DPS or validate its survivability. Preserve this finding as a separate correctness patch with focused armor, early-execute, partial-energy, overkill and empowered-item tests. Evidence: `mitigation-probe.json`; `energy/t3/pipeline/empoweredHit.ts` and `beforeAttack.ts`, plus `combat/engine/combat.ts`.

## 4. Melter: trim high investment without lowering its starting floor

The live laser delivers full flat on-hit on every firing tick. It also runs generic `onHit` events, while heat governs duty cycle. Catalyst's authored `core.onhit-mult=1.15` means **2.15× existing flat on-hit**, followed by its outgoing-damage tradeoff; it is not just 1.15× total. Deathfang supplies 30 flat on-hit at +0 and 70 at +5.

The 120-second +5 Deathfang/Catalyst probe produced 1,127 DPS. Leaving only 25% of flat on-hit reduced it to 394; **reject**. A uniform 75% coefficient produced 878, but a lower-upgrade farm seed went from 53 kills/death at 280.5 seconds to 7 kills/death at 34.7 seconds. **Reject a blanket 25% cut as this study's preferred patch.**

The preferred diminishing-return candidate preserves 30 and delivers 60% of excess: Deathfang +5's 70 becomes 54 before Catalyst. Controlled DPS: **1,127 → 900 (-20.1%)**. The tested +0 build remains **494 → 494**, and both +0 farm seeds exactly reproduced the baseline kills and death times. It preserves the tested low-upgrade behavior; it does not fix its existing deaths.

At +5, native five-minute farming stayed alive in both seeds, with **118 → 101** and **112 → 105** kills. Boss clear: **27.2 → 35.8 seconds**, still without death. This makes it a more credible ceiling adjustment than a uniform cut.

Implementation proposal: a laser-local helper at flat on-hit resolution, before core amplification and mitigation. Do not lower shared on-hit damage or Catalyst for all classes. No generic proc-frequency reduction was tested. Broader on-hit sources, buffs, alternative low-tier equipment, party benefits and future-tier scaling still need coverage.

Separate source finding: laser and holy-beam damage paths do not traverse all of the normal attack path's monster evasion/shell/cap/shield handling. This study did not run a defense-by-defense behavioral matrix for those paths; do not call that a quantified balance effect or silently change their semantics inside the numerical patch. Audit it as a separate consistency decision.

Evidence: `probes` rows 54–68, `followup` rows 4–7, `farm`, `farm-followup`, `soft`.

## 5. Invoker and the classes to leave alone

Invoker's three stacks currently increase both energy generation and discharge damage by 60%. Reducing only generation to +30% at maximum retained the recognizable hard-hitting payoff. The default +5 probe moved **1,197 → 1,099 DPS (-8.2%)**. Tested weapon swaps reduced total DPS by roughly 2–7%; relic swaps by roughly 5–10%.

Native +5 farming was mixed: **80 → 95** kills for one seed and **97 → 87** for the other, with survival unchanged. The Mountain boss moved **55.2 → 54.7 seconds**. Resource thresholds, enemy timing and movement make realized outcomes non-monotonic. Recommend this only as a modest ceiling adjustment, not as a demonstrated improvement in encounter balance. Do not also reduce discharge damage in the same first patch.

Devout Priest's +5 channel probes ranged **546–690 DPS** across Deathfang, Rimebrand and Earthsunder, versus Melter's Deathfang/Catalyst 1,127. Priest's boss clear took 95.6 seconds. There is no support here for giving it Melter's reduction.

Apprentice reference probes were Pyromancer 1,011, Firebrand 937 and Cultist 690 DPS at +5 under their respective declared packages. These are not optimized upper bounds. Cultist is target-ramp dependent, and Pyromancer's max-stack hits do not simply imply full bonus uptime in short fights. Leave their coefficients unchanged in this patch.

The weak reference outputs for Stormbringer and Destroyer are prompts for weapon/package and delivery audits, not approved floor buffs. Do not use an unfavorable fixed package to set the whole class's damage budget. Conduit was not rerun in this focused study and has no new change recommendation here.

## Delivery and verification

Suggested implementation order: **Voidwalker correctness repair; Berserker speed-only and Juggernaut cap as separate candidates; Melter's protected-floor candidate; optional Invoker generation reduction.** Keep mob values unchanged while evaluating those changes. Recheck additional T4 bosses, actual earned-entry packages, and stronger builds before merging a combined patch.

`TABLES.md` contains all observations; `summary.json` contains matched treatment comparisons and reconciliation. `summarize.py` verifies terminal counts, per-case/result identity, probe duration/no-incoming invariants, boss identity and repeated controls. Probe DPS is not the same endpoint as farm kills or boss clear time.

Validation completed: bench TypeScript check (`tsc --noEmit -p tsconfig.bench.json`), evidence reconciliation, and `git diff --check`. No full test suite, whole-product build, browser playtest, production telemetry replay, economy campaign, or live deployment was run. The focused mitigation probe reproduced behavior; it is not a regression test for a shipped repair.

Runners: `server/bench/balance/t4ScalingStudy.ts` and `t4ScalingMitigationProbe.ts`. From the repository root, the World runner is invoked as `pnpm --filter @mmo-idle/server exec tsx --conditions=development bench/balance/t4ScalingStudy.ts STAGE ../reports/FRESH-DIRECTORY`; use a fresh output directory to preserve this evidence. The separate mitigation runner currently writes to this study directory. Runtime treatment hooks affect only the process-local actors and are removed between cases. No runner remains active at delivery.
