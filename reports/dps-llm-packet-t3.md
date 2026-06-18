# MMO Idle LLM Balance Packet - T3

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

- Report tier T3; class unlock tier 2; weapons are tier 3.
- DPS conclusions use +3 weapons only. Weapon input context includes +0 and +3.
- Target mobs come from biome spawn pools one tier below report tier; tutorial/test/interact/boss monsters are excluded.
- When the shifted target tier contains only tutorial/test content, the packet falls back to the first real non-tutorial biome tier.
- Single-target theoretical steady-state only: no movement, enemy attacks, deaths, sustain, AoE value, pathing, aggro, party effects, or eHP.
- Outliers/top/bottom use each class combination's optimal +3 weapon. Class/weapon averages use all +3 weapon samples.

## 2. Target Monster Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 2 |
| Mob count | 21 |
| Average mob HP | 235 |
| Average plating | 0.33 |
| Average DR | 4.29% |
| Reference optimal-build average DPS | 280 |
| Target TTK at reference DPS | 0.84s |
| Expected DPS band | 188 - 420 |

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
| Apprentice / Ember mage / Harbinger | Cataclysm Axe +3 | 190 | 0.00 | 1.26 | 793 | 192 | 159 | 6.00 | 4.00% | dot.conversion-pct=0.50, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | dead swing every 5 hits |
| Apprentice / Ember mage / Hexblade | Cataclysm Axe +3 | 194 | 0.00 | 1.38 | 724 | 32.0 | 176 | 15.0 | 10.0% | dot.conversion-pct=0.50, dot.max-stacks=6.00, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | dead swing every 5 hits |
| Apprentice / Rime-Bound / Harbinger | Cataclysm Axe +3 | 191 | 0.00 | 1.02 | 980 | 192 | 175 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00 | DoT cap 3 stacks, tick 2000ms | dead swing every 5 hits |
| Apprentice / Rime-Bound / Hexblade | Cataclysm Axe +3 | 195 | 0.00 | 1.14 | 877 | 32.0 | 192 | 18.0 | 16.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | dead swing every 5 hits |
| Apprentice / Venom vessel / Harbinger | Cataclysm Axe +3 | 187 | 0.00 | 1.50 | 666 | 192 | 149 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.max-stacks=8.00 | DoT cap 8 stacks, tick 1000ms | dead swing every 5 hits |
| Apprentice / Venom vessel / Hexblade | Cataclysm Axe +3 | 191 | 0.00 | 1.62 | 617 | 32.0 | 166 | 12.0 | 10.0% | dot.conversion-pct=0.30, dot.max-stacks=8.00, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 1000ms | dead swing every 5 hits |
| Conduit / Heavy Frame / Close Range | Permafrost Maul +3 | 182 | 0.00 | 0.48 | 2070 | 122 | 170 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-mult=1.50, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000, +2 more | 1 minions at 1.00 APS each | 1 minions at 1.00 APS each |
| Conduit / Heavy Frame / Far Range | Permafrost Maul +3 | 178 | 0.00 | 0.44 | 2268 | 282 | 153 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-mult=1.50, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000, summoner.minion-size-mult=2.00, +1 more | 1 minions at 1.00 APS each | 1 minions at 1.00 APS each |
| Conduit / Light Frame / Close Range | Permafrost Maul +3 | 182 | 0.00 | 0.48 | 2070 | 122 | 145 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=2.00, summoner.minion-damage-mult=0.50, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000, summoner.minion-size-mult=0.50 | 6 minions at 1.00 APS each | 6 minions at 1.00 APS each |
| Conduit / Light Frame / Far Range | Permafrost Maul +3 | 178 | 0.00 | 0.44 | 2268 | 282 | 128 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=2.00, summoner.minion-damage-mult=0.50, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000, summoner.minion-size-mult=0.50 | 6 minions at 1.00 APS each | 6 minions at 1.00 APS each |
| Conduit / Medium Frame / Close Range | Permafrost Maul +3 | 182 | 0.00 | 0.48 | 2070 | 122 | 157 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000 | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each |
| Conduit / Medium Frame / Far Range | Permafrost Maul +3 | 178 | 0.00 | 0.44 | 2268 | 282 | 140 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000 | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each |
| Slinger / Artillerist / Breacher | Venomthorn Rapier +3 | 55.0 | 30.0 | 2.61 | 233 | 92.0 | 169 | 13.0 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | 20 shots, 3000ms reload, 2.61 effective shots/s | reload steady-state hit estimate |
| Slinger / Artillerist / Deadeye | Venomthorn Rapier +3 | 53.0 | 30.0 | 2.48 | 253 | 252 | 152 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 2.48 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman / Breacher | Venomthorn Rapier +3 | 53.0 | 30.0 | 2.35 | 225 | 92.0 | 163 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 2.35 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman / Deadeye | Venomthorn Rapier +3 | 50.0 | 30.0 | 2.26 | 243 | 252 | 146 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 2.26 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout / Breacher | Venomthorn Rapier +3 | 51.0 | 30.0 | 2.27 | 200 | 92.0 | 153 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200, shared.damage-mult=0.10 | 5 shots, 1200ms reload, 2.27 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout / Deadeye | Venomthorn Rapier +3 | 49.0 | 30.0 | 2.21 | 212 | 252 | 136 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 2.21 effective shots/s | reload steady-state hit estimate |
| Spirit / Phantasm / Haunt | Cataclysm Axe +3 | 188 | 0.00 | 1.38 | 724 | 102 | 153 | 10.0 | 8.00% | energy.empowered-mult=6.00, energy.per-hit=10.0, shared.damage-mult=0.10 | discharge every 11 hits (0.13/s) | dead swing every 5 hits |
| Spirit / Phantasm / Wisp | Cataclysm Axe +3 | 184 | 0.00 | 1.26 | 793 | 262 | 136 | 4.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.11/s) | dead swing every 5 hits |
| Spirit / Spark / Haunt | Cinderlash +3 | 90.0 | 0.00 | 3.42 | 379 | 102 | 141 | 8.00 | 6.00% | energy.empowered-mult=1.50, energy.per-hit=20.0, shared.damage-mult=0.10 | discharge every 6 hits (0.57/s) | energy steady-state hit estimate |
| Spirit / Spark / Wisp | Cinderlash +3 | 86.0 | 0.00 | 3.22 | 404 | 262 | 124 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.54/s) | energy steady-state hit estimate |
| Spirit / Wraith / Haunt | Cinderlash +3 | 90.0 | 0.00 | 3.22 | 404 | 102 | 140 | 9.00 | 6.00% | energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.36/s) | energy steady-state hit estimate |
| Spirit / Wraith / Wisp | Cinderlash +3 | 86.0 | 0.00 | 3.00 | 433 | 262 | 123 | 3.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.33/s) | energy steady-state hit estimate |
| Squire / Bulwark / Sentinel | Cataclysm Axe +3 | 198 | 0.00 | 0.96 | 1041 | 132 | 190 | 10.0 | 11.0% | cooldown.empowered-cd-ms=9000, cooldown.empowered-mult=3.00 | empowered every 9.00s (0.11/s) | dead swing every 5 hits |
| Squire / Bulwark / Vanguard | Cataclysm Axe +3 | 202 | 0.00 | 1.08 | 926 | 12.0 | 207 | 20.0 | 17.0% | cooldown.empowered-cd-ms=9000, cooldown.empowered-mult=3.00, shared.damage-mult=0.10 | empowered every 9.00s (0.11/s) | dead swing every 5 hits |
| Squire / Knight / Sentinel | Cinderlash +3 | 93.0 | 0.00 | 2.25 | 577 | 132 | 178 | 8.00 | 11.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Knight / Vanguard | Cinderlash +3 | 97.0 | 0.00 | 2.47 | 527 | 12.0 | 195 | 18.0 | 17.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Sentinel | Cinderlash +3 | 95.0 | 0.00 | 2.79 | 466 | 132 | 164 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Vanguard | Cinderlash +3 | 99.0 | 0.00 | 3.00 | 433 | 12.0 | 181 | 15.0 | 14.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Striker / Breaker / In-Fighter | Cataclysm Axe +3 | 193 | 0.00 | 1.08 | 926 | 12.0 | 179 | 16.0 | 12.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, shared.damage-mult=0.10 | finisher every 6 hits (0.18/s) | dead swing every 5 hits |
| Striker / Breaker / Phantom-Blade | Cataclysm Axe +3 | 189 | 0.00 | 0.96 | 1041 | 132 | 162 | 8.00 | 6.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.16/s) | dead swing every 5 hits |
| Striker / Flurry / In-Fighter | Cinderlash +3 | 93.0 | 0.00 | 3.07 | 424 | 12.0 | 157 | 12.0 | 10.0% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, shared.damage-mult=0.10 | finisher every 4 hits (0.77/s) | cadence steady-state hit estimate |
| Striker / Flurry / Phantom-Blade | Cinderlash +3 | 89.0 | 0.00 | 2.85 | 456 | 132 | 140 | 4.00 | 4.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.71/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / In-Fighter | Cinderlash +3 | 94.0 | 0.00 | 2.47 | 527 | 12.0 | 171 | 13.0 | 10.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, shared.damage-mult=0.10 | finisher every 5 hits (0.49/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / Phantom-Blade | Cinderlash +3 | 90.0 | 0.00 | 2.25 | 577 | 132 | 154 | 5.00 | 4.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.45/s) | cadence steady-state hit estimate |


## 4. Weapon Input Table (+0 and +3)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Avalanche Maul | +0 | attack=74.0 | - | 0.40 APS base | explicit steps 0/3 |
| Avalanche Maul | +3 | attack=146 | - | 0.40 APS base | explicit steps 3/3 |
| Blightbrand | +0 | attack=34.0 | weapon.dot-conversion-pct=0.30, weapon.dot-stacks=5.00 | 0.80 APS base; swamp-blightbrand-burn DoT reservoir 30.0% conversion x1.15 | explicit steps 0/3 |
| Blightbrand | +3 | attack=58.0 | weapon.dot-conversion-pct=0.30, weapon.dot-stacks=5.00 | 0.80 APS base; swamp-blightbrand-burn DoT reservoir 30.0% conversion x1.15 | explicit steps 3/3 |
| Cataclysm Axe | +0 | attack=92.0 | weapon.dead-swing-interval=5.00 | 1.20 APS base | explicit steps 0/3 |
| Cataclysm Axe | +3 | attack=152 | weapon.dead-swing-interval=5.00 | 1.20 APS base | explicit steps 3/3 |
| Cinderlash | +0 | attack=34.0 | weapon.flurry-pct=0.06, weapon.flurry-stacks=5.00 | 1.65 APS base | explicit steps 0/3 |
| Cinderlash | +3 | attack=52.0 | weapon.flurry-pct=0.06, weapon.flurry-stacks=5.00 | 1.65 APS base | explicit steps 3/3 |
| Permafrost Maul | +0 | attack=76.0 | weapon.brittle-dr=0.01, weapon.brittle-plating=2.00, weapon.brittle-stacks=8.00 | 0.42 APS base | explicit steps 0/3 |
| Permafrost Maul | +3 | attack=151 | weapon.brittle-dr=0.01, weapon.brittle-plating=2.00, weapon.brittle-stacks=8.00 | 0.42 APS base | explicit steps 3/3 |
| Rimebrand | +0 | attack=48.0 | weapon.dot-conversion-pct=0.45, weapon.dot-stacks=3.00 | 0.55 APS base; swamp-rimebrand-burn DoT reservoir 45.0% conversion x1.15 | explicit steps 0/3 |
| Rimebrand | +3 | attack=84.0 | weapon.dot-conversion-pct=0.45, weapon.dot-stacks=3.00 | 0.55 APS base; swamp-rimebrand-burn DoT reservoir 45.0% conversion x1.15 | explicit steps 3/3 |
| Solar Cross | +0 | attack=34.0 | weapon.first-strike-mult=2.50 | 0.70 APS base | explicit steps 0/3 |
| Solar Cross | +3 | attack=58.0 | weapon.first-strike-mult=2.50 | 0.70 APS base | explicit steps 3/3 |
| Venomthorn Rapier | +0 | attack=24.0, onHitDamage=18.0 | - | 1.65 APS base | explicit steps 0/3 |
| Venomthorn Rapier | +3 | attack=42.0, onHitDamage=30.0 | - | 1.65 APS base | explicit steps 3/3 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Light Frame / Close Range | Permafrost Maul +3 | 546 | 0.00 | 546 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Close Range | Permafrost Maul +3 | 546 | 0.00 | 546 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame / Far Range | Permafrost Maul +3 | 534 | 0.00 | 534 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Far Range | Permafrost Maul +3 | 534 | 0.00 | 534 | 0.00 | 0.00 | HIGH |
| Conduit / Heavy Frame / Close Range | Permafrost Maul +3 | 364 | 0.00 | 364 | 0.00 | 0.00 | - |
| Conduit / Heavy Frame / Far Range | Permafrost Maul +3 | 356 | 0.00 | 356 | 0.00 | 0.00 | - |
| Spirit / Spark / Haunt | Cinderlash +3 | 319 | 295 | 24.5 | 0.00 | 0.00 | - |
| Spirit / Phantasm / Haunt | Cataclysm Axe +3 | 312 | 199 | 113 | 0.00 | 0.00 | - |
| Spirit / Wraith / Haunt | Cinderlash +3 | 307 | 277 | 30.7 | 0.00 | 0.00 | - |
| Striker / Flurry / In-Fighter | Cinderlash +3 | 307 | 273 | 33.7 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Scout / Deadeye | Venomthorn Rapier +3 | 170 | 170 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Marksman / Deadeye | Venomthorn Rapier +3 | 176 | 176 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Breacher | Venomthorn Rapier +3 | 180 | 180 | 0.00 | 0.00 | 0.00 | LOW |
| Squire / Bulwark / Sentinel | Cataclysm Axe +3 | 187 | 145 | 42.1 | 0.00 | 0.00 | LOW |
| Slinger / Marksman / Breacher | Venomthorn Rapier +3 | 191 | 191 | 0.00 | 0.00 | 0.00 | - |
| Slinger / Artillerist / Deadeye | Venomthorn Rapier +3 | 201 | 201 | 0.00 | 0.00 | 0.00 | - |
| Apprentice / Ember mage / Harbinger | Cataclysm Axe +3 | 208 | 91.8 | 0.00 | 116 | 0.00 | - |
| Squire / Bulwark / Vanguard | Cataclysm Axe +3 | 210 | 167 | 43.0 | 0.00 | 0.00 | - |
| Squire / Knight / Sentinel | Cinderlash +3 | 213 | 200 | 12.7 | 0.00 | 0.00 | - |
| Slinger / Artillerist / Breacher | Venomthorn Rapier +3 | 214 | 214 | 0.00 | 0.00 | 0.00 | - |


All optimal-weapon outliers:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Light Frame / Close Range | Permafrost Maul +3 | 546 | 0.00 | 546 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Close Range | Permafrost Maul +3 | 546 | 0.00 | 546 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame / Far Range | Permafrost Maul +3 | 534 | 0.00 | 534 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Far Range | Permafrost Maul +3 | 534 | 0.00 | 534 | 0.00 | 0.00 | HIGH |
| Squire / Bulwark / Sentinel | Cataclysm Axe +3 | 187 | 145 | 42.1 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Breacher | Venomthorn Rapier +3 | 180 | 180 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Marksman / Deadeye | Venomthorn Rapier +3 | 176 | 176 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Deadeye | Venomthorn Rapier +3 | 170 | 170 | 0.00 | 0.00 | 0.00 | LOW |


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Conduit | 316 | 48 |
| Spirit | 184 | 48 |
| Striker | 161 | 48 |
| Squire | 157 | 48 |
| Apprentice | 149 | 48 |
| Slinger | 123 | 48 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Cataclysm Axe | 271 | 36 |
| Cinderlash | 215 | 36 |
| Venomthorn Rapier | 206 | 36 |
| Permafrost Maul | 185 | 36 |
| Avalanche Maul | 169 | 36 |
| Solar Cross | 143 | 36 |
| Rimebrand | 136 | 36 |
| Blightbrand | 127 | 36 |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Cinderlash | 259 | 6 |
| Squire | Cinderlash | 233 | 6 |
| Apprentice | Cataclysm Axe | 221 | 6 |
| Spirit | Cataclysm Axe | 292 | 6 |
| Slinger | Venomthorn Rapier | 189 | 6 |
| Conduit | Permafrost Maul | 480 | 6 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Rimebrand | 95.5 | 6 |
| Squire | Rimebrand | 100 | 6 |
| Apprentice | Blightbrand | 105 | 6 |
| Spirit | Rimebrand | 109 | 6 |
| Slinger | Rimebrand | 88.1 | 6 |
| Conduit | Venomthorn Rapier | 181 | 6 |


## 10. Outlier Detail

| Flag | Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Suspected source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HIGH | Conduit / Light Frame / Close Range | Permafrost Maul +3 | 546 | 0.00 | 546 | 0.00 | 0.00 | class mechanic share; 6 minions at 1.00 APS each |
| HIGH | Conduit / Medium Frame / Close Range | Permafrost Maul +3 | 546 | 0.00 | 546 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each |
| HIGH | Conduit / Light Frame / Far Range | Permafrost Maul +3 | 534 | 0.00 | 534 | 0.00 | 0.00 | class mechanic share; 6 minions at 1.00 APS each |
| HIGH | Conduit / Medium Frame / Far Range | Permafrost Maul +3 | 534 | 0.00 | 534 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each |
| LOW | Squire / Bulwark / Sentinel | Cataclysm Axe +3 | 187 | 145 | 42.1 | 0.00 | 0.00 | direct share; dead swing every 5 hits |
| LOW | Slinger / Scout / Breacher | Venomthorn Rapier +3 | 180 | 180 | 0.00 | 0.00 | 0.00 | direct share |
| LOW | Slinger / Marksman / Deadeye | Venomthorn Rapier +3 | 176 | 176 | 0.00 | 0.00 | 0.00 | direct share |
| LOW | Slinger / Scout / Deadeye | Venomthorn Rapier +3 | 170 | 170 | 0.00 | 0.00 | 0.00 | direct share |


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `1 minions at 1.00 APS each`, `3 minions at 1.00 APS each`, `6 minions at 1.00 APS each`, `dead swing every 5 hits`, `first strike amortized over tier dummy HP`, `swamp-blightbrand-burn reservoir DoT from weapon profile`, `swamp-rimebrand-burn reservoir DoT from weapon profile`.
