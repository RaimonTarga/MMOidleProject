# MMO Idle LLM Balance Packet - T1

Generated from `tools/dps-report.ts`. This packet is Markdown only; it intentionally omits the full HTML report.

## 1. Assumptions / Omissions

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
| Average mob HP | 155 |
| Average plating | 0.40 |
| Average DR | 1.50% |
| Reference optimal-build average DPS | 79.6 |
| Target TTK at reference DPS | 1.95s |
| Expected DPS band | 53.3 - 119 |

| Profile | Monster | HP | Plating | DR | Defensive notes |
| --- | --- | --- | --- | --- | --- |
| Lightest | Field Hare | 50.0 | 0.00 | 0.00% | HP 50.0, plating 0.00, DR 0.00% |
| Low plating/DR | Boar | 100 | 0.00 | 0.00% | HP 100, plating 0.00, DR 0.00% |
| High plating | Mud Toad | 120 | 2.00 | 0.00% | HP 120, plating 2.00, DR 0.00% |
| High DR/special | Cave Lurker | 200 | 1.00 | 5.00% | HP 200, plating 1.00, DR 5.00%, evasion 10.0% |
| Heaviest | Cave Brute | 220 | 1.00 | 10.0% | HP 220, plating 1.00, DR 10.0% |


## 3. Class / Spec Input Table

| Build | Optimal Weapon | ATK | On-hit | APS | CD ms | Range | HP | Plating | DR | Class passives | Mechanic frequency | Formula notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | Heavy Hammer +5 | 100 | 0.00 | 0.56 | 1782 | 72.0 | 112 | 2.00 | 0.00% | - | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Conduit | Chaotic Axe +5 | 83.0 | 0.00 | 1.14 | 874 | 162 | 108 | 2.00 | 0.00% | - | 4 root/mid summons at 1.14 APS each; one formation budget | 4 root mid summons at 1.14 APS; formation budget normalized; dead swing every 3 hits |
| Slinger | Heavy Hammer +5 | 65.0 | 0.00 | 1.01 | 827 | 132 | 107 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50 | 10 shots, 1600ms reload, 1.01 effective shots/s | reload steady-state hit estimate |
| Spirit | Chaotic Axe +5 | 89.0 | 0.00 | 1.23 | 812 | 142 | 103 | 2.00 | 0.00% | - | discharge every 9 hits (0.14/s) | dead swing every 3 hits |
| Squire | Chaotic Axe +5 | 91.0 | 0.00 | 0.94 | 1069 | 12.0 | 130 | 3.00 | 4.00% | - | empowered every 7.00s (0.14/s) | dead swing every 3 hits |
| Striker | Chaotic Axe +5 | 83.0 | 0.00 | 1.17 | 858 | 12.0 | 118 | 2.00 | 2.00% | - | finisher every 5 hits (0.23/s) | dead swing every 3 hits |


## 4. Weapon Input Table (+0 and +5)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Chaotic Axe | +0 | attack=24.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 0/5 |
| Chaotic Axe | +5 | attack=62.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 5/5 |
| Flash Rapier | +0 | attack=5.00 | - | 1.50 APS base | explicit steps 0/5 |
| Flash Rapier | +5 | attack=16.0 | - | 1.50 APS base | explicit steps 5/5 |
| Heavy Hammer | +0 | attack=26.0 | weapon.empowered-mult-bonus=0.15 | 0.55 APS base | explicit steps 0/5 |
| Heavy Hammer | +5 | attack=76.0 | weapon.empowered-mult-bonus=0.15 | 0.55 APS base | explicit steps 5/5 |
| Iron Broadsword | +0 | attack=10.0 | - | 0.75 APS base | explicit steps 0/5 |
| Iron Broadsword | +5 | attack=30.0 | - | 0.75 APS base | explicit steps 5/5 |
| Poison Dagger | +0 | attack=10.0 | - | 0.85 APS base; poison-dagger-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/5 |
| Poison Dagger | +5 | attack=30.0 | - | 0.85 APS base; poison-dagger-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 5/5 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit | Chaotic Axe +5 | 91.5 | 0.00 | 91.5 | 0.00 | 0.00 | - |
| Apprentice | Heavy Hammer +5 | 87.5 | 27.5 | 0.00 | 60.0 | 0.00 | - |
| Spirit | Chaotic Axe +5 | 83.5 | 71.4 | 12.0 | 0.00 | 0.00 | - |
| Striker | Chaotic Axe +5 | 82.1 | 62.9 | 19.1 | 0.00 | 0.00 | - |
| Squire | Chaotic Axe +5 | 68.4 | 55.5 | 12.9 | 0.00 | 0.00 | - |
| Slinger | Heavy Hammer +5 | 64.8 | 64.8 | 0.00 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slinger | Heavy Hammer +5 | 64.8 | 64.8 | 0.00 | 0.00 | 0.00 | - |
| Squire | Chaotic Axe +5 | 68.4 | 55.5 | 12.9 | 0.00 | 0.00 | - |
| Striker | Chaotic Axe +5 | 82.1 | 62.9 | 19.1 | 0.00 | 0.00 | - |
| Spirit | Chaotic Axe +5 | 83.5 | 71.4 | 12.0 | 0.00 | 0.00 | - |
| Apprentice | Heavy Hammer +5 | 87.5 | 27.5 | 0.00 | 60.0 | 0.00 | - |
| Conduit | Chaotic Axe +5 | 91.5 | 0.00 | 91.5 | 0.00 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 66.9 | 5 |
| Apprentice | 65.4 | 5 |
| Striker | 64.3 | 5 |
| Conduit | 57.4 | 5 |
| Squire | 56.1 | 5 |
| Slinger | 53.9 | 5 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Chaotic Axe | 78.6 | 6 |
| Heavy Hammer | 68.2 | 6 |
| Poison Dagger | 59.4 | 6 |
| Flash Rapier | 53.2 | 6 |
| Iron Broadsword | 43.8 | 6 |


Weapon DPS against target shapes:

| Weapon | neutral T1 dummy | high-plating T1 dummy | high-HP elite T1 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Chaotic Axe +5 | 78.6 | 77.9 | 80.5 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Ridge Ambusher |
| Flash Rapier +5 | 53.2 | 50.1 | 54.3 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Ridge Ambusher |
| Heavy Hammer +5 | 68.2 | 67.9 | 69.5 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Ridge Ambusher |
| Iron Broadsword +5 | 43.8 | 42.4 | 44.5 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Ridge Ambusher |
| Poison Dagger +5 | 59.4 | 57.3 | 60.3 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Ridge Ambusher |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Chaotic Axe | 82.1 | 1 |
| Squire | Chaotic Axe | 68.4 | 1 |
| Apprentice | Heavy Hammer | 87.5 | 1 |
| Spirit | Chaotic Axe | 83.5 | 1 |
| Slinger | Heavy Hammer | 64.8 | 1 |
| Conduit | Chaotic Axe | 91.5 | 1 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Iron Broadsword | 45.8 | 1 |
| Squire | Iron Broadsword | 40.6 | 1 |
| Apprentice | Flash Rapier | 46.0 | 1 |
| Spirit | Iron Broadsword | 47.6 | 1 |
| Slinger | Iron Broadsword | 40.5 | 1 |
| Conduit | Iron Broadsword | 37.4 | 1 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `4 root mid summons at 0.57 APS; formation budget normalized`, `4 root mid summons at 0.78 APS; formation budget normalized`, `4 root mid summons at 0.88 APS; formation budget normalized`, `4 root mid summons at 1.14 APS; formation budget normalized`, `4 root mid summons at 1.56 APS; formation budget normalized`, `dead swing every 3 hits`, `poison-dagger-burn reservoir DoT from weapon profile`.
