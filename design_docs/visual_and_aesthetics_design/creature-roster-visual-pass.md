# Creature Roster Visual Pass v0

**Purpose:** Concrete cosmetic alignment plan for the current monster roster.

This document applies the rules from:

- `world-and-presentation-bible.md`
- `biome-and-creature-bible.md`
- `environment-visual-rules.md`

It does **not** redesign combat ecology.  
It does **not** rebalance monsters.  
It does **not** change AI behavior, damage shapes, spawn behavior, or biome mechanics.

The goal is to align names, sprite direction, and monster families with the new world/presentation direction before creating new art.

---

## 1. Scope

This pass focuses on:

1. T0/T1 first-impression monsters.
2. Current starter-biome monster rosters visible in the uploaded monster files.
3. Names and sprite direction.
4. Later-tier audit notes where the files already expose higher-tier versions.

The T1 biome ecology is considered locked:

| Biome | Locked Ecology |
|---|---|
| T0 Tutorial | simple wandering starter enemies |
| Plains | swarm / pack pressure |
| Forest | fast predator packs |
| Mountain | ledges, chokepoints, ambushers, heavy hits |
| Swamp | poisonous pools, rot, DoT attrition |
| Cave | patrolled elite territory, brutes + lurkers |

This document should not undo that work.

---

## 2. Core Cosmetic Pass Principle

The current ecology already works.

The presentation problem is that some monster names and sprites still feel like placeholder RPG output.

The pass should change:

- display names,
- sprite concepts,
- creature family,
- icon/silhouette direction,
- flavor consistency.

The pass should **not** change:

- monster IDs unless necessary,
- stat role,
- combat behavior,
- AI primitives,
- biome lesson,
- spawn ecology.

Recommended implementation policy:

> Keep internal IDs stable when possible. Change display names and sprites first.

Example:

```ts
id: 'plains-slime'
name: 'Field Hare'
```

The ID can remain `plains-slime` until a later code cleanup. The player-facing name and sprite are what matter for this pass.

---

## 3. Naming Rules Applied Here

Common monster names should be readable, natural, and concrete.

Preferred pattern:

```text
[biome/material/behavior modifier] + [clear creature or role noun]
```

Good early examples:

- Field Hare
- Boar
- Young Wolf
- Ridge Ambusher
- Mire Ooze
- Mud Toad
- Cave Brute

Avoid early common names that are too abstract:

- Minor Echo
- Dream Remnant
- Principle of Weight
- Essence Fragment
- Null Vessel

Those can wait for late-game or special enemies.

---

## 4. T0 Tutorial

### Current Direction

Tutorial enemies currently do not matter much mechanically. They are simple wandering starter enemies.

### Recommended Change

| Current | New Display Name | Status | Reason |
|---|---|---|---|
| Tiny Slime | Tiny Wisp | Recommended | Better first impression for the shattered-spirit world; still readable and harmless. |

### Sprite Direction

**Tiny Wisp**

- small floating spirit mote,
- soft glow,
- simple readable round shape,
- no complex anatomy,
- harmless silhouette,
- weak tutorial feel.

The wisp should be as readable as a slime, but less generic.

---

## 5. Plains Visual Pass

### Biome Identity

Plains = open space, herd pressure, swarm bodies, basic endurance.

This should be the most grounded starter biome. It should feel simple, open, physical, and readable.

### Current Roster

| ID | Current Name | Current Role |
|---|---|---|
| `plains-slime` | Plains Slime | swarm filler |
| `boar` | Boar | swarm/charger body |
| `prairie-wolf` | Prairie Wolf | caller / pack pressure |
| `stampede-bull` | Stampede Bull | stronger charging swarm body |
| `savanna-hawk` | Savanna Hawk | ranged / caller / aerial pressure |

### Recommended Cosmetic Changes

| ID | Current Name | New Display Name | Action | Status |
|---|---|---|---|---|
| `plains-slime` | Plains Slime | Field Hare | Rename + reskin | Recommended |
| `boar` | Boar | Boar | Keep | Locked |
| `prairie-wolf` | Prairie Wolf | Prairie Wolf | Keep | Good |
| `stampede-bull` | Stampede Bull | Stampede Bull | Keep | Good |
| `savanna-hawk` | Savanna Hawk | Savanna Hawk | Keep | Good |

### Why Change Plains Slime?

Plains Slime reads as generic RPG filler.

The Plains ecology is about swarms, herd bodies, and many weak attackers. A hare/rabbit-like creature fits better:

- familiar,
- small,
- swarmable,
- readable as low-threat,
- visually distinct from boars,
- easy to generate as a simple sprite.

### Field Hare Sprite Direction

- small tan/brown hare,
- low body,
- fast legs,
- dust/grass palette,
- no magical glow early,
- should read as weak but numerous.

Alternative names if `Field Hare` feels too soft:

- Dust Hare
- Grass Hare
- Horned Hare

Primary recommendation: **Field Hare**.

---

## 6. Forest Visual Pass

### Biome Identity

Forest = speed, pursuit, evasion, living motion, predator packs.

Forest should feel more active and faster than Plains.

### Current Roster

| ID | Current Name | Current Role |
|---|---|---|
| `forest-slime` | Forest Slime | fast/frequent filler |
| `wolf` | Wolf | fast predator |
| `young-wolf` | Young Wolf | follower / pack member |
| `ancient-wolf` | Ancient Wolf | alpha / stronger pack predator |
| `ironwood-golem` | Ironwood Golem | durable forest body |
| `canopy-sprite` | Canopy Sprite | ranged/support forest pack member |

### Recommended Cosmetic Changes

| ID | Current Name | New Display Name | Action | Status |
|---|---|---|---|---|
| `forest-slime` | Forest Slime | Bramble Hare | Rename + reskin | Recommended, but flexible |
| `wolf` | Wolf | Wolf | Keep | Locked |
| `young-wolf` | Young Wolf | Young Wolf | Keep | Locked |
| `ancient-wolf` | Ancient Wolf | Ancient Wolf / Alpha Wolf | Keep or rename by role | Tentative |
| `ironwood-golem` | Ironwood Golem | Ironwood Golem | Keep | Good |
| `canopy-sprite` | Canopy Sprite | Canopy Sprite / Canopy Spitter | Keep or refine | Tentative |

### Why Change Forest Slime?

Forest Slime has the same problem as Plains Slime: it feels like placeholder RPG filler.

The replacement should be:

- small,
- fast,
- natural,
- forest-coded,
- readable as low-to-mid threat,
- different enough from wolves.

### Bramble Hare Sprite Direction

- leaner and sharper than Plains Field Hare,
- darker green/brown palette,
- bramble/thorn silhouette hints,
- quick movement feel,
- not magical enough to confuse the early tier.

Potential alternatives:

- Moss Rat
- Brush Fox
- Thornling
- Moss Mite

Primary recommendation: **Bramble Hare**, but this is the one T1 rename that remains most flexible.

### Ancient Wolf Naming Note

`Ancient Wolf` works if the monster is a higher-tier wolf.

If it is specifically functioning as a pack alpha in early content, `Alpha Wolf` may communicate behavior better.

Possible rule:

- T1 alpha role = Alpha Wolf.
- T2+ stronger wolf = Ancient Wolf.

Do not decide this until the final roster mapping is checked against actual biome tiers.

### Canopy Sprite Note

`Canopy Sprite` is acceptable if the forest is allowed to become lightly magical at the relevant tier.

If it feels too fairy-like or too abstract, possible alternatives:

- Canopy Spitter
- Thorn Spitter
- Bramble Sprite
- Canopy Mote

This is not urgent for the first visual slice.

---

## 7. Mountain Visual Pass

### Biome Identity

Mountain = height, ledges, chokepoints, impact, ambush from terrain, rare huge hits.

The mountain can support both natural animals and tool-using/humanoid ambushers because holding ledges and chokepoints is part of the biome identity.

### Current Roster

| ID | Current Name | Current Role |
|---|---|---|
| `cliff-hopper` | Cliff Hopper | ledge-jumping kicker |
| `ridge-archer` | Ridge Archer | ranged chokepoint ambusher |
| `granite-titan` | Granite Titan | slow sentinel / huge hit |
| `stone-eagle` | Stone Eagle | aerial ambusher |
| `peak-archer` | Boulder Thrower | ranged thrower |
| `mountain-colossus` | Mountain Colossus | high-tier huge hitter |
| `avalanche-ram` | Avalanche Ram | charging mountain beast |
| `crag-mortar` | Crag Mortar | artillery beast / ranged pressure |
| `granite-mammoth` | Granite Mammoth | huge mountain body |
| `avalanche-tyrant` | Avalanche Tyrant | stronger charger |
| `cliffside-roc` | Cliffside Roc | aerial elite |
| `cragback-rhino` | Cragback Rhino | heavy armored beast |

### Recommended Cosmetic Changes

| ID | Current Name | New Display Name | Action | Status |
|---|---|---|---|---|
| `cliff-hopper` | Cliff Hopper | Cliff Hopper | Keep | Locked |
| `ridge-archer` | Ridge Archer | Ridge Ambusher | Rename + maybe reskin | Recommended |
| `granite-titan` | Granite Titan | Granite Titan | Keep | Good |
| `stone-eagle` | Stone Eagle | Stone Eagle | Keep | Good |
| `peak-archer` | Boulder Thrower | Boulder Thrower | Keep | Good |
| `mountain-colossus` | Mountain Colossus | Mountain Colossus | Keep | Good |
| `avalanche-ram` | Avalanche Ram | Avalanche Ram | Keep | Good |
| `crag-mortar` | Crag Mortar | Crag Mortar | Keep | Good, slightly weird but biome-fitting |
| `granite-mammoth` | Granite Mammoth | Granite Mammoth | Keep | Good |
| `avalanche-tyrant` | Avalanche Tyrant | Avalanche Tyrant | Keep | Good |
| `cliffside-roc` | Cliffside Roc | Cliffside Roc | Keep | Good |
| `cragback-rhino` | Cragback Rhino | Cragback Rhino | Keep | Good |

### Why Rename Ridge Archer?

`Archer` is readable, but it implies a generic fantasy job.

The actual ecology is better described as a creature or vessel holding a ridge/chokepoint.

Recommended name:

> **Ridge Ambusher**

This keeps the ranged/terrain identity without sounding like a human army role.

Possible alternatives:

- Ridge Slinger
- Stonebound Slinger
- Crag Ambusher
- Ridge Marksman

Primary recommendation: **Ridge Ambusher**.

### Ridge Ambusher Sprite Direction

- hooded or masked humanoid/vessel silhouette,
- primitive sling, bow, or thrown-stone gesture,
- no ordinary medieval archer uniform,
- perched/leaning posture,
- mountain colors: grey, pale blue, stone brown,
- should read as “uses terrain,” not “human soldier.”

### Cliff Hopper Sprite Direction

This concept should be preserved.

- goat/kangaroo-like mountain body,
- strong legs,
- ledge-jumping feel,
- kick attack readability,
- not too humanoid.

This is one of the strongest T1 ecology-to-creature matches.

---

## 8. Swamp Visual Pass

### Biome Identity

Swamp = rot, poison, viscosity, stagnant water, attrition, DoT survival.

Swamp is the one starter biome where ooze/slime-like creatures can make sense.

### Current Roster

| ID | Current Name | Current Role |
|---|---|---|
| `bog-slime` | Bog Slime | DoT ooze |
| `mud-toad` | Mud Toad | poison/DoT creature |
| `swamp-hydra` | Swamp Hydra | bulk/DoT creature |
| `bog-witch` | Bog Witch | humanoid caster / DoT |
| `mire-stalker` | Mire Stalker | evasive/DoT threat |
| `plague-hydra` | Plague Hydra | higher-tier DoT hydra |
| `mire-hex-spitter` | Mire Hex Spitter | ranged DoT caster/spitter |
| `bog-lurker` | Bog Lurker | higher-tier lurker |

### Recommended Cosmetic Changes

| ID | Current Name | New Display Name | Action | Status |
|---|---|---|---|---|
| `bog-slime` | Bog Slime | Mire Ooze | Rename optional | Recommended but not mandatory |
| `mud-toad` | Mud Toad | Mud Toad | Keep | Locked |
| `swamp-hydra` | Swamp Hydra | Swamp Hydra | Keep | Good |
| `bog-witch` | Bog Witch | Bog Witch | Keep | Good |
| `mire-stalker` | Mire Stalker | Mire Stalker | Keep | Good |
| `plague-hydra` | Plague Hydra | Plague Hydra | Keep | Good |
| `mire-hex-spitter` | Mire Hex Spitter | Mire Hex Spitter | Keep | Good |
| `bog-lurker` | Bog Lurker | Bog Lurker | Keep | Good |

### Bog Slime / Mire Ooze Note

Unlike Plains/Forest slimes, a swamp ooze fits.

The only issue is the word `Slime`, which can read generic or jelly-like.

If the sprite is viscous, muddy, dark, and bog-like, the concept is fine.

Recommended display name:

> **Mire Ooze**

This keeps the creature readable while making it less generic.

Possible alternatives:

- Bog Ooze
- Muckling
- Sludge
- Mire Sludge

Primary recommendation: **Mire Ooze**.

### Bog Witch Note

Humanoids are allowed when behavior supports it.

Bog Witch is acceptable because ranged/DoT/caster behavior fits the swamp ecology.

Visual direction:

- not a normal human witch,
- masked or faceless,
- hunched swamp vessel,
- reeds/bone/cloth silhouette,
- poison cloud or dart/spit effect,
- more “domain-shaped caster” than fairy-tale witch.

---

## 9. Cave Visual Pass

### Biome Identity

Cave = darkness, pressure, ambush, patrols, overpull risk, elite territory, hard bodies.

Cave is the starter biome where humanoid or semi-humanoid elites make the most sense.

### Current Roster

| ID | Current Name | Current Role |
|---|---|---|
| `cave-lurker` | Cave Lurker | fast unpredictable ambusher |
| `cave-brute` | Cave Brute | patrolling elite |
| `giant-spider` | Giant Spider | fast/chitin/DoT threat |
| `cave-troll` | Cave Troll | heavy patrolling elite |
| `cave-gargoyle` | Cave Gargoyle | hard cave body |
| `deep-spider` | Deep Spider | higher-tier spider |
| `cavern-troll` | Cavern Troll | higher-tier patrol elite |
| `crystal-gargoyle` | Crystal Gargoyle | higher-tier hard cave body |

### Recommended Cosmetic Changes

| ID | Current Name | New Display Name | Action | Status |
|---|---|---|---|---|
| `cave-lurker` | Cave Lurker | Cave Lurker | Keep | Locked |
| `cave-brute` | Cave Brute | Cave Brute | Keep | Locked |
| `giant-spider` | Giant Spider | Giant Spider | Keep | Good |
| `cave-troll` | Cave Troll | Cave Troll | Keep | Good |
| `cave-gargoyle` | Cave Gargoyle | Cave Gargoyle | Keep | Good |
| `deep-spider` | Deep Spider | Deep Spider | Keep | Good |
| `cavern-troll` | Cavern Troll | Cavern Troll | Keep | Good |
| `crystal-gargoyle` | Crystal Gargoyle | Crystal Gargoyle | Keep | Good |

### Why Cave Mostly Stays

Cave already has a coherent roster.

The names are readable and the ecology makes sense:

- lurkers spook you,
- brutes patrol,
- trolls hold elite territory,
- spiders add chitin/venom pressure,
- gargoyles fit stone/darkness.

This biome needs better sprites more than new concepts.

### Cave Brute Sprite Direction

- broad semi-humanoid silhouette,
- faceless or barely-faced,
- heavy shoulders,
- stone/chitin/leather feel,
- patrol/territory identity,
- not a normal human.

### Cave Lurker Sprite Direction

- low, fast, dark silhouette,
- long limbs or crouched body,
- glowing eyes optional but face should stay minimal,
- should feel like it appears from darkness.

---

## 10. Later-Tier Audit Notes

This is a light pass only. These decisions should be revisited when each biome/tier gets its own visual slice.

### Strong Later-Tier Names to Keep

The following names already fit the current direction well:

- Prairie Wolf
- Stampede Bull
- Savanna Hawk
- Ironwood Golem
- Mud Toad
- Swamp Hydra
- Mire Stalker
- Plague Hydra
- Bog Lurker
- Granite Titan
- Stone Eagle
- Boulder Thrower
- Mountain Colossus
- Avalanche Ram
- Crag Mortar
- Granite Mammoth
- Cliffside Roc
- Cragback Rhino
- Deep Spider
- Crystal Gargoyle

These are readable, creature-forward, and biome-aligned.

### Names That Need Review

| Current | Concern | Possible Direction |
|---|---|---|
| Forest Slime | generic RPG filler | Bramble Hare / Moss Rat / Thornling |
| Plains Slime | generic RPG filler | Field Hare / Dust Hare / Horned Hare |
| Bog Slime | okay concept, generic wording | Mire Ooze / Bog Ooze |
| Ridge Archer | generic job title | Ridge Ambusher / Ridge Slinger |
| Canopy Sprite | possibly too fairy-like | keep if magical forest support; otherwise Canopy Spitter / Thorn Spitter |
| Ancient Wolf | may be unclear if alpha role | Alpha Wolf if behavior-focused, Ancient Wolf if tier-focused |

### Weird But Acceptable

Some names are slightly unusual but fit because they express the biome:

- Crag Mortar
- Cragback Rhino
- Avalanche Tyrant
- Mire Hex Spitter

These should stay unless the final sprite direction makes them feel too artificial for their tier.

---

## 11. Current T1 Priority Changes

The first asset/name cleanup should prioritize these:

| Priority | Current | Recommended |
|---:|---|---|
| 1 | Tiny Slime | Tiny Wisp |
| 2 | Plains Slime | Field Hare |
| 3 | Forest Slime | Bramble Hare |
| 4 | Ridge Archer | Ridge Ambusher |
| 5 | Bog Slime | Mire Ooze |

Only the first four are strong recommendations.

`Bog Slime` can survive if the sprite is muddy/viscous and not jelly-like, but `Mire Ooze` is probably cleaner.

---

## 12. Sprite Production Notes

For PixelLab or any AI sprite pipeline, start with the renamed T0/T1 set.

Recommended first batch:

1. Tiny Wisp
2. Field Hare
3. Boar
4. Bramble Hare
5. Wolf
6. Young Wolf
7. Cliff Hopper
8. Ridge Ambusher
9. Mire Ooze
10. Mud Toad
11. Cave Lurker
12. Cave Brute

This gives one clean visual slice across all starter biomes without requiring every later-tier creature yet.

---

## 13. Final Rule

This pass is about making the current ecology look intentional.

Do not fix working monster behavior just because an old name feels wrong.

Change the name.  
Change the sprite.  
Keep the role.

The goal is:

> same biome lessons, stronger world identity.
