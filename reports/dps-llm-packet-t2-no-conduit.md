# MMO Idle LLM Balance Packet - T2 (No Conduit)

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

- Report tier T2; class unlock tier 1; weapons are tier 2.
- DPS conclusions use +3 weapons only. Weapon input context includes +0 and +3.
- Target mobs come from biome spawn pools one tier below report tier; tutorial/test/interact/boss monsters are excluded.
- When the shifted target tier contains only tutorial/test content, the packet falls back to the first real non-tutorial biome tier.
- Single-target theoretical steady-state only: no movement, enemy attacks, deaths, sustain, AoE value, pathing, aggro, party effects, or eHP.
- Outliers/top/bottom use each class combination's optimal +3 weapon. Class/weapon averages use all +3 weapon samples.

## 2. Target Monster Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 1 |
| Mob count | 10 |
| Average mob HP | 143 |
| Average plating | 0.80 |
| Average DR | 1.50% |
| Reference optimal-build average DPS | 140 |
| Target TTK at reference DPS | 1.02s |
| Expected DPS band | 93.9 - 210 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Savanna Hawk | 90.0 | 0.00 | 0.00% | HP 90.0, plating 0.00, DR 0.00% |
| Mid profile | Jungle Snake | 150 | 0.00 | 0.00% | HP 150, plating 0.00, DR 0.00% |
| Low plating/DR | Ancient Wolf | 165 | 0.00 | 0.00% | HP 165, plating 0.00, DR 0.00% |
| High DR/special | Mire Stalker | 280 | 0.00 | 12.0% | HP 280, plating 0.00, DR 12.0%, evasion 20.0% |
| High plating | Cave Troll | 640 | 4.00 | 15.0% | HP 640, plating 4.00, DR 15.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage | Quake Hammer +3 | 162 | 0.00 | 0.55 | 1818 | 72.0 | 151 | 6.00 | 4.00% | dot.conversion-pct=0.50, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound | Quake Hammer +3 | 163 | 0.00 | 0.44 | 2273 | 72.0 | 167 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Venom vessel | Quake Hammer +3 | 161 | 0.00 | 0.66 | 1515 | 72.0 | 141 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.max-stacks=8.00 | DoT cap 8 stacks, tick 1000ms | dot steady-state hit estimate |
| Slinger / Artillerist | Stinger Rapier +3 | 48.0 | 17.0 | 2.32 | 281 | 132 | 144 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 2.32 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman | Stinger Rapier +3 | 47.0 | 17.0 | 2.13 | 269 | 132 | 138 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 2.13 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout | Sunsteel Cross +3 | 65.0 | 0.00 | 1.44 | 453 | 132 | 128 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 1.44 effective shots/s | first strike amortized over tier dummy HP |
| Spirit / Phantasm | Ruinous Axe +3 | 112 | 0.00 | 1.08 | 926 | 142 | 128 | 4.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.10/s) | dead swing every 4 hits |
| Spirit / Spark | Stinger Rapier +3 | 54.0 | 17.0 | 2.09 | 478 | 142 | 116 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.35/s) | energy steady-state hit estimate |
| Spirit / Wraith | Stinger Rapier +3 | 54.0 | 17.0 | 1.94 | 516 | 142 | 115 | 3.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.22/s) | energy steady-state hit estimate |
| Squire / Bulwark | Frostbrand +3 | 107 | 0.00 | 0.56 | 1777 | 12.0 | 182 | 10.0 | 11.0% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50 | empowered every 8.00s (0.13/s) | swamp-frostbrand-burn reservoir DoT from weapon profile |
| Squire / Knight | Sunsteel Cross +3 | 90.0 | 0.00 | 0.80 | 1250 | 12.0 | 170 | 8.00 | 11.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | first strike amortized over tier dummy HP |
| Squire / Warrior | Stinger Rapier +3 | 61.0 | 17.0 | 1.89 | 529 | 12.0 | 156 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Striker / Breaker | Ruinous Axe +3 | 117 | 0.00 | 0.90 | 1111 | 12.0 | 154 | 8.00 | 6.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.15/s) | dead swing every 4 hits |
| Striker / Flurry | Stinger Rapier +3 | 57.0 | 17.0 | 1.95 | 512 | 12.0 | 132 | 4.00 | 4.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.49/s) | cadence steady-state hit estimate |
| Striker / Skirmisher | Ruinous Axe +3 | 118 | 0.00 | 1.20 | 833 | 12.0 | 146 | 5.00 | 4.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.24/s) | dead swing every 4 hits |


## 4. Weapon Input Table (+0 and +3)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Frostbrand | +0 | attack=32.0 | weapon.dot-conversion-pct=0.70, weapon.dot-stacks=3.00 | 0.75 APS base; swamp-frostbrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 0/3 |
| Frostbrand | +3 | attack=62.0 | weapon.dot-conversion-pct=0.70, weapon.dot-stacks=3.00 | 0.75 APS base; swamp-frostbrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 3/3 |
| Gale Needle | +0 | attack=16.0 | - | 1.60 APS base | explicit steps 0/3 |
| Gale Needle | +3 | attack=34.0 | - | 1.60 APS base | explicit steps 3/3 |
| Knight's Steelsword | +0 | attack=25.0 | - | 1.00 APS base | explicit steps 0/3 |
| Knight's Steelsword | +3 | attack=55.0 | - | 1.00 APS base | explicit steps 3/3 |
| Mirebrand | +0 | attack=24.0 | weapon.dot-conversion-pct=0.50, weapon.dot-stacks=5.00 | 1.00 APS base; swamp-mirebrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/3 |
| Mirebrand | +3 | attack=48.0 | weapon.dot-conversion-pct=0.50, weapon.dot-stacks=5.00 | 1.00 APS base; swamp-mirebrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 3/3 |
| Quake Hammer | +0 | attack=54.0 | - | 0.55 APS base | explicit steps 0/3 |
| Quake Hammer | +3 | attack=126 | - | 0.55 APS base | explicit steps 3/3 |
| Ruinous Axe | +0 | attack=40.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 0/3 |
| Ruinous Axe | +3 | attack=82.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 3/3 |
| Stinger Rapier | +0 | attack=10.0, onHitDamage=8.00 | - | 1.55 APS base | explicit steps 0/3 |
| Stinger Rapier | +3 | attack=22.0, onHitDamage=17.0 | - | 1.55 APS base | explicit steps 3/3 |
| Sunsteel Cross | +0 | attack=24.0 | weapon.first-strike-mult=2.00 | 0.80 APS base | explicit steps 0/3 |
| Sunsteel Cross | +3 | attack=51.0 | weapon.first-strike-mult=2.00 | 0.80 APS base | explicit steps 3/3 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Striker / Flurry | Stinger Rapier +3 | 154 | 141 | 13.7 | 0.00 | 0.00 | - |
| Spirit / Spark | Stinger Rapier +3 | 154 | 144 | 9.41 | 0.00 | 0.00 | - |
| Apprentice / Rime-Bound | Quake Hammer +3 | 152 | 21.1 | 0.00 | 131 | 0.00 | - |
| Squire / Warrior | Stinger Rapier +3 | 150 | 144 | 6.00 | 0.00 | 0.00 | - |
| Slinger / Artillerist | Stinger Rapier +3 | 148 | 148 | 0.00 | 0.00 | 0.00 | - |
| Spirit / Wraith | Stinger Rapier +3 | 145 | 134 | 11.6 | 0.00 | 0.00 | - |
| Spirit / Phantasm | Ruinous Axe +3 | 143 | 89.1 | 54.1 | 0.00 | 0.00 | - |
| Apprentice / Ember mage | Quake Hammer +3 | 140 | 44.0 | 0.00 | 96.0 | 0.00 | - |
| Apprentice / Venom vessel | Quake Hammer +3 | 137 | 73.3 | 0.00 | 64.0 | 0.00 | - |
| Slinger / Marksman | Stinger Rapier +3 | 134 | 134 | 0.00 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark | Frostbrand +3 | 124 | 17.7 | 9.86 | 0.00 | 96.6 | - |
| Squire / Knight | Sunsteel Cross +3 | 127 | 70.4 | 12.7 | 0.00 | 43.5 | - |
| Striker / Breaker | Ruinous Axe +3 | 129 | 77.0 | 51.9 | 0.00 | 0.00 | - |
| Striker / Skirmisher | Ruinous Axe +3 | 132 | 104 | 28.1 | 0.00 | 0.00 | - |
| Slinger / Scout | Sunsteel Cross +3 | 134 | 92.4 | 0.00 | 0.00 | 41.5 | - |
| Slinger / Marksman | Stinger Rapier +3 | 134 | 134 | 0.00 | 0.00 | 0.00 | - |
| Apprentice / Venom vessel | Quake Hammer +3 | 137 | 73.3 | 0.00 | 64.0 | 0.00 | - |
| Apprentice / Ember mage | Quake Hammer +3 | 140 | 44.0 | 0.00 | 96.0 | 0.00 | - |
| Spirit / Phantasm | Ruinous Axe +3 | 143 | 89.1 | 54.1 | 0.00 | 0.00 | - |
| Spirit / Wraith | Stinger Rapier +3 | 145 | 134 | 11.6 | 0.00 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 132 | 24 |
| Slinger | 126 | 24 |
| Squire | 126 | 24 |
| Striker | 125 | 24 |
| Apprentice | 110 | 24 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Ruinous Axe | 131 | 15 |
| Stinger Rapier | 128 | 15 |
| Mirebrand | 125 | 15 |
| Gale Needle | 125 | 15 |
| Sunsteel Cross | 125 | 15 |
| Frostbrand | 124 | 15 |
| Quake Hammer | 122 | 15 |
| Knight's Steelsword | 110 | 15 |


Weapon DPS against target shapes:

| Weapon | neutral T2 dummy | high-plating T2 dummy | high-HP elite T2 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Frostbrand +3 | 124 | 106 | 106 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Gale Needle +3 | 125 | 105 | 105 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Knight's Steelsword +3 | 110 | 93.9 | 93.9 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Mirebrand +3 | 125 | 106 | 106 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Quake Hammer +3 | 122 | 106 | 106 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Ruinous Axe +3 | 131 | 113 | 113 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Stinger Rapier +3 | 128 | 112 | 112 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Sunsteel Cross +3 | 125 | 81.0 | 81.0 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Ruinous Axe | 137 | 3 |
| Squire | Sunsteel Cross | 132 | 3 |
| Apprentice | Quake Hammer | 143 | 3 |
| Spirit | Ruinous Axe | 146 | 3 |
| Slinger | Stinger Rapier | 138 | 3 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Quake Hammer | 109 | 3 |
| Squire | Knight's Steelsword | 110 | 3 |
| Apprentice | Stinger Rapier | 95.2 | 3 |
| Spirit | Knight's Steelsword | 117 | 3 |
| Slinger | Knight's Steelsword | 112 | 3 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `dead swing every 4 hits`, `first strike amortized over tier dummy HP`, `swamp-frostbrand-burn reservoir DoT from weapon profile`, `swamp-mirebrand-burn reservoir DoT from weapon profile`.
