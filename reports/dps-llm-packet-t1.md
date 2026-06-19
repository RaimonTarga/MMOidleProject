# MMO Idle LLM Balance Packet - T1

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

- Report tier T1; class unlock tier 0; weapons are tier 1.
- DPS conclusions use +3 weapons only. Weapon input context includes +0 and +3.
- Target mobs come from biome spawn pools one tier below report tier; tutorial/test/interact/boss monsters are excluded.
- When the shifted target tier contains only tutorial/test content, the packet falls back to the first real non-tutorial biome tier.
- Single-target theoretical steady-state only: no movement, enemy attacks, deaths, sustain, AoE value, pathing, aggro, party effects, or eHP.
- Outliers/top/bottom use each class combination's optimal +3 weapon. Class/weapon averages use all +3 weapon samples.

## 2. Target Monster Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 1 fallback |
| Mob count | 10 |
| Average mob HP | 143 |
| Average plating | 0.80 |
| Average DR | 1.50% |
| Reference optimal-build average DPS | 101 |
| Target TTK at reference DPS | 1.41s |
| Expected DPS band | 67.6 - 151 |

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
| Apprentice | Chaotic Axe +3 | 82.0 | 0.00 | 1.10 | 909 | 72.0 | 135 | 3.00 | 4.00% | - | DoT cap 6 stacks, tick 1500ms | dead swing every 3 hits |
| Conduit | Chaotic Axe +3 | 80.0 | 0.00 | 1.10 | 909 | 162 | 120 | 2.00 | 0.00% | summoner.damage-sponge-pct=0.50, summoner.leash-mult=2.00, summoner.minion-attack-cooldown=1000, summoner.minion-count=3.00, summoner.minion-damage-pct=1.00, summoner.minion-hp-pct=0.45, summoner.minion-range=12.0, summoner.minion-respawn-ms=5000 | 3 minions at 1.00 APS each | 3 minions at 1.00 APS each; dead swing every 3 hits |
| Slinger | Chaotic Axe +3 | 50.0 | 0.00 | 1.86 | 379 | 132 | 124 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50 | 10 shots, 1600ms reload, 1.86 effective shots/s | dead swing every 3 hits |
| Spirit | Chaotic Axe +3 | 81.0 | 0.00 | 1.38 | 727 | 142 | 110 | 2.00 | 0.00% | - | discharge every 9 hits (0.15/s) | dead swing every 3 hits |
| Squire | Chaotic Axe +3 | 84.0 | 0.00 | 1.10 | 909 | 12.0 | 150 | 5.00 | 8.00% | - | empowered every 7.00s (0.14/s) | dead swing every 3 hits |
| Striker | Chaotic Axe +3 | 82.0 | 0.00 | 1.10 | 909 | 12.0 | 130 | 4.00 | 4.00% | - | finisher every 5 hits (0.22/s) | dead swing every 3 hits |


## 4. Weapon Input Table (+0 and +3)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Ashbrand Blade | +0 | attack=7.00 | weapon.dot-conversion-pct=0.30, weapon.dot-stacks=5.00 | 0.75 APS base; ashbrand-burn DoT reservoir 30.0% conversion x1.15 | explicit steps 0/3 |
| Ashbrand Blade | +3 | attack=16.0 | weapon.dot-conversion-pct=0.30, weapon.dot-stacks=5.00 | 0.75 APS base; ashbrand-burn DoT reservoir 30.0% conversion x1.15 | explicit steps 3/3 |
| Chaotic Axe | +0 | attack=25.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 0/3 |
| Chaotic Axe | +3 | attack=55.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 3/3 |
| Flash Rapier | +0 | attack=5.00 | - | 1.50 APS base | explicit steps 0/3 |
| Flash Rapier | +3 | attack=11.0 | - | 1.50 APS base | explicit steps 3/3 |
| Heavy Hammer | +0 | attack=16.0 | - | 0.40 APS base | explicit steps 0/3 |
| Heavy Hammer | +3 | attack=34.0 | - | 0.40 APS base | explicit steps 3/3 |
| Iron Broadsword | +0 | attack=8.00 | - | 0.65 APS base | explicit steps 0/3 |
| Iron Broadsword | +3 | attack=17.0 | - | 0.65 APS base | explicit steps 3/3 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit | Chaotic Axe +3 | 234 | 0.00 | 234 | 0.00 | 0.00 | EXTREME_HIGH |
| Spirit | Chaotic Axe +3 | 84.7 | 72.4 | 12.2 | 0.00 | 0.00 | - |
| Apprentice | Chaotic Axe +3 | 77.3 | 29.3 | 0.00 | 48.0 | 0.00 | - |
| Striker | Chaotic Axe +3 | 76.5 | 58.7 | 17.8 | 0.00 | 0.00 | - |
| Squire | Chaotic Axe +3 | 72.0 | 60.1 | 11.9 | 0.00 | 0.00 | - |
| Slinger | Chaotic Axe +3 | 60.6 | 60.6 | 0.00 | 0.00 | 0.00 | LOW |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger | Chaotic Axe +3 | 60.6 | 60.6 | 0.00 | 0.00 | 0.00 | LOW |
| Squire | Chaotic Axe +3 | 72.0 | 60.1 | 11.9 | 0.00 | 0.00 | - |
| Striker | Chaotic Axe +3 | 76.5 | 58.7 | 17.8 | 0.00 | 0.00 | - |
| Apprentice | Chaotic Axe +3 | 77.3 | 29.3 | 0.00 | 48.0 | 0.00 | - |
| Spirit | Chaotic Axe +3 | 84.7 | 72.4 | 12.2 | 0.00 | 0.00 | - |
| Conduit | Chaotic Axe +3 | 234 | 0.00 | 234 | 0.00 | 0.00 | EXTREME_HIGH |


All optimal-weapon outliers:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit | Chaotic Axe +3 | 234 | 0.00 | 234 | 0.00 | 0.00 | EXTREME_HIGH |
| Slinger | Chaotic Axe +3 | 60.6 | 60.6 | 0.00 | 0.00 | 0.00 | LOW |


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Conduit | 152 | 5 |
| Spirit | 54.9 | 5 |
| Apprentice | 52.1 | 5 |
| Squire | 49.2 | 5 |
| Striker | 48.9 | 5 |
| Slinger | 43.6 | 5 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Chaotic Axe | 101 | 6 |
| Flash Rapier | 69.6 | 6 |
| Heavy Hammer | 57.3 | 6 |
| Ashbrand Blade | 54.8 | 6 |
| Iron Broadsword | 51.0 | 6 |


Weapon DPS against target shapes:

| Weapon | neutral T1 dummy | high-plating T1 dummy | high-HP elite T1 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Ashbrand Blade +3 | 54.8 | 49.3 | 48.9 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |
| Chaotic Axe +3 | 101 | 94.2 | 91.5 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |
| Flash Rapier +3 | 69.6 | 61.5 | 62.1 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |
| Heavy Hammer +3 | 57.3 | 53.0 | 52.0 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |
| Iron Broadsword +3 | 51.0 | 46.0 | 45.6 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Chaotic Axe | 76.5 | 1 |
| Squire | Chaotic Axe | 72.0 | 1 |
| Apprentice | Chaotic Axe | 77.3 | 1 |
| Spirit | Chaotic Axe | 84.7 | 1 |
| Slinger | Chaotic Axe | 60.6 | 1 |
| Conduit | Chaotic Axe | 234 | 1 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Heavy Hammer | 28.4 | 1 |
| Squire | Heavy Hammer | 33.3 | 1 |
| Apprentice | Ashbrand Blade | 40.5 | 1 |
| Spirit | Heavy Hammer | 32.3 | 1 |
| Slinger | Heavy Hammer | 30.8 | 1 |
| Conduit | Flash Rapier | 105 | 1 |


## 10. Outlier Detail

| Flag | Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Suspected source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXTREME_HIGH | Conduit | Chaotic Axe +3 | 234 | 0.00 | 234 | 0.00 | 0.00 | class mechanic share; 3 minions at 1.00 APS each; dead swing every 3 hits |
| LOW | Slinger | Chaotic Axe +3 | 60.6 | 60.6 | 0.00 | 0.00 | 0.00 | direct share; dead swing every 3 hits |


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `3 minions at 1.00 APS each`, `ashbrand-burn reservoir DoT from weapon profile`, `dead swing every 3 hits`.
