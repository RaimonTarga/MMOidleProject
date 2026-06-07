# T4 Item Designs — Visual Reference

**Scope:** weapon, armor, charm per biome. Boots excluded (already designed) except Trench (TBD).
Stats shown as base values. Upgrade scaling shown as (+per step → total at +3).
Numbers are order-of-magnitude baselines — exact values in the math/balance pass.
New mechanic keys (†) require engine implementation before going live.

---

## Biome Roster & Retirement Summary

| Status | Biome | Density | Retired Mechanics → New Home |
|---|---|---|---|
| ✅ T1→T4 | Mountain | Low-mid | — |
| ✅ T2→T4 | Desert | Low | — |
| ✅ T2→T4 | Jungle | High | — |
| ✅ T3→T4 | Tundra | Low-mid | Swamp slow-DoT weapon |
| ✅ T3→T4 | Volcanic | High | Swamp fast-DoT weapon |
| 🆕 Debuts T4 | Graveyard | Extreme high | Swamp dot-resist armor, Cave regen-burst charm |
| 🆕 Debuts T4 | Trench | Extreme low | Cave premium-DR armor, Cave stealth boots |
| ❌ Retired | Cave | — | → Graveyard (charm) + Trench (armor, boots, axe) |
| ❌ Retired | Swamp | — | → Tundra (slow DoT weapon) + Volcanic (fast DoT weapon) + Graveyard (armor) |

---

## MOUNTAIN

*Big-hit mitigation, slow heavy hammer, periodic shield.*
*T4 capstone: damage cap triggers → shield immediately rearms.*

| Slot | Name | Base Stats | Key Mechanic | Notes |
|---|---|---|---|---|
| Weapon (slow) | **Earthsunder Maul** | ATK 132, APS 0.40 | Pure attack | Baseline; plating-piercing, strong empowered. Upgrades: +ATK 18/step → 186 at +3 |
| Weapon (medium) | **Warmaul** | ATK 90, APS 0.65 | `empowered-mult-bonus: +0.6` | †New branch. Universal speed; adds +0.6 flat to class empowered multiplier. Best for light/balanced frames. Upgrades: +ATK 12/step → 126 at +3 |
| Armor | **Titan's Keep** | HP 100, PLT 40, DR 0.12 | `max-hit-pct: 0.25, max-hit-mult: 0.5` | †`max-hit-rearms-shield: 1` — cap trigger immediately rearms the shield charm. Upgrades: +HP 25, +PLT 10/step |
| Armor (alt) | **Stormwall Plate** | HP 100, PLT 30, DR 0.14 | `max-hit-pct: 0.25, max-hit-mult: 0.5` | †`shield-break-hp-recovery-pct: 0.30` — when shield breaks, recover 30% of its max value as HP. Pairs with any shield charm; sustain in long fights. Upgrades: +HP 24, +PLT 8/step |
| Charm | **Fortress Core** | hpRegen 14 | `shield-pct: 0.22` (+0.04/step → 0.34) | Standard shield charm. Pairs with Titan's Keep for the cap-rearms loop |
| Charm (alt) | **Shieldmend Ward** | hpRegen 14 | `shield-pct: 0.18` (+0.03/step → 0.27), `shield-break-heal-pct: 0.25` | †On shield break, heal 25% of shield max value as HP. "Shield as a resource that refunds HP when spent." Long-fight sustain for shield builds |
| Boots | *[Designed]* | — | — | — |

---

## DESERT

*Last-stand + cleanse armor, alpha-strike weapon, cleanse-sustain charm.*
*T4 capstone: cheat-death grants a counter-attack window; cleanse heals per stack cleared.*

| Slot | Name | Base Stats | Key Mechanic | Notes |
|---|---|---|---|---|
| Weapon | **Zenith Cross** | ATK 62, APS 0.70 | `first-strike-mult: 2.5` | Up from 2.0× at T3. Highest opening alpha in the game. Upgrades: +ATK 10/step → 92 at +3 |
| Armor | **Deathless Duneplate** | HP 165, PLT 38 | `cheat-death: 1, cleanse-stacks: 2, cleanse-interval-ms: 7000, debuff-resist: 0.30` | †`post-cheat-death-atk-mult: 1.5, post-cheat-death-ms: 3000` — after surviving via cheat-death, next 3s deal +50% attack damage. Upgrades: +HP 40, +PLT 9/step |
| Charm | **Last Oasis** | hpRegen 14 | `cleanse-stacks: 2, cleanse-interval-ms: 6000, cleanse-empty-heal-pct: 0.07` (+0.015/step → 0.115) | †`cleanse-per-stack-heal-pct: 0.02` — each cleansed debuff stack heals 2% maxHP additionally. Sustain scales with debuff density of the zone |
| Boots | *[Designed]* | — | — | — |

---

## JUNGLE

*Evasion + bulk armor, fast on-hit rapier, ramping combat regen charm.*
*T4 capstone: evasion effectiveness scales with current move speed.*

| Slot | Name | Base Stats | Key Mechanic | Notes |
|---|---|---|---|---|
| Weapon | **Deathfang Rapier** | ATK 44, onHit 32, APS 1.75 | High on-hit density | Up from T3; APS slightly increased. Harrier party-fork (enemy −DR/−EVA debuff per hit) is the party-synergy variant. Upgrades: +ATK 10, +onHit 10/step |
| Armor | **Primal Canopy** | HP 145, PLT 24, EVA 0.62 | Evasion + bulk | †`evasion-speed-scaling: 1` — evasion rate scales with current move speed (bible-confirmed T4 capstone). Max speed builds dodge significantly more often. Upgrades: +HP 35, +PLT 6, +EVA 0.07/step |
| Charm | **Ancient Canopy** | hpRegen 14 | `ramp-regen-start: 0.07, ramp-regen-max: 0.28` (+0.04/step → 0.40), `ramp-ramptime-ms: 9000` | Regen ramps over sustained combat. Best in long fights; rewards staying engaged |
| Charm (alt) | **Overgrowth Pulse** | hpRegen 14 | `ramp-regen-start: 0.07, ramp-regen-max: 0.22` (+0.03/step → 0.31), `overheal-shield-pct: 0.50` | †Overheal (healing beyond max HP) converts to a temporary shield at 50% rate. Regen-heavy builds generate free shields passively. Short-fight complement to the long-fight Ancient Canopy |
| Boots | *[Designed]* | — | — | — |

---

## TUNDRA

*Stationary-ramp DR + cap armor, brittle debuff hammer, shield+absorb charm.*
*Inherits Swamp slow-DoT weapon (Rimebrand lineage).*
*T4 capstone: brittle weapon reaches "shattered" at max stacks — next hit strips DR for 2s.*

| Slot | Name | Base Stats | Key Mechanic | Notes |
|---|---|---|---|---|
| Weapon (brittle) | **Glacial Tyrant Maul** | ATK 136, APS 0.42 | `brittle-plating: 3, brittle-dr: 0.015, brittle-stacks: 8` | †`brittle-shatter-threshold: 8, brittle-shatter-dr-strip-ms: 2000` — at max brittle stacks, next hit shatters armor: strips accumulated DR for 2s. Upgrades: +ATK 25/step → 211 at +3 |
| Weapon (frost DoT) | **Glacial Rimebrand** | ATK 86, APS 0.55 | `dot-conversion-pct: 0.45, dot-stacks: 3` | Inherited from Swamp. Frost slow-DoT; front-loaded 3-stack weight. Synergises with Frost heavy DoT class specs. Upgrades: +ATK 16/step → 134 at +3 |
| Armor | **Permafrost Sovereign** | HP 180, PLT 28 | `stationary-dr-pct: 0.20, stationary-dr-ramptime-ms: 5000, max-hit-pct: 0.25, max-hit-mult: 0.5` | †Optional: `stationary-plating-per-sec: 2, stationary-plating-max: 16` — also gains stacking plating while stationary. "Become the glacier." Upgrades: +HP 42, +PLT 7/step |
| Charm | **Glacial Ward** | hpRegen 14 | `shield-pct: 0.17` (+0.03/step → 0.26), `absorb-pct: 0.12` (+0.03/step → 0.21) | Combined shield+absorb. Both ramp together on upgrades |
| Charm (alt) | **Deepfreeze Ward** | hpRegen 14 | `shield-pct: 0.14` (+0.03/step → 0.23), `absorb-ramp-start: 0.04, absorb-ramp-max: 0.18` (+0.03/step → 0.27), `absorb-ramptime-ms: 12000` | †Absorb-pct ramps over time in combat instead of being flat. Weaker in short fights, stronger in long sustained fights. "Long-fight" variant |
| Boots | *[Designed]* | — | — | — |

---

## VOLCANIC

*Hardening armor, flurry lash, in-combat-regen + kill-burst charm.*
*Inherits Swamp fast-DoT weapon (Blightbrand lineage).*
*T4 capstone: max hardening → brief DR burst.*

| Slot | Name | Base Stats | Key Mechanic | Notes |
|---|---|---|---|---|
| Weapon (flurry) | **Eruption Lash** | ATK 62, APS 1.80 | `flurry-pct: 0.07, flurry-stacks: 6` | 6th stack added at T4; stacks persist 1.5s off-target. Upgrades: +ATK 10/step → 92 at +3 |
| Weapon (fire DoT) | **Volcanic Blightbrand** | ATK 62, APS 0.85 | `dot-conversion-pct: 0.30, dot-stacks: 5` | Inherited from Swamp. Fire fast-DoT; 5-stack. Synergises with Poison/Fire DoT class specs. Upgrades: +ATK 10/step → 92 at +3 |
| Armor | **Pyroclasm Mantle** | HP 165, PLT 38 | `hardening-per-sec: 4, hardening-max: 32, hardening-reset-pct: 0.25` | †`hardening-max-dr-bonus: 0.06, hardening-max-dr-ms: 3000` — at max hardening gain 6% DR for 3s before reset. Upgrades: +HP 40, +PLT 10/step |
| Armor (alt) | **Lava-Tempered Hide** | HP 150, PLT 28 | `hardening-per-sec: 3, hardening-max: 24, hardening-reset-pct: 0.25` | †`overheal-shield-pct: 0.50` — overheal from in-combat-regen converts to temp shield. Pairs with the Inferno Core charm naturally. Upgrades: +HP 36, +PLT 7/step |
| Charm | **Inferno Core** | hpRegen 14 | `in-combat-regen-pct: 0.19` (+0.025/step → 0.265), `kill-burst-pct: 0.11` (+0.025/step → 0.185) | Both ramp together; kill-burst flag is existing T3 mechanic carried forward |
| Boots | *[Designed]* | — | — | — |

---

## GRAVEYARD

*Extreme high-density undead swarm. Plague/contagion theme.*
*Inherits Swamp dot-resist + hit-to-dot armor, Cave regen-burst charm. Cave axe (debuff branch).*

| Slot | Name | Base Stats | Key Mechanic | Notes |
|---|---|---|---|---|
| Weapon | **Plague Axe** | ATK 110, APS 1.10 | `dead-swing-interval: 3, dead-swing-debuff: vulnerable, dead-swing-debuff-pct: 0.20, dead-swing-debuff-ms: 4000` | Dead swing (every 3rd attack): no damage but applies 20% vulnerability for 4s. Party synergy — all damage on target increases. Note: dead swing must NOT consume class mechanic resources (design bible invariant) |
| Armor | **Plaguebound Mantle** | HP 150, PLT 36 | `dot-resistance: 0.40, hit-to-dot-pct: 0.22, debuff-resist: 0.25` | †`nearby-enemy-plating: 2` per nearby enemy (cap 5 enemies = +10 PLT). High-density passive reward. Upgrades: +HP 36, +PLT 9/step |
| Armor (alt) | **Debt Ward** | HP 150, PLT 30 | `dot-resistance: 0.40, hit-to-dot-pct: 0.22` | †`debt-cheat-death: 1` — once per combat, if accumulated damage debt would exceed current HP pool, the debt clears completely. Cross-pollination of Desert last-stand with Swamp debt mechanic. No shield required |
| Charm | **Necrotic Pulse** | hpRegen 14 | `regen-burst-pct: 0.13` (+0.03/step → 0.22), `regen-burst-interval-ms: 6000` | Baseline regen-burst inherited from Cave. No kill-trigger (moved to T5) — fires on standard 6s timer |
| Charm (alt) | **Grave-Tide Pulse** | hpRegen 14 | `regen-burst-pct: 0.10` (+0.02/step → 0.16), `regen-burst-interval-ms: 8000`, `in-combat-regen-pct: 0.08` (+0.02/step → 0.14) | Combined burst + trickle. Slower burst interval compensated by baseline in-combat regen. Rewards long sustained farm sessions in the dense Graveyard biome |
| Boots | *[Designed: kill-stack speed + tenacity]* | — | — | — |

---

## DEEP-SEA TRENCH

*Extreme low-density rare abyssal terrors. Execute, patient single-target.*
*Inherits Cave premium-DR armor, Cave stealth boots, Cave axe (sustained-DPS branch).*

| Slot | Name | Base Stats | Key Mechanic | Notes |
|---|---|---|---|---|
| Weapon | **Abyssal Axe** | ATK 110, APS 1.15 | `dead-swing-interval: 4` | Sustained-DPS Cave branch. Lower miss frequency (1-in-4 vs 1-in-3). †`execute-threshold-pct: 0.20, execute-dmg-mult: 2.5` — attacks vs enemies below 20% HP deal 2.5×. The rare abyssal elite rarely reaches 20%; when it does, finish it fast. Upgrades: +ATK 20/step → 170 at +3 |
| Armor | **Abyssal Carapace** | HP 90, PLT 24, DR 0.22 | Premium DR | †`sustained-fight-dr-bonus: 0.01, sustained-fight-dr-max: 0.05, sustained-fight-ramptime-ms: 10000` — DR ramps up +1% per ~2s of sustained combat, capping at +5% after 10s. Against the rare long abyssal fight, patience earns extra mitigation. Upgrades: +HP 22, +PLT 6, +DR 0.02/step → DR 0.28 at +3 |
| Charm | **Pressure Vessel** | hpRegen 14 | `absorb-pct: 0.16` (+0.03/step → 0.25), `regen-burst-pct: 0.10` (+0.02/step → 0.16), `regen-burst-interval-ms: 8000` | Absorb softens the rare enormous single hits. Burst heal on an 8s timer provides periodic recovery. No kill-trigger (kills are rare in this biome anyway) |
| Boots | **Abyssal Stalkers** *(TBD — stealth branch from Cave)* | Base stats TBD | `stealth-pct: 0.65` | †Reduces enemy detection range by 65%. Approach rare abyssal creatures before they aggro. Consider: brief speed burst when breaking stealth (`stealth-break-sprint-ms: 1500`). Only boots in this document not yet designed |

---

## Brainstormed Mechanics Not Yet Assigned

Ideas that emerged in this session without a confirmed home. Candidates for variants or future biomes.

| Mechanic | Key | Description | Best Fit |
|---|---|---|---|
| Overheal → Shield | `overheal-shield-pct` | Excess healing beyond max HP converts to temp shield at X rate | Jungle (Overgrowth Pulse charm) or Volcanic (Lava-Tempered Hide armor) |
| Shield-break HP recovery | `shield-break-hp-recovery-pct` | On shield break, recover X% of shield max value as HP | Mountain (Stormwall Plate armor / Shieldmend Ward charm) |
| Damage debt cheat-death | `debt-cheat-death` | Once per combat, if accumulated debt would kill you, it clears completely | Graveyard (Debt Ward armor) |
| Long-fight absorb ramp | `absorb-ramp-start/max/ramptime` | Absorb-pct ramps from a low start to peak over X seconds in combat | Trench or Tundra (long-fight alt charm) |
| Nearby-enemy plating | `nearby-enemy-plating` | Gain flat plating per nearby enemy (capped) | Graveyard armor (density reward) |
| Sustained-fight DR ramp | `sustained-fight-dr-bonus/max/ramptime` | DR ramps slowly over a single long fight | Trench armor (patient elite tanking) |
| Execute threshold | `execute-threshold-pct, execute-dmg-mult` | Bonus damage vs enemies below X% HP | Trench weapon |
| Shield break → sprint | `stealth-break-sprint-ms` | Brief speed burst when breaking out of stealth | Trench boots |
| Empowered mult bonus | `empowered-mult-bonus` | Flat additive bonus to class empowered multiplier | Mountain weapon (Warmaul) |

---

## New Engine Keys Required (T4 Items)

All mechanics marked † need engine implementation before going live.

| Key | Mechanic | Priority |
|---|---|---|
| `weapon.empowered-mult-bonus` | Flat bonus to class empowered multiplier | Before balance pass |
| `defense.max-hit-rearms-shield` | Cap trigger immediately rearms shield charm | Before balance pass |
| `defense.shield-break-hp-recovery-pct` | HP recovery on shield break | Before balance pass |
| `defense.shield-break-heal-pct` | Alias for the charm version | Same |
| `defense.post-cheat-death-atk-mult` | ATK bonus window after cheat-death survives | Before balance pass |
| `defense.cleanse-per-stack-heal-pct` | Heal per cleansed stack | Before balance pass |
| `defense.evasion-speed-scaling` | Evasion rate scales with move speed | Before balance pass |
| `weapon.brittle-shatter-threshold` | Brittle max-stack shatter trigger | Before balance pass |
| `weapon.brittle-shatter-dr-strip-ms` | Duration of DR strip after shatter | Same |
| `defense.overheal-shield-pct` | Overheal → temp shield conversion | Before balance pass |
| `defense.absorb-ramp-start-pct` | Absorb ramp starting value | Before balance pass |
| `defense.absorb-ramp-max-pct` | Absorb ramp cap | Before balance pass |
| `defense.absorb-ramptime-ms` | Time to reach absorb ramp cap | Before balance pass |
| `defense.nearby-enemy-plating` | Plating bonus per nearby enemy | Before balance pass |
| `defense.debt-cheat-death` | Debt clears if it would kill you (once per combat) | Before balance pass |
| `defense.sustained-fight-dr-bonus` | DR ramps over a single fight | Before balance pass |
| `weapon.execute-threshold-pct` | Execute trigger HP threshold | Before balance pass |
| `weapon.execute-dmg-mult` | Execute damage multiplier | Same |
| `weapon.dead-swing-debuff` | Debuff type applied by dead swing | Before balance pass |
| `weapon.dead-swing-debuff-pct` | Debuff magnitude | Same |
| `mobility.stealth-break-sprint-ms` | Sprint duration when breaking stealth | Before Trench boots |

---

## Relic System — T4 Framework (Sketch)

Relics occupy a new slot introduced at T4. One relic slot per player.

**Three core stats:**
- `mechanic_frequency` — affects how often the class mechanic triggers (Cadence: threshold, Cooldown: CD, Energy: energy gain, Reload: reload time/clip size, DoT: tick rate)
- `mechanic_potency` — affects how strong the mechanic hit is (multiplier, discharge damage, clip size, DoT conversion %)
- `buff_multiplier` — affects the magnitude of all mechanic-triggered buffs (Rampage stacks, Overdrive bonus, Binary Cycle buffs, Momentum stacks, etc.)

**Design rule:** most relics carry a positive on one or two stats and a negative on another. Pure positives exist only as low-value "safe" options.

**Candidate T4 relics:**

| Name | freq | potency | buff_mult | Secondary Effect |
|---|---|---|---|---|
| Hastebound Core | +0.30 | −0.20 | — | — |
| Brutality Core | −0.30 | +0.40 | — | — |
| Wellspring Core | −0.15 | — | +0.40 | — |
| Cascade Core | +0.20 | −0.25 | +0.20 | — |
| Balanced Shard | +0.10 | +0.10 | +0.10 | — |
| Empowered Trigger | — | +0.20 | +0.15 | On mechanic trigger: heal for X HP (flat, TBD) |
| Armor-Pierce Trigger | +0.15 | — | — | Mechanic triggers bypass 15% plating |
| Shield Trigger | −0.15 | +0.25 | — | Mechanic triggers generate a small shield (X% maxHP) |
| Frequency/Buff Shard | +0.25 | −0.30 | +0.25 | — |

**Class-specific frequency/potency mapping:**
| Class | Frequency effect | Potency effect |
|---|---|---|
| Cadence | −1 to attack threshold | +X to empowered multiplier |
| Cooldown | −Xs to execution CD | +X to execution multiplier |
| Energy | +X energy per hit | +X% to discharge damage |
| Reload | −Xs reload time | +X rounds clip size |
| DoT | Faster DoT ticks | Higher dot-conversion-pct |

**Note:** negative frequency relics (longer CD, fewer triggers) are legitimate; they pair with potency relics for "fewer but enormous" builds. The Reload biome specifically benefits: smaller clip + shorter reload (Hastebound) pairs with Sniper; larger clip + longer reload (Brutality) pairs with Chain Gun and Siege.

