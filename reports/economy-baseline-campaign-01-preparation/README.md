# Economy baseline campaign 01: preparation

> Superseded as the recommended experiment plan by [Economy V2 campaign 02 preparation](../../../mmo-economy-v2/reports/economy-baseline-campaign-02-preparation/README.md), prepared on candidate `aa9f7d6c327833dd033777b4c9840a9966eac38f`. The original campaign-01 matrices, source identity and validation below are preserved. Do not run them against V2.

Prepared on 2026-09-24 against committed `develop` **ff98ba4513cb9fcb1e5752acfd56495268aff416**, tree `f1149f6d3756fa95b87754b21913f9e4ffb6882b`. This matches the supplied handoff. **Not launched, not sealed, not yet launchable.** No gameplay/economy values changed.

The user's request is to prepare experiments. The reference document's launch, automatic confirmation, and publication instructions describe the proposed future campaign; they do not authorize execution in this preparation task.

Reference: `C:/Users/osaif/Downloads/ECONOMY_BASELINE_CAMPAIGN_01_HANDOFF.md`, SHA-256 `d8f157b4623215d74df6a442fa9bdeb7f744ac174082e7bcca55774ebcdfd95f`.

## Prepared matrix

| Block | Proposed observations | Exposure / endpoint |
|---|---:|---|
| R1 | 1,332 | Four actors at each player tier, every normal node at or below that tier, 20 simulated minutes each |
| R2 | Analysis of R1 | Separate same-biome XP, relevant essence colour, and catalyst-family comparisons |
| R3 | Deterministic selection after R1 | All red pairs, up to eight yellow pairs, plus same-biome inversions; 60 simulated minutes per arm |
| P | 32 | Four tiers × four actors × two independent fresh-world exposures; 24 simulated hours per life maximum |

R1 deliberately over-covers normal content: 27 T1, 37 T2, 38 T3 and 38 T4 nodes. Per-player-tier cell totals are 108 / 256 / 408 / 560. These are planned cells, not qualified reachable cells. No dungeons, sanctuaries, tutorial clearing, or unique-boss nodes are targets. Verify travel reachability from the selected state before sealing, preserving unavailable rows. In incidental ordinary-world encounters, retain all rewards but distinguish any boss contribution.

Use **timeScale=1 and rewardMultiplier=1** throughout. The reference allows 2× time, but the existing bot marks non-1 time scales noncanonical. Replica numbers are independent exposures, not invented RNG seeds. The runner exposes no general seeded-world experiment option in the inspected create path.

At 1×, R1 alone budgets 444 worker-hours; P budgets at most 768 worker-hours. Together this is up to 1,212 worker-hours before R3/setup, or an idealized 303 hours at four continuously occupied workers. This is a deliberately broad baseline, not an overnight packet. Early completion can reduce P time; resource contention can increase wall time.

## Profiles and boundaries

| Actor | Current T1/T2 frame | T1 authority | T2 authority |
|---|---|---|---|
| Striker | cadence-balanced | striker-t1 | striker-t2-mid |
| Squire | cooldown-heavy | squire-t1 | squire-t2-mid |
| Apprentice | dot-balanced | apprentice-t1 | apprentice-t2-mid |
| Conduit | summoner-balanced | conduit-t1 | conduit-t2-mid |

Exact versions, conditional purchase/upgrade plans, travel, milestones, and completion predicates are exported in `route-authorities.json`; do not substitute historical variants or the strongest loadout. T1 **starts root-only**: the declared frame is purchased after advancement, not granted at fresh T1 entry. T3/T4 frame/specialization and full purchase plans remain unresolved, so their matrix fields are null.

T1 routes begin in Clearing. Exclude tutorial time from the primary T1 clock: use the authoritative tier-up to T1 as tier entry, and report tutorial duration separately. Existing canonical route completion is all five T1 boss clears. Report first T2 advance separately, because full-gauntlet completion occurs later.

T2 full branch routes use advancement to T3 as their completion predicate, and author seven biome legs with boss attempts. Preserve both first advancement and authored-route completion; do not call unvisited later legs complete. The similarly named `*-t2-canonical-*` validation routes are **bossless**, and `*-t2-economy-pacing-*` stop after Swamp: neither measures the requested full tier/seal boundary.

For P, the 24-hour cap is a preparation choice using the existing bot default (`bot/src/config.ts`), larger than the experiment CLI's six-hour default. It must be supplied explicitly in a future manifest and be identical across profiles within a tier. Existing farm watchdogs still apply: 30-minute step timeout and 12-minute no-progress guard. Raising only `maxRunMs` does not raise them. A reviewed route preparation must explicitly extend active farm steps to the existing two-hour pacing convention before sealing, preserving the no-progress guard and recording the instrumentation-only route revision. Do not silently alter timeouts during execution.

## Current readiness findings

1. **Historical T2 inputs are incompatible.** The standard external experiment archive contains 784 snapshot/checkpoint files, of which 225 files meet preliminary canonical/1×/untainted metadata checks (copies included). Every such candidate is T2 entry. The predeclared first two replicas from the final T1 economy cohort, for each requested actor, all fail the current importer with `T1 handoff snapshot rune ownership does not match crafted Rune recipes`. Exact paths, hashes, and failures are in `t2-input-validation.json`. Do not repair their saved ownership or shop retrospectively for richer input states.
2. **No canonical T3/T4 input was found in that archive.** This is a scoped inventory result, not a claim about all disks. Named checkpoint examples retain synthetic/25× lineage. Full current T3/T4 acquisition routes and the T4 playtest terminal milestone are not designated for these four profiles. Available continuation routes are inventoried, not adopted as complete pacing routes.
3. **Checkpoint provenance and economy eligibility disagree with the handoff.** `botRun.ts` adds `RESTORED_PROGRESSION_CHECKPOINT` to every named continuation. `summary.ts` requires zero taints for economy eligibility. A new campaign cannot remove the taint in postprocessing. A reviewed contract must distinguish valid earned continuation from synthetic restoration, while preserving all inherited taints and exact wallets.
4. **Block R needs a fixed-profile adapter.** `farmMatrix.ts` selects builds using the target's content tier. It is unsuitable for this comparison. No R row has an approved input or qualified rate runner yet.
5. **Five simultaneous blocks exceed current scheduling support.** The isolated runner/queue limit is four workers. The queue fills in registration order, not round-robin; registering five manifests does not guarantee tier overlap. Resolve this before sealing. Do not bypass limits by starting five independent supervisors.
6. **Pacing acceptance bands are unspecified.** The user was asked for tier/biome duration targets. Keep verdicts unset until supplied; measured durations alone cannot establish that human-playtest criteria are met.

The first four findings prevent a complete canonical campaign from being sealed today. Fresh earned prerequisite captures are separate work before the measured campaign, unless compatible authoritative artifacts can be supplied. Measured P-T2/T3/T4 must then start independently; they must not wait for this campaign's lower-tier results. Missing cases remain explicit `not-run` rows.

## Files and reproduction

- `campaign.json`, `pacing-matrix.json`, `rate-matrix.json`: machine-readable proposed cases; all launch flags false.
- `node-inventory.json`: exact node/modifier/density configuration and reward premiums.
- `recipe-demand-catalogue.json`: current equipment recipes, gates, costs, evolution and upgrades; a source catalogue, not a claim every recipe is planned/reachable. Ability/Rune/stance/Rite purchases must also be resolved from route steps and their production registries before seal.
- `snapshot-inventory.json`, `t2-input-validation.json`: external input provenance inventory and importer checks; raw snapshots are not copied into Git.
- `route-authorities.json`, `later-tier-route-inventory.json`: actual route data including purchase and completion predicates.
- `MEASUREMENT_CONTRACT.md`, `LAUNCH_GATES.md`: measurement semantics and work required for a valid executable packet.
- `preparation-hashes.json`: integrity hashes of generated preparation JSON; **not an execution seal**.
- `VALIDATION.md`: checks actually performed, separate from live qualification.

Rebuild the inventory without combat, Docker, database changes, or launch:

```powershell
pnpm --filter @mmo-idle/bot exec tsx --conditions=development src/tools/economyBaselinePrepare.ts
```

The preparer rejects source drift and uncommitted changes to inspected authority directories. Optional `--snapshotRoots=C:/archive-one;D:/archive-two` (quote the whole argument in PowerShell) extends the search; `--out=<absolute-directory>` redirects output. Rebuilding overwrites the generated preparation JSON only. This is not a `prepare`/`run` execution harness.

Future publication consists of `CROSS_TIER_FARM_RATES.md`, `TIER_PACING_T1.md` through `TIER_PACING_T4.md`, and `ECONOMY_BASELINE_SYNTHESIS.md`. Do not create empty results that look executed. Preserve raw ledgers and milestones externally with SHA-256 inventories. At most five evidence-backed candidate economy problems, each naming an exact supply/demand lever; no automatic tuning, merge, or deployment.
