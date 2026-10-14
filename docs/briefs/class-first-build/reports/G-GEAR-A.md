# G-GEAR-A report
**Agent:** Grok   **Branch:** rw/gear-a   **Last commit:** d644e35c (Apprentice gear; this report is the commit after the three gear commits)

Commits: `c8c58179` Striker · `73bf08e0` Squire · `d644e35c` Apprentice.

## Done

Each class file has **33 weapons and 52 lines**. A job recurs at every tier its biome is still live, with the same name and text; only the copied stats change. A retired biome's weapon is entered again on the biome it moves to. Moved armor and charm lines are not entered, because a base keeps one line per class. Effects are `{}`. The Clearing has a start weapon and no line on `clearing-vest-t1` or `clearing-charm-t1`. The bible's Wasteland is the `graveyard` bases.

Where a biome-tier has two generic weapons, the numbers are the first weapon in that recipe file.

### Striker (`shared/src/data/classGear/striker.ts`)

Cell: weapon(s); armor line; charm line. "Same" means the same jobs, on that tier's recipe.

| Biome | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| Clearing | Plain Sword. No line. | | | |
| Plains | Broadblade; Shoulder Through; Grit | Same | Retired. Broadblade moves to Volcanic. | |
| Forest | Twin Fangs; Unbroken; Rhythm | Same | Retired. Twin Fangs moves to Jungle. | |
| Swamp | Hooked Sickle; Bloodless; Antidote | Same | Same | Retired. Hooked Sickle moves to Graveyard. |
| Mountain | Maul; Braced Cast; Cairnstone | Same | Same | Same |
| Cave | Bastard Sword; Weighty; Deep Breath | Same | Same | Retired. Bastard Sword moves to Trench. |
| Jungle | | Hunter's Blade; Watchful; Chase | Hunter's Blade and Twin Fangs (from Forest); Watchful; Chase | Same |
| Desert | | Executioner's Blade; Close In; Shake Off | Same | Same |
| Tundra | | | Rimeblade; Winter Coat; Frostbite Mend | Same |
| Volcanic | | | Bloodfire Axe and Broadblade (from Plains); Cinderskin; Fuel | Same |
| Graveyard | | | | Reaper's Scythe and Hooked Sickle (from Swamp); Deathward; Requiem |
| Trench | | | | Exploit and Bastard Sword (from Cave); Clear Mind; Brine Mend |

### Squire (`shared/src/data/classGear/squire.ts`)

| Biome | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| Clearing | Plain Sword and Shield. No line. | | | |
| Plains | Flanged Mace; Rampart; Breather | Same | Retired. Flanged Mace moves to Volcanic. | |
| Forest | Arming Sword; Turn Aside; Counterbalance | Same | Retired. Arming Sword moves to Jungle. | |
| Swamp | Spiked Flail; Iron Gut; Purifying Breath | Same | Same | Retired. Spiked Flail moves to Graveyard. |
| Mountain | Warhammer; Planted; Stone Patience | Same | Same | Same |
| Cave | Tower Shield; Reforged; Old Guard | Same | Same | Retired. Tower Shield moves to Trench. |
| Jungle | | Hooked Glaive; Unflinching; Watchman's Ease | Hooked Glaive and Arming Sword (from Forest); Unflinching; Watchman's Ease | Same |
| Desert | | Throwing Shield; Arrow Catcher; Called Out | Same | Same |
| Tundra | | | Glacier Mace; Frozen Resolve; Hearth | Same |
| Volcanic | | | Forge Hammer and Flanged Mace (from Plains); Stoked; Cooling Breath | Same |
| Graveyard | | | | Bone Maul and Spiked Flail (from Swamp); Grave Plate; Rest Eternal |
| Trench | | | | Pressure Hammer and Tower Shield (from Cave); Abyssal Plate; Brine Will |

### Apprentice (`shared/src/data/classGear/apprentice.ts`)

| Biome | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| Clearing | Plain Wand. No line. | | | |
| Plains | Branching Wand; Warding Sigils; Feeding Swarm | Same | Retired. Branching Wand moves to Volcanic. | |
| Forest | Thornwood Rod; Give Ground; Numbing Calm | Same | Retired. Thornwood Rod moves to Jungle. | |
| Swamp | Bog Censer; Bitter Blood; Bitter Tonic | Same | Same | Retired. Bog Censer moves to Graveyard. |
| Mountain | Runestone Staff; Stone Sigil; Still Mind | Same | Same | Same |
| Cave | Deep Grimoire; Sigil Weight; Long Draw | Same | Same | Retired. Deep Grimoire moves to Trench. |
| Jungle | | Stalker's Rod; Second Skin; Patient Hunter | Stalker's Rod and Thornwood Rod (from Forest); Second Skin; Patient Hunter | Same |
| Desert | | Dune Staff; Sun-Ward; Cool Draught | Same | Same |
| Tundra | | | Glacial Wand; Ice Veil; Cold Comfort | Same |
| Volcanic | | | Magma Censer and Branching Wand (from Plains); Ashguard; Banked Coals | Same |
| Graveyard | | | | Charnel Rod and Bog Censer (from Swamp); Gravewrap; Last Rites |
| Trench | | | | Abyssal Censer and Deep Grimoire (from Cave); Deep Ward; Tidal Draw |

### Moved lines skipped

Not entered on the receiving biome. The receiving biome keeps its own line.

| Class | From | To | From tier | Armor | Charm |
|---|---|---|---|---|---|
| Striker | Forest | Jungle | T3 and T4 | Unbroken | Rhythm |
| Striker | Plains | Volcanic | T3 and T4 | Shoulder Through | Grit |
| Striker | Swamp | Graveyard | T4 | Bloodless | Antidote |
| Striker | Cave | Trench | T4 | Weighty | Deep Breath |
| Squire | Forest | Jungle | T3 and T4 | Turn Aside | Counterbalance |
| Squire | Plains | Volcanic | T3 and T4 | Rampart | Breather |
| Squire | Swamp | Graveyard | T4 | Iron Gut | Purifying Breath |
| Squire | Cave | Trench | T4 | Reforged | Old Guard |
| Apprentice | Forest | Jungle | T3 and T4 | Give Ground | Numbing Calm |
| Apprentice | Plains | Volcanic | T3 and T4 | Warding Sigils | Feeding Swarm |
| Apprentice | Swamp | Graveyard | T4 | Bitter Blood | Bitter Tonic |
| Apprentice | Cave | Trench | T4 | Sigil Weight | Long Draw |

### Placeholder names

The bible names every later weapon and every line. These three start weapons are named from the T1 "Start" line, because that line does not give a proper weapon name:

- Striker: **Plain Sword** (the brief's example; the start line says plain swings and a plain finisher).
- Squire: **Plain Sword and Shield** (the start line: "a plain sword and shield").
- Apprentice: **Plain Wand** (the start line: "a plain wand").

### Texts that drop a bible figure

Player texts keep the bible's words, including half, quarter, a third, double, and "two or more" / "three or more". Two texts drop a tuning figure so the sentence has no count:

- Striker **Rhythm**: the bible's "~10 s" is not in the text. It reads "up to double."
- Apprentice **Runestone Staff**: the bible's "three sigils per hit and +1 to the cap" is "each hit lays extra sigils and the cap is higher." The parenthetical "the brief's Frostbrand Staff" is not in the text.

## Checks

- `pnpm typecheck`: clean.
- `pnpm test -- classGear recipeGates recipeCurve weaponCurve`: **4/5 passed** in 12s.
  - PASS `shared/src/data/classGear/classGear.test.ts`: `classGear.test.ts: ok (striker 33w/52l, squire 33w/52l, apprentice 33w/52l, slinger 0w/0l, spirit 0w/0l, conduit 0w/0l)`
  - PASS `server/test/classGear.test.ts`
  - PASS `shared/src/data/recipes/recipeCurve.test.ts`
  - PASS `shared/src/data/recipeGates.test.ts`
  - FAIL `shared/src/data/recipes/weaponCurve.test.ts`: every new class weapon id is missing from `WEAPON_ATTACK`. The attack on each one is the generic weapon's attack, copied, not a new number. That file is under `shared/src/data/recipes/`, which this brief says not to edit.
- Spot-check, class weapon against the first generic weapon of that biome-tier (level, cost, attack, attacks per second, icon):
  - `striker-broadblade-t1` matches `iron-broadsword`: plains level 1, yellow 10, attack 19, 0.90, `items/weapons/iron-broadsword.png`.
  - `apprentice-dune-staff-t2` matches `desert-sunsteel-cross`: desert level 1, yellow 70, attack 65, 0.80, `items/weapons/sunsteel-falchion.png`.
  - `squire-warhammer-t4` matches `mountain-earthsunder-maul`: mountain level 19, blue 256, attack 486, 0.40, `items/weapons/earthsunder-maul.png`.

The brief's "e.g. Striker 31w/48l" is the shape of that print line. The tables produce 33 and 52: six T1 weapons (including the Clearing), seven T2, nine T3 (two biomes hold a moved weapon), eleven T4 (four biomes hold a moved weapon); lines are 10 + 14 + 14 + 14, with no Clearing lines and no moved lines.

## Not done, or unsure

- `weaponCurve.test.ts` does not pass until someone adds the 99 new ids to `WEAPON_ATTACK`, each with the attack already on that recipe. I did not edit it.
- The Clearing's only generic weapon, `primordial-club`, is authored at **tier 0**. The start weapons are **tier 1**, with the club's cost, stats, attack speed, level, and icon. Confirm tier 1 against copying tier 0.
- Jungle weapons also copy `stats.onHitDamage` from the first jungle rapier (24/23 at T2, 50/38 at T3, 108/70 at T4), because it sits on `stats`. `mechanicEffects` is still `{}`. Say if on-hit should not come along.
- First generic weapon when a file has two, in case a later one was the intended curve: desert T3 `desert-solar-cross` (not the quarterstaff), desert T4 `desert-zenith-cross` (not the warstaff), tundra T3 `tundra-permafrost-maul` (not Rimebrand), tundra T4 `tundra-glacial-tyrant-maul`, mountain T4 `mountain-earthsunder-maul` (not Warmaul), volcanic T4 `volcanic-eruption-lash` (not Cinderbrand).

## Files outside the brief I needed (not edited)

- `shared/src/data/recipes/weaponCurve.test.ts` — the pin rejects any weapon id it does not list. Needs a row per class weapon, attack equal to the copied generic attack.
