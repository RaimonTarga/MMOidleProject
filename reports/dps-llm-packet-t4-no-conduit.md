# MMO Idle LLM Balance Packet - T4 (No Conduit)

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
| Reference optimal-build average DPS | 439 |
| Target TTK at reference DPS | 1.30s |
| Expected DPS band | 294 - 659 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Plague Rat | 310 | 0.00 | 0.00% | HP 310, plating 0.00, DR 0.00% |
| Mid profile | Ashspitter Salamander | 740 | 2.00 | 0.00% | HP 740, plating 2.00, DR 0.00%, ramp |
| Low plating/DR | Avalanche Tyrant | 1120 | 0.00 | 0.00% | HP 1120, plating 0.00, DR 0.00% |
| Mid profile | Cliffside Roc | 1300 | 0.00 | 0.00% | HP 1300, plating 0.00, DR 0.00% |
| High plating | Elder Leviathan | 3600 | 22.0 | 24.0% | HP 3600, plating 22.0, DR 24.0%, shield 30.0%, soft cap |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage / Harbinger / Cinder Lord | Earthsunder Maul +3 | 498 | 0.00 | 0.42 | 2381 | 172 | 159 | 6.00 | 4.00% | dot.conflagration=1.00, dot.conversion-pct=0.50, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Harbinger / Firebrand | Earthsunder Maul +3 | 498 | 0.00 | 0.42 | 2381 | 172 | 159 | 6.00 | 4.00% | dot.conversion-pct=0.50, dot.ignition=1.00, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | max-stack direct bypass treated as steady-state |
| Apprentice / Ember mage / Harbinger / Pyromancer | Earthsunder Maul +3 | 498 | 0.00 | 0.42 | 2381 | 172 | 159 | 6.00 | 4.00% | dot.conversion-pct=0.50, dot.fan-the-flames=1.00, dot.max-stacks=6.00 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Hexblade / Cinder Lord | Earthsunder Maul +3 | 502 | 0.00 | 0.46 | 2174 | 12.0 | 176 | 15.0 | 10.0% | dot.conflagration=1.00, dot.conversion-pct=0.50, dot.max-stacks=6.00, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Ember mage / Hexblade / Firebrand | Earthsunder Maul +3 | 502 | 0.00 | 0.46 | 2174 | 12.0 | 176 | 15.0 | 10.0% | dot.conversion-pct=0.50, dot.ignition=1.00, dot.max-stacks=6.00, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | max-stack direct bypass treated as steady-state |
| Apprentice / Ember mage / Hexblade / Pyromancer | Earthsunder Maul +3 | 502 | 0.00 | 0.46 | 2174 | 12.0 | 176 | 15.0 | 10.0% | dot.conversion-pct=0.50, dot.fan-the-flames=1.00, dot.max-stacks=6.00, shared.damage-mult=0.10 | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Harbinger / Icebreaker | Earthsunder Maul +3 | 499 | 0.00 | 0.34 | 2941 | 172 | 175 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00, dot.rimeshatter=1.00 | DoT cap 3 stacks, tick 2000ms | max-stack direct bypass treated as steady-state |
| Apprentice / Rime-Bound / Harbinger / Wind Spirit | Earthsunder Maul +3 | 499 | 0.00 | 0.34 | 2941 | 172 | 175 | 9.00 | 10.0% | dot.conversion-pct=1.00, dot.frostbite-dot-taken-pct=0.02, dot.frostbite-duration-ms=4000, dot.frostbite-max-stacks=10.0, dot.max-stacks=3.00, dot.mechanic-mult=1.10, dot.wind-spirit=1.00 | DoT cap 3 stacks, tick 2000ms | wind spirit frostbite estimated at 1.36 steady stacks |
| Apprentice / Rime-Bound / Harbinger / Winter Warden | Earthsunder Maul +3 | 499 | 0.00 | 0.34 | 2941 | 172 | 175 | 9.00 | 10.0% | dot.conversion-pct=0.70, dot.freezing-cold=1.00, dot.max-stacks=3.00 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Rime-Bound / Hexblade / Icebreaker | Earthsunder Maul +3 | 503 | 0.00 | 0.38 | 2632 | 12.0 | 192 | 18.0 | 16.0% | dot.conversion-pct=0.70, dot.max-stacks=3.00, dot.rimeshatter=1.00, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | max-stack direct bypass treated as steady-state |
| Apprentice / Rime-Bound / Hexblade / Wind Spirit | Earthsunder Maul +3 | 503 | 0.00 | 0.38 | 2632 | 12.0 | 192 | 18.0 | 16.0% | dot.conversion-pct=1.00, dot.frostbite-dot-taken-pct=0.02, dot.frostbite-duration-ms=4000, dot.frostbite-max-stacks=10.0, dot.max-stacks=3.00, dot.mechanic-mult=1.10, dot.wind-spirit=1.00, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | wind spirit frostbite estimated at 1.52 steady stacks |
| Apprentice / Rime-Bound / Hexblade / Winter Warden | Earthsunder Maul +3 | 503 | 0.00 | 0.38 | 2632 | 12.0 | 192 | 18.0 | 16.0% | dot.conversion-pct=0.70, dot.freezing-cold=1.00, dot.max-stacks=3.00, shared.damage-mult=0.10 | DoT cap 3 stacks, tick 2000ms | dot steady-state hit estimate |
| Apprentice / Venom vessel / Harbinger / Cultist | Earthsunder Maul +3 | 497 | 0.00 | 0.50 | 2000 | 172 | 149 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.eternal-doom=1.00, dot.max-stacks=8.00, dot.tick-interval-ms=500 | DoT cap 8 stacks, tick 500ms | eternal doom capped to 40 steady stacks for report sanity |
| Apprentice / Venom vessel / Harbinger / Venomslinger | Earthsunder Maul +3 | 497 | 0.00 | 0.50 | 2000 | 172 | 149 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.max-stacks=8.00, dot.poison-explosion=1.00 | DoT cap 8 stacks, tick 1000ms | poison explosion averaged every 10 stacks |
| Apprentice / Venom vessel / Harbinger / Zealot | Abyssal Axe +3 | 229 | 0.00 | 1.44 | 696 | 172 | 149 | 3.00 | 4.00% | dot.conversion-pct=0.30, dot.frenzy=1.00, dot.max-stacks=8.00 | DoT cap 8 stacks, tick 1000ms | frenzy estimated at high uptime; execute averaged over final 20% HP; dead swing every 4 hits |
| Apprentice / Venom vessel / Hexblade / Cultist | Earthsunder Maul +3 | 501 | 0.00 | 0.54 | 1852 | 12.0 | 166 | 12.0 | 10.0% | dot.conversion-pct=0.30, dot.eternal-doom=1.00, dot.max-stacks=8.00, dot.tick-interval-ms=500, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 500ms | eternal doom capped to 40 steady stacks for report sanity |
| Apprentice / Venom vessel / Hexblade / Venomslinger | Earthsunder Maul +3 | 501 | 0.00 | 0.54 | 1852 | 12.0 | 166 | 12.0 | 10.0% | dot.conversion-pct=0.30, dot.max-stacks=8.00, dot.poison-explosion=1.00, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 1000ms | poison explosion averaged every 10 stacks |
| Apprentice / Venom vessel / Hexblade / Zealot | Eruption Lash +3 | 132 | 0.00 | 2.92 | 412 | 12.0 | 166 | 12.0 | 10.0% | dot.conversion-pct=0.30, dot.frenzy=1.00, dot.max-stacks=8.00, shared.damage-mult=0.10 | DoT cap 8 stacks, tick 1000ms | frenzy estimated at high uptime |
| Slinger / Artillerist / Breacher / Cannoneer | Glacial Rimebrand +3 | 207 | 0.00 | 1.26 | 641 | 12.0 | 169 | 13.0 | 6.00% | reload.acquire-radius-mult=2.50, reload.cannon=1.00, reload.cannon-damage-per-shot=0.50, reload.max-ammo=20.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | 20 shots, 3000ms reload, 1.26 effective shots/s | cannon stored pool averaged per shot; rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Artillerist / Breacher / Melter | Earthsunder Maul +3 | 519 | 0.00 | 0.00 | 962 | 12.0 | 169 | 13.0 | 6.00% | reload.acquire-radius-mult=2.50, reload.laser=1.00, reload.laser-cool-per-tick=2.50, reload.laser-damage-per-tick-pct=0.18, reload.laser-heat-per-tick=2.00, reload.max-ammo=20.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | laser heat/cool duty cycle | laser heat/cool duty cycle estimated |
| Slinger / Artillerist / Breacher / Warmonger | Deathfang Rapier +3 | 79.0 | 54.0 | 3.39 | 220 | 12.0 | 169 | 13.0 | 6.00% | reload.acquire-radius-mult=2.50, reload.hair-trigger=1.00, reload.hair-trigger-max-stacks=15.0, reload.hair-trigger-pct-per-shot=0.05, reload.max-ammo=40.0, reload.reload-time-ms=3000, shared.damage-mult=0.10 | 40 shots, 3000ms reload, 3.39 effective shots/s | reload steady-state hit estimate |
| Slinger / Artillerist / Deadeye / Cannoneer | Glacial Rimebrand +3 | 204 | 0.00 | 1.18 | 695 | 212 | 152 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.cannon=1.00, reload.cannon-damage-per-shot=0.50, reload.max-ammo=20.0, reload.reload-time-ms=3000 | 20 shots, 3000ms reload, 1.18 effective shots/s | cannon stored pool averaged per shot; rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Artillerist / Deadeye / Melter | Earthsunder Maul +3 | 515 | 0.00 | 0.00 | 1042 | 212 | 152 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.laser=1.00, reload.laser-cool-per-tick=2.50, reload.laser-damage-per-tick-pct=0.18, reload.laser-heat-per-tick=2.00, reload.max-ammo=20.0, reload.reload-time-ms=3000 | laser heat/cool duty cycle | laser heat/cool duty cycle estimated |
| Slinger / Artillerist / Deadeye / Warmonger | Deathfang Rapier +3 | 77.0 | 54.0 | 3.19 | 238 | 212 | 152 | 6.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.hair-trigger=1.00, reload.hair-trigger-max-stacks=15.0, reload.hair-trigger-pct-per-shot=0.05, reload.max-ammo=40.0, reload.reload-time-ms=3000 | 40 shots, 3000ms reload, 3.19 effective shots/s | reload steady-state hit estimate |
| Slinger / Marksman / Breacher / Blunderbuss | Earthsunder Maul +3 | 336 | 0.00 | 3.42 | 926 | 12.0 | 163 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.blunderbuss=1.00, reload.blunderbuss-damage-mult=-0.50, reload.blunderbuss-knockback-distance-per-pellet=7.00, reload.blunderbuss-knockback-ms-per-pellet=14.0, reload.blunderbuss-spread-rad=0.65, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 3.42 effective shots/s | blunderbuss modeled as full-magazine single-target volley at 50% pellet damage |
| Slinger / Marksman / Breacher / Bounty hunter | Glacial Rimebrand +3 | 206 | 0.00 | 1.22 | 618 | 12.0 | 163 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.death-mark=1.00, reload.death-mark-detonate-mult=0.65, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 1.22 effective shots/s | death mark detonation averaged per clip; rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Marksman / Breacher / Dualslinger | Deathfang Rapier +3 | 78.0 | 74.0 | 2.43 | 212 | 12.0 | 163 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.alternating-cadence=1.00, reload.alternating-onhit-per-tier=20.0, reload.max-ammo=10.0, reload.reload-time-ms=2000, shared.damage-mult=0.10 | 10 shots, 2000ms reload, 2.43 effective shots/s | dual shots averaged 50/50 |
| Slinger / Marksman / Deadeye / Blunderbuss | Earthsunder Maul +3 | 333 | 0.00 | 3.33 | 1000 | 112 | 146 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.blunderbuss=1.00, reload.blunderbuss-damage-mult=-0.50, reload.blunderbuss-knockback-distance-per-pellet=7.00, reload.blunderbuss-knockback-ms-per-pellet=14.0, reload.blunderbuss-spread-rad=0.65, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 3.33 effective shots/s | blunderbuss modeled as full-magazine single-target volley at 50% pellet damage |
| Slinger / Marksman / Deadeye / Bounty hunter | Glacial Rimebrand +3 | 203 | 0.00 | 1.15 | 667 | 212 | 146 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.death-mark=1.00, reload.death-mark-detonate-mult=0.65, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 1.15 effective shots/s | death mark detonation averaged per clip; rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Marksman / Deadeye / Dualslinger | Deathfang Rapier +3 | 76.0 | 74.0 | 2.33 | 229 | 212 | 146 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.alternating-cadence=1.00, reload.alternating-onhit-per-tier=20.0, reload.max-ammo=10.0, reload.reload-time-ms=2000 | 10 shots, 2000ms reload, 2.33 effective shots/s | dual shots averaged 50/50 |
| Slinger / Scout / Breacher / Desperado | Deathfang Rapier +3 | 77.0 | 54.0 | 3.13 | 200 | 12.0 | 153 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.momentum=1.00, reload.momentum-aps-per-stack=0.06, reload.momentum-max-stacks=5.00, reload.momentum-reload-reduction=0.10, reload.reload-time-ms=1200, shared.damage-mult=0.10 | 5 shots, 1200ms reload, 3.13 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout / Breacher / Duelist | Glacial Rimebrand +3 | 204 | 0.00 | 1.34 | 545 | 12.0 | 153 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.empowered-mult=3.50, reload.exploding-clip=1.00, reload.max-ammo=6.00, reload.reload-time-ms=1200, shared.damage-mult=0.10 | 6 shots, 1200ms reload, 1.34 effective shots/s | rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Scout / Breacher / Sniper | Earthsunder Maul +3 | 788 | 0.00 | 0.42 | 2000 | 12.0 | 153 | 9.00 | 6.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=3.00, reload.reload-time-ms=1200, reload.snipe=1.00, reload.snipe-as-to-dmg=1.00, reload.snipe-cadence-ms=2000, reload.snipe-fullhp-mult=4.00, shared.damage-mult=0.10 | 3 shots, 1200ms reload, 0.42 effective shots/s | sniper full-HP bonus amortized once per report horizon |
| Slinger / Scout / Deadeye / Desperado | Deathfang Rapier +3 | 74.0 | 54.0 | 3.13 | 200 | 212 | 136 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=5.00, reload.momentum=1.00, reload.momentum-aps-per-stack=0.06, reload.momentum-max-stacks=5.00, reload.momentum-reload-reduction=0.10, reload.reload-time-ms=1200 | 5 shots, 1200ms reload, 3.13 effective shots/s | reload steady-state hit estimate |
| Slinger / Scout / Deadeye / Duelist | Glacial Rimebrand +3 | 202 | 0.00 | 1.28 | 583 | 212 | 136 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.empowered-mult=3.50, reload.exploding-clip=1.00, reload.max-ammo=6.00, reload.reload-time-ms=1200 | 6 shots, 1200ms reload, 1.28 effective shots/s | rimebrand-burn reservoir DoT from weapon profile |
| Slinger / Scout / Deadeye / Sniper | Earthsunder Maul +3 | 731 | 0.00 | 0.42 | 2000 | 212 | 136 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50, reload.max-ammo=3.00, reload.reload-time-ms=1200, reload.snipe=1.00, reload.snipe-as-to-dmg=1.00, reload.snipe-cadence-ms=2000, reload.snipe-fullhp-mult=4.00 | 3 shots, 1200ms reload, 0.42 effective shots/s | sniper full-HP bonus amortized once per report horizon |
| Spirit / Phantasm / Haunt / Invoker | Eruption Lash +3 | 127 | 0.00 | 2.26 | 530 | 12.0 | 153 | 10.0 | 8.00% | energy.critical-mass=1.00, energy.empowered-mult=6.00, energy.per-hit=10.0, shared.damage-mult=0.10 | discharge every 11 hits (0.21/s) | energy steady-state hit estimate |
| Spirit / Phantasm / Haunt / Tempest | Eruption Lash +3 | 127 | 0.00 | 2.26 | 530 | 12.0 | 153 | 10.0 | 8.00% | energy.empowered-mult=6.00, energy.endless-storm=1.00, energy.per-hit=10.0, shared.damage-mult=0.10 | discharge every 11 hits (0.21/s) | endless storm DoT budget included per discharge |
| Spirit / Phantasm / Haunt / Voidwalker | Eruption Lash +3 | 127 | 0.00 | 2.26 | 530 | 12.0 | 153 | 10.0 | 8.00% | energy.empowered-mult=6.00, energy.max-bonus=100, energy.per-hit=30.0, energy.singularity-execute=1.00, shared.damage-mult=0.10 | discharge every 8 hits (0.28/s) | energy steady-state hit estimate |
| Spirit / Phantasm / Wisp / Invoker | Abyssal Axe +3 | 224 | 0.00 | 1.09 | 916 | 222 | 136 | 4.00 | 2.00% | energy.critical-mass=1.00, energy.empowered-mult=6.00, energy.per-hit=10.0 | discharge every 11 hits (0.10/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Spirit / Phantasm / Wisp / Tempest | Eruption Lash +3 | 123 | 0.00 | 2.05 | 585 | 222 | 136 | 4.00 | 2.00% | energy.empowered-mult=6.00, energy.endless-storm=1.00, energy.per-hit=10.0 | discharge every 11 hits (0.19/s) | endless storm DoT budget included per discharge |
| Spirit / Phantasm / Wisp / Voidwalker | Eruption Lash +3 | 123 | 0.00 | 2.05 | 585 | 222 | 136 | 4.00 | 2.00% | energy.empowered-mult=6.00, energy.max-bonus=100, energy.per-hit=30.0, energy.singularity-execute=1.00 | discharge every 8 hits (0.26/s) | energy steady-state hit estimate |
| Spirit / Spark / Haunt / Channeler | Eruption Lash +3 | 129 | 0.00 | 3.24 | 371 | 12.0 | 141 | 8.00 | 6.00% | energy.empowered-mult=1.50, energy.per-hit=20.0, energy.upkeep=1.00, shared.damage-mult=0.10 | discharge every 6 hits (0.54/s) | energy steady-state hit estimate |
| Spirit / Spark / Haunt / Stormdancer | Eruption Lash +3 | 129 | 0.00 | 3.24 | 371 | 12.0 | 141 | 8.00 | 6.00% | energy.empowered-mult=1.50, energy.flash=1.00, energy.per-hit=20.0, shared.damage-mult=0.10 | discharge every 6 hits (0.54/s) | energy steady-state hit estimate |
| Spirit / Spark / Haunt / Surge | Deathfang Rapier +3 | 102 | 54.0 | 2.62 | 381 | 12.0 | 141 | 8.00 | 6.00% | energy.empowered-mult=1.50, energy.overdrive=1.00, energy.per-hit=20.0, shared.damage-mult=0.10 | discharge every 6 hits (0.44/s) | surge overdrive approximated as 35% steady attack gain |
| Spirit / Spark / Wisp / Channeler | Abyssal Axe +3 | 226 | 0.00 | 1.61 | 621 | 222 | 124 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.per-hit=20.0, energy.upkeep=1.00 | discharge every 6 hits (0.27/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Spirit / Spark / Wisp / Stormdancer | Abyssal Axe +3 | 226 | 0.00 | 1.61 | 621 | 222 | 124 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.flash=1.00, energy.per-hit=20.0 | discharge every 6 hits (0.27/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Spirit / Spark / Wisp / Surge | Deathfang Rapier +3 | 98.0 | 54.0 | 2.45 | 408 | 222 | 124 | 2.00 | 0.00% | energy.empowered-mult=1.50, energy.overdrive=1.00, energy.per-hit=20.0 | discharge every 6 hits (0.41/s) | surge overdrive approximated as 35% steady attack gain |
| Spirit / Wraith / Haunt / Aetherist | Eruption Lash +3 | 129 | 0.00 | 3.02 | 397 | 12.0 | 140 | 9.00 | 6.00% | energy.charge-state=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.34/s) | energy steady-state hit estimate |
| Spirit / Wraith / Haunt / Equinox | Eruption Lash +3 | 129 | 0.00 | 3.02 | 397 | 12.0 | 140 | 9.00 | 6.00% | energy.binary-cycle=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.34/s) | energy steady-state hit estimate |
| Spirit / Wraith / Haunt / Stormbringer | Eruption Lash +3 | 129 | 0.00 | 3.02 | 397 | 12.0 | 140 | 9.00 | 6.00% | energy.awakened-lightning=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0, shared.damage-mult=0.10 | discharge every 9 hits (0.34/s) | awakened lightning next-three empowered hits included |
| Spirit / Wraith / Wisp / Aetherist | Abyssal Axe +3 | 226 | 0.00 | 1.49 | 669 | 222 | 123 | 3.00 | 0.00% | energy.charge-state=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.17/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Spirit / Wraith / Wisp / Equinox | Abyssal Axe +3 | 226 | 0.00 | 1.49 | 669 | 222 | 123 | 3.00 | 0.00% | energy.binary-cycle=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.17/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Spirit / Wraith / Wisp / Stormbringer | Eruption Lash +3 | 125 | 0.00 | 2.80 | 428 | 222 | 123 | 3.00 | 0.00% | energy.awakened-lightning=1.00, energy.empowered-mult=2.00, energy.per-hit=14.0 | discharge every 9 hits (0.31/s) | awakened lightning next-three empowered hits included |
| Squire / Bulwark / Sentinel / Avenger | Warmaul +3 | 377 | 0.00 | 0.44 | 2273 | 132 | 190 | 10.0 | 11.0% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50, cooldown.vengeance=1.00, cooldown.vengeance-floor=30.0, cooldown.vengeance-mult=1.50 | empowered every 8.00s (0.13/s) | vengeance uses floor only; incoming damage is not modeled |
| Squire / Bulwark / Sentinel / Destroyer | Warmaul +3 | 377 | 0.00 | 0.44 | 2273 | 132 | 190 | 10.0 | 11.0% | cooldown.empowered-cd-ms=4000, cooldown.empowered-mult=3.50, cooldown.singular-extraction=1.00 | empowered every 4.00s (0.25/s) | singular extraction: normal direct damage suppressed |
| Squire / Bulwark / Sentinel / Devout Priest | Earthsunder Maul +3 | 507 | 0.00 | 0.32 | 3125 | 132 | 190 | 10.0 | 11.0% | cooldown.channeled-beam=1.00, cooldown.channeled-beam-mult=1.00, cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50 | empowered every 8.00s (0.13/s) | channeled beam estimated as six 500 ms ticks |
| Squire / Bulwark / Vanguard / Avenger | Warmaul +3 | 381 | 0.00 | 0.50 | 2020 | 12.0 | 207 | 20.0 | 17.0% | cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50, cooldown.vengeance=1.00, cooldown.vengeance-floor=30.0, cooldown.vengeance-mult=1.50, shared.damage-mult=0.10 | empowered every 8.00s (0.13/s) | vengeance uses floor only; incoming damage is not modeled |
| Squire / Bulwark / Vanguard / Destroyer | Warmaul +3 | 381 | 0.00 | 0.50 | 2020 | 12.0 | 207 | 20.0 | 17.0% | cooldown.empowered-cd-ms=4000, cooldown.empowered-mult=3.50, cooldown.singular-extraction=1.00, shared.damage-mult=0.10 | empowered every 4.00s (0.25/s) | singular extraction: normal direct damage suppressed |
| Squire / Bulwark / Vanguard / Devout Priest | Earthsunder Maul +3 | 511 | 0.00 | 0.36 | 2778 | 12.0 | 207 | 20.0 | 17.0% | cooldown.channeled-beam=1.00, cooldown.channeled-beam-mult=1.00, cooldown.empowered-cd-ms=8000, cooldown.empowered-mult=3.50, shared.damage-mult=0.10 | empowered every 8.00s (0.13/s) | channeled beam estimated as six 500 ms ticks |
| Squire / Knight / Sentinel / Dynamo | Warmaul +3 | 371 | 0.00 | 0.58 | 1731 | 132 | 178 | 8.00 | 11.0% | cooldown.battery=1.00, cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Knight / Sentinel / Reverb | Warmaul +3 | 371 | 0.00 | 0.58 | 1731 | 132 | 178 | 8.00 | 11.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, cooldown.reverb=1.00, cooldown.reverb-bonus-per-attack=0.04 | empowered every 7.00s (0.14/s) | reverb next-window bonus estimated |
| Squire / Knight / Sentinel / Stalwart | Warmaul +3 | 371 | 0.00 | 0.58 | 1731 | 132 | 178 | 8.00 | 11.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, cooldown.patience-paid=1.00 | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Squire / Knight / Vanguard / Dynamo | Abyssal Axe +3 | 237 | 0.00 | 1.32 | 757 | 12.0 | 195 | 18.0 | 17.0% | cooldown.battery=1.00, cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Squire / Knight / Vanguard / Reverb | Abyssal Axe +3 | 237 | 0.00 | 1.32 | 757 | 12.0 | 195 | 18.0 | 17.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, cooldown.reverb=1.00, cooldown.reverb-bonus-per-attack=0.04, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | reverb next-window bonus estimated; execute averaged over final 20% HP; dead swing every 4 hits |
| Squire / Knight / Vanguard / Stalwart | Abyssal Axe +3 | 237 | 0.00 | 1.32 | 757 | 12.0 | 195 | 18.0 | 17.0% | cooldown.empowered-cd-ms=7000, cooldown.empowered-mult=2.00, cooldown.patience-paid=1.00, shared.damage-mult=0.10 | empowered every 7.00s (0.14/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Squire / Warrior / Sentinel / Assassin | Eruption Lash +3 | 132 | 0.00 | 2.74 | 438 | 132 | 164 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.overdrive=1.00 | empowered every 5.00s (0.20/s) | overdrive attack-speed buff averaged |
| Squire / Warrior / Sentinel / Sunderer | Abyssal Axe +3 | 233 | 0.00 | 1.46 | 685 | 132 | 164 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.rupture=1.00, cooldown.rupture-dr-pierce=0.10 | empowered every 5.00s (0.20/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Squire / Warrior / Sentinel / Transcendant | Abyssal Axe +3 | 233 | 0.00 | 1.46 | 685 | 132 | 164 | 5.00 | 8.00% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.eternal-cycle=1.00, cooldown.eternal-cycle-flat=8.00 | empowered every 5.00s (0.20/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Squire / Warrior / Vanguard / Assassin | Eruption Lash +3 | 136 | 0.00 | 2.96 | 406 | 12.0 | 181 | 15.0 | 14.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.overdrive=1.00, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | overdrive attack-speed buff averaged |
| Squire / Warrior / Vanguard / Sunderer | Abyssal Axe +3 | 237 | 0.00 | 1.57 | 635 | 12.0 | 181 | 15.0 | 14.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.rupture=1.00, cooldown.rupture-dr-pierce=0.10, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Squire / Warrior / Vanguard / Transcendant | Abyssal Axe +3 | 237 | 0.00 | 1.57 | 635 | 12.0 | 181 | 15.0 | 14.0% | cooldown.empowered-cd-ms=5000, cooldown.empowered-mult=1.50, cooldown.eternal-cycle=1.00, cooldown.eternal-cycle-flat=8.00, shared.damage-mult=0.10 | empowered every 5.00s (0.20/s) | execute averaged over final 20% HP; dead swing every 4 hits |
| Striker / Breaker / In-Fighter / Berserker | Eruption Lash +3 | 132 | 0.00 | 1.94 | 618 | 12.0 | 179 | 16.0 | 12.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, cadence.rampage=1.00, shared.damage-mult=0.10 | finisher every 6 hits (0.32/s) | cadence steady-state hit estimate |
| Striker / Breaker / In-Fighter / Hemomancer | Eruption Lash +3 | 132 | 0.00 | 1.94 | 618 | 12.0 | 179 | 16.0 | 12.0% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, cadence.hemorrhage=1.00, shared.damage-mult=0.10 | finisher every 6 hits (0.32/s) | hemorrhage converts finishers to bleed |
| Striker / Breaker / In-Fighter / Juggernaut | Eruption Lash +3 | 132 | 0.00 | 1.94 | 618 | 12.0 | 179 | 16.0 | 12.0% | cadence.crescendo=1.00, cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, shared.damage-mult=0.10 | finisher every 6 hits (0.32/s) | cadence steady-state hit estimate |
| Striker / Breaker / Phantom-Blade / Berserker | Eruption Lash +3 | 128 | 0.00 | 1.73 | 695 | 132 | 162 | 8.00 | 6.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, cadence.rampage=1.00 | finisher every 6 hits (0.29/s) | cadence steady-state hit estimate |
| Striker / Breaker / Phantom-Blade / Hemomancer | Eruption Lash +3 | 128 | 0.00 | 1.73 | 695 | 132 | 162 | 8.00 | 6.00% | cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00, cadence.hemorrhage=1.00 | finisher every 6 hits (0.29/s) | hemorrhage converts finishers to bleed |
| Striker / Breaker / Phantom-Blade / Juggernaut | Eruption Lash +3 | 128 | 0.00 | 1.73 | 695 | 132 | 162 | 8.00 | 6.00% | cadence.crescendo=1.00, cadence.empowered-mult=4.00, cadence.empowered-threshold=6.00 | finisher every 6 hits (0.29/s) | cadence steady-state hit estimate |
| Striker / Flurry / In-Fighter / Scrapper | Eruption Lash +3 | 132 | 0.00 | 3.05 | 394 | 12.0 | 157 | 12.0 | 10.0% | cadence.debuff-plating-shred=5.00, cadence.debuff-shred-cap=20.0, cadence.debuff-vuln-ms=5000, cadence.debuff-vuln-pct=25.0, cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, shared.damage-mult=0.10 | finisher every 4 hits (0.76/s) | cursed finale vulnerability treated as steady-state |
| Striker / Flurry / In-Fighter / Shockblade | Eruption Lash +3 | 132 | 10.0 | 3.05 | 394 | 12.0 | 157 | 12.0 | 10.0% | cadence.aftershock=1.00, cadence.aftershock-onhit-per-tier=10.0, cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, shared.damage-mult=0.10 | finisher every 4 hits (0.76/s) | cadence steady-state hit estimate |
| Striker / Flurry / In-Fighter / Swiftblade | Eruption Lash +3 | 132 | 0.00 | 3.05 | 394 | 12.0 | 157 | 12.0 | 10.0% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, cadence.trigger-count=2.00, shared.damage-mult=0.10 | finisher every 4 hits (0.76/s) | cadence steady-state hit estimate |
| Striker / Flurry / Phantom-Blade / Scrapper | Eruption Lash +3 | 128 | 0.00 | 2.83 | 424 | 132 | 140 | 4.00 | 4.00% | cadence.debuff-plating-shred=5.00, cadence.debuff-shred-cap=20.0, cadence.debuff-vuln-ms=5000, cadence.debuff-vuln-pct=25.0, cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.71/s) | cursed finale vulnerability treated as steady-state |
| Striker / Flurry / Phantom-Blade / Shockblade | Eruption Lash +3 | 128 | 10.0 | 2.83 | 424 | 132 | 140 | 4.00 | 4.00% | cadence.aftershock=1.00, cadence.aftershock-onhit-per-tier=10.0, cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00 | finisher every 4 hits (0.71/s) | cadence steady-state hit estimate |
| Striker / Flurry / Phantom-Blade / Swiftblade | Eruption Lash +3 | 128 | 0.00 | 2.83 | 424 | 132 | 140 | 4.00 | 4.00% | cadence.empowered-mult=1.50, cadence.empowered-threshold=4.00, cadence.trigger-count=2.00 | finisher every 4 hits (0.71/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / In-Fighter / Justicar | Eruption Lash +3 | 133 | 0.00 | 2.48 | 483 | 12.0 | 171 | 13.0 | 10.0% | cadence.detonation=1.00, cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, shared.damage-mult=0.10 | finisher every 5 hits (0.50/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / In-Fighter / Maestro | Eruption Lash +3 | 133 | 0.00 | 2.48 | 483 | 12.0 | 171 | 13.0 | 10.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, cadence.metronome=1.00, cadence.metronome-flat=12.0, shared.damage-mult=0.10 | finisher every 5 hits (0.50/s) | metronome flat cycle estimate |
| Striker / Skirmisher / In-Fighter / Wavecrest | Eruption Lash +3 | 133 | 0.00 | 2.48 | 483 | 12.0 | 171 | 13.0 | 10.0% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, cadence.momentum-buildup=0.20, cadence.momentum-echo=4.00, shared.damage-mult=0.10 | finisher every 5 hits (0.50/s) | wavecrest resonance/echo steady estimate |
| Striker / Skirmisher / Phantom-Blade / Justicar | Eruption Lash +3 | 129 | 0.00 | 2.26 | 530 | 132 | 154 | 5.00 | 4.00% | cadence.detonation=1.00, cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00 | finisher every 5 hits (0.45/s) | cadence steady-state hit estimate |
| Striker / Skirmisher / Phantom-Blade / Maestro | Eruption Lash +3 | 129 | 0.00 | 2.26 | 530 | 132 | 154 | 5.00 | 4.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, cadence.metronome=1.00, cadence.metronome-flat=12.0 | finisher every 5 hits (0.45/s) | metronome flat cycle estimate |
| Striker / Skirmisher / Phantom-Blade / Wavecrest | Eruption Lash +3 | 129 | 0.00 | 2.26 | 530 | 132 | 154 | 5.00 | 4.00% | cadence.empowered-mult=2.00, cadence.empowered-threshold=5.00, cadence.momentum-buildup=0.20, cadence.momentum-echo=4.00 | finisher every 5 hits (0.45/s) | wavecrest resonance/echo steady estimate |


## 4. Weapon Input Table (+0 and +3)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Abyssal Axe | +0 | attack=120 | weapon.dead-swing-interval=4.00, weapon.execute-dmg-mult=2.50, weapon.execute-threshold-pct=0.20 | 1.15 APS base | explicit steps 0/3 |
| Abyssal Axe | +3 | attack=192 | weapon.dead-swing-interval=4.00, weapon.execute-dmg-mult=2.50, weapon.execute-threshold-pct=0.20 | 1.15 APS base | explicit steps 3/3 |
| Deathfang Rapier | +0 | attack=34.0, onHitDamage=30.0 | - | 1.75 APS base | explicit steps 0/3 |
| Deathfang Rapier | +3 | attack=64.0, onHitDamage=54.0 | - | 1.75 APS base | explicit steps 3/3 |
| Earthsunder Maul | +0 | attack=280 | - | 0.40 APS base | explicit steps 0/3 |
| Earthsunder Maul | +3 | attack=460 | - | 0.40 APS base | explicit steps 3/3 |
| Eruption Lash | +0 | attack=58.0 | weapon.flurry-pct=0.04, weapon.flurry-stacks=5.00 | 1.80 APS base | explicit steps 0/3 |
| Eruption Lash | +3 | attack=91.0 | weapon.flurry-pct=0.04, weapon.flurry-stacks=5.00 | 1.80 APS base | explicit steps 3/3 |
| Glacial Rimebrand | +0 | attack=155 | weapon.dot-conversion-pct=0.70, weapon.dot-stacks=3.00 | 0.60 APS base; rimebrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 0/3 |
| Glacial Rimebrand | +3 | attack=260 | weapon.dot-conversion-pct=0.70, weapon.dot-stacks=3.00 | 0.60 APS base; rimebrand-burn DoT reservoir 70.0% conversion x1.50 | explicit steps 3/3 |
| Glacial Tyrant Maul | +0 | attack=200 | weapon.brittle-dr=0.01, weapon.brittle-plating=3.00, weapon.brittle-shatter-dr-strip-ms=2000, weapon.brittle-shatter-threshold=8.00, weapon.brittle-stacks=8.00 | 0.50 APS base | explicit steps 0/3 |
| Glacial Tyrant Maul | +3 | attack=350 | weapon.brittle-dr=0.01, weapon.brittle-plating=3.00, weapon.brittle-shatter-dr-strip-ms=2000, weapon.brittle-shatter-threshold=8.00, weapon.brittle-stacks=8.00 | 0.50 APS base | explicit steps 3/3 |
| Plague Axe | +0 | attack=120 | weapon.dead-swing-interval=3.00, weapon.dead-swing-vuln-ms=4000, weapon.dead-swing-vuln-pct=0.20 | 1.10 APS base | explicit steps 0/3 |
| Plague Axe | +3 | attack=210 | weapon.dead-swing-interval=3.00, weapon.dead-swing-vuln-ms=4000, weapon.dead-swing-vuln-pct=0.20 | 1.10 APS base | explicit steps 3/3 |
| Volcanic Blightbrand | +0 | attack=64.0 | weapon.dot-conversion-pct=0.50, weapon.dot-stacks=5.00 | 1.20 APS base; blightbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/3 |
| Volcanic Blightbrand | +3 | attack=106 | weapon.dot-conversion-pct=0.50, weapon.dot-stacks=5.00 | 1.20 APS base; blightbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 3/3 |
| Warmaul | +0 | attack=180 | weapon.empowered-mult-bonus=0.60 | 0.55 APS base | explicit steps 0/3 |
| Warmaul | +3 | attack=330 | weapon.empowered-mult-bonus=0.60 | 0.55 APS base | explicit steps 3/3 |
| Zenith Cross | +0 | attack=100 | weapon.first-strike-mult=3.00 | 0.80 APS base | explicit steps 0/3 |
| Zenith Cross | +3 | attack=160 | weapon.first-strike-mult=3.00 | 0.80 APS base | explicit steps 3/3 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit / Phantasm / Haunt / Tempest | Eruption Lash +3 | 602 | 269 | 124 | 209 | 0.00 | - |
| Striker / Skirmisher / In-Fighter / Wavecrest | Eruption Lash +3 | 596 | 310 | 286 | 0.00 | 0.00 | - |
| Apprentice / Venom vessel / Hexblade / Zealot | Eruption Lash +3 | 592 | 457 | 87.5 | 48.0 | 0.00 | - |
| Apprentice / Rime-Bound / Hexblade / Icebreaker | Earthsunder Maul +3 | 586 | 181 | 0.00 | 405 | 0.00 | - |
| Squire / Warrior / Vanguard / Assassin | Eruption Lash +3 | 581 | 379 | 202 | 0.00 | 0.00 | - |
| Apprentice / Rime-Bound / Hexblade / Wind Spirit | Earthsunder Maul +3 | 570 | 0.00 | 0.00 | 570 | 0.00 | - |
| Striker / Flurry / In-Fighter / Swiftblade | Eruption Lash +3 | 569 | 378 | 191 | 0.00 | 0.00 | - |
| Apprentice / Rime-Bound / Harbinger / Wind Spirit | Earthsunder Maul +3 | 564 | 0.00 | 0.00 | 564 | 0.00 | - |
| Apprentice / Rime-Bound / Harbinger / Icebreaker | Earthsunder Maul +3 | 562 | 160 | 0.00 | 402 | 0.00 | - |
| Striker / Skirmisher / In-Fighter / Maestro | Eruption Lash +3 | 551 | 310 | 241 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Striker / Breaker / Phantom-Blade / Berserker | Eruption Lash +3 | 312 | 207 | 105 | 0.00 | 0.00 | - |
| Striker / Breaker / Phantom-Blade / Juggernaut | Eruption Lash +3 | 312 | 207 | 105 | 0.00 | 0.00 | - |
| Squire / Knight / Sentinel / Dynamo | Warmaul +3 | 313 | 203 | 110 | 0.00 | 0.00 | - |
| Squire / Knight / Sentinel / Stalwart | Warmaul +3 | 313 | 203 | 110 | 0.00 | 0.00 | - |
| Slinger / Scout / Deadeye / Sniper | Earthsunder Maul +3 | 323 | 288 | 0.00 | 0.00 | 34.6 | - |
| Slinger / Scout / Deadeye / Duelist | Glacial Rimebrand +3 | 329 | 73.2 | 0.00 | 0.00 | 256 | - |
| Striker / Skirmisher / Phantom-Blade / Justicar | Eruption Lash +3 | 329 | 274 | 55.7 | 0.00 | 0.00 | - |
| Squire / Knight / Sentinel / Reverb | Warmaul +3 | 339 | 203 | 136 | 0.00 | 0.00 | - |
| Slinger / Marksman / Deadeye / Dualslinger | Deathfang Rapier +3 | 340 | 340 | 0.00 | 0.00 | 0.00 | - |
| Squire / Knight / Vanguard / Dynamo | Abyssal Axe +3 | 343 | 222 | 32.0 | 0.00 | 88.8 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 370 | 180 |
| Striker | 368 | 180 |
| Apprentice | 342 | 180 |
| Squire | 334 | 180 |
| Slinger | 327 | 180 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Abyssal Axe | 384 | 90 |
| Glacial Rimebrand | 377 | 90 |
| Warmaul | 376 | 90 |
| Earthsunder Maul | 364 | 90 |
| Eruption Lash | 354 | 90 |
| Deathfang Rapier | 348 | 90 |
| Glacial Tyrant Maul | 347 | 90 |
| Zenith Cross | 338 | 90 |
| Volcanic Blightbrand | 299 | 90 |
| Plague Axe | 296 | 90 |


Weapon DPS against target shapes:

| Weapon | neutral T4 dummy | high-plating T4 dummy | high-HP elite T4 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Abyssal Axe +3 | 384 | 296 | 296 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Deathfang Rapier +3 | 348 | 277 | 277 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Earthsunder Maul +3 | 364 | 299 | 299 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Eruption Lash +3 | 354 | 256 | 256 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Glacial Rimebrand +3 | 377 | 297 | 297 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Glacial Tyrant Maul +3 | 347 | 346 | 346 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Plague Axe +3 | 296 | 234 | 234 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Volcanic Blightbrand +3 | 299 | 221 | 221 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Warmaul +3 | 376 | 303 | 303 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |
| Zenith Cross +3 | 338 | 195 | 195 | neutral T4 dummy: 22 mob average, biome tier 3; high-plating T4 dummy: Elder Leviathan; high-HP elite T4 dummy: Elder Leviathan (also highest plating) |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Eruption Lash | 445 | 18 |
| Squire | Warmaul | 390 | 18 |
| Apprentice | Earthsunder Maul | 467 | 18 |
| Spirit | Eruption Lash | 435 | 18 |
| Slinger | Glacial Rimebrand | 399 | 18 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Earthsunder Maul | 305 | 18 |
| Squire | Plague Axe | 270 | 18 |
| Apprentice | Volcanic Blightbrand | 259 | 18 |
| Spirit | Earthsunder Maul | 317 | 18 |
| Slinger | Plague Axe | 257 | 18 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `awakened lightning next-three empowered hits included`, `blightbrand-burn reservoir DoT from weapon profile`, `blunderbuss modeled as full-magazine single-target volley at 50% pellet damage`, `cannon stored pool averaged per shot`, `channeled beam estimated as six 500 ms ticks`, `cursed finale vulnerability treated as steady-state`, `dead swing every 3 hits`, `dead swing every 4 hits`, `death mark detonation averaged per clip`, `dual shots averaged 50/50`, `endless storm DoT budget included per discharge`, `eternal doom capped to 40 steady stacks for report sanity`, `execute averaged over final 20% HP`, `first strike amortized over tier dummy HP`, `frenzy estimated at high uptime`, `hemorrhage converts finishers to bleed`, `laser heat/cool duty cycle estimated`, `max-stack direct bypass treated as steady-state`, `metronome flat cycle estimate`, `overdrive attack-speed buff averaged`, `poison explosion averaged every 10 stacks`, `reverb next-window bonus estimated`, `rimebrand-burn reservoir DoT from weapon profile`, `singular extraction: normal direct damage suppressed`, `sniper full-HP bonus amortized once per report horizon`, `surge overdrive approximated as 35% steady attack gain`, `vengeance uses floor only; incoming damage is not modeled`, `wavecrest resonance/echo steady estimate`, `wind spirit frostbite estimated at 1.36 steady stacks`, `wind spirit frostbite estimated at 1.52 steady stacks`, `wind spirit frostbite estimated at 1.70 steady stacks`, `wind spirit frostbite estimated at 1.87 steady stacks`, `wind spirit frostbite estimated at 1.90 steady stacks`, `wind spirit frostbite estimated at 2.04 steady stacks`, `wind spirit frostbite estimated at 2.09 steady stacks`, `wind spirit frostbite estimated at 2.28 steady stacks`, `wind spirit frostbite estimated at 2.72 steady stacks`, `wind spirit frostbite estimated at 3.04 steady stacks`, `wind spirit frostbite estimated at 3.74 steady stacks`, `wind spirit frostbite estimated at 3.91 steady stacks`, `wind spirit frostbite estimated at 4.08 steady stacks`, `wind spirit frostbite estimated at 4.18 steady stacks`, `wind spirit frostbite estimated at 4.37 steady stacks`, `wind spirit frostbite estimated at 4.56 steady stacks`, `wind spirit frostbite estimated at 5.95 steady stacks`, `wind spirit frostbite estimated at 6.66 steady stacks`, `wind spirit frostbite estimated at 7.34 steady stacks`, `wind spirit frostbite estimated at 8.20 steady stacks`.
