# Class balance candidate 01 — Spirit and root-only Conduit

**Give this assignment to Astra.** Implement the two exact numerical candidates on an isolated experimental branch, prepare the bounded comparison below, and hand the executable packet to Luna. Luna measures it and publishes the evidence. The command center then presents adoption/revision/rejection proposals to the designer.

**Authorization:** experimental implementation and measurement, not integration into `develop`, release, or deployment. The designer must approve final patch adoption. This is not another exploratory class survey or a reporting-only assignment. This document is the preparation brief, not an executable or already-run packet.

**Allocation: 56 fresh observations, controls included.** No historical combat is reused as a matched arm. Encounter review uses existing traces and adds zero observations.

## 1. Exact candidate changes

### S — Light/Balanced Spirit offensive affinities

In `shared/src/data/skillTree/rootsAndFrames.ts`:

| Skill ID | Field under `statEffects` | Control | Candidate |
|---|---|---:|---:|
| `energy-light` | `attackPct` | 0.07 | **0.02** |
| `energy-light` | `attackSpeedPct` | 0.12 | **0.04** |
| `energy-balanced` | `attackPct` | 0.08 | **0.03** |
| `energy-balanced` | `attackSpeedPct` | 0.06 | **0.00** |

These are additive **frame contributions**, not final character multipliers. Do not subtract these amounts again from the composed stats. Do not change root affinities, Heavy, move speed, range, HP, plating, barrier, energy threshold, energy gain per hit, discharge multipliers, weapon effects, or any other class.

This is deliberately a frame-offense candidate, not an energy-per-hit treatment. In particular, do not apply the earlier report's Heavy `10 -> 8` energy proposal: that proposal was explicitly rejected. Reduced attack cadence may change how fast energy builds in time; that is an expected indirect consequence, not permission to change energy mechanics as well.

The frame adjustments are inherited wherever these nodes remain selected, including later tiers. T1/root-only and Heavy Spirit should retain their current composed values. Later Light/Balanced variants are affected even when their display names differ. Preserve stable skill IDs and update only directly affected explanatory text if necessary.

### C — Root-only Conduit reconstruction

In `shared/src/data/summoner.ts`, change only:

```ts
SUMMONER_FRAME_TUNING.root.reconstructionIntervalMult
// control:   1
// candidate: 2500 / 3500
```

With the existing 3,500 ms shared base and root floor, the normal no-frame profile should resolve to **2,500 ms instead of 3,500 ms**. Keep `SUMMONER_CORE_TUNING.reconstructionIntervalMs` at 3,500; do not change the global base or the Light/Balanced/Heavy entries.

Keep summon count, full-formation offense, secondary effects, body HP, movement, HP payment ratio, safety floor, and queue recovery unchanged. Preserve R2 and the accepted session/owner-target corrections. Do not reinstall historical overlays.

The scope is **root-only / before frame selection**, through the existing profile resolver. Do not add a new player-tier condition or put an inherited modifier on the skill-tree root. Selecting a frame must use its existing framed interval. Any legal no-frame character uses the root profile; do not imply this is a hard player-tier-one gate.

Hypothesis: less time waiting for one-by-one rebuilding improves useful work without increasing full-strength damage. Risk: faster replacement can increase owner-HP spending. Measure that tradeoff rather than declaring the shorter timer successful by itself.

### Keep the two changes separable

Author S and C as separate commits/diffs on the experimental branch. Use one common control revision and a candidate revision containing exactly S+C, plus only the same shared recording/preparation support as the control. These solo cases do not mix Spirit and Conduit, so the two-part candidate does not require a four-arm factorial. Either change can be accepted or rejected independently afterward.

Do not merge, deploy, or automatically modify the values again after seeing results.

## 2. Source and evidence anchors

The overnight source was `c14d62afa2267b57207e1ef8b65c3fd90144c0a6`. The four Spirit affinities and root reconstruction fields above were checked against that revision. Start from it or a verified common intended-playtest descendant; record the actual frozen control and candidate SHAs and diff. Do not silently use an unrelated `develop` snapshot or mix locally updated gameplay into one arm.

If additional accepted gameplay changes are needed in the intended baseline, include them identically in both arms and disclose them. If a listed value has already changed, identify the exact conflict before applying a second treatment; do not overwrite the designer's work or invent a replacement candidate.

Reuse these sources/packages:

- `overnight-t1-t3-progression-01/run-01/REPORT.md`, `manifest.json`, `resolved-builds.json`, and `results-summary.json` under the existing `reports/player-fast-pass/` publication. Raw root: `D:/mmo-idle/overnight-t1-t3-progression-01/run-01`.
- `server/bench/balance/overnightProgressionSpec.ts` and `progressionSnapshot.ts` at the overnight source: exact identities, fixtures, snapshots, loadouts and original observation IDs.
- `t2-spirit-boss-contrast-01/run-01/` report, manifest and applied readbacks: mature T2 boss packages measured at `3a1488a7c78bb47f4a90e20ec06db1652594fe16`. Use those package definitions, not their old combat results as new controls.
- Earlier `t2-spirit-desert-followup-01` and `t2-multi-biome-class-01` summaries: contextual peer comparisons only, with their original sources and preparation.

Historical sources, durations and sometimes hitboxes differ. Freeze one actual asset/runtime context for both new arms and report it; do not claim fresh controls reproduce every historical result. Existing report/source restrictions against automatic follow-ups are superseded only by this explicit new assignment.

Reuse the production-backed farming/boss runners and existing dispatcher. No new simulation engine, balance estimator, broad validator, full-suite repair, or unallocated pilot campaign.

## 3. Fixed 56-observation matrix

Every row below runs **control versus S+C candidate** with the same selected build, initial conditions and seed. All cells are fresh. `Both` means seeds **101009 and 101033**; `anchor` means **101009 only**. The mature boss screen's old seed duplicates were identical, so the mature confirmations below deliberately use one anchor rather than imply additional scenario diversity.

| Block | Identities | Fixture / package origin | Progression / ordinary gear | Seeds | Cap | Observations |
|---|---|---|---|---|---|---:|
| S1 | Spirit Light, Balanced | T2 Forest **and** Mountain boss packages from the completed Spirit boss contrast | Mature T2, GM72 / 30 RP, +5; Tempered +0 | anchor | 5 min | **8** |
| S2 | Spirit Light, Balanced | Overnight T2 Desert **arrival**, native ranged policy | GM66 / 29 RP, +4; no Desert-owned tools | Both | 10 min | **8** |
| S3 | Spirit Light, Balanced | Overnight T3 Swamp farming reference | GM102 / 36 RP, +3; `t3-developed` | Both | 10 min | **8** |
| S4 | Spirit Light, Balanced | Overnight T3 Mountain boss reference | GM108 / 37 RP, +4; `t3-tundra-arrival` | Both | 5 min | **8** |
| C1 | T1 root-only Conduit | Overnight Plains **and** Cave farming, **both** T1 snapshots | Developed GM22 / 20 RP, +3; complete GM30 / 22 RP, +5 | Both | 20 min | **16** |
| C2 | T1 root-only Conduit | Overnight Plains **and** Mountain bosses | Developed GM22 / 20 RP, +3 | anchor | 5 min | **4** |
| N1 | Spirit Heavy | T2 Forest boss from the mature Spirit contrast | Mature T2 +5, unchanged Heavy reference | anchor | 5 min | **2** |
| N2 | Conduit Balanced | Overnight T2 **established** Desert farming | GM70 / 30 RP, +4; exact ranged reference | anchor | 10 min | **2** |
| **Total** | 28 matched pairs | 32 Spirit-targeted + 20 root-Conduit-targeted + 4 unchanged-control lives | | | | **56** |

S1 bosses are `apex-timberclaw` and `stoneplate-juggernaut`. Resolve all dungeon node IDs through the already measured manifests; do not guess or fight a dungeon's guardians instead of the boss. Ordinary fixture references are the exact overnight ones: T2 Desert-01, T3 Swamp-03, T1 Plains-03 and Cave-02. The T3 Mountain boss and T1 boss IDs come from that manifest/spec.

Keep the initial snapshots fixed. For example, C1 developed mastery is Plains/Forest/Swamp 4 and Mountain/Cave 5; C1 complete is all five at 6. S2 has the earlier five at 12, Jungle6, Desert0. S3 has Plains/Forest12, Swamp/Mountain/Cave18, Jungle/Desert12, Volcano/Tundra0. S4 adds Volcano6 to S3. N2 has the earlier five at12, Jungle6, Desert4. No later unlocks are granted just because the character is tested in a boss or later biome.

The 20-minute C1 windows specifically check whether a faster queue eventually drains the owner; the Spirit farming checks are ten-minute targeted regressions, not fresh endurance certification.

### Package discipline

Import exact applied equipment, upgrades, frame/range, stance, core, learned/attuned abilities, Rune rules/order and trigger behavior from the named references. Preserve the primary axe choice for T1 Conduit. No rapier alternative, charm swap, extra Guard, generic Flee, Wait It Out, or new stance policy.

S2 is the existing **ranged Spirit** arrival package, not the melee tanking recipe. Do not add Focus or Endure to an unvisited Desert. S4 uses the existing +4 boss setup; do not silently replace it with mature +5 or a new optimal loadout.

Freeze build choices, **not** composed output stats: let production recompute Attack, cadence and all dependent effects in the candidate. Initial HP/barrier, available summons and encounter state follow the reference's native initialization; never copy a control's full resolved combat state over the candidate.

A lower-GM build is not a mature build with its upgrades edited down. Preserve actual per-slot item tiers and caps, learned ownership, acquisition gates, RP and the selected class tree. Costs remain declared synthetic prior purchases, not measured farming time.

## 4. Minimal implementation and execution checks

Use existing focused checks to establish the treatment boundary before handing off:

- Spirit: only the four authored fields change; root-only and Heavy are unchanged; selected Light/Balanced T2–T4 readbacks inherit the correct deltas without double application. Preserve energy/discharge constants. T4 checks here are readback/code checks, **not** new T4 combat coverage.
- Conduit: no-frame, no-relic reconstruction resolves 3,500 -> 2,500 ms; corresponding framed profiles remain identical, including existing range/spec factors. The first-death/HP-safety logic and per-replacement cost remain unchanged. The buff is not added to each framed interval through inheritance.
- Applied receipts: recognize the intended control/candidate stat and profile differences while rejecting undeclared loadout, source, mastery or encounter differences. A receipt checker expecting byte-identical stats across treatments would be wrong. Preserve qualification provenance and qualify each arm from its actual execution checkout.

Use the existing actual child launcher and zero-tick construction. No repeated all-repository tests or combat pilots outside the allocation. List what was and was not checked honestly.

Seal one finite ledger with paired rows adjacent. For the two-seed blocks alternate arm order between seeds; fix the one-seed order in the ledger. One child at a time, normal **100 ms** World steps; first player death or authoritative boss kill stops a life. Post-terminal checkpoints are null.

Use existing watchdogs and save each completed case. A gameplay death is a result, not a retry trigger. An operational failure preserves partial evidence and stops the affected execution family; do not reseal or repair a live packet. No adaptive second candidates, extra seeds, cap extensions or hidden test runs.

## 5. Parallel encounter review — existing evidence only

Astra reads compact outcome/receipt records and **at most eight existing failure sequences plus two existing successful contrasts** from the overnight artifacts. If detailed raw streams are not accessible, identify the missing evidence and retain a scoped unresolved finding; do not invent a causal timeline or run new combat to fill it. Preparation of the class comparison should not be held for an unrelated missing trace.

| Area | Review question and known strategy |
|---|---|
| T3 Jungle ordinary | Why do these +3 packages fail across roots? Examine crowd size, Silverback/Stalker pressure, DoT versus direct hits, control/movement and actual AoE/avoid-hazard behavior. The tested armor was Swamp; the designer's starting strategy emphasized plating + AoE + hazard avoidance. This discrepancy is a hypothesis to explain, not permission for an armor sweep. |
| T3 Volcano ordinary | Separate Heat, direct hits, fire DoT, lava exposure and recovery access. Verify whether omission of Cleanse mattered in the recorded lives; first-entry profiles cannot own a Volcanic charm or Frenzy yet. Do not call all deaths Heat deaths or nerf Heat from the total. |
| T2 Plains bosses | Explain the melee failures using add pressure, target selection, actual Sweep/Slam delivery, Guard and kill-recovery activity. The intended answer is AoE plus add-supported sustain, not boss-only single-target play. |
| T3 Apprentice bosses | Review one existing Balanced death in Mountain and one in Volcano, with sibling summaries for context. Separate charge/plate response from the Volcano finisher, control, damage delivery and DoT timing. Check whether the prepared package expressed the designer's burst/mitigation or Detonate/Execute idea; do not assume it did. |

For Jungle and ordinary Volcano, choose two recorded primary deaths each, with contrasting melee/ranged roots where available; prefer seed101009, then101033. For T2 Plains use one existing Striker and one Squire failure. For Apprentice use the two named boss settings. Record selected observation IDs and the non-outcome-search selection rule before extracting detailed streams. Read enough of the relevant encounter to explain the terminal sequence; do not just label the final killer as the cause.

Use at most two already recorded successful counterparts where they materially distinguish an explanation. Counterparts may have different packages: disclose that, and do not call them randomized controls.

Output a compact `ENCOUNTER_REVIEW.md`: observed sequence, existing intended response, whether it happened and was legally available, implementation fact versus hypothesis, then a concrete designer question or supported next proposal. Provide at most three priorities across the review. No class or enemy tuning, added spells, altered loadouts, or new strategy runs are authorized by this review.

**Ask before inventing** when the intended answer remains unclear. Do not ask the designer to repeat the strategies above. Clearly established implementation defects may be documented with a proposed correction, but are not silently bundled into S+C. This review and the class experiment are independently useful.

## 6. Measures that decide adoption

### Spirit

Show within-pair useful work, survival/death time, owner HP/barrier pressure, and boss kill/time/progress. Record 0–5 and 5–10-minute farm work from continuous lives; keep lifetime kills distinct. Existing discharge/Guard events can explain a result, but missing exclusive overkill attribution is not a blocker and must not be fabricated.

The intended result is a narrower excessive advantage without erasing Spirit's niche or creating a systematic new entry/boss failure. Do not require parity with Slinger or fit numbers to the largest pooled historical gap. Do not infer that -5 percentage points of frame Attack means -5% final DPS. Report actual recalculated Attack/cadence and measured outcomes.

A new loss in a formerly successful matched case is a serious counterexample to review, not automatic evidence the candidate is wrong or an excuse to change the build mid-run. Distinguish a modest timing change from losing the boss's essential counterplay, such as no longer breaking its plate before a charge.

### Conduit

Use the retained formation, replacement/payment and work streams. Report time with no summons or at/below half authored offense, completed kills and late-window work, actual landed HP progress, replacements, HP spent, owner-pressure/safety-floor stalls and deaths. Normalize payment context per elapsed time or completed work where useful; do not compare raw totals from unequal lives as if exposure were equal.

Acceptable evidence is better useful work/availability without a serious owner-health regression or excessive new boss advantage. More replacements or higher authored availability alone is not success. Keep unchanged summon HP and offense explicit. A null effect or a payment spiral is a valid reason to reject/revise the numerical candidate; do not automatically add damage or reduce payment costs during execution.

### Unchanged controls and inference limits

N1/N2 should retain their previous treatment-independent readbacks and matched outcomes under identical deterministic conditions. Investigate a genuine unexplained divergence narrowly rather than dismissing it as randomness. Do not expand them into a census. Unit/readback checks also cover T1 Spirit and all framed Conduit variants; two negative-control fights are not universal regression proof.

T4 inheritance is explicit, but this packet does not measure T4 combat. Identify any specific uncovered later-path risk in the adoption recommendation, without silently certifying T4 or turning it into a prerequisite broad survey.

Never pool raw kill counts/rates across different fixtures, phases or numbers of cases into a class ranking. Post-death windows are unobserved, not sustainable zero-rate or survived windows. Two seed labels need not generate different boss realizations. The output is a bounded treatment comparison, not significance or exhaustive balance proof.

## 7. Handoff, publication, and the approval gate

**Astra now:** implement the exact candidate on isolated commits, prepare both fixed sources/receipts and the 56-row ledger, perform the focused checks, and supply `LUNA_RUN.md` with verified commands. Resolve routine receipt/fixture details without a new planning round. Do the bounded existing-trace review, or state precise unavailable evidence. Do not launch an unallocated exploratory run, merge, or alter the candidate from its declared values.

**Luna next:** execute the sealed packet once, supervise operationally, and report. Do not decide new builds or tune values. Publish one readable `REPORT.md`, compact per-case and paired summaries, source/build/initial-state receipts, completion counts and raw-artifact references. Raw gigabytes stay external.

**Commit AND push** the scoped preparation, experimental diffs and compact results to the designated experimental branch through the normal workflow. Verify remote availability and return branch, measured control/candidate SHAs, publication SHA, report path, and planned/new/completed/failed/not-run counts. No force push, unrelated staging, merge, release, or deployment. Publication failure does not authorize rerunning combat.

The final report includes a short **proposed patch for designer approval**, with separate decisions for S and C:

| Required field | Content |
|---|---|
| Exact change | Named parameter and old -> tested value |
| Measured effect | Relevant paired outcomes and important counterexamples |
| Recommendation | Adopt tested value / revise once / reject |
| Scope and risk | Affected tiers/frames, unchanged behavior, remaining limits |
| Status | Tested candidate only; **awaiting designer approval** |

Any suggested revised value that was not run is labelled **untested**. Do not present it as the measured candidate, auto-run it, or merge it. The command center uses the report to put the final patch choices in front of the designer. The encounter review may propose a separate next action, but it cannot postpone deciding S and C indefinitely.

**Finish line: two measured, separable numerical candidates and a concise encounter diagnosis. No automatic follow-on campaign.**
