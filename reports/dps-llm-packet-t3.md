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
| Average mob HP | 730 |
| Average plating | 0.40 |
| Average DR | 3.37% |
| Reference optimal-build average DPS | 235 |
| Target TTK at reference DPS | 3.10s |
| Expected DPS band | 158 - 353 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Mire Hexer | 510 | 0.00 | 0.00% | HP 510, plating 0.00, DR 0.00% |
| Low plating/DR | Avalanche Ram | 610 | 0.00 | 0.00% | HP 610, plating 0.00, DR 0.00% |
| Mid profile | Crag Mortar | 685 | 0.00 | 0.00% | HP 685, plating 0.00, DR 0.00% |
| High plating | Magma Tortoise | 3000 | 4.00 | 0.00% | HP 3000, plating 4.00, DR 0.00% |
| High DR/special | Cavern Troll | 4725 | 2.00 | 28.0% | HP 4725, plating 2.00, DR 28.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage / Harbinger | Avalanche Maul +5 | 215 | 0.00 | 0.59 | 1699 | 172 | 125 | 2.00 | 8.00% | dot.conversion-pct=0.50, dot.duration-ms=5500, dot.max-stacks=6.00, dot.mechanic-mult=1.20, dot.tick-interval-ms=1500 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Hexblade | Avalanche Maul +5 | 217 | 0.00 | 0.61 | 1638 | 12.0 | 137 | 2.00 | 8.00% | dot.conversion-pct=0.50, dot.duration-ms=5500, dot.max-stacks=6.00, dot.mechanic-mult=1.20, dot.tick-interval-ms=1500, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Apprentice / Rime-Bound / Harbinger | Avalanche Maul +5 | 217 | 0.00 | 0.52 | 1934 | 172 | 133 | 2.00 | 11.0% | dot.conversion-pct=0.70, dot.duration-ms=6500, dot.max-stacks=3.00, dot.mechanic-mult=1.15, dot.tick-interval-ms=2000 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Hexblade | Avalanche Maul +5 | 218 | 0.00 | 0.54 | 1855 | 12.0 | 145 | 2.00 | 11.0% | dot.conversion-pct=0.70, dot.duration-ms=6500, dot.max-stacks=3.00, dot.mechanic-mult=1.15, dot.tick-interval-ms=2000, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Apprentice / Venom vessel / Harbinger | Cinderlash +5 | 101 | 0.00 | 2.16 | 532 | 172 | 119 | 2.00 | 8.00% | dot.conversion-pct=0.30, dot.duration-ms=5000, dot.max-stacks=8.00, dot.mechanic-mult=1.25, dot.tick-interval-ms=1000 | DoT cap 8 stacks, tick 1000ms | dot steady-state hit estimate |
| Apprentice / Venom vessel / Hexblade | Cinderlash +5 | 102 | 0.00 | 2.24 | 514 | 12.0 | 131 | 2.00 | 8.00% | dot.conversion-pct=0.30, dot.duration-ms=5000, dot.max-stacks=8.00, dot.mechanic-mult=1.25, dot.tick-interval-ms=1000, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 1000ms | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Conduit / Consort / Harrier | Venomthorn Rapier +5 | 70.0 | 38.0 | 1.72 | 583 | 162 | 134 | 2.00 | 2.00% | - | 5 balanced/far summons at 1.72 APS each; one formation budget | 5 balanced far summons at 1.72 APS; formation budget normalized |
| Conduit / Consort / Vigil | Venomthorn Rapier +5 | 70.0 | 38.0 | 1.72 | 583 | 162 | 122 | 2.00 | 0.00% | - | 5 balanced/close summons at 1.72 APS each; one formation budget | 5 balanced close summons at 1.72 APS; formation budget normalized |
| Conduit / Effigy / Harrier | Venomthorn Rapier +5 | 70.0 | 38.0 | 1.62 | 618 | 162 | 142 | 2.00 | 3.00% | - | 2 heavy/far summons at 1.62 APS each; one formation budget | 2 heavy far summons at 1.62 APS; formation budget normalized |
| Conduit / Effigy / Vigil | Venomthorn Rapier +5 | 70.0 | 38.0 | 1.62 | 618 | 162 | 130 | 2.00 | 1.00% | - | 2 heavy/close summons at 1.62 APS each; one formation budget | 2 heavy close summons at 1.62 APS; formation budget normalized |
| Conduit / Splinter / Harrier | Venomthorn Rapier +5 | 70.0 | 38.0 | 1.81 | 551 | 162 | 130 | 2.00 | 2.00% | - | 6 light/far summons at 1.81 APS each; one formation budget | 6 light far summons at 1.81 APS; formation budget normalized |
| Conduit / Splinter / Vigil | Venomthorn Rapier +5 | 70.0 | 38.0 | 1.81 | 551 | 162 | 118 | 2.00 | 0.00% | - | 6 light/close summons at 1.81 APS each; one formation budget | 6 light close summons at 1.81 APS; formation budget normalized |
| Slinger / Artillerist / Breacher | Rimebrand +5 | 128 | 0.00 | 1.12 | 744 | 12.0 | 139 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | 20 shots, 3000ms reload, 1.12 effective shots/s | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded; tundra-rimebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Slinger / Artillerist / Deadeye | Rimebrand +5 | 127 | 0.00 | 1.08 | 772 | 212 | 124 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 1.08 effective shots/s | tundra-rimebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Slinger / Marksman / Breacher | Rimebrand +5 | 126 | 0.00 | 1.12 | 695 | 12.0 | 133 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 1.12 effective shots/s | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded; tundra-rimebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Slinger / Marksman / Deadeye | Rimebrand +5 | 125 | 0.00 | 1.09 | 719 | 212 | 118 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 1.09 effective shots/s | tundra-rimebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Slinger / Scout / Breacher | Rimebrand +5 | 126 | 0.00 | 1.11 | 662 | 12.0 | 129 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200, shared.damage-mult=0.10 | 5 shots, 1200ms reload, 1.11 effective shots/s | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded; tundra-rimebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Slinger / Scout / Deadeye | Rimebrand +5 | 125 | 0.00 | 1.08 | 683 | 212 | 114 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 1.08 effective shots/s | tundra-rimebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Spirit / Phantasm / Haunt | Cinderlash +5 | 110 | 0.00 | 2.05 | 561 | 12.0 | 137 | 2.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0, shared.damage-mult=0.10 | discharge every 11 hits (0.19/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Spirit / Phantasm / Wisp | Cinderlash +5 | 109 | 0.00 | 1.97 | 583 | 222 | 120 | 2.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.18/s) | energy steady-state hit estimate |
| Spirit / Spark / Haunt | Cinderlash +5 | 103 | 0.00 | 2.31 | 497 | 12.0 | 126 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0, shared.damage-mult=0.10 | discharge every 6 hits (0.39/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Spirit / Spark / Wisp | Cinderlash +5 | 102 | 0.00 | 2.24 | 514 | 222 | 109 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.37/s) | energy steady-state hit estimate |
| Spirit / Wraith / Haunt | Cinderlash +5 | 104 | 0.00 | 2.24 | 514 | 12.0 | 130 | 2.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.25/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Spirit / Wraith / Wisp | Cinderlash +5 | 103 | 0.00 | 2.16 | 532 | 222 | 113 | 2.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.24/s) | energy steady-state hit estimate |
| Squire / Bulwark / Sentinel | Avalanche Maul +5 | 234 | 0.00 | 0.41 | 2424 | 132 | 155 | 2.00 | 31.0% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50 | empowered every 8.00s (0.13/s) | cooldown steady-state hit estimate |
| Squire / Bulwark / Vanguard | Avalanche Maul +5 | 236 | 0.00 | 0.43 | 2331 | 12.0 | 162 | 2.00 | 35.0% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50, shared.damage-mult=0.10 | empowered every 8.00s (0.13/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Squire / Knight / Sentinel | Cinderlash +5 | 110 | 0.00 | 1.71 | 673 | 132 | 145 | 2.00 | 30.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Knight / Vanguard | Cinderlash +5 | 111 | 0.00 | 1.76 | 652 | 12.0 | 152 | 2.00 | 34.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Squire / Warrior / Sentinel | Cinderlash +5 | 109 | 0.00 | 1.88 | 612 | 132 | 138 | 2.00 | 28.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Vanguard | Cinderlash +5 | 110 | 0.00 | 1.93 | 594 | 12.0 | 145 | 2.00 | 32.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Striker / Breaker / In-Fighter | Cinderlash +5 | 99.0 | 0.00 | 1.93 | 594 | 12.0 | 148 | 2.00 | 24.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, shared.damage-mult=0.10 | finisher every 6 hits (0.32/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Striker / Breaker / Phantom-Blade | Cinderlash +5 | 99.0 | 0.00 | 1.86 | 618 | 132 | 139 | 2.00 | 20.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.31/s) | cadence steady-state hit estimate |
| Striker / Flurry / In-Fighter | Cinderlash +5 | 100 | 0.00 | 2.35 | 489 | 12.0 | 134 | 2.00 | 22.0% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, shared.damage-mult=0.10 | finisher every 4 hits (0.59/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Striker / Flurry / Phantom-Blade | Cinderlash +5 | 99.0 | 0.00 | 2.28 | 505 | 132 | 125 | 2.00 | 18.0% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.57/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / In-Fighter | Cinderlash +5 | 101 | 0.00 | 2.20 | 522 | 12.0 | 140 | 2.00 | 22.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, shared.damage-mult=0.10 | finisher every 5 hits (0.44/s) | shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded |
| Striker / Skirmisher / Phantom-Blade | Cinderlash +5 | 100 | 0.00 | 2.13 | 541 | 132 | 131 | 2.00 | 18.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.43/s) | cadence steady-state hit estimate |


## 4. Weapon Input Table (+0 and +5)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Avalanche Maul | +0 | attack=96.0 | weapon.empowered-mult-bonus=0.37 | 0.55 APS base | explicit steps 0/5 |
| Avalanche Maul | +5 | attack=164 | weapon.empowered-mult-bonus=0.44 | 0.55 APS base | explicit steps 5/5 |
| Cataclysm Axe | +0 | attack=67.0 | weapon.dead-swing-interval=5.00 | 1.20 APS base | explicit steps 0/5 |
| Cataclysm Axe | +5 | attack=112 | weapon.dead-swing-interval=5.00 | 1.20 APS base | explicit steps 5/5 |
| Cinderlash | +0 | attack=39.0 | weapon.flurry-pct=0.03, weapon.flurry-stacks=5.00 | 1.65 APS base | explicit steps 0/5 |
| Cinderlash | +5 | attack=70.0 | weapon.flurry-pct=0.03, weapon.flurry-stacks=5.00 | 1.65 APS base | explicit steps 5/5 |
| Permafrost Maul | +0 | attack=98.0 | weapon.brittle-dr=0.01, weapon.brittle-plating=2.00, weapon.brittle-stacks=8.00 | 0.50 APS base | explicit steps 0/5 |
| Permafrost Maul | +5 | attack=162 | weapon.brittle-dr=0.01, weapon.brittle-plating=2.00, weapon.brittle-stacks=8.00 | 0.50 APS base | explicit steps 5/5 |
| Pilgrim's Quarterstaff | +0 | attack=58.0 | technique.cooldown-reduction-pct=0.19, technique.power-pct=0.50 | 1.00 APS base | explicit steps 0/5 |
| Pilgrim's Quarterstaff | +5 | attack=90.0 | technique.cooldown-reduction-pct=0.23, technique.power-pct=0.65 | 1.00 APS base | explicit steps 5/5 |
| Plague Fang | +0 | attack=54.0 | - | 1.00 APS base; swamp-blightbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/5 |
| Plague Fang | +5 | attack=86.0 | - | 1.00 APS base; swamp-blightbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 5/5 |
| Rimebrand | +0 | attack=84.0 | - | 0.60 APS base; tundra-rimebrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 0/5 |
| Rimebrand | +5 | attack=132 | - | 0.60 APS base; tundra-rimebrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 5/5 |
| Solar Falchion | +0 | attack=71.0 | weapon.first-strike-buff-damage-pct=0.20, weapon.first-strike-buff-duration-ms=5000, weapon.first-strike-mult=1.50 | 0.80 APS base | explicit steps 0/5 |
| Solar Falchion | +5 | attack=112 | weapon.first-strike-buff-damage-pct=0.20, weapon.first-strike-buff-duration-ms=5000, weapon.first-strike-mult=1.50 | 0.80 APS base | explicit steps 5/5 |
| Venomthorn Rapier | +0 | attack=29.0, onHitDamage=18.0 | - | 1.65 APS base | explicit steps 0/5 |
| Venomthorn Rapier | +5 | attack=50.0, onHitDamage=38.0 | - | 1.65 APS base | explicit steps 5/5 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit / Phantasm / Haunt | Cinderlash +5 | 348 | 239 | 109 | 0.00 | 0.00 | - |
| Striker / Breaker / In-Fighter | Cinderlash +5 | 304 | 202 | 102 | 0.00 | 0.00 | - |
| Spirit / Phantasm / Wisp | Cinderlash +5 | 302 | 207 | 94.5 | 0.00 | 0.00 | - |
| Striker / Skirmisher / In-Fighter | Cinderlash +5 | 283 | 235 | 47.5 | 0.00 | 0.00 | - |
| Striker / Flurry / In-Fighter | Cinderlash +5 | 280 | 248 | 31.7 | 0.00 | 0.00 | - |
| Spirit / Wraith / Haunt | Cinderlash +5 | 274 | 246 | 27.6 | 0.00 | 0.00 | - |
| Spirit / Spark / Haunt | Cinderlash +5 | 273 | 252 | 21.2 | 0.00 | 0.00 | - |
| Striker / Breaker / Phantom-Blade | Cinderlash +5 | 266 | 177 | 89.1 | 0.00 | 0.00 | - |
| Slinger / Artillerist / Breacher | Rimebrand +5 | 253 | 45.4 | 0.00 | 0.00 | 208 | - |
| Slinger / Marksman / Breacher | Rimebrand +5 | 251 | 45.0 | 0.00 | 0.00 | 206 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Venom vessel / Harbinger | Cinderlash +5 | 187 | 147 | 0.00 | 40.0 | 0.00 | - |
| Conduit / Effigy / Harrier | Venomthorn Rapier +5 | 188 | 0.00 | 188 | 0.00 | 0.00 | - |
| Conduit / Effigy / Vigil | Venomthorn Rapier +5 | 188 | 0.00 | 188 | 0.00 | 0.00 | - |
| Apprentice / Ember mage / Harbinger | Avalanche Maul +5 | 189 | 61.2 | 0.00 | 128 | 0.00 | - |
| Squire / Knight / Sentinel | Cinderlash +5 | 196 | 181 | 15.1 | 0.00 | 0.00 | - |
| Conduit / Consort / Harrier | Venomthorn Rapier +5 | 202 | 0.00 | 202 | 0.00 | 0.00 | - |
| Conduit / Consort / Vigil | Venomthorn Rapier +5 | 202 | 0.00 | 202 | 0.00 | 0.00 | - |
| Apprentice / Ember mage / Hexblade | Avalanche Maul +5 | 203 | 70.5 | 0.00 | 132 | 0.00 | - |
| Apprentice / Rime-Bound / Harbinger | Avalanche Maul +5 | 207 | 32.6 | 0.00 | 174 | 0.00 | - |
| Squire / Bulwark / Sentinel | Avalanche Maul +5 | 207 | 93.2 | 114 | 0.00 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 212 | 54 |
| Striker | 207 | 54 |
| Slinger | 181 | 54 |
| Squire | 179 | 54 |
| Apprentice | 170 | 54 |
| Conduit | 160 | 54 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Cinderlash | 214 | 36 |
| Venomthorn Rapier | 211 | 36 |
| Rimebrand | 191 | 36 |
| Cataclysm Axe | 190 | 36 |
| Plague Fang | 187 | 36 |
| Solar Falchion | 182 | 36 |
| Avalanche Maul | 177 | 36 |
| Pilgrim's Quarterstaff | 156 | 36 |
| Permafrost Maul | 154 | 36 |


Weapon DPS against target shapes:

| Weapon | neutral T3 dummy | high-plating T3 dummy | high-HP elite T3 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Avalanche Maul +5 | 177 | 179 | 136 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |
| Cataclysm Axe +5 | 190 | 190 | 144 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |
| Cinderlash +5 | 214 | 211 | 159 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |
| Permafrost Maul +5 | 154 | 154 | 128 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |
| Pilgrim's Quarterstaff +5 | 156 | 155 | 118 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |
| Plague Fang +5 | 187 | 186 | 140 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |
| Rimebrand +5 | 191 | 192 | 145 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |
| Solar Falchion +5 | 182 | 164 | 121 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |
| Venomthorn Rapier +5 | 211 | 208 | 160 | neutral T3 dummy: 20 mob average, biome tier 2; high-plating T3 dummy: Magma Tortoise; high-HP elite T3 dummy: Cavern Troll |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Cinderlash | 270 | 6 |
| Squire | Cinderlash | 211 | 6 |
| Apprentice | Avalanche Maul | 194 | 6 |
| Spirit | Cinderlash | 279 | 6 |
| Slinger | Rimebrand | 236 | 6 |
| Conduit | Venomthorn Rapier | 208 | 6 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Permafrost Maul | 155 | 6 |
| Squire | Pilgrim's Quarterstaff | 149 | 6 |
| Apprentice | Pilgrim's Quarterstaff | 146 | 6 |
| Spirit | Permafrost Maul | 159 | 6 |
| Slinger | Pilgrim's Quarterstaff | 147 | 6 |
| Conduit | Permafrost Maul | 120 | 6 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `2 heavy close summons at 0.49 APS; formation budget normalized`, `2 heavy close summons at 0.54 APS; formation budget normalized`, `2 heavy close summons at 0.59 APS; formation budget normalized`, `2 heavy close summons at 0.78 APS; formation budget normalized`, `2 heavy close summons at 0.98 APS; formation budget normalized`, `2 heavy close summons at 1.18 APS; formation budget normalized`, `2 heavy close summons at 1.62 APS; formation budget normalized`, `2 heavy far summons at 0.49 APS; formation budget normalized`, `2 heavy far summons at 0.54 APS; formation budget normalized`, `2 heavy far summons at 0.59 APS; formation budget normalized`, `2 heavy far summons at 0.78 APS; formation budget normalized`, `2 heavy far summons at 0.98 APS; formation budget normalized`, `2 heavy far summons at 1.18 APS; formation budget normalized`, `2 heavy far summons at 1.62 APS; formation budget normalized`, `5 balanced close summons at 0.52 APS; formation budget normalized`, `5 balanced close summons at 0.57 APS; formation budget normalized`, `5 balanced close summons at 0.62 APS; formation budget normalized`, `5 balanced close summons at 0.83 APS; formation budget normalized`, `5 balanced close summons at 1.04 APS; formation budget normalized`, `5 balanced close summons at 1.25 APS; formation budget normalized`, `5 balanced close summons at 1.72 APS; formation budget normalized`, `5 balanced far summons at 0.52 APS; formation budget normalized`, `5 balanced far summons at 0.57 APS; formation budget normalized`, `5 balanced far summons at 0.62 APS; formation budget normalized`, `5 balanced far summons at 0.83 APS; formation budget normalized`, `5 balanced far summons at 1.04 APS; formation budget normalized`, `5 balanced far summons at 1.25 APS; formation budget normalized`, `5 balanced far summons at 1.72 APS; formation budget normalized`, `6 light close summons at 0.55 APS; formation budget normalized`, `6 light close summons at 0.60 APS; formation budget normalized`, `6 light close summons at 0.66 APS; formation budget normalized`, `6 light close summons at 0.88 APS; formation budget normalized`, `6 light close summons at 1.10 APS; formation budget normalized`, `6 light close summons at 1.32 APS; formation budget normalized`, `6 light close summons at 1.81 APS; formation budget normalized`, `6 light far summons at 0.55 APS; formation budget normalized`, `6 light far summons at 0.60 APS; formation budget normalized`, `6 light far summons at 0.66 APS; formation budget normalized`, `6 light far summons at 0.88 APS; formation budget normalized`, `6 light far summons at 1.10 APS; formation budget normalized`, `6 light far summons at 1.32 APS; formation budget normalized`, `6 light far summons at 1.81 APS; formation budget normalized`, `Sunlight +20% over 5.0s (~3.0 of 4.6 hits)`, `Sunlight +20% over 5.0s (~3.1 of 4.5 hits)`, `Sunlight +20% over 5.0s (~3.6 of 4.6 hits)`, `Sunlight +20% over 5.0s (~3.7 of 4.6 hits)`, `Sunlight +20% over 5.0s (~3.8 of 16.6 hits)`, `Sunlight +20% over 5.0s (~3.9 of 16.2 hits)`, `Sunlight +20% over 5.0s (~3.9 of 5.1 hits)`, `Sunlight +20% over 5.0s (~3.9 of 729.5 hits)`, `Sunlight +20% over 5.0s (~4.0 of 4.6 hits)`, `Sunlight +20% over 5.0s (~4.1 of 4.6 hits)`, `Sunlight +20% over 5.0s (~4.1 of 5.1 hits)`, `Sunlight +20% over 5.0s (~4.2 of 4.6 hits)`, `Sunlight +20% over 5.0s (~4.2 of 729.5 hits)`, `Sunlight +20% over 5.0s (~4.3 of 10.0 hits)`, `Sunlight +20% over 5.0s (~4.3 of 4.6 hits)`, `Sunlight +20% over 5.0s (~4.4 of 729.5 hits)`, `Sunlight +20% over 5.0s (~4.4 of 9.9 hits)`, `Sunlight +20% over 5.0s (~4.5 of 5.0 hits)`, `Sunlight +20% over 5.0s (~4.6 of 4.9 hits)`, `Sunlight +20% over 5.0s (~4.6 of 5.0 hits)`, `Sunlight +20% over 5.0s (~4.6 of 7.2 hits)`, `Sunlight +20% over 5.0s (~4.7 of 4.9 hits)`, `Sunlight +20% over 5.0s (~4.7 of 5.0 hits)`, `Sunlight +20% over 5.0s (~4.7 of 7.2 hits)`, `Sunlight +20% over 5.0s (~4.8 of 5.1 hits)`, `Sunlight +20% over 5.0s (~4.9 of 4.9 hits)`, `Sunlight +20% over 5.0s (~5.0 of 5.0 hits)`, `Sunlight +20% over 5.0s (~6.6 of 7.1 hits)`, `Sunlight +20% over 5.0s (~6.8 of 6.9 hits)`, `Sunlight +20% over 5.0s (~6.8 of 7.1 hits)`, `Sunlight +20% over 5.0s (~6.9 of 6.9 hits)`, `dead swing every 5 hits`, `first strike amortized over tier dummy HP`, `shared.damage-mult +10% applied to attack-derived direct + class damage; flat on-hit excluded`, `swamp-blightbrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded`, `tundra-rimebrand-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded`.
