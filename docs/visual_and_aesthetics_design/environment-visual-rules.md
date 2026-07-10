# Environment Visual Rules v0

**Purpose:** Compact rules for terrain, environment props, hazards, and biome space readability.

This document supports:

- `world-and-presentation-bible.md`
- `biome-and-creature-bible.md`
- `player-visual-identity-bible.md`
- `item-aesthetic-bible.md`

It is not a full environment art bible.  
It is not a terrain mechanics redesign.  
It is not a biome ecology plan.

Its job is to define how terrain should support biome identity without making the game harder to read, harder to path, or harder to maintain.

---

## 1. Core Principle

Terrain should support biome identity, not become a puzzle game.

Most environment elements exist to make a biome feel like a place. Only a small number of terrain features should meaningfully affect gameplay.

The focus of the game remains:

- auto-combat,
- build choice,
- biome matchup,
- gear preparation,
- and monster ecology.

Terrain is a supporting layer.

---

## 2. Terrain Categories

Environment features fall into three categories.

### Decorative Terrain

Decorative terrain exists mostly for flavor, place identity, and visual variety.

Examples:

- Plains: sparse grass, small rocks, animal trails, scattered shrubs.
- Forest: trees, roots, bushes, moss, fallen logs.
- Cave: rocks, stalagmites, crystals, dark pools.
- Desert: dunes, bones, dry shrubs, cracked earth.
- Tundra: snowdrifts, ice rocks, frost patches.

Decorative terrain may lightly shape movement, but should not create major strategic complexity.

### Functional Terrain

Functional terrain meaningfully affects movement, combat, or danger.

Examples:

- Mountain ledges and chokepoints.
- Swamp poison pools.
- Volcanic lava pools.
- Jungle ambush bushes.
- Tundra slow/frozen patches, if used.
- Trench darkness/pressure zones, if used.

Functional terrain should be rare, readable, and biome-defining.

Each biome should usually have at most one major functional terrain idea.

### Visual Telegraph Terrain

Visual telegraph terrain helps the player understand danger or behavior.

Examples:

- Toxic swamp pools should clearly look unsafe.
- Lava pools should glow and look hot.
- Mountain chokepoints should be obvious.
- Jungle ambush bushes should look slightly suspicious or dense.
- Trench danger zones should imply pressure, darkness, or threat.
- Graveyard/carrion terrain, if kept, should clearly imply death/carrion/bone ecology.

If terrain has gameplay impact, it needs a strong visual tell.

---

## 3. Functional Terrain Rules

Functional terrain should obey these rules:

1. It must be visually obvious.
2. It must express the biome's identity.
3. It must not fight auto-combat.
4. It must not create frustrating pathfinding.
5. It must leave clear routes through the node.
6. It should teach the biome's threat shape.
7. It should be used sparingly.
8. It should be tested at actual gameplay scale.

The player should lose because their build or positioning is wrong, not because the environment is visually unclear.

---

## 4. Blocking Terrain Rules

Blocking terrain should be used carefully.

Good uses:

- Mountain ledges.
- Cave rocks.
- Forest trees.
- Ruin walls later.
- Fortress/temple structures later.

Rules:

- Leave gates and node edges clearly reachable.
- Avoid dense mazes in early tiers.
- Avoid terrain that makes auto-combat feel stupid.
- Avoid trapping monsters or players in awkward shapes.
- Use blocking terrain mainly to support biome flavor or one clear biome mechanic.

Early blocking terrain should be simple.

Mountain chokepoints are allowed to matter more because guarded position is part of the biome identity.

---

## 5. Hazard Terrain Rules

Hazard terrain should be rare and strongly themed.

Good uses:

- Swamp poison pools.
- Volcanic lava pools.
- Tundra freezing/slow zones, if used.
- Trench pressure/darkness zones, if used.

Rules:

- Hazards should be readable before the player enters them.
- Hazards should not be visually subtle.
- Hazards should connect to the biome's damage shape.
- Hazards should not appear everywhere.
- Hazards should not turn the game into manual dodging.
- Hazards should be something auto-combat can reasonably interact with.

Hazards should create biome flavor and build pressure, not reflex gameplay.

---

## 6. Biome Direction Notes

These are direction notes, not final terrain specs.

### T0 Tutorial

Simple, safe, open.

Terrain does not matter much here.

Use it only to establish the visual language of the world.

### Plains

Open and sparse.

Possible features:

- grass,
- dust trails,
- scattered stones,
- sparse trees,
- small animal paths.

Terrain should mostly stay out of the way. Plains identity comes from swarms and pack pressure, not complex terrain.

### Forest

Tree-filled and organic.

Possible features:

- trees,
- roots,
- bushes,
- fallen logs,
- moss.

Trees can block movement, but should not become a maze. Forest identity comes mostly from fast packs and pursuit.

### Mountain

Ledges and chokepoints matter.

Possible features:

- cliffs,
- ridges,
- narrow passes,
- stone walls,
- height breaks,
- boulders.

Mountain is allowed to have more functional blocking terrain because guarded positions, ledges, and chokepoints are part of its identity.

### Swamp

Poison pools matter.

Possible features:

- stagnant pools,
- bog water,
- reeds,
- mud patches,
- rot bubbles,
- dead roots.

Swamp hazard terrain should clearly communicate poison/rot/attrition.

### Cave

Sparse, dark, and obstructed.

Possible features:

- rocks,
- stalagmites,
- crystals,
- narrow pockets,
- shadowed corners.

Cave terrain should support patrols, overpull risk, and elite territory without becoming a maze.

### Jungle

Ambush terrain may matter.

Possible features:

- dense bushes,
- vines,
- overgrowth,
- thick trees,
- hidden clearings.

If ambush bushes are used, they should be visually distinct enough that players can learn them.

### Desert

Open, exposed, and harsh.

Possible features:

- dunes,
- cracked ground,
- dry shrubs,
- bones,
- stone outcrops.

Desert terrain should generally support sparse standoffs and duels, not dense obstacles.

### Tundra

Cold, slow, and exposed.

Possible features:

- snowdrifts,
- ice rocks,
- frozen patches,
- cracked ice,
- wind-carved paths.

If slow/freeze terrain is used, it should be rare and obvious.

### Volcanic

Dense danger and heat.

Possible features:

- lava pools,
- ember cracks,
- black stone,
- smoke vents,
- magma flows.

Volcanic hazard terrain can matter more because lava/heat is central to the biome identity.

### Deep Sea Trench

Dark, rare, and high-pressure.

Possible features:

- dark water/abyss floor,
- pressure vents,
- glowing organisms,
- rib-like rocks,
- deep-sea coral,
- darkness pockets.

Trench terrain should support low-density elite predators and high detection tension.

### Graveyard / Carrion Field

Unresolved.

Possible features if kept:

- bones,
- carrion piles,
- dead trees,
- old stones,
- grave markers,
- corpse flowers,
- scavenger nests.

If this biome remains at T4, terrain should lean toward carrion/bone ecology rather than full necromantic spectacle.

---

## 7. PixelLab / Asset Production Notes

Environment assets should be generated and tested in small sets.

Prioritize:

1. ground texture or tile feel,
2. 2-4 reusable props per biome,
3. functional terrain props where needed,
4. hazard visuals,
5. later decorative variants.

Do not generate huge prop libraries before testing the first biome slice in-game.

Useful asset categories:

- ground texture,
- blocking prop,
- decorative prop,
- hazard prop,
- ambience overlay,
- biome-specific marker.

Environment art should be readable at gameplay scale, not just attractive in isolation.

---

## 8. Current Locked Defaults

- Terrain is mostly flavor/readability.
- Functional terrain exists only where it strongly supports biome identity.
- Each biome should usually have at most one major functional terrain idea.
- Functional terrain must be visually obvious.
- Terrain should not fight auto-combat or pathfinding.
- Plains should stay open.
- Forest can have trees, but should not become a maze.
- Mountain ledges/chokepoints are important.
- Swamp poison pools are important.
- Volcanic lava pools are likely important.
- Jungle ambush bushes are a strong candidate.
- Tundra slow/frozen patches are optional.
- Trench pressure/darkness terrain is optional.
- Graveyard/Carrion Field terrain direction is unresolved.
