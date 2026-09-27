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
| Reference optimal-build average DPS | 56.0 |
| Target TTK at reference DPS | 2.87s |
| Expected DPS band | 37.5 - 84.0 |

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
| Apprentice | Heavy Hammer +5 | 58.0 | 0.00 | 0.56 | 1782 | 72.0 | 112 | 2.00 | 8.00% | - | DoT cap 6 stacks, tick 1500ms | dot steady-state hit estimate |
| Conduit | Chaotic Axe +5 | 48.0 | 0.00 | 1.14 | 874 | 162 | 108 | 2.00 | 0.00% | - | 4 root/mid summons at 1.14 APS each; one formation budget | 4 root mid summons at 1.14 APS; formation budget normalized; dead swing every 3 hits |
| Slinger | Poison Dagger +5 | 26.0 | 0.00 | 1.50 | 505 | 132 | 107 | 2.00 | 0.00% | reload.acquire-radius-mult=2.50 | 10 shots, 1600ms reload, 1.50 effective shots/s | poison-dagger-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded |
| Spirit | Flash Rapier +5 | 31.0 | 0.00 | 1.79 | 558 | 142 | 103 | 2.00 | 0.00% | - | discharge every 9 hits (0.20/s) | energy steady-state hit estimate |
| Squire | Flash Rapier +5 | 32.0 | 0.00 | 1.36 | 735 | 12.0 | 130 | 2.00 | 28.0% | - | empowered every 7.00s (0.14/s) | cooldown steady-state hit estimate |
| Striker | Flash Rapier +5 | 29.0 | 0.00 | 1.69 | 590 | 12.0 | 118 | 2.00 | 18.0% | - | finisher every 5 hits (0.34/s) | cadence steady-state hit estimate |


## 4. Weapon Input Table (+0 and +5)

| Weapon | Plus | Stats | Effects | Formulas | Scaling notes |
| --- | --- | --- | --- | --- | --- |
| Chaotic Axe | +0 | attack=20.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 0/5 |
| Chaotic Axe | +5 | attack=29.0 | weapon.dead-swing-interval=3.00 | 1.10 APS base | explicit steps 5/5 |
| Flash Rapier | +0 | attack=8.00 | - | 1.50 APS base | explicit steps 0/5 |
| Flash Rapier | +5 | attack=12.0 | - | 1.50 APS base | explicit steps 5/5 |
| Heavy Hammer | +0 | attack=27.0 | weapon.empowered-mult-bonus=0.15 | 0.55 APS base | explicit steps 0/5 |
| Heavy Hammer | +5 | attack=38.0 | weapon.empowered-mult-bonus=0.22 | 0.55 APS base | explicit steps 5/5 |
| Iron Broadsword | +0 | attack=13.0 | technique.cooldown-reduction-pct=0.08, technique.power-pct=0.15 | 0.90 APS base | explicit steps 0/5 |
| Iron Broadsword | +5 | attack=19.0 | technique.cooldown-reduction-pct=0.16, technique.power-pct=0.40 | 0.90 APS base | explicit steps 5/5 |
| Poison Dagger | +0 | attack=12.0 | - | 0.90 APS base; poison-dagger-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 0/5 |
| Poison Dagger | +5 | attack=18.0 | - | 0.90 APS base; poison-dagger-burn DoT reservoir 50.0% conversion x1.50 | explicit steps 5/5 |


## 5. Top / Bottom Builds And Outliers

Top 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conduit | Chaotic Axe +5 | 64.1 | 0.00 | 64.1 | 0.00 | 0.00 | - |
| Spirit | Flash Rapier +5 | 59.9 | 53.8 | 6.17 | 0.00 | 0.00 | - |
| Striker | Flash Rapier +5 | 57.3 | 47.5 | 9.83 | 0.00 | 0.00 | - |
| Slinger | Poison Dagger +5 | 55.7 | 18.8 | 0.00 | 0.00 | 36.9 | - |
| Apprentice | Heavy Hammer +5 | 52.3 | 16.3 | 0.00 | 36.0 | 0.00 | - |
| Squire | Flash Rapier +5 | 46.7 | 42.2 | 4.57 | 0.00 | 0.00 | - |


Bottom 10 builds:

| Build | Weapon | DPS | Direct | Class | DoT | Weapon/proc | Flag |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Squire | Flash Rapier +5 | 46.7 | 42.2 | 4.57 | 0.00 | 0.00 | - |
| Apprentice | Heavy Hammer +5 | 52.3 | 16.3 | 0.00 | 36.0 | 0.00 | - |
| Slinger | Poison Dagger +5 | 55.7 | 18.8 | 0.00 | 0.00 | 36.9 | - |
| Striker | Flash Rapier +5 | 57.3 | 47.5 | 9.83 | 0.00 | 0.00 | - |
| Spirit | Flash Rapier +5 | 59.9 | 53.8 | 6.17 | 0.00 | 0.00 | - |
| Conduit | Chaotic Axe +5 | 64.1 | 0.00 | 64.1 | 0.00 | 0.00 | - |


All optimal-weapon outliers:

_No data._


## 6. Average DPS Per Class

| Class | Avg DPS | Samples |
| --- | --- | --- |
| Spirit | 48.4 | 5 |
| Conduit | 48.4 | 5 |
| Striker | 46.8 | 5 |
| Apprentice | 44.8 | 5 |
| Slinger | 43.4 | 5 |
| Squire | 40.2 | 5 |


## 7. Average DPS Per Weapon

| Weapon | Avg DPS | Samples |
| --- | --- | --- |
| Flash Rapier | 51.1 | 6 |
| Poison Dagger | 47.4 | 6 |
| Chaotic Axe | 47.1 | 6 |
| Heavy Hammer | 41.3 | 6 |
| Iron Broadsword | 39.8 | 6 |


Weapon DPS against target shapes:

| Weapon | neutral T1 dummy | high-plating T1 dummy | high-HP elite T1 dummy | Shape sources |
| --- | --- | --- | --- | --- |
| Chaotic Axe +5 | 47.1 | 45.2 | 42.5 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |
| Flash Rapier +5 | 51.1 | 48.6 | 46.0 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |
| Heavy Hammer +5 | 41.3 | 40.6 | 37.6 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |
| Iron Broadsword +5 | 39.8 | 38.1 | 35.7 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |
| Poison Dagger +5 | 47.4 | 45.9 | 43.2 | neutral T1 dummy: 10 mob average, biome tier 1 fallback; high-plating T1 dummy: Mud Toad; high-HP elite T1 dummy: Cave Brute |


## 8. Best Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Flash Rapier | 57.3 | 1 |
| Squire | Flash Rapier | 46.7 | 1 |
| Apprentice | Heavy Hammer | 52.3 | 1 |
| Spirit | Flash Rapier | 59.9 | 1 |
| Slinger | Poison Dagger | 55.7 | 1 |
| Conduit | Chaotic Axe | 64.1 | 1 |


## 9. Worst Weapon Per Class

| Class | Weapon | Avg DPS | Samples |
| --- | --- | --- | --- |
| Striker | Heavy Hammer | 39.2 | 1 |
| Squire | Iron Broadsword | 35.4 | 1 |
| Apprentice | Iron Broadsword | 40.5 | 1 |
| Spirit | Heavy Hammer | 41.1 | 1 |
| Slinger | Iron Broadsword | 37.6 | 1 |
| Conduit | Heavy Hammer | 36.6 | 1 |


## 10. Outlier Detail

_No data._


## 11. Formula Caveats / Unmapped Mechanics

- Direct hit formula is shared `estimatePlayerHitDamage`; stats are rebuilt through shared `recalculatePlayerStats`.
- Cadence, cooldown, energy, reload, DoT, summoner, weapon debuffs, and weapon DoT reservoirs are deterministic steady-state estimates.
- Runtime combat events, proc randomness, target swapping, overkill, downtime, minion death/pathing, AoE splash value, and enemy offensive pressure are not modeled.
- Report notes observed in this tier: `4 root mid summons at 0.57 APS; formation budget normalized`, `4 root mid summons at 0.94 APS; formation budget normalized`, `4 root mid summons at 1.14 APS; formation budget normalized`, `4 root mid summons at 1.66 APS; formation budget normalized`, `dead swing every 3 hits`, `poison-dagger-burn post-mitigation reservoir DoT from weapon profile; flat on-hit excluded`.
