# MMO Idle LLM Balance Packet - T3 (No Conduit)

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
| Reference optimal-build average DPS | 225 |
| Target TTK at reference DPS | 1.04s |
| Expected DPS band | 151 - 338 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Ember Scuttler | 280 | 2.00 | 0.00% | HP 280, plating 2.00, DR 0.00%, ramp |
| Low plating/DR | Avalanche Ram | 520 | 0.00 | 0.00% | HP 520, plating 0.00, DR 0.00% |
| High plating | Magma Brute | 700 | 6.00 | 0.00% | HP 700, plating 6.00, DR 0.00%, ramp |
| High DR/special | Bog Lurker | 620 | 0.00 | 14.0% | HP 620, plating 0.00, DR 14.0%, evasion 25.0% |
| Heaviest | Cavern Troll | 1400 | 4.00 | 15.0% | HP 1400, plating 4.00, DR 15.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage / Harbinger | Permafrost Maul +3 | 248 | 0.00 | 0.52 | 1905 | 172 | 159 | 6.00 | 4.00% | dot.conversion-pct=0.50, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Hexblade | Permafrost Maul +3 | 252 | 0.00 | 0.58 | 1739 | 12.0 | 176 | 15.0 | 10.0% | dot.conversion-pct=0.50, dot.max-stacks=6.00, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Harbinger | Permafrost Maul +3 | 249 | 0.00 | 0.42 | 2353 | 172 | 175 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Hexblade | Permafrost Maul +3 | 253 | 0.00 | 0.48 | 2105 | 12.0 | 192 | 18.0 | 16.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Venom vessel / Harbinger | Permafrost Maul +3 | 247 | 0.00 | 0.63 | 1600 | 172 | 149 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.max-stacks=8.00 | DoT cap 8 stacks, tick 1000ms | dot steady-state hit estimate |
| Apprentice / Venom vessel / Hexblade | Permafrost Maul +3 | 251 | 0.00 | 0.68 | 1481 | 12.0 | 166 | 12.0 | 10.0% | dot.conversion-pct=0.30, dot.max-stacks=8.00, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 1000ms | dot steady-state hit estimate |
| Slinger / Artillerist / Breacher | Venomthorn Rapier +3 | 60.0 | 30.0 | 2.61 | 233 | 12.0 | 169 | 13.0 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | 20 shots, 3000ms reload, 2.61 effective shots/s | reload steady-state hit estimate |
| Slinger / Artillerist / Deadeye | Venomthorn Rapier +3 | 57.0 | 30.0 | 2.48 | 253 | 212 | 152 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 2.48 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman / Breacher | Venomthorn Rapier +3 | 59.0 | 30.0 | 2.35 | 225 | 12.0 | 163 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 2.35 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman / Deadeye | Rimebrand +3 | 107 | 0.00 | 1.36 | 533 | 212 | 146 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 1.36 effective shots/s | swamp-rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Scout / Breacher | Rimebrand +3 | 108 | 0.00 | 1.48 | 436 | 12.0 | 153 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200, shared.damage-mult=0.10 | 5 shots, 1200ms reload, 1.48 effective shots/s | swamp-rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Scout / Deadeye | Rimebrand +3 | 105 | 0.00 | 1.42 | 466 | 212 | 136 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 1.42 effective shots/s | swamp-rimebrand-burn reservoir DoT from weapon profile |
| Spirit / Phantasm / Haunt | Cataclysm Axe +3 | 166 | 0.00 | 1.26 | 793 | 12.0 | 153 | 10.0 | 8.00% | energy.empowered-mult=6.00, energy.per-hit=10.0, shared.damage-mult=0.10 | discharge every 11 hits (0.11/s) | dead swing every 5 hits |
| Spirit / Phantasm / Wisp | Cataclysm Axe +3 | 162 | 0.00 | 1.14 | 877 | 222 | 136 | 4.00 | 2.00% | energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.10/s) | dead swing every 5 hits |
| Spirit / Spark / Haunt | Cinderlash +3 | 90.0 | 0.00 | 2.85 | 404 | 12.0 | 141 | 8.00 | 6.00% | energy.empowered-mult=1.50, energy.per-hit=20.0, shared.damage-mult=0.10 | discharge every 6 hits (0.47/s) | energy steady-state hit estimate |
| Spirit / Spark / Wisp | Cinderlash +3 | 86.0 | 0.00 | 2.65 | 433 | 222 | 124 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0 | discharge every 6 hits (0.44/s) | energy steady-state hit estimate |
| Spirit / Wraith / Haunt | Cinderlash +3 | 90.0 | 0.00 | 2.65 | 433 | 12.0 | 140 | 9.00 | 6.00% | energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.29/s) | energy steady-state hit estimate |
| Spirit / Wraith / Wisp | Cinderlash +3 | 86.0 | 0.00 | 2.47 | 466 | 222 | 123 | 3.00 | 0.00% | energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.27/s) | energy steady-state hit estimate |
| Squire / Bulwark / Sentinel | Avalanche Maul +3 | 251 | 0.00 | 0.44 | 2273 | 132 | 190 | 10.0 | 11.0% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50 | empowered every 8.00s (0.13/s) | cooldown steady-state hit estimate |
| Squire / Bulwark / Vanguard | Avalanche Maul +3 | 255 | 0.00 | 0.50 | 2020 | 12.0 | 207 | 20.0 | 17.0% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50, shared.damage-mult=0.10 | empowered every 8.00s (0.13/s) | cooldown steady-state hit estimate |
| Squire / Knight / Sentinel | Avalanche Maul +3 | 245 | 0.00 | 0.58 | 1731 | 132 | 178 | 8.00 | 11.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Knight / Vanguard | Avalanche Maul +3 | 249 | 0.00 | 0.63 | 1581 | 12.0 | 195 | 18.0 | 17.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Sentinel | Cinderlash +3 | 93.0 | 0.00 | 2.41 | 477 | 132 | 164 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Vanguard | Cinderlash +3 | 97.0 | 0.00 | 2.60 | 442 | 12.0 | 181 | 15.0 | 14.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Striker / Breaker / In-Fighter | Cataclysm Axe +3 | 171 | 0.00 | 1.08 | 926 | 12.0 | 179 | 16.0 | 12.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, shared.damage-mult=0.10 | finisher every 6 hits (0.18/s) | dead swing every 5 hits |
| Striker / Breaker / Phantom-Blade | Cataclysm Axe +3 | 167 | 0.00 | 0.96 | 1041 | 132 | 162 | 8.00 | 6.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.16/s) | dead swing every 5 hits |
| Striker / Flurry / In-Fighter | Cinderlash +3 | 93.0 | 0.00 | 2.67 | 430 | 12.0 | 157 | 12.0 | 10.0% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, shared.damage-mult=0.10 | finisher every 4 hits (0.67/s) | cadence steady-state hit estimate |
| Striker / Flurry / Phantom-Blade | Cinderlash +3 | 89.0 | 0.00 | 2.48 | 463 | 132 | 140 | 4.00 | 4.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.62/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / In-Fighter | Cinderlash +3 | 94.0 | 0.00 | 2.18 | 527 | 12.0 | 171 | 13.0 | 10.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, shared.damage-mult=0.10 | finisher every 5 hits (0.44/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / Phantom-Blade | Cinderlash +3 | 90.0 | 0.00 | 1.99 | 577 | 132 | 154 | 5.00 | 4.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.40/s) | cadence steady-state hit estimate |


## 4. Weapon Input Table (+0 and +3)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Avalanche Maul | +0 | attack=120 | weapon.empowered-mult-bonus=0.50 | 0.55 APS base | explicit steps 0/3 |
| Avalanche Maul | +3 | attack=204 | weapon.empowered-mult-bonus=0.50 | 0.55 APS base | explicit steps 3/3 |
| Cataclysm Axe | +0 | attack=82.0 | weapon.dead-swing-interval=5.00 | 1.20 APS base | explicit steps 0/3 |
| Cataclysm Axe | +3 | attack=130 | weapon.dead-swing-interval=5.00 | 1.20 APS base | explicit steps 3/3 |
| Cinderlash | +0 | attack=34.0 | weapon.flurry-pct=0.03, weapon.flurry-stacks=5.00 | 1.65 APS base | explicit steps 0/3 |
| Cinderlash | +3 | attack=52.0 | weapon.flurry-pct=0.03, weapon.flurry-stacks=5.00 | 1.65 APS base | explicit steps 3/3 |
| Flamebrand | +0 | attack=46.0 | weapon.dot-conversion-pct=0.50, weapon.dot-stacks=5.00 | 1.00 APS base; swamp-blightbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/3 |
| Flamebrand | +3 | attack=88.0 | weapon.dot-conversion-pct=0.50, weapon.dot-stacks=5.00 | 1.00 APS base; swamp-blightbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 3/3 |
| Permafrost Maul | +0 | attack=120 | weapon.brittle-dr=0.01, weapon.brittle-plating=2.00, weapon.brittle-stacks=8.00 | 0.50 APS base | explicit steps 0/3 |
| Permafrost Maul | +3 | attack=210 | weapon.brittle-dr=0.01, weapon.brittle-plating=2.00, weapon.brittle-stacks=8.00 | 0.50 APS base | explicit steps 3/3 |
| Rimebrand | +0 | attack=58.0 | weapon.dot-conversion-pct=0.70, weapon.dot-stacks=3.00 | 0.75 APS base; swamp-rimebrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 0/3 |
| Rimebrand | +3 | attack=112 | weapon.dot-conversion-pct=0.70, weapon.dot-stacks=3.00 | 0.75 APS base; swamp-rimebrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 3/3 |
| Solar Cross | +0 | attack=42.0 | weapon.first-strike-mult=2.50 | 0.80 APS base | explicit steps 0/3 |
| Solar Cross | +3 | attack=78.0 | weapon.first-strike-mult=2.50 | 0.80 APS base | explicit steps 3/3 |
| Venomthorn Rapier | +0 | attack=22.0, onHitDamage=18.0 | - | 1.65 APS base | explicit steps 0/3 |
| Venomthorn Rapier | +3 | attack=34.0, onHitDamage=30.0 | - | 1.65 APS base | explicit steps 3/3 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Striker / Flurry / In-Fighter | Cinderlash +3 | 267 | 238 | 29.4 | 0.00 | 0.00 | - |
| Spirit / Spark / Haunt | Cinderlash +3 | 265 | 245 | 20.4 | 0.00 | 0.00 | - |
| Spirit / Wraith / Haunt | Cinderlash +3 | 253 | 228 | 25.3 | 0.00 | 0.00 | - |
| Spirit / Phantasm / Haunt | Cataclysm Axe +3 | 251 | 160 | 91.0 | 0.00 | 0.00 | - |
| Squire / Warrior / Vanguard | Cinderlash +3 | 251 | 242 | 9.20 | 0.00 | 0.00 | - |
| Squire / Bulwark / Vanguard | Avalanche Maul +3 | 250 | 121 | 130 | 0.00 | 0.00 | - |
| Apprentice / Rime-Bound / Hexblade | Permafrost Maul +3 | 240 | 36.1 | 0.00 | 204 | 0.00 | - |
| Striker / Flurry / Phantom-Blade | Cinderlash +3 | 237 | 211 | 26.1 | 0.00 | 0.00 | - |
| Striker / Skirmisher / In-Fighter | Cinderlash +3 | 236 | 197 | 39.3 | 0.00 | 0.00 | - |
| Spirit / Spark / Wisp | Cinderlash +3 | 236 | 218 | 18.1 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Marksman / Deadeye | Rimebrand +3 | 188 | 41.7 | 0.00 | 0.00 | 146 | - |
| Slinger / Scout / Deadeye | Rimebrand +3 | 191 | 42.5 | 0.00 | 0.00 | 149 | - |
| Striker / Breaker / Phantom-Blade | Cataclysm Axe +3 | 200 | 123 | 76.7 | 0.00 | 0.00 | - |
| Squire / Knight / Sentinel | Avalanche Maul +3 | 202 | 135 | 67.0 | 0.00 | 0.00 | - |
| Slinger / Marksman / Breacher | Venomthorn Rapier +3 | 202 | 202 | 0.00 | 0.00 | 0.00 | - |
| Apprentice / Venom vessel / Harbinger | Permafrost Maul +3 | 204 | 108 | 0.00 | 96.0 | 0.00 | - |
| Striker / Skirmisher / Phantom-Blade | Cinderlash +3 | 206 | 171 | 34.3 | 0.00 | 0.00 | - |
| Slinger / Scout / Breacher | Rimebrand +3 | 206 | 45.7 | 0.00 | 0.00 | 160 | - |
| Slinger / Artillerist / Deadeye | Venomthorn Rapier +3 | 208 | 208 | 0.00 | 0.00 | 0.00 | - |
| Apprentice / Ember mage / Harbinger | Permafrost Maul +3 | 213 | 65.1 | 0.00 | 148 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 219 | 48 |
| Striker | 206 | 48 |
| Squire | 205 | 48 |
| Slinger | 187 | 48 |
| Apprentice | 175 | 48 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Avalanche Maul | 210 | 30 |
| Cataclysm Axe | 208 | 30 |
| Rimebrand | 199 | 30 |
| Flamebrand | 198 | 30 |
| Cinderlash | 198 | 30 |
| Venomthorn Rapier | 197 | 30 |
| Permafrost Maul | 189 | 30 |
| Solar Cross | 187 | 30 |


Weapon DPS against target shapes:

| Weapon | neutral T3 dummy | high-plating T3 dummy | high-HP elite T3 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Avalanche Maul +3 | 210 | 215 | 188 | neutral T3 dummy: 21 mob average, biome tier 2; high-plating T3 dummy: Magma Brute; high-HP elite T3 dummy: Cavern Troll |
| Cataclysm Axe +3 | 208 | 211 | 184 | neutral T3 dummy: 21 mob average, biome tier 2; high-plating T3 dummy: Magma Brute; high-HP elite T3 dummy: Cavern Troll |
| Cinderlash +3 | 198 | 196 | 172 | neutral T3 dummy: 21 mob average, biome tier 2; high-plating T3 dummy: Magma Brute; high-HP elite T3 dummy: Cavern Troll |
| Flamebrand +3 | 198 | 200 | 174 | neutral T3 dummy: 21 mob average, biome tier 2; high-plating T3 dummy: Magma Brute; high-HP elite T3 dummy: Cavern Troll |
| Permafrost Maul +3 | 189 | 189 | 178 | neutral T3 dummy: 21 mob average, biome tier 2; high-plating T3 dummy: Magma Brute; high-HP elite T3 dummy: Cavern Troll |
| Rimebrand +3 | 199 | 201 | 176 | neutral T3 dummy: 21 mob average, biome tier 2; high-plating T3 dummy: Magma Brute; high-HP elite T3 dummy: Cavern Troll |
| Solar Cross +3 | 187 | 146 | 118 | neutral T3 dummy: 21 mob average, biome tier 2; high-plating T3 dummy: Magma Brute; high-HP elite T3 dummy: Cavern Troll |
| Venomthorn Rapier +3 | 197 | 194 | 177 | neutral T3 dummy: 21 mob average, biome tier 2; high-plating T3 dummy: Magma Brute; high-HP elite T3 dummy: Cavern Troll |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Cinderlash | 228 | 6 |
| Squire | Avalanche Maul | 228 | 6 |
| Apprentice | Permafrost Maul | 222 | 6 |
| Spirit | Cinderlash | 239 | 6 |
| Slinger | Rimebrand | 200 | 6 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Permafrost Maul | 172 | 6 |
| Squire | Permafrost Maul | 186 | 6 |
| Apprentice | Venomthorn Rapier | 140 | 6 |
| Spirit | Permafrost Maul | 185 | 6 |
| Slinger | Cinderlash | 165 | 6 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `dead swing every 5 hits`, `first strike amortized over tier dummy HP`, `swamp-blightbrand-burn reservoir DoT from weapon profile`, `swamp-rimebrand-burn reservoir DoT from weapon profile`.
