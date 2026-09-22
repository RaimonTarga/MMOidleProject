# Day 2 — turn endurance findings into bounded corrections

## Assignment and ownership

**Give this document to Astra. This is the next experiment-preparation assignment, not a request to rerun or merely republish the overnight campaign.**

Astra prepares the two bounded blocks below, with a runnable manifest and exact Luna commands. Luna executes the sealed packet once, writes a readable report, and commits AND pushes the scoped compact results. The command center decides integration of any gameplay correction after the comparison. Updating named reference builds is separate from changing gameplay defaults.

Deployment, live-server troubleshooting, infrastructure upgrades, economy calibration, and a second breadth/endurance census are out of scope. Do not spend the reserve intended for deployment on additional balance prerequisites.

## Evidence anchors

Read the existing compact artifacts first; open only the raw traces needed for a concrete diagnosis.

- Publication inspected: `74e79df2f8d48a05481c49037fe941b616ecf4fa`.
- Overnight measured source: `e26fdccd3baaa96fe1d19263349d57d9c5abc626`.
- Main report: `reports/player-fast-pass/overnight-endurance-01/run-01/REPORT.md`.
- Per-observation evidence: `results-summary.json` and `resolved-builds.json` in that directory.
- Package catalogue: `reports/player-fast-pass/overnight-endurance-01-preparation/CATALOGUE.md`.
- Existing diagnosis: `reports/player-fast-pass/overnight-endurance-01-preparation/CONDUIT_DIAGNOSIS.md`.
- Earlier diagnostic extraction: `reports/player-fast-pass/farming-sustain-01-preparation/conduit-evidence.json`.
- Raw overnight root recorded by the operator: `D:/mmo-idle/overnight-endurance-01/run-01`.

The preparation README states that overnight production gameplay bytes match the measured R2 line. Verify the actual next execution source and applied R2 profile; do not silently restore R1 or install R2 twice. Pin the next source before execution. Publication-only revisions are not substituted into measured records.

## Decisions carried forward

1. Retain production Conduit R2. No R3 reconstruction-speed, global damage, HP-cost, or summon-health treatment is scheduled here.
2. Promote the tested **Volcanic-charm farming packages**, with their exact remaining equipment/abilities/stance/Runes, to preferred references for these tested ordinary settings: T3 Striker Balanced and Heavy; T3 Squire Balanced and Light; T4 Squire Heavy A and B. Each Volcanic package survived all four overnight fixture/seed cases. Preserve Mountain alternatives and their evidence; this is not a universal charm rule or an item-value patch.
3. Do not promote T3 Apprentice Balanced/Light, T4 Covenanter, or T4 Striker Heavy B as universally reliable just because their charm comparison improved. Their Volcanic arms still had deaths.
4. Do not nerf Slinger/Spirit from aggregate kill totals or buff all Striker/Conduit paths from aggregate deaths. Packages have different equipment, roles, and exposures.
5. Permanently held Recuperating and the earlier rarely exercised low-HP policy remain unscheduled.

## Interpreting the overnight evidence

The 336 observations include 48 deliberately added Mountain controls. From the report tables, Block A alone is 212/288 thirty-minute survivors (73.6%), not 232/336 (69.0%). This is a descriptive package screen, not a player success probability.

The 48 charm pairs contain 20 Volcanic-survives/Mountain-dies pairs, 20 both-survive pairs, 8 both-die pairs, and no Mountain-survives/Volcanic-dies pair. Kill totals still favor Mountain in four pairs. Do not translate unequal survival exposure into a DPS multiplier.

Two prose counts require a small reporting erratum: the identity ledger gives T4 Slinger Heavy A **8/8** overnight observations, not 20, and T4 Spirit Heavy A **4/4**, not 16. Check against the compact JSON before publishing the erratum. Preserve historical report bytes and add an explicit correction or tracked amendment, not silently altered measured metadata. This does not require new combat and does not gate the next packet.

Positive lifetime kills do not prove uninterrupted late-window progress. Use the already recorded progress gaps/endpoints for suspicious survivors, without invalidating unrelated observations.

## Block A — Conduit target-session / shield-lifecycle correction

### Question

Can a narrow session-lifecycle correction stop a monster from repeatedly receiving a fresh encounter shield merely because its selected physical summon dies, while the same owner/formation remains genuinely engaged?

### Existing evidence, not a fresh open-ended investigation

The prior Balanced Defensive Tundra trace already identifies Glacier Bear: 4,313 HP throughout; 2,151 direct damage events, each 0 HP damage and 14 absorbed; 30,114 absorbed total; 94 sampled aggro-session starts. The preparation diagnosis traces lost selected minions through `combat.ts`, `targeting.ts`, `monsterMechanics.ts::combatSession`, and `refreshEnemyShieldState`.

This supports a specific session-reset candidate. It does not prove every Conduit failure has this cause, nor does it establish the missing exact within-tick ordering. Verify that ordering with a focused production-path test rather than rerunning the broad screen or demanding new comprehensive telemetry.

### Candidate boundary

Prepare **one** minimal correction preserving session/shield continuity across a target handover within an actually continuing engagement. Choose the implementation after reading the real state ownership. Do not simply prevent all resets, make shields one-use forever, extend every leash, freeze a session indefinitely, or weaken shield amounts/cadence. Preserve true disengagement, ordinary reset/re-engagement, and other session-scoped mechanics.

This is a suspected combat-state correctness issue, not authorization for a new enemy balance pass. If source inspection shows that the observed renewal is an intentional design rule rather than a safe correctness repair, state that fact and the exact design decision needed; do not fabricate a fix or keep labeling the question generically 'Conduit uptime'. Return that disposition during preparation while allowing Block B to proceed.

Use focused tests for selected-summon loss with another live engaged summon; continued owner/formation attacks including absorbed hits; normal target handover; genuine disengagement and subsequent re-engagement; and an ordinary non-Conduit attacker. Do not redefine combat around HP damage alone.

### Combat comparison: maximum 8 new observations

Two exact packages:
- T3 Balanced/mid Conduit, using the original **Defensive** Tundra package that demonstrated the stall, retaining its original charm and automation.
- T3 Balanced/mid Slinger, using the existing Offensive Tundra reference as a non-Conduit regression control.

For each: current-production control versus the one correction; Tundra `node-t3-tundra-03`; seeds **101003** (historical reproduction) and **101009**; 100 ms ticks; **300,000 ms** cap; stop at first player death.

`2 packages × 2 arms × 2 seeds = 8`, including controls. Do not quietly count a different historical package as the control. If a seed does not engage the relevant shield, mark that row unexposed for shield efficacy; it remains available as general regression evidence. The focused test must exercise the actual target-loss sequence.

Record relevant target HP/barrier progress, shield reinitializations and their session transitions, actual formation-target handovers, completed kills, deaths, and genuine disengagement behavior. New recording should be narrow, read-only, and shared across both arms.

Success means the demonstrated false-refresh mechanism is eliminated and supported HP progress is restored without breaking legitimate resets. It does not require Conduit to match Slinger throughput or solve Volcanic attrition. Hold gameplay adoption for command-center review; preserve the control source and patch separately.

## Block B — finish the useful package comparisons before choosing class multipliers

### Question

Can already available sustain/defense tools address four concrete remaining weak packages, or do failures persist after these bounded changes?

This is **four predeclared package comparisons**, not a new build search. No weapon/core/armor/ability permutations are added during execution.

| Identity | Control | Candidate | Ordinary fixtures |
|---|---|---|---|
| T3 Apprentice Light (`breadth-t3-apprentice-light`, Venom vessel) | Overnight Volcanic charm + Offensive package | Same Volcanic charm package, **Defensive Stance only** | T3 Tundra-03 and Volcanic-03 |
| T4 Striker Heavy A (`breadth-t4-striker-heavy-a`, Berserker) | Exact overnight Mountain-charm package | **Inferno Heart +5 only** in the recovery slot | T4 Desert-03 and Graveyard-03 |
| T4 Striker Heavy C (`breadth-t4-striker-heavy-c`) | Exact overnight Mountain-charm package | **Inferno Heart +5 only** in the recovery slot | T4 Desert-03 and Graveyard-03 |
| T4 Conduit Heavy B (`breadth-t4-conduit-heavy-b`, Champion) | Exact overnight Mountain-charm package, including its **close** range | **Inferno Heart +5 only** in the recovery slot | T4 Desert-03 and Graveyard-03 |

Resolve display names from the applied receipts; stable skill paths control identity. Do not assume all Heavy paths use the same range or recipient mechanics.

Use both overnight seeds **101009 and 101021**, continuous **1,800,000 ms** windows, 100 ms steps, and first-death stop. Retain 5/15/30-minute endpoints from the same life.

Maximum allocation: `4 identities × 2 arms × 2 fixtures × 2 seeds = 32` observation cells including controls. The 16 exact overnight controls may be reused when the actual package, gameplay source, seed, fixture/roster, measurement and stop contracts are compatible. Record their source observation IDs and do not relabel them as new runs. No seed or source compatibility is assumed from a matching display name. If replay is needed, it consumes the existing 32-cell ceiling; no separate hidden control batch.

The approved Conduit session candidate is **not** silently included in either Block B arm. Keep Block B on one common R2 gameplay context, with only its declared package differences. If a later integrated fix becomes the intended baseline, explicitly rebuild both arms on that same context and stop treating old rows as matched controls.

For charm swaps, remove the Mountain barrier, recalculate actual Recovery and all dependent recipient stats, and verify real evolved +5 ownership. The comparison includes every consequence of the actual item substitution; do not normalize the two packages to identical HP pools or grant both items' benefits.

For Apprentice, preserve the Volcanic charm, weapons, armor, core, Guards, techniques, range, and Rune order. Both stance choices must be legally attuned; confirm actual RP without artificially filling headroom. This tests combined sustain plus mitigation after Volcanic alone failed all four cases, not a repetition of the earlier Mountain-charm stance comparison.

Outcomes: first death/cap, completed kills, HP damage versus absorption, unfinished targets, sustained progress/gaps, survival margin, and available death/recovery context. Successful terminal survival with negligible work is not a satisfactory rescue. Do not turn earlier death into lower per-second DPS without accounting for exposure and changed pull timing.

### Stopping decision

If a candidate materially improves completed work and survival without a serious contrasting regression, recommend adopting that named package for the tested settings. If it still fails materially, return the specific remaining mechanism and at most one prospective numerical or ability-level correction for the next command-center decision. Do not schedule a third/fourth package variation automatically or require an exhaustive optimum before considering a class adjustment.

## Allocation and execution

- Block A: up to 8 new short observations.
- Block B: 32 cells including up to 16 reusable overnight controls.
- Total: **at most 40 new combat observations**, potentially **24** when all 16 B controls are reusable. Report new, reused, failed, and omitted counts separately.
- Keep A and B independently executable. A real blocker in A must not stop B.
- No full overnight rerun, no additional seeds after seeing outcomes, no cap extension, no adaptive numerical tuning.
- Preparation qualification should be pure or zero-tick where possible. Any combat probe must be an allocated case prefix that continues, or a separately identified observation within the ceiling. Focused unit tests are not new balance evidence.
- Use the existing dispatcher and reports; do not create another harness. A source/manifest/shared child failure stops the affected family. Gameplay losses do not.
- One owning preparer per packet/worktree. Do not modify files under an active Luna execution.

## Required handoff and final report

Astra provides one short `LUNA_RUN.md`, exact verified commands, a fixed revision per arm where necessary, declared candidate diff, legal applied build receipts, ordered case ledger with reuse IDs, and expected output paths. It must clearly distinguish prepared work from executed work. Block A's code disposition is explicit, not silently omitted.

Luna runs once and returns one compact readable `REPORT.md` with no more than five findings and three recommended decisions. Show all matched outcomes, serious counterexamples, uncertainty, and any unexercised mechanisms. Keep event histories external; publish compact per-observation JSON with explicit source, package, arm, seed, fixture, and artifact references.

**Commit AND push** the scoped report, compact evidence, manifests and receipts through the normal repository workflow. Verify the resulting remote files and return branch, publication SHA, measured SHA(s), readable report path, and counts. Do not commit raw gigabytes, environment files, player databases, credentials, unrelated changes, or claim deployment. A publication failure is a publication failure, not a reason to rerun combat.

Finish the packet and stop. Do not create another campaign or adopt Block A into production autonomously. The previous numerical authorization for Conduit is not a reason to bundle an unmeasured multiplier into this comparison.
