# Reward/mastery candidate 01 — executed decision report

Follow-up: [Iteration 02](iteration-02/README.md) restores T1 XP and retests historical surviving setups. This report retains candidate 01 results.

2026-09-25. **Do not adopt the complete package. T1 is too slow; T4 has promising but narrow evidence; T2/T3 remain unresolved.** Player-database corroboration remains deferred as requested.

## Applied experiment

The changes are applied in the separate checkout `C:/Users/osaif/Documents/Claude/Projects/mmo-reward-candidate`, branch `codex/reward-mastery-candidate-01`, based on `ff98ba4513cb9fcb1e5752acfd56495268aff416`. They are local, uncommitted, and not deployed or merged into the main checkout. [Candidate patch](candidate.patch) captures the source changes for review.

| Control | T1 | T2 | T3 | T4 |
|---|---:|---:|---:|---:|
| Target minutes per biome segment | 5 | 15 | 30 | 60 |
| Tested segment XP | 6,000 | 18,000 | 42,000 | 108,000 |
| Essence reward multiplier | 1.8 | 0.765 | 0.63 | 0.495 |
| Catalyst progress multiplier | 0.5 | 5/18 | 1/6 | 1/12 |

117 four-slot gear recipes redistribute acquisition-through-+3 to approximately two-thirds of lifetime essence cost, preserving base acquisition and total +5 cost by color. Stats, upgrade gates, catalyst asks, and evolution requirements are unchanged. Exact final prices: [candidate-costs-live-t1.json](candidate-costs-live-t1.json).

The original T1 proposal missed a server default-F +5 price override. The first runs therefore did not exercise its intended authored schedule. Revision 2 removes the implicit override from normal purchases, retains explicitly assigned experiment overrides, and preserves the **actual baseline runtime** lifetime cost for all 20 T1 recipes. For example, the Plains set's baseline lifetime is 885, not the originally assumed 950. This is a correction to the experiment, not a successful calibration. The original schedules and observations remain available; their T1 funding columns are superseded by `bot-t1-final`.

## Findings and recommendation

**T1: reject 6,000 XP and retract the original 5,000–6,500 search range.** Baseline Plains mastery with granted +3 takes 3.54 minutes for Cadence and 5.08 for DoT; the candidate takes 12.29 and 18.06. Cave Cadence moves from 2.93 to 10.17. In the corrected purchase runs, Plains Cadence masters at 13.56 minutes and buys full +5 at 13.57; DoT masters at 20.66 and buys full +5 at 20.67. Full +3 arrives at 8.62 and 13.35 respectively. Thus +5 is available essentially at mastery, instead of requiring 50% more farming. Cave Cadence masters at 11.32 and buys +3 at 12.38; +5 remains unobserved. Buying upgrades does not rescue the target. Start subsequent T1 calibration around the existing 1,750 budget, with roughly 1,750–2,500 as an exploratory range rather than a validated replacement. T1's mastery clock and desired equipment spending do not line up automatically; pushing XP to meet a cost model was the wrong direction. Integer reward rounding also means a nominal 10% supply cut can have little effect on small T1 payouts.

**T2: no pacing verdict.** Both baseline and candidate fixtures die in roughly 0.14–0.74 minutes. Neither the proposed XP increase nor the essence package is validated. Retain 5,000 as the live reference until a viable representative route/build or player telemetry establishes throughput. Do not infer that 18,000 is appropriate from this screen.

**T3: no defensible calibration yet.** Default-rune fixtures die before mastery in both arms. A no-rune Cadence Swamp baseline masters in 4.69 minutes, but both matched runs die at 18.71; the candidate is still below cap. This supports investigating a substantial slowdown, but does not verify 42,000 against the 30-minute target. Keep 35,000–52,500 only as a hypothesis from the reported fast baseline, not a measured recommendation.

**T4: the strongest partial support is Cadence in Trench with granted +3.** Two default-rune seeds reach candidate mastery in 49.65 and 49.10 minutes, versus baseline 4.30 and 4.45. At candidate mastery they have earned 8,963 and 8,916 essence against a full +3 lifetime cost of 8,533: roughly 104–105% funded. In the seed surviving long enough, +5 funding arrives at 70.55 minutes, or **1.44× mastery**, close to the desired 1.5×. The other dies at 67.75 before +5 funding; it must remain censored. A separate no-rune run reaches mastery at 51.46 and +5 funding at 74.65 (1.45×), but is not an independent player cohort.

For this surviving T4 fixture, linear throughput scaling suggests **about 125,000–135,000 XP**, centered near 130,000, to reach 60 minutes. That range has NOT been run. Raising XP alone would leave more than a +3 budget at mastery and shorten the relative +5 tail; a joint follow-up should consider another roughly 15–20% essence reduction relative to this candidate for this fixture, or reprice the set. This is a conditional next experiment, not a global recommendation: other nodes/builds can be much slower or die. The existing 10% cut already brings funding close at the measured 49-minute cap.

**The +5 result is funding, not completed purchases.** T4 +0 purchase fixtures die quickly in both arms, and missing catalyst families/colors require routes this harness does not implement. No actual full +5 purchase outside T1 Plains was demonstrated. The broad claim that ordinary progressing players finish a +3 set at mastery and +5 at 1.5× is therefore **not proven**.

## Evidence and interpretation

[Every observation](BOT-TABLES.md) and [machine-readable results](bot-results.json) retain all runs. Each batch contains its manifest, exact job inputs, individual outputs/logs, and `complete.json`.

- `bot-run`: 64 original fixtures without runes.
- `bot-supported`: 64 fixtures with the default rune loadout, trimmed to the current RP budget.
- `bot-replicate`: 24 second-seed fixtures for T1 Plains, T3 Swamp, T4 Trench.
- `bot-t1-extended`: 16 longer T1 fixtures to resolve the initial 10-minute horizon; superseded by the corrected T1 run.
- `bot-t1-final`: 16 corrected T1 fixtures, 30-minute horizons, accurate runtime funding costs.

This is 184 completed simulations across related diagnostic batches, not 184 independent players. Repeated seeds and extended horizons overlap. Use only `bot-t1-final` for final T1 price/funding interpretation; T2–T4 mechanics were unchanged by the T1 correction. Source hashes for the first revision are in [bot-source-identities-r1.json](bot-source-identities-r1.json); final source and harness hashes (including a comment-only addition after execution) are in [bot-source-identities.json](bot-source-identities.json).

Bots execute real authoritative `World.tick`, combat, reward and purchase systems at 100 ms, using baked hitboxes and deterministic random seeds. Times are **simulated active time**, not wall-clock durations. First death stops a run; there are no hidden revivals. Eight nodes, two class roots and two modes were screened. `fixed3` grants +3 gear and measures income; `buy` grants current-tier +0 gear on credit, repays its base essence acquisition cost, then calls the real upgrade function.

These are synthetic fixtures: benchmark abilities are granted, other biome mastery is completed, loadouts differ between rune batches, and there is no earned prerequisite journey or cross-biome travel. A four-piece native reference set is not every possible build. Death can reflect those fixture choices as well as defenses; it does not establish a production player death rate or prove the candidate caused a survival problem. The separate defense study remains independent. There was no browser/live-player verification and no database access. The local baseline has not been established as the exact deployed playtest build.

## Validation and remaining limitations

- Final direct validation passed: **117 recipes / 585 shared price checks and actual server upgrade debits**, with lifetime totals and XP/catalyst controls checked.
- Final project and benchmark typecheck passed.
- Final focused checks passed: item upgrades, reward multiplier/cap behavior, and game configuration.
- Complete regression discovery ran 275 test scripts: **271 passed, four failed**. The T2/T3/T4 progression economy tests require historical accelerating upgrade prices; the telemetry economy test requires historical T1 prices. All four pass on the baseline. Their failing assertions conflict with the experimental price distribution. They remain visible rather than being weakened to label this rejected package green; later assertions in those scripts were not reached. Per-file logs and exit codes live in the candidate checkout's `reports/reward-mastery-study-2026-09-25/regression/`. The earlier interrupted serial run is retained separately and is not counted as the suite result.
- Full regression preceded the final T1 runtime correction; the final debit checks, focused tests and typecheck cover that correction. This is not a final green full-suite result.
- No saved-character XP migration was implemented. New T4 XP also affects the existing extrapolation into future tiers. Existing accounts, explicit economy experiment arms and higher tiers need a separate adoption review.

Recommended next step after telemetry access: match the deployed revision, segment active biome time by tier/build/gear and deaths, measure XP and each essence color earned/spent, and distinguish funding from completed upgrades and catalyst bottlenecks. Use those distributions to select separate tier changes. Do not merge this full package based on the narrow surviving fixture.

