# Playtest 3 reward and mastery study — initial source analysis

Latest follow-up: [iteration 05 — XP-only holdout on new nodes and seeds](iteration-05/RESULTS.md). Before that: [iteration 04 — separate build, biome and recovery/stance effects](iteration-04/RESULTS.md). Earlier configurations and evidence below are retained.

Latest follow-up: [iteration 03 — T4 fast-end target around 50 minutes](iteration-03/RESULTS.md). Earlier results below are retained as historical evidence.

Prepared 2026-09-25. **Source analysis complete; real-player calibration pending telemetry access.** An isolated candidate was subsequently applied and tested; see [executed results and decision](RESULTS.md).

**Follow-up:** [Joint XP, essence and upgrade proposal](PROPOSAL.md) adds concrete search ranges and a full candidate: 117 item schedules, 46 native gear combinations, a modest essence reduction, and a shorter +3→+5 price tail. It incorporates the user's new +3-at-mastery / +5-at-1.5×-time goals.

## Scope and reference player

The user's corrected per-biome mastery targets are **T1 5 minutes, T2 15, T3 30, T4 60**. T2's earlier 50-minute transcription is superseded. Working assumptions: a typical solo player progressing with tier-appropriate equipment; six newly available mastery levels; active time spent in that biome, including local movement and living recovery. Report combat time separately. Dead/disconnected time and time spent elsewhere are separate measures. These clock and player definitions are study assumptions, not additional user requirements.

Mastery belongs to a **biome group**, shared across its nodes. A new node does not start a fresh six-level budget. Returning biomes start this calculation at the preceding tier's cap threshold; new biomes start at zero. Clearing, retired biomes, catch-up from skipped segments, and existing partial XP require separate treatment.

This studies the working tree at HEAD `ff98ba4513cb9fcb1e5752acfd56495268aff416`. The existing uncommitted reward change adds an essence visual event, without changing the XP calculation. This checkout has **not been established as the deployed playtest-3 build**. The separate economy campaign preparation references another V2 checkout; its data must not be silently substituted. Match deployed version and configuration before treating these findings as a production diagnosis.

## Findings

### 1. Late-tier mastery asks for very few kills

The inventory covers all **140 normal T1–T4 nodes**, including duplicate spawn-pool entries, fixed pack followers and uniformly chosen follower variants. It calculates expected spawned-body composition, not a measured player kill mix. Actual target selection, failed spawns, deaths, AoE and respawn availability can change realized rates.

| Tier | Current segment XP | Target minutes | Effective XP/min needed to hit target | Expected kills across nodes | Seconds per kill needed to hit target |
|---|---:|---:|---:|---:|---:|
| T1 | 1,750 | 5 | 350 | 9.9–62.5 | 4.8–30.2 |
| T2 | 5,000 | 15 | 333.3 | 30.2–140.2 | 6.4–29.8 |
| T3 | 7,000 | 30 | 233.3 | 13.6–40.0 | 45.0–132.6 |
| T4 | 9,000 | 60 | 150 | 3.7–38.6 | 93.3–974.4 |

Fractional kills are budget/expected-reward ratios, not exact completion counts. The seconds-per-kill column includes all time in the chosen clock, not just attack time. It is a break-even calculation, **not a forecast**.

At the deliberately hypothetical rate of four kills/minute, T3 would take **3.4–10.0 minutes** and T4 **0.9–9.6 minutes**. This makes the reported five-minute experience plausible without proving it. T2 is different: the same rate yields 7.6–35.1 minutes, so a uniform slowdown across all tiers is unjustified.

Examples at native node modifiers:

- T3 Swamp 01: 362 expected XP/body, 19.3 kills per segment, 4.8 minutes at four kills/minute.
- T4 Mountain 01: 736.8 XP/body, 12.2 kills, 3.1 minutes at that rate.
- T4 Graveyard 03: 233.4 XP/body, 38.6 kills, 9.6 minutes.
- T4 Trench 04: 2,436 XP/body, 3.7 kills, 0.9 minutes. Trench's elite fights and sparse population make a four-kills/minute assumption particularly uncertain. A 60-minute segment under this composition requires about 16.2 minutes per rewarded kill.

See [INVENTORY.md](INVENTORY.md) for every node and [inventory.json](inventory.json) for individual monster payouts, single-type kill bounds, essence estimates, boss rewards and 1/2/4/8/12-kills-per-minute sensitivity values.

### 2. Threshold compression is the strongest source-level lead

The [September 11 implementation record](../../docs/briefs/biome-mastery-progression-redesign-2026-09-11.md) documents changing segment budgets from 3,774 / 22,507 / 55,510 / 101,243 to 1,750 / 5,000 / 7,000 / 9,000. That is a **7.93× reduction in T3** and **11.25× in T4**. At unchanged earned-XP throughput and entry state, segment times shrink by the same factors. Combat changes since that revision prevent attributing the entire observed difference to this one patch.

The old design document also aimed for T3 13–16 and T4 16–20 minutes; the user's new targets explicitly supersede those aims. Current thresholds alone do not encode time: reward throughput must be calibrated alongside them.

### 3. Essence and XP have different supply controls

The actual reward sequence is:

```text
base = monster.rewards.biomeXp, or 1 when absent
xp = round(max(1, round(base × nodeRewardMultiplier × worldRewardMultiplier))
           × biomeTierXpMultiplier)
```

The biome tier multipliers are **2 / 1.25 / 1 / 1** for XP and **2 / 0.85 / 0.70 / 0.55** for essence. Later-tier essence dampening therefore does not slow mastery. Node rewards add up to 30% in T3 and 40% in T4, with accompanying combat/population changes. They are modifiers of throughput, not a universal estimate of acceleration.

The recommended tuning lever is `BIOME_XP_SEGMENT_BUDGET_BY_TIER`, preserving the existing six-level shares and recipe gates. Reducing the global reward multiplier, monster essence, or combat throughput would interfere with the economy/defense systems the user wants investigated separately.

**Preserving essence per kill does not preserve essence at mastery cap.** A sixfold longer mastery segment yields approximately six times as much essence before cap at otherwise fixed rates. Players can accumulate wallets while waiting for recipe/mastery gates. Any candidate must check equipment affordability and early unlock pacing, not only final cap time.

### 4. Other contributors and edge cases

- Same-node party members receive their own full reward application; XP is not divided by party size. A party's aggregate kills can accelerate each member. Solo and party observations cannot be pooled. Presence-based sharing also means a recipient's own combat time is an incomplete denominator.
- Rewards use the killed monster's node biome tier; the recipient's player tier controls the mastery cap. Earlier-tier nodes can fill later available segments of the same biome. Compare these routes before choosing a global tier budget.
- XP stops after the recorded mastery level reaches cap, but the cap-reaching kill stores its full XP gain. Its overshoot persists. This is not unlimited banking, but it can shorten a later segment.
- `World` initializes the global reward multiplier from `DEBUG_REWARD_MULT` without a production-specific guard at that assignment. Default is 1. Comments claiming production is invariably 1 are stronger than this constructor guarantees. Verify the deployed value; do not assume it was boosted.
- Normal Trench monsters grant 1,260–2,400 base XP, versus 990 XP for its authored dungeon boss. That is a reward ordering worth examining relative to actual encounter duration, not evidence that boss rewards should be raised.
- The boss inventory is an authored payout audit, not a dungeon clear model. Dungeon waves/adds and repeat-clear availability are not included in the normal-node kill mix.
- The old economy philosophy's universal `essence = round(0.16 × biomeXp)` statement is not a reliable runtime formula. The server reads separately authored reward fields and applies different multipliers.

## Proposed calibration

Keep T1/T2 unchanged until observations justify a change. Start with T3/T4 tier-budget candidates, then check biome dispersion. For a clean, complete baseline segment:

```text
candidate budget = current budget × target active minutes / observed active minutes
```

If a representative T3 segment really takes 5 minutes, the first candidate is **42,000 XP**; if T4 takes 5 minutes, it is **108,000 XP**. These are conditional examples, **not recommended shipping values**. A 4–6 minute measured range would imply T3 35,000–52,500 and T4 90,000–135,000. They give a bounded starting search once player rates are available.

Use per-character observations, then summarize median and spread by biome, tier, class/build and available party evidence. Do not overweight high-activity farmers by treating every session as a new player. Retain incomplete segments and their accumulated exposure so the sample does not contain only successful fast players. Report low sample counts plainly.

Evaluate a candidate against first unlock, middle levels, cap time, essence/catalyst balances and gear affordability. At the existing 12/14/16/18/19/21% shares, a steady 60-minute T4 segment puts its first level at 7.2 minutes. Verify that incoming equipment can sustain this wait, incorporating the companion defense study. A threshold change also needs an explicit saved-XP/level migration decision: existing players can retain a level while their XP falls below a newly raised threshold, creating hidden debt. No migration or tuning is applied here.

If a single tier budget cannot reasonably fit both sparse elite biomes and dense weak-body biomes, collect sustained rates before introducing a biome-specific XP correction. Do not attempt to equalize raw XP per monster: different enemies are intentionally different amounts of work.

## Telemetry follow-through

See [TELEMETRY.md](TELEMETRY.md) for the extraction and measurement plan. Current telemetry can support milestone/exposure analysis, but it does not record exact XP balances, kill payouts or ordinary-farming party membership. It therefore cannot reconstruct a perfect solo XP/minute ledger retrospectively. The missing connection does not block the source findings above.

## Reproduction and validation

From repository root:

```powershell
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../reports/reward-mastery-study-2026-09-25/analyze.ts
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../reports/reward-mastery-study-2026-09-25/verify.ts
```

The analyzer checks all 140 normal-node tier segments against the shared threshold/cap functions. The verifier checks **458 node/monster combinations** against the real `grantMonsterRewards` function at multiplier 1; XP and essence payouts matched in all cases. This verifies payout arithmetic, **not combat speed or human pacing**. [verification.json](verification.json) records the result. No bot campaign, live database access, gameplay modification, commit or deployment was performed.

Additional checks passed: `shared/src/config/gameConfig.test.ts`, `server/test/rewardMultiplier.test.ts`, and `git diff --check`. The documentation index and design pacing targets were updated; unrelated working-tree edits were retained.

