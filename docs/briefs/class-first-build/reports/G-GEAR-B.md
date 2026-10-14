# G-GEAR-B report
**Agent:** Grok   **Branch:** rw/gear-b   **Last commit:** 94d23ed2

## Done
- Slinger (`4138f41b`), Spirit (`135ed5f9`) and Conduit (`94d23ed2`): each class's weapons and its lines on the shared armor and charm bases, T1–T4. 33 weapons and 52 lines per class.
- A weapon copies that biome-tier's generic weapon: `requiredBiomeLevel`, `cost`, `stats` (Jungle includes `onHitDamage`), `attacksPerSecond`, `icon`. `mechanicEffects` is `{}`. `weaponDot`, cosmetic `element`, and the generic's name, id and description are not copied. No generic weapon had a catalyst or an upgrade ladder.
- The same job keeps its name and text at every tier. Only the copied stats change. When a biome retires, its weapon is entered again on the receiving biome. Its armor and charm lines are not.
- The Clearing starter is T1 class gear. The only Clearing weapon is `primordial-club` at tier 0, so the starter copies that weapon's cost, stats, level, attack speed and icon and is stored as tier 1. No line on `clearing-vest-t1` or `clearing-charm-t1`.
- Where a biome-tier has two generic weapons, the first in the file was copied: Mountain T4 `mountain-earthsunder-maul`, Desert T3 `desert-solar-cross`, Desert T4 `desert-zenith-cross`, Tundra T3 `tundra-permafrost-maul`, Tundra T4 `tundra-glacial-tyrant-maul`, Volcanic T4 `volcanic-eruption-lash`.
- The bible's Wasteland is the `graveyard` recipe group.
- Player-facing text is the bible's job as a sentence. Digits are left out (the Mountain Conduit armor's 30%, Hibernate's 3 s, the Hand Cannon's 6-round clip, the plain pistol's 8 rounds). Word magnitudes from the bible stay (half, doubles, a fifth, three or more).

### Slinger — biome × tier

| Biome | Weapon(s) | Armor line | Charm line |
|---|---|---|---|
| T1 clearing | Plain Pistol | — | — |
| T1 plains | Pepperbox | Elbow Room | Breathing Room |
| T1 forest | Carbine | Quickdraw | Fleet |
| T1 swamp | Snakebite Pistol | Oilskin | Snake Oil |
| T1 mountain | Hand Cannon | Dig In | Regroup |
| T1 cave | Drum Gun | Hunker | Bivouac |
| T2 plains | Pepperbox | Elbow Room | Breathing Room |
| T2 forest | Carbine | Quickdraw | Fleet |
| T2 swamp | Snakebite Pistol | Oilskin | Snake Oil |
| T2 mountain | Hand Cannon | Dig In | Regroup |
| T2 cave | Drum Gun | Hunker | Bivouac |
| T2 jungle | Hunting Rifle | Lookout | Undergrowth |
| T2 desert | Long Rifle | Glass Duster | Shade |
| T3 swamp | Snakebite Pistol | Oilskin | Snake Oil |
| T3 mountain | Hand Cannon | Dig In | Regroup |
| T3 cave | Drum Gun | Hunker | Bivouac |
| T3 jungle | Hunting Rifle, Carbine | Lookout | Undergrowth |
| T3 desert | Long Rifle | Glass Duster | Shade |
| T3 tundra | Frostlock Rifle | Warm Hands | Thaw |
| T3 volcanic | Firebrand Pistol, Pepperbox | Asbestos Coat | Heatsink |
| T4 mountain | Hand Cannon | Dig In | Regroup |
| T4 jungle | Hunting Rifle, Carbine | Lookout | Undergrowth |
| T4 desert | Long Rifle | Glass Duster | Shade |
| T4 tundra | Frostlock Rifle | Warm Hands | Thaw |
| T4 volcanic | Firebrand Pistol, Pepperbox | Asbestos Coat | Heatsink |
| T4 graveyard | Reaper's Repeater, Snakebite Pistol | Hallowed Ground | Vigil |
| T4 trench | Pressure Rifle, Drum Gun | Pressure Suit | Ballast |

### Spirit — biome × tier

| Biome | Weapon(s) | Armor line | Charm line |
|---|---|---|---|
| T1 clearing | Plain Rod | — | — |
| T1 plains | Forked Rod | Static Skin | Still Air |
| T1 forest | Quickening Wand | Slipstream | Clear Sky |
| T1 swamp | Drenching Staff | Sealed Vessel | Petrichor |
| T1 mountain | Summit Staff | Grounded | Afterstorm |
| T1 cave | Lodestone Orb | Ironbound | Capacitor |
| T2 plains | Forked Rod | Static Skin | Still Air |
| T2 forest | Quickening Wand | Slipstream | Clear Sky |
| T2 swamp | Drenching Staff | Sealed Vessel | Petrichor |
| T2 mountain | Summit Staff | Grounded | Afterstorm |
| T2 cave | Lodestone Orb | Ironbound | Capacitor |
| T2 jungle | Lurker's Rod | Stormsense | Monsoon |
| T2 desert | Sirocco Staff | Sandshroud | Oasis |
| T3 swamp | Drenching Staff | Sealed Vessel | Petrichor |
| T3 mountain | Summit Staff | Grounded | Afterstorm |
| T3 cave | Lodestone Orb | Ironbound | Capacitor |
| T3 jungle | Lurker's Rod, Quickening Wand | Stormsense | Monsoon |
| T3 desert | Sirocco Staff | Sandshroud | Oasis |
| T3 tundra | Rime Staff | Insulated | Aurora |
| T3 volcanic | Ember Rod, Forked Rod | Flash Steam | Thermal |
| T4 mountain | Summit Staff | Grounded | Afterstorm |
| T4 jungle | Lurker's Rod, Quickening Wand | Stormsense | Monsoon |
| T4 desert | Sirocco Staff | Sandshroud | Oasis |
| T4 tundra | Rime Staff | Insulated | Aurora |
| T4 volcanic | Ember Rod, Forked Rod | Flash Steam | Thermal |
| T4 graveyard | Tempest Staff, Drenching Staff | Gravecloth | Wake |
| T4 trench | Abyssal Lantern, Lodestone Orb | Deep Seal | Abyssal Calm |

### Conduit — biome × tier

T2 has no charm column. Charms there are §7.9, the same line stronger, including Jungle Bloomlink and Desert Purge.

| Biome | Weapon(s) | Armor line | Charm line |
|---|---|---|---|
| T1 clearing | Plain Staff | — | — |
| T1 plains | Swarm Staff | Shared Plating | Herd |
| T1 forest | Swift Staff | Bramble | Sapbark |
| T1 swamp | Poison Staff | Poison Shift | Bloodtithe |
| T1 mountain | Ability Staff | Big-Hit Intercept | Cairnstone |
| T1 cave | Heavy Staff | You Tank | Deep Reserve |
| T2 plains | Swarm Staff | Shared Plating | Herd |
| T2 forest | Swift Staff | Bramble | Sapbark |
| T2 swamp | Poison Staff | Poison Shift | Bloodtithe |
| T2 mountain | Ability Staff | Big-Hit Intercept | Cairnstone |
| T2 cave | Heavy Staff | You Tank | Deep Reserve |
| T2 jungle | First Strike | Sentinel | Bloomlink |
| T2 desert | Longshot | Sandveil | Purge |
| T3 swamp | Poison Staff | Poison Shift | Bloodtithe |
| T3 mountain | Ability Staff | Big-Hit Intercept | Cairnstone |
| T3 cave | Heavy Staff | You Tank | Deep Reserve |
| T3 jungle | First Strike, Swift Staff | Sentinel | Bloomlink |
| T3 desert | Longshot | Sandveil | Purge |
| T3 tundra | Icebound | Permafrost | Hibernate |
| T3 volcanic | Berserk, Swarm Staff | Fireproof | Emberglow |
| T4 mountain | Ability Staff | Big-Hit Intercept | Cairnstone |
| T4 jungle | First Strike, Swift Staff | Sentinel | Bloomlink |
| T4 desert | Longshot | Sandveil | Purge |
| T4 tundra | Icebound | Permafrost | Hibernate |
| T4 volcanic | Berserk, Swarm Staff | Fireproof | Emberglow |
| T4 graveyard | Cleave, Poison Staff | Grave Pact | Requiem |
| T4 trench | Exploit, Heavy Staff | Pressure Seal | Tidewater |

### Moved lines skipped

The weapon moved. The armor and charm lines did not.

| Class | When | Skipped lines | Receiving biome keeps |
|---|---|---|---|
| Slinger | Forest → Jungle, T3 | Quickdraw, Fleet | Lookout, Undergrowth |
| Slinger | Plains → Volcanic, T3 | Elbow Room, Breathing Room | Asbestos Coat, Heatsink |
| Slinger | Swamp → Graveyard, T4 | Oilskin, Snake Oil | Hallowed Ground, Vigil |
| Slinger | Cave → Trench, T4 | Hunker, Bivouac | Pressure Suit, Ballast |
| Spirit | Forest → Jungle, T3 | Slipstream, Clear Sky | Stormsense, Monsoon |
| Spirit | Plains → Volcanic, T3 | Static Skin, Still Air | Flash Steam, Thermal |
| Spirit | Swamp → Graveyard, T4 | Sealed Vessel, Petrichor | Gravecloth, Wake |
| Spirit | Cave → Trench, T4 | Ironbound, Capacitor | Deep Seal, Abyssal Calm |
| Conduit | Forest → Jungle, T3 | Bramble, Sapbark | Sentinel, Bloomlink |
| Conduit | Plains → Volcanic, T3 | Shared Plating, Herd | Fireproof, Emberglow |
| Conduit | Swamp → Graveyard, T4 | Poison Shift, Bloodtithe | Grave Pact, Requiem |
| Conduit | Cave → Trench, T4 | You Tank, Deep Reserve | Pressure Seal, Tidewater |

### Placeholder names

The bible named the job and not a weapon or line title:

- Slinger: **Plain Pistol** (the Clearing's "plain pistol").
- Spirit: **Plain Rod** (the Clearing's "plain rod").
- Conduit weapons: **Plain Staff** (the tutorial weapon that only adds damage), **Swarm Staff** (more summons), **Swift Staff** (fewer summons, faster attacks), **Poison Staff** (summon hits stack poison), **Ability Staff** (stronger summon abilities), **Heavy Staff** (fewer, stronger summons).
- Conduit lines: **Shared Plating** (plating for the summons, some for you), **Poison Shift** (poison on you moves to a summon), **You Tank** (you tank), **Big-Hit Intercept** (title-cased from the T2+ label "Big-hit intercept"; the T1 cell gives the 30% rule and no title).

These Conduit weapons use the bible's job name as the weapon title: First Strike, Longshot, Icebound, Berserk, Cleave, Exploit.

### Spot-check

- `slinger-pepperbox-t1` and `iron-broadsword`: plains level 1, `{ yellow: 10 }`, `{ attack: 19 }`, 0.90, `items/weapons/iron-broadsword.png`.
- `spirit-lurkers-rod-t2` and `jungle-stinger-rapier`: jungle level 1, `{ green: 55 }`, `{ attack: 24, onHitDamage: 23 }`, 1.55, `items/weapons/stinger-rapier.png`.
- `conduit-icebound-t3` and `tundra-permafrost-maul`: tundra level 1, `{ blue: 124 }`, `{ attack: 162 }`, 0.50, `items/weapons/permafrost-maul.png`.

## Checks
- pnpm typecheck: clean
- pnpm test -- classGear recipeGates recipeCurve weaponCurve: 4/5 passed
  - PASS shared/src/data/classGear/classGear.test.ts
  - `classGear.test.ts: ok (striker 0w/0l, squire 0w/0l, apprentice 0w/0l, slinger 33w/52l, spirit 33w/52l, conduit 33w/52l)`
  - PASS shared/src/data/recipes/recipeCurve.test.ts
  - PASS shared/src/data/recipeGates.test.ts
  - PASS server/test/classGear.test.ts (the substring also selected this wiring test)
  - FAIL shared/src/data/recipes/weaponCurve.test.ts — every new weapon id is missing from `WEAPON_ATTACK`. Each Attack value is the generic weapon's, already in that map. Not edited: the brief forbids `shared/src/data/recipes/*`.

## Not done, or unsure
- `weaponCurve.test.ts` will stay red until those 99 ids are added to the pin, or class weapons are exempted. Needs the conductor.
- Clearing starters are tier 1 over a tier-0 generic weapon. `recipeGates` accepts it (the Clearing cap is 4 and the node-tier check skips the Clearing). Say if they should be tier 0 instead.
- Hibernate's text drops "below a quarter of its HP" and "3 s" for "badly hurt" and "a few seconds", and keeps the per-summon wait. Big-Hit Intercept drops "30%" for "a large share".
- The first-of-two generic weapons listed above are the slow heavy or the opener, not the second weapon in the file. Say if a class should copy the other one.

## Files outside the brief I needed (not edited)
- `shared/src/data/recipes/weaponCurve.test.ts` — the full-power Attack pin. Class weapons register into `RECIPE_DATABASE`, and the pin requires every weapon id.
