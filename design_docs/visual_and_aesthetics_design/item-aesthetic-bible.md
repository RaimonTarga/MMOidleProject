# Item Aesthetic Bible v0

**Purpose:** Baseline rules for item identity, naming, icon language, slot fantasy, biome vocabulary, and item flavor text.

This document supports:

- `world-and-presentation-bible.md`
- `biome-and-creature-bible.md`
- `player-visual-identity-bible.md`

It is not a balance document.  
It is not a final recipe list.  
It is not an implementation spec.  
It is not a PixelLab prompt pack.

Its job is to define what crafted items are in the world, how they should be named, how they should look as inventory icons, and how item flavor should scale from mundane early tools toward stranger essence-forged artifacts later.

---

## 1. Core Item Premise

Items are **essence-forged vessels and tools**.

They are not monster drops.

Monsters drop essence. Players master biomes, unlock recipes, and forge items from the essence of those domains.

This means item design does not need to obey literal loot logic.

A wolf does not need to drop a sword.  
An archer does not need to drop a bow.  
A swamp beast does not need to drop a swamp weapon.

Instead, a biome teaches a domain law, and the player uses that biome's essence to forge tools that express that law.

Core idea:

> Items are crafted expressions of biome mastery.

---

## 2. Item Progression Tone

Item names and icons should follow the same broad escalation as biomes and monsters:

> mundane → refined → unusual → mythic → reality-bending

Early tier items should feel relatively ordinary.

Later tier items can become stranger, more symbolic, more magical, more abstract, and more ascended.

This is a default tendency, not a hard rule.

### Early Items

Early items should be readable and grounded.

Good early examples:

- Fencing Rapier
- Heavy Hammer
- Broadsword
- Poison Dagger
- Boarhide Vest
- Leather Wraps
- Stone Plate
- Mire Charm
- Iron Treads

Avoid early names that are too dramatic:

- Ashbrand Blade
- Godpiercer
- Echo of the First Wound
- Null Verdict
- World-Splitting Axe

Those kinds of names may fit later tiers, but they are too loud for T1.

### Later Items

Later items can become more distinct and exceptional.

Examples of later naming direction:

- Thorn Rapier
- Volcanic Rapier
- Rime Hammer
- Chitin Axe
- Storm Broadsword
- Ossuary Plate
- Trench Idol
- Temple Core
- Crownless Relic

Late items may use more mythic language, but should still communicate their slot and function.

---

## 3. Readability Rule

Item names should be readable first and flavorful second.

The player should be able to understand approximately what an item is from its name and icon.

Good pattern:

```text
[Biome / material / behavior modifier] + [clear object noun]
```

Examples:

- Thorn Rapier
- Iron Hammer
- Poison Dagger
- Mire Wraps
- Ridge Plate
- Cave Axe
- Frost Charm
- Ember Core

Avoid making common item names too abstract.

Bad early/common examples:

- Principle of Motion
- Weight Remembered
- First Hunger
- Remnant Seal
- Dream of the Edge

Those may be acceptable for late-game relics, but not for basic gear.

---

## 4. Transparency Rule

Flavor text and mechanics text must be separate.

A player should never need to infer the item's mechanical behavior from lore.

Every item can have:

1. **Name**
2. **Slot**
3. **Stats**
4. **Mechanic line**
5. **Flavor line**

The **mechanic line** should be clear and concrete.

Example mechanic line:

> Converts 30% of direct hit damage into Poison DoT over 4.5s.

The **flavor line** can be poetic or suggestive.

Example flavor line:

> A short blade treated with mire venom that refuses to dry.

The flavor line should support the world, but the mechanic line should explain the gameplay.

Clarity is mandatory.

---

## 5. Icon Rule

Item icons should be:

> literal object + mechanic symbol.

The player should see what the item is and get a hint of what it does.

Examples:

- Fencing Rapier: thin blade with speed streak.
- Heavy Hammer: broad hammer head with impact crack.
- Poison Dagger: dagger with green drip or venom line.
- Chaotic/Battle Axe: axe with broken rhythm marks or missing notch.
- Evasion Armor: light wrap with wind slash or afterimage mark.
- Damage Cap Armor: plate with threshold line or shielded impact crack.
- DoT-Resist Armor: wrappings with poison droplets sliding off.
- Regen Charm: amulet with soft pulse ring.
- Boots: footwear with motion streaks.

Icons should not need to show equipped appearance on the player.

They are inventory symbols, not paper-doll components.

---

## 6. Weapon-Agnostic Rule

Weapons are not visually equipped on player sprites.

A weapon is a combat expression, not necessarily a literal held object.

A melee class can use a bow item.  
A ranged class can use a sword item.  
A Slinger can reload without holding a gun.  
A Spirit can use a hammer as a mechanical attack profile without visibly swinging a hammer.

However, the weapon's **object fantasy should still match its mechanical shape**.

A huge mace should not usually be the fastest weapon.  
A rapier should probably be fast.  
A hammer should probably be slow and heavy.  
A dagger can naturally fit poison or quick strikes.  
A broadsword can naturally fit balanced/default use.

The object is symbolic of the attack profile, not a literal animation requirement.

---

## 7. Weapon Object Diversity

Weapons do not need to be only melee weapons.

Swords, hammers, axes, maces, daggers, spears, bows, javelins, crossbows, foci, and thrown objects are all allowed.

That said, weapon identity should be chosen for profile readability.

Good examples:

| Weapon Type | Natural Mechanical Read |
|---|---|
| Rapier | fast, precise, low per-hit |
| Dagger | quick, poison, bleed/DoT, low commitment |
| Broadsword | balanced, generic, accessible |
| Hammer | slow, heavy, high per-hit, armor pressure |
| Axe | high damage, rhythm break, cleave, brutality |
| Mace | armor break, stun-like weight, impact |
| Spear | reach, thrust, controlled spacing |
| Bow | ranged pressure, marksmanship, precision |
| Crossbow | slower shot, burst, reload logic |
| Javelin | thrown burst, piercing, mid-range feel |
| Focus | magical expression, class-neutral later item |

Melee-flavored weapons are still a strong default because they are iconic and readable, but ranged or magical objects can be introduced when they strengthen the biome or mechanic.

---

## 8. Slot Object Language

Each item slot should have its own object family.

This makes inventory icons more readable and helps future item naming stay coherent.

| Slot | Purpose | Object Language |
|---|---|---|
| Weapon | offensive expression | blade, rapier, dagger, hammer, axe, mace, spear, bow, focus |
| Armor | defensive expression | wrap, vest, hide, plate, mantle, shell, ward, cuirass |
| Charm | recovery expression | amulet, charm, eye, gem, idol, knot, pouch, bell |
| Boots | mobility expression | boots, wraps, treads, greaves, sandals, steps |
| Core | modifier/range layer | core, gem, jewel, ember, seal, flame, heart, sigil |
| Relic | class mechanic modifier | relic, mask, scripture, seal, shard, oath, icon, vessel |

Object language can become stranger at higher tiers, but slot readability should remain.

---

## 9. Weapon Slot Identity

The weapon slot represents the player's offensive expression.

It defines how the player's damage profile behaves, not what the player visibly holds.

T1 weapon families should establish core offensive archetypes.

### Fast Weapon

Early direction:

- Fencing Rapier
- Light Rapier
- Quickblade
- Training Rapier

Mechanical identity:

- fast,
- lower per-hit,
- good with on-hit/proc effects,
- weak against heavy flat mitigation unless compensated elsewhere.

Biome fit:

- Forest.

Later evolutions:

- Jungle thorn/on-hit variant.
- Volcanic flurry/speed variant.
- Other fast archetype branches as needed.

### Heavy Weapon

Early direction:

- Heavy Hammer
- Iron Hammer
- Stone Hammer
- Maul

Mechanical identity:

- slow,
- high per-hit,
- strong with empowered attacks,
- better into flat mitigation,
- weaker at proc stacking.

Biome fit:

- Mountain.

Later evolutions:

- empowered-hit specialization,
- brittle/armor-break variant,
- seismic/cleave variant.

### Basic Balanced Weapon

Early direction:

- Broadsword
- Steel Broadsword
- Plain Broadsword
- Iron Sword

Mechanical identity:

- basic,
- cheaper,
- accessible,
- jack-of-all-trades,
- master of none,
- useful early budget option.

Biome fit:

- Plains.

This weapon should feel deliberately mundane.

It is the stable floor, not a flashy signature weapon.

### DoT Weapon

Early direction:

- Poison Dagger
- Mire Dagger
- Venom Knife
- Bog Dagger

Mechanical identity:

- converts part of direct damage into damage-over-time,
- introduces DoT as a weapon profile,
- can later branch by damage profile.

Biome fit:

- Swamp.

Elemental/profile branches:

- Swamp = poison / venom / rot.
- Volcanic = fire / burn / ember.
- Tundra = frost / rime / chill.

Avoid using a dramatic fire name for the early swamp weapon.

`Ashbrand Blade` is likely too dramatic and too fire-coded for T1 Swamp.

### Irregular Weapon

Early direction:

- Battle Axe
- Notched Axe
- Heavy Axe
- Chipped Axe
- Cave Axe

Mechanical identity:

- high average damage,
- irregular rhythm,
- misses/skips on a fixed cadence,
- still applies on-hit effects during the skipped/dead strike,
- weird but deterministic.

Biome fit:

- Cave.

The exact name should be less abstract at T1 than `Chaotic Axe`, unless the cave identity is intentionally already strange.

Possible naming progression:

- T1: Notched Axe / Cave Axe / Battle Axe
- Later: Chaotic Axe / Cursed Axe / Rhythm Axe / Hollow Axe

---

## 10. Armor Slot Identity

The armor slot represents the player's defensive answer.

Armor should visually express the biome's mitigation philosophy.

Armor does not need to appear on the player sprite. It appears as an inventory icon.

Armor object language should usually include:

- wraps,
- hide,
- plate,
- mantle,
- shell,
- cuirass,
- robe,
- ward,
- bindings.

Biome defensive examples:

| Biome | Defensive Theme | Icon / Object Direction |
|---|---|---|
| Plains | flat mitigation / endurance | plain armor, layered leather, field plate, reinforced vest |
| Forest | evasion / speed | light wraps, shaded bindings, flexible hide, wind-marked cloth |
| Mountain | damage cap / anti-spike | stone plate, granite shell, heavy cuirass, threshold-marked armor |
| Swamp | DoT resistance / rot survival | treated wrappings, mireproof hide, sealed cloth, anti-venom mantle |
| Cave | premium DR / elite protection | bestial hide, chitin plate, dense leather, dark shell |

Armor names should stay concrete, especially early.

Examples:

- Field Plate
- Shaded Bindings
- Stone Plate
- Mireproof Wraps
- Cave Hide

Later armor can become more mythic or material-specific.

---

## 11. Charm Slot Identity

The charm slot represents recovery.

Charms are small carried or worn objects that help the vessel recover, endure, or stabilize.

Object language:

- amulet,
- charm,
- gem,
- eye,
- idol,
- knot,
- pouch,
- bell,
- core,
- token.

Recovery themes:

| Biome | Recovery Theme | Icon / Object Direction |
|---|---|---|
| Plains | heal on kill / kill-burst | simple charm, field token, red/yellow pulse |
| Forest | raw regen / recovery over time | root amulet, leaf charm, living knot |
| Mountain | shield / barrier | granite gem, barrier charm, stone idol |
| Swamp | absorb / delayed healing | murk eye, leech charm, mire gem |
| Cave | regen burst / pulse recovery | pulse stone, dark gem, resonant charm |

Charm names can be slightly more mystical than armor names, but should still stay readable early.

---

## 12. Boots Slot Identity

Boots represent mobility.

They are utility, not primary fantasy.

Object language:

- boots,
- wraps,
- treads,
- greaves,
- sandals,
- steps,
- soles.

Boot names should usually be simple and readable.

Examples:

- Light Boots
- Field Boots
- Sprinter Wraps
- Iron Treads
- Marsh Treads
- Cave Sprints

Boots can have biome material/flavor, but should not carry too much lore weight.

They are allowed to be the simplest item slot.

---

## 13. Core Slot Identity

The core slot represents a modifier layer, especially range/engagement identity and body behavior.

It unlocks later than the initial equipment slots and should feel slightly more magical than basic weapons or armor.

Cores are not normal equipment. They are internalized tools or spiritual objects that alter how the vessel operates.

Possible object language:

- core,
- gem,
- jewel,
- ember,
- flame,
- seal,
- sigil,
- heart,
- lens,
- knot,
- shard.

Possible core fantasy directions:

- magical gem,
- living flame,
- stance-core,
- spiritual organ,
- engagement seal,
- inner engine.

Recommended framing:

> A core is a concentrated object of essence that modifies the vessel's combat posture.

Cores can be more abstract than weapons/armor because they unlock later and represent a more internal layer.

Examples:

- Bruiser Core
- Farshot Lens
- Juggernaut Heart
- Ember Core
- Anchor Sigil
- Flow Gem
- Close-Guard Seal

Core visuals should be strong as icons:

- glowing gem,
- burning core,
- circular seal,
- small heart-like object,
- eye/lens,
- contained flame.

Do not overdefine cores yet if the system is still evolving.

---

## 14. Relic Slot Identity

The relic slot represents class mechanic modification.

It unlocks later, around the point where a class mechanic has matured into a distinct identity.

Relics should feel more class-specific and more meaningful than ordinary gear.

Possible object language:

- relic,
- mask,
- seal,
- scripture,
- shard,
- oath,
- icon,
- vessel,
- bell,
- tablet,
- crown fragment,
- old token.

Recommended framing:

> A relic is an advanced essence-forged object that alters how a cultivated class law expresses itself.

Relics may be tied to:

- class mechanics,
- old ascendants,
- forbidden techniques,
- masks,
- scriptures,
- seals,
- class-specific symbols,
- or late-game domain artifacts.

Relic identity is not fully locked and should receive a dedicated pass later.

For now, the bible only establishes that relics should be:

- later-game,
- class-mechanic-facing,
- more symbolic than normal gear,
- readable as inventory icons,
- and mechanically transparent.

---

## 15. Item Descriptions

Each item can have a short flavor line.

Flavor text should be:

- short,
- suggestive,
- soft-lore,
- not required for mechanical understanding,
- grounded in the item's biome/material,
- and compatible with the world premise.

Flavor text should avoid long exposition.

Good flavor style:

> A thin practice blade honed for quick hands and quicker exits.

> Mire venom clings to the edge long after the strike.

> Stone remembers the blow so the body does not have to.

> A charm of living root, still drinking from a forest that is no longer whole.

Bad flavor style:

> This weapon converts exactly 30% of damage into poison damage over time.

That belongs in the mechanic line, not the flavor line.

Also avoid overly grand early-game lore:

> Forged by the First God-King before the sundering of all realities.

That may be appropriate for late-game relics, not T1 gear.

---

## 16. Biome Language Rule

Each biome should have a small vocabulary pool for item names and descriptions.

This keeps crafted gear coherent.

### Plains

Themes:

- plain,
- field,
- herd,
- endurance,
- pressure,
- survival,
- dust,
- horn,
- hide,
- iron,
- simple craft.

Item language:

- Broadsword
- Field Plate
- Survivor's Vest
- Horn Charm
- Dust Boots
- Plain Guard

Avoid making Plains too fancy. It is the accessible starter gear family.

### Forest

Themes:

- speed,
- pursuit,
- root,
- leaf,
- shade,
- bramble,
- living motion,
- quick recovery,
- evasion.

Item language:

- Fencing Rapier
- Shaded Bindings
- Root Amulet
- Sprinter Wraps
- Bramble Edge
- Leafguard

Forest gear should feel light, quick, and flexible.

### Mountain

Themes:

- stone,
- weight,
- height,
- impact,
- threshold,
- ridge,
- granite,
- iron,
- endurance against spikes.

Item language:

- Heavy Hammer
- Stone Plate
- Granite Barrier
- Iron Treads
- Ridge Maul
- Threshold Plate

Mountain gear should feel heavy, simple, and impact-resistant.

### Swamp

Themes:

- mire,
- bog,
- poison,
- venom,
- rot,
- sludge,
- sealed cloth,
- slow survival,
- absorption,
- toxin resistance.

Item language:

- Poison Dagger
- Mireproof Wraps
- Murk Eye
- Marsh Treads
- Venom Knife
- Bog Charm

Swamp gear can include oozes, treated wrappings, venom, and absorb motifs.

### Cave

Themes:

- darkness,
- chitin,
- hide,
- pressure,
- ambush,
- irregular rhythm,
- elite survival,
- dense protection,
- pulse.

Item language:

- Notched Axe
- Cave Hide
- Pulse Stone
- Bat-Wing Boots
- Chitin Plate
- Deep Axe

Cave gear should feel stranger than other T1 gear, but not fully mythic yet.

---

## 17. Element / Damage Profile Rule

The game should avoid generic rock-paper-scissors elemental design.

Elements can exist as damage profile identities, especially for damage-over-time behavior, but they should not imply a simple weakness chart.

Current useful profile language:

| Profile | Feel | Possible Biome |
|---|---|---|
| Poison | faster, stacking, toxin/venom | Swamp |
| Fire | medium burn, heat, ember | Volcanic |
| Frost | slower, heavier, chill/rime | Tundra |

These profiles can appear in item names and VFX, but should be mechanically transparent.

Do not imply hidden elemental weakness/resistance systems unless they actually exist.

---

## 18. Upgrade Naming Rule

Use simple mechanical upgrade notation by default.

Recommended:

- `Item Name +0`
- `Item Name +1`
- `Item Name +2`
- `Item Name +3`

Do not require every upgrade level to have a unique name.

Optional future polish:

- icon refinement,
- brighter glow,
- stronger border,
- slightly changed flavor text,
- forged/perfected descriptors in UI only if not confusing.

Avoid bloating the item database with name variants unless there is a strong reason.

---

## 19. Tier Escalation Examples

The same weapon family can grow from mundane to exceptional.

### Fast Weapon Line

- T1: Fencing Rapier
- T2: Thorn Rapier
- T3: Volcanic Rapier
- Later: Flurry Needle, Storm Rapier, Crown Needle

### Heavy Weapon Line

- T1: Heavy Hammer
- T2: Ridge Maul
- T3: Rime Hammer
- Later: Seismic Maul, Temple Hammer, World-Anvil

### Basic Weapon Line

- T1: Broadsword
- T2: Steel Broadsword
- T3: Storm Blade
- Later: Banner Blade, Oath Sword, Crownless Sword

### DoT Weapon Line

- T1: Poison Dagger
- T2: Venom Knife
- T3: Ember Blade / Rime Blade
- Later: Plague Fang, Frostbrand, Ash Needle

### Irregular Weapon Line

- T1: Notched Axe
- T2: Cave Axe
- T3: Chitin Axe
- Later: Chaotic Axe, Cursed Axe, Rhythm Cleaver

These are examples, not locked names.

---

## 20. Item Design Checklist

When creating or renaming an item, ask:

1. What slot is it?
2. What biome forged it?
3. What domain law does it express?
4. Is the object noun readable?
5. Does the name fit the item's tier?
6. Is the icon a literal object plus mechanic symbol?
7. Is the flavor line separate from the mechanic line?
8. Does the item avoid implying mechanics that do not exist?
9. Does it fit the slot's object language?
10. Does it preserve the weapon-agnostic player sprite rule?
11. Is it too dramatic for an early item?
12. Is it too generic for a later item?

If the item is unclear, simplify the name and strengthen the icon.

---

## 21. Current Locked Defaults

- Items are essence-forged vessels/tools.
- Monsters do not drop items directly.
- Items are crafted through biome mastery.
- Early item names should be mundane and readable.
- Later item names can become stranger and more magical.
- Item names should stay concrete unless late-game/relic context justifies abstraction.
- Weapons can be melee, ranged, or magical objects, but should match their mechanical shape.
- Player sprites do not show equipped weapons.
- Normal equipment does not visibly alter player sprites.
- Icons should be literal object plus mechanic symbol.
- Flavor text and mechanics text must be separate.
- Mechanics text must be transparent and precise.
- Swamp DoT weapon should be poison/venom/rot themed, not fire themed.
- Fire DoT belongs better to Volcanic.
- Frost DoT belongs better to Tundra.
- Each slot should have its own object language.
- Cores are later modifier objects; exact flavor is still flexible.
- Relics are later class-mechanic objects; exact flavor needs a separate future pass.
- Catalysts are intentionally excluded from this bible until their system is more defined.
