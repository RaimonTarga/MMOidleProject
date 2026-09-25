# Consolidated defense and core patch notes

**Before:** original comparison baseline ff98ba45. **After:** isolated candidate 7657aee7, including the core follow-up and retained Graveyard iteration. These are proposed, unmerged changes, not a claim about the currently deployed game. Intermediate experimental values are omitted.

The [numerical appendix](BEFORE-AFTER-APPENDIX.md) covers all 30 armors, every changed armor stat and special-effect value at each upgrade level, every core, and every changed class root/frame/range node. Decimal fractions in that appendix are authored percentages; they are not final character-sheet values. Core values do not gain armor upgrades.

## Cores

| Core | Before | After |
|---|---|---|
| Force | +22% damage, −12% HP | +22% damage, no HP penalty |
| Scout | +24% damage, −20% HP; +25% movement and 25% mobility cooldown reduction | +18% damage, no HP penalty; mobility benefits unchanged |
| Sniper | +40% damage, −30% HP, −25% plating | +30% damage, no HP or plating penalty |
| Catalyst | +115% existing on-hit damage, −15% generic damage | Same on-hit amplifier, no generic damage penalty; misleading armor-bypass description corrected |
| Juggernaut | +30% HP, +40% plating, 14% less damage taken | +20% HP, +10% plating, 10% less damage taken; −25% attack speed and −10% movement retained |
| Bruiser / Duelist | Melee offensive packages with health benefits | Unchanged; melee durability compensation preserved |
| Tempered / Survivalist / Arcanist / Controller / Accelerant | Existing packages | Unchanged |

Juggernaut's reduction belongs to the experimental overall defense budget; it is not recommended as an independent live nerf. Warden and Affliction are ideas only and are not implemented.

## Armor identities

All families receive the exact HP, plating, DR and upgrade rebudget in the appendix. These rows describe the accompanying identity changes. Crafting costs, ownership, recipe IDs and evolution routes are unchanged.

| Family | Before | After |
|---|---|---|
| Tutorial Bark Wrap | Existing starter HP/plating | Unchanged |
| Plains | Large ordinary plating budget | Smaller specialist plating budget plus general DR and revised HP |
| Forest | Plating and evade frequency | No plating; small general DR, revised evade frequency and +10 percentage points evade mitigation |
| Jungle | Plating/evasion; evade-strength specialization arrives at T4 | No plating; evade strength starts at T2: +20/+25/+30 percentage points at T2/T3/T4, plus small general DR |
| Cave | Plating plus general DR | No plating; dependable general DR becomes the central defense: base 10/18/26% at T1/T2/T3, gaining 0.8 points per upgrade |
| Mountain | HP/plating, Guard amplification and additional cap/refill defenses | HP, modest plating and general DR, with timed Guard amplification; soft-cap and automatic barrier-refill riders removed |
| Stormwall | Mountain branch with layered protection | Retains Guard/barrier-break identity, gains its own 10%-HP barrier; exact effect changes in appendix |
| Desert | Plating, cheat-death/cleanse/ailment-resistance package | No plating or those emergency riders; six seconds of opening DR, base 30/35/40% at T2/T3/T4, +1 point per upgrade |
| Swamp | Plating and ailment/debt effects | No plating; general DR, DoT resistance, and tier-dependent debt/debuff resistance |
| Tundra | High plating, stationary DR and soft cap | Small plating plus general DR; stationary specialization retained but made conditional, multiplicative and quick to lose; cap removed |
| Volcano | High plating and large hardening ramp | Smaller ordinary plating and hardening budgets, general DR, pressure requirement and shield-independent cracking |
| Lava-Tempered | Hardening plus overheal ward | Smaller hardening; 50% overheal conversion retained, total ward capped at 15% max HP |
| Plaguebound Mantle | Ordinary plating plus up to 5 reactive plating, DoT/debt/debuff resistance | No ordinary armor plating; general DR and revised resistance/debt; direct damaging hits grant 2 plating for 4 seconds, up to 10, refreshing duration |
| Grave Ward | Ordinary plating, debt/DoT resistance and automatic debt forgiveness | No ordinary plating or forgiveness; general DR and stronger debt specialization, distinct from Mantle's reactive plating |
| Trench | Plating, general DR and sustained-fight ramp | No plating; 30% base DR (+0.8 points/upgrade), sustained item-DR ramp capped at 5 additional points over 10 seconds |

Representative **unupgraded** armor stat changes (HP / ordinary plating / general DR):

- Glacial Bulwark T3: **100 / 15 / 0% → 180 / 2 / 14%**.
- Permafrost Sovereign T4: **180 / 28 / 0% → 346 / 3 / 18%**.
- Emberforge Plate T3: **90 / 20 / 0% → 150 / 8 / 14%**.
- Pyroclasm Mantle T4: **165 / 38 / 0% → 288 / 12 / 18%**.
- Plaguebound Mantle T4: **150 / 16 / 0% → 302 / 0 / 18%**; temporary reactive plating is separate.

## Conditional defenses

- **Desert:** emergency effects are replaced by opening protection triggered by the first outgoing or incoming attack. Selecting a target during approach does not spend the window. Target switching does not refresh it. Six seconds without engagement or incoming attacks rearms it.
- **Tundra:** T3/T4 maximum stationary protection remains 15%/20%, but applies to damage remaining after base DR instead of adding directly. Ramp time changes from 6/5 seconds to 3 seconds. Standing outside combat no longer charges it. Movement has a 250 ms grace period, then sheds a full ramp in one second; leaving combat also sheds it. Forced displacement counts; hard control pauses accumulation.
- **Volcano:** T3 hardening changes from 3 plating/sec capped at 24 to 1.33/sec capped at 8. T4 changes from 4/sec capped at 32 to 2/sec capped at 12. Lava-Tempered changes from 3/sec capped at 24 to 1/sec capped at 6. Building requires an attack target and incoming attack pressure within three seconds. Previously a sufficiently large final HP hit reset hardening; now a gross direct hit worth at least 25% max HP halves earned hardening even through shields. The current hit uses pre-crack plating. The T4 maximum-hardening DR rider is removed.
- **Damage soft cap:** removed from the redesigned granting armor/class packages, replaced by explicit defense budgets. Compatibility implementation remains; this is not deletion of every cap-related function.

## Classes and stances

| Package | Before | After |
|---|---|---|
| Squire root | +30% plating, 4% DR, +30% HP | +10% plating, 28% DR, same HP and Recovery |
| Striker root | +15% plating, 2% DR, +18% HP, excess-hit soft cap | +5% plating, 18% DR, +25% HP, no soft cap; Recovery pulse retained |
| Apprentice root | +8% plating, 10% direct-damage debt conversion | No root plating bonus; 8% DR, 15% debt conversion; 12% HP and 18% DoT resistance retained |
| Slinger root | +20 points evade mitigation | +10 points; innate evade frequency, HP and kill Recovery retained |
| Spirit / Conduit roots | Existing root defensive mechanics | Unchanged numerically; Conduit damage-redirection order changes below |
| Squire/Striker close-range nodes | Range package including plating | Plating removed, +4 points class DR; health advantages retained |
| Frames and other range nodes | Broad plating multipliers | Plating reduced across frames and removed from range nodes; exact per-node changes in appendix |
| Defensive Stance | +20% plating, 10% less damage, −15% damage dealt | Plating bonus removed; other values unchanged |
| Tanking Stance | +40% plating, 25% less damage, −40% damage dealt, −20% attack speed | Plating bonus removed; other values unchanged |

## Damage processing and presentation

- **Charged/empowered hits:** before, subtracting plating before attack amplification also amplified plating's effective benefit. After, complete the gross attack first and subtract plating once. This can increase large-hit damage relative to the old formula and must remain in survival testing.
- **Class/item DR:** previously additive; now separate multiplicative groups: remaining damage is `(1 − class DR) × (1 − item DR)`. Temporary armor ramps respect the revised grouping.
- **Guard:** moved earlier so it protects wards/barriers and damage subsequently deferred into debt; Guard does not reduce DoT ticks.
- **Conduit:** redirection moves from after the defensive pipeline to after shields but before the owner's debt/recuperation calculations.
- **Recuperation:** credits damage remaining after those layers, capped by current HP, rather than claiming overkill or damage redirected away.
- **Monster DoTs:** general DR applies at full rather than half effectiveness.
- **Secondary splash:** enters attack/damage-taken defense handling, allowing evasion and absorb/debt layers to participate. It does not create an extra on-hit proc.
- **Environmental damage:** respects wards/barriers after DR and delays recharge when pressure lands.
- **Damage debt:** replaces the gradually draining pool and tiny-debt forgiveness with four upcoming one-second installments. Fractions are preserved; resistance is fixed when debt is queued, and repayments do not apply it twice. New hits join the existing payment clock.
- **UI/help:** opening-protection status/icon support and descriptions updated for changed defenses, class nodes, stances and Catalyst semantics.

## Imported Volcano changes — other agent

Both latest armor-test arms include these changes: Heat incoming amplification per effective stack **4.5% → 3.5%**; T3 Ash Salamander attack **84 → 70**; T4 Ember Skink attack **75 → 60**, Burn **13 → 8**; T4 Ashspitter Salamander attack **110 → 95**, Burn **16 → 12**. Heat outgoing scaling and Final Eruption are unchanged. The latest farming results do not qualify the boss or isolate the effect of the Volcano nerf.

## Held experiments and confidence

Desert's proposed 10-second window was reverted to six. Jungle T3/T4 extra five-point evade mitigation was reverted. Controller's extra potency and Juggernaut's experimental extra HP were reverted. No new cores were added.

Confidence: high in the diagnosis that generic plating crowded out alternatives; moderate in the bounded Graveyard improvement; low that the entire system is solved or release-ready. These are qualitative judgments, not statistical confidence estimates. The old broad comparison was 81 versus 97 deaths in 218 cases; subsequent local improvements have not been requalified in one fresh complete comparison against the original defenses using the same updated monsters.

Next: add damage-layer accounting and matched fixed-threat survival tests; isolate Desert sustained protection from its opening burst, and Jungle frequency from mitigation strength; recheck Tundra/Mountain/Juggernaut stacking and Graveyard against burst threats; then run a fresh full matrix with the same updated Volcano in both arms, fresh seeds, all six classes, armor tiers/upgrades and bosses. Follow with player-like progression/loadouts and human playtesting. A successful redesign must show differentiated armor choices without returning ranged HP penalties or erasing melee durability compensation.
