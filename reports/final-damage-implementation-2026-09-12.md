# Final Core/stance damage and inventory comparisons

## Implemented

Broad Core offense uses signed `core.damage-dealt-pct`; Juggernaut's independent
reduction uses `core.damage-taken-pct`. Stance offense uses `damageDealtPct`.
Existing percentages and specialist HP/plating/speed/recovery/on-hit/Focus/technique
identities are retained. Core and stance factors multiply independently.

Final scaling covers direct plus on-hit output, laser/beam ticks, class and weapon
DoTs, proc damage, player AoE, reflected flat Bramble damage and summon-owned
output. Reaper momentum and Powering Up release use the same final layer. Copied
finalized hits are not multiplied a second time. Ongoing effects resolve the
owner's current posture. Player-source resolution without a present owner falls
back to an unmodified factor.

Incoming modifiers cover normal hits before caps/shields, AoE, DoTs and hazards.
Berserker's HP cost and already-mitigated deferred debt are excluded. Summons keep
their own incoming defense profile; outgoing damage inherits the owner's factor.

The detailed character sheet displays authoritative final damage dealt/taken,
including conditional stance windows and Brawler's live crowd reduction. DPS
multiplies every included damage contribution once. Raw Attack and normal DR
remain distinct stats.

Inventory no longer adds rebuilt equipment differences to live combat stats.
Both sides use the same shared rebuild, stance and HP fraction. Relevant rows are
found against the same build with the compared slot empty, preserving meaningful
unchanged comparisons. With no selected item, rows show stats affected by equipped
gear. Mechanic/weapon/relic effects remain in item descriptions. Final damage-taken
improvements are colored correctly (lower is better). Temporary buffs are excluded
from equipment planning; summons are compared at a full formation.

## Verification

- Typechecking passed, including benchmark tooling.
- New runtime/inventory regressions passed: direct/on-hit, proc, AoE, DoT, laser,
  incoming direct/AoE/DoT, networked sheet multipliers, all six root DPS estimates,
  Core comparisons, unrelated-row exclusion, equal swaps, unequip and HP gates.
- Existing Core, stance and prior Core/relic suites passed in focused runs.
- Full run: **179/181 passed initially** (`final-damage-tests-2026-09-12.txt`).
  The two old-semantic assertions (class Attack ordering and a fixed Catalyst
  benchmark winner) were corrected; both suites passed again after the full run.
  The additional new final-damage integration suite also passed separately
  (`final-damage-regression-result.txt`). No remaining test failures.
- Browser verification: the local character sheet rendered the two final
  multipliers. An isolated component preview rendered equipment summary, replace
  and unequip with correct values/directions and no unrelated stats. Temporary
  preview files and browser tabs were removed afterward.
- No balance sweep was performed. Changing the affected damage channels can change
  which Core is best for a build; the benchmark now scores final-damage tradeoffs.
