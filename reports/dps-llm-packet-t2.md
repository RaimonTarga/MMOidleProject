# MMO Idle LLM Balance Packet - T2

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

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
| Average mob HP | 155 |
| Average plating | 0.40 |
| Average DR | 1.50% |
| Reference optimal-build average DPS | 177 |
| Target TTK at reference DPS | 0.87s |
| Expected DPS band | 119 - 266 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Savanna Hawk | 140 | 0.00 | 0.00% | HP 140, plating 0.00, DR 0.00% |
| Mid profile | Ironclaw Badger | 200 | 0.00 | 0.00% | HP 200, plating 0.00, DR 0.00% |
| Low plating/DR | Dire Wolf | 225 | 0.00 | 0.00% | HP 225, plating 0.00, DR 0.00% |
| High DR/special | Mire Stalker | 320 | 0.00 | 12.0% | HP 320, plating 0.00, DR 12.0%, evasion 20.0% |
| High plating | Cave Troll | 740 | 4.00 | 15.0% | HP 740, plating 4.00, DR 15.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage | Quake Hammer +5 | 221 | 0.00 | 0.58 | 1731 | 72.0 | 122 | 2.00 | 0.00% | dot.conversion-pct=0.50, dot.duration-ms=5500, dot.max-stacks=6.00, dot.mechanic-mult=1.20, dot.tick-interval-ms=1500 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound | Quake Hammer +5 | 223 | 0.00 | 0.51 | 1976 | 72.0 | 130 | 3.00 | 3.00% | dot.conversion-pct=0.70, dot.duration-ms=6500, dot.max-stacks=3.00, dot.mechanic-mult=1.15, dot.tick-interval-ms=2000 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Venom vessel | Quake Hammer +5 | 219 | 0.00 | 0.62 | 1623 | 72.0 | 116 | 2.00 | 0.00% | dot.conversion-pct=0.30, dot.duration-ms=5000, dot.max-stacks=8.00, dot.mechanic-mult=1.25, dot.tick-interval-ms=1000 | DoT cap 8 stacks, tick 1000ms | dot steady-state hit estimate |
| Conduit / Consort | Ruinous Axe +5 | 135 | 0.00 | 1.25 | 801 | 162 | 116 | 2.00 | 0.00% | - | 5 balanced/mid summons at 1.25 APS each; one formation budget | 5 balanced mid summons at 1.25 APS; formation budget normalized; dead swing every 4 hits |
| Conduit / Effigy | Ruinous Axe +5 | 135 | 0.00 | 1.18 | 850 | 162 | 124 | 2.00 | 1.00% | - | 2 heavy/mid summons at 1.18 APS each; one formation budget | 2 heavy mid summons at 1.18 APS; formation budget normalized; dead swing every 4 hits |
| Conduit / Splinter | Ruinous Axe +5 | 135 | 0.00 | 1.32 | 757 | 162 | 112 | 2.00 | 0.00% | - | 6 light/mid summons at 1.32 APS each; one formation budget | 6 light mid summons at 1.32 APS; formation budget normalized; dead swing every 4 hits |
| Slinger / Artillerist | Quake Hammer +5 | 147 | 0.00 | 0.99 | 858 | 132 | 121 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 0.99 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman | Quake Hammer +5 | 144 | 0.00 | 1.00 | 798 | 132 | 115 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 1.00 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout | Quake Hammer +5 | 144 | 0.00 | 1.00 | 758 | 132 | 111 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 1.00 effective shots/s | reload steady-state hit estimate |
| Spirit / Phantasm | Ruinous Axe +5 | 156 | 0.00 | 1.22 | 817 | 142 | 117 | 2.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.11/s) | dead swing every 4 hits |
| Spirit / Spark | Ruinous Axe +5 | 153 | 0.00 | 1.49 | 672 | 142 | 106 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.25/s) | dead swing every 4 hits |
| Spirit / Wraith | Ruinous Axe +5 | 154 | 0.00 | 1.42 | 706 | 142 | 110 | 2.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.16/s) | dead swing every 4 hits |
| Squire / Bulwark | Quake Hammer +5 | 242 | 0.00 | 0.40 | 2490 | 12.0 | 152 | 3.00 | 7.00% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50 | empowered every 8.00s (0.13/s) | cooldown steady-state hit estimate |
| Squire / Knight | Quake Hammer +5 | 238 | 0.00 | 0.48 | 2066 | 12.0 | 142 | 3.00 | 6.00% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Warrior | Quake Hammer +5 | 236 | 0.00 | 0.53 | 1874 | 12.0 | 135 | 3.00 | 4.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Striker / Breaker | Ruinous Axe +5 | 141 | 0.00 | 1.15 | 868 | 12.0 | 136 | 3.00 | 4.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.19/s) | dead swing every 4 hits |
| Striker / Flurry | Ruinous Axe +5 | 143 | 0.00 | 1.42 | 706 | 12.0 | 122 | 2.00 | 2.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.35/s) | dead swing every 4 hits |
| Striker / Skirmisher | Ruinous Axe +5 | 144 | 0.00 | 1.32 | 757 | 12.0 | 128 | 3.00 | 2.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.26/s) | dead swing every 4 hits |


## 4. Weapon Input Table (+0 and +5)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Gale Needle | +0 | attack=18.0 | - | 1.60 APS base | explicit steps 0/5 |
| Gale Needle | +5 | attack=50.0 | - | 1.60 APS base | explicit steps 5/5 |
| Knight's Steelsword | +0 | attack=25.0 | technique.cooldown-reduction-pct=0.12 | 1.00 APS base | explicit steps 0/5 |
| Knight's Steelsword | +5 | attack=75.0 | technique.cooldown-reduction-pct=0.12 | 1.00 APS base | explicit steps 5/5 |
| Quake Hammer | +0 | attack=54.0 | technique.cast-speed-pct=0.15, weapon.empowered-mult-bonus=0.30 | 0.55 APS base | explicit steps 0/5 |
| Quake Hammer | +5 | attack=174 | technique.cast-speed-pct=0.15, weapon.empowered-mult-bonus=0.30 | 0.55 APS base | explicit steps 5/5 |
| Ruinous Axe | +0 | attack=40.0 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 0/5 |
| Ruinous Axe | +5 | attack=110 | weapon.dead-swing-interval=4.00 | 1.20 APS base | explicit steps 5/5 |
| Stinger Rapier | +0 | attack=10.0, onHitDamage=8.00 | - | 1.55 APS base | explicit steps 0/5 |
| Stinger Rapier | +5 | attack=30.0, onHitDamage=23.0 | - | 1.55 APS base | explicit steps 5/5 |
| Sunsteel Falchion | +0 | attack=24.0 | technique.power-pct=0.20, weapon.first-strike-mult=2.00 | 0.80 APS base | explicit steps 0/5 |
| Sunsteel Falchion | +5 | attack=69.0 | technique.power-pct=0.20, weapon.first-strike-mult=2.00 | 0.80 APS base | explicit steps 5/5 |
| Thorn Needle | +0 | attack=13.0, onHitDamage=4.00 | - | 1.50 APS base | explicit steps 0/5 |
| Thorn Needle | +5 | attack=21.0, onHitDamage=13.0 | - | 1.50 APS base | explicit steps 5/5 |
| Venom Knife | +0 | attack=22.0 | - | 1.00 APS base; swamp-mirebrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/5 |
| Venom Knife | +5 | attack=72.0 | - | 1.00 APS base; swamp-mirebrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 5/5 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit / Phantasm | Ruinous Axe +5 | 226 | 140 | 85.6 | 0.00 | 0.00 | - |
| Apprentice / Rime-Bound | Quake Hammer +5 | 213 | 33.4 | 0.00 | 180 | 0.00 | - |
| Squire / Bulwark | Quake Hammer +5 | 201 | 95.6 | 106 | 0.00 | 0.00 | - |
| Striker / Breaker | Ruinous Axe +5 | 199 | 119 | 80.1 | 0.00 | 0.00 | - |
| Apprentice / Ember mage | Quake Hammer +5 | 195 | 63.0 | 0.00 | 132 | 0.00 | - |
| Spirit / Spark | Ruinous Axe +5 | 186 | 167 | 18.8 | 0.00 | 0.00 | - |
| Spirit / Wraith | Ruinous Axe +5 | 184 | 160 | 23.9 | 0.00 | 0.00 | - |
| Conduit / Splinter | Ruinous Axe +5 | 182 | 0.00 | 182 | 0.00 | 0.00 | - |
| Striker / Skirmisher | Ruinous Axe +5 | 177 | 140 | 37.5 | 0.00 | 0.00 | - |
| Striker / Flurry | Ruinous Axe +5 | 174 | 149 | 25.1 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Marksman | Quake Hammer +5 | 142 | 142 | 0.00 | 0.00 | 0.00 | - |
| Slinger / Scout | Quake Hammer +5 | 142 | 142 | 0.00 | 0.00 | 0.00 | - |
| Slinger / Artillerist | Quake Hammer +5 | 144 | 144 | 0.00 | 0.00 | 0.00 | - |
| Conduit / Effigy | Ruinous Axe +5 | 153 | 0.00 | 153 | 0.00 | 0.00 | - |
| Conduit / Consort | Ruinous Axe +5 | 162 | 0.00 | 162 | 0.00 | 0.00 | - |
| Squire / Knight | Quake Hammer +5 | 167 | 113 | 53.6 | 0.00 | 0.00 | - |
| Squire / Warrior | Quake Hammer +5 | 168 | 124 | 44.2 | 0.00 | 0.00 | - |
| Apprentice / Venom vessel | Quake Hammer +5 | 173 | 93.0 | 0.00 | 80.0 | 0.00 | - |
| Striker / Flurry | Ruinous Axe +5 | 174 | 149 | 25.1 | 0.00 | 0.00 | - |
| Striker / Skirmisher | Ruinous Axe +5 | 177 | 140 | 37.5 | 0.00 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 167 | 24 |
| Striker | 152 | 24 |
| Squire | 131 | 24 |
| Apprentice | 122 | 24 |
| Slinger | 115 | 24 |
| Conduit | 109 | 24 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Quake Hammer | 166 | 18 |
| Ruinous Axe | 163 | 18 |
| Venom Knife | 144 | 18 |
| Gale Needle | 130 | 18 |
| Sunsteel Falchion | 129 | 18 |
| Stinger Rapier | 123 | 18 |
| Knight's Steelsword | 121 | 18 |
| Thorn Needle | 86.7 | 18 |


Weapon DPS against target shapes:

| Weapon | neutral T2 dummy | high-plating T2 dummy | high-HP elite T2 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Gale Needle +5 | 130 | 107 | 107 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Knight's Steelsword +5 | 121 | 101 | 101 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Quake Hammer +5 | 166 | 144 | 144 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Ruinous Axe +5 | 163 | 138 | 138 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Stinger Rapier +5 | 123 | 105 | 105 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Sunsteel Falchion +5 | 129 | 83.9 | 83.9 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Thorn Needle +5 | 86.7 | 71.2 | 71.2 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |
| Venom Knife +5 | 144 | 120 | 120 | neutral T2 dummy: 10 mob average, biome tier 1; high-plating T2 dummy: Cave Troll; high-HP elite T2 dummy: Cave Troll (also highest plating) |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Ruinous Axe | 183 | 3 |
| Squire | Quake Hammer | 179 | 3 |
| Apprentice | Quake Hammer | 194 | 3 |
| Spirit | Ruinous Axe | 199 | 3 |
| Slinger | Quake Hammer | 143 | 3 |
| Conduit | Ruinous Axe | 166 | 3 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Thorn Needle | 103 | 3 |
| Squire | Thorn Needle | 82.1 | 3 |
| Apprentice | Thorn Needle | 67.6 | 3 |
| Spirit | Thorn Needle | 112 | 3 |
| Slinger | Thorn Needle | 79.4 | 3 |
| Conduit | Sunsteel Falchion | 74.4 | 3 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `2 heavy mid summons at 0.54 APS; formation budget normalized`, `2 heavy mid summons at 0.78 APS; formation budget normalized`, `2 heavy mid summons at 0.98 APS; formation budget normalized`, `2 heavy mid summons at 1.18 APS; formation budget normalized`, `2 heavy mid summons at 1.47 APS; formation budget normalized`, `2 heavy mid summons at 1.52 APS; formation budget normalized`, `2 heavy mid summons at 1.57 APS; formation budget normalized`, `5 balanced mid summons at 0.57 APS; formation budget normalized`, `5 balanced mid summons at 0.83 APS; formation budget normalized`, `5 balanced mid summons at 1.04 APS; formation budget normalized`, `5 balanced mid summons at 1.25 APS; formation budget normalized`, `5 balanced mid summons at 1.56 APS; formation budget normalized`, `5 balanced mid summons at 1.61 APS; formation budget normalized`, `5 balanced mid summons at 1.66 APS; formation budget normalized`, `6 light mid summons at 0.60 APS; formation budget normalized`, `6 light mid summons at 0.88 APS; formation budget normalized`, `6 light mid summons at 1.10 APS; formation budget normalized`, `6 light mid summons at 1.32 APS; formation budget normalized`, `6 light mid summons at 1.65 APS; formation budget normalized`, `6 light mid summons at 1.71 APS; formation budget normalized`, `6 light mid summons at 1.76 APS; formation budget normalized`, `dead swing every 4 hits`, `first strike amortized over tier dummy HP`, `swamp-mirebrand-burn reservoir DoT from weapon profile`.
