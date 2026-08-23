# MMO Idle LLM Balance Packet - T2

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.
- Report tier T2; class unlock tier 1; weapons are tier 2.
- DPS conclusions use +5 weapons only. Weapon input context includes +0 and +5.
- Target mobs come from biome spawn pools one tier below report tier; tutorial/test/interact/boss monsters are excluded.
- When the shifted target tier contains only tutorial/test content, the packet falls back to the first real non-tutorial biome tier.
- Single-target theoretical steady-state only: no movement, enemy attacks, deaths, sustain, AoE value, pathing, aggro, party effects, or eHP.
- Outliers/top/bottom use each class combination's optimal +5 weapon. Class/weapon averages use all +5 weapon samples.

## 2. Target Monster Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 1 |
| Mob count | 10 |
| Average mob HP | 161 |
| Average plating | 0.40 |
| Average DR | 1.50% |
| Reference optimal-build average DPS | 134 |
| Target TTK at reference DPS | 1.20s |
| Expected DPS band | 89.8 - 201 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Bog Witch | 170 | 0.00 | 0.00% | HP 170, plating 0.00, DR 0.00% |
| High plating | Moss-Shell Snapper | 150 | 6.00 | 0.00% | HP 150, plating 6.00, DR 0.00% |
| High DR/special | Mire Stalker | 210 | 0.00 | 0.00% | HP 210, plating 0.00, DR 0.00%, evasion 20.0% |
| Low plating/DR | Dire Wolf | 270 | 0.00 | 0.00% | HP 270, plating 0.00, DR 0.00% |
| Heaviest | Stone Basilisk | 660 | 0.00 | 15.0% | HP 660, plating 0.00, DR 15.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage | Sunsteel Falchion +5 | 98.0 | 0.00 | 0.84 | 1190 | 72.0 | 122 | 2.00 | 0.00% | dot.conversion-pct=0.50, dot.duration-ms=5500, dot.max-stacks=6.00, dot.mechanic-mult=1.20, dot.tick-interval-ms=1500 | DoT cap 6 stacks, tick 1500ms | first strike amortized over tier dummy HP |
| Apprentice / Rime-Bound | Sunsteel Falchion +5 | 99.0 | 0.00 | 0.74 | 1359 | 72.0 | 130 | 3.00 | 3.00% | dot.conversion-pct=0.70, dot.duration-ms=6500, dot.max-stacks=3.00, dot.mechanic-mult=1.15, dot.tick-interval-ms=2000 | DoT cap 3 stacks, tick 2000ms | first strike amortized over tier dummy HP |
| Apprentice / Venom vessel | Sunsteel Falchion +5 | 97.0 | 0.00 | 0.90 | 1116 | 72.0 | 116 | 2.00 | 0.00% | dot.conversion-pct=0.30, dot.duration-ms=5000, dot.max-stacks=8.00, dot.mechanic-mult=1.25, dot.tick-interval-ms=1000 | DoT cap 8 stacks, tick 1000ms | first strike amortized over tier dummy HP |
| Conduit / Consort | Stinger Rapier +5 | 49.0 | 23.0 | 1.61 | 620 | 162 | 116 | 2.00 | 0.00% | - | 5 balanced/mid summons at 1.61 APS each; one formation budget | 5 balanced mid summons at 1.61 APS; formation budget normalized |
| Conduit / Effigy | Stinger Rapier +5 | 49.0 | 23.0 | 1.52 | 658 | 162 | 124 | 2.00 | 1.00% | - | 2 heavy/mid summons at 1.52 APS each; one formation budget | 2 heavy mid summons at 1.52 APS; formation budget normalized |
| Conduit / Splinter | Stinger Rapier +5 | 49.0 | 23.0 | 1.71 | 586 | 162 | 112 | 2.00 | 0.00% | - | 6 light/mid summons at 1.71 APS each; one formation budget | 6 light mid summons at 1.71 APS; formation budget normalized |
| Slinger / Artillerist | Stinger Rapier +5 | 35.0 | 23.0 | 2.20 | 304 | 132 | 121 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 2.20 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman | Sunsteel Falchion +5 | 64.0 | 0.00 | 1.34 | 548 | 132 | 115 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 1.34 effective shots/s | first strike amortized over tier dummy HP |
| Slinger / Scout | Sunsteel Falchion +5 | 64.0 | 0.00 | 1.31 | 521 | 132 | 111 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 1.31 effective shots/s | first strike amortized over tier dummy HP |
| Spirit / Phantasm | Sunsteel Falchion +5 | 105 | 0.00 | 0.82 | 1225 | 142 | 117 | 2.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.07/s) | first strike amortized over tier dummy HP |
| Spirit / Spark | Sunsteel Falchion +5 | 102 | 0.00 | 0.99 | 1008 | 142 | 106 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.17/s) | first strike amortized over tier dummy HP |
| Spirit / Wraith | Sunsteel Falchion +5 | 103 | 0.00 | 0.94 | 1059 | 142 | 110 | 2.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.10/s) | first strike amortized over tier dummy HP |
| Squire / Bulwark | Sunsteel Falchion +5 | 108 | 0.00 | 0.58 | 1712 | 12.0 | 152 | 3.00 | 7.00% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50 | empowered every 8.00s (0.13/s) | first strike amortized over tier dummy HP |
| Squire / Knight | Sunsteel Falchion +5 | 106 | 0.00 | 0.70 | 1420 | 12.0 | 142 | 3.00 | 6.00% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | first strike amortized over tier dummy HP |
| Squire / Warrior | Sunsteel Falchion +5 | 105 | 0.00 | 0.78 | 1289 | 12.0 | 135 | 3.00 | 4.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | first strike amortized over tier dummy HP |
| Striker / Breaker | Sunsteel Falchion +5 | 95.0 | 0.00 | 0.77 | 1302 | 12.0 | 136 | 3.00 | 4.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.13/s) | first strike amortized over tier dummy HP |
| Striker / Flurry | Sunsteel Falchion +5 | 96.0 | 0.00 | 0.94 | 1059 | 12.0 | 122 | 2.00 | 2.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.24/s) | first strike amortized over tier dummy HP |
| Striker / Skirmisher | Sunsteel Falchion +5 | 97.0 | 0.00 | 0.88 | 1136 | 12.0 | 128 | 3.00 | 2.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.18/s) | first strike amortized over tier dummy HP |


## 4. Weapon Input Table (+0 and +5)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Gale Needle | +0 | attack=9.00 | - | 1.60 APS base | explicit steps 0/5 |
| Gale Needle | +5 | attack=14.0 | - | 1.60 APS base | explicit steps 5/5 |
| Knight's Steelsword | +0 | attack=18.0 | technique.cooldown-reduction-pct=0.12 | 1.00 APS base | explicit steps 0/5 |
| Knight's Steelsword | +5 | attack=27.0 | technique.cooldown-reduction-pct=0.17 | 1.00 APS base | explicit steps 5/5 |
| Quake Hammer | +0 | attack=47.0 | technique.cast-speed-pct=0.15, weapon.empowered-mult-bonus=0.26 | 0.55 APS base | explicit steps 0/5 |
| Quake Hammer | +5 | attack=70.0 | technique.cast-speed-pct=0.15, weapon.empowered-mult-bonus=0.33 | 0.55 APS base | explicit steps 5/5 |
| Ruinous Axe | +0 | attack=43.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 0/5 |
| Ruinous Axe | +5 | attack=65.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 5/5 |
| Stinger Rapier | +0 | attack=10.0, onHitDamage=8.00 | - | 1.55 APS base | explicit steps 0/5 |
| Stinger Rapier | +5 | attack=30.0, onHitDamage=23.0 | - | 1.55 APS base | explicit steps 5/5 |
| Sunsteel Falchion | +0 | attack=24.0 | technique.power-pct=0.20, weapon.first-strike-mult=2.00 | 0.80 APS base | explicit steps 0/5 |
| Sunsteel Falchion | +5 | attack=69.0 | technique.power-pct=0.20, weapon.first-strike-mult=2.00 | 0.80 APS base | explicit steps 5/5 |
| Thorn Needle | +0 | attack=5.00, onHitDamage=4.00 | - | 1.50 APS base | explicit steps 0/5 |
| Thorn Needle | +5 | attack=8.00, onHitDamage=7.00 | - | 1.50 APS base | explicit steps 5/5 |
| Venom Knife | +0 | attack=18.0 | - | 1.00 APS base; swamp-mirebrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/5 |
| Venom Knife | +5 | attack=27.0 | - | 1.00 APS base; swamp-mirebrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 5/5 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit / Phantasm | Sunsteel Falchion +5 | 176 | 84.1 | 38.4 | 0.00 | 54.0 | - |
| Spirit / Spark | Sunsteel Falchion +5 | 169 | 99.2 | 8.27 | 0.00 | 61.8 | - |
| Spirit / Wraith | Sunsteel Falchion +5 | 166 | 95.4 | 10.7 | 0.00 | 60.0 | - |
| Striker / Flurry | Sunsteel Falchion +5 | 152 | 88.8 | 11.1 | 0.00 | 52.0 | - |
| Striker / Skirmisher | Sunsteel Falchion +5 | 150 | 83.6 | 16.9 | 0.00 | 49.5 | - |
| Striker / Breaker | Sunsteel Falchion +5 | 149 | 71.4 | 36.0 | 0.00 | 41.4 | - |
| Squire / Warrior | Sunsteel Falchion +5 | 142 | 79.9 | 10.4 | 0.00 | 51.3 | - |
| Squire / Bulwark | Sunsteel Falchion +5 | 136 | 61.9 | 33.3 | 0.00 | 40.9 | - |
| Squire / Knight | Sunsteel Falchion +5 | 136 | 73.2 | 14.9 | 0.00 | 47.5 | - |
| Slinger / Artillerist | Stinger Rapier +5 | 126 | 126 | 0.00 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Rime-Bound | Sunsteel Falchion +5 | 105 | 21.3 | 0.00 | 79.5 | 3.86 | - |
| Conduit / Effigy | Stinger Rapier +5 | 105 | 0.00 | 105 | 0.00 | 0.00 | - |
| Conduit / Consort | Stinger Rapier +5 | 110 | 0.00 | 110 | 0.00 | 0.00 | - |
| Apprentice / Ember mage | Sunsteel Falchion +5 | 112 | 40.3 | 0.00 | 60.0 | 12.1 | - |
| Slinger / Scout | Sunsteel Falchion +5 | 115 | 82.8 | 0.00 | 0.00 | 32.5 | - |
| Slinger / Marksman | Sunsteel Falchion +5 | 117 | 84.2 | 0.00 | 0.00 | 33.1 | - |
| Conduit / Splinter | Stinger Rapier +5 | 121 | 0.00 | 121 | 0.00 | 0.00 | - |
| Apprentice / Venom vessel | Sunsteel Falchion +5 | 125 | 60.0 | 0.00 | 40.0 | 25.1 | - |
| Slinger / Artillerist | Stinger Rapier +5 | 126 | 126 | 0.00 | 0.00 | 0.00 | - |
| Squire / Knight | Sunsteel Falchion +5 | 136 | 73.2 | 14.9 | 0.00 | 47.5 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 106 | 24 |
| Striker | 96.6 | 24 |
| Squire | 82.8 | 24 |
| Apprentice | 74.9 | 24 |
| Slinger | 73.0 | 24 |
| Conduit | 67.6 | 24 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Sunsteel Falchion | 127 | 18 |
| Stinger Rapier | 123 | 18 |
| Ruinous Axe | 104 | 18 |
| Quake Hammer | 75.1 | 18 |
| Venom Knife | 68.5 | 18 |
| Gale Needle | 60.8 | 18 |
| Knight's Steelsword | 55.7 | 18 |
| Thorn Needle | 53.7 | 18 |


Weapon DPS against target shapes:

| Weapon | neutral T2 dummy | high-plating T2 dummy | high-HP elite T2 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Gale Needle +5 | 60.8 | 49.0 | 54.1 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Stone Basilisk |
| Knight's Steelsword +5 | 55.7 | 48.4 | 49.6 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Stone Basilisk |
| Quake Hammer +5 | 75.1 | 71.4 | 66.6 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Stone Basilisk |
| Ruinous Axe +5 | 104 | 96.2 | 91.5 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Stone Basilisk |
| Stinger Rapier +5 | 123 | 112 | 112 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Stone Basilisk |
| Sunsteel Falchion +5 | 127 | 122 | 89.0 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Stone Basilisk |
| Thorn Needle +5 | 53.7 | 43.8 | 48.5 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Stone Basilisk |
| Venom Knife +5 | 68.5 | 59.3 | 60.9 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Stone Basilisk |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Sunsteel Falchion | 150 | 3 |
| Squire | Sunsteel Falchion | 138 | 3 |
| Apprentice | Sunsteel Falchion | 114 | 3 |
| Spirit | Sunsteel Falchion | 171 | 3 |
| Slinger | Sunsteel Falchion | 118 | 3 |
| Conduit | Stinger Rapier | 112 | 3 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Thorn Needle | 62.8 | 3 |
| Squire | Thorn Needle | 50.4 | 3 |
| Apprentice | Thorn Needle | 41.4 | 3 |
| Spirit | Thorn Needle | 68.9 | 3 |
| Slinger | Gale Needle | 46.1 | 3 |
| Conduit | Knight's Steelsword | 43.0 | 3 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `2 heavy mid summons at 0.54 APS; formation budget normalized`, `2 heavy mid summons at 0.78 APS; formation budget normalized`, `2 heavy mid summons at 0.98 APS; formation budget normalized`, `2 heavy mid summons at 1.18 APS; formation budget normalized`, `2 heavy mid summons at 1.47 APS; formation budget normalized`, `2 heavy mid summons at 1.52 APS; formation budget normalized`, `2 heavy mid summons at 1.67 APS; formation budget normalized`, `5 balanced mid summons at 0.57 APS; formation budget normalized`, `5 balanced mid summons at 0.83 APS; formation budget normalized`, `5 balanced mid summons at 1.04 APS; formation budget normalized`, `5 balanced mid summons at 1.25 APS; formation budget normalized`, `5 balanced mid summons at 1.56 APS; formation budget normalized`, `5 balanced mid summons at 1.61 APS; formation budget normalized`, `5 balanced mid summons at 1.77 APS; formation budget normalized`, `6 light mid summons at 0.60 APS; formation budget normalized`, `6 light mid summons at 0.88 APS; formation budget normalized`, `6 light mid summons at 1.10 APS; formation budget normalized`, `6 light mid summons at 1.32 APS; formation budget normalized`, `6 light mid summons at 1.65 APS; formation budget normalized`, `6 light mid summons at 1.71 APS; formation budget normalized`, `6 light mid summons at 1.87 APS; formation budget normalized`, `dead swing every 4 hits`, `first strike amortized over tier dummy HP`, `swamp-mirebrand-burn reservoir DoT from weapon profile`.
