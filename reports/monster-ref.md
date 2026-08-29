# MMO Idle Monster Reference

Raw stat dump for every non-tutorial monster, organised by biome then biome tier.
Bosses include full fight scripts.

## Caverns

### Biome Tier 1

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cave Lurker | cave-lurker | 225 | 31 | 0.71 | 1400ms | 1 | 5.0% | 68 | 12 | 200 | 380 | 620 | 450ms | 1500ms | impact |  |  | 10 red | 70 |
| Cave Brute | cave-brute | 250 | 80 | 0.36 | 2800ms | 1 | 10.0% | 18 | 12 | 240 | 130 | 460 | 3000ms | 8000ms | impact |  |  | 13 red | 90 |

**Cave Brute — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1200ms

**Bosses:**

#### Obsidian Broodmother `obsidian-broodmother`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Obsidian Broodmother | obsidian-broodmother | 1750 | 47 | 0.36 | 2800ms | 6 | 10.0% | 24 | 18 | 240 | 80 | 680 | 2500ms | 6500ms | quake |  |  | 110 red | 165 |

**Mechanics:**
- **Charge on aggro:** 2.5× speed for 1200ms

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-shred","maxStacksAdd":3}
```

## Forest

### Biome Tier 1

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Moss Rat | forest-slime | 160 | 17 | 0.71 | 1400ms | 0 | 0.0% | 54 | 12 | 600 | 230 | 1200 | 1200ms | 4000ms | impact |  |  | 3 green | 18 |
| Wolf | wolf | 130 | 20 | 0.91 | 1100ms | 0 | 0.0% | 82 | 12 | 680 | 290 | 1360 | 700ms | 2800ms | bite |  |  | 4 green | 25 |

**Bosses:**

#### Gnarled Greatbear `gnarled-greatbear`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gnarled Greatbear | gnarled-greatbear | 2000 | 24 | 0.53 | 1900ms | 0 | 0.0% | 60 | 15 | 300 | 160 | 800 | 1200ms | 4000ms | bear-claws |  |  | 100 green | 150 |

**Mechanics:**
- **Combat ramp:** attackSpeed +5.0% per 3000ms, cap +20.0%; resets on de-aggro

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Enrage: attack × 1.10, cooldown × 0.85 (permanent)
```

## Mountain

### Biome Tier 1

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cliff Hopper | cliff-hopper | 190 | 50 | 0.33 | 3000ms | 0 | 0.0% | 28 | 12 | 420 | 200 | 640 | 1500ms | 4500ms | impact |  |  | 6 yellow | 42 |
| Cliff Hopper | cliff-hopper | 190 | 50 | 0.33 | 3000ms | 0 | 0.0% | 28 | 12 | 420 | 200 | 640 | 1500ms | 4500ms | impact |  |  | 6 yellow | 42 |
| Ridge Ambusher | ridge-archer | 240 | 50 | 0.32 | 3100ms | 0 | 0.0% | 26 | 210 | 350 | 210 | 600 | 1500ms | 4500ms | arrow |  |  | 8 blue | 52 |

**Cliff Hopper — mechanics:**
  - **Charge on aggro:** 3.0× speed for 1200ms

**Cliff Hopper — mechanics:**
  - **Charge on aggro:** 3.0× speed for 1200ms

**Bosses:**

#### Crag Behemoth `crag-behemoth`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag Behemoth | crag-behemoth | 2100 | 56 | 0.29 | 3500ms | 0 | 0.0% | 22 | 18 | 280 | 120 | 750 | 2000ms | 5000ms | quake |  |  | 105 blue | 158 |

**Mechanics:**
- **Charge on aggro:** 3.0× speed for 1200ms

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-charged","multiplierMult":1.15,"cooldownMult":0.8}
```

## Plains

### Biome Tier 1

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Field Hare | plains-slime | 50 | 12 | 0.50 | 2000ms | 0 | 0.0% | 46 | 12 | 190 | 250 | 640 | 1200ms | 4000ms | impact |  |  | 2 yellow | 10 |
| Boar | boar | 100 | 18 | 0.53 | 1900ms | 0 | 0.0% | 50 | 12 | 205 | 260 | 660 | 1000ms | 3500ms | impact |  |  | 3 yellow | 18 |

**Boar — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1000ms

**Bosses:**

#### Tusked Razorback `tusked-razorback`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tusked Razorback | tusked-razorback | 1700 | 34 | 0.50 | 2000ms | 4 | 2.0% | 50 | 15 | 280 | 120 | 750 | 1500ms | 4500ms | impact |  |  | 100 yellow | 150 |

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Spawn adds: 4× plains-slime (tracked; despawn on boss death)
    • Spawn adds: 1× boar (tracked; despawn on boss death)
    • {"type":"roar","attackSpeedPct":0.2,"durationMs":8000,"radius":320}
— Repeating triggers —
  Every 10000ms, first after 4000ms:
    • Spawn adds: 2× plains-slime (tracked; despawn on boss death)
```

## Swamp

### Biome Tier 1

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mire Ooze | bog-slime | 140 | 10 | 0.50 | 2000ms | 0 | 0.0% | 28 | 12 | 165 | 160 | 530 | 2000ms | 5500ms | poison |  |  | 5 purple | 35 |
| Mud Toad | mud-toad | 120 | 13 | 0.45 | 2200ms | 2 | 0.0% | 30 | 12 | 180 | 180 | 550 | 1800ms | 5000ms | poison |  |  | 6 green | 42 |

**Mire Ooze — mechanics:**
  - **DoT "Poison" [swamp-poison]:** 5.00 dmg/stack, max 3 stacks, tick every 1000ms, expires 4000ms after last hit

**Mud Toad — mechanics:**
  - **DoT "Poison" [swamp-poison]:** 4.00 dmg/stack, max 3 stacks, tick every 1000ms, expires 4000ms after last hit
  - **Slow / Root on hit:** Slow (speed × 0.60) for 2000ms, refreshes on each hit

**Bosses:**

#### Grave Toadeater `grave-toadeater`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Grave Toadeater | grave-toadeater | 2100 | 13 | 0.38 | 2600ms | 2 | 2.0% | 28 | 15 | 260 | 100 | 700 | 2000ms | 5500ms | poison |  |  | 100 purple | 150 |

**Mechanics:**
- **DoT "Toad Poison" [grave-toadeater-poison]:** 4.00 dmg/stack, max 4 stacks, tick every 1000ms, expires 4000ms after last hit

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-charged","cooldownMult":0.6,"radiusMult":1.15}
```

## Caverns

### Biome Tier 2

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Giant Spider | giant-spider | 260 | 39 | 0.56 | 1800ms | 0 | 8.0% | 72 | 12 | 220 | 260 | 680 | 800ms | 3200ms | poison |  |  | 15 red | 85 |
| Cave Troll | cave-troll | 400 | 134 | 0.28 | 3600ms | 1 | 8.0% | 15 | 15 | 240 | 130 | 470 | 3000ms | 8500ms | impact |  |  | 23 red | 145 |
| Cave Gargoyle | cave-gargoyle | 300 | 66 | 0.31 | 3200ms | 1 | 5.0% | 22 | 200 | 185 | 130 | 460 | 2500ms | 7000ms | stonespit |  |  | 18 blue | 100 |

**Giant Spider — mechanics:**
  - **DoT "Spider Venom" [spider-venom]:** 11.00 dmg/stack, max 3 stacks, tick every 1000ms, expires 2000ms after last hit

**Bosses:**

#### Chitinous Dreadbore `chitinous-dreadbore`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chitinous Dreadbore | chitinous-dreadbore | 4375 | 139 | 0.28 | 3600ms | 12 | 12.0% | 20 | 72 | 280 | 90 | 800 | 3000ms | 7500ms | quake |  |  | 160 red | 240 |

**Mechanics:**
- **Charge on aggro:** 2.0× speed for 1200ms

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-shred","platingPerStackAdd":1}
    • Spawn adds: 1× cave-troll (tracked; despawn on boss death)
```

## Desert

### Biome Tier 2

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sand Scorpion | sand-scorpion | 660 | 75 | 0.42 | 2400ms | 0 | 8.0% | 30 | 12 | 210 | 240 | 640 | 1500ms | 4500ms | poison |  |  | 7 yellow | 40 |
| Stone Basilisk | stone-basilisk | 660 | 55 | 0.36 | 2800ms | 0 | 15.0% | 26 | 12 | 190 | 180 | 560 | 2000ms | 5500ms | impact |  |  | 8 yellow | 46 |

**Sand Scorpion — mechanics:**
  - **Slow / Root on hit:** Slow (speed × 0.50) for 2500ms, refreshes on each hit

**Bosses:**

#### Dune-Stalker Emperor `dune-stalker-emperor`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dune-Stalker Emperor | dune-stalker-emperor | 3750 | 85 | 0.38 | 2600ms | 12 | 8.0% | 42 | 40 | 340 | 140 | 880 | 2000ms | 5500ms | sandblast |  |  | 150 yellow | 225 |

**Mechanics:**
- **Slow / Root on hit:** Slow (speed × 0.60) for 2000ms, refreshes on each hit

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Stat buff: speed × 1.30 (permanent)
    • {"type":"empower-charged","multiplierMult":1.15,"cooldownMult":0.75}
```

## Forest

### Biome Tier 2

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dire Wolf | ancient-wolf | 270 | 34 | 0.91 | 1100ms | 0 | 0.0% | 96 | 12 | 280 | 300 | 750 | 600ms | 2500ms | bite |  |  | 8 green | 45 |
| Ironclaw Badger | ironwood-golem | 240 | 31 | 1.11 | 900ms | 0 | 0.0% | 22 | 15 | 150 | 120 | 480 | 2500ms | 7000ms | impact |  |  | 10 blue | 58 |
| Thorn Spitter | canopy-sprite | 230 | 31 | 0.42 | 2400ms | 0 | 0.0% | 48 | 190 | 250 | 240 | 650 | 1200ms | 3500ms | arrow |  |  | 9 green | 50 |

**Dire Wolf — mechanics:**
  - **Charge on aggro:** 3.0× speed for 900ms

**Bosses:**

#### Apex Timberclaw `apex-timberclaw`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apex Timberclaw | apex-timberclaw | 3750 | 64 | 0.67 | 1500ms | 0 | 0.0% | 60 | 18 | 310 | 130 | 830 | 1200ms | 4000ms | bear-claws |  |  | 155 green | 232 |

**Mechanics:**
- **Combat ramp:** attackSpeed +10.0% per 2500ms, cap +60.0%; resets on de-aggro

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Enrage: attack × 1.15, cooldown × 0.70 (permanent)
```

## Jungle

### Biome Tier 2

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Jungle Snake | jungle-snake | 400 | 20 | 0.91 | 1100ms | 0 | 0.0% | 76 | 12 | 270 | 290 | 740 | 600ms | 2600ms | poison |  |  | 7 green | 38 |
| Jungle Ape | jungle-ape | 500 | 33 | 0.59 | 1700ms | 0 | 0.0% | 62 | 12 | 240 | 250 | 660 | 1000ms | 3800ms | impact |  |  | 8 green | 44 |
| Vine Chameleon | jungle-blowdarter | 375 | 20 | 0.53 | 1900ms | 0 | 0.0% | 48 | 190 | 250 | 250 | 660 | 1200ms | 4000ms | poison |  |  | 7 green | 38 |

**Jungle Snake — mechanics:**
  - **DoT "Snake Venom" [snake-venom]:** 7.00 dmg/stack, max 3 stacks, tick every 1000ms, expires 1500ms after last hit

**Jungle Ape — mechanics:**
  - **Charge on aggro:** 2.8× speed for 1000ms
  - **Combat ramp:** attack +3.0% per 1000ms, cap +45.0%; resets on de-aggro

**Vine Chameleon — mechanics:**
  - **DoT "Dart Poison" [dart-poison]:** 7.00 dmg/stack, max 4 stacks, tick every 1000ms, expires 2100ms after last hit

**Bosses:**

#### Jungle Dread-Gorger `jungle-dread-gorger`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Jungle Dread-Gorger | jungle-dread-gorger | 3625 | 85 | 0.42 | 2400ms | 0 | 3.0% | 56 | 18 | 320 | 150 | 840 | 1800ms | 4500ms | slash |  |  | 145 green | 218 |

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Stat buff: speed × 1.35 (permanent)
    • Spawn adds: 2× jungle-snake (tracked; despawn on boss death)
    • Spawn adds: 1× jungle-ape (tracked; despawn on boss death)
```

## Mountain

### Biome Tier 2

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Granite Titan | granite-titan | 336 | 122 | 0.26 | 3800ms | 0 | 0.0% | 18 | 15 | 160 | 110 | 460 | 3500ms | 9000ms | impact |  |  | 14 blue | 80 |
| Stone Eagle | stone-eagle | 244 | 88 | 0.36 | 2800ms | 0 | 0.0% | 40 | 12 | 285 | 320 | 800 | 500ms | 2000ms | slash |  |  | 12 blue | 68 |
| Boulder Thrower | peak-archer | 277 | 106 | 0.29 | 3500ms | 0 | 0.0% | 28 | 240 | 265 | 200 | 600 | 2000ms | 5000ms | boulder |  |  | 13 blue | 75 |

**Granite Titan — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1200ms

**Stone Eagle — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1000ms

**Bosses:**

#### Stoneplate Juggernaut `stoneplate-juggernaut`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Stoneplate Juggernaut | stoneplate-juggernaut | 5000 | 128 | 0.24 | 4200ms | 10 | 5.0% | 20 | 72 | 320 | 120 | 850 | 3000ms | 7500ms | quake |  |  | 160 blue | 240 |

**Mechanics:**
- **Charge on aggro:** 2.5× speed for 1200ms

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-charged","multiplierMult":1.15,"cooldownMult":0.8,"radiusMult":1.15}
    • Spawn adds: 2× peak-archer (tracked; despawn on boss death)
— Repeating triggers —
  Every 14000ms, first after 9000ms:
    • Shield: +25.0% DR for 4000ms
```

## Plains

### Biome Tier 2

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Stampede Bull | stampede-bull | 230 | 24 | 0.59 | 1700ms | 0 | 5.0% | 62 | 12 | 235 | 260 | 680 | 800ms | 3000ms | impact |  |  | 7 yellow | 40 |
| Prairie Wolf | prairie-wolf | 180 | 19 | 0.83 | 1200ms | 0 | 0.0% | 92 | 12 | 275 | 290 | 720 | 700ms | 2800ms | bite |  |  | 6 yellow | 35 |
| Savanna Hawk | savanna-hawk | 170 | 29 | 0.42 | 2400ms | 0 | 0.0% | 50 | 165 | 245 | 280 | 680 | 1000ms | 3200ms | slash |  |  | 7 yellow | 38 |

**Stampede Bull — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1000ms

**Bosses:**

#### Gorging Razortusk `gorging-razortusk`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gorging Razortusk | gorging-razortusk | 4000 | 96 | 0.45 | 2200ms | 8 | 5.0% | 46 | 15 | 320 | 140 | 850 | 2000ms | 5500ms | impact |  |  | 150 yellow | 225 |

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Spawn adds: 5× plains-slime (tracked; despawn on boss death)
    • Spawn adds: 1× boar (tracked; despawn on boss death)
    • {"type":"roar","attackSpeedPct":0.25,"durationMs":8000,"radius":320}
  HP ≤ 25.0%:
    • Spawn adds: 2× boar (tracked; despawn on boss death)
    • Spawn adds: 4× plains-slime (tracked; despawn on boss death)
    • {"type":"roar","attackSpeedPct":0.25,"durationMs":6000,"radius":300}
— Repeating triggers —
  Every 10000ms, first after 6000ms:
    • Spawn adds: 2× plains-slime (tracked; despawn on boss death)
    • {"type":"roar","attackSpeedPct":0.25,"durationMs":6000,"radius":300}
```

## Swamp

### Biome Tier 2

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Moss-Shell Snapper | swamp-hydra | 150 | 24 | 0.45 | 2200ms | 6 | 0.0% | 28 | 15 | 185 | 170 | 560 | 2500ms | 7000ms | poison |  |  | 12 purple | 68 |
| Bog Witch | bog-witch | 170 | 41 | 0.45 | 2200ms | 0 | 0.0% | 38 | 180 | 215 | 200 | 580 | 1500ms | 4500ms | hex |  |  | 11 purple | 62 |
| Mire Stalker | mire-stalker | 210 | 46 | 0.38 | 2600ms | 0 | 0.0% | 40 | 12 | 155 | 170 | 540 | 2000ms | 6000ms | poison |  |  | 13 purple | 75 |

**Moss-Shell Snapper — mechanics:**
  - **DoT "Snapper Venom" [hydra-venom]:** 7.00 dmg/stack, max 5 stacks, tick every 1000ms, expires 2400ms after last hit

**Mire Stalker — mechanics:**
  - **DoT "Stalker Venom" [stalker-venom]:** 4.00 dmg/stack, max 4 stacks, tick every 1000ms, expires 2800ms after last hit
  - **Evasion (deterministic):** dodge rate 20.0%

**Bosses:**

#### Mire-Gorged Behemoth `mire-gorged-behemoth`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mire-Gorged Behemoth | mire-gorged-behemoth | 3375 | 38 | 0.36 | 2800ms | 6 | 8.0% | 30 | 15 | 300 | 110 | 800 | 2500ms | 6000ms | poison |  |  | 155 purple | 232 |

**Mechanics:**
- **DoT "Gorged Venom" [mire-gorged-venom]:** 9.00 dmg/stack, max 4 stacks, tick every 1000ms, expires 5000ms after last hit

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Enrage: attack × 1.00, cooldown × 0.70 (permanent)
    • {"type":"empower-charged","cooldownMult":0.7,"radiusMult":1.15}
```

## Caverns

### Biome Tier 3

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep Spider | deep-spider | 450 | 60 | 0.67 | 1500ms | 0 | 8.0% | 70 | 12 | 220 | 380 | 820 | 500ms | 2000ms | poison |  |  | 55 red | 330 |
| Cavern Troll | cavern-troll | 700 | 124 | 0.28 | 3600ms | 2 | 10.0% | 14 | 15 | 240 | 120 | 460 | 3000ms | 8500ms | impact |  |  | 83 red | 500 |
| Crystal Gargoyle | crystal-gargoyle | 520 | 85 | 0.31 | 3200ms | 1 | 5.0% | 20 | 210 | 185 | 120 | 450 | 2500ms | 7000ms | stonespit |  |  | 60 red | 360 |

**Deep Spider — mechanics:**
  - **DoT "Deep Venom" [deep-spider-venom]:** 12.00 dmg/stack, max 3 stacks, tick every 1000ms, expires 3000ms after last hit

**Cavern Troll — mechanics:**
  - **Charge on aggro:** 2.0× speed for 1200ms

**Bosses:**

#### Deep-Core Burrow-Gorger `deep-core-burrow-gorger`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deep-Core Burrow-Gorger | deep-core-burrow-gorger | 12895 | 196 | 0.22 | 4500ms | 16 | 15.0% | 16 | 72 | 330 | 85 | 890 | 4000ms | 10000ms | quake |  |  | 355 red | 530 |

**Mechanics:**
- **Charge on aggro:** 2.0× speed for 1200ms

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-shred","maxStacksAdd":4,"extraThresholds":[9,12]}
  HP ≤ 25.0%:
    • {"type":"empower-shred","platingPerStackAdd":1}
    • Spawn adds: 1× cavern-troll (tracked; despawn on boss death)
```

## Desert

### Biome Tier 3

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dune Stalker | dune-stalker | 1350 | 67 | 0.42 | 2400ms | 0 | 8.0% | 30 | 12 | 210 | 240 | 640 | 1500ms | 4500ms | poison |  |  | 30 yellow | 180 |
| Desert Basilisk | desert-basilisk | 1350 | 113 | 0.36 | 2800ms | 0 | 15.0% | 26 | 12 | 190 | 180 | 560 | 2000ms | 5500ms | impact |  |  | 45 yellow | 270 |

**Dune Stalker — mechanics:**
  - **Slow / Root on hit:** Slow (speed × 0.50) for 2500ms, refreshes on each hit

**Bosses:**

#### Dune-Carapace Monarch `dune-carapace-monarch`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dune-Carapace Monarch | dune-carapace-monarch | 11940 | 196 | 0.33 | 3000ms | 10 | 8.0% | 42 | 20 | 350 | 140 | 900 | 2200ms | 6500ms | sandblast |  |  | 345 yellow | 518 |

**Mechanics:**
- **Charge on aggro:** 2.5× speed for 1000ms
- **Slow / Root on hit:** Slow (speed × 0.60) for 2000ms, refreshes on each hit

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Morph (permanent): ranged: true; style: sandblast; range: 240px; kite: true
    • {"type":"empower-charged","multiplierMult":1.2,"cooldownMult":0.8}
  HP ≤ 25.0%:
    • {"type":"empower-charged","cooldownMult":0.65}
```

## Jungle

### Biome Tier 3

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Jungle Stalker | jungle-stalker | 790 | 55 | 1.00 | 1000ms | 0 | 0.0% | 78 | 12 | 270 | 300 | 760 | 600ms | 2600ms | poison |  |  | 25 green | 150 |
| Silverback | silverback | 1045 | 83 | 0.56 | 1800ms | 0 | 0.0% | 60 | 12 | 240 | 250 | 660 | 1000ms | 3800ms | impact |  |  | 35 green | 210 |
| Canopy Chameleon | canopy-harrier | 720 | 45 | 0.71 | 1400ms | 0 | 0.0% | 52 | 190 | 250 | 240 | 650 | 1200ms | 3500ms | arrow |  |  | 27 green | 165 |

**Silverback — mechanics:**
  - **Charge on aggro:** 2.8× speed for 1100ms
  - **Combat ramp:** attack +3.0% per 1000ms, cap +45.0%; resets on de-aggro

**Bosses:**

#### Apex Bramble-Slasher `apex-bramble-slasher`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apex Bramble-Slasher | apex-bramble-slasher | 11701 | 104 | 0.67 | 1500ms | 0 | 3.0% | 64 | 18 | 340 | 140 | 920 | 2000ms | 6000ms | slash |  |  | 340 green | 510 |

**Mechanics:**
- **Charge on aggro:** 2.8× speed for 900ms
- **Evasion (deterministic):** dodge rate 15.0%

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Stat buff: evasion × 2.00 for 5000ms
    • {"type":"empower-charged","multiplierMult":1.2,"cooldownMult":0.55}
```

## Mountain

### Biome Tier 3

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mountain Colossus | mountain-colossus | 610 | 130 | 0.26 | 3800ms | 0 | 0.0% | 16 | 15 | 160 | 90 | 420 | 4000ms | 10500ms | impact |  |  | 75 blue | 440 |
| Avalanche Ram | avalanche-ram | 434 | 87 | 0.38 | 2600ms | 0 | 0.0% | 38 | 12 | 245 | 300 | 760 | 500ms | 2200ms | impact |  |  | 47 blue | 280 |
| Crag Mortar | crag-mortar | 490 | 109 | 0.28 | 3600ms | 0 | 0.0% | 30 | 250 | 360 | 200 | 620 | 2000ms | 5000ms | boulder |  |  | 60 blue | 360 |

**Mountain Colossus — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1200ms

**Avalanche Ram — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1000ms

**Bosses:**

#### Crag-Gorged Horn-Behemoth `crag-gorged-horn-behemoth`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crag-Gorged Horn-Behemoth | crag-gorged-horn-behemoth | 12418 | 204 | 0.24 | 4200ms | 12 | 5.0% | 18 | 72 | 360 | 100 | 920 | 3500ms | 8500ms | quake |  |  | 340 blue | 510 |

**Mechanics:**
- **Charge on aggro:** 2.5× speed for 1200ms

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-charged","multiplierMult":1.2,"radiusMult":1.15}
  HP ≤ 25.0%:
    • {"type":"empower-charged","cooldownMult":0.7}
    • Stat buff: speed × 1.25 (permanent)
```

## Swamp

### Biome Tier 3

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plague-Shell Snapper | plague-hydra | 400 | 37 | 0.45 | 2200ms | 4 | 0.0% | 26 | 15 | 185 | 150 | 520 | 2800ms | 8000ms | poison |  |  | 65 purple | 390 |
| Mire Hexer | mire-hex-spitter | 350 | 42 | 0.45 | 2200ms | 0 | 0.0% | 36 | 200 | 230 | 200 | 580 | 1500ms | 4500ms | hex |  |  | 35 purple | 210 |
| Bog Lurker | bog-lurker | 340 | 43 | 0.38 | 2600ms | 0 | 0.0% | 30 | 12 | 155 | 160 | 540 | 2200ms | 6500ms | poison |  |  | 57 purple | 345 |

**Plague-Shell Snapper — mechanics:**
  - **DoT "Plague" [plague-venom]:** 5.00 dmg/stack, max 6 stacks, tick every 1000ms, expires 6000ms after last hit

**Bog Lurker — mechanics:**
  - **DoT "Lurker Venom" [lurker-venom]:** 5.00 dmg/stack, max 5 stacks, tick every 1000ms, expires 4500ms after last hit
  - **Evasion (deterministic):** dodge rate 25.0%

**Bosses:**

#### Rot-Spore Croc-Behemoth `rot-spore-croc-behemoth`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Rot-Spore Croc-Behemoth | rot-spore-croc-behemoth | 11940 | 52 | 0.29 | 3400ms | 8 | 10.0% | 28 | 18 | 330 | 105 | 880 | 2800ms | 7000ms | poison |  |  | 345 purple | 518 |

**Mechanics:**
- **Charge on aggro:** 2.0× speed for 1200ms
- **DoT "Rot Spores" [rot-spore-plague]:** 13.00 dmg/stack, max 6 stacks, tick every 1000ms, expires 6000ms after last hit

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Enrage: attack × 1.00, cooldown × 0.65 (permanent)
    • {"type":"empower-charged","cooldownMult":0.7,"radiusMult":1.15}
  HP ≤ 25.0%:
    • Morph (permanent): override DoT: 17.00/stack × 8, tick 1000ms
    • {"type":"spawn-pool","radius":260,"durationMs":20000,"damagePerTick":14,"tickIntervalMs":1000,"slowSpeedMult":0.55}
```

## Tundra

### Biome Tier 3

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Frost Lurker | frost-lurker | 950 | 259 | 0.38 | 2600ms | 0 | 10.0% | 26 | 12 | 170 | 150 | 510 | 2500ms | 7000ms | frost |  |  | 29 blue | 175 |
| Glacier Bear | glacier-bear | 1500 | 300 | 0.31 | 3200ms | 0 | 14.0% | 22 | 15 | 175 | 140 | 500 | 3000ms | 8500ms | frost |  |  | 65 blue | 390 |
| Rime Caster | rime-caster | 880 | 297 | 0.36 | 2800ms | 0 | 8.0% | 30 | 200 | 230 | 200 | 600 | 1500ms | 4500ms | frost |  |  | 45 blue | 270 |

**Glacier Bear — mechanics:**
  - **Periodic barrier:** shield = 20.0% × maxHP, every 11000ms, lasts 6000ms; absorbs player direct hits before HP

**Bosses:**

#### Frost-Plated Rime-Mammoth `frost-plated-rime-mammoth`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Frost-Plated Rime-Mammoth | frost-plated-rime-mammoth | 12895 | 204 | 0.24 | 4200ms | 12 | 12.0% | 18 | 20 | 360 | 100 | 900 | 3000ms | 8000ms | frost |  |  | 350 blue | 525 |

**Mechanics:**
- **Charge on aggro:** 2.0× speed for 1200ms
- **Stacking debuff on player:** move slow: +6.0%/hit cap 40.0%; atk slow: +5.0%/hit cap 30.0%; fades 4000ms after last hit
- **Periodic barrier:** shield = 18.0% × maxHP, every 12000ms, lasts 6000ms; absorbs player direct hits before HP

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-charged","multiplierMult":1.2,"radiusMult":1.1}
  HP ≤ 25.0%:
    • Apply barrier: 24.0% × maxHP, every 9000ms, lasts 6500ms
```

## Volcanic

### Biome Tier 3

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ember Scuttler | ember-scuttler | 1220 | 70 | 0.63 | 1600ms | 2 | 0.0% | 64 | 12 | 210 | 230 | 620 | 1000ms | 3600ms | fire |  |  | 25 red | 150 |
| Cinder Hound | cinder-hound | 1440 | 135 | 0.77 | 1300ms | 3 | 0.0% | 70 | 12 | 260 | 260 | 680 | 700ms | 3000ms | fire |  |  | 29 red | 175 |
| Magma Tortoise | magma-brute | 2000 | 190 | 0.33 | 3000ms | 4 | 0.0% | 22 | 15 | 150 | 120 | 470 | 3000ms | 8500ms | fire |  |  | 55 red | 330 |
| Ash Salamander | ash-slinger | 1330 | 209 | 0.50 | 2000ms | 2 | 0.0% | 44 | 180 | 230 | 220 | 600 | 1200ms | 4000ms | fire |  |  | 27 red | 165 |

**Cinder Hound — mechanics:**
  - **Charge on aggro:** 2.5× speed for 900ms

**Bosses:**

#### Cinder-Shell Magma-Salamander `cinder-shell-magma-salamander`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cinder-Shell Magma-Salamander | cinder-shell-magma-salamander | 11462 | 179 | 0.33 | 3000ms | 8 | 4.0% | 26 | 18 | 340 | 120 | 920 | 2500ms | 7000ms | fire |  |  | 360 red | 540 |

**Mechanics:**
- **Charge on aggro:** 2.5× speed for 1000ms

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-charged","multiplierMult":1.2,"radiusMult":1.15}
  HP ≤ 25.0%:
    • {"type":"empower-charged","cooldownMult":0.6}
    • {"type":"spawn-pool","radius":240,"durationMs":16000,"damagePerTick":16,"tickIntervalMs":1000,"slowSpeedMult":0.7}
```

## Desert

### Biome Tier 4

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sand Viper | sand-viper | 1343 | 78 | 0.42 | 2400ms | 0 | 8.0% | 28 | 12 | 230 | 260 | 680 | 1500ms | 4500ms | poison |  |  | 55 yellow | 330 |
| Dune Basilisk | dune-basilisk | 1501 | 104 | 0.33 | 3000ms | 10 | 14.0% | 26 | 15 | 190 | 170 | 560 | 2500ms | 7000ms | impact |  |  | 100 yellow | 600 |
| Dune Tyrant | dune-tyrant | 1738 | 230 | 0.29 | 3500ms | 8 | 8.0% | 20 | 15 | 160 | 100 | 450 | 4500ms | 12000ms | impact |  |  | 170 yellow | 1020 |

**Sand Viper — mechanics:**
  - **Slow / Root on hit:** Slow (speed × 0.45) for 3000ms, refreshes on each hit

**Dune Tyrant — mechanics:**
  - **Slow / Root on hit:** Slow (speed × 0.40) for 4000ms, refreshes on each hit

**Bosses:**

#### Dune-Throne Sovereign `dune-throne-sovereign`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dune-Throne Sovereign | dune-throne-sovereign | 17893 | 185 | 0.36 | 2800ms | 8 | 8.0% | 44 | 20 | 400 | 140 | 960 | 2500ms | 7000ms | sandblast |  |  | 595 yellow | 893 |

**Mechanics:**
- **Charge on aggro:** 2.5× speed for 1000ms
- **Slow / Root on hit:** Slow (speed × 0.45) for 3000ms, refreshes on each hit

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Morph (permanent): ranged: true; style: sandblast; range: 250px; kite: true
    • {"type":"empower-charged","multiplierMult":1.25,"cooldownMult":0.75,"radiusMult":1.1}
  HP ≤ 25.0%:
    • Morph (permanent): ranged: false; range: 20.0px; kite: false
    • Stat buff: speed × 1.35 (permanent)
    • {"type":"empower-charged","cooldownMult":0.7}
```

## Wasteland

### Biome Tier 4

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bone Crawler | bone-crawler | 2059 | 159 | 0.83 | 1200ms | 0 | 0.0% | 78 | 12 | 290 | 330 | 820 | 600ms | 2500ms | poison |  |  | 30 purple | 180 |
| Plague Hound | plague-hound | 3168 | 224 | 0.67 | 1500ms | 0 | 0.0% | 70 | 12 | 270 | 290 | 750 | 700ms | 3000ms | poison |  |  | 50 purple | 300 |
| Carrion Vulture | carrion-vulture | 2693 | 189 | 0.59 | 1700ms | 0 | 0.0% | 46 | 200 | 260 | 240 | 650 | 1200ms | 4000ms | poison |  |  | 40 purple | 240 |
| Bone Rat | plague-rat | 1584 | 136 | 1.05 | 950ms | 0 | 0.0% | 92 | 12 | 310 | 360 | 860 | 400ms | 2000ms | poison |  |  | 22 purple | 130 |
| Gravewright | gravewright | 2851 | 118 | 0.53 | 1900ms | 0 | 0.0% | 40 | 200 | 300 | 200 | 640 | 1500ms | 4500ms | magic |  |  | 70 purple | 420 |

**Plague Hound — mechanics:**
  - **Charge on aggro:** 2.5× speed for 900ms
  - **DoT "Hound Plague" [hound-plague]:** 24.00 dmg/stack, max 5 stacks, tick every 1100ms, expires 2500ms after last hit

**Bosses:**

#### Charnel-Crown Sovereign `charnel-crown-sovereign`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Charnel-Crown Sovereign | charnel-crown-sovereign | 19499 | 115 | 0.43 | 2300ms | 14 | 8.0% | 28 | 20 | 400 | 105 | 960 | 3000ms | 8000ms | poison |  |  | 615 purple | 923 |

**Mechanics:**
- **Charge on aggro:** 2.0× speed for 1100ms
- **DoT "Crown Decay" [charnel-crown-decay]:** 5.00 dmg/stack, max 4 stacks, tick every 1000ms, expires 4000ms after last hit

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 100.0%:
    • Spawn adds: 3× bone-crawler (tracked; despawn on boss death)
    • Spawn adds: 1× plague-hound (tracked; despawn on boss death)
  HP ≤ 50.0%:
    • {"type":"raise-dead","count":3,"maxAliveAdd":2}
    • Spawn adds: 2× bone-crawler (tracked; despawn on boss death)
  HP ≤ 25.0%:
    • {"type":"raise-dead","count":4,"maxAliveAdd":2}
    • {"type":"roar","attackSpeedPct":0.3,"durationMs":12000,"radius":420}
```

## Jungle

### Biome Tier 4

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hunting Panther | hunting-panther | 704 | 52 | 0.83 | 1200ms | 0 | 0.0% | 82 | 12 | 290 | 320 | 800 | 600ms | 2400ms | slash |  |  | 45 green | 270 |
| Apex Silverback | apex-silverback | 1056 | 77 | 0.56 | 1800ms | 0 | 0.0% | 54 | 12 | 250 | 260 | 680 | 1000ms | 3600ms | impact |  |  | 88 green | 528 |
| Thornback Chameleon | thornback-lizard | 748 | 52 | 0.67 | 1500ms | 0 | 0.0% | 50 | 200 | 260 | 250 | 660 | 1200ms | 4000ms | poison |  |  | 50 green | 300 |
| Emerald Constrictor | emerald-constrictor | 1408 | 66 | 0.63 | 1600ms | 0 | 0.0% | 62 | 12 | 280 | 280 | 720 | 800ms | 3000ms | poison |  |  | 130 green | 780 |

**Apex Silverback — mechanics:**
  - **Charge on aggro:** 2.8× speed for 1000ms
  - **Combat ramp:** attack +3.0% per 1000ms, cap +45.0%; resets on de-aggro

**Emerald Constrictor — mechanics:**
  - **DoT "Constrictor Venom" [constrictor-venom]:** 5.00 dmg/stack, max 5 stacks, tick every 1000ms, expires 3000ms after last hit
  - **Cadence finisher:** every 4 landed hits → 2.00× damage (counter-based, goes through player's full defensive pipeline)

**Bosses:**

#### Verdant-Crown Predator `verdant-crown-predator`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Verdant-Crown Predator | verdant-crown-predator | 18352 | 117 | 0.71 | 1400ms | 0 | 4.0% | 76 | 20 | 400 | 150 | 960 | 2000ms | 6000ms | slash |  |  | 605 green | 908 |

**Mechanics:**
- **Charge on aggro:** 2.8× speed for 900ms
- **DoT "Crown Venom" [verdant-crown-venom]:** 8.00 dmg/stack, max 5 stacks, tick every 1000ms, expires 3500ms after last hit
- **Evasion (deterministic):** dodge rate 25.0%

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Stat buff: evasion × 0.00 (permanent)
    • Stat buff: attack × 1.40 (permanent)
    • Stat buff: speed × 1.25 (permanent)
    • {"type":"empower-charged","cooldownMult":0.55}
  HP ≤ 25.0%:
    • Enrage: attack × 1.00, cooldown × 0.75 (permanent)
```

## Mountain

### Biome Tier 4

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Granite Mammoth | granite-mammoth | 779 | 184 | 0.28 | 3600ms | 0 | 0.0% | 16 | 15 | 160 | 90 | 430 | 4000ms | 11000ms | impact |  |  | 95 blue | 570 |
| Avalanche Tyrant | avalanche-tyrant | 533 | 145 | 0.40 | 2500ms | 0 | 0.0% | 42 | 12 | 300 | 300 | 760 | 600ms | 2500ms | impact |  |  | 68 blue | 410 |
| Cliffside Roc | cliffside-roc | 574 | 179 | 0.29 | 3500ms | 0 | 0.0% | 34 | 260 | 380 | 210 | 640 | 2000ms | 5500ms | boulder |  |  | 75 blue | 450 |
| Cragback Rhino | cragback-rhino | 923 | 113 | 0.26 | 3800ms | 16 | 6.0% | 14 | 15 | 150 | 80 | 400 | 5000ms | 13000ms | impact |  |  | 185 blue | 1110 |

**Granite Mammoth — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1200ms
  - **Cadence finisher:** every 4 landed hits → 2.00× damage (counter-based, goes through player's full defensive pipeline)

**Avalanche Tyrant — mechanics:**
  - **Charge on aggro:** 2.8× speed for 1000ms

**Cragback Rhino — mechanics:**
  - **Charge on aggro:** 2.2× speed for 1300ms
  - **Cooldown finisher:** 10000ms countdown → next attack × 3.20 (waits for next attack if timer expires between swings; resets each proc)
  - **Damage soft cap:** hits above 25.0% × maxHP are scaled by 0.50 on the excess; punishes burst, rewards fast consistent damage

**Bosses:**

#### Iron-Crest Titan `iron-crest-titan`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Iron-Crest Titan | iron-crest-titan | 19499 | 228 | 0.24 | 4200ms | 14 | 6.0% | 16 | 20 | 420 | 95 | 960 | 4000ms | 10000ms | quake |  |  | 620 blue | 930 |

**Mechanics:**
- **Charge on aggro:** 2.5× speed for 1200ms
- **Cadence finisher:** every 4 landed hits → 2.00× damage (counter-based, goes through player's full defensive pipeline)

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-charged","multiplierMult":1.15,"aftershockRayCountAdd":3,"aftershockDamageMult":1.15}
  HP ≤ 25.0%:
    • {"type":"empower-charged","cooldownMult":0.7,"radiusMult":1.1}
    • Stat buff: speed × 1.35 (permanent)
```

## Deep-Sea Trench

### Biome Tier 4

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Abyssal Serpent | abyssal-serpent | 4200 | 230 | 0.36 | 2800ms | 18 | 20.0% | 28 | 15 | 420 | 320 | 760 | 5000ms | 14000ms | impact |  |  | 260 blue | 1560 |
| Hadal Stalker | hadal-stalker | 2800 | 210 | 0.29 | 3400ms | 20 | 10.0% | 22 | 240 | 400 | 300 | 720 | 5500ms | 14000ms | gunshot |  |  | 210 blue | 1260 |
| Elder Leviathan | elder-leviathan | 5880 | 260 | 0.28 | 3600ms | 22 | 24.0% | 20 | 15 | 440 | 280 | 700 | 8000ms | 20000ms | impact |  |  | 400 blue | 2400 |

**Abyssal Serpent — mechanics:**
  - **Charge on aggro:** 2.5× speed for 1200ms

**Elder Leviathan — mechanics:**
  - **Periodic barrier:** shield = 30.0% × maxHP, every 16000ms, lasts 6000ms; absorbs player direct hits before HP

**Bosses:**

#### Elder Trench Serpent `elder-trench-serpent`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Elder Trench Serpent | elder-trench-serpent | 21793 | 143 | 0.31 | 3200ms | 20 | 22.0% | 22 | 22 | 400 | 100 | 960 | 4500ms | 11000ms | impact |  |  | 660 purple | 990 |

**Mechanics:**
- **Charge on aggro:** 2.3× speed for 1200ms
- **AoE basic attack:** radius 130px, splash × 0.50 of base attack
- **Periodic barrier:** shield = 28.0% × maxHP, every 15000ms, lasts 6000ms; absorbs player direct hits before HP

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"empower-charged","multiplierMult":1.2,"cooldownMult":0.8}
  HP ≤ 25.0%:
    • Apply barrier: 34.0% × maxHP, every 11000ms, lasts 6500ms
    • {"type":"empower-charged","cooldownMult":0.75}
```

## Tundra

### Biome Tier 4

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Rime-Tusk Mastodon | rime-tusk-mastodon | 924 | 421 | 0.29 | 3500ms | 12 | 0.0% | 18 | 15 | 165 | 140 | 490 | 3500ms | 9500ms | frost |  |  | 110 blue | 660 |
| Glacial Dire-Bear | glacial-direbear | 1221 | 369 | 0.31 | 3200ms | 0 | 14.0% | 18 | 15 | 175 | 130 | 490 | 3500ms | 9000ms | frost |  |  | 150 blue | 900 |
| Hoarfrost Yeti | hoarfrost-yeti | 693 | 302 | 0.34 | 2900ms | 0 | 8.0% | 36 | 220 | 260 | 210 | 620 | 1500ms | 4500ms | frost |  |  | 62 blue | 370 |
| Permafrost Behemoth | permafrost-behemoth | 1914 | 351 | 0.25 | 4000ms | 20 | 12.0% | 12 | 15 | 140 | 70 | 380 | 6000ms | 15000ms | frost |  |  | 260 blue | 1560 |

**Rime-Tusk Mastodon — mechanics:**
  - **Charge on aggro:** 2.3× speed for 1200ms
  - **Cadence finisher:** every 4 landed hits → 2.00× damage (counter-based, goes through player's full defensive pipeline)

**Glacial Dire-Bear — mechanics:**
  - **Periodic barrier:** shield = 22.0% × maxHP, every 12000ms, lasts 6000ms; absorbs player direct hits before HP

**Permafrost Behemoth — mechanics:**
  - **Charge on aggro:** 2.0× speed for 1400ms

**Bosses:**

#### Glacial Patriarch `glacial-patriarch`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Glacial Patriarch | glacial-patriarch | 22940 | 189 | 0.22 | 4500ms | 22 | 14.0% | 14 | 20 | 420 | 90 | 960 | 4000ms | 10000ms | frost |  |  | 640 blue | 960 |

**Mechanics:**
- **Charge on aggro:** 2.0× speed for 1300ms
- **Stacking debuff on player:** move slow: +7.0%/hit cap 40.0%; atk slow: +5.0%/hit cap 30.0%; fades 5000ms after last hit
- **Periodic barrier:** shield = 20.0% × maxHP, every 13000ms, lasts 6500ms; absorbs player direct hits before HP

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • Apply barrier: 28.0% × maxHP, every 10000ms, lasts 7000ms
  HP ≤ 25.0%:
    • {"type":"empower-charged","multiplierMult":1.2,"cooldownMult":0.75,"radiusMult":1.1}
```

## Volcanic

### Biome Tier 4

**Monsters:**

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ember Skink | ember-skink | 1043 | 168 | 0.77 | 1300ms | 2 | 0.0% | 70 | 12 | 230 | 250 | 660 | 1000ms | 3500ms | fire |  |  | 47 red | 280 |
| Infernal Direhound | infernal-direhound | 1386 | 210 | 0.71 | 1400ms | 4 | 0.0% | 72 | 12 | 280 | 280 | 720 | 700ms | 3000ms | fire |  |  | 68 red | 410 |
| Obsidian Tortoise | obsidian-tortoise | 2244 | 100 | 0.33 | 3000ms | 8 | 0.0% | 20 | 15 | 155 | 110 | 460 | 3500ms | 9500ms | fire |  |  | 140 red | 840 |
| Ashspitter Salamander | ashspitter-salamander | 1188 | 183 | 0.53 | 1900ms | 2 | 0.0% | 46 | 190 | 250 | 230 | 630 | 1200ms | 4000ms | fire |  |  | 52 red | 310 |
| Magma Salamander | magma-salamander | 2904 | 246 | 0.38 | 2600ms | 6 | 6.0% | 22 | 15 | 160 | 120 | 470 | 4000ms | 11000ms | fire |  |  | 190 red | 1140 |

**Ember Skink — mechanics:**
  - **DoT "Ember Burn" [ember-burn]:** 13.00 dmg/stack, max 4 stacks, tick every 1000ms, expires 2000ms after last hit

**Infernal Direhound — mechanics:**
  - **Charge on aggro:** 2.5× speed for 900ms

**Obsidian Tortoise — mechanics:**
  - **Cadence finisher:** every 4 landed hits → 2.20× damage (counter-based, goes through player's full defensive pipeline)

**Ashspitter Salamander — mechanics:**
  - **DoT "Ash Burn" [ashspitter-burn]:** 16.00 dmg/stack, max 5 stacks, tick every 1000ms, expires 2500ms after last hit

**Magma Salamander — mechanics:**
  - **Periodic barrier:** shield = 28.0% × maxHP, every 14000ms, lasts 5000ms; absorbs player direct hits before HP

**Bosses:**

#### Caldera Sovereign `caldera-sovereign`

| Name | id | HP | Attack | APS | Atk CD | Plating | DR | Speed | Atk Range | Pull Range | Wander R | Leash R | Idle min | Idle max | Style | Ranged | Kite | Essence | Biome XP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Caldera Sovereign | caldera-sovereign | 20646 | 130 | 0.38 | 2600ms | 10 | 5.0% | 24 | 20 | 400 | 120 | 960 | 2500ms | 7000ms | fire |  |  | 625 red | 938 |

**Mechanics:**
- **Charge on aggro:** 2.5× speed for 1000ms
- **DoT "Caldera Burn" [caldera-burn]:** 10.00 dmg/stack, max 5 stacks, tick every 1000ms, expires 3000ms after last hit

**Fight script:**
```
— HP-threshold phases —
  HP ≤ 50.0%:
    • {"type":"stoke-ramp","rampMsMult":0.65,"minStacks":2}
    • {"type":"empower-charged","multiplierMult":1.15,"cooldownMult":0.85}
  HP ≤ 25.0%:
    • {"type":"stoke-ramp","rampMsMult":0.7,"minStacks":4,"maxStacksAdd":3}
    • {"type":"empower-charged","cooldownMult":0.7,"radiusMult":1.15}
    • {"type":"spawn-pool","radius":260,"durationMs":20000,"damagePerTick":20,"tickIntervalMs":1000,"slowSpeedMult":0.7}
```
