# MMO Idle LLM Balance Packet - T1

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

- Player model: weapon, armour, charm and mobility only, plus skill nodes, item upgrades and class affinities. NO core, relic, rune, rite, stance or ability is equipped — the bench bots carry all six, so these numbers are comparable to each other but NOT to bench output in absolute terms.
- Report tier T1; class unlock tier 0; weapons are tier 1.
- DPS conclusions use +5 weapons only. Weapon input context includes +0 and +5.
- Target mobs come from biome spawn pools one tier below report tier; tutorial/test/interact/boss monsters are excluded.
- When the shifted target tier contains only tutorial/test content, the packet falls back to the first real non-tutorial biome tier.
- Single-target theoretical steady-state only: no movement, enemy attacks, deaths, sustain, AoE value, pathing, aggro, party effects, or eHP.
- Outliers/top/bottom use each class combination's optimal +5 weapon. Class/weapon averages use all +5 weapon samples.

## 2. Target Monster Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 1 fallback |
| Mob count | 10 |
| Average mob HP | 161 |
| Average plating | 0.40 |
| Average DR | 1.50% |
| Reference optimal-build average DPS | 47.8 |
| Target TTK at reference DPS | 3.36s |
| Expected DPS band | 32.0 - 71.7 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Field Hare | 50.0 | 0.00 | 0.00% | HP 50.0, plating 0.00, DR 0.00% |
| Low plating/DR | Boar | 100 | 0.00 | 0.00% | HP 100, plating 0.00, DR 0.00% |
| Mid profile | Wolf | 130 | 0.00 | 0.00% | HP 130, plating 0.00, DR 0.00% |
| High plating | Mud Toad | 120 | 2.00 | 0.00% | HP 120, plating 2.00, DR 0.00% |
| High DR/special | Cave Brute | 250 | 1.00 | 10.0% | HP 250, plating 1.00, DR 10.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | Chaotic Axe +5 | 52.0 | 0.00 | 1.12 | 891 | 72.0 | 112 | 2.00 | 0.00% | - | DoT cap 6 stacks, tick 1500ms | dead swing every 3 hits |
| Conduit | Chaotic Axe +5 | 51.0 | 0.00 | 1.14 | 874 | 162 | 108 | 2.00 | 0.00% | - | 4 root/mid summons at 1.14 APS each; one formation budget | 4 root mid summons at 1.14 APS; formation budget normalized; dead swing every 3 hits |
| Slinger | Poison Dagger +5 | 21.0 | 0.00 | 1.50 | 505 | 132 | 107 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50 | 10 shots, 1600ms reload, 1.50 effective shots/s | poison-dagger-burn reservoir DoT from weapon profile |
| Spirit | Chaotic Axe +5 | 54.0 | 0.00 | 1.23 | 812 | 142 | 103 | 2.00 | 0.00% | - | discharge every 9 hits (0.14/s) | dead swing every 3 hits |
| Squire | Chaotic Axe +5 | 55.0 | 0.00 | 0.94 | 1069 | 12.0 | 130 | 3.00 | 4.00% | - | empowered every 7.00s (0.14/s) | dead swing every 3 hits |
| Striker | Chaotic Axe +5 | 51.0 | 0.00 | 1.17 | 858 | 12.0 | 118 | 2.00 | 2.00% | - | finisher every 5 hits (0.23/s) | dead swing every 3 hits |


## 4. Weapon Input Table (+0 and +5)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Chaotic Axe | +0 | attack=22.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 0/5 |
| Chaotic Axe | +5 | attack=32.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 5/5 |
| Flash Rapier | +0 | attack=5.00 | - | 1.50 APS base | explicit steps 0/5 |
| Flash Rapier | +5 | attack=8.00 | - | 1.50 APS base | explicit steps 5/5 |
| Heavy Hammer | +0 | attack=26.0 | weapon.empowered-mult-bonus=0.15 | 0.55 APS base | explicit steps 0/5 |
| Heavy Hammer | +5 | attack=36.0 | weapon.empowered-mult-bonus=0.22 | 0.55 APS base | explicit steps 5/5 |
| Iron Broadsword | +0 | attack=10.0 | technique.cooldown-reduction-pct=0.06 | 0.80 APS base | explicit steps 0/5 |
| Iron Broadsword | +5 | attack=15.0 | technique.cooldown-reduction-pct=0.11 | 0.80 APS base | explicit steps 5/5 |
| Poison Dagger | +0 | attack=10.0 | - | 0.90 APS base; poison-dagger-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/5 |
| Poison Dagger | +5 | attack=15.0 | - | 0.90 APS base; poison-dagger-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 5/5 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit | Chaotic Axe +5 | 54.9 | 0.00 | 54.9 | 0.00 | 0.00 | - |
| Apprentice | Chaotic Axe +5 | 51.5 | 19.5 | 0.00 | 32.0 | 0.00 | - |
| Spirit | Chaotic Axe +5 | 50.8 | 43.5 | 7.25 | 0.00 | 0.00 | - |
| Striker | Chaotic Axe +5 | 50.5 | 38.9 | 11.7 | 0.00 | 0.00 | - |
| Squire | Chaotic Axe +5 | 41.4 | 33.7 | 7.71 | 0.00 | 0.00 | - |
| Slinger | Poison Dagger +5 | 37.6 | 15.0 | 0.00 | 0.00 | 22.6 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger | Poison Dagger +5 | 37.6 | 15.0 | 0.00 | 0.00 | 22.6 | - |
| Squire | Chaotic Axe +5 | 41.4 | 33.7 | 7.71 | 0.00 | 0.00 | - |
| Striker | Chaotic Axe +5 | 50.5 | 38.9 | 11.7 | 0.00 | 0.00 | - |
| Spirit | Chaotic Axe +5 | 50.8 | 43.5 | 7.25 | 0.00 | 0.00 | - |
| Apprentice | Chaotic Axe +5 | 51.5 | 19.5 | 0.00 | 32.0 | 0.00 | - |
| Conduit | Chaotic Axe +5 | 54.9 | 0.00 | 54.9 | 0.00 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 44.4 | 5 |
| Striker | 42.8 | 5 |
| Apprentice | 41.2 | 5 |
| Squire | 36.7 | 5 |
| Conduit | 36.1 | 5 |
| Slinger | 34.8 | 5 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Chaotic Axe | 47.7 | 6 |
| Flash Rapier | 41.7 | 6 |
| Poison Dagger | 40.0 | 6 |
| Heavy Hammer | 37.7 | 6 |
| Iron Broadsword | 29.6 | 6 |


Weapon DPS against target shapes:

| Weapon | neutral T1 dummy | high-plating T1 dummy | high-HP elite T1 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Chaotic Axe +5 | 47.7 | 46.5 | 43.8 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |
| Flash Rapier +5 | 41.7 | 38.2 | 37.4 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |
| Heavy Hammer +5 | 37.7 | 37.0 | 34.3 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |
| Iron Broadsword +5 | 29.6 | 28.6 | 27.0 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |
| Poison Dagger +5 | 40.0 | 38.6 | 36.3 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Chaotic Axe | 50.5 | 1 |
| Squire | Chaotic Axe | 41.4 | 1 |
| Apprentice | Chaotic Axe | 51.5 | 1 |
| Spirit | Chaotic Axe | 50.8 | 1 |
| Slinger | Poison Dagger | 37.6 | 1 |
| Conduit | Chaotic Axe | 54.9 | 1 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Iron Broadsword | 31.7 | 1 |
| Squire | Iron Broadsword | 28.1 | 1 |
| Apprentice | Iron Broadsword | 33.1 | 1 |
| Spirit | Iron Broadsword | 34.0 | 1 |
| Slinger | Iron Broadsword | 27.5 | 1 |
| Conduit | Iron Broadsword | 23.3 | 1 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `4 root mid summons at 0.57 APS; formation budget normalized`, `4 root mid summons at 0.83 APS; formation budget normalized`, `4 root mid summons at 0.94 APS; formation budget normalized`, `4 root mid summons at 1.14 APS; formation budget normalized`, `4 root mid summons at 1.66 APS; formation budget normalized`, `dead swing every 3 hits`, `poison-dagger-burn reservoir DoT from weapon profile`.
