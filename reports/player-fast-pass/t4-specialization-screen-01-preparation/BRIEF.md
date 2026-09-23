# T4 specialization screen 01 — Astra preparation handoff

**Assignment:** Astra prepares the next bounded T4 experiment; Luna executes the sealed packet and publishes the results. The command center reviews class decisions with the designer. This document is the next preparation assignment, not a claim that runnable code has already been written or combat launched.

**Allocation:** 54 production specializations × four encounter contexts × two seeds = **432 fresh observations**. One credible, legal package per specialization/context. No weapon/core/relic/stance factorial, no unannounced extra lives, and no numerical gameplay changes in this screen.

**Progression choice for this proposal:** an established, deliberately late T4 snapshot at **GM148 / 45 RP**, with **T4 ordinary gear +4** where item-specific gates permit. This corrects the prior coverage plan's GM146/+4 mismatch. It is NOT first T4 entry, first Wasteland entry, or a typical-player affordability claim.

## 1. Decisions carried forward from the completed encounter packet

Source report: `encounter-counterplay-01`, 24/24 completed at `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad`; 21 gameplay deaths, two Mountain boss kills, one ten-minute farm survivor, no operational failures. These were deliberately selected problem cases, not a random game-wide sample.

| Finding | Command-center disposition for subsequent preparation |
|---|---|
| J1: Light Striker, Jungle, Mountain armor +3 | Retain as a better-tested reference option; only one of two treatments survived ten minutes. Do not mark Jungle solved. |
| J2: Balanced Apprentice, same armor substitution | No general benefit established. Do not copy J1's recommendation to this frame or conclude that the root requires a buff. |
| V1: Light Striker, first Volcano, Defensive Stance | Retain as the better tested arrival posture, but both lives still died at 67.0/127.1 seconds. Improved early work is not sustainable farming. |
| M1: Balanced Apprentice, T3 Mountain, native Endure | Retain the measured package at 34/37 RP. Both kills took 80.5 s; Endure was active for the consequential Cragbreaker impact. A scoped reference, not evidence that Endure is balanced or mandatory everywhere. |
| P1: Light Squire, T2 Plains, native Brace | Do not repeat this add-on. Both treatment lives died at 11.5 s before an add kill. Opening survival/add accessibility remains unresolved. |
| E1: Balanced Apprentice, T3 Volcano, timed Detonate package | Do not adopt. Three resolutions did not produce a boss kill; the treatment died at 47.7 s before Final Eruption. This was Sweep→Detonate AND a change from custom to native Brace timing, not a pure Detonate ablation. |

The failed farming packages used only 22–25 of 36 RP. They were deliberately restricted comparisons, not demonstrated best attainable builds. Spare RP does not excuse the failure, but these observations cannot prove that the classes have exhausted their available answers. Conversely, more equipment searches are not an automatic prerequisite to discussing encounter tuning.

For E1, distinguish “Fully Afflicted, cast repeatedly” from saving burst for a finisher window. Do not label early resolution a test of reserved finishing burst. The new report records Endure active at the control's Final Eruption impact; do not repeat the older inference that it necessarily expired before impact. Do not invent a Detonate or Guard implementation bug from worse performance.

Spirit's approved four-field nerf is already integrated as `d073dc19c4f9df9c90b4661899d2454972b2c5b3`. Keep it; do not reapply or request numerical approval again. Keep the original root Conduit reconstruction baseline. The published `CONDUIT_FINDING.md` describes an actual payment-floor constraint plus enemy hits/Guard cooldown gaps in the rejected faster-timer life, but does not identify a safe replacement number. No further Conduit treatment belongs here.

## 2. Current source and the animation fix

Reviewed remote `develop`: `80ecbd9d3188d9f2998a15da7e2212d1dd899b50`, parent `d073dc19c4f9df9c90b4661899d2454972b2c5b3`.

The reviewed new commit changes `client/src/render/combatFx.ts` and `server/test/playerKillLunge.test.ts`: preserve the rendered melee lunge after a killing target disappears. Its diff does not change authoritative combat, item values, hitboxes or attack cadence. Do not replay historical balance campaigns solely for this presentation change. Record the actual commit used by the new packet nonetheless.

Start from the intended committed playtest baseline with the adopted Spirit patch. Bring over existing benchmark support separately where needed; do not merge the rejected combined class-candidate branch as a convenience. Keep framed Conduit R2, accepted session handling, and native target inheritance intact.

**One bounded baseline check before sealing:** the completed report says active uncommitted Heat/Hamstring work was excluded. State the actual committed Heat accumulation/effect curve and Hamstring cadence behavior used by the new source. Do not infer that all intended local edits have shipped, or that their omission means every prior version of those mechanics was absent. If finished designer-authorized gameplay work is still elsewhere, resolve its exact committed source with the designer before measuring an affected context. Do not rewrite Heat or Hamstring, import arbitrary dirty files, or silently mix versions.

Freeze one execution SHA after preparation. Qualify and run from the same final checkout/child environment; record execution, publication and integration SHAs separately. A presentation-only diff is not grounds for another general validation campaign. A change to authoritative timing, hitbox data, shared movement or content is not to be dismissed as cosmetic.

## 3. Explicit progression snapshot — corrected, not silently clamped

The earlier `T4_COVERAGE_PLAN.md` proposed GM146 with T4 +4 gear. The inspected production formula uses the T4 mastery band 114→156:

`requiredGM(4, +4) = 114 + round((156 - 114) * 4 / 5) = 148`.

Thus GM146 permits **+3**, not +4. Do not silently downgrade applied equipment while reporting a +4 experiment, and do not modify the upgrade gate to make the plan legal.

Use this proposed corrected established profile for the new screen:

| Biome key | Mastery |
|---|---:|
| plains | 12 |
| forest | 12 |
| swamp | 18 |
| cave | 18 |
| mountain | **24** |
| jungle | 18 |
| desert | 18 |
| volcanic | 12 |
| tundra | 12 |
| graveyard | 4 |
| trench | 0 |
| **Global Mastery** | **148** |

Resolve the expected **45 RP** through production. Use actual playerTier 4 and its lawful purchased class tree; the `-t3-` suffix on specialization IDs is the code's indexing, not a grant of a T3 specialization to the wrong tier. Record any required prior boss-seal ownership explicitly. Keep ownership/mastery fixed during a life; do not auto-upgrade, re-attune or advance progression from observed rewards.

Ordinary weapon/armor/charm/boots: +4 for the selected item if structurally supported and legally paid. List any selected earlier-tier support and its exact upgrade explicitly; do not promote it to +5 by default. Cores and relics remain at their supported non-+N state, normally +0. Per-item biome mastery, recipe gates, reconstruction/evolution rules and costs remain necessary in addition to GM. A synthetic finite prior-purchase ledger establishes affordability by assumption, not farming time or a typical arrival route.

**Intentional difference from the old plan:** moving Mountain22→24 makes the planned Mountain24 relics (Equilibrium Shard and Colossus Heart) eligible. They may now be selected, after normal gate verification, when they suit the specialization. Hastebound Dial remains another eligible direction. Do not hand out all relic effects at once or force the same relic on every path. Record frequency/potency/reconstruction tradeoffs.

Trench0 remains a real ownership boundary: no Trench recipes, Disengage, Recuperate or Powering Up just because the character is T4. Do not confuse Recuperate with the separate Recuperating stance. Wasteland4 is established Wasteland, not unvisited Wasteland. Other advanced stances/abilities require their actual legal recipes, paid attunement and timing rules.

The corrected snapshot preserves the promised +4 class-capability question and includes important legal relic support. The final response presents it to the designer as the recommended checkpoint. Preparation may proceed; a designer-requested alternative should be resolved before sealing, not by changing a live packet. No simultaneous GM146/+3 arm or maximum-mastery +5 grid is authorized.

## 4. Scope and fixtures

| Block | Context | Proposed native fixture / boss | Intended response | Lives |
|---|---|---|---|---:|
| F1 | T4 Volcano farming | `node-t4-volcanic-01` | Effective AoE, plating/mitigation appropriate to actual exposure, recovery and lava avoidance under the chosen Heat source | 108 |
| F2 | T4 Tundra farming | `node-t4-tundra-01` | Elite delivery, burst defense or functional ranged control/kiting, appropriate Chill/control response | 108 |
| B1 | T4 Mountain boss | `node-t4-mountain-dungeon` / `iron-crest-titan` | Single-target work and the actual tier-specific charge/impact answer | 108 |
| B2 | T4 Wasteland boss | `node-t4-graveyard-dungeon` / `charnel-crown-sovereign` | Repeated add clearance while making meaningful boss progress | 108 |
| **Total** | **54 identities × 4 contexts × 2 seeds** | | | **432** |

Use seeds **101009 and 101033**, 100 ms World steps, ten-minute farming caps and five-minute boss caps. Farming endpoints at 300,000 and 600,000 ms; boss observations end at an authoritative kill, first death, or the fixed cap. Preserve simultaneous-terminal outcomes honestly. No respawn, refill, extra seed, retry of a gameplay failure or adaptive cap extension.

Confirm fixture IDs and boss initialization against the selected source. Use production ordinary ecology, terrain, pack behavior, status effects, enemy regeneration and summon behavior. Boss access may use the accepted synthetic boss-start harness, explicitly excluding travel/guardian acquisition; do not call guardian combat a boss attempt. Initial state must be reproducible, not changed to make a weak path win.

This is a specialization screen, not a new factorial treatment experiment. Every life is fresh on the same source; historical results are context, not 432 relabelled controls. Two identical boss outcomes under different seed labels remain duplicate scenario exposure for inference, not independent evidence of robustness.

## 5. Catalogue and build preparation — exploit the work already done

Start from the published `t4-catalogue.json` and `T4_COVERAGE_PLAN.md` under `reports/player-fast-pass/encounter-counterplay-01-preparation/`. Reconcile their 54 selectable specialization IDs with production once. Do not count alternative ranges, old reconstruction arms or naming aliases as extra classes.

Build 54 core identity templates with four declared encounter-specific loadouts, not 216 independent optimization searches. Existing credible historical packages are inputs; their older +5 gear, illegal-at-this-snapshot support or pre-patch values must not be copied silently. Correct the previous GM146 restriction instead of retaining its now-unnecessary blanket omission of Mountain relics.

### Root directions

| Root | Preparation direction |
|---|---|
| Striker | Preserve each path's cadence/on-hit/finisher or self-sustain mechanism. Use credible fast/on-hit and empowered-weapon lineages by path. Do not apply one Heavy result to all frames. |
| Squire | Mountain empowered weapons remain the starting direction for appropriate paths; channel/beam and special cast paths need their own actual delivery-compatible choices. Useful AoE for swarm contexts and single-target work for Mountain. |
| Apprentice | Preserve the designer's medium-weapon starting point for Light/Balanced and genuinely slow/high-Attack direction for Heavy, except where a specific T4 conversion/channel mechanism justifies a documented alternative. Do not copy the old fast-rapier Light rows solely because the catalogue lists them. DoT ownership/stack behavior and cast opportunity cost must be relevant to the actual path. |
| Slinger | On-hit weapons are credible references from prior measurements, not a universal theorem. Fixed-cadence/channel/high-Attack paths may need different weapons; follow actual adapters, not tooltip Attack. |
| Conduit | Use each actual formation, offense/proc weighting, replacement profile and owner contribution. Keep the accepted tuning. An on-hit build must respect weighting; a fixed large body is not merely a cosmetic variant of six bodies. |
| Spirit | Apply the approved Light/Balanced stat reductions once. Preserve Heavy's differing cadence, each specialization's energy/discharge/upkeep mechanics, and appropriate barrier support. Do not automatically prescribe more nerfs or buff Heavy to match Light. |

Use the catalogue's native range exceptions, including close Blunderbuss and Champion; otherwise retain credible close melee and mid ranged references. Do not cross all paths with close/mid/far. If a path intrinsically changes fighting distance, follow that behavior. A channel or stationary payoff must not be invalidated by compulsory Orbit; keep deliberate hazard/telegraph escape and explain its real cost. Name production IDs beside display names.

Select a legal specialist core/relic when its actual mechanic fits; otherwise use an established neutral/generalist option. Keep these choices visible. Whole-package performance cannot be assigned entirely to the class coefficient. Do not introduce a core/relic comparison just because two choices look reasonable.

**Build completion before freezing, not post-failure rescue:** each package must include a credible implementation of the designer's known encounter strategy. Do not under-equip all references merely to preserve a one-change experiment: this packet is not an ablation. Material unused RP is allowed but needs a brief reason, especially when a required response is otherwise missing. Do not require spending every last point or exhaustive optimization.

For Volcano/Wasteland, use actually delivered AoE suited to the path (Sweep, Slam, Contagion, native path effects, etc.) and appropriate sustain. Do not automatically cast a long-wind-up AoE at one target or consume a DoT payload before it has useful value. For Mountain, inspect the actual T4 sequence rather than assuming the successful T3 Endure timing transfers unchanged. Endure is allowed for a deliberate tanking package, not a mandatory universal purchase or a new nerf target within this screen.

The designer has already supplied encounter strategy families. Do not request them again. If a substantive path-specific design/automation conflict remains, return its exact ID, proposed package and one concrete question. The response is not an unallocated trial-and-error search. Astra should show the designer a concise list of genuinely new build exceptions, not demand a second full approval of all routine catalogue rows.

Wait It Out stays outside the main packet unless the designer explicitly confirms its intended behavior and authorizes its use before sealing. Do not turn waiting or an automated retreat loop into an unreported route to perfect survival. Generic low-health Flee is not part of the default references.

## 6. Runtime and evidence: reuse, do not rebuild

Reuse the existing production-backed farm/boss runners, source identities, hitbox checks, legal purchase/readback assertions and process watchdogs. Qualify the actual final execution checkout and compare applied packages there, avoiding the historical absolute-path mismatch. Construction/readback checks use zero ticks and are not counted as combat.

Carry the existing one-worker policy, operational partial-result preservation and resource limits. No hidden pilot budget. An actual source/import/receipt fault stops affected work with an explicit partial report; a valid gameplay death continues the fixed queue. Do not repair the sealed source midway. Do not leave a failed family generating hundreds of invalid repetitions.

Freeze a broad-coverage-first order: within each seed, round-robin roots, frames and paths across contexts so early partial output is useful. Avoid spending the entire opening block on one class or only its best fixture. All later observations are already declared; no observed performance may choose the remaining arms.

At preparation, output per identity/context: complete skill path, equipment IDs and upgrades, core/relic, actual stats, ability ranks and ordered triggers, stance and any switching, exact Rune rule IDs/costs, GM/mastery, RP used/free, earned ownership and initial combat state. Unsupported gates are preparation errors, not discretionary free unlocks.

### Measurements

For each farming life: survival/time, lifetime completed kills, cumulative 5/10-minute work, first-kill delay, meaningful periods without progress and terminal cause. Show recovery/waiting and active combat exposure when the current recorder supports them. A death-shortened high kills/min rate is not sustainable farming; a survivor with negligible completed work is not automatically healthy. Missing post-death endpoints remain null.

For each boss: authoritative kill and time, boss HP remaining/removed at failure, owner HP and barrier separately, add kills/first-add timing, and actual counterplay at the important phase when available. Boss pressure and add progress must not be combined into a fake boss-DPS score.

For the path's defining mechanic, use existing events/readbacks to state whether it had an opportunity and was observed. Examples include discharge/energy use, completed channels, meaningful DoT delivery, empowered/cast work and formation availability. A passive readback alone is not delivered combat benefit. Missing exclusive damage attribution stays unavailable; do not turn 54 mechanisms into 54 new telemetry projects.

Compare within a context and checkpoint, with the source fixed. Do not pool unlike biome kill rates into a class tier list. Report both seeds, failed lives and safety/output tradeoffs; no universal optimum or statistical certification from two fixed seeds.

## 7. Parallel disposition work — no additional combat allocation

T4 proceeds without requiring every T2/T3 failure to disappear. Keep a short live decision register with owner/status:

- **T2 Plains opening:** the tested +4 Light Squire still died before its first add kill with Brace. Ask which next design lever the designer prefers: earlier/reliably reachable opening adds, reduced initial boss pressure, or a specified additional player defense. Do not silently choose one or nerf the Squire root. There is unspent RP, so this is not proof of no legal build solution.
- **T3 Jungle/first Volcano farming:** retain the partial improvements and failed contexts as unresolved, not cleared. Ask for a concrete intended setup or designer playtest where the cause/expected capability remains unclear. Do not downgrade the question to “the technique activated” or prescribe another armor/Guard factorial automatically.
- **T3 Apprentice Volcano:** the repeated fully-afflicted Detonate/native-Brace package failed before the mechanic it was meant to answer. Review the existing terminal sequence for the effect of changed cast/Guard timing before proposing a revised finishing policy. The original reserved-burst/Execute-stance idea remains distinct and untested; `execute-stance` is not a missing ability. No automatic second rescue arm or numerical buff is authorized.
- **Root Conduit:** keep 3,500 ms and the published risk finding; defer a revised root-only payment/timer candidate unless separately approved. No T4 formation should inherit the rejected root-only change.

The designer's answer can authorize a separate small patch/confirmation packet. Do not splice that work into this 432-case census or make it a new requirement that delays every T4 package.

## 8. Required output and finish line

Deliver one readable report with a **54-path × four-context map**, actual gear stage, useful farming work, boss result, mechanic-expression status and major support costs. Group the explanation by root and then its most consequential paths; retain the compact per-case ledger externally/in JSON instead of printing 432 long rows in the narrative.

Astra seeds the existing-evidence column during preparation. Luna appends the new measurements and reports at most five high-priority findings and three immediate decisions. The command center then selects specific corrections. Recognize healthy specializations, persistent weak paths and broadly excessive packages. Label uncertainty: weak whole-package evidence is not automatically a root coefficient defect.

For any numerical proposal, state exact current field/value, proposed value, affected descendants and intended tradeoff. Mark it untested unless actually measured. Do not copy the old internally inconsistent Heavy energy 10→8 “faster discharge” recommendation. There is no quota of buffs or nerfs, and no automatic implementation from the report.

Class-balance closure for the playtest requires: adopted Spirit recorded; meaningful T4 farm/boss coverage with credible builds; consequential outliers and the concentrated T2/T3 failures explicitly fixed, accepted or deferred by the designer; focused regressions only for approved changes; a concise patch ledger and remaining watchlist. It does NOT require every cell to survive or every Runic combination to be optimal. No T1–T3 census replay is scheduled by this handoff.

## 9. Handoff, publication and authorization

**Astra:** prepare the corrected T4 snapshot and 54 templates/context packages, reuse the catalogue and accepted runner, freeze the source, and supply `LUNA_RUN.md` with exact verified commands, ordered manifest and applied receipts. This document selects the proposed GM148/Mountain24 direction; surface any designer-requested amendment before sealing. Raise only substantive unresolved build/source choices. No main combat, numerical patch, automatic source repair or deployment during preparation.

**Luna:** execute the sealed 432 observations once; supervise operationally, not through outcome-driven theorycrafting after every case. Preserve failures and partials. Stop at the approved total; do not spend “remaining overnight time” inventing a second campaign.

**Commit AND push** the scoped readable report and compact results/identity/manifest/applied-build/completion receipts. Verify remote accessibility and return the branch, publication SHA, measured source SHA, report path, and planned/completed/dead/failed/omitted/not-run counts. Keep bulky JSONL streams external with an inventory. A publication failure is not grounds to rerun combat. No force-push, broad branch merge, release or deployment is authorized here.

## 10. Source notes

- Attached `Encounter counterplay 01 — run 01`, measured at `7c3bf6bc0035feff0c0e432b4cda4a4e804281ad`: current measured outcome and timing claims.
- `reports/player-fast-pass/encounter-counterplay-01-preparation/{ADOPTION.md,CONDUIT_FINDING.md,T4_COVERAGE_PLAN.md,t4-catalogue.json}` on `codex/encounter-counterplay-01-packet`: integrated Spirit, scoped Conduit review, and unlaunched T4 directions. The prior GM146/+4 claim is superseded here, not treated as a completed experiment.
- Reviewed commit `80ecbd9d3188d9f2998a15da7e2212d1dd899b50`: presentation-only killing-blow lunge fix plus regression test; parent is integrated Spirit `d073dc19…`.
- `shared/src/systems/itemUpgrades.ts` and `shared/src/config/gameConfig.ts` at that reviewed source: aggregate upgrade gate and mastery calculation. Recalculate from live objects during qualification; do not rely on stale prose.
- `shared/src/runicPoints.ts`, current recipe/skill/rune/stance databases and production adapters: actual package costs and eligibility. This brief is not an unverified best-in-slot catalogue.
