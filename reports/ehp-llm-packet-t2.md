# MMO Idle LLM Survivability Packet - T2

Generated from `tools/ehp-report.ts`. Markdown only; the full HTML report is omitted. Companion to the DPS LLM packet.

## 1. Assumptions / Omissions

- Report tier T2; class unlock tier 1; armor + charm are tier 2 at +3.
- Every class build (root/frame/range/spec) is crossed with every armor × charm (recovery) combination. Weapon is empty; mobility slot excluded (movement only, no eHP value).
- Incoming pressure comes from biome spawn pools one tier below report tier (tutorial/test/interact/boss excluded), plus representative shape attackers and boss spikes.
- **eHP** = maxHP × (raw attacker DPS ÷ post-mitigation DPS): folds plating, DR, evasion, damage-cap, and DoT-resistance into one number. **TTL** = effective pool ÷ (incoming − recovery); "sustains" when recovery ≥ incoming. **Net HP/s** = recovery − incoming.
- Defense mechanics are deterministic steady-state re-implementations of `server/src/systems/defense/*`: shields/regen-bursts/absorb are averaged as HP/s throughput; ramps use their mid-point; cheat-death adds one extra near-full bar; kill-burst and shield-break heals are omitted (need a kill/break cadence).
- Single-target, in-combat steady state only. No movement, kiting, real AoE target count, enemy AI, party effects, antiheal stacking, or overkill timing.

## 2. Attacker Baseline

| Metric | Value |
| --- | --- |
| Source | biome tier 1 |
| Mob count | 10 |
| Average attack | 18.4 |
| Average APS | 0.43 |
| Average DoT/s | 1.60 |
| Average spike mult | ×1.00 |
| Reference optimal-loadout average eHP | 1458 |

| Shape | Monster | Attack | APS | DoT/s | Spike |
| --- | --- | --- | --- | --- | --- |
| Hardest hitter | Cave Brute | 40.0 | 0.26 | 0.00 | ×1.00 |
| Fastest attacker | Wolf | 11.0 | 0.83 | 0.00 | ×1.00 |
| DoT-heavy | Bog Slime | 4.00 | 0.45 | 8.00 | ×1.00 |
| Biggest spike | Boar | 18.0 | 0.53 | 0.00 | ×1.00 |
| Boss spike | Iron-Crest Titan | 175 | 0.24 | 0.00 | ×2.20 |


## 3. Class / Loadout Input Table (optimal charm+armor per build)

| Build | Loadout | maxHP | Plating | DR | Dodge | hpRegen | Defensive passives | eHP | TTL |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Ember mage | Void Wrappings / Ancient Heartroot Amulet | 231 | 27.0 | 4.00% | 0.00% | 34.0 | defense.dot-resistance=0.48, defense.hit-to-dot-pct=0.25 | 1810 | 191s |
| Apprentice / Rime-Bound | Void Wrappings / Ancient Heartroot Amulet | 247 | 30.0 | 10.0% | 0.00% | 37.0 | defense.dot-resistance=0.48, defense.hit-to-dot-pct=0.25 | 1935 | 204s |
| Apprentice / Venom vessel | Void Wrappings / Ancient Heartroot Amulet | 221 | 24.0 | 4.00% | 0.00% | 31.0 | defense.dot-resistance=0.48, defense.hit-to-dot-pct=0.25 | 1731 | 183s |
| Conduit / Heavy Frame | Void Wrappings / Ancient Heartroot Amulet | 225 | 23.0 | 0.00% | 0.00% | 29.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15 | 1393 | 147s |
| Conduit / Light Frame | Void Wrappings / Ancient Heartroot Amulet | 200 | 23.0 | 0.00% | 0.00% | 29.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15 | 1239 | 131s |
| Conduit / Medium Frame | Void Wrappings / Ancient Heartroot Amulet | 212 | 23.0 | 0.00% | 0.00% | 29.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15 | 1313 | 139s |
| Slinger / Artillerist | Void Wrappings / Ancient Heartroot Amulet | 224 | 27.0 | 0.00% | 25.0% | 33.0 | defense.dot-resistance=0.30, defense.evade-mitigation=0.20, defense.hit-to-dot-pct=0.15, defense.kill-burst-pct=0.05 | 1455 | 154s |
| Slinger / Marksman | Void Wrappings / Ancient Heartroot Amulet | 218 | 23.0 | 0.00% | 38.0% | 31.0 | defense.dot-resistance=0.30, defense.evade-mitigation=0.20, defense.hit-to-dot-pct=0.15, defense.kill-burst-pct=0.05 | 1453 | 154s |
| Slinger / Scout | Void Wrappings / Ancient Heartroot Amulet | 208 | 23.0 | 0.00% | 45.0% | 29.0 | defense.dot-resistance=0.30, defense.evade-mitigation=0.20, defense.hit-to-dot-pct=0.15, defense.kill-burst-pct=0.05 | 1406 | 149s |
| Spirit / Phantasm | Void Wrappings / Ancient Heartroot Amulet | 208 | 25.0 | 2.00% | 0.00% | 32.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.30 | 1288 | sustains |
| Spirit / Spark | Void Wrappings / Ancient Heartroot Amulet | 196 | 23.0 | 0.00% | 0.00% | 29.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.30 | 1214 | sustains |
| Spirit / Wraith | Void Wrappings / Ancient Heartroot Amulet | 195 | 24.0 | 0.00% | 0.00% | 29.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.shield-duration-ms=10000, defense.shield-interval-ms=10000, defense.shield-pct=0.30 | 1208 | sustains |
| Squire / Bulwark | Void Wrappings / Ancient Heartroot Amulet | 262 | 31.0 | 11.0% | 0.00% | 36.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.in-combat-regen-pct=0.10 | 1622 | sustains |
| Squire / Knight | Void Wrappings / Ancient Heartroot Amulet | 250 | 29.0 | 11.0% | 0.00% | 34.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.in-combat-regen-pct=0.10 | 1548 | sustains |
| Squire / Warrior | Void Wrappings / Ancient Heartroot Amulet | 236 | 26.0 | 8.00% | 0.00% | 29.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.in-combat-regen-pct=0.10 | 1461 | sustains |
| Striker / Breaker | Void Wrappings / Ancient Heartroot Amulet | 234 | 29.0 | 6.00% | 0.00% | 34.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.08 | 1449 | sustains |
| Striker / Flurry | Void Wrappings / Ancient Heartroot Amulet | 212 | 25.0 | 4.00% | 0.00% | 29.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.08 | 1313 | sustains |
| Striker / Skirmisher | Void Wrappings / Ancient Heartroot Amulet | 226 | 26.0 | 4.00% | 0.00% | 31.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15, defense.max-hit-mult=0.50, defense.max-hit-pct=0.25, defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.08 | 1400 | sustains |


## 4. Armor Input Table (+0 and +3)

| Armor | Plus | Stats | Effects | Scaling |
| --- | --- | --- | --- | --- |
| Dire Bestial Hide | +0 | damageReduction=0.10, maxHp=30.0, plating=4.00 | - | steps 0/3 |
| Dire Bestial Hide | +3 | damageReduction=0.13, maxHp=54.0, plating=7.00 | - | steps 3/3 |
| Duneplate of the Last Stand | +0 | maxHp=44.0, plating=10.0 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00 | steps 0/3 |
| Duneplate of the Last Stand | +3 | maxHp=80.0, plating=19.0 | defense.cheat-death=1.00, defense.cleanse-interval-ms=8000, defense.cleanse-stacks=1.00 | steps 3/3 |
| Enduring Robe | +0 | maxHp=20.0, plating=24.0 | - | steps 0/3 |
| Enduring Robe | +3 | maxHp=35.0, plating=42.0 | - | steps 3/3 |
| Iron Crusader Plate | +0 | damageReduction=0.05, maxHp=29.0, plating=12.0 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | steps 0/3 |
| Iron Crusader Plate | +3 | damageReduction=0.05, maxHp=53.0, plating=21.0 | defense.max-hit-mult=0.50, defense.max-hit-pct=0.25 | steps 3/3 |
| Phantom Bindings | +0 | evasion=0.28, maxHp=43.0, plating=4.00 | - | steps 0/3 |
| Phantom Bindings | +3 | evasion=0.46, maxHp=79.0, plating=7.00 | - | steps 3/3 |
| Verdant Weave | +0 | evasion=0.15, maxHp=44.0, plating=6.00 | - | steps 0/3 |
| Verdant Weave | +3 | evasion=0.27, maxHp=80.0, plating=12.0 | - | steps 3/3 |
| Void Wrappings | +0 | maxHp=44.0, plating=12.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15 | steps 0/3 |
| Void Wrappings | +3 | maxHp=80.0, plating=21.0 | defense.dot-resistance=0.30, defense.hit-to-dot-pct=0.15 | steps 3/3 |


## 5. Charm Input Table (+0 and +3)

| Charm | Plus | Stats | Effects | Scaling |
| --- | --- | --- | --- | --- |
| Ancient Heartroot Amulet | +0 | hpRegen=10.0 | - | steps 0/3 |
| Ancient Heartroot Amulet | +3 | hpRegen=19.0 | - | steps 3/3 |
| Canopy Heart | +0 | hpRegen=6.00 | defense.ramp-regen-max-pct=0.14, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.05 | steps 0/3 |
| Canopy Heart | +3 | hpRegen=6.00 | defense.ramp-regen-max-pct=0.20, defense.ramp-regen-ramptime-ms=10000, defense.ramp-regen-start-pct=0.05 | steps 3/3 |
| Iron Bulwark | +0 | hpRegen=6.00 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.12 | steps 0/3 |
| Iron Bulwark | +3 | hpRegen=6.00 | defense.shield-duration-ms=8000, defense.shield-interval-ms=8000, defense.shield-pct=0.18 | steps 3/3 |
| Mirage Core | +0 | hpRegen=6.00 | defense.cleanse-empty-heal-pct=0.03, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | steps 0/3 |
| Mirage Core | +3 | hpRegen=6.00 | defense.cleanse-empty-heal-pct=0.06, defense.cleanse-interval-ms=6000, defense.cleanse-stacks=1.00 | steps 3/3 |
| Resonant Gem | +0 | hpRegen=6.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.09 | steps 0/3 |
| Resonant Gem | +3 | hpRegen=6.00 | defense.regen-burst-interval-ms=6000, defense.regen-burst-pct=0.15 | steps 3/3 |
| Stalwart Core | +0 | hpRegen=7.00 | defense.kill-burst-pct=0.09 | steps 0/3 |
| Stalwart Core | +3 | hpRegen=7.00 | defense.kill-burst-pct=0.12 | steps 3/3 |
| Void Eye | +0 | hpRegen=6.00 | defense.absorb-pct=0.09 | steps 0/3 |
| Void Eye | +3 | hpRegen=6.00 | defense.absorb-pct=0.15 | steps 3/3 |


## 6. Tankiest / Most Fragile Optimal Loadouts

Top 10 (tankiest):

| Build | Armor | Charm | eHP | maxHP | Mitig% | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apprentice / Rime-Bound | Void Wrappings +3 | Ancient Heartroot Amulet | 1935 | 247 | 87.2% | 1.21 | 0.00 | 204s | 0.40% |
| Apprentice / Ember mage | Void Wrappings +3 | Ancient Heartroot Amulet | 1810 | 231 | 87.2% | 1.21 | 0.00 | 191s | 0.43% |
| Apprentice / Venom vessel | Void Wrappings +3 | Ancient Heartroot Amulet | 1731 | 221 | 87.2% | 1.21 | 0.00 | 183s | 0.45% |
| Squire / Bulwark | Void Wrappings +3 | Ancient Heartroot Amulet | 1622 | 262 | 83.9% | 1.53 | 9.43 | sustains | 0.38% |
| Squire / Knight | Void Wrappings +3 | Ancient Heartroot Amulet | 1548 | 250 | 83.9% | 1.53 | 8.50 | sustains | 0.40% |
| Squire / Warrior | Void Wrappings +3 | Ancient Heartroot Amulet | 1461 | 236 | 83.9% | 1.53 | 6.84 | sustains | 0.42% |
| Slinger / Artillerist | Void Wrappings +3 | Ancient Heartroot Amulet | 1455 | 224 | 84.6% | 1.46 | 0.00 | 154s | 0.45% |
| Slinger / Marksman | Void Wrappings +3 | Ancient Heartroot Amulet | 1453 | 218 | 85.0% | 1.42 | 0.00 | 154s | 0.46% |
| Striker / Breaker | Void Wrappings +3 | Ancient Heartroot Amulet | 1449 | 234 | 83.9% | 1.53 | 3.12 | sustains | 0.43% |
| Slinger / Scout | Void Wrappings +3 | Ancient Heartroot Amulet | 1406 | 208 | 85.2% | 1.40 | 0.00 | 149s | 0.48% |


Bottom 10 (most fragile):

| Build | Armor | Charm | eHP | maxHP | Mitig% | In DPS | Recov/s | TTL | Spike %HP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spirit / Wraith | Void Wrappings +3 | Ancient Heartroot Amulet | 1208 | 195 | 83.9% | 1.53 | 5.85 | sustains | 0.51% |
| Spirit / Spark | Void Wrappings +3 | Ancient Heartroot Amulet | 1214 | 196 | 83.9% | 1.53 | 5.88 | sustains | 0.51% |
| Conduit / Light Frame | Void Wrappings +3 | Ancient Heartroot Amulet | 1239 | 200 | 83.9% | 1.53 | 0.00 | 131s | 0.50% |
| Spirit / Phantasm | Void Wrappings +3 | Ancient Heartroot Amulet | 1288 | 208 | 83.9% | 1.53 | 6.24 | sustains | 0.48% |
| Striker / Flurry | Void Wrappings +3 | Ancient Heartroot Amulet | 1313 | 212 | 83.9% | 1.53 | 2.83 | sustains | 0.47% |
| Conduit / Medium Frame | Void Wrappings +3 | Ancient Heartroot Amulet | 1313 | 212 | 83.9% | 1.53 | 0.00 | 139s | 0.47% |
| Conduit / Heavy Frame | Void Wrappings +3 | Ancient Heartroot Amulet | 1393 | 225 | 83.9% | 1.53 | 0.00 | 147s | 0.44% |
| Striker / Skirmisher | Void Wrappings +3 | Ancient Heartroot Amulet | 1400 | 226 | 83.9% | 1.53 | 3.01 | sustains | 0.44% |
| Slinger / Scout | Void Wrappings +3 | Ancient Heartroot Amulet | 1406 | 208 | 85.2% | 1.40 | 0.00 | 149s | 0.48% |
| Striker / Breaker | Void Wrappings +3 | Ancient Heartroot Amulet | 1449 | 234 | 83.9% | 1.53 | 3.12 | sustains | 0.43% |


## 7. Outliers (vs optimal-loadout average eHP)

_No data._


## 8. Burst & Sustain Risk

- One-shot risk (a single modeled spike ≥ HP + standing shield, no cheat-death): 0 of 18 optimal builds.
- Builds that fully sustain the neutral attacker (recovery ≥ incoming): 9 of 18.

_No data._


## 9. Average eHP Per Class

| Class | Avg eHP | Samples |
| --- | --- | --- |
| Apprentice | 1136 | 147 |
| Squire | 1089 | 147 |
| Striker | 914 | 147 |
| Slinger | 896 | 147 |
| Conduit | 771 | 147 |
| Spirit | 745 | 147 |


## 10. Average eHP Per Armor / Charm

| Armor | Avg eHP | Samples |
| --- | --- | --- |
| Void Wrappings | 1458 | 126 |
| Duneplate of the Last Stand | 1079 | 126 |
| Iron Crusader Plate | 948 | 126 |
| Verdant Weave | 944 | 126 |
| Enduring Robe | 861 | 126 |
| Phantom Bindings | 651 | 126 |
| Dire Bestial Hide | 534 | 126 |


| Charm | Avg eHP | Samples |
| --- | --- | --- |
| Ancient Heartroot Amulet | 925 | 126 |
| Canopy Heart | 925 | 126 |
| Iron Bulwark | 925 | 126 |
| Mirage Core | 925 | 126 |
| Resonant Gem | 925 | 126 |
| Stalwart Core | 925 | 126 |
| Void Eye | 925 | 126 |


## 11. Formula Caveats / Unmodeled Mechanics

- Mitigation uses shared `estimateMonsterHitDamage`: `max(1, round(max(0, attack - plating × 1) × (1 - DR)))`; stats rebuilt via shared `recalculatePlayerStats`.
- Evasion is averaged (`1 - dodgeRate × evadeMitigation`), not played out as a deterministic accumulator; first-hit timing and OOC reset are ignored.
- Shields/absorb/regen-burst are steady-state HP/s; a shield that out-sizes a hit still only counts its per-interval value (no burst-vs-chip interaction). DoT bypass-shield is respected only in notes.
- Cheat-death, hardening/stationary/sustained-fight DR ramps use mid-point or one-shot approximations; reactive plating and shield-break/kill-burst heals are not summed.
- Report notes observed in this tier: `-18% dot-resistance on incoming DoT`, `-30% dot-resistance on incoming DoT`, `-48% dot-resistance on incoming DoT`, `absorb repays 15% of incoming as HoT`, `cheat-death grants one extra near-full bar`, `cleanse empty-heal 6% maxHp / 14s`, `cleanse empty-heal 6% maxHp / 6s`, `hit-to-dot redirects 10% (then -18% dot-resist)`, `hit-to-dot redirects 15% (then -30% dot-resist)`, `hit-to-dot redirects 25% (then -48% dot-resist)`, `in-combat regen 10% of OOC (30.6/s base)`, `in-combat regen 10% of OOC (32.5/s base)`, `in-combat regen 10% of OOC (33.4/s base)`, `in-combat regen 10% of OOC (33.6/s base)`, `in-combat regen 10% of OOC (35.5/s base)`, `in-combat regen 10% of OOC (35.7/s base)`, `in-combat regen 10% of OOC (37.6/s base)`, `in-combat regen 10% of OOC (37.8/s base)`, `in-combat regen 10% of OOC (40.0/s base)`, `in-combat regen 10% of OOC (40.1/s base)`, `in-combat regen 10% of OOC (43.0/s base)`, `in-combat regen 10% of OOC (45.1/s base)`, `in-combat regen 10% of OOC (46.8/s base)`, `in-combat regen 10% of OOC (47.0/s base)`, `in-combat regen 10% of OOC (49.1/s base)`, `in-combat regen 10% of OOC (49.3/s base)`, `in-combat regen 10% of OOC (49.9/s base)`, `in-combat regen 10% of OOC (52.1/s base)`, `in-combat regen 10% of OOC (52.3/s base)`, `in-combat regen 10% of OOC (52.5/s base)`, `in-combat regen 10% of OOC (54.1/s base)`, `in-combat regen 10% of OOC (54.3/s base)`, `in-combat regen 10% of OOC (54.8/s base)`, `in-combat regen 10% of OOC (55.0/s base)`, `in-combat regen 10% of OOC (55.4/s base)`, `in-combat regen 10% of OOC (56.4/s base)`, `in-combat regen 10% of OOC (56.6/s base)`, `in-combat regen 10% of OOC (60.0/s base)`, `in-combat regen 10% of OOC (60.3/s base)`, `in-combat regen 10% of OOC (60.6/s base)`, `in-combat regen 10% of OOC (60.9/s base)`, `in-combat regen 10% of OOC (62.6/s base)`, `in-combat regen 10% of OOC (62.9/s base)`, `in-combat regen 10% of OOC (68.1/s base)`, `in-combat regen 10% of OOC (68.4/s base)`, `in-combat regen 10% of OOC (69.7/s base)`, `in-combat regen 10% of OOC (75.8/s base)`, `in-combat regen 10% of OOC (76.2/s base)`, `in-combat regen 10% of OOC (78.1/s base)`, `in-combat regen 10% of OOC (84.6/s base)`, `in-combat regen 10% of OOC (84.7/s base)`, `in-combat regen 10% of OOC (85.0/s base)`, `in-combat regen 10% of OOC (94.0/s base)`, `in-combat regen 10% of OOC (94.3/s base)`, `periodic shield 18% maxHp / 8s (treated as HP/s absorbed)`, `periodic shield 30% maxHp / 10s (treated as HP/s absorbed)`, `periodic shield 48% maxHp / 18s (treated as HP/s absorbed)`, `ramp regen averaged 13% of OOC over the ramp window`, `regen burst 15% maxHp / 6s`, `regen burst 23% maxHp / 6s`, `regen burst 8% maxHp / 6s`.
