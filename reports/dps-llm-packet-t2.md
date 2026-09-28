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
| Reference optimal-build average DPS | 121 |
| Target TTK at reference DPS | 1.32s |
| Expected DPS band | 81.2 - 182 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Bog Witch | 220 | 0.00 | 0.00% | HP 220, plating 0.00, DR 0.00% |
| Mid profile | Thorn Spitter | 300 | 0.00 | 0.00% | HP 300, plating 0.00, DR 0.00% |
| High plating | Moss-Shell Snapper | 680 | 6.00 | 0.00% | HP 680, plating 6.00, DR 0.00% |
| Low plating/DR | Dire Wolf | 1575 | 0.00 | 0.00% | HP 1575, plating 0.00, DR 0.00% |
| High DR/special | Cave Troll | 1584 | 1.00 | 26.4% | HP 1584, plating 1.00, DR 26.4% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage | Quake Hammer +5 | 117 | 0.00 | 0.58 | 1731 | 72.0 | 122 | 2.00 | 8.00% | dot.conversion-pct=0.50, dot.duration-ms=5500, dot.max-stacks=6.00, dot.mechanic-mult=1.20, dot.tick-interval-ms=1500 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound | Quake Hammer +5 | 118 | 0.00 | 0.51 | 1976 | 72.0 | 130 | 2.00 | 11.0% | dot.conversion-pct=0.70, dot.duration-ms=6500, dot.max-stacks=3.00, dot.mechanic-mult=1.15, dot.tick-interval-ms=2000 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Venom vessel | Sunsteel Falchion +5 | 93.0 | 0.00 | 0.90 | 1116 | 72.0 | 116 | 2.00 | 8.00% | dot.conversion-pct=0.30, dot.duration-ms=5000, dot.max-stacks=8.00, dot.mechanic-mult=1.25, dot.tick-interval-ms=1000 | DoT cap 8 stacks, tick 1000ms | first strike amortized over tier dummy HP; Sunlight +15% over 4.0s (~2.5 of 2.5 hits) |
| Conduit / Consort | Ruinous Axe +5 | 81.0 | 0.00 | 1.25 | 801 | 162 | 116 | 2.00 | 0.00% | - | 5 balanced/mid summons at 1.25 APS each; one formation budget | 5 balanced mid summons at 1.25 APS; formation budget normalized; dead swing every 4 hits |
| Conduit / Effigy | Ruinous Axe +5 | 81.0 | 0.00 | 1.18 | 850 | 162 | 124 | 2.00 | 1.00% | - | 2 heavy/mid summons at 1.18 APS each; one formation budget | 2 heavy mid summons at 1.18 APS; formation budget normalized; dead swing every 4 hits |
| Conduit / Splinter | Stinger Rapier +5 | 42.0 | 23.0 | 1.71 | 586 | 162 | 112 | 2.00 | 0.00% | - | 6 light/mid summons at 1.71 APS each; one formation budget | 6 light mid summons at 1.71 APS; formation budget normalized |
| Slinger / Artillerist | Venom Knife +5 | 52.0 | 0.00 | 1.61 | 472 | 132 | 121 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 1.61 effective shots/s | swamp-mirebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Slinger / Marksman | Venom Knife +5 | 51.0 | 0.00 | 1.56 | 439 | 132 | 115 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 1.56 effective shots/s | swamp-mirebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Slinger / Scout | Venom Knife +5 | 51.0 | 0.00 | 1.52 | 417 | 132 | 111 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 1.52 effective shots/s | swamp-mirebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Spirit / Phantasm | Gale Needle +5 | 63.0 | 0.00 | 1.74 | 576 | 142 | 117 | 2.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.16/s) | energy steady-state hit estimate |
| Spirit / Spark | Stinger Rapier +5 | 46.0 | 23.0 | 1.80 | 556 | 142 | 106 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.30/s) | energy steady-state hit estimate |
| Spirit / Wraith | Stinger Rapier +5 | 46.0 | 23.0 | 1.74 | 576 | 142 | 110 | 2.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.19/s) | energy steady-state hit estimate |
| Squire / Bulwark | Sunsteel Falchion +5 | 102 | 0.00 | 0.58 | 1712 | 12.0 | 152 | 2.00 | 31.0% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50 | empowered every 8.00s (0.13/s) | first strike amortized over tier dummy HP; Sunlight +15% over 4.0s (~1.6 of 1.6 hits) |
| Squire / Knight | Sunsteel Falchion +5 | 101 | 0.00 | 0.70 | 1420 | 12.0 | 142 | 2.00 | 30.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | first strike amortized over tier dummy HP; Sunlight +15% over 4.0s (~1.6 of 1.6 hits) |
| Squire / Warrior | Sunsteel Falchion +5 | 100 | 0.00 | 0.78 | 1289 | 12.0 | 135 | 2.00 | 28.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | first strike amortized over tier dummy HP; Sunlight +15% over 4.0s (~1.6 of 1.6 hits) |
| Striker / Breaker | Gale Needle +5 | 56.0 | 0.00 | 1.63 | 613 | 12.0 | 136 | 2.00 | 20.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.27/s) | cadence steady-state hit estimate |
| Striker / Flurry | Stinger Rapier +5 | 44.0 | 23.0 | 1.83 | 547 | 12.0 | 122 | 2.00 | 18.0% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.46/s) | cadence steady-state hit estimate |
| Striker / Skirmisher | Stinger Rapier +5 | 45.0 | 23.0 | 1.71 | 586 | 12.0 | 128 | 2.00 | 18.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.34/s) | cadence steady-state hit estimate |


## 4. Weapon Input Table (+0 and +5)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Gale Needle | +0 | attack=17.0 | - | 1.60 APS base | explicit steps 0/5 |
| Gale Needle | +5 | attack=35.0 | - | 1.60 APS base | explicit steps 5/5 |
| Knight's Steelsword | +0 | attack=25.0 | technique.cooldown-reduction-pct=0.13, technique.power-pct=0.25 | 1.00 APS base | explicit steps 0/5 |
| Knight's Steelsword | +5 | attack=51.0 | technique.cooldown-reduction-pct=0.18, technique.power-pct=0.45 | 1.00 APS base | explicit steps 5/5 |
| Quake Hammer | +0 | attack=45.0 | technique.cast-speed-pct=0.15, weapon.empowered-mult-bonus=0.26 | 0.55 APS base | explicit steps 0/5 |
| Quake Hammer | +5 | attack=85.0 | technique.cast-speed-pct=0.15, weapon.empowered-mult-bonus=0.33 | 0.55 APS base | explicit steps 5/5 |
| Ruinous Axe | +0 | attack=31.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 0/5 |
| Ruinous Axe | +5 | attack=60.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 5/5 |
| Stinger Rapier | +0 | attack=11.0, onHitDamage=8.00 | - | 1.55 APS base | explicit steps 0/5 |
| Stinger Rapier | +5 | attack=24.0, onHitDamage=23.0 | - | 1.55 APS base | explicit steps 5/5 |
| Sunsteel Falchion | +0 | attack=32.0 | weapon.first-strike-buff-damage-pct=0.15, weapon.first-strike-buff-duration-ms=4000, weapon.first-strike-mult=1.40 | 0.80 APS base | explicit steps 0/5 |
| Sunsteel Falchion | +5 | attack=65.0 | weapon.first-strike-buff-damage-pct=0.15, weapon.first-strike-buff-duration-ms=4000, weapon.first-strike-mult=1.40 | 0.80 APS base | explicit steps 5/5 |
| Venom Knife | +0 | attack=22.0 | - | 1.00 APS base; swamp-mirebrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/5 |
| Venom Knife | +5 | attack=47.0 | - | 1.00 APS base; swamp-mirebrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 5/5 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit / Phantasm | Gale Needle +5 | 157 | 108 | 48.9 | 0.00 | 0.00 | - |
| Striker / Breaker | Gale Needle +5 | 135 | 89.7 | 44.9 | 0.00 | 0.00 | - |
| Striker / Flurry | Stinger Rapier +5 | 131 | 121 | 10.1 | 0.00 | 0.00 | - |
| Striker / Skirmisher | Stinger Rapier +5 | 129 | 114 | 15.0 | 0.00 | 0.00 | - |
| Spirit / Spark | Stinger Rapier +5 | 129 | 122 | 6.89 | 0.00 | 0.00 | - |
| Conduit / Splinter | Stinger Rapier +5 | 129 | 0.00 | 129 | 0.00 | 0.00 | - |
| Spirit / Wraith | Stinger Rapier +5 | 127 | 118 | 8.68 | 0.00 | 0.00 | - |
| Slinger / Artillerist | Venom Knife +5 | 121 | 41.0 | 0.00 | 0.00 | 80.4 | - |
| Conduit / Consort | Ruinous Axe +5 | 119 | 0.00 | 119 | 0.00 | 0.00 | - |
| Slinger / Marksman | Venom Knife +5 | 116 | 39.1 | 0.00 | 0.00 | 76.7 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage | Quake Hammer +5 | 106 | 33.5 | 0.00 | 72.0 | 0.00 | - |
| Apprentice / Venom vessel | Sunsteel Falchion +5 | 107 | 57.3 | 0.00 | 32.0 | 17.7 | - |
| Conduit / Effigy | Ruinous Axe +5 | 111 | 0.00 | 111 | 0.00 | 0.00 | - |
| Squire / Knight | Sunsteel Falchion +5 | 112 | 69.7 | 14.3 | 0.00 | 27.7 | - |
| Apprentice / Rime-Bound | Quake Hammer +5 | 112 | 17.7 | 0.00 | 94.5 | 0.00 | - |
| Slinger / Scout | Venom Knife +5 | 113 | 38.1 | 0.00 | 0.00 | 74.6 | - |
| Squire / Bulwark | Sunsteel Falchion +5 | 113 | 58.4 | 31.4 | 0.00 | 23.3 | - |
| Squire / Warrior | Sunsteel Falchion +5 | 116 | 76.0 | 9.80 | 0.00 | 30.0 | - |
| Slinger / Marksman | Venom Knife +5 | 116 | 39.1 | 0.00 | 0.00 | 76.7 | - |
| Conduit / Consort | Ruinous Axe +5 | 119 | 0.00 | 119 | 0.00 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 118 | 21 |
| Striker | 115 | 21 |
| Conduit | 99.0 | 21 |
| Squire | 98.2 | 21 |
| Slinger | 97.1 | 21 |
| Apprentice | 92.2 | 21 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Stinger Rapier | 114 | 18 |
| Sunsteel Falchion | 112 | 18 |
| Gale Needle | 109 | 18 |
| Venom Knife | 106 | 18 |
| Ruinous Axe | 101 | 18 |
| Knight's Steelsword | 90.9 | 18 |
| Quake Hammer | 90.3 | 18 |


Weapon DPS against target shapes:

| Weapon | neutral T2 dummy | high-plating T2 dummy | high-HP elite T2 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Gale Needle +5 | 109 | 96.2 | 111 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Granite Titan |
| Knight's Steelsword +5 | 90.9 | 84.3 | 93.2 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Granite Titan |
| Quake Hammer +5 | 90.3 | 86.8 | 91.8 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Granite Titan |
| Ruinous Axe +5 | 101 | 93.4 | 103 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Granite Titan |
| Stinger Rapier +5 | 114 | 102 | 116 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Granite Titan |
| Sunsteel Falchion +5 | 112 | 92.3 | 96.1 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Granite Titan |
| Venom Knife +5 | 106 | 97.1 | 109 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Moss-Shell Snapper; high-HP elite T2 dummy: Granite Titan |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Stinger Rapier | 130 | 3 |
| Squire | Sunsteel Falchion | 114 | 3 |
| Apprentice | Sunsteel Falchion | 103 | 3 |
| Spirit | Gale Needle | 134 | 3 |
| Slinger | Venom Knife | 117 | 3 |
| Conduit | Ruinous Axe | 119 | 3 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Quake Hammer | 94.3 | 3 |
| Squire | Knight's Steelsword | 85.2 | 3 |
| Apprentice | Stinger Rapier | 82.3 | 3 |
| Spirit | Quake Hammer | 94.4 | 3 |
| Slinger | Ruinous Axe | 81.5 | 3 |
| Conduit | Quake Hammer | 72.7 | 3 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `2 heavy mid summons at 0.54 APS; formation budget normalized`, `2 heavy mid summons at 0.78 APS; formation budget normalized`, `2 heavy mid summons at 0.98 APS; formation budget normalized`, `2 heavy mid summons at 1.18 APS; formation budget normalized`, `2 heavy mid summons at 1.52 APS; formation budget normalized`, `2 heavy mid summons at 1.67 APS; formation budget normalized`, `5 balanced mid summons at 0.57 APS; formation budget normalized`, `5 balanced mid summons at 0.83 APS; formation budget normalized`, `5 balanced mid summons at 1.04 APS; formation budget normalized`, `5 balanced mid summons at 1.25 APS; formation budget normalized`, `5 balanced mid summons at 1.61 APS; formation budget normalized`, `5 balanced mid summons at 1.77 APS; formation budget normalized`, `6 light mid summons at 0.60 APS; formation budget normalized`, `6 light mid summons at 0.88 APS; formation budget normalized`, `6 light mid summons at 1.10 APS; formation budget normalized`, `6 light mid summons at 1.32 APS; formation budget normalized`, `6 light mid summons at 1.71 APS; formation budget normalized`, `6 light mid summons at 1.87 APS; formation budget normalized`, `Sunlight +15% over 4.0s (~1.6 of 1.6 hits)`, `Sunlight +15% over 4.0s (~1.7 of 1.7 hits)`, `Sunlight +15% over 4.0s (~1.8 of 1.8 hits)`, `Sunlight +15% over 4.0s (~2.4 of 2.4 hits)`, `Sunlight +15% over 4.0s (~2.5 of 2.5 hits)`, `Sunlight +15% over 4.0s (~2.9 of 5.7 hits)`, `Sunlight +15% over 4.0s (~3.1 of 160.5 hits)`, `Sunlight +15% over 4.0s (~3.3 of 160.5 hits)`, `Sunlight +15% over 4.0s (~3.4 of 3.5 hits)`, `Sunlight +15% over 4.0s (~3.5 of 160.5 hits)`, `dead swing every 4 hits`, `first strike amortized over tier dummy HP`, `swamp-mirebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded`.
