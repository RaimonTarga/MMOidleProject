# Corrected baseline follow-up 01 — Astra preparation handoff

**Assignment:** Astra prepares the executable packet; Luna executes it once and publishes the results. The command center and designer decide subsequent builds and numerical changes.

**Experiment ID:** `corrected-baseline-followup-01`
**Allocation:** **32 fresh observations**: 16 T4 Conduit, 4 T1 Conduit, 12 non-Conduit T4 Volcano. One committed correction baseline, two fixed seeds, no new numerical treatment. Historical observations are references, not additional fresh controls.

**This document supersedes the preceding 40-observation proposal.** Remove its eight Wasteland-boss observations and its Wasteland trace-review assignment. Do not replace those observations with another boss or spend the removed allocation elsewhere. This is a preparation instruction, not a claim that combat or runnable-packet qualification has occurred.

## 1. Designer decisions and authority

### Wasteland boss is outside the general class screen

The designer is revisiting corpse persistence/resurrection and intends the Wasteland boss as a particularly demanding AoE challenge, not a representative general-purpose class benchmark. This is designer intent; the command center has not independently diagnosed the reported corpse-despawn issue.

**No Wasteland boss combat, corpse audit, encounter tuning, or further raw-trace review is authorized by this packet.** Do not wait for that fight to be revised. Do not prescribe class buffs to make every specialization defeat it, or keep general class-balance closure blocked on its success rate. Preserve previous Wasteland observations unchanged, labelled historical special-challenge evidence under their measured implementation. Exclusion is not a claim that the old deaths were invalid or that the fight is now balanced.

Excluding the boss does **not** remove earned Wasteland mastery/items from the established T4 snapshot. Keep `graveyard: 4` and legally owned equipment, including the relevant Apprentice weapon.

### Ask the designer before repairing a suspected build problem

The designer has repeatedly offered item, ability, stance and Rune advice. Apply that instruction operationally:

- This packet intentionally repeats declared packages to measure the current correction set. Do not spend spare RP, swap weapons/armor/relics, change range or add new abilities to make the correction appear stronger.
- If preparation reveals a material mismatch between a package and the mechanic it is meant to exercise, identify it before launch. Ask only about the affected case; unrelated approved cases need not wait. Routine source retrieval, ownership calculation and receipt construction do not require another approval.
- After a meaningful failure or persistent low output, first distinguish code behavior, mechanic opportunity/delivery and plausible package limitations. When the setup may be responsible, return the exact build and ask: **“Which items and setup would you use for this path in this encounter at this gear stage, and why?”** Include the observed failure and the suspected tradeoff. Do not make the designer repeat already supplied biome strategy.
- A valid gameplay death does not stop the approved queue. It also does not authorize an overnight rescue arm, an automatic buff, or testing successively stronger builds until one survives.

No new numerical Spirit, Conduit, weapon, ability, enemy or Heat changes are authorized. Proposed future numbers remain proposals for designer review, not automatic adoption.

## 2. Questions this packet must answer

**Conduit:** with the same gear and automation, does the committed ability-routing/default-engagement correction improve useful work or boss completion? Does its benefit appear already in T1? Distinguish owner safety, formation availability, actual Technique contribution and time without useful work.

**Volcano:** under the already-committed faster cooling, do the selected packages obtain enough real disengagement to cool and sustain repeated pulls, or does direct crowd pressure kill them before cooling can matter?

**Next decision:** retain the corrected package, ask the designer about a specific setup limitation, identify a demonstrated implementation defect, or propose one narrowly justified numerical treatment. Do not use this follow-up to restart the entire T4 census.

This is a **correction-set comparison**, not a clean ablation of every commit or a test of every possible Conduit ability. Multiple relevant runtime changes must be named rather than credited entirely to one fix.

## 3. Source selection and existing corrections

Reviewed remote `develop` at preparation-brief creation: **`f58359036bca3cfeebe482e5bfdd1f9cbb355c0a`**. Start from that committed correction baseline, or its intended committed successor after checking the intervening diff. Record the actual final execution SHA after adding scoped benchmark support. Do not claim this brief's reviewed SHA is automatically the eventual execution SHA.

Preserve these existing changes; do not reimplement or apply them twice:

| Change already identified | Commit / intended boundary |
|---|---|
| Approved Light/Balanced Spirit frame offense reduction | `d073dc19c4f9df9c90b4661899d2454972b2c5b3`; root and Heavy unchanged |
| Conduit ability/default-engagement and delivery correction | `cfb5391fba23073d8e81260bdd74f0a6eb70783a`; Champion remains the owner-attacking exception |
| Empowered contribution retained in weapon DoT reservoirs | `75683657663cbe744c1a8a11ead2bf4f6ac5c27b`; only relevant to packages using that interaction |
| Movement-only Hamstring | `d19d98595f11a4bdfa4f1fff7adab4b1ac84ae71`; do not restore the old attack-cadence slow |
| Volcano cooling adjustment | `7874768e7c9a8e2e049ceaea1f12d93c806d90f6`; 2× out-of-combat cooling, not a new buildup/damage treatment |

At that baseline Heat's low-stack cooling interval is 1,500 ms rather than 3,000 ms, with the existing stack-dependent cooling scale. Preserve its actual production buildup, soft curve, floors and engagement rules. No Wait It Out is equipped in this comparison: adding a waiting policy would change the treatment.

Retain root-only Conduit's **3,500 ms base reconstruction** and accepted framed R2/session/target inheritance. Do not import rejected root factor `2500/3500`, the combined class-candidate branch, or a new payment/damage buff.

Bring over only needed benchmark support, preserving current authoritative behavior. Do not restore older ability modules while importing an old runner. Qualify and run from the same final checkout/environment; publish from a separate checkout. Presentation-only or boss-local changes do not require a general rerun, but a shared authoritative corpse, targeting or summon change must not be dismissed as cosmetic without checking its reach. Do not mutate or wait on an unfinished worktree.

Historical execution anchors:

- T4 screen: `3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e`; published run bundle at `185b22bc136e30c33f16be9dc61f753dc5fe5566`, directory `reports/player-fast-pass/t4-specialization-screen-01/run-01/`.
- T1 references: the primary `t1-developed` Conduit Plains/Cave rows from `overnight-t1-t3-progression-01`, measured at `c14d62afa2267b57207e1ef8b65c3fd90144c0a6`; published bundle on `codex/overnight-t1-t3-progression-01-packet` at previously reviewed `575396eef0dd78e51127e6e67023d8ab16ad33c7`.

Retain those identities in comparisons. Do not relabel their outcomes as current controls.

## 4. Fixed matrix — 32 fresh lives

Use **seeds `101009` and `101033`**, **100 ms World steps**, one worker. All rows use the same frozen current source. Each fresh row must map to its exact historical observation ID, source and package receipt.

| Block | Identities | Contexts | Count | Maximum life |
|---|---|---|---:|---|
| C4 | Ritualist, Iconoclast, Idolwright, Champion | T4 Tundra ordinary and Mountain boss | 4 × 2 × 2 = **16** | 600 s farm / 300 s boss |
| C1 | Root-only T1 Conduit, developed snapshot | T1 Plains and Cave ordinary | 1 × 2 × 2 = **4** | 1,200 s |
| V4 | Swiftblade, Avenger, Pyromancer, Melter, Duelist, Aetherist | T4 Volcano ordinary | 6 × 1 × 2 = **12** | 600 s |
| Total | | | **32** | First death ends each life |

Exact T4 selections and historical observation IDs:

| Name | Stable specialization ID | Historical observation template |
|---|---|---|
| Ritualist | `summoner-balanced-t3-c` | `t4-conduit-balanced-c-{F2,B1}-s{seed}` |
| Iconoclast | `summoner-light-t3-c` | `t4-conduit-light-c-{F2,B1}-s{seed}` |
| Idolwright | `summoner-heavy-t3-c` | `t4-conduit-heavy-c-{F2,B1}-s{seed}` |
| Champion | `summoner-heavy-t3-b` | `t4-conduit-heavy-b-{F2,B1}-s{seed}` |
| Swiftblade | `cadence-light-t3-c` | `t4-striker-light-c-F1-s{seed}` |
| Avenger | `cooldown-heavy-t3-a` | `t4-squire-heavy-a-F1-s{seed}` |
| Pyromancer | `dot-balanced-t3-a` | `t4-apprentice-balanced-a-F1-s{seed}` |
| Melter | `reload-heavy-t3-a` | `t4-slinger-heavy-a-F1-s{seed}` |
| Duelist | `reload-light-t3-a` | `t4-slinger-light-a-F1-s{seed}` |
| Aetherist | `energy-balanced-t3-c` | `t4-spirit-balanced-c-F1-s{seed}` |

T1 historical IDs: `op-t1-conduit-{plains,cave}-t1-developed-s{seed}`. New observations must use new unique IDs; those strings are reference identifiers, not permission to overwrite old outputs.

Fixtures: `node-t4-tundra-01`; `node-t4-mountain-dungeon` / `iron-crest-titan`; `node-t4-volcanic-01`; `node-t1-plains-03`; `node-t1-cave-02`. No `node-t4-graveyard-dungeon` or `charnel-crown-sovereign` in the new queue.

Seal the full order before combat, interleaving the three blocks within each seed so partial output contains useful coverage. Do not let observed performance select later cases. No extra pilot, fresh historical replay, adaptive arm, third seed, replacement boss or automatic expansion is allocated.

## 5. Packages and gear stages — copy inputs, not remembered descriptions

### T4: established +4, GM148, 45 RP

Copy the selected completed T4 applied packages, not the earlier proposed catalogue. Preserve complete skill paths/ranges, weapon, armor, charm, boots, core/relic, actual per-slot upgrades, stance, ordered attuned abilities and Rune rules.

Mastery remains: `plains:12, forest:12, swamp:18, cave:18, mountain:24, jungle:18, desert:18, volcanic:12, tundra:12, graveyard:4, trench:0`.

Keep ordinary gear **+4**, core/relic **+0**, prior paid ownership and the same lawful prior-seal assumptions. Trench0 remains unvisited; do not grant Trench tools. This is established late-T4 capability, not entry or acquisition timing. Excluding the Wasteland boss does not reset `graveyard` ownership.

The selected historical T4 packages use Defensive Stance, Mountain armor/charm/boots and their declared specialization-specific weapon/core/relic. Preserve those inputs for this correction comparison. The fact that a different charm, boot, core or offensive setup could be better is a **designer question**, not permission to replace the historical package. Do not label these inputs optimal or require every spare RP to be spent.

**Important coverage limit:** the inspected T4 specification gives these Tundra/Mountain Conduit packages **Expose Weakness as the only offensive Technique**. They can measure corrected native engagement/armed delivery and Champion's owner exception, but they do not test summon-cast Power Strike/Slam, formation Charge, or Frenzy. Do not add those abilities just to broaden the feature check. If these limited references remain weak, ask the designer how to use the corrected kit before declaring that the correction failed to improve the class generally.

For V4 preserve the exact historical swarm tools, triggers, channel movement exceptions and supports. All selected references remain without Wait It Out. No inference about a nonexistent cooldown opportunity or an uncast ability may substitute for observed delivery.

### T1: developed +3, GM22, 20 RP

Copy the primary no-frame Conduit packages from the original overnight snapshot: `plains:4, forest:4, swamp:4, mountain:5, cave:5`; GM22; budget20; ordinary gear at the original legal **+3** state; Chaotic Axe; no frame, range node, core, relic or stance. Keep each biome's actual support equipment and rules from its receipt.

The historical generator drops the offensive Technique where the T1 budget cannot fit it. **Preserve and report the actual resulting list.** Plains can assess Sweep's contribution; do not imply that a Cave package with no offensive Technique tests summon-cast delivery. Do not fill headroom or give T2 abilities by accident. Keep the 20-minute life to retain visibility of late formation/owner attrition.

In every block recalculate resulting stats through production. Inputs remain fixed, while actual correction-driven behavior may change. Do not restore old runtime bugs or force output equality to recreate an old receipt.

## 6. Preparation, execution and historical comparison

Reuse the established runners (`scripts/t4-specialization.mjs`, `server/bench/balance/t4SpecializationSpec.ts` and the existing progression/survey/boss support) as implementation references. They contain old fixed counts; adapt only what this 32-case packet needs. **Never run the old 432-case command as the new assignment.** No general dispatcher redesign or full-suite repair.

Astra must supply exact tested preparation/verify/run commands in the new `LUNA_RUN.md`. Check lawful package construction and initial state with existing zero-tick qualification from the final execution path. Qualification is not combat. Preserve the accepted boss initialization so no opening phase or formation tick happens unrecorded.

Use the historical hitbox identity `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` and compatible recorded runtime where available. Record actual identities. A changed gameplay asset/runtime or initial roster requires an explicit comparability note, not a falsely matched label.

Freeze all gameplay source during execution. Retain one worker and established watchdog limits (5 GiB free disk, 1 GiB host free RAM, 2 GiB child RSS, 5 s polling, 120 s heartbeat timeout). First death ends a farm; first death, authoritative boss kill, simultaneous terminal or the cap ends a boss life. No revival, refill, reset, retry or cap extension. Gameplay losses continue the queue; common operational faults stop affected work and preserve partial results.

No new numerical controls are run. The publication compares the **32 new corrected-baseline observations** with up to **32 existing historical reference rows**. Compare per fixture, seed, checkpoint and package. Classify each comparison as compatible correction-set comparison, partial/contextual comparison, or unavailable. Missing historical details do not authorize extra combat. Report supported current results anyway and request any indispensable existing artifact once.

Even a matching seed does not keep later exposure identical after behavior changes. Identify relevant changes per case; do not credit every improvement to Conduit routing or Heat cooling indiscriminately. The T1 historical source has a longer change history than the T4 source; check authoritative differences before causal claims. The reservoir fix is not a blanket weapon treatment: establish whether the selected item uses a reservoir and whether empowerment applies.

## 7. Evidence and reporting

Use existing events/samples/formation streams. No general instrumentation project. If a conclusion needs an unsupported measure, mark it unavailable and narrow the conclusion instead of claiming it was observed.

For each farm: survival/time, lifetime completed kills, cumulative 5/10-minute work (and 20-minute work for C1), first-kill latency, unfinished targets, meaningful periods without progress, owner HP and barrier separately, and actual enemy/exposure context. Use per-life interval rates: a five-minute interval's rate is its completed kills divided by five. Never call the sum of several runs' rates one character's kills/minute. Post-death endpoints remain null; show survival alongside any survivor-conditioned summaries.

For Conduit: actual equipped Technique activations and delivered contributions, owner engagement versus formation engagement where available, owner-vs-summon delivery, formed bodies and authored-offense availability, reconstruction/payment and ready-but-HP-blocked time, and terminal pressure. Authored availability is not delivered DPS. One summon-cast payload is not multiplied by body count. Guards still answer the owner's own conditions; do not infer individual-summon healing or mitigation. Champion is not a representative formation caster.

For Volcano: distinguish growth during engagement from cooling during disengagement, especially before later pulls. Use Heat trajectories and existing engagement/status samples where retained; separate direct crowd damage, removable DoT, hazards and Heat's multiplier. A death without a disengagement opportunity does not test the benefit of faster cooling. A cooling opportunity does not prove it was long enough. No Wait It Out or automatic heat-reset treatment is present.

For Mountain: authoritative kill/time or failed HP progress, and actual charge/impact response where recorded. A fast kill is not automatically a class nerf instruction. Two identical seed-labelled boss outcomes are not independent proof of robustness.

### Required final report

One readable `REPORT.md` with the three block summaries, full 32-row compact outcome map, per-row historical matching status, and at most five substantive findings / three priority decisions. Explicitly answer:

1. What improved after the correction set, and what did not? Which improvements have evidence of the intended mechanism?
2. Is any remaining low output plausibly a setup restriction? Present the exact package and the specific advice needed from the designer **before proposing a rescue build**.
3. Does a numerical patch have a concrete supported target? State current field/value, proposed value, intended scope, inheritance and tradeoff. Mark new values untested and leave adoption to the designer; no quota of buffs/nerfs.

Update the class decision register without erasing historical evidence. Spirit's adopted patch stays recorded; root reconstruction stays unchanged; Wasteland boss is excluded by designer intent and pending encounter work, not counted as a universal weakness or as a completion blocker for this screen. Other T2/T3 unresolved issues remain separate rather than being silently closed.

A targeted existing-evidence note about Melter or a slow path may be retained if already available. No additional Melter, weapon, relic, armor, stance or Wasteland review campaign is part of this assignment.

## 8. Responsibilities, publication and stopping point

**Astra:** prepare the 32 cases and historical mapping on the corrected committed baseline; qualify legal fixed inputs and the actual launcher; publish a clear `LUNA_RUN.md`, ordered manifest and build readbacks. Raise substantive setup/source conflicts locally without rebuilding unrelated packages. No main combat or new gameplay treatment during preparation.

**Luna:** execute the 32 fresh observations once. Supervise source integrity and operational boundaries, not live build optimization. On failure report completed/failed/not-run counts honestly; do not call a blocked run finished.

**Commit AND push** the scoped readable report, compact `results-summary.json`, `historical-comparison.json`, manifest/source/applied-build/completion receipts, and external raw inventory. Suggested publication directory: `reports/player-fast-pass/corrected-baseline-followup-01/run-01/`; suggested branch: `codex/corrected-baseline-followup-01-packet`. These are new destinations, not claims that they already exist. Verify remote ref and report availability. Return execution SHA, publication SHA, branch, report path and planned/new-completed/gameplay-dead/failed/omitted/not-run counts. Publication failure is never a reason to rerun combat. Keep bulky raw JSONL streams external with their exact paths and hashes.

Stop at 32. No automatic second experiment, adoption, deployment, force-push, whole-branch merge, or editing of the previous reports. The next command-center decision is about corrected gameplay and any designer-specified build response—not a replacement Wasteland fight or another broad class census.

## Reference index

- Designer's latest instruction: exclude Wasteland boss and ask for setup advice before speculative substitutions.
- Completed T4 report: `reports/player-fast-pass/t4-specialization-screen-01/run-01/REPORT.md`, publication `185b22bc136e30c33f16be9dc61f753dc5fe5566`; measured source `3b9067c4990fbbbd4c3a889414b0b33bf2c4d27e`.
- At that measured source: `server/bench/balance/t4SpecializationSpec.ts` — exact selected IDs, packages, contexts and GM148 snapshot; `scripts/t4-specialization.mjs` — existing dispatcher.
- T4 run/preparation `applied-build-details.json`, `resolved-builds.json`, `manifest.json`, `results-summary.json` and `LUNA_RUN.md` — exact receipts and previous execution contract. The preparation README's “unrun” is historical; the completed run report is authoritative for outcomes.
- Overnight progression run and `server/bench/balance/{overnightProgressionSpec.ts,progressionSnapshot.ts}` at `c14d62afa2267b57207e1ef8b65c3fd90144c0a6` — T1 original inputs and snapshot.
- `docs/abilities-current-state.md` and production ability/summoner modules at reviewed `f58359036bca3cfeebe482e5bfdd1f9cbb355c0a` — committed correction contract. Runtime code, not an ambiguous comment, decides actual delivery.
- Existing correction commits listed in section 3 — source-comparison anchors, not instructions to duplicate their patches.
