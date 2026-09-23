# Spirit adoption + encounter follow-up 01

**Give this document to Astra.** Integrate the already approved Spirit adjustment, prepare the bounded encounter comparison below, and hand its executable queue to Luna. Keep the unresolved Conduit treatment separate. The final section sets the proposed T4 coverage and class-pass stopping rule; it does not authorize a T4 combat launch.

**New combat allocation: 24 observations, controls included.** Six local comparisons, two arms, two seeds. No repeat of the 720-case campaign or the completed 56-case candidate experiment.

## 1. Authority and immediate decisions

| Work | Current authority |
|---|---|
| Four tested Light/Balanced Spirit affinity changes | **Approved for adoption.** Integrate through the normal repository workflow; do not ask for the same numerical approval again. |
| Root-only Conduit 3,500 -> 2,500 ms candidate | **Not approved for adoption.** Leave it out of the playtest baseline. |
| Encounter packages defined in section 3 | Prepare and execute the bounded comparison. These are player-loadout treatments, not approved enemy or ability coefficient changes. |
| One Conduit failure-sequence review | Read existing evidence only; no new Conduit combat or replacement candidate is included. |
| T4 specialization coverage | Planning/catalogue work only. Bring the resolved scope/build directions to the command center before launching. |
| Release / deployment | Not authorized by this assignment. |

The designer's approval is of the preceding recommendation: adopt Spirit, retain the current Conduit baseline, and prepare a small encounter-focused follow-up. Do not interpret it as approval of every historical candidate or of a general balance rewrite.

### Approved Spirit patch

File: `shared/src/data/skillTree/rootsAndFrames.ts`.

| Skill ID | `statEffects` field | Previous | Approved |
|---|---|---:|---:|
| `energy-light` | `attackPct` | 0.07 | **0.02** |
| `energy-light` | `attackSpeedPct` | 0.12 | **0.04** |
| `energy-balanced` | `attackPct` | 0.08 | **0.03** |
| `energy-balanced` | `attackSpeedPct` | 0.06 | **0.00** |

Verified Spirit-only commit: **`e47c48f9e29afcaaf4d49cec79d53a468c85fc41`**. Its diff contains only these four fields. Inspect before applying; cherry-pick this commit or reproduce its exact isolated diff if the target history requires it. If already present, record that rather than applying a second reduction. Resolve a genuine conflicting designer edit explicitly; do not overwrite unrelated work.

The percentages are additive frame contributions, not final-character percentage reductions. Keep root-only/T1 Spirit, Heavy Spirit, movement, range, HP, plating, barriers, energy gain per hit, thresholds and discharge multipliers unchanged. The Light/Balanced changes inherit into later specializations while those frame nodes remain selected; do not artificially limit the patch to T2/T3.

**Do not merge the combined candidate branch as the gameplay patch.** It also carries the rejected Conduit interval treatment. Do not cherry-pick C-only commit `47000d22`, and do not use combined candidate `5ffbfb414b62d3addc8cb485d5b149b14e7de7ca` as the new gameplay base without removing and verifying the unapproved difference. Preserve existing framed Conduit R2, session correction and native target inheritance. Normal no-frame reconstruction remains 3,500 ms; existing profile floors and other legal modifiers remain as authored.

Use normal focused integration checks: exact source diff, current build/type checks relevant to the edited package, and existing root/Heavy versus Light/Balanced readbacks. Do not rerun all 56 fights simply because the patch is being integrated. Report unrelated test failures honestly rather than silently repairing them or treating them as evidence about these four numbers.

Write a short `ADOPTION.md` identifying the approval, exact isolated diff, resulting target-branch commit, checks performed, any genuine conflicts, and whether integration/push succeeded. Integration approval is not a deployment claim.

## 2. Evidence and source for the new comparison

The completed candidate report establishes a bounded Spirit reduction with no new Spirit deaths in its selected farming/boss comparisons, plus a root-Conduit availability improvement with one important owner-death counterexample. It does not certify T4 combat or prescribe enemy changes.

References:

- `reports/player-fast-pass/class-balance-candidate-01/run-01/REPORT.md`, published on `codex/class-balance-candidate-01`. Control `dd2c06f2bca8380323bdcfe2f65add2d7d51989d`; combined candidate `5ffbfb414b62d3addc8cb485d5b149b14e7de7ca`.
- `reports/player-fast-pass/class-balance-candidate-01-preparation/ENCOUNTER_REVIEW.md` and its compact extracts. This is a review of eight earlier failures, not eight additional treatment trials.
- Overnight source **`c14d62afa2267b57207e1ef8b65c3fd90144c0a6`**, `server/bench/balance/overnightProgressionSpec.ts`, `progressionSnapshot.ts`, and the overnight applied receipts: controls for package construction and progression.

**Freeze one intended-playtest execution source with the approved Spirit patch and without the rejected Conduit patch.** Preserve other already accepted work in the intended branch. Record differences from the historical overnight source instead of assuming equivalence. Reuse old package inputs, not old combat outcomes: all 24 lives here are fresh on the same new source.

Do not let active edits to Heat, pack behavior, items or abilities enter midway. If a materially changed fixture no longer expresses the old question, disclose that before sealing the affected block. Routine preparation must not become a broad source audit or a hunt for unrelated bugs.

## 3. Next experiment: `encounter-counterplay-01`

**Question:** Do narrowly specified, legal versions of the designer's existing encounter strategies resolve the concentrated failures, and what unresolved balance or automation question remains when they do not?

There are six comparison rows, each with baseline and treatment on seeds **101009 and 101033**: **6 x 2 x 2 = 24 fresh observations**. Fixed ordinary windows are ten simulated minutes. Boss caps are five minutes. First player death or authoritative boss kill ends the life.

| Pair | Identity and encounter | Baseline | Treatment | Stage | Lives |
|---|---|---|---|---|---:|
| J1 | T3 Light Striker, Jungle-01 | Overnight Swamp-armor package | **Swamp armor -> Mountain armor**; same +3 upgrade and all other fields fixed | GM102 / 36 RP; T3 +3 | 4 |
| J2 | T3 Balanced Apprentice, Jungle-01 | Overnight Swamp-armor package | Same **Mountain-armor substitution** | GM102 / 36 RP; T3 +3 | 4 |
| V1 | T3 Light Striker, Volcano-01 | Overnight Offensive Stance arrival package | **Defensive Stance instead of Offensive**, otherwise identical | Volcano0; GM102 / 36 RP; T3 +3 | 4 |
| P1 | T2 Light Squire, Plains boss | Overnight Slam + Second Wind / Plains-charm package | **Add Brace on its native trigger**, retaining offense, AoE and charm | GM70 / 30 RP; T2 +4 | 4 |
| M1 | T3 Balanced Apprentice, Mountain boss | Overnight Power Strike + reactive Brace package | **Add Endure on its native trigger**, retaining existing Brace rule and everything else | GM108 / 37 RP; T3 +4 | 4 |
| E1 | T3 Balanced Apprentice, Volcano boss | Overnight Sweep + Second Wind/Brace/Endure package | **Sweep -> Detonate; transfer Brace timing rule to Fully Afflicted -> Detonate**; Brace stays attuned with native timing | GM108 / 37 RP; T3 +4 | 4 |
| **Total** | | | | | **24** |

These comparisons operationalize previously supplied mitigation, plating, AoE and Apprentice burst directions. They do not establish that a particular armor, stance or ability is globally best. Only the substitutions listed above are permitted. Do not add a second rescue treatment because the first dies.

### Reference identity resolution

Find the exact original overnight case for each seed, retaining its applied inputs:

- J1: `op-t3-striker-light-jungle-t3-developed-s{seed}`.
- J2: `op-t3-apprentice-balanced-jungle-t3-developed-s{seed}`.
- V1: `op-t3-striker-light-volcanic-t3-developed-s{seed}`.
- P1: `op-t2-squire-light-plains-boss-s{seed}`.
- M1: `op-t3-apprentice-balanced-mountain-boss-s{seed}`.
- E1: `op-t3-apprentice-balanced-volcanic-boss-s{seed}`.

Resolve actual node IDs and named bosses from those cases and the production dungeon definitions. Display names/short node labels in the table are not replacement IDs. Do not fight guardians and label them boss observations.

### J1/J2 — the actual armor comparison

Swap `swamp-vest-t3` for **`mountain-vest-t3` (Summit Aegis)** at the same +3 step. Both are reachable in the chosen snapshot. Verify the composed HP/plating/effects and paid item gate; do not equalize the resulting stats.

This is a whole-armor test: Mountain also changes HP and authored mitigation/Guard effects, while removing Swamp properties. It is **not** an isolated experiment on the plating coefficient. In particular, a changed deferred-damage stream is an expected consequence to interpret, not necessarily a recording defect.

Keep existing Sweep, Second Wind, Cleanse, Offensive Stance, recovery item, boots, core, range, movement and hazard rules. Do not add Brace or change target selection here. The existing review points to overlapping direct hits in these lives, not demonstrated poisonous damage that Cleanse failed to remove. Observe actual damage sources in the new lives rather than assume identical exposure.

### V1 — mitigation versus pressure at first Volcano entry

Only change Offensive to Defensive Stance. Keep Mountain armor +3, the existing weapon, Swamp charm, Second Wind/Brace, Sweep and hazard avoidance. Do not grant a Volcanic charm, Cinderlash, Frenzy, Quick Strike, Tundra tools or later mastery to rescue an arrival build.

The hypothesis is that existing legal mitigation may make the ordinary crowd pressure manageable; the counter-hypothesis is that losing offense prolongs encounters/Heat exposure and makes the tradeoff poor. Either outcome is useful. This is not an Endure screen, a Heat treatment or proof that missing Cleanse caused the old deaths. It addresses one representative melee package; other roots are not automatically cleared or condemned by it.

### P1 — survive long enough for the designed add sustain to operate

Add legally learned/attuned **Brace with its existing native trigger**. Keep Slam, Second Wind, the Plains recovery charm, original armor, weapon, Offensive Stance and targeting unchanged. The original life lacked Brace and died before add kills supplied useful recovery. This tests the opening bridge, not a new boss-only strategy.

Do not wire Brace to a harmless Rallying Cry merely because a cast bar is visible. No secret add-targeting controller, invented add schedule, or private boss script. Measure time to first add kill and actual health around the opening; an AoE cast before adds spawn is not successful add counterplay.

This first pass uses Light Squire only to keep the allocation bounded. Light Striker and the remaining melee frames retain their documented limitation; a Squire rescue is not proof that every melee path is ready. If the baseline/treatment both still fail before meaningful add recovery, the next output is a concrete opening-survival/encounter recommendation, not an automatic armor or targeting grid.

### M1 — sustained support across the Mountain follow-up

Retain Power Strike, Second Wind, Defensive Stance, gear, range, movement, and `target-casting -> use-ability(Brace)`. Add **Endure on its native HP-triggered behavior**, not a second custom rule. Pay its attunement cost. It is legally available from prior Desert progression in this snapshot; Break Free is not available at Tundra0 and is not added.

Test whether this legal mitigation option covers the late charge/Cragbreaker pressure that killed the old package. Record active Guard state at the damaging charge and follow-up, not just their cast counts. The pair does not independently measure an optimal Endure trigger or excuse a root-wide Apprentice buff.

### E1 — actually test the designer's DoT burst option

Replace Sweep with **Detonate**. Replace the existing `target-casting -> use-ability(Brace)` rule with the existing assembled rule below; keep Brace itself attuned, now using its native trigger:

```json
{"conditionId":"target-max-stacks","actionId":"use-ability","targetAbilityId":"detonate"}
```

`target-max-stacks` is the native **Fully Afflicted** predicate. Use the actual target's owned stacking DoT state, not a private timer, monster-ID special case, or test-only full-stack grant. Place the replacement rule at the old Brace rule position, preserving every other rule's relative order. Confirm the native ability arbitration supports this legal configuration before sealing. This is an explicit RP allocation tradeoff: at the inspected source, Sweep and Detonate each cost 6 RP, and both custom timing rules cost 3 RP (condition 2 + Use Ability 1). The old Volcano-boss package totals 36/37 RP, so appending another 3-RP rule would be illegal; exchanging the timing rules preserves the 36-RP total. Recompute through the actual execution source rather than hard-coding that expectation.

Keep Second Wind, Brace and Endure attuned, and keep Defensive Stance, equipment, range and movement unchanged. Second Wind and Endure keep their old native behavior; Brace returns to its native HP-below trigger because its custom rule is removed. This measures **a timed Detonate finishing package**, including the loss of custom Brace timing, not an isolated ability or multiplier effect. The change is deliberately declared, not a free extra Rune or a hidden removal of a defensive ability. Observe whether stacks were reached, Detonate actually resolved, and the remaining boss HP and Guard states around Final Eruption.

Do not also change to Execute Stance in this pair: that would hide which response we tested. Execute is the already known `execute-stance`, not a missing ability named `execute`; its separate finishing/posture comparison stays in the backlog. If this declared exchange cannot legally fit or the native rule cannot express the intended timing, return that exact conflict rather than silently removing another defense or inventing automation. Unaffected blocks remain runnable.

Before interpreting finisher mitigation, check actual active buffs. The old review grouped Brace and Endure activations as early, but Endure's recorded 55.9s activation and the 62.2s impact are only 6.3s apart; an eight-second duration alone does not establish expiration. Do not relabel an impact as unmitigated without the corresponding state evidence.

## 4. Progression, legality and execution

Keep complete fixed snapshots, not just a nominal item-plus number:

| Snapshot | Mastery distribution | GM / RP | Ordinary gear |
|---|---|---|---|
| `t3-developed` | Plains/Forest12; Swamp/Mountain/Cave18; Jungle/Desert12; Volcano/Tundra0 | 102 / 36 | T3 +3; retained older-tier pieces as the exact reference records |
| `t2-desert-established` | Plains/Forest/Swamp/Mountain/Cave12; Jungle6; Desert4 | 70 / 30 | T2 +4 |
| `t3-tundra-arrival` | `t3-developed` plus Volcano6, Tundra0 | 108 / 37 | T3 +4; older-tier support remains as declared |

Read back actual per-slot upgrades, known abilities/runes, ranks, core/relic state, mastery, RP used/free, stance and ordered rules. No all+5 fallback, no unearned items, no free extra RP. Additional ability/Rune purchases use declared lawful prior ownership and costs; this remains synthetic combat, not evidence of farming time or typical player affordability.

If the exact approved delta fails a real budget/access check, ask the command center the narrow missing build decision before substituting. Do not ask the designer to repeat existing encounter strategies. Publish omitted/blocked rows clearly and do not spend their allocation on a different treatment.

Use the existing production-backed runners, 100 ms steps, seeded ecology and actual hitboxes. Qualify packages from the same final checkout and child entrypoints used for execution. Check only the changed composition and existing source/receipt contract; no general validation platform, new estimator, full-suite repair, or unallocated combat pilot.

Freeze the 24-row order. Keep each pair adjacent, control first for 101009 and treatment first for 101033. Use one worker and the existing resource/watchdog policy. Every gameplay death is a result; no retries, live-build edits, adaptive seeds or cap extensions. A shared operational failure preserves partials and stops affected work; do not call it class weakness.

Farming endpoints: 300,000 and 600,000 ms. Boss cap: 300,000 ms. No respawn/refill/reset inside a life. Preserve authoritative boss-kill evidence and null post-death endpoints. Ten-minute survival is not twenty-minute certification.

## 5. Read-only Conduit follow-up — separate from the new combat queue

Read the existing developed-Cave seed101009 control and 2,500-ms candidate evidence around `986,400 ms` and enough preceding replacements/recovery to explain the owner's state. Use their own timelines; identical wall-clock times after diverging gameplay are not matched encounters.

Question: was the candidate meaningfully constrained by replacement payments near collapse, by ordinary enemy overlap/Guard timing, or is the existing evidence insufficient? Separate HP payments, enemy damage, active recovery, summon availability, and access to the safety floor. The final Cave Brute hit is the terminal event, not a complete causal explanation. Higher payment per minute is not by itself causal proof.

Deliver one short finding with the evidence limitation and, if justified, a **proposed untested** root-only revision for designer review. Do not implement a new timer/cost/damage change, run more combat, or repeat the broad Conduit audit. If the raw Windows artifacts are unavailable, say so and leave the current baseline in place. This review cannot delay Spirit adoption or the encounter queue.

## 6. Decisions required from the experiment

For each pair report whether the intended tool was legally equipped, actually used, and materially changed useful work or the encounter outcome. Separate those three questions. Show:

- Farming survival/time to death, completed work in equal live windows, first-kill time, late progress, enemy exposure and relevant HP/barrier pressure. Do not rank a short lethal burst of kills above sustainable farming from kills/minute alone.
- Boss kill/time or supported HP progress at death/cap, first add kill where relevant, and actual Guard/Detonate timing at the consequential mechanic.
- The RP and lost-tool tradeoff of the treatment. More survival with severely reduced work is not automatically a superior package.

Use existing streams; missing source-specific healing or exclusive overkill attribution is not a mandate for another telemetry project. Do not infer causation from a final-killer label, an AoE footprint, or an ability activation count alone. These selected two-seed cases are not statistical certification of every sibling or the whole biome.

Return **at most five substantive findings and three next decisions**. Each priority receives one disposition: retain a credible reference response; propose an exact class/encounter/ability correction with supporting mechanism; or ask one specific designer question. Successful references need not be optimal, and every seed need not win to establish a useful niche.

Enemy and ability values stay frozen during this packet. If intended counterplay works poorly across the relevant evidence, propose the smallest justified number change rather than keep adding player defenses. Any new numerical proposal remains untested/unapproved unless separately measured and authorized. Do not commission an automatic next rescue arm.

## 7. Handoff and publication

**Astra:** integrate the approved S-only patch; document actual adoption. Prepare the six comparisons from the fixed references and issue `LUNA_RUN.md` with exact verified commands, source/hitbox identity, 24-row manifest, applied build inputs, and the permitted treatments. Complete the bounded Conduit read or disclose its evidence limit. Commit and push scoped adoption/preparation through normal workflow. No main combat or extra balance changes during preparation.

**Luna:** execute once, supervise operationally, preserve partials, and stop at completion. Publish one readable `REPORT.md`, compact `results-summary.json`, applied-build/source/terminal receipts and a raw-artifact inventory. Keep large JSONL streams outside Git. Do not independently tune numbers, add builds or start T4 tests.

**Commit AND push the scoped compact results**, verify remote accessibility, and return the publication branch/SHA, measured execution SHA, integrated Spirit SHA, report path, and planned/completed/gameplay-death/operational-failure/omitted/not-run counts. A publication failure is reported, not repaired by rerunning combat. No force-push, unrelated staging, release or deployment.

The command-center output should distinguish: Spirit approved; Spirit integrated or blocked; Conduit held; encounter treatment measured; any subsequent numerical change only proposed. Do not leave the approved Spirit change described as merely an awaiting-approval experiment.

## 8. Next broad work: T4 specialization coverage — proposed, not launched here

We should not close the T1-T4 class-balance pass with only a few selected T4 packages. The checked breadth generator enumerates **6 roots x 3 frames x 3 specializations = 54 T4 identities**, before range alternatives. Re-enumerate the actual selectable production identities at preparation time; do not accidentally count old reconstruction treatment rows as additional classes.

**Proposed main screen: 54 identities x 4 encounter contexts x 2 fixed seeds = 432 observations.** The four proposed contexts are:

| Context | Purpose / designer strategy |
|---|---|
| T4 Volcano farming | AoE, appropriate recovery and pressure under the current Heat behavior; hazard response where relevant |
| T4 Tundra farming | Sparse elite/control pressure; durable or kiting answer appropriate to the path |
| T4 Mountain boss | Single-target delivery plus actual charge/impact response |
| T4 Wasteland boss | Recurrent adds, AoE and boss pressure; not a boss-only single-target reference |

Use one credible path-specific package per context, not every weapon/core/relic/stance combination. Preserve authored range exceptions, channel/charge rules, summon formations and meaningful stat tradeoffs. A selected specialization must have a realistic opportunity to express its defining mechanic; equipping it while preventing its mechanic from functioning is not a class test.

Plan the primary census at an **explicit established T4 +4 checkpoint**, with actual mastery/GM/RP and per-item/ability/core/relic gates. Do not take a mature GM156 +5 catalogue, lower the item numbers, and call it entry progression. Do not grant a core, relic or advanced stance merely because it is tagged T4. For a path with no legal support at the chosen checkpoint, explain whether to use an earlier support item or propose a different checkpoint before the run.

First Trench/Wasteland entry is a different question: use a later small, selected +3/+4 entry contrast with lawful prior-biome ownership only if that gap needs a decision. It is not an automatic second 432-case grid. Mature +5 results can be retained as separately labelled context.

The suggested census windows are ten-minute farming and five-minute bosses; final fixture IDs, progression checkpoint, full 54-identity catalogue, seeds and any known path-specific interpretation must be approved before launch. This assignment permits seeding a compact `T4_COVERAGE_PLAN.md` from existing summaries/catalogues while the small encounter packet runs; it does not permit unallocated T4 pilots or combat.

Reuse historical T4 evidence aggressively, with source/gear/strategy labels. Old pre-fix or pre-Spirit-patch rows cannot be relabelled current measurements. No requirement to replay every biome or maximize every build.

## 9. What closes class balance for this playtest

The next work is a finite sequence, not a promise of a completion date:

1. Adopt the tested Spirit patch and explicitly hold/reject the Conduit candidate.
2. Resolve or explicitly disposition the concentrated T2/T3 failures using the small counterplay comparison. Not every row must survive; unexplained broad progression blocks cannot be silently ignored.
3. Give every selectable T4 specialization credible farming and boss coverage at the declared gear stage, then identify only the persistent strong/weak outliers.
4. Apply the few approved corrections and run focused regressions on affected contexts/inherited paths. Record remaining uncertainties and playtest watch items.

The pass can close with asymmetric matchups, imperfect reference builds, and a Conduit issue transparently deferred by designer choice. It cannot be called complete by claiming untouched T4 paths are certified or by excluding serious failed progression settings from the summary. No arbitrary quota of buffs/nerfs, and no requirement to enumerate every legal Runic build.

The closure output is a compact root/frame/path disposition map and patch ledger: leave unchanged, adjusted and checked, matchup weakness accepted, or known issue deferred for the playtest. Broad item/core/stance optimization and unconventional player-discovered combinations then belong to the next analysis layer.

## Source notes for the preparer

- The uploaded **Class balance candidate 01 — run 01** report supplies the exact tested values, source lineage, unchanged controls and Conduit counterexample. The designer's subsequent approval supersedes its awaiting-approval status for S only.
- Spirit-only commit `e47c48f9e29afcaaf4d49cec79d53a468c85fc41` was retrieved and its four-field diff verified in this command-center preparation.
- The supplemental encounter review supplies the recorded Jungle/Volcano/Plains/Apprentice failure sequences. Its hypotheses are not measured armor, stance or Detonate treatment effects.
- At `c14d62afa2267b57207e1ef8b65c3fd90144c0a6`: `mountain.recipes.ts` authors Summit Aegis and its upgrades; `runeDatabase.ts` exposes `target-max-stacks`; `playerBreadthSpec.ts` enumerates all three T4 paths per root/frame. Follow the production recipe/RP and combat consumers when resolving packages; authored catalogue text alone is not efficacy evidence.
- The native Execute stance and Endure-window clarification are retained from the command-center source checks. They are not reasons to invent an ability named `execute` or assume Guard coverage from cast time alone.

**Immediate finish line: adopted S-only patch, one 24-observation encounter report, a bounded Conduit disposition, and a proposed—not automatically executed—T4 coverage plan.**
