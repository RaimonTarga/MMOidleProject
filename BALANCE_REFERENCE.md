# MMO Idle — Balance Reference Document

This document is a complete authoritative snapshot of all combat formulas, classes,
items, and monsters for use in external balance modelling. Focus tier is **T2 design**
(T1 is considered a completed balance pass).

---

## CORE GAMEPLAY LOOP

1. Player spawns in the Clearing (T0), enables AUTO combat.
2. Server drives movement toward the nearest monster; attacks fire automatically on cooldown.
3. Kills grant **essence** (coloured by biome) and **biome XP**.
4. Essence is spent at the Forge to **craft equipment** (4 slots: weapon, armor, recovery, mobility).
5. Biome XP levels up the biome level for the active biome; each level unlocks new recipes.
6. Killing 10 Tiny Slimes completes the T0 quest → awards 1 **skill point** and advances to player tier 1.
7. Each player tier is gated by a **tier quest** requiring one dungeon boss kill.
8. Skill points are spent on the **class skill tree** (one node per point, T0–T7).
9. The skill tree is: T0 (pick class) → T1 (pick sub-variant) → T2 (pick range) → T3 (pick path modifier) → T4–7 (path progression, currently placeholders).
10. Nodes are locked to the current skill tier — you cannot skip ahead.
11. The world is an 11×11 grid. Chebyshev distance from center determines tier band: 0 = T0, 1–2 = T1, 3 = T2, 4 = T3, 5 = T4.
12. Dungeon nodes (one per biome per tier) contain a persistent boss in addition to normal monsters.
13. Death → respawn in the Clearing; all status effects cleared.

---

## COMBAT FORMULA

### Player → Monster

```
effectivePlating = max(0, monster.plating - platingShredStacks × shredPerStack)
rawDamage        = max(0, player.attack - effectivePlating)
finalDamage      = max(1, round(rawDamage × (1 - monster.damageReduction)))
```

### Monster → Player

```
rawDamage   = max(0, monster.attack - player.plating)
finalDamage = max(1, round(rawDamage × (1 - player.damageReduction)))
```

### Empowered AoE Splash
Every empowered attack (from any archetype) auto-triggers an AoE on the primary target:
```
splashDamage = round(player.attack × 0.5)   // uses raw attack stat, NOT empowered damage
splashRadius = 80px
```
AoE bypasses the combat pipeline (no `onHit` listeners). Affects all other monsters within 80px of the primary target.

### Evasion
`player.evasion` is a hit counter threshold. Every N incoming hits, the Nth is fully nullified (damage = 0). `evasion = 0` means disabled.

### Plating Shred (Cursed Finale passive)
`platingReduction` stored in the monster's status effect `data` field. Shred stacks have no cap and persist until the monster dies.

---

## PLAYER BASE STATS

| Stat | Value |
|---|---|
| HP | 100 |
| Attack | 15 |
| Plating | 2 |
| Damage Reduction | 0% |
| Evasion | 0 (disabled) |
| Attack Range | 60 px |
| Attack Cooldown | 3000 ms (unarmed) |
| HP Regen | 10% of maxHp / s (OOC) |
| Speed | 120 px/s |

---

## STAT REBUILD ORDER

Applied deterministically whenever skills or equipment change:

1. **Reset** to base constants above.
2. **Weapon APS:** if weapon has `attacksPerSecond`, set `attackCooldown = round(1000 / aps)` before skill deltas.
3. **Skill stat effects:** iterate `unlockedSkills`, apply additive deltas; accumulate `mechanicEffects` into `player.passives`.
4. **Clamp:** `attackCooldown ≥ 200ms`; `damageReduction` clamp 0–0.9.
5. **Close-range class bonus** (if `selectedRange === 'range-close'`):

| Class | +Plating | +HpRegen |
|---|---|---|
| Cooldown | +5 | +1 |
| DoT | +4 | +2 |
| Cadence | +3 | +3 |
| Reload | +2 | +4 |
| Energy | +1 | +5 |

6. **Equipment stat modifiers + mechanic effects** — additive on top of skills.
7. **Reload final multiplier** (Reload class only): `attack × 0.5`, `attackCooldown × 0.5`. Applied last so it scales with all gear.
8. **HP clamp:** `hp = max(1, min(hp, maxHp))`.

---

## DEFENSIVE STATS & RECOVERY

### Direct Stats

| Stat | Description |
|---|---|
| `plating` | Flat subtracted from incoming damage before % reduction |
| `damageReduction` | % reduction applied after plating; cap 90% |
| `evasion` | Hit counter threshold; every N hits, Nth is nullified |
| `maxHp` | Total health pool |
| `hpRegen` | % of maxHp healed per second (OOC by default) |
| `shields[]` | Temporary HP buffer; absorbs damage before real HP |

### Mechanic Passives (from skills and equipment)

These accumulate additively into `player.passives` and are read by defense systems at runtime.

| Key | Effect |
|---|---|
| `defense.in-combat-regen-pct` | Fraction of OOC regen applied while in combat |
| `defense.regen-burst-pct` | % maxHp healed over 4 s per burst event |
| `defense.regen-burst-interval-ms` | ms between burst regen events |
| `defense.shield-pct` | % maxHp shield applied periodically |
| `defense.shield-interval-ms` | ms between shield applications |
| `defense.shield-duration-ms` | ms before a shield expires (omit or -1 for permanent until depleted) |
| `defense.absorb-pct` | Fraction of damage taken deferred into a delayed HoT pool |
| `defense.dot-resistance` | Fraction by which incoming DoT damage is reduced |
| `defense.hit-to-dot-pct` | Fraction of incoming direct damage deferred as a DoT debt |
| `defense.debuff-resistance` | Reduces debuff duration/potency |
| `defense.cleanse-stacks` | Stacks removed per cleanse trigger |
| `defense.cleanse-interval-ms` | ms between cleanse triggers |
| `defense.max-hit-pct` | Clamps a single incoming hit to X% of maxHp |

### OOC Regen Formula

```
// Applies only when: hp < maxHp AND lastCombat > 4000ms ago
rawRegen     = maxHp × (hpRegen / 100) × (dt / 1000)
healAmount   = rawRegen × antiHealMultiplier   // antiHeal from absorb debt
player.hp   += healAmount
```

### In-Combat Regen
```
inCombatHeal = (maxHp × (hpRegen / 100) × (dt / 1000)) × defense.in-combat-regen-pct
```

### Periodic Regen Burst
Fires on a timer (`regen-burst-interval-ms`). Heals `regen-burst-pct × maxHp` distributed over 4 seconds as a HoT.

### Periodic Shield
On combat entry or on timer: creates a shield with `shield-pct × maxHp` HP. Duration = `shield-duration-ms` (-1 or omit = permanent until depleted). Interval = `shield-interval-ms`.

### Damage Absorption Pool (absorb-pct)
```
poolAddition = incomingDamage × absorb-pct
// Pool drains: 25% of remaining pool per second (once/second via debtTick cooldown)
// Zeroes out when pool < 0.5 to prevent asymptotic trickle
// drainAmount returned as healing to offset original damage
```

### Hit-to-DoT Debt (hit-to-dot-pct)
```
debtAddition = incomingDamage × hit-to-dot-pct
// Drains proportionally each tick; zeroes out when < 0.5
```

### DoT Resistance
```
mitigatedDoTDamage = rawDoTDamage × (1 - dot-resistance)
```

### Monster OOC Regen
- Rate: 20% of maxHp/s
- Delay: 5000ms after last aggro drop
- Prevents attriting bosses across multiple engagements

---

## CLASS MECHANIC SYSTEM

### Overview

Five classes are available. Each class is chosen at T0, sub-variant at T1, range at T2, and a path modifier at T3. Stats are cumulative (each tier adds on top of previous).

### Combat Archetype Passives Namespace

Mechanic effects use dot-separated namespaces. Values accumulate additively across all unlocked nodes:
- `cadence.*` — Cadence archetype
- `cooldown.*` — Cooldown archetype
- `energy.*` — Energy archetype
- `reload.*` — Reload archetype
- `dot.*` — DoT archetype
- `defense.*` — All defense/recovery mechanics (read by defenseSystems.ts)

---

## CLASS 1: CADENCE

**Identity:** Hit counter → empowered finisher on every Nth hit.

**T0 Base Stats:** +8 ATK, +18 HP, +2 PLT, +3% DR
**T0 Defense Passive:** `defense.regen-burst-pct: 0.08, defense.regen-burst-interval-ms: 10000` (restores 8% maxHp over 4s every 10s)

### T1 Sub-Variants

| Sub-Variant | Threshold | Mult | Stat Changes |
|---|---|---|---|
| Light | 4 hits | 1.5× | +6 ATK, +18 SPD, −22 HP, −400ms CD |
| Balanced | 5 hits | 2× | +9 ATK, +16 HP, +1 PLT, +2 hpRegen |
| Heavy | 6 hits | 4× | +12 ATK, +38 HP, +7 PLT, +5 hpRegen, +4% DR, −20 SPD, +300ms CD |

### T3 Paths

**Cadence Light:**
- **Accelerando** — Finisher grants 1 speed stack (up to 5). Each stack reduces attackCooldown. Stacks lost on death or re-equip.
- **Cursed Finale** — Finisher applies: 25% vuln for 5s AND permanent −5 flat plating shred (no cap). Triggering finisher benefits from vuln.
- **Double Time** — Finisher strikes twice; both hits apply the full multiplier.

**Cadence Balanced:**
- **Rapid Tempo** — `cadence.threshold-mod: -2` (reduces combo length by 2 hits)
- **Rising Tide** — Each buildup hit amplifies finisher by 20% per hit. After finisher: next 5 attacks deal +50% damage.
- **Delayed Verdict** — Finisher tags enemy with detonation charge. Detonates after 3s for the sum of all buildup attack damage. Re-tag resets the fuse.

**Cadence Heavy:**
- **Overwhelming Force** — `cadence.threshold-mod: +2, cadence.damage-mult-add: +1.0` → threshold 8, mult 5×
- **Hemorrhage** — Finisher converts all its damage into a non-stacking DoT: 150% of finisher damage over 4s. Re-triggering refreshes (does not stack).
- **Iron Patience** — Each buildup attack stores 30% of its damage as potential energy. Finisher consumes all stored charge as bonus damage.

---

## CLASS 2: COOLDOWN

**Identity:** Countdown timer → empowered execution strike fires on the next attack.

**T0 Base Stats:** +6 ATK, +28 HP, +3 PLT, +5% DR, −10 SPD
**T0 Defense Passive:** `defense.in-combat-regen-pct: 0.12` (12% of OOC regen applies while fighting)

### T1 Sub-Variants

| Sub-Variant | CD | Mult | Stat Changes |
|---|---|---|---|
| Light | 5 s | 1.5× | +8 ATK, +22 SPD, −22 HP, −3 PLT, −2% DR, −300ms CD |
| Balanced | 7 s | 2× | +10 ATK, +22 HP, +5 PLT, +5 hpRegen, +5% DR, −8 SPD |
| Heavy | 9 s | 3× | +15 ATK, +42 HP, +7 PLT, +7 hpRegen, +8% DR, −28 SPD, +450ms CD |

### T3 Paths

**Cooldown Light (implemented):**
- **Overdrive** — Execution does no extra damage. Instead triggers 50% faster attacks for 2.5s. ~50% uptime at 5s CD.
- **Eternal Cycle** — Execution CD stretched to 10s. Each attack builds charge → ATK damage bonus. Execution fires `attack × stacks` then resets all charge.
- **Temporal Extension** — Execution grants a flat on-hit damage buff. Each attack extends the buff by 1s. Stop attacking = buff expires.

**Cooldown Balanced (implemented):**
- **Acceleration** — Each attack reduces execution CD by 1000ms.
- **Battery** — Each second the CD ticks down grants a stacking power buff → ATK damage. Execution spends all stacks.
- **Alignment** — Post-execution: +50% APS for 2s; when that window closes, remaining CD is halved.

**Cooldown Heavy (DESIGNED ONLY — not implemented):**
- **Entropy Collapse** — Execution → 8-tick wound over 8s; each tick scales with target missing HP (up to 4× at 90% missing).
- **Singular Extraction** — Normal attacks deal no damage. Execution fires on a greatly shortened CD and hits very hard. Leaving combat for 4s resets preparation.
- **Channeled Beam** — Execution becomes a 3s channel: stand still, continuously damage target. Re-acquires on target death mid-channel.

---

## CLASS 3: ENERGY

**Identity:** Energy 0–100 fills on hits. At 100, next attack is Empowered (pool resets to 0).

**T0 Base Stats:** +5 ATK, +14 SPD, −200ms CD, −5 HP, +115 range, +1 PLT
**T0 Defense Passive:** `defense.shield-pct: 0.06, defense.shield-interval-ms: 14000, defense.shield-duration-ms: 14000`

### T1 Sub-Variants

| Sub-Variant | Energy/Hit | Mult | Stat Changes |
|---|---|---|---|
| Light | 20 | 1.5× | +4 ATK, +22 SPD, −22 HP, −400ms CD |
| Balanced | 14 | 2× | +6 ATK, +10 SPD, −200ms CD, −5 HP, +1 PLT |
| Heavy | 10 | 6× | +8 ATK, +24 HP, +3 PLT, +3 hpRegen, +3% DR, −10 SPD, +100ms CD |

### T3 Paths (all implemented)

**Energy Light:**
- **Flash** — Each attack teleports into melee range near the target (random offset per hit). `attackRange` is the engage distance; trades safe range for melee exposure. Blue Shift at 0 energy gives +45% damage. Red Shift at 100 energy gives -45% damage, +45% attack speed, +45% move speed, and +45% evasion (implemented as a lower evasion-hit threshold). Energy builds slowly (5/hit) and decays back to Blue Shift over 2 seconds on disengage instead of firing an AoE discharge.
- **Micro-Venting** — No discharge. While energy >50%, each attack consumes energy to deal flat on-hit bonus damage.
- **Polarity Decay** — Discharge fires at 50% damage (clears pool). Grants 5 overcharge stacks; basic attacks consume stacks for flat bonus before they decay.

**Energy Balanced:**
- **Alternating Currents** — Auto-cycles: Charge phase (2× energy gain, +20% dmg) → Discharge phase (energy drains over 3s as passive tick damage, +50% APS).
- **Harmonic Equilibrium** — +60% damage to all hits while energy is strictly 40–60%. Too empty or too full breaks the bonus.
- **Capacitor Shunt** — 50% of energy gain split to a reservoir (cap 500). Discharge fires normally but damage is amplified by total reservoir power.

**Energy Heavy:**
- **Singularity Execute** — 2× max energy (cap 200). Energy gain accelerates the fuller the pool. If basic attack detects target HP < projected discharge damage → triggers early discharge.
- **Cascading Induction** — Basic attacks deal 1 damage but plant Induction tags (15s duration). Discharge consumes all tags → exponential burst damage per tag count.
- **Superconducting Mass** — Basic attacks deal 0 damage but accumulate charge. Discharge: `empoweredMult × baseHit + totalCharge` as true damage (bypasses all defenses). Charge resets per discharge.

---

## CLASS 4: RELOAD

**Identity:** Magazine system — fire N rounds then enter a reload window (player cannot attack during reload).

**T0 Base Stats:** +12 SPD, −8 HP, +105 range, evasion 10
**T0 Defense Passive:** none (evasion identity)
**CRITICAL — Final Multiplier (always applied last):** `attack × 0.5`, `attackCooldown × 0.5`

This means Reload attacks twice as fast at half damage per shot, as a fundamental layer applied after all additive bonuses. Never include this in additive design.

### T1 Sub-Variants

| Sub-Variant | Magazine | Reload Time | Stat Changes |
|---|---|---|---|
| Light | 5 rounds | 1500 ms | +6 ATK, +18 SPD, −18 HP, −200ms CD, evasion +5 |
| Balanced | 8 rounds | 2500 ms | +9 ATK, +10 HP, +6 SPD, +2 hpRegen, evasion +3 |
| Heavy | 12 rounds | 4000 ms | +12 ATK, +32 HP, +5 PLT, +4 hpRegen, −12 SPD, +200ms CD |

### T3 Paths (DESIGNED — none implemented yet)

**Reload Light:**
- **Exploding Clip** — Last bullet in every clip: 3× damage.
- **Preemptive Strike** — First bullet after a fresh reload: 2.5× damage.
- **High Powered** — Clip reduced to 3 rounds (`reload.max-ammo: -2` additive on the base). Each bullet ramps: shot 1 normal, shot 2 +50%, shot 3 +100%.

**Reload Balanced:**
- **Death Mark** — Each attack applies a Death Mark stack (cap 10). Reloading detonates all stacks: `attack × stacks × 0.5` bonus damage.
- **Continuous Firing** — Each attack builds reload speed stacks (up to 4 stacks = 800ms reload reduction). Reloading: grants +30% ATK buff for 3s and resets stacks.
- **Finishing Strike** — Last bullet scales with target missing HP: 1.5× at full HP → 3× at 90% missing.

**Reload Heavy:**
- **Momentum** — Per-hit: +5% ATK and +3% APS stacks (cap 8). All stacks reset on reload.
- **Heat** — Attacks deal 30% less damage but apply Heat stacks (up to clip size) that tick 15% ATK damage/s each. Reload detonates all stacks: `attack × stacks × 0.5`.
- **Burst** — After reload: gain damage stacks equal to clip size (+15% ATK each). Each attack converts one damage stack to a speed stack. Both expire when all stacks are spent.

---

## CLASS 5: DoT

**Identity:** Every hit redirects `convPct` of attack damage into stacking damage-over-time. Direct hit deals `(1 - convPct)` normal damage.

**T0 Base Stats:** +6 ATK, +18 HP, +2 PLT, +3% DR, +1 hpRegen, +50 range
**T0 Defense Passive:** `defense.dot-resistance: 0.12, defense.hit-to-dot-pct: 0.10`

### DoT Mechanics

**Damage per stack (derived at hit time — NEVER stored statically):**
```
damagePerStack = player.attack × dot.conversion-pct / maxStacks
```

**Tick formula (diminishing returns):**
```
tickDamage = damagePerStack × sqrt(currentStacks × maxStacks)
// At full stacks: identical to linear scaling
// Below full stacks: boosted above linear (rewards early application)
```

**Duration:** 4500ms without a hit. Refreshed (not stacked) on every hit. Permafrost is the only exception (permanent).

**Max-stacks refresh:** Hitting a maxed target resets `nextTickIn` to the full tick interval.

**Default tick rate:** 1000ms. Modified by `dot.tick-interval-ms` passive.

### T1 Sub-Variants

| Sub-Variant | Element | convPct | maxStacks | Stat Changes |
|---|---|---|---|---|
| Light | Poison | 30% | 8 | +6 ATK, +20 SPD, −22 HP, −2 PLT, −300ms CD |
| Balanced | Fire | 50% | 6 | +9 ATK, +16 HP, +3 PLT, +3 hpRegen, −5 SPD |
| Heavy | Frost | 70% | 3 | +10 ATK, +32 HP, +6 PLT, +6 hpRegen, +6% DR, −28 SPD, +400ms CD |

### T3 Paths (all implemented)

**Poison (Light):**
- **Poison Explosion** — Stack cap raises to 20. Reaching 20 stacks: instant burst = 10 full ticks of damage, then all stacks clear.
- **Eternal Doom** — No stack cap. Stacks 1–8: full damage per tick. Stacks 9+: 50% effectiveness (plateaus naturally around 30–40 stacks). Best on long sustained fights.
- **Invigorating Toxins** — While attacking a poisoned enemy: +2 flat ATK and +2% APS per poison stack on target. Updates continuously, resets on target switch.

**Fire (Balanced):**
- **Fan the Flames** — Each hit applies 2 stacks at 50% tick damage. Hitting a target at max stacks: bonus direct hit equal to `3 × maxStack-dmg`.
- **Smoldering Ember** — Each burn stack adds 3% vuln to the target (up to 18% at 6 stacks). Affects both your direct hits and your burn ticks.
- **Conflagration** — Target reaching max stacks: all stacks replaced by Conflagration (same total damage, 2× tick rate, half duration). Cannot re-stack during Conflagration.

**Frost (Heavy):**
- **Permafrost** — Locked to 1 permanent stack (`data.t3Perm = 1`). Each hit on target adds +1% of ATK to the tick (capped at +35% ATK at 35 hits). Ramp persists for the monster's entire life.
- **Freezing Cold** — Each frost stack also applies 1 Chill stack. Each Chill: −12% speed and APS on target. 3 Chill stacks → **Freeze** 2s (monster cannot act) + 35% bonus damage from all sources for freeze duration.
- **Glacial Fracture** — Hitting a target already at max frost stacks: shatter all stacks → burst damage `maxStacks² × damagePerStack` + knockback + apply 1 fresh stack. Build-then-shatter rhythm.

### Monster → Player DoT
Monsters with `dotEffect` apply stacks on every hit. These bypass the player combat pipeline but are mitigated by `damageReduction` (%) and `defense.dot-resistance`. Respawn clears all status effects.

---

## TIER 2 UNIVERSAL RANGE NODES

Applied identically for all classes. One must be chosen before T3 unlocks.

| Node | Range Δ | Attack Δ | CD Δ | Other |
|---|---|---|---|---|
| range-close | −40 px | +5 | −300ms | +3 PLT, +6% DR, +12 HP; **plus class close-range bonus** |
| range-mid | — | — | — | Nothing |
| range-far | +120 px | −8 | +400ms | Nothing |

---

## EQUIPMENT SYSTEM

### Slots
- **weapon** — Sets APS (attack cooldown), ATK bonus, and weapon effects
- **armor** — HP, plating, damage reduction, evasion, defensive passives
- **recovery** — hpRegen, recovery mechanic passives (shields, burst, absorb, in-combat regen)
- **mobility** — speed

### Essences by Biome

| Biome | Primary Essence | Secondary Essence (T2 recipes) |
|---|---|---|
| Clearing | Green | — |
| Forest | Green | Yellow |
| Mountain | Blue | Purple |
| Plains | Yellow | Red |
| Swamp | Purple | Green |
| Cave | Blue | Purple |
| Jungle | Green | Yellow |
| Tundra | Blue | Purple + Green |
| Desert | Yellow | Red + Blue |
| Volcanic | Red | Yellow + Purple |

### Starter Gear (hardcoded, not craftable via recipe)

| Item | Slot | Stats |
|---|---|---|
| Basic Sword | weapon | +5 ATK, 0.5 APS |
| Leather Armor | armor | +5 PLT |
| Bandage Charm | recovery | +2 hpRegen |
| Light Boots | mobility | +15 SPD |

---

## CRAFTABLE ITEMS — TIER 1 (Ring 1 Biomes)

Items from T1 biomes. Biome level cap at player tier 1 = **level 5**.

### Clearing (Tutorial)

| Item | Slot | Cost | Key Stats | APS |
|---|---|---|---|---|
| Primordial Club | weapon | 8 green | +5 ATK | 0.70 |
| Bark Wrap | armor | 8 green | +4 PLT | — |
| Soft Boots | mobility | 6 green | +12 SPD | — |
| Herb Pouch | recovery | 6 green | +2 hpRegen | — |

### Forest (green essence)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Flash Rapier | weapon | 1 | 20g | +4 ATK | 1.50 | Fastest T1 weapon |
| Shaded Bindings | armor | 2 | 20g | +10 HP, +2 PLT, evasion 6 | — | Every 6th hit evaded |
| Heartroot Amulet | recovery | 3 | 15g | +6 hpRegen | — | Fastest OOC regen in ring 1 |
| Sprinter Wraps | mobility | 4 | 15g | +20 SPD | — | |

### Mountain (blue essence)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Heavy Hammer | weapon | 1 | 22b | +16 ATK | 0.40 | Hardest hitting T1 weapon |
| Fallen Knight Plate | armor | 2 | 22b | +8 HP, +10 PLT, +5% DR | — | |
| Granite Barrier | recovery | 3 | 18b | +3 hpRegen | — | 10% HP shield every 10s |
| Iron Treads | mobility | 4 | 18b | +18 SPD | — | |

### Plains (yellow essence)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Sacred Cross | weapon | 1 | 20y | +6 ATK | 0.50 | Divine burst every 12s |
| Survivor's Robe | armor | 2 | 20y | +12 HP, +3 PLT, +15% DR | — | Highest T1 DR |
| Plains Core | recovery | 3 | 16y | +4 hpRegen | — | `in-combat-regen-pct: 0.20` |
| Fleet Boots | mobility | 4 | 16y | +25 SPD | — | |

### Swamp (purple essence)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Ashbrand Blade | weapon | 1 | 22p | +7 ATK | 0.75 | 30% DoT conversion, 5 stacks |
| Arcane Wrappings | armor | 2 | 22p | +10 HP, +3 PLT | — | `dot-resistance: 0.18` |
| Murk Eye | recovery | 3 | 18p | +3 hpRegen | — | `absorb-pct: 0.10` |
| Marsh Treads | mobility | 4 | 18p | +20 SPD | — | |

### Cave (blue essence)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Chaotic Axe | weapon | 1 | 22b | +10 ATK | 1.10 | 2/3 hits land; 1/3 misses |
| Bestial Hide | armor | 2 | 22b | +20 HP, +3 PLT, +8% DR | — | Highest T1 HP |
| Pulse Stone | recovery | 3 | 18b | +3 hpRegen | — | `regen-burst-pct: 0.10` every 10s |
| Bat Wing Boots | mobility | 4 | 18b | +28 SPD | — | |

---

## CRAFTABLE ITEMS — TIER 2 (Ring 2 Biomes — designed, available from T2 nodes)

Biome level cap at player tier 2 = **level 10**. T2 recipes require biome level 6–9. Costs require primary + secondary essence.

### Forest T2 (green + yellow)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Ironwood Blade | weapon | 6 | 48g+12y | +18 ATK | 1.0 | |
| Phantom Bindings | armor | 7 | 48g+12y | +18 HP, +4 PLT, evasion 5 | — | `max-hit-pct: 0.25` (softcap any single hit at 25% maxHp) |
| Ancient Heartroot Amulet | recovery | 8 | 38g+10y | +10 hpRegen | — | |
| Windstep Wraps | mobility | 9 | 38g+10y | +40 SPD | — | |

### Mountain T2 (blue + purple)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Peak Blade | weapon | 6 | 52b+13p | +22 ATK | 1.0 | |
| Iron Crusader Plate | armor | 7 | 52b+13p | +15 HP, +18 PLT, +8% DR | — | `hit-to-dot-pct: 0.12` |
| Iron Bulwark | recovery | 8 | 42b+10p | +6 hpRegen | — | 15% HP shield every 8s |
| Mountain Stride | mobility | 9 | 42b+10p | +45 SPD | — | |

### Plains T2 (yellow + red)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Storm Blade | weapon | 6 | 50y+12r | +20 ATK | 1.0 | |
| Enduring Robe | armor | 7 | 50y+12r | +25 HP, +5 PLT, +20% DR | — | `absorb-pct: 0.08` |
| Stalwart Core | recovery | 8 | 40y+10r | +7 hpRegen | — | `in-combat-regen-pct: 0.30` |
| Gale Boots | mobility | 9 | 40y+10r | +48 SPD | — | |

### Swamp T2 (purple + green)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Venom Blade | weapon | 6 | 54p+14g | +24 ATK | 1.0 | |
| Void Wrappings | armor | 7 | 54p+14g | +20 HP, +6 PLT | — | `dot-resistance: 0.30, debuff-resistance: 0.12` |
| Void Eye | recovery | 8 | 44p+11g | +6 hpRegen | — | `absorb-pct: 0.15` |
| Wetland Wraps | mobility | 9 | 44p+11g | +50 SPD | — | |

### Cave T2 (blue + purple)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Troll Club | weapon | 6 | 54b+14p | +25 ATK | 1.0 | |
| Dire Bestial Hide | armor | 7 | 54b+14p | +38 HP, +6 PLT, +12% DR | — | `in-combat-regen-pct: 0.15` |
| Resonant Gem | recovery | 8 | 44b+11p | +6 hpRegen | — | `regen-burst-pct: 0.15` every 8s |
| Cavern Sprints | mobility | 9 | 44b+11p | +55 SPD | — | |

### Jungle T2 (green + yellow) — first appears T2

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Anaconda Fang | weapon | 6 | 54g+14y | +26 ATK | 1.0 | |
| Primal Wraps | armor | 7 | 54g+14y | +22 HP, +5 PLT, evasion 5 | — | `absorb-pct: 0.06` |
| Life Weave Amulet | recovery | 8 | 44g+11y | +8 hpRegen | — | |
| Predator Boots | mobility | 9 | 44g+11y | +52 SPD | — | |

### Jungle T1 items (available at any T2 jungle node, lower levels)

| Item | Slot | Biome Lv | Cost | Key Stats | Special |
|---|---|---|---|---|---|
| Verdant Wraps | armor | 1 | 22g | +10 HP, +2 PLT, evasion 6 | Every 6th hit evaded |
| Vine Wraps | mobility | 2 | 18g | +22 SPD | |
| Verdant Amulet | recovery | 3 | 18g | +5 hpRegen | Pure regen |

---

## CRAFTABLE ITEMS — RING 2 TIER 1 (Tundra, Desert, Volcanic)

These biomes only appear at T2 nodes (Chebyshev distance 3). Their "T1 ring-2" recipes are stronger than ring-1 T1 items but weaker than ring-2 T2 items. They cost only one essence type but in larger amounts (58–72).

**Stat scale guide:** ATK/DEF 28–32, SPD 55–62, REGEN 10–12, essence cost 58–72.

### Tundra (blue essence only)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Frost Blade | weapon | 1 | 70b | +28 ATK | 1.25 | |
| Frost-Forged Plate | armor | 2 | 70b | +18 HP, +22 PLT, +8% DR | — | |
| Frost Barrier | recovery | 3 | 58b | +10 hpRegen | — | 18% HP shield every 8s |
| Snowstep Boots | mobility | 4 | 58b | +55 SPD | — | |

### Desert (yellow essence only)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Scorpion Blade | weapon | 1 | 70y | +28 ATK | 1.25 | |
| Sunbaked Wrappings | armor | 2 | 70y | +25 HP, +14 PLT | — | `dot-resistance: 0.28, debuff-resistance: 0.10` |
| Sand Golem Eye | recovery | 3 | 58y | +10 hpRegen | — | `absorb-pct: 0.22` |
| Sand Sprint | mobility | 4 | 58y | +58 SPD | — | |

### Volcanic (red essence only) — first appears T3 geographically

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Ember Blade | weapon | 1 | 72r | +30 ATK | 1.25 | |
| Magma-Cured Hide | armor | 2 | 72r | +40 HP, +14 PLT, +10% DR | — | |
| Ember Core | recovery | 3 | 60r | +12 hpRegen | — | `in-combat-regen-pct: 0.35` |
| Lava Step | mobility | 4 | 60r | +60 SPD | — | |

---

## CRAFTABLE ITEMS — RING 2 TIER 2 (Tundra T2, Desert T2, Volcanic T2)

Top-end T2 items. Require 3 essence types. Strongest per-slot items currently designed.

**Stat scale guide:** ATK/DEF 50–65, SPD 90–100, REGEN 16–20, essence cost ~80–90 primary + 24 secondary + 12 tertiary.

### Tundra T2 (blue + purple + green)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Blizzard Edge | weapon | 6 | 84b+24p+12g | +50 ATK | 1.5 | |
| Glacial Crusader Plate | armor | 7 | 84b+24p+12g | +35 HP, +36 PLT, +12% DR | — | `hit-to-dot-pct: 0.18` |
| Glacial Bulwark | recovery | 8 | 68b+20p+10g | +16 hpRegen | — | 22% HP shield every 8s |
| Frost Wind Wraps | mobility | 9 | 68b+20p+10g | +92 SPD | — | |

### Desert T2 (yellow + red + blue)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Sandstorm Blade | weapon | 6 | 84y+24r+12b | +50 ATK | 1.5 | |
| Ancient Sunbaked Wrappings | armor | 7 | 84y+24r+12b | +42 HP, +24 PLT | — | `dot-resistance: 0.42, debuff-resistance: 0.22`, cleanse 1 stack every 8s |
| Stone Colossus Eye | recovery | 8 | 68y+20r+10b | +16 hpRegen | — | `absorb-pct: 0.28` |
| Dune Stride | mobility | 9 | 68y+20r+10b | +92 SPD | — | |

### Volcanic T2 (red + yellow + purple)

| Item | Slot | Biome Lv | Cost | Key Stats | APS | Special |
|---|---|---|---|---|---|---|
| Inferno Edge | weapon | 6 | 88r+25y+12p | +55 ATK | 1.5 | Highest ATK in T2 |
| Infernal Bestial Plate | armor | 7 | 88r+25y+12p | +65 HP, +22 PLT, +14% DR | — | `in-combat-regen-pct: 0.25, shield-pct: 0.08` every 12s |
| Infernal Core | recovery | 8 | 74r+21y+10p | +20 hpRegen | — | `in-combat-regen-pct: 0.45` |
| Magma Stride | mobility | 9 | 74r+21y+10p | +98 SPD | — | |

---

## BIOME XP SYSTEM

### XP per Kill (by node biomeTier)

| Node Tier | XP/kill |
|---|---|
| 0 | 5 |
| 1 | 10 |
| 2 | 20 |
| 3 | 35 |
| 4 | 55 |
| 5 | 80 |

### Biome Level XP Thresholds

Formula: `biomeXpForLevel(n) = round(80 × n^1.7)`

| Level | Total XP | T1 kills (10 XP) | T2 kills (20 XP) |
|---|---|---|---|
| 1 | 80 | 8 | 4 |
| 2 | 260 | 26 | 13 |
| 3 | 518 | 52 | 26 |
| 4 | 845 | 85 | 42 |
| 5 | 1,230 | 123 | 62 |
| 6 | 1,831 | — | 92 |
| 7 | 2,432 | — | 122 |
| 8 | 3,100 | — | 155 |
| 9 | 3,848 | — | 192 |
| 10 | 4,677 | — | 234 |

### Biome Level Caps by Player Tier

| Player Tier | Max Biome Level |
|---|---|
| 0 | 2 |
| 1 | 5 |
| 2 | 10 |
| 3 | 15 |
| 4 | 20 |

Recipe unlock levels: T1 biomes unlock at levels 1–4; T2 biomes unlock at levels 6–9. Recipes are unlocked automatically when the level is reached.

---

## PROGRESSION / QUEST SYSTEM

| Quest | Player Tier | Objective | Reward |
|---|---|---|---|
| First Blood | 0 | Kill 10 Tiny Slimes | → Tier 1 + 1 skill point |
| Dungeon Delver | 1 | Kill any 1 T1 dungeon boss | → Tier 2 + 1 skill point |
| Zone Conqueror | 2 | Kill any 1 T2 dungeon boss | → Tier 3 + 1 skill point |
| Veteran's Trial | 3 | Kill any 1 T3 dungeon boss | → Tier 4 + 1 skill point |
| Final Reckoning | 4 | Kill any 1 T4 dungeon boss | → Tier 5 + 1 skill point |

Additionally: 1 skill point per 100 player XP (flat; XP_PER_LEVEL = 100).

---

## MONSTERS — TIER 0

### Clearing
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Tiny Slime | 22 | 3 | 0 | 0% | 30 | 3000ms | 50 | 140 |

---

## MONSTERS — TIER 1

### Forest (fast/sustained, no defense — burst them down)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Forest Slime | 65 | 10 | 0 | 0% | 52 | 1800ms | 60 | 210 | |
| Wolf | 55 | 12 | 0 | 0% | 78 | 1400ms | 60 | 255 | High speed and pull |
| **Forest Warden** (boss) | **450** | **22** | **0** | **0%** | **52** | **2000ms** | **68** | **300** | High DPS spike |

### Mountain (two sub-types: fast skirmisher + pseudo-ranged)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Cliff Hopper | 60 | 12 | 0 | 0% | 80 | 1500ms | 60 | 275 | Sprint-attacks |
| Ridge Archer | 85 | 13 | 0 | 0% | 35 | 2800ms | **130** | 230 | Long range |
| **Mountain Sentinel** (boss) | **480** | **20** | **0** | **0%** | **58** | **1800ms** | **68** | **280** | Mobile, zero armor |

### Plains (balanced, no specialization)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Plains Slime | 90 | 11 | 0 | 0% | 42 | 2200ms | 60 | 190 | |
| Boar | 115 | 14 | 0 | 0% | 48 | 2000ms | 60 | 205 | |
| **Plains Champion** (boss) | **520** | **18** | **2** | **2%** | **50** | **2200ms** | **65** | **280** | Balanced profile |

### Swamp (attrition — slow, above-average defense, DoT)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Bog Slime | 80 | 10 | 2 | 0% | 28 | 2800ms | 60 | 165 | DoT: 2/stack, 3 stacks, 1s tick |
| Mud Toad | 95 | 12 | 2 | 4% | 30 | 2600ms | 60 | 180 | DoT: 3/stack, 3 stacks, 1s tick |
| **Bog Sovereign** (boss) | **500** | **16** | **4** | **4%** | **28** | **2800ms** | **68** | **260** | DoT: 4/stack, 4 stacks — attrition boss |

### Cave (high defense, hard slow hits — hardest T1 for low-ATK builds)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Cave Lurker | 100 | 16 | **4** | 0% | 22 | 3200ms | 60 | 145 | Low pull = ambush |
| Cave Brute | 130 | 19 | **5** | 0% | 17 | 3600ms | 60 | 125 | Hardest hitting T1 mob |
| **Cave Sentinel** (boss) | **650** | **22** | **7** | **4%** | **18** | **3200ms** | **65** | **240** | Most defensive T1 boss |

---

## MONSTERS — TIER 2

T2 monsters are meaningfully stronger than T1. Biomes introduce second monster variants and new threats. Dungeon non-boss monsters in T2 have ×2 HP and ×1.6 ATK applied by the dungeon scaling system.

### Forest T2
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Ancient Wolf | 75 | 18 | 3 | 0% | 85 | 1600ms | 60 | 270 | Faster and stronger wolf |
| Ironwood Golem | 200 | 15 | **12** | 0% | 18 | 3500ms | 60 | 150 | Extremely tanky |
| **Forest Elder** (boss) | **2200** | **58** | **22** | **8%** | **26** | **3000ms** | **74** | **310** | |

### Mountain T2
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Granite Titan | 220 | 14 | **12** | 0% | 15 | 3800ms | 65 | 150 | Very tanky |
| Stone Eagle | 65 | 22 | 2 | 0% | **92** | 1500ms | 60 | 280 | Fast aerial |
| **Stone Warden** (boss) | **2400** | **62** | **32** | **10%** | **20** | **4000ms** | **72** | **320** | Fortress boss |

### Plains T2
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Stampede Bull | 110 | **24** | 4 | 0% | 65 | 1900ms | 60 | 230 | High damage |
| Prairie Wolf | 80 | 18 | 2 | 0% | 78 | 1700ms | 60 | 260 | Fast |
| **Plains Overlord** (boss) | **2000** | **64** | **20** | **8%** | **46** | **2700ms** | **70** | **320** | |

### Swamp T2
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Swamp Hydra | 180 | 16 | 6 | 0% | 32 | 2500ms | 65 | 190 | Tanky |
| Bog Witch | 85 | **22** | 2 | 0% | 42 | 2200ms | 60 | 200 | High damage, paper defense |
| **Mire Lord** (boss) | **2100** | **58** | **22** | **9%** | **30** | **3000ms** | **68** | **300** | |

### Cave T2
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Giant Spider | 130 | 20 | 5 | 0% | 65 | 2000ms | 62 | 220 | Fast + plating |
| Cave Troll | 220 | 18 | **9** | 0% | 22 | 3600ms | 65 | 155 | Extremely tanky |
| **Cave Terror** (boss) | **2400** | **56** | **28** | **10%** | **18** | **4000ms** | **72** | **280** | |

### Jungle T2 (first appearance — mixed threat)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Jungle Snake | 48 | 13 | 1 | 0% | 62 | 2100ms | 60 | 210 | Fragile |
| Jungle Ape | 72 | 14 | 2 | 0% | 52 | 2200ms | 60 | 220 | |
| **Jungle Colossus** (boss) | **1800** | **68** | **17** | **7%** | **56** | **2400ms** | **66** | **320** | |

### Tundra T2 (first appearance)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Frost Slime | 100 | 14 | 6 | 0% | 28 | 2800ms | 60 | 170 | |
| Ice Bear | 240 | 22 | **10** | 0% | 38 | 3200ms | 65 | 200 | Massive HP + plating |
| **Glacial Colossus** (boss) | **2600** | **55** | **28** | **10%** | **18** | **3600ms** | **90** | **280** | Frost style |

### Desert T2 (first appearance)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Sand Scorpion | 90 | **22** | 4 | 0% | 72 | 2000ms | 60 | 230 | Fast and hits hard |
| Stone Basilisk | 180 | 18 | **9** | 0% | 32 | 3000ms | 62 | 175 | Tanky |
| **Desert Pharaoh** (boss) | **1900** | **74** | **18** | **10%** | **40** | **2600ms** | **74** | **340** | High ATK |

---

## MONSTERS — TIER 3

All T3 mobs drop `level: 2` essence rewards (compared to T1/T2 `level: 1`).

### Forest T3
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Cursed Wolf | 420 | 55 | 8 | 0% | 92 | 1400ms | 60 | 280 |
| Treant | 720 | 40 | 18 | 5% | 18 | 3800ms | 65 | 140 |
| **Elder Forest Warden** (boss) | **4500** | **102** | **38** | **13%** | **22** | **4000ms** | **78** | **350** |

### Mountain T3
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Rune Golem | 640 | 46 | 20 | 7% | 16 | 3600ms | 65 | 145 |
| Storm Eagle | 340 | 58 | 5 | 0% | 112 | 1300ms | 60 | 290 |
| **Peak Titan** (boss) | **4200** | **100** | **42** | **14%** | **18** | **4500ms** | **80** | **360** |

### Plains T3
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| War Mammoth | 680 | 42 | 14 | 4% | 42 | 2600ms | 65 | 220 |
| Dire Wolf | 380 | 54 | 8 | 0% | 98 | 1500ms | 60 | 280 |
| **Plains Warlord** (boss) | **3800** | **108** | **32** | **12%** | **50** | **3000ms** | **75** | **340** |

### Swamp T3
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Bog Horror | 600 | 44 | 15 | 5% | 24 | 2800ms | 65 | 170 |
| Plague Witch | 290 | 66 | 4 | 0% | 56 | 2000ms | 62 | 210 |
| **Bog Ancient** (boss) | **4200** | **98** | **36** | **13%** | **28** | **3500ms** | **78** | **330** |

### Cave T3
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Cave Behemoth | 750 | 42 | 22 | 7% | 16 | 4000ms | 65 | 140 |
| Venom Queen | 360 | 60 | 8 | 0% | 80 | 1800ms | 62 | 240 |
| **Cave Overlord** (boss) | **4800** | **96** | **48** | **15%** | **16** | **5000ms** | **82** | **330** |

### Jungle T3
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Feral Gorilla | 620 | 46 | 13 | 3% | 64 | 2200ms | 62 | 240 |
| Pit Viper | 330 | 60 | 6 | 0% | 96 | 1600ms | 60 | 270 |
| **Jungle Titan Lord** (boss) | **3900** | **110** | **30** | **12%** | **60** | **2800ms** | **76** | **340** |

### Tundra T3
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Frost Giant | 700 | 50 | 18 | 6% | 30 | 3200ms | 68 | 175 |
| Blizzard Wolf | 390 | 56 | 8 | 0% | 98 | 1500ms | 60 | 290 |
| **Frost Colossus** (boss) | **4000** | **95** | **40** | **14%** | **20** | **4200ms** | **82** | **360** |

### Desert T3
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Sand Kraken | 580 | 48 | 16 | 4% | 46 | 2600ms | 68 | 200 |
| Bone Drake | 440 | 58 | 10 | 5% | 84 | 1800ms | 62 | 260 |
| **Sand Emperor** (boss) | **4000** | **112** | **34** | **13%** | **42** | **3200ms** | **80** | **350** |

### Volcanic T3 (first appearance)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Ember Slime | 110 | 18 | 5 | 0% | 52 | 2300ms | 60 | 210 |
| Magma Golem | 260 | 24 | 12 | 0% | 18 | 3800ms | 65 | 150 |
| Lava Titan | 720 | 54 | 20 | 7% | 26 | 3500ms | 65 | 155 |
| Fire Elemental | 400 | 64 | 8 | 4% | 70 | 2100ms | 62 | 230 |
| **Volcanic Titan** (boss) | **3800** | **105** | **30** | **12%** | **32** | **3400ms** | **76** | **340** |

### Necropolis T3 (first appearance)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Skeleton Warrior | 500 | 47 | 12 | 6% | 50 | 2400ms | 62 | 220 |
| Lich | 360 | 68 | 5 | 7% | 38 | 2000ms | 65 | 230 |
| **Lich King** (boss) | **5200** | **118** | **38** | **16%** | **25** | **2600ms** | **90** | **340** |

---

## MONSTERS — TIER 4

All T4 mobs drop `level: 3` essence rewards.

### Forest T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Elder Treant | 1800 | 102 | 40 | 10% | 14 | 4200ms | 68 | 140 |
| Spectral Wolf | 950 | 138 | 10 | 6% | 108 | 1200ms | 60 | 300 |
| **Elder Treant Lord** (boss) | **7000** | **158** | **60** | **19%** | **14** | **5200ms** | **85** | **390** |

### Mountain T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Colossal Titan | 2100 | 115 | 50 | 12% | 12 | 4500ms | 70 | 140 |
| Thunder Condor | 800 | 152 | 12 | 0% | 125 | 1100ms | 60 | 310 |
| **Mountain Titan** (boss) | **7500** | **170** | **65** | **20%** | **12** | **5200ms** | **80** | **400** |

### Plains T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Ancient Guardian | 1700 | 118 | 42 | 9% | 36 | 3000ms | 65 | 200 |
| Stampede King | 1100 | 145 | 22 | 4% | 82 | 1700ms | 62 | 260 |
| **Stampede Emperor** (boss) | **6500** | **175** | **52** | **18%** | **68** | **2800ms** | **80** | **380** |

### Swamp T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Hydra Elder | 1900 | 108 | 38 | 9% | 26 | 2900ms | 68 | 180 |
| Shadow Toad | 900 | 142 | 16 | 6% | 72 | 1900ms | 60 | 230 |
| **Swamp Sovereign** (boss) | **7200** | **170** | **56** | **20%** | **30** | **4200ms** | **86** | **385** |

### Cave T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Stone Colossus | 2200 | 98 | 58 | 13% | 12 | 4500ms | 70 | 135 |
| Abyss Crawler | 1100 | 128 | 28 | 8% | 58 | 2000ms | 62 | 240 |
| **Cave Titan** (boss) | **8500** | **162** | **70** | **22%** | **14** | **5500ms** | **90** | **370** |

### Jungle T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Ancient Titan | 1750 | 115 | 40 | 9% | 50 | 2800ms | 65 | 220 |
| Jungle Wyvern | 1000 | 140 | 20 | 4% | 90 | 1800ms | 65 | 280 |
| **Jungle Ancient Lord** (boss) | **6800** | **172** | **55** | **18%** | **76** | **3000ms** | **82** | **390** |

### Tundra T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Arctic Leviathan | 2000 | 112 | 48 | 11% | 26 | 3800ms | 70 | 175 |
| Ice Specter | 750 | 152 | 10 | 8% | 92 | 1400ms | 62 | 300 |
| **Glacial Titan** (boss) | **7500** | **168** | **64** | **20%** | **18** | **5500ms** | **88** | **400** |

### Desert T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Pharaoh Construct | 1850 | 115 | 45 | 11% | 28 | 3400ms | 68 | 180 |
| Desert Wyrm | 1200 | 138 | 26 | 6% | 70 | 2000ms | 65 | 260 |
| **Desert Eternal** (boss) | **7200** | **165** | **58** | **20%** | **32** | **4200ms** | **86** | **400** |

### Volcanic T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Infernal Drake | 1600 | 135 | 38 | 12% | 56 | 2200ms | 65 | 250 |
| Magma Colossus | 2400 | 118 | 58 | 15% | 16 | 4800ms | 70 | 145 |
| **Inferno Lord** (boss) | **8000** | **182** | **62** | **21%** | **26** | **4000ms** | **84** | **380** |

### Necropolis T4
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Bone Colossus | 2000 | 112 | 45 | 11% | 18 | 4200ms | 68 | 145 |
| Death Knight | 1200 | 142 | 30 | 9% | 58 | 2200ms | 62 | 250 |
| **Undying Lord** (boss) | **7500** | **178** | **58** | **21%** | **24** | **4500ms** | **88** | **390** |

### Abyss T4 (first appearance)
| Monster | HP | ATK | PLT | DR | SPD | CD | Range | Pull |
|---|---|---|---|---|---|---|---|---|
| Void Horror | 1500 | 150 | 24 | 9% | 68 | 1900ms | 64 | 270 |
| Abyssal Titan | 2600 | 125 | 55 | 15% | 20 | 4500ms | 70 | 145 |
| **Void Titan** (boss) | **12000** | **252** | **68** | **22%** | **20** | **3200ms** | **100** | **360** |

---

## DUNGEON SYSTEM

- One dungeon node per biome per tier (marked `isDungeon: true` in NODE_BIOMES).
- Dungeon non-boss monsters: ×2 HP, ×1.6 ATK on top of base stats.
- One persistent boss maintained per dungeon node via `World.ensureBoss()`. Bosses do **not** count toward `MONSTERS_PER_NODE = 12`.
- Boss stats listed above are the **raw** stats (no dungeon multiplier applied on top).

### Boss Script System

Bosses can opt in to a data-driven fight script:
- **Phases** — fire once when HP drops below a threshold (`hpPct: 0.0–1.0`)
- **Repeating** — periodic timer fires while engaged (`intervalMs`, `initialDelayMs`)

Available action types:
| Type | Effect |
|---|---|
| `enrage` | Multiply ATK by `atkMult`, multiply CD by `cdMult`; optional `durationMs` |
| `regen` | Heal `hpPctPerSec × maxHp` per second; optional `durationMs` |
| `shield` | Add `drAdd` flat DR (capped at 0.95); always timed (`durationMs`) |
| `summon` | Spawn `count` copies of `monsterTypeId` near boss |
| `stat-buff` | Multiply any one of: attack / speed / plating / damageReduction; optional `durationMs` |

Timers don't tick until a player aggros the boss. Active timed effects save the original stat value and restore it on expiry. Overlapping same-stat effects from multiple sources: last write wins.

---

## WORLD MAP STRUCTURE

```
11×11 grid. Center = node-5-5 (T0 clearing).
Chebyshev distance from center → tier:
  0 = T0 (1 node)
  1–2 = T1 (24 nodes: forest, mountain, plains, swamp, cave, +plains extension)
  3 = T2 (24 nodes: tundra, mountain, forest, plains, desert, jungle, cave, swamp)
  4 = T3 (32 nodes: + volcanic, necropolis)
  5 = T4 (40 nodes: + abyss)

Geographic layout:
  North        — tundra / mountain
  NE           — forest / plains
  East (col 10)— plains / desert
  SE           — jungle
  South        — volcanic / necropolis / abyss
  West (col 0) — swamp / cave / abyss
  NW           — swamp / tundra
```

Nodes are 3200×2400 px. Movement speed is 120 px/s baseline. Players travel between adjacent nodes via cardinal gates.

---

## KEY CONSTANTS SUMMARY

| Constant | Value |
|---|---|
| Logic tick rate | 10 Hz (100ms) |
| Broadcast tick rate | 5 Hz (200ms) |
| Max monsters per node | 12 |
| OOC regen delay | 4000ms |
| Monster OOC regen delay | 5000ms |
| Monster OOC regen rate | 20% maxHp/s |
| Empowered AoE radius | 80px |
| Empowered AoE mult | 0.5× player.attack |
| Minimum attack cooldown | 200ms |
| Max damage reduction | 90% |
| DoT duration | 4500ms (no hit) |
| Biome XP base | 80 |
| Biome XP exponent | 1.7 |
| XP per level (player) | 100 |
