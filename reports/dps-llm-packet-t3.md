# MMO Idle LLM Balance Packet - T3

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.
- Report tier T3; class unlock tier 2; weapons are tier 3.
- DPS conclusions use +5 weapons only. Weapon input context includes +0 and +5.
- Target mobs come from biome spawn pools one tier below report tier; tutorial/test/interact/boss monsters are excluded.
- When the shifted target tier contains only tutorial/test content, the packet falls back to the first real non-tutorial biome tier.
- Single-target theoretical steady-state only: no movement, enemy attacks, deaths, sustain, AoE value, pathing, aggro, party effects, or eHP.
- Outliers/top/bottom use each class combination's optimal +5 weapon. Class/weapon averages use all +5 weapon samples.

## 2. Target Monster Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 2 |
| Mob count | 20 |
| Average mob HP | 313 |
| Average plating | 0.40 |
| Average DR | 2.45% |
| Reference optimal-build average DPS | 293 |
| Target TTK at reference DPS | 1.07s |
| Expected DPS band | 196 - 439 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Mire Hexer | 350 | 0.00 | 0.00% | HP 350, plating 0.00, DR 0.00% |
| Low plating/DR | Avalanche Ram | 434 | 0.00 | 0.00% | HP 434, plating 0.00, DR 0.00% |
| Mid profile | Crag Mortar | 490 | 0.00 | 0.00% | HP 490, plating 0.00, DR 0.00% |
| High plating | Magma Tortoise | 2000 | 4.00 | 0.00% | HP 2000, plating 4.00, DR 0.00% |
| High DR/special | Glacier Bear | 1500 | 0.00 | 14.0% | HP 1500, plating 0.00, DR 14.0%, shield 20.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage / Harbinger | Permafrost Maul +5 | 342 | 0.00 | 0.54 | 1869 | 172 | 125 | 2.00 | 0.00% | dot.conversion-pct=0.50, dot.duration-ms=5500, dot.max-stacks=6.00, dot.mechanic-mult=1.20, dot.tick-interval-ms=1500 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Hexblade | Permafrost Maul +5 | 345 | 0.00 | 0.55 | 1802 | 12.0 | 137 | 3.00 | 0.00% | dot.conversion-pct=0.50, dot.duration-ms=5500, dot.max-stacks=6.00, dot.mechanic-mult=1.20, dot.tick-interval-ms=1500, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | shared.damage-mult +10% applied to direct + class |
| Apprentice / Rime-Bound / Harbinger | Permafrost Maul +5 | 345 | 0.00 | 0.47 | 2128 | 172 | 133 | 3.00 | 3.00% | dot.conversion-pct=0.70, dot.duration-ms=6500, dot.max-stacks=3.00, dot.mechanic-mult=1.15, dot.tick-interval-ms=2000 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Hexblade | Permafrost Maul +5 | 348 | 0.00 | 0.49 | 2041 | 12.0 | 145 | 3.00 | 3.00% | dot.conversion-pct=0.70, dot.duration-ms=6500, dot.max-stacks=3.00, dot.mechanic-mult=1.15, dot.tick-interval-ms=2000, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | shared.damage-mult +10% applied to direct + class |
| Apprentice / Venom vessel / Harbinger | Rimebrand +5 | 275 | 0.00 | 0.68 | 1462 | 172 | 119 | 2.00 | 0.00% | dot.conversion-pct=0.30, dot.duration-ms=5000, dot.max-stacks=8.00, dot.mechanic-mult=1.25, dot.tick-interval-ms=1000 | DoT cap 8 stacks, tick 1000ms | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Apprentice / Venom vessel / Hexblade | Rimebrand +5 | 277 | 0.00 | 0.71 | 1413 | 12.0 | 131 | 2.00 | 0.00% | dot.conversion-pct=0.30, dot.duration-ms=5000, dot.max-stacks=8.00, dot.mechanic-mult=1.25, dot.tick-interval-ms=1000, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 1000ms | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Conduit / Consort / Harrier | Rimebrand +5 | 249 | 0.00 | 0.62 | 1603 | 162 | 134 | 2.00 | 2.00% | - | 5 balanced/far summons at 0.62 APS each; one formation budget | 5 balanced far summons at 0.62 APS; formation budget normalized; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Conduit / Consort / Vigil | Rimebrand +5 | 249 | 0.00 | 0.62 | 1603 | 162 | 122 | 2.00 | 0.00% | - | 5 balanced/close summons at 0.62 APS each; one formation budget | 5 balanced close summons at 0.62 APS; formation budget normalized; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Conduit / Effigy / Harrier | Rimebrand +5 | 249 | 0.00 | 0.59 | 1701 | 162 | 142 | 2.00 | 3.00% | - | 2 heavy/far summons at 0.59 APS each; one formation budget | 2 heavy far summons at 0.59 APS; formation budget normalized; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Conduit / Effigy / Vigil | Rimebrand +5 | 249 | 0.00 | 0.59 | 1701 | 162 | 130 | 2.00 | 1.00% | - | 2 heavy/close summons at 0.59 APS each; one formation budget | 2 heavy close summons at 0.59 APS; formation budget normalized; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Conduit / Splinter / Harrier | Rimebrand +5 | 249 | 0.00 | 0.66 | 1515 | 162 | 130 | 2.00 | 2.00% | - | 6 light/far summons at 0.66 APS each; one formation budget | 6 light far summons at 0.66 APS; formation budget normalized; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Conduit / Splinter / Vigil | Rimebrand +5 | 249 | 0.00 | 0.66 | 1515 | 162 | 118 | 2.00 | 0.00% | - | 6 light/close summons at 0.66 APS each; one formation budget | 6 light close summons at 0.66 APS; formation budget normalized; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Artillerist / Breacher | Rimebrand +5 | 185 | 0.00 | 1.12 | 744 | 12.0 | 139 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | 20 shots, 3000ms reload, 1.12 effective shots/s | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Artillerist / Deadeye | Rimebrand +5 | 184 | 0.00 | 1.08 | 772 | 212 | 124 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 1.08 effective shots/s | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Marksman / Breacher | Rimebrand +5 | 183 | 0.00 | 1.12 | 695 | 12.0 | 133 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 1.12 effective shots/s | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Marksman / Deadeye | Rimebrand +5 | 182 | 0.00 | 1.09 | 719 | 212 | 118 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 1.09 effective shots/s | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Scout / Breacher | Rimebrand +5 | 183 | 0.00 | 1.11 | 662 | 12.0 | 129 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200, shared.damage-mult=0.10 | 5 shots, 1200ms reload, 1.11 effective shots/s | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Scout / Deadeye | Rimebrand +5 | 182 | 0.00 | 1.08 | 683 | 212 | 114 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 1.08 effective shots/s | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Spirit / Phantasm / Haunt | Rimebrand +5 | 298 | 0.00 | 0.65 | 1544 | 12.0 | 137 | 2.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0, shared.damage-mult=0.10 | discharge every 11 hits (0.06/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Spirit / Phantasm / Wisp | Rimebrand +5 | 296 | 0.00 | 0.62 | 1603 | 222 | 120 | 2.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.06/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Spirit / Spark / Haunt | Rimebrand +5 | 291 | 0.00 | 0.78 | 1282 | 12.0 | 126 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0, shared.damage-mult=0.10 | discharge every 6 hits (0.13/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Spirit / Spark / Wisp | Rimebrand +5 | 289 | 0.00 | 0.76 | 1323 | 222 | 109 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.13/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Spirit / Wraith / Haunt | Rimebrand +5 | 293 | 0.00 | 0.74 | 1344 | 12.0 | 130 | 2.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.08/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Spirit / Wraith / Wisp | Rimebrand +5 | 291 | 0.00 | 0.72 | 1389 | 222 | 113 | 2.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.08/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Squire / Bulwark / Sentinel | Rimebrand +5 | 303 | 0.00 | 0.45 | 2223 | 132 | 155 | 3.00 | 7.00% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50 | empowered every 8.00s (0.13/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Squire / Bulwark / Vanguard | Rimebrand +5 | 305 | 0.00 | 0.47 | 2137 | 12.0 | 162 | 3.00 | 7.00% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50, shared.damage-mult=0.10 | empowered every 8.00s (0.13/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Squire / Knight / Sentinel | Rimebrand +5 | 298 | 0.00 | 0.54 | 1852 | 132 | 145 | 3.00 | 6.00% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Squire / Knight / Vanguard | Rimebrand +5 | 300 | 0.00 | 0.56 | 1792 | 12.0 | 152 | 3.00 | 6.00% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Squire / Warrior / Sentinel | Rimebrand +5 | 296 | 0.00 | 0.59 | 1684 | 132 | 138 | 3.00 | 4.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Squire / Warrior / Vanguard | Rimebrand +5 | 298 | 0.00 | 0.61 | 1634 | 12.0 | 145 | 3.00 | 4.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Striker / Breaker / In-Fighter | Rimebrand +5 | 270 | 0.00 | 0.61 | 1634 | 12.0 | 148 | 3.00 | 4.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, shared.damage-mult=0.10 | finisher every 6 hits (0.10/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Striker / Breaker / Phantom-Blade | Rimebrand +5 | 268 | 0.00 | 0.59 | 1701 | 132 | 139 | 3.00 | 4.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.10/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Striker / Flurry / In-Fighter | Rimebrand +5 | 273 | 0.00 | 0.74 | 1344 | 12.0 | 134 | 3.00 | 2.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, shared.damage-mult=0.10 | finisher every 4 hits (0.19/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Striker / Flurry / Phantom-Blade | Rimebrand +5 | 270 | 0.00 | 0.72 | 1389 | 132 | 125 | 2.00 | 2.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.18/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |
| Striker / Skirmisher / In-Fighter | Rimebrand +5 | 275 | 0.00 | 0.70 | 1437 | 12.0 | 140 | 3.00 | 2.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, shared.damage-mult=0.10 | finisher every 5 hits (0.14/s) | shared.damage-mult +10% applied to direct + class; tundra-rimebrand-burn reservoir DoT from weapon profile |
| Striker / Skirmisher / Phantom-Blade | Rimebrand +5 | 273 | 0.00 | 0.67 | 1488 | 132 | 131 | 3.00 | 2.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.13/s) | tundra-rimebrand-burn reservoir DoT from weapon profile |


## 4. Weapon Input Table (+0 and +5)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Avalanche Maul | +0 | attack=84.0 | weapon.empowered-mult-bonus=0.37 | 0.55 APS base | explicit steps 0/5 |
| Avalanche Maul | +5 | attack=126 | weapon.empowered-mult-bonus=0.44 | 0.55 APS base | explicit steps 5/5 |
| Cataclysm Axe | +0 | attack=78.0 | weapon.dead-swing-interval=5.00 | 1.20 APS base | explicit steps 0/5 |
| Cataclysm Axe | +5 | attack=117 | weapon.dead-swing-interval=5.00 | 1.20 APS base | explicit steps 5/5 |
| Cinderlash | +0 | attack=34.0 | weapon.flurry-pct=0.03, weapon.flurry-stacks=5.00 | 1.65 APS base | explicit steps 0/5 |
| Cinderlash | +5 | attack=64.0 | weapon.flurry-pct=0.03, weapon.flurry-stacks=5.00 | 1.65 APS base | explicit steps 5/5 |
| Permafrost Maul | +0 | attack=120 | weapon.brittle-dr=0.01, weapon.brittle-plating=2.00, weapon.brittle-stacks=8.00 | 0.50 APS base | explicit steps 0/5 |
| Permafrost Maul | +5 | attack=270 | weapon.brittle-dr=0.01, weapon.brittle-plating=2.00, weapon.brittle-stacks=8.00 | 0.50 APS base | explicit steps 5/5 |
| Plague Fang | +0 | attack=32.0 | - | 1.00 APS base; swamp-blightbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/5 |
| Plague Fang | +5 | attack=48.0 | - | 1.00 APS base; swamp-blightbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 5/5 |
| Rimebrand | +0 | attack=96.0 | - | 0.60 APS base; tundra-rimebrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 0/5 |
| Rimebrand | +5 | attack=216 | - | 0.60 APS base; tundra-rimebrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 5/5 |
| Solar Falchion | +0 | attack=42.0 | weapon.first-strike-mult=2.50 | 0.80 APS base | explicit steps 0/5 |
| Solar Falchion | +5 | attack=102 | weapon.first-strike-mult=2.50 | 0.80 APS base | explicit steps 5/5 |
| Venomthorn Rapier | +0 | attack=22.0, onHitDamage=18.0 | - | 1.65 APS base | explicit steps 0/5 |
| Venomthorn Rapier | +5 | attack=42.0, onHitDamage=38.0 | - | 1.65 APS base | explicit steps 5/5 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit / Phantasm / Haunt | Rimebrand +5 | 406 | 62.0 | 28.3 | 0.00 | 316 | - |
| Striker / Breaker / In-Fighter | Rimebrand +5 | 359 | 53.1 | 26.6 | 0.00 | 279 | - |
| Spirit / Spark / Haunt | Rimebrand +5 | 355 | 72.8 | 6.09 | 0.00 | 276 | - |
| Spirit / Phantasm / Wisp | Rimebrand +5 | 353 | 53.9 | 24.6 | 0.00 | 275 | - |
| Spirit / Wraith / Haunt | Rimebrand +5 | 350 | 70.0 | 7.80 | 0.00 | 272 | - |
| Squire / Bulwark / Vanguard | Rimebrand +5 | 344 | 45.9 | 30.7 | 0.00 | 268 | - |
| Apprentice / Rime-Bound / Hexblade | Permafrost Maul +5 | 337 | 56.1 | 0.00 | 281 | 0.00 | - |
| Striker / Skirmisher / In-Fighter | Rimebrand +5 | 332 | 61.5 | 12.3 | 0.00 | 258 | - |
| Striker / Flurry / In-Fighter | Rimebrand +5 | 331 | 65.3 | 8.16 | 0.00 | 257 | - |
| Apprentice / Rime-Bound / Harbinger | Permafrost Maul +5 | 326 | 48.9 | 0.00 | 278 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Effigy / Harrier | Rimebrand +5 | 189 | 0.00 | 42.0 | 0.00 | 147 | LOW |
| Conduit / Effigy / Vigil | Rimebrand +5 | 189 | 0.00 | 42.0 | 0.00 | 147 | LOW |
| Conduit / Consort / Harrier | Rimebrand +5 | 202 | 0.00 | 44.9 | 0.00 | 157 | - |
| Conduit / Consort / Vigil | Rimebrand +5 | 202 | 0.00 | 44.9 | 0.00 | 157 | - |
| Conduit / Splinter / Harrier | Rimebrand +5 | 225 | 0.00 | 49.9 | 0.00 | 175 | - |
| Conduit / Splinter / Vigil | Rimebrand +5 | 225 | 0.00 | 49.9 | 0.00 | 175 | - |
| Slinger / Scout / Deadeye | Rimebrand +5 | 259 | 57.5 | 0.00 | 0.00 | 201 | - |
| Slinger / Marksman / Deadeye | Rimebrand +5 | 260 | 57.8 | 0.00 | 0.00 | 202 | - |
| Slinger / Artillerist / Deadeye | Rimebrand +5 | 262 | 58.2 | 0.00 | 0.00 | 204 | - |
| Squire / Knight / Sentinel | Rimebrand +5 | 268 | 47.0 | 12.5 | 0.00 | 208 | - |


All optimal-weapon outliers:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Effigy / Harrier | Rimebrand +5 | 189 | 0.00 | 42.0 | 0.00 | 147 | LOW |
| Conduit / Effigy / Vigil | Rimebrand +5 | 189 | 0.00 | 42.0 | 0.00 | 147 | LOW |


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 246 | 48 |
| Striker | 225 | 48 |
| Squire | 199 | 48 |
| Apprentice | 187 | 48 |
| Slinger | 175 | 48 |
| Conduit | 140 | 48 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Rimebrand | 290 | 36 |
| Permafrost Maul | 243 | 36 |
| Cinderlash | 196 | 36 |
| Solar Falchion | 196 | 36 |
| Venomthorn Rapier | 195 | 36 |
| Cataclysm Axe | 194 | 36 |
| Avalanche Maul | 138 | 36 |
| Plague Fang | 113 | 36 |


Weapon DPS against target shapes:

| Weapon | neutral T3 dummy | high-plating T3 dummy | high-HP elite T3 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Avalanche Maul +5 | 138 | 137 | 137 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Magma Tortoise (also highest plating) |
| Cataclysm Axe +5 | 194 | 192 | 192 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Magma Tortoise (also highest plating) |
| Cinderlash +5 | 196 | 191 | 191 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Magma Tortoise (also highest plating) |
| Permafrost Maul +5 | 243 | 243 | 243 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Magma Tortoise (also highest plating) |
| Plague Fang +5 | 113 | 109 | 109 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Magma Tortoise (also highest plating) |
| Rimebrand +5 | 290 | 292 | 292 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Magma Tortoise (also highest plating) |
| Solar Falchion +5 | 196 | 149 | 149 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Magma Tortoise (also highest plating) |
| Venomthorn Rapier +5 | 195 | 188 | 188 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Magma Tortoise (also highest plating) |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Rimebrand | 318 | 6 |
| Squire | Rimebrand | 299 | 6 |
| Apprentice | Permafrost Maul | 303 | 6 |
| Spirit | Rimebrand | 347 | 6 |
| Slinger | Rimebrand | 278 | 6 |
| Conduit | Rimebrand | 205 | 6 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Plague Fang | 134 | 6 |
| Squire | Plague Fang | 113 | 6 |
| Apprentice | Plague Fang | 99.1 | 6 |
| Spirit | Plague Fang | 146 | 6 |
| Slinger | Plague Fang | 103 | 6 |
| Conduit | Plague Fang | 84.5 | 6 |


## 10. Outlier Detail

| Flag | Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Suspected source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LOW | Conduit / Effigy / Harrier | Rimebrand +5 | 189 | 0.00 | 42.0 | 0.00 | 147 | weapon/proc share; 2 heavy far summons at 0.59 APS; formation budget normalized; tundra-rimebrand-burn reservoir DoT from weapon profile |
| LOW | Conduit / Effigy / Vigil | Rimebrand +5 | 189 | 0.00 | 42.0 | 0.00 | 147 | weapon/proc share; 2 heavy close summons at 0.59 APS; formation budget normalized; tundra-rimebrand-burn reservoir DoT from weapon profile |


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `2 heavy close summons at 0.49 APS; formation budget normalized`, `2 heavy close summons at 0.54 APS; formation budget normalized`, `2 heavy close summons at 0.59 APS; formation budget normalized`, `2 heavy close summons at 0.78 APS; formation budget normalized`, `2 heavy close summons at 0.98 APS; formation budget normalized`, `2 heavy close summons at 1.18 APS; formation budget normalized`, `2 heavy close summons at 1.62 APS; formation budget normalized`, `2 heavy far summons at 0.49 APS; formation budget normalized`, `2 heavy far summons at 0.54 APS; formation budget normalized`, `2 heavy far summons at 0.59 APS; formation budget normalized`, `2 heavy far summons at 0.78 APS; formation budget normalized`, `2 heavy far summons at 0.98 APS; formation budget normalized`, `2 heavy far summons at 1.18 APS; formation budget normalized`, `2 heavy far summons at 1.62 APS; formation budget normalized`, `5 balanced close summons at 0.52 APS; formation budget normalized`, `5 balanced close summons at 0.57 APS; formation budget normalized`, `5 balanced close summons at 0.62 APS; formation budget normalized`, `5 balanced close summons at 0.83 APS; formation budget normalized`, `5 balanced close summons at 1.04 APS; formation budget normalized`, `5 balanced close summons at 1.25 APS; formation budget normalized`, `5 balanced close summons at 1.72 APS; formation budget normalized`, `5 balanced far summons at 0.52 APS; formation budget normalized`, `5 balanced far summons at 0.57 APS; formation budget normalized`, `5 balanced far summons at 0.62 APS; formation budget normalized`, `5 balanced far summons at 0.83 APS; formation budget normalized`, `5 balanced far summons at 1.04 APS; formation budget normalized`, `5 balanced far summons at 1.25 APS; formation budget normalized`, `5 balanced far summons at 1.72 APS; formation budget normalized`, `6 light close summons at 0.55 APS; formation budget normalized`, `6 light close summons at 0.60 APS; formation budget normalized`, `6 light close summons at 0.66 APS; formation budget normalized`, `6 light close summons at 0.88 APS; formation budget normalized`, `6 light close summons at 1.10 APS; formation budget normalized`, `6 light close summons at 1.32 APS; formation budget normalized`, `6 light close summons at 1.81 APS; formation budget normalized`, `6 light far summons at 0.55 APS; formation budget normalized`, `6 light far summons at 0.60 APS; formation budget normalized`, `6 light far summons at 0.66 APS; formation budget normalized`, `6 light far summons at 0.88 APS; formation budget normalized`, `6 light far summons at 1.10 APS; formation budget normalized`, `6 light far summons at 1.32 APS; formation budget normalized`, `6 light far summons at 1.81 APS; formation budget normalized`, `dead swing every 5 hits`, `first strike amortized over tier dummy HP`, `shared.damage-mult +10% applied to direct + class`, `swamp-blightbrand-burn reservoir DoT from weapon profile`, `tundra-rimebrand-burn reservoir DoT from weapon profile`.
