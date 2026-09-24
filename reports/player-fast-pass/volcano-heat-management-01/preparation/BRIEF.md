# Volcano Heat management 01 — candidate and class closeout

**Experiment ID:** `volcano-heat-management-01`  
**Assignment:** Astra prepares an isolated implementation candidate and executable packet; Luna executes once and publishes; the designer approves adoption.  
**Allocation:** **26 fresh combat observations maximum**, plus bounded implementation checks. No broad class census, automatic second treatment, or Wasteland boss.  
**Status:** Design/preparation handoff. No implementation, combat, merge, or deployment has been performed by issuing this document. The paragraph below is the exact candidate submitted for designer review. Receipt of this brief authorizes candidate preparation, not production adoption; Luna executes only when assigned.

## 1. Exact proposal for approval

**Add an optional “Manage Heat” mode to the existing Wait It Out Rune, retaining its 1-RP cost and existing ownership access. In ordinary Volcano areas, reaching 25 actual Heat stacks latches a request to finish the current engagement without voluntarily acquiring fresh enemies. The owner and summons continue fighting existing threats and responding to new attackers; they never stand idle under attack. Once the engagement genuinely ends, automation holds the next pull until Heat falls to 10 stacks or fewer, then resumes. Cooling uses the existing out-of-combat condition, grace period and cooling formula: there is no instant stack removal or cooling during an active fight. Leave Heat's accumulation rate, logarithmic damage curve, enemy/pack values, general recovery rules and all boss behavior unchanged. The normal Wait It Out mode remains unchanged for existing builds. This is a proposed farming-automation tradeoff, not a class buff or a 25-stack cap.**

The design target is sustainable, productive Volcano farming through occasional cooling breaks for a build that can already handle its engagements. A finite experiment can demonstrate repeated stable cycles, not prove indefinite survival.

The 25/10 thresholds are proposed first-pass design values, not fitted values derived from the prior report. Do not silently tune them after seeing outcomes.

## 2. Evidence and what is closing

The completed `t4-overnight-closing-pass-01/run-01` at measured source **`056b5cd66c2f6aeccca840265a0cbce30a2a77f3`** completed 460 observations: 432 primary and 28 alternatives. All 108 primary Tundra lives survived twenty minutes and all 108 primary Mountain lives killed Iron-Crest Titan. Volcano had 68/108 twenty-minute survivors; Desert had 58/108. Of 90 farming deaths, 84 occurred before five minutes. These early failures are not demonstrated long-session Heat failures.

The designer separately observed a T4 character farming for approximately 20–30 minutes and dying near 150 Heat. Its exact build and recording are not supplied. Do not invent a reproduction of that character or make its availability a launch prerequisite.

The preceding 32-case corrected-baseline report establishes that changed Conduit ability delivery can improve work in an equipped package while leaving packages that do not exercise it unchanged. It does not establish that every Conduit path is balanced or that Heat cooling alone solves Volcano.

**Close broad class exploration after this handoff.** Retain the adopted Spirit Light/Balanced adjustment and corrected Conduit implementation. The rejected root-only Conduit 2,500 ms reconstruction candidate remains unadopted; keep the current 3,500 ms baseline and framed tuning. No new class coefficients are authorized here.

Carry these measured equipment choices into the reference catalogue, scoped to the closing pass's Tundra/Mountain comparisons:

| Path | Preferred measured reference | Evidence, primary → alternative |
|---|---|---|
| Stormbringer | Eruption Lash | Two-seed Tundra kills 48 → 143; Mountain median 149.9 → 64.8 s |
| Surge | Plague Axe | Tundra 41 → 196; Mountain 116.6 → 52.7 s |
| Tempest | Plague Axe | Tundra 49 → 223; Mountain 93.9 → 30.1 s |

These are reference-build decisions, not weapon buffs, class nerfs, or instructions to apply these weapons universally in Volcano/Desert. Do not repeat all six successful weapon comparisons simply to promote the references. Preserve other alternatives and their counterexamples in the ledger without manufacturing a tuning quota.

## 3. Implementation contract — small, opt-in and explicit

### Authoring and compatibility

Implement a saved, validated mode on `wait-it-out`, for example `waitOutMode: 'all' | 'heat-managed'`. Omitted mode means the existing `all` behavior. Use the stable action ID, ownership and cost; do not replace or migrate existing generic rules into the new mode. The experiment wires **Always → Wait It Out / Manage Heat**: Always remains 0 RP, action 1 RP. No editable threshold grid or new acquisition/economy design is needed for this candidate.

Expose the mode in the actual Rune editor and serialize it through the normal client/server path, loadout normalization, validation, equipped-rule copying, trace display and applied-build receipts. Reject invalid modes or use on an incompatible action rather than silently dropping the field. Restrict the new mode to the Always condition for this first version, so it can request a pause during a fight without waiting for a post-combat predicate. Other existing Wait It Out conditions retain their original semantics.

Player-facing wording must state “25 Heat to request a break; resume at 10,” ordinary Volcano only, and that current fights finish first. The heat-managed mode waits for Heat only; poison and other afflictions still use their existing responses. Generic Wait It Out remains the full eligible-status option. Do not equip both modes in a comparison arm or disguise their overlapping wait costs.

### Runtime behavior

Use a transient latch with observable states: normal farming, cooling requested while engaged, waiting between fights, and resumed. Evaluate the heat request independently of the existing out-of-combat channel claim, which would otherwise hide the threshold while a fight is active.

- **Request:** when the rule is equipped, auto-combat is enabled, the node is an ordinary Volcano node, and actual Heat is at least 25. This is a request, not an upper bound; stacks may exceed 25 while finishing a pack.
- **Finish:** retain current valid targets and allow target changes among existing engaged threats. Respond to new hostile aggression, protect the owner and summons, and preserve ability use, kiting, telegraph escape and hazard avoidance. Do not clear aggro, erase a target merely to change combat state, force enemies to leash, or stop defending.
- **No fresh voluntary pulls:** while requested, stop elective target acquisition, idle Find Enemies and incidental summon acquisition against previously unengaged enemies. Apply the narrow veto to the relevant owner and formation acquisition paths; existing beam/channel acquisition must not bypass it. It does not reduce enemy detection, pack assistance, spawns, leash distances, collision or damage.
- **Wait:** only when the current engagement is genuinely clear, including owned summons' fights. Use the unchanged production Heat clock. Respect post-combat grace; do not redefine global combat state, healing, rites, barriers or passive recovery to manufacture a break.
- **Resume:** clear the latch at Heat <=10, or when Heat is removed. If attacked while waiting, immediately defend, retain the pending request while still hot, and resume cooling after the engagement ends. Native HP recovery may still require a longer wait; do not override Recover First to force a new pull.
- **Scope/lifecycle:** the new mode is inert outside ordinary Volcano and in all dungeon/boss rooms. Disable/reset pending state on death, leaving the relevant biome, unequipping the mode or disabling automation. Manual input always wins. Boss Heat floors and existing generic Wait It Out floor handling remain unchanged.

Do not infer “safe” solely from the owner having no attack target. A summon still fighting, a hostile targeting an owned summon, or an existing valid threat must not be hidden to obtain cooling. Reuse current production threat/formation helpers where possible. If a required distinction is missing, add the smallest local helper, not a global combat/pack rewrite.

**If enemies keep joining so the fight cannot end, preserve that failure.** The approved fallback is a designer question with evidence, not forced in-combat cooling, retreat AI, per-kill cooling or a surprise enemy nerf.

### Constants deliberately unchanged

At the inspected source, ordinary Heat is uncapped, gains at the authored 3,000 ms combat cadence, uses effective damage stacks linear through 10 and then `10 + 5*log1p((stacks-10)/5)`, with 0.03 outgoing and 0.045 incoming damage per effective stack. Cooling uses `1500 / max(1, stacks/10)` ms per removed stack. Boss overrides remain production-owned.

Do not alter any of these constants, Cleanse eligibility, Chill, pack cohesion, combat-exit delays, or class/item values in this candidate. Earlier cooling on true disengagement is a possible later design, **not** a second authorized treatment in this packet.

## 4. Source and preparation

Latest remote `develop` inspected for this handoff: **`ce0d580f8be04683dd7c0ea23319c09ecf6d858f`** (`fix: suppress repeated monster attacks during stun`). The closing-pass source `056b5cd6…` and this branch diverge from `5b81ddf5…`; do not copy the old execution checkout wholesale and silently omit the current gameplay fix.

Freeze the intended current committed baseline with the accepted Spirit, Conduit, empowered reservoir, Hamstring and Heat corrections. Import only necessary bench support from the existing working runner. Preserve other agents' dirty work. Record any later source changes explicitly, including pack-related ones; do not attribute their combined effect to the new mode.

Keep candidate gameplay changes, observation-only support, and publication separate. Prepare a baseline checkout without the new mode and a candidate checkout with only the scoped mode/UI change. Both must share instrumentation and all unrelated gameplay. Main three-policy runs use the **same candidate source**; the additional boundary checks compare baseline against candidate with the new mode unequipped.

Qualify from the final execution locations. Verify source, runtime, hitboxes, exact package readback, per-slot upgrades, mastery/RP and initialization with zero World ticks. Use the established runner. No calibration campaign or additional combat pilot.

## 5. Combat allocation: 26 observations

### H — main Heat-management comparison: 18 fresh lives

Use these **exact primary Volcano packages from the completed closing pass**, on `node-t4-volcanic-01`:

| Identity | Source observation pattern | Role in this check |
|---|---|---|
| Wavecrest / Striker balanced-b | `closing-striker-balanced-b-V-s{seed}` | Productive melee farmer with twenty-minute survival on both seeds |
| Pyromancer / Apprentice balanced-a | `closing-apprentice-balanced-a-V-s{seed}` | Ranged/DoT farmer with twenty-minute survival on both seeds |
| Duelist / Slinger light-a | `closing-slinger-light-a-V-s{seed}` | Fast-hit/reload farmer with twenty-minute survival on both seeds |

For each identity and seed, run three policies on the same candidate source:

| Arm | Change from its closing-pass package | Cost |
|---|---|---|
| H0 — continue | No status-wait Rune; retain existing Recover First and other rules | Original RP |
| H1 — full wait | Add Always → ordinary Wait It Out, unchanged all-status behavior | Original +1 RP |
| H2 — managed Heat | Add Always → Wait It Out, heat-managed mode 25→10 | Original +1 RP |

**3 identities × 2 seeds × 3 policies = 18 lives.** Use seeds **101009 and 101033**, **100 ms** steps, **2,400,000 ms / 40-minute cap**, first player death stops. Start from native clean Heat and the same initial ecology; no preheated starting condition, scripted safe periods or mid-run adjustments.

The main arm is H2 versus H0. H1 is the practical conservative alternative: it may wait for ordinary afflictions as well as Heat, so H2 versus H1 is a **whole waiting-policy comparison**, not a pure threshold-only ablation. Preserve that difference in interpretation.

Keep all weapons, armor, charms, boots, cores, relics, offensive/Guard order, stance, movement, other Runes and prior mastery unchanged within each triple. Read the final closing-pass receipts, not the older all-Mountain/Defensive catalogue. Verify the extra 1 RP fits; do not remove a useful ability to pay for it without designer input. No compensating gear or forced identical final stats.

Retain **T4 GM148 / 45 RP / ordinary +4 / supports +0**. Mastery: Plains12, Forest12, Swamp18, Cave18, Mountain24, Jungle18, Desert18, Volcano12, Tundra12, Wasteland4, Trench0. Fixed paid ownership snapshot, no acquisition-time claim, no +5 or hidden leveling/purchases.

### N — non-Volcano/Conduit boundary: 4 lives

Reuse the exact closing-pass **Ritualist primary Tundra** package (not the weaker Hastebound alternative), at the same T4 snapshot. Two seeds × baseline/candidate source = **4 fresh ten-minute lives**. New mode is unequipped in both. This checks that shared acquisition work has not changed normal formation behavior. It is not another Conduit buff experiment.

### B — Volcano-boss boundary: 4 lives

Reuse the archived **T3 Heavy Slinger Volcano boss** package and legal **+4** boss-ready snapshot from `overnight-t1-t3-progression-01`, with the same exact fixture, skills, equipment and rules carried onto the chosen current baseline. Two seeds × baseline/candidate source = **4 fresh five-minute lives**. New mode is unequipped in both. Preserve first death, boss kill and simultaneous terminals.

This is an unchanged-behavior regression check, not a requirement to reproduce an older boss time or to rescue a failure on the current baseline. Check new-mode inertness while actually equipped in a boss room in the small deterministic implementation tests below; do not spend combat rows redesigning this boss package.

**Total: 18 + 4 + 4 = 26.** No Wasteland or Desert combat; no additional class, weapon, seed, threshold, timer or rescue arms. Do not silently substitute unavailable packages. A missing essential input becomes a precise preparation blocker for that block, not a new catalogue exercise.

## 6. Focused checks and evidence

Before handoff, verify the new mode's 24/25/10 boundaries, latch retention at 24 after requesting, post-combat grace behavior, automatic resumption, being attacked during a break, summon-only fighting, cancellation on manual/auto-off/death/exit, and persistence through a real equip/save/readback. Also verify ordinary Wait It Out still handles other debuffs and boss floors; the new mode is inert in bosses/Tundra; no-mode behavior is unchanged; rejected configurations cannot fall back to an unintended policy. Use focused synthetic/unit tests, not a general test-suite repair.

During combat, retain existing outputs and add only the small observations needed to answer this question: actual Heat and native growth/cooling clocks, pending/wait/resume transitions, genuine engagement versus POST_COMBAT/OUT_OF_COMBAT, owner/summon threat counts, completed kills and HP progress, owner HP/barrier, interruptions and reasons for blocked resumption. Sample existing state rather than inventing unsupported exclusive healing or damage attribution. Transition timestamps plus regular snapshots are enough; do not build a new telemetry framework.

Record cumulative work at 5/10/20/30/40 minutes for H and derived 0–10/10–20/20–30/30–40 intervals. Missing endpoints after death remain null. Report early deaths, lifetime work, time-to-death, cooling time and useful work separately. A forty-minute survivor with no recent progress is not a success. Compare within identity/seed/checkpoint and preserve that diverging routes need not face identical later packs.

## 7. Decision rules and finish line

Recommend adoption only if the policy executes real repeatable wait/resume cycles, uses no false combat clearing or idle-under-attack behavior, and supports sustained useful work on the selected credible builds. Show whether late Heat peaks remain bounded over observed cycles and whether late damage/kill progress continues. Forty minutes is bounded evidence, not certification of endless farming.

As a **proposed practical review target**, aim for cooling holds to consume no more than about 25% of elapsed time and for the managed arm to retain roughly 80% or more of same-window no-wait work where both survive. These are usability targets, not automatic statistical pass/fail rules. Account for native HP recovery overlap, lower retained Heat damage bonuses and baseline deaths. Compare managed versus full-wait efficiency directly; do not discard H1 if it turns out simpler and just as productive.

A control need not die for the comparison to be informative. Conversely, a candidate that never reaches 25 has not demonstrated active Heat management. A break blocked by persistent real aggression is a result about engagement opportunity, not evidence that lowering class damage is needed. A positive Heat result cannot clear the separate early Desert/Volcano failures.

Return exactly one disposition for this candidate: adopt tested behavior; revise a named aspect for designer approval; or reject/defer. No automatic follow-on experiment. Any proposed change beyond this mode—including earlier cooling, thresholds, pack rules or enemy values—requires a new explicit decision.

After review, close the broad class pass for this playtest and move to the shallow subsystem outlier review. Do not require all 54 paths to win every biome. Maintain a short release-risk register for early Desert ranged/pack behavior, early Jungle/Volcano pressure, the old T2 Plains opening, the T3 Apprentice Volcano finisher, and the stalled Icebreaker life. Class-phase closure does not certify these issues resolved or waive a blocking progression bug. Their acceptance, fix or deliberate deferral belongs to the designer's release decision.

The next subsystem pass should start from existing questions: Endure's broad value/cost, on-hit/Catalyst and weapon-reservoir interactions, cast/armed ability opportunity costs, visibly unused or nonfunctional stances, rides/rites and Rune spending. Do not silently treat rides and rites as the same system; identify the implemented scope. Start with source and existing evidence, not another factorial combat grid. Address clear bugs or extreme values only, then target regression to actual changes.

## 8. Roles, execution and publication

**Astra:** implement the candidate on an isolated branch, preserve the unchanged Heat/boss boundary, prepare the 26 cases and final readbacks, and provide exact tested commands in `LUNA_RUN.md`. Commit/push scoped candidate preparation for review; never merge the gameplay candidate into develop as part of preparation. Send any substantive setup question with exact gear/upgrades/abilities/stance/RP and the observed issue. Do not ask the designer to repeat already supplied strategy guidance.

**Luna:** execute only the assigned fixed queue, one worker, no retry, no extra life, no regear, no candidate retuning. Use the established watchdogs and preserve partial data. Gameplay deaths continue the queue; source/readback/process faults are operational failures, never class results. A publication failure does not authorize another combat run.

Publish `REPORT.md`, compact `results-summary.json`, candidate diff, exact resolved packages and mode fields, source/runtime/hitbox/initial-state receipts, completion counts, raw inventory and a concise class-closeout/risk ledger. Keep large streams external. **Commit and push**, then verify the remote branch and readable report blob. Return full measured SHA(s), publication SHA, planned/completed/dead/failed/not-run counts and report path. No deployment or force-push.

## Source anchors

- Uploaded `T4 overnight closing pass 01 — run 01`, lines 5–19, 63–84, 92–145, 149–161, 171–181; measured `056b5cd66c2f6aeccca840265a0cbce30a2a77f3`.
- Closing package authoring: `server/bench/balance/t4ClosingSpec.ts` and `t4SpecializationSpec.ts` at that measured source; final receipts govern exact construction.
- At remote `ce0d580f8be04683dd7c0ea23319c09ecf6d858f`, inspected `shared/src/runeDatabase.ts` (existing rule shape and Wait It Out cost/behavior), `server/src/systems/combat/ai/runeConfig.ts` (eligible-status and floor logic), and `server/src/systems/world/nodeFeatures.ts` (unchanged Heat growth/cooling condition).
- Prior source inspection at `056b5cd6…`: `shared/src/world/nodeFeatures.ts`, `shared/src/systems/playerAmplifiers.ts`, `server/src/systems/combat/ai/engagement.ts` and `shared/src/systems/statusPolicy.ts` for Heat authoring, damage formula, combat grace and status policy.
- `overnight-t1-t3-progression-01/run-01` at `c14d62afa2267b57207e1ef8b65c3fd90144c0a6`: exact archived T3 Heavy Slinger boss package and progression snapshot. Historical outcomes remain historical, not current controls.
