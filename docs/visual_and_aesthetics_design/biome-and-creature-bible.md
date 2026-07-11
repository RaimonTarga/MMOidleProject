# Biome & Creature Bible v0

**Purpose:** Baseline rules for biome identity, creature design, monster naming, boss theming, and tier escalation.

This document supports the broader `world-and-presentation-bible.md`.

It is not a final monster roster.  
It is not a final art style guide.  
It is not a balance document.

Its job is to define what kinds of enemies and environments belong in the game, how they should escalate over tiers, and how to keep them readable without making the world feel generic.

---

## 1. Core Principle

A biome is not just an environment.

A biome is a **domain**: a place where one rule of the shattered ascension-realm becomes visible through terrain, enemies, mechanics, gear, sound, and boss design.

A creature is not just a monster.

A creature is the biome's rule given a body.

The player should be able to read a biome through what lives there.

Examples:

- Plains = pressure, herd movement, endurance, many small bodies.
- Forest = speed, pursuit, evasion, living motion.
- Mountain = weight, ledges, impact, height, chokepoints.
- Swamp = rot, poison, slow attrition, viscous survival.
- Cave = elites, ambush, patrols, pressure, darkness, hard bodies.

The world is dreamlike, but it should not feel random.

---

## 2. Natural-to-Otherworldly Curve

The game should generally move from familiar nature toward stranger, rarer, more artificial, more mythic, and eventually more unreal domains.

This is a **default tendency, not a hard rule**.

Early tiers should be readable and close to nature. Later tiers may become more exceptional, artificial, spiritual, abyssal, or system-like, but the game should avoid becoming abstract just for the sake of sounding deep.

The escalation should feel like this:

> familiar nature → dangerous wilderness → extreme nature → rare/uncanny nature → artificial sacred places → deeper artificial/mythic places → reality-breaking/system-spiritual places → ascension threshold

This curve exists to protect readability. The player should not start the game fighting things with names like `Echo of Weight` or `Null Remnant`. Those concepts can exist later, if the game earns them.

---

## 3. Tentative Tier Escalation Ladder

This ladder is directional, not a final biome roster.

| Tier | World Layer | Biome Feeling | Creature Feeling |
|---:|---|---|---|
| T0 | Tutorial fragment | soft, simple, safe-ish | tiny spirits, harmless beasts, tutorial forms |
| T1 | Familiar nature | plains, forest, mountain, swamp, cave | animals, simple beasts, oozes where appropriate, basic sentries/brutes |
| T2 | Dangerous wilderness | jungle, desert, harsher natural domains | predators, ambushers, venom creatures, tool-users, tougher beasts |
| T3 | Extreme nature | volcano, tundra, intense climate domains | survival beasts, elemental-adjacent creatures, giants, drakes, hardier predators |
| T4 | Rare / uncanny nature | deep sea trench, graveyard or replacement | rare predators, bone/carrion ecology, elite beasts, unusual natural extremes |
| T5 | Artificial / ancient places | ruins, fortress, temple, dead city, old road | guardians, sentries, brutes, beasts adapted to ruins, failed vessels in limited use |
| T6 | Deeper mythic/artificial places | sanctum, labyrinth, buried palace, sealed domain | stronger guardians, masked vessels, ancient constructs, sacred beasts |
| T7 | Reality-breaking / system-spiritual | recursive domains, broken rule-spaces | custodians, anomalies, recursive beasts, protocol-like entities |
| T8 | Ascension threshold | divine law, final gate, world-kernel | godlike beasts, anti-gods, arbiters, final domain guardians |

Important notes:

- T5 and T6 should not jump too quickly into abstract metaphysics.
- T5/T6 can be more artificial: ruins, temples, fortresses, roads, sanctums, cities, and old structures.
- T7/T8 are where the game can become much stranger.
- The simulation layer should be delayed until the late game.

---

## 4. Biome Design Rules

Each biome should define:

1. **Domain law** — what principle the biome represents.
2. **Creature families** — what kinds of bodies naturally express that principle.
3. **Threat shape** — how enemies hurt the player mechanically.
4. **Defensive answer** — what kind of gear/mechanic counters the biome.
5. **Visual language** — silhouettes, materials, terrain, color families.
6. **Audio language** — hits, ambience, movement, death, boss presence.
7. **Boss expression** — the biome's lesson concentrated into a gatekeeper.

A biome should never be just “a place with monsters.”

It should have a reason for its enemies, items, and boss to belong together.

---

## 5. Creature Readability

Common enemies should be readable first and mystical second.

The player should understand the enemy's approximate role from its name, sprite, and behavior.

Good common enemy names:

- Wolf
- Boar
- Mud Toad
- Ridge Ambusher
- Cave Brute
- Mire Ooze
- Lava Salamander
- Ice Bear
- Stoneback Beetle
- Crag Thrower
- Thorn Monkey
- Blowdarter
- Trench Serpent

Names to avoid for early common enemies:

- Echo of Weight
- Minor Remnant
- Essence Fragment
- Null Vessel
- Law-Bound Hunger
- Dream Residue

Those names may be useful later, but they are too abstract for early gameplay readability.

The rule:

> Common mobs use readable creature or role nouns. Mystical language belongs mostly in modifiers, bosses, descriptions, and later tiers.

### Biome Color Coherence (added 2026-07-10)

The mobs of one biome share a tight, similar color scheme, and that scheme is
chosen together with the biome's background so mobs are consistent with each
other while standing out against the ground they walk on.

Practical consequences for the art pipeline:

- The style anchor (`art/style/creatures.png`) carries **rendering style**
  (outline, shading, texture density) — not a global palette.
- Each biome's sprite batch specifies its palette in the prompts (and
  `colorPalette` params where useful), authored alongside that biome's
  background so contrast is checked as a pair.
- Palette contrast against the background must survive the elite tint.

---

## 6. Naming Pattern

Recommended structure:

```text
[Biome / material / behavior modifier] + [readable creature or role noun]
```

Examples:

- Ridge Ambusher
- Cave Brute
- Mire Ooze
- Thorn Monkey
- Dust Hare
- Stoneback Beetle
- Ash Salamander
- Frost Bear
- Trench Serpent
- Bone Stag
- Carrion Moth

Common mobs should usually have simple names.

Elites can have stronger modifiers.

Bosses can be one step more mythic.

Late-game creatures can become more abstract, especially in T7/T8.

---

## 7. Humanoid Creature Rule

Humanoids are allowed.

The game should avoid generic human society, but it does not need to ban humanoid silhouettes.

Humanoid enemies are especially useful when the behavior involves:

- ranged weapons,
- ambushes,
- patrol routes,
- guarding,
- tools,
- rituals,
- coordinated tactics,
- elite territory,
- or failed-vessel identity.

Acceptable early/mid humanoid-style enemies:

- Ridge Ambusher
- Cave Brute
- Bog Witch
- Blowdarter
- Stonebound Slinger
- Masked Sentry
- Hollow Guard
- Temple Watcher

Avoid names that make them sound like normal fantasy civilians or factions:

- Bandit
- Soldier
- Archer
- Knight
- Villager
- Cultist, unless a later biome explicitly supports ritual society

A humanoid enemy should feel like a body shaped by the domain, not just a person standing in the biome.

### Covered Faces (added 2026-07-10)

Every humanoid's face is covered — mask, hood, helmet, faceplate, wrappings,
or simply featureless. No humanoid ever shows a facial expression. This keeps
them vessels shaped by the domain rather than people, and it holds at every
tier.

### Vessels, Not People (added 2026-07-10)

Humanoid bodies are visibly not human:

- **Skin is never a human tone** — it takes the biome's material instead
  (rock-brown like weathered stone, bog-gray, ash, chitin). The Cave Brute
  reads closer to a golem than a person.
- **Proportions are exaggerated** — oversized upper bodies, heavy limbs,
  sunken heads — while staying grounded, not cartoonish.

Together with Covered Faces this is the visual half of the rule above: a
humanoid enemy is a body shaped by the domain, and it should read that way
at a glance.

They are also not inherently evil, and may not even be sentient — they are
domain-bound bodies performing the tasks they are "programmed" for. Their
menace is indifference, not aggression: impassive masks with narrow empty
eye slits, never glowing red eyes, snarls, or villain expressions.

---

## 8. Ranged Enemy Rule

Ranged enemies do not always need to be humanoids, but humanoids are allowed when they make the behavior clearer.

Possible ranged enemy types:

| Type | Good Biomes | Examples |
|---|---|---|
| Slingers / ambushers | mountain, cave, ruins | Ridge Ambusher, Stonebound Slinger |
| Spitters | swamp, cave, jungle, volcanic | Mud Toad, Cave Spitter, Ash Salamander |
| Throwers | mountain, jungle, ruins | Crag Thrower, Thorn Monkey |
| Flyers | plains, mountain, tundra | Hawk, Eagle, Frost Roc |
| Thorn / seed shooters | forest, jungle | Thornling, Bramble Pod |
| Casters / witches | swamp, desert, graveyard | Bog Witch, Dune Hexer |
| Construct sentries | cave, temple, fortress | Cairn Watcher, Temple Eye |
| Artillery beasts | mountain, trench, volcanic | Stoneback Beetle, Shell Mortar |

If a ranged monster needs a bow-like role, consider renaming it based on behavior rather than job title:

- `Ridge Archer` → `Ridge Ambusher`
- `Mountain Archer` → `Stonebound Slinger`
- `Bandit Archer` → avoid unless a human faction actually exists

---

## 9. Slime / Ooze Rule

Slimes should not be a default enemy family.

Generic slimes are too broad and make the world feel like a placeholder RPG.

However, ooze-like creatures are allowed where they make ecological sense.

Good use cases:

- swamp,
- bog,
- cave,
- alchemical zones,
- corpse/carrion zones,
- abyssal/deep-sea zones,
- tutorial only if deliberately framed as a soft starter form.

Preferred terms:

- Ooze
- Mire Ooze
- Bog Ooze
- Muckling
- Sludge
- Tarling
- Glob

Avoid spreading slimes across unrelated early biomes like Plains and Forest unless there is a specific reason.

Swamp ooze is valid. Plains slime and forest slime should probably be retired.

---

## 10. Boss Rule

Bosses are concentrated domain trials.

A boss is the biome's law made unavoidable.

Common enemies teach the biome through repeated exposure.  
The boss tests whether the player understood the lesson.

Boss names can be more mythic than common enemy names, but they should still be readable.

Good boss patterns:

- Tusked Razorback
- Gnarled Greatbear
- Crag Behemoth
- Obsidian Broodmother
- Stoneplate Juggernaut
- Mire-Gorged Behemoth
- Dune-Stalker Emperor
- Frost Colossus
- Elder Trench Serpent

Bosses may use titles, ancient names, or stronger mythic framing earlier than common mobs.

However, bosses should still communicate their physical role and biome identity.

A boss should not feel like a random unrelated creature placed at the end of a zone.

---

## 11. Graveyard / Death Biome Rule

The graveyard concept is unresolved.

It may remain at T4, move later, or be replaced.

The main concern: a traditional graveyard full of skeletons, liches, and undead may feel more metaphysical than the surrounding T4 biomes, especially if T4 is otherwise framed as rare or uncanny nature.

Possible directions:

### Option A — Keep T4 Graveyard, grounded

Frame it as a carrion/bone ecology rather than a full necromantic realm.

Possible names:

- Carrion Field
- Bonefield
- Ossuary Field
- Withered Barrow
- Deadwood
- Old Burial Ground

Creature families:

- carrion birds,
- bone-plated beasts,
- corpse flowers,
- scavenger insects,
- bone stags,
- grave moths,
- limited undead.

This lets T4 hint at death themes without fully becoming a necromancy tier.

### Option B — Move true Graveyard later

Keep T4 focused on rare natural extremes.

Move the stronger undead/death-domain idea to T5 or later, where artificial and spiritual places become more appropriate.

Possible later names:

- Necropolis
- Ossuary Realm
- Dead City
- Memory Grave
- The Unburied
- Bone Temple

This gives undead more weight and avoids introducing them too early.

### Option C — Replace Graveyard at T4

Replace it with another rare or uncanny natural biome.

Candidates:

- Fungal Expanse
- Meteor Crater
- Crystal Basin
- Tar Pits
- Salt Flats
- Storm Peaks
- Ancient Mangrove
- Carrion Field

No final decision yet.

---

## 12. Deep Sea Trench / Abyss Rule

Deep Sea Trench and Abyss should be related but distinct.

**Deep Sea Trench** is a rare natural extreme.

It represents pressure, darkness, low density, elite predators, and the deepest edge of the natural world.

It can fit well around T4.

**Abyss** should be saved for later.

It should not just mean “deep ocean.” It should mean a metaphysical or cosmic depth beneath the rules of the world.

Useful distinction:

> The trench is the deepest place in nature.  
> The abyss is the place beneath nature.

This keeps Deep Sea Trench special without spending the stronger Abyss concept too early.

---

## 13. Simulation Layer Rule

The simulation layer should be delayed.

Early game should not use obvious terms like:

- Admin
- Server
- Bug
- Glitch
- Code
- Error

T0–T4 should mostly feel like a shattered ascension dream with natural, extreme, or uncanny domains.

T5–T6 may start showing more artificial structures: ruins, temples, fortresses, sanctums, old cities.

T7–T8 may begin revealing system-spiritual entities or reality-rule creatures.

Potential late-game terms:

- Custodian
- Arbiter
- Protocol
- Recursive Beast
- Null Gate
- Broken Watcher
- Redacted Saint
- Hollow Moderator
- Index Seraph

Use carefully.

The simulation layer should deepen the ascension theme, not replace it.

Core idea:

> To ascend is to gain authority over reality.

---

## 14. Creature Family Budgets

Each biome should have a small set of preferred creature families.

This keeps sprite generation, naming, and ecology coherent.

A biome does not need to use only these families, but it should not pull randomly from unrelated creature types.

Template:

```md
## Biome Name

**Domain law:**  
**Threat shape:**  
**Defensive answer:**  
**Creature families:**  
**Humanoid allowance:**  
**Ranged enemy logic:**  
**Boss identity:**  
**Forbidden / avoid:**  
```

Example starter biome budgets:

### Plains

**Domain law:** pressure, herd movement, endurance, many small bodies.  
**Creature families:** hares, boars, bulls, rams, birds, stampede beasts.  
**Humanoids:** rare; generally avoid early.  
**Ranged logic:** birds, thrown debris, dust-spitters if needed.  
**Avoid:** generic slimes, humanoid soldiers.

### Forest

**Domain law:** speed, pursuit, evasion, living motion.  
**Creature families:** wolves, foxes, hares, insects, bramble beasts, small predators.  
**Humanoids:** rare; possible later as hunters/ambushers if reframed as hollow vessels.  
**Ranged logic:** thorns, seed-shooters, small ambushers.  
**Avoid:** generic slimes, generic elves/bandits.

### Mountain

**Domain law:** height, weight, ledges, impact, chokepoints.  
**Creature families:** goats, rams, eagles, stone beasts, hoppers, golems, slingers.  
**Humanoids:** allowed if they express ambush, ridge control, or stonebound sentry logic.  
**Ranged logic:** ridge ambushers, slingers, boulder throwers, eagles, artillery beetles.  
**Avoid:** generic archers unless renamed/reframed.

### Swamp

**Domain law:** rot, poison, viscosity, attrition, endurance through decay.  
**Creature families:** toads, oozes, insects, serpents, leeches, bog beasts, witches.  
**Humanoids:** allowed as bog witches, poison blowdarters, masked swamp vessels.  
**Ranged logic:** spitters, witches, darts, poison clouds.  
**Avoid:** clean heroic humanoids, overly noble monsters.

### Cave

**Domain law:** darkness, pressure, ambush, elite territory, hard bodies.  
**Creature families:** lurkers, brutes, spiders, bats, blind beasts, chitin creatures, stone bodies.  
**Humanoids:** allowed; cave brutes and patrols make sense here.  
**Ranged logic:** spitters, crystal sentries, thrown stones, cave witches later.  
**Avoid:** too many ordinary animals; cave should feel more territorial and elite.

---

## 15. Future Biome Direction Ideas

These are not locked. They are idea pools for T5+.

### T5 Candidates — Artificial / Ancient Places

- Ruins
- Old Road
- Fortress
- Temple
- Dead City
- Broken Aqueduct
- Abandoned Arena
- Sunken Shrine
- Watchtower Field

Creature direction:

- sentries,
- brutes,
- guardians,
- beasts nesting in ruins,
- masked vessels,
- temple animals,
- limited constructs.

### T6 Candidates — Deeper Artificial / Mythic Places

- Labyrinth
- Sanctum
- Sealed Palace
- Mirror Hall
- Ashen Citadel
- Rooted Cathedral
- Buried Archive

Creature direction:

- stronger constructs,
- hollow vessels,
- sacred beasts,
- old guardians,
- ritual entities,
- sealed things.

### T7 Candidates — Reality-Breaking / System-Spiritual

- Recursive Garden
- Null District
- Broken Observatory
- The Index
- Clockwork Dream
- Severed Layer

Creature direction:

- custodians,
- recursive beasts,
- rule-keepers,
- anomalies,
- protocol-like entities.

### T8 Candidates — Ascension Threshold

- Final Gate
- World-Kernel
- Throne Without a God
- Crownless Heaven
- The Last Domain
- Origin Wound

Creature direction:

- arbiters,
- anti-gods,
- final guardians,
- world-law beasts,
- divine/system hybrids.

---

## 16. Practical Use

When adding or redesigning a monster, ask:

1. What biome does it belong to?
2. What domain law does it express?
3. What gameplay role does it fill?
4. Is its name readable?
5. Does its body make sense for its behavior?
6. Is it too abstract for its tier?
7. Does it accidentally imply a human society or fantasy faction?
8. Does it support the biome's threat shape?
9. Does it help the player understand the biome?
10. Would the sprite be visually distinct at gameplay scale?

If the answer is unclear, the monster probably needs a stronger biome connection.

---

## 17. Current Locked Defaults

- Natural-to-otherworldly escalation is a default tendency, not a hard rule.
- Common enemy names should stay readable.
- Mystical/abstract names should be delayed or reserved for bosses/later tiers.
- Humanoids are allowed, but should not feel like ordinary people.
- Ranged enemies can be humanoid, beast, construct, or environmental.
- Slimes are mostly retired outside of appropriate ooze contexts.
- Swamp ooze is valid.
- Plains/Forest slimes are likely bad fits.
- Bosses can be more mythic than common enemies.
- Graveyard/T4 death-domain direction is unresolved.
- Deep Sea Trench is a strong T4 rare-natural biome.
- Abyss should be saved for later.
- Simulation/system language should be reserved for late game.
