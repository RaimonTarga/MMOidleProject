# Defense iteration 04: finite-pack replay

Date: 2026-09-25. Branch `feat/defense-rework`. Runner `server/bench/defenseFinitePack04.ts`
(commit `8c1afd0d`), analysis `analyzeFinitePack.mjs`. Raw rows are in
`D:/mmo-idle/defense-rework-2026-09-25/finite-pack/` (8.7 MB, not committed). The full paired
output is in [FINITE-PACK-ANALYSIS.txt](FINITE-PACK-ANALYSIS.txt).

This is the experiment that iteration 03's "Next experiment" specified. Each run is one
native pack or explicit cluster, spawned at a fixed anchor 180 px from a fresh, full-HP bot.
Native Runes and enemy abilities run, and repopulation is off. A run ends at first death, or
10 s after the last enemy dies. Everything else about the bot is held equal: the six
classes' balanced breadth builds at +3, the same core and relic, and the same Volcano monster
data in every arm.

The screen was fixed-size: 4 declared seeds (303007/019/041/067) × 90 cells.

- **Three arms, baseline variant:**
  - original (develop `7094727e`)
  - pipeline-only (a) (`2bc19c1e`)
  - full candidate (a+b) (`9e6e795a`)
- **Iteration-03 variants on the candidate:**
  - Desert T3/T4 +6 DR
  - Jungle +10 evasion
  - Jungle +5 evade mitigation
  - Graveyard reactive plating removed

All 1584 runs completed. All 1224 cross-arm pairs share the same starting-pack hash, so every
arm faced exactly the same threat.

**Sample-size caveat:** seeds 303007 and 303019 produce identical rows in about half of all
cells. Only 213 of each arm's 360 rows are distinct outcomes, so treat death counts as
roughly 60% of their nominal sample.

## Arms

| Arm | Deaths / 360 | Packs cleared | Mean min HP |
|---|---:|---:|---:|
| Original | 47 | 310 | 0.617 |
| (a) pipeline only | 46 | 311 | 0.604 |
| (a+b) candidate | 58 | 301 | 0.534 |

**(a) vs original:**

- One T3 Volcano/Desert Conduit run is saved and nothing is lost.
- The HP floor dips by about 0.01–0.02 in most cells.
- Large dips appear only where charged hits now pay plating once after the multiplier:
  T4 Volcano anchor, −0.10 (Desert armor) and −0.07 (Jungle armor).

**(a+b) vs (a), by class (60 paired runs each):**

| Class | (a) deaths | (a+b) deaths | Saved | Lost |
|---|---:|---:|---:|---:|
| Squire | 11 | 8 | 3 | 0 |
| Striker | 8 | 5 | 4 | 1 |
| Conduit | 22 | 24 | 0 | 2 |
| Apprentice | 5 | 10 | 0 | 5 |
| Slinger | 0 | 4 | 0 | 4 |
| Spirit | 0 | 7 | 0 | 7 |

By tier, T3 goes 43 → 56 deaths and T4 goes 3 → 2. Almost the whole T3 loss is one pack:

- **T3 Volcano anchor, Desert armor: 2 → 15 deaths.**
- T3 Volcano anchor, Jungle armor: 5 → 9.
- T3 Jungle mixed rally improves, 12 → 8.
- T4 Gravewright improves, 3 → 0.

Mechanism for the Volcano loss, T3 Desert Slinger:

- Starting defenses go from 345 HP, 38 plating, 0% DR to 407 HP, 2 plating, 14% DR.
- Magma Brute hits land at 131–134, and Ash Slingers finish at 62–80.
- Ranged and caster bots die at 17–21 s.

The pack mixes one heavy hitter with many small hitters. Flat plating was the right tool
against it, and the rebudget removed it from the only armor these classes wear.

## Iteration-03 variants on the candidate

| Variant | Rows | Deaths | Saved | Lost | Mean min-HP change |
|---|---:|---:|---:|---:|---:|
| Desert +6 DR | 144 | 27 → 21 | 6 | 0 | +0.04 |
| Jungle +10 evasion | 144 | 31 → 31 | 0 | 0 | +0.05 |
| Jungle +5 evade mitigation | 144 | 31 → 33 | 0 | 2 | +0.01 |
| Graveyard reactive plating removed | 72 | 0 → 3 | 0 | 3 | −0.03 |

What each result means:

- **Desert +6 DR** helps without losses: T3 Basilisk 8 → 4, T3 Volcano 15 → 13. It does not
  close the Volcano gap.
- **Jungle +10 evasion** raises the HP floor but saves nobody. The T3 ambusher pack kills 12/24
  in every arm and variant; no defense change here moves it.
- **Jungle +5 evade mitigation** is no better than baseline.
- **Removing Graveyard reactive plating** costs three Gravewright survivals. Keep the mechanic.

## Answers to iteration 03's questions

- **Jungle:** neither extra evasion nor stronger evasion changes deaths on identical packs.
  The T3 ambusher deaths are not an evasion-coefficient problem, so do not buff Jungle
  coefficients from this evidence.
- **Desert:** extra sustained DR has a real, loss-free effect. But the Desert failure
  concentrates in cross-biome Volcano, where the missing piece is flat protection against
  many small hits. Flat protection is the better next candidate than a longer opening window.
- **Pipeline (a):** close to neutral on identical threats. This supports landing it
  separately.
