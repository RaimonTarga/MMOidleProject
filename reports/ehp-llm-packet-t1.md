# MMO Idle LLM Survivability Packet - T1

Generated from `tools/ehp-report.ts`. Markdown only; the full HTML report is omitted. Companion to the DPS LLM packet.

## 1. Assumptions / Omissions

- Report tier T1; class unlock tier 0; armor + charm are tier 1 at +3.
- Every class build (root/frame/range/spec) is crossed with every armor × charm (recovery) combination. Weapon is empty; mobility slot excluded (movement only, no eHP value).
- Incoming pressure comes from biome spawn pools one tier below report tier (tutorial/test/interact/boss excluded), plus representative shape attackers and boss spikes.
- **eHP** = maxHP × (raw attacker DPS ÷ post-mitigation DPS): folds plating, DR, evasion, damage-cap, and DoT-resistance into one number. **TTL** = effective pool ÷ (incoming − recovery); "sustains" when recovery ≥ incoming. **Net HP/s** = recovery − incoming.
- Defense mechanics are deterministic steady-state re-implementations of `server/src/systems/defense/*`: shields/regen-bursts/absorb are averaged as HP/s throughput; ramps use their mid-point; cheat-death adds one extra near-full bar; kill-burst and shield-break heals are omitted (need a kill/break cadence).
- Single-target, in-combat steady state only. No movement, kiting, real AoE target count, enemy AI, party effects, antiheal stacking, or overkill timing.

## 2. Attacker Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 1 fallback |
| Mob count | 10 |
| Average attack | 18.4 |
| Average APS | 0.43 |
| Average DoT/s | 1.60 |
| Average spike mult | ×1.00 |
| Reference optimal-loadout average eHP | 771 |

| Shape | Monster | Attack | APS | DoT/s | Spike |
| --- | --- | --- | --- | --- | --- |
| Hardest hitter | Cave Brute | 40.0 | 0.26 | 0.00 | ×1.00 |
| Fastest attacker | Wolf | 11.0 | 0.83 | 0.00 | ×1.00 |
| DoT-heavy | Bog Slime | 4.00 | 0.45 | 8.00 | ×1.00 |
| Biggest spike | Boar | 18.0 | 0.53 | 0.00 | ×1.00 |


## 3. Class / Loadout Input Table (optimal charm+armor per build)

| Build | Loadout | maxHP | Plating | DR | Dodge | hpRegen | Defensive passives | eHP | TTL |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice | Survivor's Robe / Granite Barrier | 154 | 28.0 | 4.00% | 0.00% | 15.0 | defense.dot-resistance=0.18, defense.hit-to-dot-pct=0.10, defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.12 | 842 | sustains |
| Conduit | Survivor's Robe / Granite Barrier | 139 | 27.0 | 0.00% | 0.00% | 13.0 | defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.12 | 649 | 387s |
| Slinger | Survivor's Robe / Granite Barrier | 143 | 27.0 | 0.00% | 25.0% | 13.0 | defense.evade-mitigation=0.20, defense.kill-burst-pct=0.05, defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.12 | 693 | 604s |
| Spirit | Survivor's Robe / Granite Barrier | 129 | 27.0 | 0.00% | 0.00% | 13.0 | defense.shield-duration-ms=20000, defense.shield-interval-ms=20000, defense.shield-pct=0.42 | 602 | sustains |
| Squire | Arcane Wrappings / Granite Barrier | 192 | 17.0 | 8.00% | 0.00% | 13.0 | defense.dot-resistance=0.18, defense.in-combat-regen-pct=0.10, defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.12 | 1045 | sustains |
| Striker | Fallen Knight Plate / Granite Barrier | 170 | 17.0 | 4.00% | 0.00% | 13.0 | defense.max-hit-mult=0.25, defense.max-hit-pct=0.50, defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.08, defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.12 | 794 | sustains |


## 4. Armor Input Table (+0 and +3)

| Armor | Plus | Stats | Effects | Scaling |
| --- | --- | --- | --- | --- |
| Arcane Wrappings | +0 | maxHp=24.0, plating=6.00 | defense.dot-resistance=0.18 | steps 0/3 |
| Arcane Wrappings | +3 | maxHp=42.0, plating=12.0 | defense.dot-resistance=0.18 | steps 3/3 |
| Bestial Hide | +0 | damageReduction=0.06, maxHp=16.0, plating=2.00 | - | steps 0/3 |
| Bestial Hide | +3 | damageReduction=0.09, maxHp=28.0, plating=5.00 | - | steps 3/3 |
| Fallen Knight Plate | +0 | maxHp=22.0, plating=7.00 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | steps 0/3 |
| Fallen Knight Plate | +3 | maxHp=40.0, plating=13.0 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | steps 3/3 |
| Shaded Bindings | +0 | evasion=0.20, maxHp=20.0, plating=2.00 | - | steps 0/3 |
| Shaded Bindings | +3 | evasion=0.35, maxHp=35.0, plating=5.00 | - | steps 3/3 |
| Survivor's Robe | +0 | maxHp=10.0, plating=13.0 | - | steps 0/3 |
| Survivor's Robe | +3 | maxHp=19.0, plating=25.0 | - | steps 3/3 |


## 5. Charm Input Table (+0 and +3)

| Charm | Plus | Stats | Effects | Scaling |
| --- | --- | --- | --- | --- |
| Granite Barrier | +0 | hpRegen=3.00 | defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.09 | steps 0/3 |
| Granite Barrier | +3 | hpRegen=3.00 | defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.12 | steps 3/3 |
| Heartroot Amulet | +0 | hpRegen=6.00 | - | steps 0/3 |
| Heartroot Amulet | +3 | hpRegen=12.0 | - | steps 3/3 |
| Murk Eye | +0 | hpRegen=3.00 | defense.absorb-pct=0.07 | steps 0/3 |
| Murk Eye | +3 | hpRegen=3.00 | defense.absorb-pct=0.10 | steps 3/3 |
| Plains Core | +0 | hpRegen=4.00 | defense.kill-burst-pct=0.05 | steps 0/3 |
| Plains Core | +3 | hpRegen=4.00 | defense.kill-burst-pct=0.08 | steps 3/3 |
| Pulse Stone | +0 | hpRegen=3.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.05 | steps 0/3 |
| Pulse Stone | +3 | hpRegen=3.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.08 | steps 3/3 |


## 6. Tankiest / Most Fragile Optimal Loadouts

Top 10 (tankiest):

| Build | Armor | Charm | eHP | maxHP | Mitig% | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Squire | Arcane Wrappings +3 | Granite Barrier | 1045 | 192 | 81.6% | 1.74 | 4.80 | sustains | 0.52% |
| Apprentice | Survivor's Robe +3 | Granite Barrier | 842 | 154 | 81.7% | 1.73 | 1.85 | sustains | 0.65% |
| Striker | Fallen Knight Plate +3 | Granite Barrier | 794 | 170 | 78.6% | 2.03 | 4.31 | sustains | 0.59% |
| Slinger | Survivor's Robe +3 | Granite Barrier | 693 | 143 | 79.4% | 1.95 | 1.72 | 604s | 0.70% |
| Conduit | Survivor's Robe +3 | Granite Barrier | 649 | 139 | 78.6% | 2.03 | 1.67 | 387s | 0.72% |
| Spirit | Survivor's Robe +3 | Granite Barrier | 602 | 129 | 78.6% | 2.03 | 2.71 | sustains | 0.78% |


Bottom 10 (most fragile):

| Build | Armor | Charm | eHP | maxHP | Mitig% | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit | Survivor's Robe +3 | Granite Barrier | 602 | 129 | 78.6% | 2.03 | 2.71 | sustains | 0.78% |
| Conduit | Survivor's Robe +3 | Granite Barrier | 649 | 139 | 78.6% | 2.03 | 1.67 | 387s | 0.72% |
| Slinger | Survivor's Robe +3 | Granite Barrier | 693 | 143 | 79.4% | 1.95 | 1.72 | 604s | 0.70% |
| Striker | Fallen Knight Plate +3 | Granite Barrier | 794 | 170 | 78.6% | 2.03 | 4.31 | sustains | 0.59% |
| Apprentice | Survivor's Robe +3 | Granite Barrier | 842 | 154 | 81.7% | 1.73 | 1.85 | sustains | 0.65% |
| Squire | Arcane Wrappings +3 | Granite Barrier | 1045 | 192 | 81.6% | 1.74 | 4.80 | sustains | 0.52% |


## 7. Outliers (vs optimal-loadout average eHP)

_No data._


## 8. Burst & Sustain Risk

- One-shot risk (a single modeled spike ≥ HP + standing shield, no cheat-death): 0 of 6 optimal builds.
- Builds that fully sustain the neutral attacker (recovery ≥ incoming): 4 of 6.

_No data._


## 9. Average eHP Per Class

| Class | Avg eHP | Samples |
| --- | --- | --- |
| Squire | 697 | 25 |
| Apprentice | 599 | 25 |
| Striker | 573 | 25 |
| Slinger | 494 | 25 |
| Conduit | 438 | 25 |
| Spirit | 409 | 25 |


## 10. Average eHP Per Armor / Charm

| Armor | Avg eHP | Samples |
| --- | --- | --- |
| Survivor's Robe | 712 | 30 |
| Arcane Wrappings | 683 | 30 |
| Fallen Knight Plate | 675 | 30 |
| Shaded Bindings | 319 | 30 |
| Bestial Hide | 285 | 30 |


| Charm | Avg eHP | Samples |
| --- | --- | --- |
| Granite Barrier | 535 | 30 |
| Heartroot Amulet | 535 | 30 |
| Murk Eye | 535 | 30 |
| Plains Core | 535 | 30 |
| Pulse Stone | 535 | 30 |


## 11. Formula Caveats / Unmodeled Mechanics

- Mitigation uses shared `estimateMonsterHitDamage`: `max(1, round(max(0, attack - plating × 1) × (1 - DR)))`; stats rebuilt via shared `recalculatePlayerStats`.
- Evasion is averaged (`1 - dodgeRate × evadeMitigation`), not played out as a deterministic accumulator; first-hit timing and OOC reset are ignored.
- Shields/absorb/regen-burst are steady-state HP/s; a shield that out-sizes a hit still only counts its per-interval value (no burst-vs-chip interaction). DoT bypass-shield is respected only in notes.
- Cheat-death, hardening/stationary/sustained-fight DR ramps use mid-point or one-shot approximations; reactive plating and shield-break/kill-burst heals are not summed.
- Report notes observed in this tier: `-18% dot-resistance on incoming DoT`, `-36% dot-resistance on incoming DoT`, `absorb repays 10% of incoming as HoT`, `hit-to-dot redirects 10% (then -18% dot-resist)`, `hit-to-dot redirects 10% (then -36% dot-resist)`, `in-combat regen 10% of OOC (22.0/s base)`, `in-combat regen 10% of OOC (23.1/s base)`, `in-combat regen 10% of OOC (23.7/s base)`, `in-combat regen 10% of OOC (24.1/s base)`, `in-combat regen 10% of OOC (24.7/s base)`, `in-combat regen 10% of OOC (24.9/s base)`, `in-combat regen 10% of OOC (25.0/s base)`, `in-combat regen 10% of OOC (25.9/s base)`, `in-combat regen 10% of OOC (26.6/s base)`, `in-combat regen 10% of OOC (26.9/s base)`, `in-combat regen 10% of OOC (37.2/s base)`, `in-combat regen 10% of OOC (39.2/s base)`, `in-combat regen 10% of OOC (40.7/s base)`, `in-combat regen 10% of OOC (41.8/s base)`, `in-combat regen 10% of OOC (42.2/s base)`, `periodic shield 12% maxHp / 10s (treated as HP/s absorbed)`, `periodic shield 30% maxHp / 10s (treated as HP/s absorbed)`, `periodic shield 42% maxHp / 20s (treated as HP/s absorbed)`, `regen burst 16% maxHp / 6s`, `regen burst 8% maxHp / 6s`.
