# MMO Idle LLM Balance Packet - T4

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

- Report tier T4; class unlock tier 3; weapons are tier 4.
- DPS conclusions use +3 weapons only. Weapon input context includes +0 and +3.
- Target mobs come from biome spawn pools one tier below report tier; tutorial/test/interact/boss monsters are excluded.
- When the shifted target tier contains only tutorial/test content, the packet falls back to the first real non-tutorial biome tier.
- Single-target theoretical steady-state only: no movement, enemy attacks, deaths, sustain, AoE value, pathing, aggro, party effects, or eHP.
- Outliers/top/bottom use each class combination's optimal +3 weapon. Class/weapon averages use all +3 weapon samples.

## 2. Target Monster Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 3 |
| Mob count | 22 |
| Average mob HP | 573 |
| Average plating | 0.91 |
| Average DR | 5.27% |
| Reference optimal-build average DPS | 584 |
| Target TTK at reference DPS | 0.98s |
| Expected DPS band | 391 - 876 |

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
| Apprentice / Ember mage / Harbinger / Cinder Lord | Glacial Tyrant Maul +3 | 323 | 0.00 | 0.44 | 2268 | 192 | 159 | 6.00 | 4.00% | dot.conflagration=1.00, dot.conversion-pct=0.50, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Harbinger / Firebrand | Eruption Lash +3 | 129 | 0.00 | 2.68 | 530 | 192 | 159 | 6.00 | 4.00% | dot.conversion-pct=0.50, dot.ignition=1.00, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | max-stack direct bypass treated as steady-state |
| Apprentice / Ember mage / Harbinger / Pyromancer | Glacial Tyrant Maul +3 | 323 | 0.00 | 0.44 | 2268 | 192 | 159 | 6.00 | 4.00% | dot.conversion-pct=0.50, dot.fan-the-flames=1.00, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Hexblade / Cinder Lord | Glacial Tyrant Maul +3 | 327 | 0.00 | 0.48 | 2070 | 32.0 | 176 | 15.0 | 10.0% | dot.conflagration=1.00, dot.conversion-pct=0.50, dot.max-stacks=6.00, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Hexblade / Firebrand | Eruption Lash +3 | 133 | 0.00 | 2.94 | 483 | 32.0 | 176 | 15.0 | 10.0% | dot.conversion-pct=0.50, dot.ignition=1.00, dot.max-stacks=6.00, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | max-stack direct bypass treated as steady-state |
| Apprentice / Ember mage / Hexblade / Pyromancer | Glacial Tyrant Maul +3 | 327 | 0.00 | 0.48 | 2070 | 32.0 | 176 | 15.0 | 10.0% | dot.conversion-pct=0.50, dot.fan-the-flames=1.00, dot.max-stacks=6.00, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Harbinger / Icebreaker | Glacial Tyrant Maul +3 | 324 | 0.00 | 0.36 | 2801 | 192 | 175 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00, dot.rimeshatter=1.00 | DoT cap 3 stacks, tick 2000ms | max-stack direct bypass treated as steady-state |
| Apprentice / Rime-Bound / Harbinger / Rime Blade | Glacial Tyrant Maul +3 | 324 | 0.00 | 0.36 | 2801 | 192 | 175 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00, dot.shatter-strike=1.00 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Harbinger / Winter Warden | Glacial Tyrant Maul +3 | 324 | 0.00 | 0.36 | 2801 | 192 | 175 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.freezing-cold=1.00, dot.max-stacks=3.00 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Hexblade / Icebreaker | Glacial Tyrant Maul +3 | 328 | 0.00 | 0.40 | 2506 | 32.0 | 192 | 18.0 | 16.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00, dot.rimeshatter=1.00, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | max-stack direct bypass treated as steady-state |
| Apprentice / Rime-Bound / Hexblade / Rime Blade | Glacial Tyrant Maul +3 | 328 | 0.00 | 0.40 | 2506 | 32.0 | 192 | 18.0 | 16.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00, dot.shatter-strike=1.00, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Hexblade / Winter Warden | Glacial Tyrant Maul +3 | 328 | 0.00 | 0.40 | 2506 | 32.0 | 192 | 18.0 | 16.0% | dot.conversion-pct=0.70, dot.freezing-cold=1.00, dot.max-stacks=3.00, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Venom vessel / Harbinger / Cultist | Eruption Lash +3 | 126 | 0.00 | 3.19 | 445 | 192 | 149 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.eternal-doom=1.00, dot.max-stacks=8.00, dot.tick-interval-ms=500 | DoT cap 8 stacks, tick 500ms | eternal doom capped to 40 steady stacks for report sanity |
| Apprentice / Venom vessel / Harbinger / Venomslinger | Eruption Lash +3 | 126 | 0.00 | 3.19 | 445 | 192 | 149 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.max-stacks=8.00, dot.poison-explosion=1.00 | DoT cap 8 stacks, tick 1000ms | poison explosion averaged every 10 stacks |
| Apprentice / Venom vessel / Harbinger / Zealot | Eruption Lash +3 | 126 | 0.00 | 3.19 | 445 | 192 | 149 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.frenzy=1.00, dot.max-stacks=8.00 | DoT cap 8 stacks, tick 1000ms | frenzy estimated at high uptime |
| Apprentice / Venom vessel / Hexblade / Cultist | Eruption Lash +3 | 130 | 0.00 | 3.45 | 412 | 32.0 | 166 | 12.0 | 10.0% | dot.conversion-pct=0.30, dot.eternal-doom=1.00, dot.max-stacks=8.00, dot.tick-interval-ms=500, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 500ms | eternal doom capped to 40 steady stacks for report sanity |
| Apprentice / Venom vessel / Hexblade / Venomslinger | Eruption Lash +3 | 130 | 0.00 | 3.45 | 412 | 32.0 | 166 | 12.0 | 10.0% | dot.conversion-pct=0.30, dot.max-stacks=8.00, dot.poison-explosion=1.00, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 1000ms | poison explosion averaged every 10 stacks |
| Apprentice / Venom vessel / Hexblade / Zealot | Eruption Lash +3 | 130 | 0.00 | 3.45 | 412 | 32.0 | 166 | 12.0 | 10.0% | dot.conversion-pct=0.30, dot.frenzy=1.00, dot.max-stacks=8.00, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 1000ms | frenzy estimated at high uptime |
| Conduit / Heavy Frame / Close Range / Mountain Guardian | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 170 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.guardian-dr-share-pct=0.20, summoner.guardian-plating-share-pct=0.20, summoner.leash-mult=2.00, summoner.minion-as-crag-behemoth=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-cap=1.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, +7 more | 1 minions at 1.00 APS each | 1 minions at 1.00 APS each |
| Conduit / Heavy Frame / Close Range / Rockslide Cover | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 170 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-as-cliff-hopper=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-mult=1.50, summoner.minion-hp-pct=0.45, summoner.minion-range=172, +5 more | 1 minions at 1.00 APS each | 1 minions at 1.00 APS each |
| Conduit / Heavy Frame / Close Range / Stone Sentinel | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 170 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-as-ridge-archer=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-mult=1.50, summoner.minion-hp-pct=0.45, summoner.minion-range=192, +9 more | 2 minions at 1.00 APS each | 2 minions at 1.00 APS each |
| Conduit / Heavy Frame / Far Range / Mountain Guardian | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 153 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.guardian-dr-share-pct=0.20, summoner.guardian-plating-share-pct=0.20, summoner.leash-mult=2.00, summoner.minion-as-crag-behemoth=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-cap=1.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-mult=1.50, +6 more | 1 minions at 1.00 APS each | 1 minions at 1.00 APS each |
| Conduit / Heavy Frame / Far Range / Rockslide Cover | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 153 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-as-cliff-hopper=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-mult=1.50, summoner.minion-hp-pct=0.45, summoner.minion-range=172, summoner.minion-respawn-ms=5000, +4 more | 1 minions at 1.00 APS each | 1 minions at 1.00 APS each |
| Conduit / Heavy Frame / Far Range / Stone Sentinel | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 153 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-as-ridge-archer=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=0.50, summoner.minion-damage-mult=2.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-mult=1.50, summoner.minion-hp-pct=0.45, summoner.minion-range=192, summoner.minion-respawn-ms=5000, +8 more | 2 minions at 1.00 APS each | 2 minions at 1.00 APS each |
| Conduit / Light Frame / Close Range / Acid Brood | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 145 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.acid-brood=1.00, summoner.acid-cap=10.0, summoner.acid-duration-ms=8000, summoner.acid-explosion-corrosion-stacks=2.00, summoner.acid-explosion-damage-pct=0.80, summoner.acid-explosion-radius=80.0, summoner.acid-lurker-lifetime-ms=12000, summoner.acid-plating-per-stack=2.00, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-as-cave-lurker=1.00, +9 more | 6 minions at 1.00 APS each | 6 minions at 1.00 APS each |
| Conduit / Light Frame / Close Range / Predator's Howl | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 145 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.howl-cap=6.00, summoner.howl-pct-per-stack=0.05, summoner.leash-mult=2.00, summoner.minion-as-cave-lurker=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=2.00, summoner.minion-damage-mult=0.50, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, +4 more | 6 minions at 1.00 APS each | 6 minions at 1.00 APS each |
| Conduit / Light Frame / Close Range / Swarm | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 145 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-as-cave-lurker=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=4.00, summoner.minion-damage-mult=0.50, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000, +5 more | 12 minions at 1.00 APS each | 12 minions at 1.00 APS each |
| Conduit / Light Frame / Far Range / Acid Brood | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 128 | 2.00 | 0.00% | summoner.acid-brood=1.00, summoner.acid-cap=10.0, summoner.acid-duration-ms=8000, summoner.acid-explosion-corrosion-stacks=2.00, summoner.acid-explosion-damage-pct=0.80, summoner.acid-explosion-radius=80.0, summoner.acid-lurker-lifetime-ms=12000, summoner.acid-plating-per-stack=2.00, summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-as-cave-lurker=1.00, summoner.minion-attack-cooldown=1000, +8 more | 6 minions at 1.00 APS each | 6 minions at 1.00 APS each |
| Conduit / Light Frame / Far Range / Predator's Howl | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 128 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.howl-cap=6.00, summoner.howl-pct-per-stack=0.05, summoner.leash-mult=2.00, summoner.minion-as-cave-lurker=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=2.00, summoner.minion-damage-mult=0.50, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=132, +3 more | 6 minions at 1.00 APS each | 6 minions at 1.00 APS each |
| Conduit / Light Frame / Far Range / Swarm | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 128 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-as-cave-lurker=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-count-mult=4.00, summoner.minion-damage-mult=0.50, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000, summoner.minion-size-mult=0.25, +4 more | 12 minions at 1.00 APS each | 12 minions at 1.00 APS each |
| Conduit / Medium Frame / Close Range / Grazing Field | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 157 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.grazing-field=1.00, summoner.grazing-interval-ms=2000, summoner.grazing-ooc-mult=2.00, summoner.grazing-pct=0.04, summoner.leash-mult=2.00, summoner.minion-as-plains-slime=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, +2 more | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each |
| Conduit / Medium Frame / Close Range / Trampled Path | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 157 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-as-boar=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=132, summoner.minion-respawn-ms=5000, summoner.trample-charge-cd-ms=10000, summoner.trample-charge-speed-mult=3.50, +3 more | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each |
| Conduit / Medium Frame / Close Range / Vital Burst | Glacial Tyrant Maul +3 | 316 | 0.00 | 0.48 | 2070 | 122 | 157 | 7.00 | 6.00% | shared.damage-mult=0.10, summoner.damage-sponge-pct=0.60, summoner.leash-mult=2.00, summoner.minion-as-plains-slime=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=212, summoner.minion-respawn-ms=5000, summoner.vital-burst=1.00, summoner.vital-burst-immunity-ms=3000 | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each |
| Conduit / Medium Frame / Far Range / Grazing Field | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 140 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.grazing-field=1.00, summoner.grazing-interval-ms=2000, summoner.grazing-ooc-mult=2.00, summoner.grazing-pct=0.04, summoner.leash-mult=2.00, summoner.minion-as-plains-slime=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=112, +1 more | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each |
| Conduit / Medium Frame / Far Range / Trampled Path | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 140 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-as-boar=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=132, summoner.minion-respawn-ms=5000, summoner.trample-charge-cd-ms=10000, summoner.trample-charge-speed-mult=3.50, summoner.trample-speed-pct=0.25, +2 more | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each |
| Conduit / Medium Frame / Far Range / Vital Burst | Glacial Tyrant Maul +3 | 312 | 0.00 | 0.44 | 2268 | 282 | 140 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-as-plains-slime=1.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=212, summoner.minion-respawn-ms=5000, summoner.vital-burst=1.00, summoner.vital-burst-immunity-ms=3000 | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each |
| Slinger / Artillerist / Breacher / Cannoneer | Deathfang Rapier +3 | 75.0 | 54.0 | 2.70 | 220 | 92.0 | 169 | 13.0 | 6.00% | reload.acquire-radius-mult=2.50, reload.cannon=1.00, reload.cannon-damage-per-shot=0.50, reload.max-ammo=20.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | 20 shots, 3000ms reload, 2.70 effective shots/s | cannon stored pool averaged per shot |
| Slinger / Artillerist / Breacher / Melter | Glacial Tyrant Maul +3 | 340 | 0.00 | 0.00 | 916 | 92.0 | 169 | 13.0 | 6.00% | reload.acquire-radius-mult=2.50, reload.laser=1.00, reload.laser-cool-per-tick=2.50, reload.laser-damage-per-tick-pct=0.18, reload.laser-heat-per-tick=2.00, reload.max-ammo=20.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | laser heat/cool duty cycle | laser heat/cool duty cycle estimated |
| Slinger / Artillerist / Breacher / Warmonger | Deathfang Rapier +3 | 75.0 | 54.0 | 3.39 | 220 | 92.0 | 169 | 13.0 | 6.00% | reload.acquire-radius-mult=2.50, reload.hair-trigger=1.00, reload.hair-trigger-max-stacks=15.0, reload.hair-trigger-pct-per-shot=0.05, reload.max-ammo=40.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | 40 shots, 3000ms reload, 3.39 effective shots/s | reload steady-state hit estimate |
| Slinger / Artillerist / Deadeye / Cannoneer | Deathfang Rapier +3 | 72.0 | 54.0 | 2.58 | 238 | 252 | 152 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.cannon=1.00, reload.cannon-damage-per-shot=0.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 2.58 effective shots/s | cannon stored pool averaged per shot |
| Slinger / Artillerist / Deadeye / Melter | Glacial Tyrant Maul +3 | 336 | 0.00 | 0.00 | 992 | 252 | 152 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.laser=1.00, reload.laser-cool-per-tick=2.50, reload.laser-damage-per-tick-pct=0.18, reload.laser-heat-per-tick=2.00, reload.max-ammo=20.0, reload.reload-time-ms=3000 | laser heat/cool duty cycle | laser heat/cool duty cycle estimated |
| Slinger / Artillerist / Deadeye / Warmonger | Deathfang Rapier +3 | 72.0 | 54.0 | 3.19 | 238 | 252 | 152 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.hair-trigger=1.00, reload.hair-trigger-max-stacks=15.0, reload.hair-trigger-pct-per-shot=0.05, reload.max-ammo=40.0, reload.reload-time-ms=3000 | 40 shots, 3000ms reload, 3.19 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman / Breacher / Blunderbuss | Glacial Tyrant Maul +3 | 191 | 0.00 | 3.47 | 882 | 12.0 | 163 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.blunderbuss=1.00, reload.blunderbuss-knockback-distance-per-pellet=7.00, reload.blunderbuss-knockback-ms-per-pellet=14.0, reload.blunderbuss-spread-rad=0.65, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 3.47 effective shots/s | blunderbuss modeled as full-magazine single-target volley |
| Slinger / Marksman / Breacher / Bounty hunter | Deathfang Rapier +3 | 72.0 | 54.0 | 2.43 | 212 | 92.0 | 163 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.death-mark=1.00, reload.death-mark-detonate-mult=0.65, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 2.43 effective shots/s | death mark detonation averaged per clip |
| Slinger / Marksman / Breacher / Desperado | Deathfang Rapier +3 | 72.0 | 54.0 | 3.21 | 212 | 92.0 | 163 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.momentum=1.00, reload.momentum-aps-per-stack=0.06, reload.momentum-max-stacks=5.00, reload.momentum-reload-reduction=0.10, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 3.21 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman / Deadeye / Blunderbuss | Glacial Tyrant Maul +3 | 189 | 0.00 | 3.39 | 953 | 152 | 146 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.blunderbuss=1.00, reload.blunderbuss-knockback-distance-per-pellet=7.00, reload.blunderbuss-knockback-ms-per-pellet=14.0, reload.blunderbuss-spread-rad=0.65, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 3.39 effective shots/s | blunderbuss modeled as full-magazine single-target volley |
| Slinger / Marksman / Deadeye / Bounty hunter | Deathfang Rapier +3 | 70.0 | 54.0 | 2.33 | 229 | 252 | 146 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.death-mark=1.00, reload.death-mark-detonate-mult=0.65, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 2.33 effective shots/s | death mark detonation averaged per clip |
| Slinger / Marksman / Deadeye / Desperado | Deathfang Rapier +3 | 70.0 | 54.0 | 3.04 | 229 | 252 | 146 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=10.0, reload.momentum=1.00, reload.momentum-aps-per-stack=0.06, reload.momentum-max-stacks=5.00, reload.momentum-reload-reduction=0.10, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 3.04 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout / Breacher / Dualslinger | Deathfang Rapier +3 | 71.0 | 64.0 | 2.27 | 200 | 92.0 | 153 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.alternating-cadence=1.00, reload.alternating-onhit-per-tier=10.0, reload.max-ammo=5.00, reload.reload-time-ms=1200, shared.damage-mult=0.10 | 5 shots, 1200ms reload, 2.27 effective shots/s | dual shots averaged 50/50 |
| Slinger / Scout / Breacher / Duelist | Deathfang Rapier +3 | 71.0 | 54.0 | 2.50 | 200 | 92.0 | 153 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.empowered-mult=3.50, reload.exploding-clip=1.00, reload.max-ammo=6.00, reload.reload-time-ms=1200, shared.damage-mult=0.10 | 6 shots, 1200ms reload, 2.50 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout / Breacher / Sniper | Glacial Tyrant Maul +3 | 423 | 0.00 | 0.42 | 2000 | 92.0 | 153 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=3.00, reload.reload-time-ms=1200, reload.snipe=1.00, reload.snipe-as-to-dmg=0.50, reload.snipe-cadence-ms=2000, reload.snipe-fullhp-mult=2.00, shared.damage-mult=0.10 | 3 shots, 1200ms reload, 0.42 effective shots/s | sniper full-HP bonus amortized once per report horizon |
| Slinger / Scout / Deadeye / Dualslinger | Deathfang Rapier +3 | 69.0 | 64.0 | 2.27 | 200 | 252 | 136 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.alternating-cadence=1.00, reload.alternating-onhit-per-tier=10.0, reload.max-ammo=5.00, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 2.27 effective shots/s | dual shots averaged 50/50 |
| Slinger / Scout / Deadeye / Duelist | Deathfang Rapier +3 | 69.0 | 54.0 | 2.50 | 200 | 252 | 136 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.empowered-mult=3.50, reload.exploding-clip=1.00, reload.max-ammo=6.00, reload.reload-time-ms=1200 | 6 shots, 1200ms reload, 2.50 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout / Deadeye / Sniper | Glacial Tyrant Maul +3 | 401 | 0.00 | 0.42 | 2000 | 252 | 136 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=3.00, reload.reload-time-ms=1200, reload.snipe=1.00, reload.snipe-as-to-dmg=0.50, reload.snipe-cadence-ms=2000, reload.snipe-fullhp-mult=2.00 | 3 shots, 1200ms reload, 0.42 effective shots/s | sniper full-HP bonus amortized once per report horizon |
| Spirit / Phantasm / Haunt / Invoker | Eruption Lash +3 | 127 | 0.00 | 2.94 | 483 | 102 | 153 | 10.0 | 8.00% | energy.critical-mass=1.00, energy.empowered-mult=6.00, energy.per-hit=10.0, shared.damage-mult=0.10 | discharge every 11 hits (0.27/s) | energy steady-state hit estimate |
| Spirit / Phantasm / Haunt / Tempest | Eruption Lash +3 | 127 | 0.00 | 2.94 | 483 | 102 | 153 | 10.0 | 8.00% | energy.empowered-mult=6.00, energy.endless-storm=1.00, energy.per-hit=10.0, shared.damage-mult=0.10 | discharge every 11 hits (0.27/s) | endless storm DoT budget included per discharge |
| Spirit / Phantasm / Haunt / Voidwalker | Eruption Lash +3 | 127 | 0.00 | 2.94 | 483 | 102 | 153 | 10.0 | 8.00% | energy.empowered-mult=6.00, energy.max-bonus=100, energy.per-hit=10.0, energy.singularity-execute=1.00, shared.damage-mult=0.10 | discharge every 21 hits (0.14/s) | energy steady-state hit estimate |
| Spirit / Phantasm / Wisp / Invoker | Eruption Lash +3 | 123 | 0.00 | 2.68 | 530 | 262 | 136 | 4.00 | 2.00% | energy.critical-mass=1.00, energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.24/s) | energy steady-state hit estimate |
| Spirit / Phantasm / Wisp / Tempest | Eruption Lash +3 | 123 | 0.00 | 2.68 | 530 | 262 | 136 | 4.00 | 2.00% | energy.empowered-mult=6.00, energy.endless-storm=1.00, energy.per-hit=10.0 | discharge every 11 hits (0.24/s) | endless storm DoT budget included per discharge |
| Spirit / Phantasm / Wisp / Voidwalker | Eruption Lash +3 | 123 | 0.00 | 2.68 | 530 | 262 | 136 | 4.00 | 2.00% | energy.empowered-mult=6.00, energy.max-bonus=100, energy.per-hit=10.0, energy.singularity-execute=1.00 | discharge every 21 hits (0.13/s) | energy steady-state hit estimate |
| Spirit / Spark / Haunt / Channeler | Eruption Lash +3 | 129 | 0.00 | 4.08 | 348 | 102 | 141 | 8.00 | 6.00% | energy.empowered-mult=1.50, energy.per-hit=20.0, energy.upkeep=1.00, shared.damage-mult=0.10 | discharge every 6 hits (0.68/s) | energy steady-state hit estimate |
| Spirit / Spark / Haunt / Stormdancer | Eruption Lash +3 | 129 | 0.00 | 4.08 | 348 | 102 | 141 | 8.00 | 6.00% | energy.empowered-mult=1.50, energy.flash=1.00, energy.per-hit=20.0, shared.damage-mult=0.10 | discharge every 6 hits (0.68/s) | energy steady-state hit estimate |
| Spirit / Spark / Haunt / Surge | Eruption Lash +3 | 129 | 0.00 | 4.08 | 348 | 102 | 141 | 8.00 | 6.00% | energy.empowered-mult=1.50, energy.overdrive=1.00, energy.per-hit=20.0, shared.damage-mult=0.10 | discharge every 6 hits (0.68/s) | surge overdrive approximated as 35% steady attack gain |
| Spirit / Spark / Wisp / Channeler | Eruption Lash +3 | 125 | 0.00 | 3.83 | 371 | 262 | 124 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0, energy.upkeep=1.00 | discharge every 6 hits (0.64/s) | energy steady-state hit estimate |
| Spirit / Spark / Wisp / Stormdancer | Eruption Lash +3 | 125 | 0.00 | 3.83 | 371 | 262 | 124 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.flash=1.00, energy.per-hit=20.0 | discharge every 6 hits (0.64/s) | energy steady-state hit estimate |
| Spirit / Spark / Wisp / Surge | Eruption Lash +3 | 125 | 0.00 | 3.83 | 371 | 262 | 124 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.overdrive=1.00, energy.per-hit=20.0 | discharge every 6 hits (0.64/s) | surge overdrive approximated as 35% steady attack gain |
| Spirit / Wraith / Haunt / Aetherist | Eruption Lash +3 | 129 | 0.00 | 3.83 | 371 | 102 | 140 | 9.00 | 6.00% | energy.charge-state=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.43/s) | energy steady-state hit estimate |
| Spirit / Wraith / Haunt / Equinox | Eruption Lash +3 | 129 | 0.00 | 3.83 | 371 | 102 | 140 | 9.00 | 6.00% | energy.binary-cycle=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.43/s) | energy steady-state hit estimate |
| Spirit / Wraith / Haunt / Stormbringer | Eruption Lash +3 | 129 | 0.00 | 3.83 | 371 | 102 | 140 | 9.00 | 6.00% | energy.awakened-lightning=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.43/s) | awakened lightning next-three empowered hits included |
| Spirit / Wraith / Wisp / Aetherist | Eruption Lash +3 | 125 | 0.00 | 3.57 | 397 | 262 | 123 | 3.00 | 0.00% | energy.charge-state=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.40/s) | energy steady-state hit estimate |
| Spirit / Wraith / Wisp / Equinox | Eruption Lash +3 | 125 | 0.00 | 3.57 | 397 | 262 | 123 | 3.00 | 0.00% | energy.binary-cycle=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.40/s) | energy steady-state hit estimate |
| Spirit / Wraith / Wisp / Stormbringer | Eruption Lash +3 | 125 | 0.00 | 3.57 | 397 | 262 | 123 | 3.00 | 0.00% | energy.awakened-lightning=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.40/s) | awakened lightning next-three empowered hits included |
| Squire / Bulwark / Sentinel / Channeled Beam | Eruption Lash +3 | 137 | 0.00 | 2.04 | 695 | 132 | 190 | 10.0 | 11.0% | cooldown.channeled-beam=1.00, cooldown.empowered-cd-ms=9000, cooldown.empowered-mult=3.00 | empowered every 9.00s (0.11/s) | channeled beam estimated as six 500 ms ticks |
| Squire / Bulwark / Sentinel / Entropy Collapse | Eruption Lash +3 | 137 | 0.00 | 2.04 | 695 | 132 | 190 | 10.0 | 11.0% | cooldown.empowered-cd-ms=9000, cooldown.empowered-mult=3.00, cooldown.entropy-collapse=1.00 | empowered every 9.00s (0.11/s) | cooldown steady-state hit estimate |
| Squire / Bulwark / Sentinel / Singular Extraction | Glacial Tyrant Maul +3 | 331 | 0.00 | 0.34 | 2976 | 132 | 190 | 10.0 | 11.0% | cooldown.empowered-cd-ms=3000, cooldown.empowered-mult=3.00, cooldown.singular-extraction=1.00 | empowered every 3.00s (0.33/s) | singular extraction: normal direct damage suppressed |
| Squire / Bulwark / Vanguard / Channeled Beam | Eruption Lash +3 | 141 | 0.00 | 2.30 | 618 | 12.0 | 207 | 20.0 | 17.0% | cooldown.channeled-beam=1.00, cooldown.empowered-cd-ms=9000, cooldown.empowered-mult=3.00, shared.damage-mult=0.10 | empowered every 9.00s (0.11/s) | channeled beam estimated as six 500 ms ticks |
| Squire / Bulwark / Vanguard / Entropy Collapse | Eruption Lash +3 | 141 | 0.00 | 2.30 | 618 | 12.0 | 207 | 20.0 | 17.0% | cooldown.empowered-cd-ms=9000, cooldown.empowered-mult=3.00, cooldown.entropy-collapse=1.00, shared.damage-mult=0.10 | empowered every 9.00s (0.11/s) | cooldown steady-state hit estimate |
| Squire / Bulwark / Vanguard / Singular Extraction | Glacial Tyrant Maul +3 | 335 | 0.00 | 0.38 | 2646 | 12.0 | 207 | 20.0 | 17.0% | cooldown.empowered-cd-ms=3000, cooldown.empowered-mult=3.00, cooldown.singular-extraction=1.00, shared.damage-mult=0.10 | empowered every 3.00s (0.33/s) | singular extraction: normal direct damage suppressed |
| Squire / Knight / Sentinel / Dynamo | Eruption Lash +3 | 132 | 0.00 | 2.68 | 530 | 132 | 178 | 8.00 | 11.0% | cooldown.battery=1.00, cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Knight / Sentinel / Reverb | Eruption Lash +3 | 132 | 0.00 | 2.68 | 530 | 132 | 178 | 8.00 | 11.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, cooldown.reverb=1.00, cooldown.reverb-bonus-per-attack=0.04 | empowered every 7.00s (0.14/s) | reverb next-window bonus estimated |
| Squire / Knight / Sentinel / Stalwart | Eruption Lash +3 | 132 | 0.00 | 2.68 | 530 | 132 | 178 | 8.00 | 11.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, cooldown.patience-paid=1.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Knight / Vanguard / Dynamo | Eruption Lash +3 | 136 | 0.00 | 2.94 | 483 | 12.0 | 195 | 18.0 | 17.0% | cooldown.battery=1.00, cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Knight / Vanguard / Reverb | Eruption Lash +3 | 136 | 0.00 | 2.94 | 483 | 12.0 | 195 | 18.0 | 17.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, cooldown.reverb=1.00, cooldown.reverb-bonus-per-attack=0.04, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | reverb next-window bonus estimated |
| Squire / Knight / Vanguard / Stalwart | Eruption Lash +3 | 136 | 0.00 | 2.94 | 483 | 12.0 | 195 | 18.0 | 17.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, cooldown.patience-paid=1.00, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Sentinel / Assassin | Eruption Lash +3 | 134 | 0.00 | 3.32 | 428 | 132 | 164 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.overdrive=1.00 | empowered every 5.00s (0.20/s) | overdrive attack-speed buff averaged |
| Squire / Warrior / Sentinel / Sunderer | Eruption Lash +3 | 134 | 0.00 | 3.32 | 428 | 132 | 164 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.rupture=1.00, cooldown.rupture-dr-pierce=0.10 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Sentinel / Transcendant | Eruption Lash +3 | 134 | 0.00 | 3.32 | 428 | 132 | 164 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.eternal-cycle=1.00, cooldown.eternal-cycle-flat=8.00 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Vanguard / Assassin | Eruption Lash +3 | 138 | 0.00 | 3.57 | 397 | 12.0 | 181 | 15.0 | 14.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.overdrive=1.00, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | overdrive attack-speed buff averaged |
| Squire / Warrior / Vanguard / Sunderer | Eruption Lash +3 | 138 | 0.00 | 3.57 | 397 | 12.0 | 181 | 15.0 | 14.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.rupture=1.00, cooldown.rupture-dr-pierce=0.10, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Squire / Warrior / Vanguard / Transcendant | Eruption Lash +3 | 138 | 0.00 | 3.57 | 397 | 12.0 | 181 | 15.0 | 14.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.eternal-cycle=1.00, cooldown.eternal-cycle-flat=8.00, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | cooldown steady-state hit estimate |
| Striker / Breaker / In-Fighter / Berserker | Eruption Lash +3 | 132 | 0.00 | 2.30 | 618 | 12.0 | 179 | 16.0 | 12.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, cadence.rampage=1.00, shared.damage-mult=0.10 | finisher every 6 hits (0.38/s) | cadence steady-state hit estimate |
| Striker / Breaker / In-Fighter / Hemomancer | Eruption Lash +3 | 132 | 0.00 | 2.30 | 618 | 12.0 | 179 | 16.0 | 12.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, cadence.hemorrhage=1.00, shared.damage-mult=0.10 | finisher every 6 hits (0.38/s) | hemorrhage converts finishers to bleed |
| Striker / Breaker / In-Fighter / Juggernaut | Eruption Lash +3 | 132 | 0.00 | 2.30 | 618 | 12.0 | 179 | 16.0 | 12.0% | cadence.crescendo=1.00, cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, shared.damage-mult=0.10 | finisher every 6 hits (0.38/s) | cadence steady-state hit estimate |
| Striker / Breaker / Phantom-Blade / Berserker | Eruption Lash +3 | 128 | 0.00 | 2.04 | 695 | 132 | 162 | 8.00 | 6.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, cadence.rampage=1.00 | finisher every 6 hits (0.34/s) | cadence steady-state hit estimate |
| Striker / Breaker / Phantom-Blade / Hemomancer | Eruption Lash +3 | 128 | 0.00 | 2.04 | 695 | 132 | 162 | 8.00 | 6.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, cadence.hemorrhage=1.00 | finisher every 6 hits (0.34/s) | hemorrhage converts finishers to bleed |
| Striker / Breaker / Phantom-Blade / Juggernaut | Eruption Lash +3 | 128 | 0.00 | 2.04 | 695 | 132 | 162 | 8.00 | 6.00% | cadence.crescendo=1.00, cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.34/s) | cadence steady-state hit estimate |
| Striker / Flurry / In-Fighter / Scrapper | Eruption Lash +3 | 132 | 0.00 | 3.65 | 389 | 12.0 | 157 | 12.0 | 10.0% | cadence.debuff-plating-shred=5.00, cadence.debuff-shred-cap=20.0, cadence.debuff-vuln-ms=5000, cadence.debuff-vuln-pct=25.0, cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, shared.damage-mult=0.10 | finisher every 4 hits (0.91/s) | cursed finale vulnerability treated as steady-state |
| Striker / Flurry / In-Fighter / Shockblade | Eruption Lash +3 | 132 | 10.0 | 3.65 | 389 | 12.0 | 157 | 12.0 | 10.0% | cadence.aftershock=1.00, cadence.aftershock-onhit-per-tier=10.0, cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, shared.damage-mult=0.10 | finisher every 4 hits (0.91/s) | cadence steady-state hit estimate |
| Striker / Flurry / In-Fighter / Swiftblade | Eruption Lash +3 | 132 | 0.00 | 3.65 | 389 | 12.0 | 157 | 12.0 | 10.0% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, cadence.trigger-count=2.00, shared.damage-mult=0.10 | finisher every 4 hits (0.91/s) | cadence steady-state hit estimate |
| Striker / Flurry / Phantom-Blade / Scrapper | Eruption Lash +3 | 128 | 0.00 | 3.40 | 418 | 132 | 140 | 4.00 | 4.00% | cadence.debuff-plating-shred=5.00, cadence.debuff-shred-cap=20.0, cadence.debuff-vuln-ms=5000, cadence.debuff-vuln-pct=25.0, cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.85/s) | cursed finale vulnerability treated as steady-state |
| Striker / Flurry / Phantom-Blade / Shockblade | Eruption Lash +3 | 128 | 10.0 | 3.40 | 418 | 132 | 140 | 4.00 | 4.00% | cadence.aftershock=1.00, cadence.aftershock-onhit-per-tier=10.0, cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.85/s) | cadence steady-state hit estimate |
| Striker / Flurry / Phantom-Blade / Swiftblade | Eruption Lash +3 | 128 | 0.00 | 3.40 | 418 | 132 | 140 | 4.00 | 4.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, cadence.trigger-count=2.00 | finisher every 4 hits (0.85/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / In-Fighter / Justicar | Eruption Lash +3 | 133 | 0.00 | 2.94 | 483 | 12.0 | 171 | 13.0 | 10.0% | cadence.detonation=1.00, cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, shared.damage-mult=0.10 | finisher every 5 hits (0.59/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / In-Fighter / Maestro | Eruption Lash +3 | 133 | 0.00 | 2.94 | 483 | 12.0 | 171 | 13.0 | 10.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, cadence.metronome=1.00, cadence.metronome-flat=12.0, shared.damage-mult=0.10 | finisher every 5 hits (0.59/s) | metronome flat cycle estimate |
| Striker / Skirmisher / In-Fighter / Wavecrest | Eruption Lash +3 | 133 | 0.00 | 2.94 | 483 | 12.0 | 171 | 13.0 | 10.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, cadence.momentum-buildup=0.20, cadence.momentum-echo=4.00, shared.damage-mult=0.10 | finisher every 5 hits (0.59/s) | wavecrest resonance/echo steady estimate |
| Striker / Skirmisher / Phantom-Blade / Justicar | Eruption Lash +3 | 129 | 0.00 | 2.68 | 530 | 132 | 154 | 5.00 | 4.00% | cadence.detonation=1.00, cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.54/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / Phantom-Blade / Maestro | Eruption Lash +3 | 129 | 0.00 | 2.68 | 530 | 132 | 154 | 5.00 | 4.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, cadence.metronome=1.00, cadence.metronome-flat=12.0 | finisher every 5 hits (0.54/s) | metronome flat cycle estimate |
| Striker / Skirmisher / Phantom-Blade / Wavecrest | Eruption Lash +3 | 129 | 0.00 | 2.68 | 530 | 132 | 154 | 5.00 | 4.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, cadence.momentum-buildup=0.20, cadence.momentum-echo=4.00 | finisher every 5 hits (0.54/s) | wavecrest resonance/echo steady estimate |


## 4. Weapon Input Table (+0 and +3)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Abyssal Axe | +0 | attack=110 | weapon.dead-swing-interval=4.00, weapon.execute-dmg-mult=2.50, weapon.execute-threshold-pct=0.20 | 1.15 APS base | explicit steps 0/3 |
| Abyssal Axe | +3 | attack=170 | weapon.dead-swing-interval=4.00, weapon.execute-dmg-mult=2.50, weapon.execute-threshold-pct=0.20 | 1.15 APS base | explicit steps 3/3 |
| Deathfang Rapier | +0 | attack=44.0, onHitDamage=30.0 | - | 1.75 APS base | explicit steps 0/3 |
| Deathfang Rapier | +3 | attack=77.0, onHitDamage=54.0 | - | 1.75 APS base | explicit steps 3/3 |
| Earthsunder Maul | +0 | attack=150 | - | 0.40 APS base | explicit steps 0/3 |
| Earthsunder Maul | +3 | attack=285 | - | 0.40 APS base | explicit steps 3/3 |
| Eruption Lash | +0 | attack=58.0 | weapon.flurry-pct=0.07, weapon.flurry-stacks=6.00 | 1.80 APS base | explicit steps 0/3 |
| Eruption Lash | +3 | attack=91.0 | weapon.flurry-pct=0.07, weapon.flurry-stacks=6.00 | 1.80 APS base | explicit steps 3/3 |
| Glacial Rimebrand | +0 | attack=86.0 | weapon.dot-conversion-pct=0.45, weapon.dot-stacks=3.00 | 0.55 APS base; rimebrand-burn DoT reservoir 45.0% conversion x1.15 | explicit steps 0/3 |
| Glacial Rimebrand | +3 | attack=140 | weapon.dot-conversion-pct=0.45, weapon.dot-stacks=3.00 | 0.55 APS base; rimebrand-burn DoT reservoir 45.0% conversion x1.15 | explicit steps 3/3 |
| Glacial Tyrant Maul | +0 | attack=150 | weapon.brittle-dr=0.01, weapon.brittle-plating=3.00, weapon.brittle-shatter-dr-strip-ms=2000, weapon.brittle-shatter-threshold=8.00, weapon.brittle-stacks=8.00 | 0.42 APS base | explicit steps 0/3 |
| Glacial Tyrant Maul | +3 | attack=285 | weapon.brittle-dr=0.01, weapon.brittle-plating=3.00, weapon.brittle-shatter-dr-strip-ms=2000, weapon.brittle-shatter-threshold=8.00, weapon.brittle-stacks=8.00 | 0.42 APS base | explicit steps 3/3 |
| Plague Axe | +0 | attack=110 | weapon.dead-swing-interval=3.00, weapon.dead-swing-vuln-ms=4000, weapon.dead-swing-vuln-pct=0.20 | 1.10 APS base | explicit steps 0/3 |
| Plague Axe | +3 | attack=170 | weapon.dead-swing-interval=3.00, weapon.dead-swing-vuln-ms=4000, weapon.dead-swing-vuln-pct=0.20 | 1.10 APS base | explicit steps 3/3 |
| Volcanic Blightbrand | +0 | attack=62.0 | weapon.dot-conversion-pct=0.30, weapon.dot-stacks=5.00 | 0.85 APS base; blightbrand-burn DoT reservoir 30.0% conversion x1.15 | explicit steps 0/3 |
| Volcanic Blightbrand | +3 | attack=98.0 | weapon.dot-conversion-pct=0.30, weapon.dot-stacks=5.00 | 0.85 APS base; blightbrand-burn DoT reservoir 30.0% conversion x1.15 | explicit steps 3/3 |
| Warmaul | +0 | attack=90.0 | weapon.empowered-mult-bonus=0.25 | 0.65 APS base | explicit steps 0/3 |
| Warmaul | +3 | attack=171 | weapon.empowered-mult-bonus=0.25 | 0.65 APS base | explicit steps 3/3 |
| Zenith Cross | +0 | attack=60.0 | weapon.first-strike-mult=3.00 | 0.70 APS base | explicit steps 0/3 |
| Zenith Cross | +3 | attack=102 | weapon.first-strike-mult=3.00 | 0.70 APS base | explicit steps 3/3 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Light Frame / Close Range / Swarm | Glacial Tyrant Maul +3 | 4176 | 0.00 | 4176 | 0.00 | 0.00 | EXTREME_HIGH |
| Conduit / Light Frame / Far Range / Swarm | Glacial Tyrant Maul +3 | 4116 | 0.00 | 4116 | 0.00 | 0.00 | EXTREME_HIGH |
| Conduit / Heavy Frame / Close Range / Stone Sentinel | Glacial Tyrant Maul +3 | 1264 | 0.00 | 1264 | 0.00 | 0.00 | EXTREME_HIGH |
| Conduit / Heavy Frame / Far Range / Stone Sentinel | Glacial Tyrant Maul +3 | 1248 | 0.00 | 1248 | 0.00 | 0.00 | EXTREME_HIGH |
| Conduit / Light Frame / Close Range / Acid Brood | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame / Close Range / Predator's Howl | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Close Range / Grazing Field | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Close Range / Trampled Path | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Close Range / Vital Burst | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame / Far Range / Acid Brood | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | HIGH |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger / Scout / Deadeye / Sniper | Glacial Tyrant Maul +3 | 174 | 167 | 0.00 | 0.00 | 6.68 | EXTREME_LOW |
| Slinger / Scout / Breacher / Sniper | Glacial Tyrant Maul +3 | 183 | 176 | 0.00 | 0.00 | 7.05 | EXTREME_LOW |
| Apprentice / Ember mage / Harbinger / Cinder Lord | Glacial Tyrant Maul +3 | 263 | 71.4 | 0.00 | 192 | 0.00 | EXTREME_LOW |
| Apprentice / Ember mage / Harbinger / Pyromancer | Glacial Tyrant Maul +3 | 263 | 71.4 | 0.00 | 192 | 0.00 | EXTREME_LOW |
| Apprentice / Ember mage / Hexblade / Cinder Lord | Glacial Tyrant Maul +3 | 275 | 79.2 | 0.00 | 196 | 0.00 | EXTREME_LOW |
| Apprentice / Ember mage / Hexblade / Pyromancer | Glacial Tyrant Maul +3 | 275 | 79.2 | 0.00 | 196 | 0.00 | EXTREME_LOW |
| Squire / Bulwark / Sentinel / Entropy Collapse | Eruption Lash +3 | 293 | 264 | 28.8 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Deadeye / Dualslinger | Deathfang Rapier +3 | 293 | 293 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Deadeye / Duelist | Deathfang Rapier +3 | 297 | 297 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Breacher / Dualslinger | Deathfang Rapier +3 | 298 | 298 | 0.00 | 0.00 | 0.00 | LOW |


All optimal-weapon outliers:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit / Light Frame / Close Range / Swarm | Glacial Tyrant Maul +3 | 4176 | 0.00 | 4176 | 0.00 | 0.00 | EXTREME_HIGH |
| Conduit / Light Frame / Far Range / Swarm | Glacial Tyrant Maul +3 | 4116 | 0.00 | 4116 | 0.00 | 0.00 | EXTREME_HIGH |
| Conduit / Heavy Frame / Close Range / Stone Sentinel | Glacial Tyrant Maul +3 | 1264 | 0.00 | 1264 | 0.00 | 0.00 | EXTREME_HIGH |
| Conduit / Heavy Frame / Far Range / Stone Sentinel | Glacial Tyrant Maul +3 | 1248 | 0.00 | 1248 | 0.00 | 0.00 | EXTREME_HIGH |
| Conduit / Light Frame / Close Range / Acid Brood | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame / Close Range / Predator's Howl | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Close Range / Grazing Field | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Close Range / Trampled Path | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Close Range / Vital Burst | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame / Far Range / Acid Brood | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | HIGH |
| Conduit / Light Frame / Far Range / Predator's Howl | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Far Range / Grazing Field | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Far Range / Trampled Path | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | HIGH |
| Conduit / Medium Frame / Far Range / Vital Burst | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | HIGH |
| Slinger / Marksman / Breacher / Desperado | Deathfang Rapier +3 | 391 | 391 | 0.00 | 0.00 | 0.00 | LOW |
| Striker / Skirmisher / Phantom-Blade / Justicar | Eruption Lash +3 | 390 | 324 | 66.0 | 0.00 | 0.00 | LOW |
| Slinger / Artillerist / Deadeye / Warmonger | Deathfang Rapier +3 | 390 | 390 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Marksman / Deadeye / Bounty hunter | Deathfang Rapier +3 | 386 | 280 | 106 | 0.00 | 0.00 | LOW |
| Spirit / Phantasm / Wisp / Voidwalker | Eruption Lash +3 | 385 | 311 | 74.3 | 0.00 | 0.00 | LOW |
| Squire / Knight / Sentinel / Reverb | Eruption Lash +3 | 376 | 332 | 43.5 | 0.00 | 0.00 | LOW |
| Apprentice / Venom vessel / Hexblade / Venomslinger | Eruption Lash +3 | 374 | 293 | 0.00 | 80.7 | 0.00 | LOW |
| Striker / Breaker / Phantom-Blade / Berserker | Eruption Lash +3 | 369 | 245 | 124 | 0.00 | 0.00 | LOW |
| Striker / Breaker / Phantom-Blade / Juggernaut | Eruption Lash +3 | 369 | 245 | 124 | 0.00 | 0.00 | LOW |
| Apprentice / Venom vessel / Hexblade / Cultist | Eruption Lash +3 | 369 | 293 | 0.00 | 76.0 | 0.00 | LOW |
| Slinger / Marksman / Deadeye / Desperado | Deathfang Rapier +3 | 365 | 365 | 0.00 | 0.00 | 0.00 | LOW |
| Squire / Knight / Sentinel / Dynamo | Eruption Lash +3 | 350 | 332 | 17.9 | 0.00 | 0.00 | LOW |
| Squire / Knight / Sentinel / Stalwart | Eruption Lash +3 | 350 | 332 | 17.9 | 0.00 | 0.00 | LOW |
| Squire / Bulwark / Sentinel / Channeled Beam | Eruption Lash +3 | 350 | 264 | 86.0 | 0.00 | 0.00 | LOW |
| Apprentice / Venom vessel / Harbinger / Venomslinger | Eruption Lash +3 | 344 | 265 | 0.00 | 79.2 | 0.00 | LOW |
| Slinger / Artillerist / Breacher / Melter | Glacial Tyrant Maul +3 | 339 | 0.00 | 339 | 0.00 | 0.00 | LOW |
| Apprentice / Rime-Bound / Hexblade / Rime Blade | Glacial Tyrant Maul +3 | 338 | 39.1 | 0.00 | 299 | 0.00 | LOW |
| Apprentice / Rime-Bound / Hexblade / Winter Warden | Glacial Tyrant Maul +3 | 338 | 39.1 | 0.00 | 299 | 0.00 | LOW |
| Apprentice / Venom vessel / Harbinger / Cultist | Eruption Lash +3 | 337 | 265 | 0.00 | 72.0 | 0.00 | LOW |
| Squire / Bulwark / Vanguard / Entropy Collapse | Eruption Lash +3 | 335 | 306 | 29.7 | 0.00 | 0.00 | LOW |
| Squire / Bulwark / Vanguard / Singular Extraction | Glacial Tyrant Maul +3 | 335 | 0.00 | 335 | 0.00 | 0.00 | LOW |
| Slinger / Artillerist / Deadeye / Melter | Glacial Tyrant Maul +3 | 333 | 0.00 | 333 | 0.00 | 0.00 | LOW |
| Squire / Bulwark / Sentinel / Singular Extraction | Glacial Tyrant Maul +3 | 331 | 0.00 | 331 | 0.00 | 0.00 | LOW |
| Apprentice / Rime-Bound / Harbinger / Rime Blade | Glacial Tyrant Maul +3 | 330 | 34.6 | 0.00 | 296 | 0.00 | LOW |
| Apprentice / Rime-Bound / Harbinger / Winter Warden | Glacial Tyrant Maul +3 | 330 | 34.6 | 0.00 | 296 | 0.00 | LOW |
| Slinger / Scout / Breacher / Duelist | Deathfang Rapier +3 | 302 | 302 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Breacher / Dualslinger | Deathfang Rapier +3 | 298 | 298 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Deadeye / Duelist | Deathfang Rapier +3 | 297 | 297 | 0.00 | 0.00 | 0.00 | LOW |
| Slinger / Scout / Deadeye / Dualslinger | Deathfang Rapier +3 | 293 | 293 | 0.00 | 0.00 | 0.00 | LOW |
| Squire / Bulwark / Sentinel / Entropy Collapse | Eruption Lash +3 | 293 | 264 | 28.8 | 0.00 | 0.00 | LOW |
| Apprentice / Ember mage / Hexblade / Cinder Lord | Glacial Tyrant Maul +3 | 275 | 79.2 | 0.00 | 196 | 0.00 | EXTREME_LOW |
| Apprentice / Ember mage / Hexblade / Pyromancer | Glacial Tyrant Maul +3 | 275 | 79.2 | 0.00 | 196 | 0.00 | EXTREME_LOW |
| Apprentice / Ember mage / Harbinger / Cinder Lord | Glacial Tyrant Maul +3 | 263 | 71.4 | 0.00 | 192 | 0.00 | EXTREME_LOW |
| Apprentice / Ember mage / Harbinger / Pyromancer | Glacial Tyrant Maul +3 | 263 | 71.4 | 0.00 | 192 | 0.00 | EXTREME_LOW |
| Slinger / Scout / Breacher / Sniper | Glacial Tyrant Maul +3 | 183 | 176 | 0.00 | 0.00 | 7.05 | EXTREME_LOW |
| Slinger / Scout / Deadeye / Sniper | Glacial Tyrant Maul +3 | 174 | 167 | 0.00 | 0.00 | 6.68 | EXTREME_LOW |


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Conduit | 726 | 180 |
| Spirit | 299 | 180 |
| Striker | 286 | 180 |
| Apprentice | 266 | 180 |
| Squire | 254 | 180 |
| Slinger | 235 | 180 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Glacial Tyrant Maul | 427 | 108 |
| Abyssal Axe | 418 | 108 |
| Eruption Lash | 416 | 108 |
| Earthsunder Maul | 399 | 108 |
| Deathfang Rapier | 386 | 108 |
| Plague Axe | 334 | 108 |
| Warmaul | 318 | 108 |
| Glacial Rimebrand | 261 | 108 |
| Zenith Cross | 249 | 108 |
| Volcanic Blightbrand | 237 | 108 |


Weapon DPS against target shapes:

| Weapon | neutral T4 dummy | high-plating T4 dummy | high-HP elite T4 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Abyssal Axe +3 | 418 | 430 | 374 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Deathfang Rapier +3 | 386 | 389 | 353 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Earthsunder Maul +3 | 399 | 413 | 359 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Eruption Lash +3 | 416 | 423 | 370 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Glacial Rimebrand +3 | 261 | 267 | 233 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Glacial Tyrant Maul +3 | 427 | 427 | 426 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Plague Axe +3 | 334 | 343 | 299 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Volcanic Blightbrand +3 | 237 | 241 | 210 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Warmaul +3 | 318 | 327 | 285 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |
| Zenith Cross +3 | 249 | 248 | 201 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Magma Brute; high-HP elite T4 dummy: Cavern Troll |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Eruption Lash | 529 | 18 |
| Squire | Eruption Lash | 394 | 18 |
| Apprentice | Eruption Lash | 345 | 18 |
| Spirit | Eruption Lash | 542 | 18 |
| Slinger | Deathfang Rapier | 328 | 18 |
| Conduit | Glacial Tyrant Maul | 1263 | 18 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Glacial Rimebrand | 165 | 18 |
| Squire | Glacial Rimebrand | 166 | 18 |
| Apprentice | Volcanic Blightbrand | 182 | 18 |
| Spirit | Glacial Rimebrand | 173 | 18 |
| Slinger | Volcanic Blightbrand | 173 | 18 |
| Conduit | Deathfang Rapier | 400 | 18 |


## 10. Outlier Detail

| Flag | Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Suspected source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXTREME_HIGH | Conduit / Light Frame / Close Range / Swarm | Glacial Tyrant Maul +3 | 4176 | 0.00 | 4176 | 0.00 | 0.00 | class mechanic share; 12 minions at 1.00 APS each |
| EXTREME_HIGH | Conduit / Light Frame / Far Range / Swarm | Glacial Tyrant Maul +3 | 4116 | 0.00 | 4116 | 0.00 | 0.00 | class mechanic share; 12 minions at 1.00 APS each |
| EXTREME_HIGH | Conduit / Heavy Frame / Close Range / Stone Sentinel | Glacial Tyrant Maul +3 | 1264 | 0.00 | 1264 | 0.00 | 0.00 | class mechanic share; 2 minions at 1.00 APS each |
| EXTREME_HIGH | Conduit / Heavy Frame / Far Range / Stone Sentinel | Glacial Tyrant Maul +3 | 1248 | 0.00 | 1248 | 0.00 | 0.00 | class mechanic share; 2 minions at 1.00 APS each |
| HIGH | Conduit / Light Frame / Close Range / Acid Brood | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | class mechanic share; 6 minions at 1.00 APS each |
| HIGH | Conduit / Light Frame / Close Range / Predator's Howl | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | class mechanic share; 6 minions at 1.00 APS each |
| HIGH | Conduit / Medium Frame / Close Range / Grazing Field | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each |
| HIGH | Conduit / Medium Frame / Close Range / Trampled Path | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each |
| HIGH | Conduit / Medium Frame / Close Range / Vital Burst | Glacial Tyrant Maul +3 | 948 | 0.00 | 948 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each |
| HIGH | Conduit / Light Frame / Far Range / Acid Brood | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | class mechanic share; 6 minions at 1.00 APS each |
| HIGH | Conduit / Light Frame / Far Range / Predator's Howl | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | class mechanic share; 6 minions at 1.00 APS each |
| HIGH | Conduit / Medium Frame / Far Range / Grazing Field | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each |
| HIGH | Conduit / Medium Frame / Far Range / Trampled Path | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each |
| HIGH | Conduit / Medium Frame / Far Range / Vital Burst | Glacial Tyrant Maul +3 | 936 | 0.00 | 936 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each |
| LOW | Slinger / Marksman / Breacher / Desperado | Deathfang Rapier +3 | 391 | 391 | 0.00 | 0.00 | 0.00 | direct share |
| LOW | Striker / Skirmisher / Phantom-Blade / Justicar | Eruption Lash +3 | 390 | 324 | 66.0 | 0.00 | 0.00 | direct share |
| LOW | Slinger / Artillerist / Deadeye / Warmonger | Deathfang Rapier +3 | 390 | 390 | 0.00 | 0.00 | 0.00 | direct share |
| LOW | Slinger / Marksman / Deadeye / Bounty hunter | Deathfang Rapier +3 | 386 | 280 | 106 | 0.00 | 0.00 | direct share; death mark detonation averaged per clip |
| LOW | Spirit / Phantasm / Wisp / Voidwalker | Eruption Lash +3 | 385 | 311 | 74.3 | 0.00 | 0.00 | direct share |
| LOW | Squire / Knight / Sentinel / Reverb | Eruption Lash +3 | 376 | 332 | 43.5 | 0.00 | 0.00 | direct share; reverb next-window bonus estimated |
| LOW | Apprentice / Venom vessel / Hexblade / Venomslinger | Eruption Lash +3 | 374 | 293 | 0.00 | 80.7 | 0.00 | direct share; poison explosion averaged every 10 stacks |
| LOW | Striker / Breaker / Phantom-Blade / Berserker | Eruption Lash +3 | 369 | 245 | 124 | 0.00 | 0.00 | direct share |
| LOW | Striker / Breaker / Phantom-Blade / Juggernaut | Eruption Lash +3 | 369 | 245 | 124 | 0.00 | 0.00 | direct share |
| LOW | Apprentice / Venom vessel / Hexblade / Cultist | Eruption Lash +3 | 369 | 293 | 0.00 | 76.0 | 0.00 | direct share; eternal doom capped to 40 steady stacks for report sanity |
| LOW | Slinger / Marksman / Deadeye / Desperado | Deathfang Rapier +3 | 365 | 365 | 0.00 | 0.00 | 0.00 | direct share |
| LOW | Squire / Knight / Sentinel / Dynamo | Eruption Lash +3 | 350 | 332 | 17.9 | 0.00 | 0.00 | direct share |
| LOW | Squire / Knight / Sentinel / Stalwart | Eruption Lash +3 | 350 | 332 | 17.9 | 0.00 | 0.00 | direct share |
| LOW | Squire / Bulwark / Sentinel / Channeled Beam | Eruption Lash +3 | 350 | 264 | 86.0 | 0.00 | 0.00 | direct share; channeled beam estimated as six 500 ms ticks |
| LOW | Apprentice / Venom vessel / Harbinger / Venomslinger | Eruption Lash +3 | 344 | 265 | 0.00 | 79.2 | 0.00 | direct share; poison explosion averaged every 10 stacks |
| LOW | Slinger / Artillerist / Breacher / Melter | Glacial Tyrant Maul +3 | 339 | 0.00 | 339 | 0.00 | 0.00 | class mechanic share; laser heat/cool duty cycle estimated |
| LOW | Apprentice / Rime-Bound / Hexblade / Rime Blade | Glacial Tyrant Maul +3 | 338 | 39.1 | 0.00 | 299 | 0.00 | DoT share |
| LOW | Apprentice / Rime-Bound / Hexblade / Winter Warden | Glacial Tyrant Maul +3 | 338 | 39.1 | 0.00 | 299 | 0.00 | DoT share |
| LOW | Apprentice / Venom vessel / Harbinger / Cultist | Eruption Lash +3 | 337 | 265 | 0.00 | 72.0 | 0.00 | direct share; eternal doom capped to 40 steady stacks for report sanity |
| LOW | Squire / Bulwark / Vanguard / Entropy Collapse | Eruption Lash +3 | 335 | 306 | 29.7 | 0.00 | 0.00 | direct share |
| LOW | Squire / Bulwark / Vanguard / Singular Extraction | Glacial Tyrant Maul +3 | 335 | 0.00 | 335 | 0.00 | 0.00 | class mechanic share; singular extraction: normal direct damage suppressed |
| LOW | Slinger / Artillerist / Deadeye / Melter | Glacial Tyrant Maul +3 | 333 | 0.00 | 333 | 0.00 | 0.00 | class mechanic share; laser heat/cool duty cycle estimated |
| LOW | Squire / Bulwark / Sentinel / Singular Extraction | Glacial Tyrant Maul +3 | 331 | 0.00 | 331 | 0.00 | 0.00 | class mechanic share; singular extraction: normal direct damage suppressed |
| LOW | Apprentice / Rime-Bound / Harbinger / Rime Blade | Glacial Tyrant Maul +3 | 330 | 34.6 | 0.00 | 296 | 0.00 | DoT share |
| LOW | Apprentice / Rime-Bound / Harbinger / Winter Warden | Glacial Tyrant Maul +3 | 330 | 34.6 | 0.00 | 296 | 0.00 | DoT share |
| LOW | Slinger / Scout / Breacher / Duelist | Deathfang Rapier +3 | 302 | 302 | 0.00 | 0.00 | 0.00 | direct share |
| LOW | Slinger / Scout / Breacher / Dualslinger | Deathfang Rapier +3 | 298 | 298 | 0.00 | 0.00 | 0.00 | direct share; dual shots averaged 50/50 |
| LOW | Slinger / Scout / Deadeye / Duelist | Deathfang Rapier +3 | 297 | 297 | 0.00 | 0.00 | 0.00 | direct share |
| LOW | Slinger / Scout / Deadeye / Dualslinger | Deathfang Rapier +3 | 293 | 293 | 0.00 | 0.00 | 0.00 | direct share; dual shots averaged 50/50 |
| LOW | Squire / Bulwark / Sentinel / Entropy Collapse | Eruption Lash +3 | 293 | 264 | 28.8 | 0.00 | 0.00 | direct share |
| EXTREME_LOW | Apprentice / Ember mage / Hexblade / Cinder Lord | Glacial Tyrant Maul +3 | 275 | 79.2 | 0.00 | 196 | 0.00 | DoT share |
| EXTREME_LOW | Apprentice / Ember mage / Hexblade / Pyromancer | Glacial Tyrant Maul +3 | 275 | 79.2 | 0.00 | 196 | 0.00 | DoT share |
| EXTREME_LOW | Apprentice / Ember mage / Harbinger / Cinder Lord | Glacial Tyrant Maul +3 | 263 | 71.4 | 0.00 | 192 | 0.00 | DoT share |
| EXTREME_LOW | Apprentice / Ember mage / Harbinger / Pyromancer | Glacial Tyrant Maul +3 | 263 | 71.4 | 0.00 | 192 | 0.00 | DoT share |
| EXTREME_LOW | Slinger / Scout / Breacher / Sniper | Glacial Tyrant Maul +3 | 183 | 176 | 0.00 | 0.00 | 7.05 | direct share; sniper full-HP bonus amortized once per report horizon |
| EXTREME_LOW | Slinger / Scout / Deadeye / Sniper | Glacial Tyrant Maul +3 | 174 | 167 | 0.00 | 0.00 | 6.68 | direct share; sniper full-HP bonus amortized once per report horizon |


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `1 minions at 1.00 APS each`, `12 minions at 1.00 APS each`, `2 minions at 1.00 APS each`, `3 minions at 1.00 APS each`, `6 minions at 1.00 APS each`, `awakened lightning next-three empowered hits included`, `blightbrand-burn reservoir DoT from weapon profile`, `blunderbuss modeled as full-magazine single-target volley`, `cannon stored pool averaged per shot`, `channeled beam estimated as six 500 ms ticks`, `cursed finale vulnerability treated as steady-state`, `dead swing every 3 hits`, `dead swing every 4 hits`, `death mark detonation averaged per clip`, `dual shots averaged 50/50`, `endless storm DoT budget included per discharge`, `eternal doom capped to 40 steady stacks for report sanity`, `execute averaged over final 20% HP`, `first strike amortized over tier dummy HP`, `frenzy estimated at high uptime`, `hemorrhage converts finishers to bleed`, `laser heat/cool duty cycle estimated`, `max-stack direct bypass treated as steady-state`, `metronome flat cycle estimate`, `overdrive attack-speed buff averaged`, `poison explosion averaged every 10 stacks`, `reverb next-window bonus estimated`, `rimebrand-burn reservoir DoT from weapon profile`, `singular extraction: normal direct damage suppressed`, `sniper full-HP bonus amortized once per report horizon`, `surge overdrive approximated as 35% steady attack gain`, `wavecrest resonance/echo steady estimate`.
