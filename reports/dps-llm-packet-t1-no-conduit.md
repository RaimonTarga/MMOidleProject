# MMO Idle LLM Balance Packet - T1 (No Conduit)

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
| Reference optimal-build average DPS | 67.4 |
| Target TTK at reference DPS | 2.11s |
| Expected DPS band | 45.2 - 101 |

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
| Apprentice | Heavy Hammer +3 | 83.0 | 0.00 | 0.55 | 1818 | 72.0 | 135 | 3.00 | 4.00% | - | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Slinger | Ashbrand Blade +3 | 35.0 | 0.00 | 1.54 | 490 | 132 | 124 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50 | 10 shots, 1600ms reload, 1.54 effective shots/s | ashbrand-burn reservoir DoT from weapon profile |
| Spirit | Chaotic Axe +3 | 72.0 | 0.00 | 1.27 | 790 | 142 | 110 | 2.00 | 0.00% | - | discharge every 9 hits (0.14/s) | dead swing every 3 hits |
| Squire | Chaotic Axe +3 | 75.0 | 0.00 | 1.10 | 909 | 12.0 | 150 | 5.00 | 8.00% | - | empowered every 7.00s (0.14/s) | dead swing every 3 hits |
| Striker | Chaotic Axe +3 | 73.0 | 0.00 | 1.10 | 909 | 12.0 | 130 | 4.00 | 4.00% | - | finisher every 5 hits (0.22/s) | dead swing every 3 hits |


## 4. Weapon Input Table (+0 and +3)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Ashbrand Blade | +0 | attack=10.0 | weapon.dot-conversion-pct=0.50, weapon.dot-stacks=5.00 | 0.85 APS base; ashbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/3 |
| Ashbrand Blade | +3 | attack=22.0 | weapon.dot-conversion-pct=0.50, weapon.dot-stacks=5.00 | 0.85 APS base; ashbrand-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 3/3 |
| Chaotic Axe | +0 | attack=24.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 0/3 |
| Chaotic Axe | +3 | attack=46.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 3/3 |
| Flash Rapier | +0 | attack=5.00 | - | 1.50 APS base | explicit steps 0/3 |
| Flash Rapier | +3 | attack=11.0 | - | 1.50 APS base | explicit steps 3/3 |
| Heavy Hammer | +0 | attack=26.0 | - | 0.55 APS base | explicit steps 0/3 |
| Heavy Hammer | +3 | attack=56.0 | - | 0.55 APS base | explicit steps 3/3 |
| Iron Broadsword | +0 | attack=10.0 | - | 0.75 APS base | explicit steps 0/3 |
| Iron Broadsword | +3 | attack=22.0 | - | 0.75 APS base | explicit steps 3/3 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | Heavy Hammer +3 | 70.6 | 22.6 | 0.00 | 48.0 | 0.00 | - |
| Spirit | Chaotic Axe +3 | 69.1 | 59.1 | 9.99 | 0.00 | 0.00 | - |
| Striker | Chaotic Axe +3 | 67.9 | 52.1 | 15.8 | 0.00 | 0.00 | - |
| Slinger | Ashbrand Blade +3 | 65.4 | 26.2 | 0.00 | 0.00 | 39.2 | - |
| Squire | Chaotic Axe +3 | 64.1 | 53.5 | 10.6 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire | Chaotic Axe +3 | 64.1 | 53.5 | 10.6 | 0.00 | 0.00 | - |
| Slinger | Ashbrand Blade +3 | 65.4 | 26.2 | 0.00 | 0.00 | 39.2 | - |
| Striker | Chaotic Axe +3 | 67.9 | 52.1 | 15.8 | 0.00 | 0.00 | - |
| Spirit | Chaotic Axe +3 | 69.1 | 59.1 | 9.99 | 0.00 | 0.00 | - |
| Apprentice | Heavy Hammer +3 | 70.6 | 22.6 | 0.00 | 48.0 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 60.3 | 5 |
| Slinger | 59.5 | 5 |
| Apprentice | 58.6 | 5 |
| Squire | 58.2 | 5 |
| Striker | 58.2 | 5 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Chaotic Axe | 66.7 | 5 |
| Flash Rapier | 62.7 | 5 |
| Ashbrand Blade | 60.6 | 5 |
| Heavy Hammer | 59.8 | 5 |
| Iron Broadsword | 44.9 | 5 |


Weapon DPS against target shapes:

| Weapon | neutral T1 dummy | high-plating T1 dummy | high-HP elite T1 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Ashbrand Blade +3 | 60.6 | 56.1 | 55.0 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |
| Chaotic Axe +3 | 66.7 | 62.8 | 61.0 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |
| Flash Rapier +3 | 62.7 | 56.1 | 55.8 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |
| Heavy Hammer +3 | 59.8 | 56.3 | 54.8 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |
| Iron Broadsword +3 | 44.9 | 41.6 | 40.9 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Cave Lurker; high-HP elite T1 dummy: Cave Brute |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Chaotic Axe | 67.9 | 1 |
| Squire | Chaotic Axe | 64.1 | 1 |
| Apprentice | Heavy Hammer | 70.6 | 1 |
| Spirit | Chaotic Axe | 69.1 | 1 |
| Slinger | Ashbrand Blade | 65.4 | 1 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Iron Broadsword | 42.6 | 1 |
| Squire | Iron Broadsword | 44.0 | 1 |
| Apprentice | Iron Broadsword | 46.0 | 1 |
| Spirit | Iron Broadsword | 44.3 | 1 |
| Slinger | Iron Broadsword | 47.5 | 1 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, weapon debuffs, weapon DoT reservoirs, and sacred-family burst effects are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `ashbrand-burn reservoir DoT from weapon profile`, `dead swing every 3 hits`.
