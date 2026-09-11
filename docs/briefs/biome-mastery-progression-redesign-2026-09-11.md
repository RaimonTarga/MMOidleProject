# Biome mastery progression redesign — 2026-09-11

Status: implemented first-pass XP/mastery refactor. This session did not launch
bot cohorts or change non-XP balance.

## 1. Scope and audit result

The redesign changes only the amount of biome XP required to reach mastery
levels. These semantics remain unchanged:

- six mastery levels per tier segment;
- biome start-tier offsets;
- biome final-tier gain-stop caps;
- Global Mastery as the sum of biome levels, excluding Clearing and Sanctuary;
- recipe `requiredBiomeLevel` values and placement;
- item-upgrade biome-level and Global-Mastery gates;
- essence rewards, catalyst rates, item prices, class stats, monster stats,
  bosses, Techniques, Cores, stances, and weapon balance.

The relevant consumers were audited as follows:

| Area | Live source | Result |
|---|---|---|
| Threshold data and offsets | `shared/src/config/gameConfig.ts` | Replaced the absolute power curve; retained both public threshold functions and the six-level/cap helpers. |
| Authoritative level-up | `server/src/systems/player/progression/rewards.ts` | No code change needed; it already asks `biomeXpForBiomeLevel` for the next threshold, so it consumes the new curve automatically. |
| XP displays | `client/src/hud/BiomeXpBar.tsx`, `client/src/ui/map/NodeInfo.tsx` | No code change needed; both already derive denominators from the shared threshold function. |
| Recipe gates | `shared/src/data/recipes/types.ts`, recipe data, `checkRecipeUnlocks` | No level values or placement changed. |
| Item upgrade gates | `shared/src/systems/itemUpgrades.ts` | `BIOME_LEVELS_PER_TIER = 6` remains unchanged; generic fallback gates are therefore unchanged. |
| Global Mastery | `globalMastery`, `maxGlobalMasteryAtTier`, upgrade ceiling code | No behavior or cap changed. Existing T2/T3/T4 progression tests remain green. |
| Bot/offline tooling | `bot/src/reference.ts`, `bot/src/tierEntry/profiles.ts`, reports/tools | The generated route reference now prints the live local tables. Tier-entry profiles already used the shared biome threshold function; monster/telemetry tools report earned XP and do not duplicate the threshold formula. |
| Analytics/protocol | reward events, `biomeXP` snapshots, HUD atoms | These carry earned XP totals, not hardcoded thresholds; no schema change was required. |

Stale live examples were corrected in `gameConfig.ts`,
`design_docs/economy-philosophy.md`, `design_docs/t5-t8-endgame-suggestions.md`,
and the generated `reports/bot-route-reference.md`. Archived experiment and
baseline briefs retain their historical pre-redesign numbers; they should be
read as dated evidence, not as the current tuning source. In particular, the
2026-09-10 T2 pacing brief records the old 22,507-XP band intentionally.

## 2. Old model

The old reference threshold was:

```text
F_old(n) = round(25 × n^2.8)
XP_old(group, n) = F_old(n + biomeLevelOffset(group)) - F_old(biomeLevelOffset(group))
```

For six levels per tier, the segment totals were:

| Segment | Old local increments L1→L6 | Old local cumulative L1→L6 | Segment total | Ratio vs previous |
|---|---|---|---:|---:|
| T1 | 25, 149, 368, 671, 1,052, 1,509 | 25, 174, 542, 1,213, 2,265, 3,774 | 3,774 | — |
| T2 | 2,037, 2,634, 3,299, 4,030, 4,825, 5,682 | 2,037, 4,671, 7,970, 12,000, 16,825, 22,507 | 22,507 | 5.96× |
| T3 | 6,603, 7,583, 8,623, 9,723, 10,881, 12,097 | 6,603, 14,186, 22,809, 32,532, 43,413, 55,510 | 55,510 | 2.47× |
| T4 | 13,368, 14,697, 16,081, 17,521, 19,014, 20,562 | 13,368, 28,065, 44,146, 61,667, 80,681, 101,243 | 101,243 | 1.82× |

The T2 band put 46.68% of its XP into levels 11–12. That shape was not a
mistake in isolation, but it no longer fits a game that has six levels in each
segment and many more mostly-linear biomes. The recent canonical T2 measurement
found 94–95% of completed route time in farm objectives, with mastery farming
dominating the measured slice.

## 3. Proposed and implemented model

The model is deliberately data-shaped and lives in `GAME_CONFIG`:

```text
localStepShares = [12, 14, 16, 18, 19, 21]       // sum = 100
segmentBudget(T1..T4) = [1,750, 5,000, 7,000, 9,000]
futureBudget(T > 4) = round(9,000 × 1.20^(T - 4))
```

The existing reward multipliers are unchanged: **T1 2.00×, T2 1.25×,
T3+ 1.00×** (with the existing T0/default 1.00× entry). They multiply earned
biome XP; they are not part of the threshold budget.

For absolute reference level `n` in a T1-starting biome:

```text
segment = floor((n - 1) / 6) + 1
localLevel = ((n - 1) mod 6) + 1
F(n) = sum(B(t), t = 1 .. segment - 1)
       + round(B(segment) × sum(localStepShares[1 .. localLevel]) / 100)
```

For a specific biome, the existing offset behavior is preserved:

```text
XP(group, n) = F(n + biomeLevelOffset(group)) - F(biomeLevelOffset(group))
```

Thus a biome that begins in T2 starts on the T2 local budget at its level 1,
and its level 7 begins on the T3 local budget. Clearing is an explicit tutorial
exception: it does not use the normal T1 curve. Its four thresholds are
`0 / 43 / 172 / 430 / 860 XP`, based on the live Tiny Wisp reward of 43 XP and
corresponding to approximately 0 / 1 / 4 / 10 / 20 kills. Clearing remains
level-capped at 4 and excluded from Global Mastery.

## 4. New local segment tables

These are cumulative XP values within the current six-level segment. The
incremental step costs are the direct differences between adjacent columns.

| Segment | Budget | L1 | L2 | L3 | L4 | L5 | L6 |
|---|---:|---:|---:|---:|---:|---:|---:|
| T1 | 1,750 | 210 | 455 | 735 | 1,050 | 1,383 | 1,750 |
| T2 | 5,000 | 600 | 1,300 | 2,100 | 3,000 | 3,950 | 5,000 |
| T3 | 7,000 | 840 | 1,820 | 2,940 | 4,200 | 5,530 | 7,000 |
| T4 | 9,000 | 1,080 | 2,340 | 3,780 | 5,400 | 7,110 | 9,000 |

Budget ratios are T2/T1 **2.86×**, T3/T2 **1.40×**, and T4/T3 **1.29×**.
The local curve is monotonic, with the final two steps consuming 40% of each
segment rather than the old T2 tail's 46.68%.

## 5. Cumulative reference table through T4

This table is for a T1-starting biome and shows the cumulative threshold from
that biome's level 0. A later-starting biome subtracts its preceding reference
segments through `biomeXpForBiomeLevel`.

| Reference level | Segment/local | New cumulative XP | Old cumulative XP | New / old |
|---:|---|---:|---:|---:|
| 1 | T1/L1 | 210 | 25 | 8.40× |
| 2 | T1/L2 | 455 | 174 | 2.61× |
| 3 | T1/L3 | 735 | 542 | 1.36× |
| 4 | T1/L4 | 1,050 | 1,213 | 0.87× |
| 5 | T1/L5 | 1,383 | 2,265 | 0.61× |
| 6 | T1/L6 | 1,750 | 3,774 | 0.46× |
| 7 | T2/L1 | 2,350 | 5,811 | 0.40× |
| 8 | T2/L2 | 3,050 | 8,445 | 0.36× |
| 9 | T2/L3 | 3,850 | 11,744 | 0.33× |
| 10 | T2/L4 | 4,750 | 15,774 | 0.30× |
| 11 | T2/L5 | 5,700 | 20,599 | 0.28× |
| 12 | T2/L6 | 6,750 | 26,281 | 0.26× |
| 13 | T3/L1 | 7,590 | 32,884 | 0.23× |
| 14 | T3/L2 | 8,570 | 40,467 | 0.21× |
| 15 | T3/L3 | 9,690 | 49,090 | 0.20× |
| 16 | T3/L4 | 10,950 | 58,813 | 0.19× |
| 17 | T3/L5 | 12,280 | 69,694 | 0.18× |
| 18 | T3/L6 | 13,750 | 81,791 | 0.17× |
| 19 | T4/L1 | 14,830 | 95,159 | 0.16× |
| 20 | T4/L2 | 16,090 | 109,856 | 0.15× |
| 21 | T4/L3 | 17,530 | 125,937 | 0.14× |
| 22 | T4/L4 | 19,150 | 143,458 | 0.13× |
| 23 | T4/L5 | 20,860 | 162,472 | 0.13× |
| 24 | T4/L6 | 22,750 | 183,034 | 0.12× |

The T1 budget is now human-calibrated rather than inferred only from the old
curve: a fresh Slinger / `reload-root` Plains playtest at normal 1× canonical
rates took about 10 minutes and 134 kills to reach the former 4,000-XP cap.
The local six-step shape is unchanged; only the T1 budget moved to 1,750 XP.
T2–T4 budgets remain the explicit values above.

## 6. Expected pacing

These are design expectations, not acceptance claims:

- **Tutorial:** Clearing L4 is now 860 XP, about 20 existing Tiny Wisp kills.
  Levels 1/2/3 arrive at about 1/4/10 kills, so the 10-kill First Blood quest
  visibly lands at level 3 and the final tutorial mastery level arrives after a
  short post-quest tail. This should remain comfortably below five minutes for
  a normal fresh player without changing monster rewards.
- **Human calibration:** A brief fresh-character Plains run (Slinger /
  `reload-root`, normal 1× canonical play, mostly AFK on auto, zero deaths)
  took about **10 minutes** and about **134 kills** to reach the former
  **4,000 XP** cap, accumulating roughly **668 yellow essence**. This was too
  slow for introductory T1 pacing. The first-pass response is **1,750 XP**:
  scaling the observed mastery-bound slice gives roughly 4.4 minutes, with a
  design target of about **5 minutes per T1 biome** and roughly **25 minutes
  across five T1 biomes** before bosses, gear farming, travel, and experimentation.
  This remains pending a second manual playtest.
- **T1:** The six-step shape remains 12/14/16/18/19/21; only the segment budget
  changed to 1,750 XP. Treat this as a human-calibrated first-pass target, not
  a final pacing claim.
- **T2:** 5,000 XP replaces the old 22,507 XP segment. At stable kill
  throughput, that is about 22% of the old XP-bound time. Applied to the recent
  first-three-biome observations, ordinary legs project toward roughly 10–16
  minutes, with survival, movement, and route-specific recipe waits still
  capable of pushing an individual leg higher.
- **T3/T4:** 7,000 and 9,000 XP provide controlled growth toward the 13–16 and
  16–20 minute targets. There is no validated T3/T4 pacing dataset in this
  session; their budgets are deliberate starting points for manual playtesting.
- **Content growth:** Later tier completion should still grow through more
  biomes, bosses, gear farming, crafting, travel, deaths, and build
  experimentation rather than an absolute-level mastery wall.

Because rewards were not changed, lowering the XP requirement may also reduce
the amount of essence and catalyst progress naturally farmed before a cap is
reached. The observed ~668 yellow essence is calibration evidence, not a new
economy target. Essence/catalyst tuning remains intentionally deferred until a
second manual playtest; do not infer a supply-side rebalance from this XP-only
change.

## 7. Implementation and validation

Implementation files:

- `shared/src/config/gameConfig.ts` — local shares, T1–T4 budgets, future-tier
  growth, piecewise threshold implementation, the dedicated Clearing table,
  and corrected comments; T1 is now 1,750 XP.
- `shared/src/config/gameConfig.test.ts` — preserved the existing scene-bound
  tests and added exact budget, offset, monotonicity, cap, Global Mastery, and
  Clearing-independence assertions.
- `server/test/clearingMastery.test.ts` — quick authoritative 20-kill tutorial
  smoke covering the unchanged Tiny Wisp payout, First Blood completion, level
  3 at kill 10, level 4 at kill 20, and no Clearing catalyst payout.
- `bot/src/reference.ts` and generated `reports/bot-route-reference.md` — the
  bot knowledge packet now reads and prints the shared segment tables.
- `design_docs/economy-philosophy.md` and
  `design_docs/t5-t8-endgame-suggestions.md` — current design text updated to
  the implemented model.
- `docs/briefs/d3-t5-t6.md` and `docs/briefs/t2-route-theorycraft-2026-08-30.md`
  — stale forward references to the retired absolute curve labeled or updated.
- `docs/README.md` — this brief indexed alongside the other progression briefs.

Validation completed:

- `pnpm typecheck` — passed.
- `pnpm --filter @mmo-idle/server exec tsx --conditions=development ../shared/src/config/gameConfig.test.ts` — passed.
- `pnpm bot:reference` — regenerated the 483-line route reference successfully.
- `pnpm test` — **161/161 passed**.
- Human calibration evidence recorded; no second manual run was claimed.
- No long bot experiment or progression cohort was launched.

## 8. Manual playtesting questions

1. Does Clearing and each T1 biome still feel brisk without making the first
   recipe unlocks feel delayed?
2. Does T2 land near 10–12 minutes of pure mastery for a stable build, or do
   combat throughput and survival make the 5,000 budget too generous or too
   conservative for particular biomes/classes?
3. Do T3 and T4 need the proposed 7,000/9,000 budgets, or should their growth
   be carried more by content count and less by each local segment?
4. Are levels 5–6 meaningfully slower without reading as a final-level wall?
5. Do recipe unlocks and item-upgrade gates still arrive at satisfying moments
   when the XP thresholds move beneath unchanged level requirements?
6. How much essence and catalyst stock is accumulated at each new cap? Measure
   that after playtesting before changing supply-side values.
7. Do legacy saves with old `biomeXP` totals behave acceptably? The refactor
   does not clamp stored levels downward or rewrite saved XP; old levels and GM
   remain authoritative.
