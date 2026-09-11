# Tier 2 Economy / Progression Pacing Analysis

Date: 2026-09-10  
Status: measurement complete; tuning not implemented  
Scope: canonical Tier 2 entry through Plains -> Forest -> Swamp, plus controlled sensitivity arms

## Executive finding

The current Tier 2 slowdown is primarily a biome XP/mastery pacing problem, with a smaller catalyst gate layered on top. It is not primarily an essence or item-cost problem in the measured first three biomes.

The two completed canonical 1x slices took:

- Spirit Heavy: 158.564 minutes to Swamp level 12.
- Striker Balanced: 179.688 minutes to Swamp level 12.

Their route-step timelines put 150.080 minutes (94.65%) and 171.690 minutes (95.55%) respectively into active farm objectives. This includes farming for recipe/mastery thresholds and farming each biome to level 12. The pure “finish this biome to level 12” portions alone were 117.632 minutes for Spirit and 147.155 minutes for Striker.

The direct resource-block metric was only 4.734 minutes for Spirit and 4.786 minutes for Striker, or about 3% of each run. Those blocks were concentrated in the first offensive-stance unlock, which required Plains level 7 and one Alacrity catalyst. Neither completed canonical run had an essence wait. Gear operations were immediate once their mastery gates were reached, and the runs ended with large essence and catalyst reserves.

The 2x reward sensitivity confirms that the long farm portions respond nearly linearly to XP/essence rewards: Spirit reached Swamp 12 in 80.252 minutes and Striker in 97.304 minutes. Catalysts did not double, as designed. This created a new 3.861-minute Alacrity wait for the accelerated Striker reconstruct step. Therefore 2x is useful diagnostic evidence, but it is not automatically the correct shipped rate.

### Decision

The measured order of attention should be:

1. XP/mastery pacing, especially the cumulative level 10 -> 12 tail.
2. A small, targeted early-T2 catalyst adjustment if the initial stance gate is judged too opaque or if accelerated progression is a product requirement.
3. Later-tier essence and +2 -> +5 gear costs only after those gates are measured.

No class, monster, Technique, Core, stance, or weapon combat values were changed for this analysis.

## 1. Measurement design and evidence classification

### Controls

The measurement routes were added in commit `3f8ecac9783c62d326a8b5a43e1fa4a8461d5bda` and use the existing isolated experiment lifecycle. The canonical arms use real T1 Snapshot B entry data selected per class. The route stops after Swamp level 12 for the first-three-biome slice, or stops at the existing no-progress guard when a class cannot advance.

The relevant configuration was:

| Arm | Entry | Reward setting | Use in this report |
|---|---|---:|---|
| Canonical baseline | Real T1 Snapshot B, per-class | 1x debug multiplier; shipped T2 multipliers remain active | Primary economy evidence when the route completed; valid progression/survival evidence for the Squire stall |
| Reward sensitivity | Same real snapshots | 2x debug multiplier | Sensitivity evidence only; non-canonical economy treatment |
| Catalyst-primed | Synthetic zero essence, full derived T2 catalyst demand | 1x | Catalyst/progression mechanism evidence only |
| Catalyst-clean | Synthetic zero essence, zero catalysts | 1x | Matched catalyst mechanism control only |
| Full-route probe | Real Squire Snapshot B | 2x, bossless full mastery route | Direct late-route stall probe; not a completed full-gauntlet duration |

The initial malformed launch `20260910t082713z-t2-economy-pacing-baseline-2026-09-10` is classified as invalid harness output and is excluded from all measurements. It did not produce valid gameplay evidence.

### Experiment IDs

| Experiment | Purpose |
|---|---|
| `20260910t082950z-t2-economy-pacing-baseline-clean-2026-09` | Canonical 1x Squire, Striker, Spirit first-three slice |
| `20260910t084218z-t2-economy-pacing-2x-real-2026-09-10` | 2x real-snapshot sensitivity |
| `20260910t084239z-t2-economy-pacing-catalyst-primed-squire` | Synthetic catalyst-primed Squire |
| `20260910t090107z-t2-economy-pacing-catalyst-clean-squire` | Synthetic zero-catalyst Squire control |
| `20260910t102257z-t2-economy-pacing-full-2x-squire` | Bossless full-route 2x Squire probe |

All artifacts remain under `%LOCALAPPDATA%\\mmo-idle\\experiments\\<experiment-id>`. Each run contains `events.jsonl`, `summary.json`, `deaths.jsonl`, and the route configuration.

### Timing methodology

The report uses two complementary timing views:

- Route-step elapsed time is the mutually exclusive wall-clock partition. `farm` steps are further separated into recipe-directed farm and level-12 mastery farm. This is the best view for asking where the run actually spent time.
- `summary.economy.totalBlockedOnResourceMs` and `summary.biomes[].blockedOnResourceMs` are the exclusive in-node blocked metrics. The typed `blocked-on-resource` event bracket can be longer because it may include movement/transit before the bot is in the counted node. Block time is therefore diagnostic and must not be added to route-step time.

“Recipe-directed farm” means the route was actively farming until a recipe/mastery condition became available. It is still mostly XP/mastery work; it is not a separate idle resource wait.

## 2. Observed canonical 1x data

### Run outcomes

| Class / frame | Endpoint | Wall-clock | Route farm steps | Farm share | Exclusive resource block | Kills / deaths |
|---|---|---:|---:|---:|---:|---:|
| Spirit Heavy | Swamp 12, complete | 158.564m | 150.080m | 94.65% | 4.734m (2.99%) | 1,277 / 9 |
| Striker Balanced | Swamp 12, complete | 179.688m | 171.690m | 95.55% | 4.786m (2.66%) | 1,283 / 19 |
| Squire Heavy | Swamp 9, valid no-progress stall | 151.451m | 141.891m | 93.69% | 5.485m (3.62%) | 1,158 / 10 |

The Squire run is a valid gameplay stall, but it is not a completed canonical economy sample. Its Swamp segment had zero exclusive resource-block time and ended while farming Swamp to level 12, after reaching only level 9 and recording ten deaths. It therefore does not support a claim that Squire was waiting for essence or catalysts.

### Wall-clock contribution by route objective

This table partitions the canonical route-step duration. Percentages are of the run endpoint, not independent additive estimates of every underlying game system.

| Run | Recipe-directed farm | Level-12 mastery farm | Stance unlock steps | Explicit transition travel | Direct craft/evolve/upgrade actions |
|---|---:|---:|---:|---:|---:|
| Spirit 1x | 32.449m (20.46%) | 117.632m (74.19%) | 6.667m (4.20%) | 1.602m (1.01%) | 0.210m (0.13%) |
| Striker 1x | 24.535m (13.65%) | 147.155m (81.89%) | 6.542m (3.64%) | 1.251m (0.70%) | 0.202m (0.11%) |
| Squire 1x* | 47.274m (31.21%) | 94.617m (62.47%) | 7.885m (5.21%) | 1.476m (0.97%) | 0.193m (0.13%) |

\* Squire includes the stalled Swamp level-12 farm attempt and is not a completed-route economy estimate.

The recipe-directed portions were:

- Spirit: Plains vest 6.422m, Plains charm 7.148m, Plains boots 9.390m, Gale Needle 3.996m, Forest vest 5.493m.
- Striker: Plains vest 6.481m, Plains charm 6.890m, Plains boots 7.458m, Gale Needle 3.706m.
- Squire: Plains vest 5.881m, Plains charm 6.626m, Plains boots 8.373m, Swamp charm 26.394m.

The remaining farm time was the direct level-12 objective for Plains, Forest, and Swamp. The Squire’s additional Swamp charm route step is why its recipe-directed share is higher; it is not evidence that normal gear crafting was expensive.

### Biome level timeline

Times below are minutes since the Tier 2 run started. A dash means the run stopped before that level.

| Class | Biome | L7 | L8 | L9 | L10 | L11 | L12 |
|---|---|---:|---:|---:|---:|---:|---:|
| Spirit | Plains | 6.648 | 13.111 | 20.285 | 29.703 | 40.712 | 53.031 |
| Spirit | Forest | 57.462 | 62.978 | 69.931 | 78.810 | 88.705 | 100.534 |
| Spirit | Swamp | 104.160 | 110.286 | 119.317 | 130.921 | 143.202 | 158.553 |
| Striker | Plains | 6.523 | 13.046 | 19.966 | 27.444 | 37.323 | 48.108 |
| Striker | Forest | 51.889 | 58.533 | 66.894 | 77.343 | 89.335 | 104.027 |
| Striker | Swamp | 109.519 | 118.016 | 128.402 | 141.324 | 160.946 | 179.675 |
| Squire | Plains | 7.871 | 13.789 | 20.442 | 28.842 | 38.375 | 48.658 |
| Squire | Forest | 53.737 | 59.656 | 68.118 | 77.532 | 89.411 | 103.322 |
| Squire | Swamp | 107.910 | 117.719 | 130.703 | — | — | — |

Biome transitions were similarly recorded:

| Class | Enter Plains | Enter Forest | Enter Swamp |
|---|---:|---:|---:|
| Spirit | 0.013m | 53.479m | 101.738m |
| Striker | 0.013m | 48.199m | 105.237m |
| Squire | 0.014m | 49.204m | 104.293m |

### Recipe, stance, and upgrade timeline

The route does not emit a separate recipe-unlock event for every mastery recipe. The route’s `farm until ... unlocks` step is the unlock wait; the following evolution or stance event is the first successful use.

#### Spirit Heavy 1x reference timeline

| Time | Event |
|---:|---|
| 6.664m | Offensive stance craft; wait was for Alacrity 1 and Plains level 7 |
| 6.672m | Defensive stance craft; initial Fortified stock made this immediate |
| 13.128m | Evolve Plains vest T2 at Plains level 8 |
| 20.301m | Reconstruct Plains charm T2 at Plains level 9; consumes 2 Alacrity |
| 29.732m | Evolve Plains boots T2 at Plains level 10 |
| 53.479m | Enter Forest |
| 57.475m | Evolve Gale Needle at Forest level 7 |
| 62.993m | Reconstruct Forest vest T2 at Forest level 8; consumes 2 Alacrity |
| 100.545-100.570m | Four +1 upgrades at Global Mastery 42: Plains vest, Plains charm, Plains boots, Gale Needle |
| 101.738m | Enter Swamp |
| 158.555m | Global Mastery 48 / Swamp level 12 |

Striker performed the same Plains vest/charm/boots progression and evolved Gale Needle at 51.904m, but its route deliberately skipped Forest vest and Thorn Needle. Squire performed the three Plains evolutions, skipped the Forest gear route, and evolved Swamp charm at 130.712m after farming 26.394m for that recipe.

Only +1 T2 upgrades were observed in this slice: four on Spirit, four on Striker, and three on Squire. No +2, +3, +4, or +5 T2 upgrades occurred. No new Technique or Core unlock occurred before the Swamp endpoint. T1 abilities were carried in and switched between the route’s AoE and single-target kits.

### Essence and catalyst balances

The wallets show accumulation rather than depletion.

| Run | Initial essence (R/B/G/Y/P) | Final essence (R/B/G/Y/P) | Essence spent | Initial catalysts | Final catalysts |
|---|---|---|---|---|---|
| Spirit 1x | 502 / 475 / 649 / 828 / 594 | 502 / 475 / 2863 / 3246 / 3189 | Y503, G266 | Fortified 4 | Fortified 35, Alacrity 55, Heavy 1, Swarming 1, Dominion 1 |
| Striker 1x | 352 / 458 / 608 / 752 / 586 | 352 / 458 / 2978 / 3328 / 3201 | Y461, G98 | Fortified 4 | Fortified 35, Alacrity 57, Heavy 1, Swarming 1, Dominion 2 |
| Squire 1x | 337 / 551 / 640 / 810 / 592 | 337 / 551 / 3101 / 3281 / 1598 | Y461, P44 | Fortified 4 | Fortified 16, Alacrity 56, Heavy 1, Swarming 1, Dominion 1 |

Canonical 1x resource evidence:

- No essence-based `blocked-on-resource` event occurred in the completed Spirit or Striker runs.
- The first offensive stance was the only explicit resource wait in those completed runs. Its event required `catalyst.alacrity = 1` and `biomeLevel.plains = 7`.
- Direct evolution and upgrade calls took approximately 0.008-0.009 minutes each when their gates were met.
- At Forest level 12 / Global Mastery 42, the +1 upgrades executed immediately with thousands of essence remaining.

## 3. Gate-by-gate interpretation

The following separates observed facts from the interpretation they support.

| Gate | Observed data | Interpretation |
|---|---|---|
| Biome XP / mastery | 94.65% and 95.55% of completed 1x route time was in farm objectives. The level-12 mastery portions were 117.632m and 147.155m. | Primary gate in the measured slice. The bot was actively killing and progressing, not waiting in a combat softlock. |
| Essence | Initial T2 wallets contained hundreds per type; final wallets contained roughly 1,500-3,300 in the measured types. No essence block occurred in completed canonical 1x runs. | Not the primary early-T2 gate. The existing T2 essence dampening is not a reason to raise essence rewards based on this slice. |
| Catalysts | Natural entries began with Fortified 4 and Alacrity 0. The first offensive stance waited 6.542-7.885m of route-step time for Alacrity plus Plains 7. Later 1x natural runs had no explicit catalyst wait before Swamp 12. | A real but localized initial gate at 1x. It becomes more visible under reward acceleration because catalyst progress does not scale with the debug reward multiplier. |
| Recipe unlocks | Recipe-directed farm was 24.535-32.449m for completed 1x runs, but each following evolution was immediate. | Recipe gates consume mastery-farm time, not crafting time. They are a secondary presentation of the XP gate. |
| Crafting | No normal item craft took measurable time. Stance craft time was resource/mastery waiting, not operation latency. | Crafting throughput and operation latency are not the problem. |
| Item upgrades | +1 upgrades ran immediately at GM42. +2 to +5 were not reached. | No early evidence for reducing T2 item or upgrade costs. Late-tier costs remain unmeasured. |
| Ability / stance / Core | Offensive and defensive stances were the only newly crafted build elements. No new Technique or Core unlock was executed through Swamp 12. | Do not tune ability, stance, or Core gates from this evidence. Their later contribution remains unknown. |
| Route inefficiency | Explicit transition travel was 1.251-1.602m, under 1% of the completed 1x endpoints. | Route travel is not a meaningful first-order cause of the slowdown. In-biome movement exists inside zone timing, but the route-step travel result still leaves XP as dominant. |

### XP curve shape

The current T2 biome curve uses `BIOME_XP_BASE = 25`, exponent `2.8`, and the T2 XP reward multiplier `1.25`. A biome moving from level 6 to level 12 requires 22,507 XP under the current curve. The increments are:

| Increment | XP | Share of 6 -> 12 requirement |
|---|---:|---:|
| 6 -> 7 | 2,037 | 9.05% |
| 7 -> 8 | 2,634 | 11.70% |
| 8 -> 9 | 3,299 | 14.66% |
| 9 -> 10 | 4,030 | 17.91% |
| 10 -> 11 | 4,825 | 21.44% |
| 11 -> 12 | 5,682 | 25.25% |

The last two increments consume 46.68% of the whole level-6-to-12 requirement. That is consistent with the observed long tail after the bot has already acquired the first useful T2 gear pieces.

## 4. Reward sensitivity: 1x versus 2x

The 2x runs use the same real T1 Snapshot B inputs and route plans, but they are deliberately non-canonical sensitivity treatments. They apply the debug multiplier to XP and essence. Catalyst progress remains on the ordinary path.

| Class | 1x endpoint | 2x endpoint | 1x duration | 2x duration | Farm time 1x -> 2x | Result |
|---|---|---|---:|---:|---:|---|
| Spirit Heavy | Swamp 12 | Swamp 12 | 158.564m | 80.252m | 150.080m -> 75.085m (50.03%) | Completed both slices |
| Striker Balanced | Swamp 12 | Swamp 12 | 179.688m | 97.304m | 171.690m -> 86.710m (50.50%) | Completed both; 2x added a catalyst wait |
| Squire Heavy | Swamp 9 stall | Swamp 11 stall | 151.451m | 94.445m | 141.891m -> 88.462m | Faster mastery, but both endpoints are survival/stall limited |

### What responds to 2x

- Spirit’s Plains level 12 moved from about 53.03m to 26.80m, Forest level 12 from about 100.53m to 50.87m, and Swamp level 12 from about 158.55m to 80.24m.
- The completed Spirit farm objective time was essentially halved: 150.080m -> 75.085m.
- Total essence earned to reach the same levels remained broadly similar rather than doubling. The run finished the same XP target in half the time while each kill paid more essence.

### What does not respond to 2x

Catalyst acquisition does not scale with the debug multiplier. Catalyst gains were therefore approximately half as large over these shorter 2x routes. The most visible consequence was Striker’s Plains charm reconstruct:

- Striker 1x: the reconstruct was immediate once the level-9 route step completed.
- Striker 2x: the route spent 3.861m in the evolution step waiting for the second Alacrity catalyst.

The 2x Striker run still completed the first-three slice, but its total reduction was 45.85% rather than the approximately 50% seen in the farm objective. This is evidence of a secondary catalyst gate, not evidence that the 2x reward multiplier should be shipped unchanged.

The 2x Squire route reached Swamp level 11 before the no-progress guard, compared with level 9 at 1x. That demonstrates faster mastery accumulation, but the terminal result is confounded by Swamp deaths and must not be used as a class-balance conclusion.

## 5. Catalyst isolation

The catalyst controls were intentionally synthetic. They are useful for identifying which individual route steps wait on catalysts, but they are not valid natural-economy samples.

| Arm | Entry wallet | Explicit gate timeline | Endpoint | Interpretation |
|---|---|---|---|---|
| Natural Snapshot B Squire | Real essence; Fortified 4; Alacrity 0 | Offensive stance waits 7.885m for Alacrity 1 + Plains 7; defensive stance is immediate | Swamp 9 at 151.451m; 10 deaths | Natural early catalyst gate is real, but the terminal stall is not a catalyst wait |
| Catalyst-primed Squire | Zero essence; Alacrity 40, Heavy 16, Swarming 16, Dominion 16, Fortified 20 | Offensive stance waits 7.549m for Yellow essence 60 + Plains 7; no later catalyst block | Swamp 11 at 218.993m; 27 deaths | Removing catalyst waits does not remove the XP/essence wait or the Swamp survival problem |
| Catalyst-clean Squire | Zero essence; zero catalysts | Offensive stance 7.408m for Yellow 60 + Alacrity 1 + Plains 7; defensive stance 3.650m for Fortified 1; Plains charm reconstruct 3.170m for Alacrity 2 | Swamp 10 at 175.078m; 12 deaths | Later catalyst waits add about 6.82m of explicit route-step time in this synthetic control |

The primed and clean total durations are not a causal estimate of “catalysts make Squire X% faster.” The primed run had 27 deaths and the clean run had 12; both also began with zero essence, unlike the natural Snapshot B run. The controlled conclusion is narrower: catalyst priming removes the later catalyst waits, but XP/mastery farming and survival remain.

## 6. Expected full-Tier-2 duration

No tested run completed a full seven-biome Tier 2 route. The direct full-route Squire probe also stopped in Swamp. The numbers below are therefore projections, not observed full-T2 durations.

The projection is a deliberately coarse `first-three-biome endpoint x 7 / 3`, assuming the remaining four biome legs have the same average duration as Plains, Forest, and Swamp. It is for the bossless seven-biome mastery route represented by these experiments; it does not include an unmeasured boss-enabled gauntlet overhead or later-tier difficulty changes.

| Configuration | Evidence used | Conditional projection | Confidence / qualification |
|---|---|---:|---|
| Canonical 1x | Completed Spirit and Striker slices | 369.983-419.272m, or 6.17-6.99h; midpoint 6.58h | Low; Squire did not complete, and later biomes may not match the first three |
| Real-snapshot 2x | Completed Spirit and Striker sensitivity slices | 187.255-227.043m, or 3.12-3.78h; midpoint 3.45h | Low for full route; strong only for early XP sensitivity |
| Natural Squire 1x | Stalled first-three slice | 353.386m mechanical extrapolation, 5.89h | Not a valid expectation because the source slice stopped at Swamp 9 |
| Natural Squire 2x | Stalled first-three slice | 220.372m mechanical extrapolation, 3.67h | Not a valid expectation because the source slice stopped at Swamp 11 |
| Catalyst-clean synthetic 1x | Stalled zero-wallet control | 408.515m mechanical extrapolation, 6.81h | Do not use as natural economy evidence |
| Catalyst-primed synthetic 1x | Stalled primed control | 510.984m mechanical extrapolation, 8.52h | Dominated by 27-death Squire survival; not an economy estimate |
| Direct full-route 2x Squire probe | Stalled at Swamp 10 after 87.811m | 204.892m mechanical extrapolation, 3.41h | The route did not complete; no full-route duration claim |

The useful planning estimate is therefore “roughly 6.2-7.0 hours at current canonical 1x, and roughly 3.1-3.8 hours at a clean 2x XP/essence sensitivity rate,” subject to successful progression through the later biomes. These are not yet release targets.

## 7. Recommended economy/progression direction

These are proposed changes only. None has been implemented.

### Recommended first lever: XP/mastery pacing

Run a controlled T2 XP treatment before changing essence or gear prices:

- Current: T2 biome XP reward multiplier 1.25.
- Candidate A: 1.50, approximately 20% more T2 XP than current, expected to reduce XP-bound time by about 17% if throughput stays stable.
- Candidate B: 1.75, approximately 40% more T2 XP than current, a wider sensitivity point rather than an automatic recommendation.

An alternative with better pacing selectivity is to compress only the level 10 -> 12 requirement or add a T2 high-level mastery bonus. The current curve puts 46.68% of the level-6-to-12 requirement into the last two increments, so a selective tail adjustment could shorten the visible grind while preserving the early recipe cadence.

The first proposed test should prefer the 1.50 treatment. It is large enough to measure without simply reproducing the 2x experiment and small enough to preserve the current progression structure.

### Hold essence rewards and item costs for now

Do not raise the T2 essence multiplier or reduce T2 item/upgrade costs based on this slice. Completed natural runs paid all observed recipes and +1 upgrades immediately and ended with substantial reserves. The following still require later measurement before any cost change:

- +2 through +5 T2 upgrade costs;
- Mountain through Desert essence demand;
- Core recipes and any late Technique costs;
- full-route failure cases where an item cost is actually the blocking reason.

The current `BIOME_ESSENCE_TIER_MULT[2] = 0.85` can remain unchanged during the next XP screen.

### Treat catalysts as a targeted secondary lever

Do not globally scale catalysts with the ordinary reward multiplier. The current separation is useful for distinguishing discovery pacing from XP/essence farming.

If the initial T2 stance wait is judged too long, test one narrow change at a time:

- grant one introductory Alacrity catalyst at T2 entry; or
- change the first offensive stance requirement so the entry route does not wait for a newly discovered catalyst; or
- add a small early-T2 Alacrity acquisition adjustment while leaving later catalyst families unchanged.

The follow-up should record whether this removes only the initial 3-8 minute gate or also changes later catalyst scarcity. The 2x Striker result shows that catalyst pressure can reappear when XP progression is accelerated.

### Do not tune class or combat stats in this phase

The Squire terminal outcomes contain Swamp deaths and no-resource stalls. They should receive a separate survival/engagement investigation. They are not a reason to alter Squire, Striker, Spirit, monster, weapon, stance, Technique, or Core combat values in the economy pass.

## 8. Proposed follow-up experiment

### Phase A: small XP screen through Swamp

Use the same three real Snapshot B entries and the same measurement routes. Run one representative route per class for:

1. current canonical 1x;
2. T2 XP multiplier 1.50, with essence and catalyst behavior unchanged;
3. optionally T2 XP multiplier 1.75 for Spirit and Striker only if the first comparison is ambiguous.

Keep the route bounded at Swamp level 12. Record the same level, transition, route-step, wallet, catalyst, recipe, upgrade, and block events. Pre-register the useful screen as a meaningful reduction in completed first-three median time without creating new essence waits or increasing valid no-progress stalls.

### Phase B: targeted catalyst confirmation

At the best XP treatment from Phase A, run a small natural-versus-introductory-Alacrity comparison:

- one Squire and one Striker with natural Snapshot B catalysts;
- one Squire and one Striker with only the proposed introductory Alacrity adjustment;
- all other rewards and catalyst behavior unchanged.

This tests whether the early stance gate is worth changing without confusing it with the synthetic full-primed wallet.

### Phase C: full-route validation

Only after an XP treatment completes the first-three slice cleanly should the runner spend the time on full bossless Tier 2 validation. Use two small full-route repetitions under the selected configuration, at least including Spirit and Squire. Add the existing Tier 2 bosses only in a separate explicitly labeled gauntlet experiment after the bossless mastery duration is known.

Success criteria for the next phase should be:

- first-three median time materially below the current 1x baseline;
- no new essence scarcity in the early route;
- catalyst wait time understood and intentionally accepted or removed;
- no increase in unexplained route stalls;
- a measured full-route duration before declaring a Tier 2 pacing target.

## 9. Limitations and evidence boundaries

- This is one representative run per class at canonical 1x and one per class at 2x, not a variance estimate.
- The canonical Squire run is a valid progression/survival stall, not a completed economy sample.
- Catalyst-clean and catalyst-primed entries are synthetic and must not be pooled with natural economy data.
- No 1.5x treatment was run in this measurement phase.
- No complete seven-biome route was observed. The full-duration table is extrapolation only.
- No +2 through +5 upgrades, Core unlock, or late Technique gate was reached.
- The first-three route uses boss-cleared T1-derived entry snapshots and a bossless T2 mastery route. It is not a complete boss-enabled gauntlet measurement.
- Legacy four-Squire partial runs from the canonical validation brief remain useful context for the original symptom, but they are not repooled as new economy samples.

## 10. Validation and change record

The measurement route build passed. The focused repository validation completed with 153/153 tests passing; typecheck and bot build also passed. No balance values were modified. The only measurement implementation change was the pacing-route instrumentation committed at `3f8ecac9783c62d326a8b5a43e1fa4a8461d5bda`.

Source and methodology references:

- [T2 canonical validation brief](t2-canonical-validation-2026-09-10.md)
- [T2 postfix revalidation brief](t2-postfix-revalidation-2026-09-10.md)
- `shared/src/config/gameConfig.ts` for the XP curve, T2 reward multipliers, and catalyst threshold
- `server/src/systems/player/progression/rewards.ts` for XP/essence scaling and deliberate catalyst non-scaling
- `bot/src/telemetry/summary.ts` and `bot/src/telemetry/recorder.ts` for zone timing, wallet, catalyst, and block definitions
