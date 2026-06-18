# MMO Idle LLM Balance Packet - T2

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
| Reference optimal-build average DPS | 169 |
| Target TTK at reference DPS | 0.84s |
| Expected DPS band | 113 - 253 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Plains Slime | 50.0 | 0.00 | 0.00% | HP 50.0, plating 0.00, DR 0.00% |
| Mid profile | Wolf | 60.0 | 0.00 | 0.00% | HP 60.0, plating 0.00, DR 0.00% |
| Low plating/DR | Boar | 80.0 | 0.00 | 0.00% | HP 80.0, plating 0.00, DR 0.00% |
| High plating | Cave Lurker | 200 | 4.00 | 5.00% | HP 200, plating 4.00, DR 5.00% |
| High DR/special | Cave Brute | 350 | 2.00 | 10.0% | HP 350, plating 2.00, DR 10.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage | Ruinous Axe +3 | 124 | 0.00 | 1.20 | 833 | 72.0 | 151 | 6.00 | 4.00% | dot.conversion-pct=0.50, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | dead swing every 4 hits |
| Apprentice / Rime-Bound | Ruinous Axe +3 | 125 | 0.00 | 0.96 | 1041 | 72.0 | 167 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00 | DoT cap 3 stacks, tick 2000ms | dead swing every 4 hits |
| Apprentice / Venom vessel | Ruinous Axe +3 | 121 | 0.00 | 1.44 | 694 | 72.0 | 141 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.max-stacks=8.00 | DoT cap 8 stacks, tick 1000ms | dead swing every 4 hits |
| Conduit / Heavy Frame | Ruinous Axe +3 | 113 | 0.00 | 1.20 | 833 | 162 | 145 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-mult=1.50, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000, summoner.minion-size-mult=2.00, +1 more | 1 minions at 1.00 APS each | 1 minions at 1.00 APS each; dead swing every 4 hits |
| Conduit / Light Frame | Ruinous Axe +3 | 113 | 0.00 | 1.20 | 833 | 162 | 120 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=2.00, summoner.minion-damage-mult=0.50, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000, summoner.minion-size-mult=0.50 | 6 minions at 1.00 APS each | 6 minions at 1.00 APS each; dead swing every 4 hits |
| Conduit / Medium Frame | Ruinous Axe +3 | 113 | 0.00 | 1.20 | 833 | 162 | 132 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000 | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each; dead swing every 4 hits |
| Slinger / Artillerist | Stinger Rapier +3 | 43.0 | 17.0 | 2.32 | 281 | 132 | 144 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 2.32 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman | Stinger Rapier +3 | 41.0 | 17.0 | 2.13 | 269 | 132 | 138 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 2.13 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout | Stinger Rapier +3 | 39.0 | 17.0 | 2.11 | 234 | 132 | 128 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 2.11 effective shots/s | reload steady-state hit estimate |
| Spirit / Phantasm | Ruinous Axe +3 | 118 | 0.00 | 1.20 | 833 | 142 | 128 | 4.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.11/s) | dead swing every 4 hits |
| Spirit / Spark | Stinger Rapier +3 | 59.0 | 17.0 | 2.25 | 445 | 142 | 116 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.37/s) | energy steady-state hit estimate |
| Spirit / Wraith | Stinger Rapier +3 | 59.0 | 17.0 | 2.09 | 478 | 142 | 115 | 3.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.23/s) | energy steady-state hit estimate |
| Squire / Bulwark | Ruinous Axe +3 | 132 | 0.00 | 0.90 | 1111 | 12.0 | 182 | 10.0 | 11.0% | cooldown.empowered-cd-ms=9000, cooldown.empowered-mult=3.00 | empowered every 9.00s (0.11/s) | dead swing every 4 hits |
| Squire / Knight | Stinger Rapier +3 | 66.0 | 17.0 | 1.55 | 645 | 12.0 | 170 | 8.00 | 11.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Warrior | Stinger Rapier +3 | 68.0 | 17.0 | 1.94 | 516 | 12.0 | 156 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Striker / Breaker | Ruinous Axe +3 | 123 | 0.00 | 0.90 | 1111 | 12.0 | 154 | 8.00 | 6.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.15/s) | dead swing every 4 hits |
| Striker / Flurry | Stinger Rapier +3 | 62.0 | 17.0 | 1.98 | 504 | 12.0 | 132 | 4.00 | 4.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.50/s) | cadence steady-state hit estimate |
| Striker / Skirmisher | Stinger Rapier +3 | 63.0 | 17.0 | 1.55 | 645 | 12.0 | 146 | 5.00 | 4.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.31/s) | cadence steady-state hit estimate |


## 4. Weapon Input Table (+0 and +3)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Frostbrand | +0 | attack=24.0 | weapon.dot-conversion-pct=0.45, weapon.dot-stacks=3.00 | 0.55 APS base; swamp-frostbrand-burn DoT reservoir 45.0% conversion x1.15 | explicit steps 0/3 |
| Frostbrand | +3 | attack=45.0 | weapon.dot-conversion-pct=0.45, weapon.dot-stacks=3.00 | 0.55 APS base; swamp-frostbrand-burn DoT reservoir 45.0% conversion x1.15 | explicit steps 3/3 |
| Gale Needle | +0 | attack=16.0 | - | 1.60 APS base | explicit steps 0/3 |
| Gale Needle | +3 | attack=34.0 | - | 1.60 APS base | explicit steps 3/3 |
| Knight's Steelsword | +0 | attack=20.0 | - | 0.80 APS base | explicit steps 0/3 |
| Knight's Steelsword | +3 | attack=44.0 | - | 0.80 APS base | explicit steps 3/3 |
| Mirebrand | +0 | attack=17.0 | weapon.dot-conversion-pct=0.30, weapon.dot-stacks=5.00 | 0.78 APS base; swamp-mirebrand-burn DoT reservoir 30.0% conversion x1.15 | explicit steps 0/3 |
| Mirebrand | +3 | attack=32.0 | weapon.dot-conversion-pct=0.30, weapon.dot-stacks=5.00 | 0.78 APS base; swamp-mirebrand-burn DoT reservoir 30.0% conversion x1.15 | explicit steps 3/3 |
| Quake Hammer | +0 | attack=32.0 | - | 0.40 APS base | explicit steps 0/3 |
| Quake Hammer | +3 | attack=71.0 | - | 0.40 APS base | explicit steps 3/3 |
| Ruinous Axe | +0 | attack=40.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 0/3 |
| Ruinous Axe | +3 | attack=88.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 3/3 |
| Stinger Rapier | +0 | attack=12.0, onHitDamage=8.00 | - | 1.55 APS base | explicit steps 0/3 |
| Stinger Rapier | +3 | attack=27.0, onHitDamage=17.0 | - | 1.55 APS base | explicit steps 3/3 |
| Sunsteel Cross | +0 | attack=14.0 | weapon.first-strike-mult=2.00 | 0.70 APS base | explicit steps 0/3 |
| Sunsteel Cross | +3 | attack=32.0 | weapon.first-strike-mult=2.00 | 0.70 APS base | explicit steps 3/3 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Medium Frame | Ruinous Axe +3 | 333 | 0.00 | 333 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame | Ruinous Axe +3 | 330 | 0.00 | 330 | 0.00 | 0.00 | HIGH |
| Conduit / Heavy Frame | Ruinous Axe +3 | 222 | 0.00 | 222 | 0.00 | 0.00 | - |
| Spirit / Spark | Stinger Rapier +3 | 177 | 166 | 10.9 | 0.00 | 0.00 | - |
| Spirit / Wraith | Stinger Rapier +3 | 168 | 155 | 13.5 | 0.00 | 0.00 | - |
| Striker / Flurry | Stinger Rapier +3 | 168 | 153 | 15.4 | 0.00 | 0.00 | - |
| Squire / Warrior | Stinger Rapier +3 | 168 | 161 | 6.80 | 0.00 | 0.00 | - |
| Spirit / Phantasm | Ruinous Axe +3 | 167 | 104 | 63.5 | 0.00 | 0.00 | - |
| Apprentice / Rime-Bound | Ruinous Axe +3 | 141 | 26.7 | 0.00 | 114 | 0.00 | - |
| Striker / Skirmisher | Stinger Rapier +3 | 140 | 121 | 19.2 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire / Bulwark | Ruinous Axe +3 | 116 | 87.1 | 28.9 | 0.00 | 0.00 | - |
| Slinger / Scout | Stinger Rapier +3 | 116 | 116 | 0.00 | 0.00 | 0.00 | - |
| Slinger / Marksman | Stinger Rapier +3 | 122 | 122 | 0.00 | 0.00 | 0.00 | - |
| Apprentice / Venom vessel | Ruinous Axe +3 | 130 | 89.7 | 0.00 | 40.0 | 0.00 | - |
| Apprentice / Ember mage | Ruinous Axe +3 | 131 | 54.9 | 0.00 | 76.0 | 0.00 | - |
| Squire / Knight | Stinger Rapier +3 | 135 | 126 | 9.29 | 0.00 | 0.00 | - |
| Striker / Breaker | Ruinous Axe +3 | 136 | 81.0 | 54.6 | 0.00 | 0.00 | - |
| Slinger / Artillerist | Stinger Rapier +3 | 137 | 137 | 0.00 | 0.00 | 0.00 | - |
| Striker / Skirmisher | Stinger Rapier +3 | 140 | 121 | 19.2 | 0.00 | 0.00 | - |
| Apprentice / Rime-Bound | Ruinous Axe +3 | 141 | 26.7 | 0.00 | 114 | 0.00 | - |


All optimal-weapon outliers:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Medium Frame | Ruinous Axe +3 | 333 | 0.00 | 333 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame | Ruinous Axe +3 | 330 | 0.00 | 330 | 0.00 | 0.00 | HIGH |


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Conduit | 188 | 24 |
| Spirit | 108 | 24 |
| Squire | 95.1 | 24 |
| Striker | 94.9 | 24 |
| Apprentice | 90.7 | 24 |
| Slinger | 80.3 | 24 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Ruinous Axe | 163 | 18 |
| Stinger Rapier | 135 | 18 |
| Gale Needle | 128 | 18 |
| Knight's Steelsword | 96.0 | 18 |
| Quake Hammer | 94.4 | 18 |
| Sunsteel Cross | 90.5 | 18 |
| Frostbrand | 85.8 | 18 |
| Mirebrand | 82.9 | 18 |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Ruinous Axe | 145 | 3 |
| Squire | Stinger Rapier | 139 | 3 |
| Apprentice | Ruinous Axe | 134 | 3 |
| Spirit | Ruinous Axe | 167 | 3 |
| Slinger | Stinger Rapier | 125 | 3 |
| Conduit | Ruinous Axe | 295 | 3 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Quake Hammer | 52.4 | 3 |
| Squire | Quake Hammer | 61.2 | 3 |
| Apprentice | Mirebrand | 70.0 | 3 |
| Spirit | Quake Hammer | 60.6 | 3 |
| Slinger | Quake Hammer | 53.8 | 3 |
| Conduit | Stinger Rapier | 134 | 3 |


## 10. Outlier Detail

| Flag | Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Suspected source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HIGH | Conduit / Medium Frame | Ruinous Axe +3 | 333 | 0.00 | 333 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each; dead swing every 4 hits |
| HIGH | Conduit / Light Frame | Ruinous Axe +3 | 330 | 0.00 | 330 | 0.00 | 0.00 | class mechanic share; 6 minions at 1.00 APS each; dead swing every 4 hits |


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `1 minions at 1.00 APS each`, `3 minions at 1.00 APS each`, `6 minions at 1.00 APS each`, `dead swing every 4 hits`, `first strike amortized over tier dummy HP`, `swamp-frostbrand-burn reservoir DoT from weapon profile`, `swamp-mirebrand-burn reservoir DoT from weapon profile`.
