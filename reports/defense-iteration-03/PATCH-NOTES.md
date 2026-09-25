# Iteration 03 — before / after

## Retained

- **Defense diagnostics:** outcome/last-hit summaries → opt-in damage-layer attribution, exact HP gain/loss accounting, damage-channel totals where captured, and optional position/target/full-hit traces. Primary charged hits now expose gross damage, plating, DR and rounding separately to the diagnostic observer. Gameplay arithmetic is unchanged.
- **Test coverage:** roaming farming comparisons → farming plus equal-DPS fixed-hit streams, heavy melee stacking checks and reproducible encounter-divergence traces.
- **Gameplay values:** unchanged from iteration 02. Plaguebound Mantle retains 2 temporary plating per direct damaging hit, capped at 10 for four seconds. Cores, classes, Forest/T2 armor, Tundra and Volcano values are unchanged.

## Tested but not retained

| Stat | Retained value before/after this pass | Experimental value only |
|---|---|---|
| Desert T3 base DR | 14% | 20% |
| Desert T4 base DR | 18% | 24% |
| Jungle T3 raw evasion, unupgraded | 32% | 42% |
| Jungle T4 raw evasion, unupgraded | 36% | 46% |
| Jungle T3 bonus evade mitigation | +25 percentage points | +30 points |
| Jungle T4 bonus evade mitigation | +30 percentage points | +35 points |

Jungle frequency and strength were separate candidates, never combined. Existing upgrades and other gear were held fixed. Desert's opening protection remains six seconds. Experimental values live only in explicit benchmark overrides; they were never written into gameplay recipes.

The full defense redesign remains experimental and unmerged. The next useful test is matched finite-pack combat with native Rune behavior, rather than another roaming coefficient sweep.
