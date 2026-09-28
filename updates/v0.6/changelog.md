# v0.6 — Every boss, rebuilt

2026-09-28

Every boss in the game has been redesigned, with named phases and mechanics you can read
and answer. The game now has music and sound, new animations for bosses, monsters and
your own attacks, and a full balance pass from Tier 1 to Tier 4.

> **Returning characters:** your character carries over. If you own a Thorn Needle, it is
> now a Gale Needle at the same upgrade level. The Void Overlord encounter has been
> removed; no node in the current world hosted it.

## Highlights

- **Every boss is rebuilt.** Each biome's boss has its own identity from Tier 1 to Tier 4,
  with phases announced by name, readable wind-ups and a counter for every mechanic.
- **Longer, fairer boss fights.** About 1 minute at Tier 2, 2 minutes at Tier 3 and
  3 minutes at Tier 4, and every one is beatable.
- **Music and sound.** A theme for every biome, a four-part soundtrack for boss fights,
  and new sound effects for attacks, bosses and status effects.
- **New animations.** Boss wind-ups and payoffs, new monster attacks, and player attacks
  that grow more impressive as your character progresses.
- **Conduit** summons survive much better early on, and a new recall command pulls them
  out of danger.
- **Balance pass:** weapons, armor, charms and Tier 4 specializations evened out, mastery
  pacing adjusted, Volcano made less deadly, and Tier 1 bosses beatable again.

## Bosses

Every boss now changes phase at set health thresholds. The phase is announced over the
boss and shown as a tile on its target frame; hover the tile to see what the phase does.
Every mechanic has an answer your Runes can express: Guard on a telegraph, Step Back out
of an area, Cleanse a debuff, or stun or root a cast to stop it.

- **Plains:** at Tier 2 the Razortusk leads its own herd. **Rallying Roar** empowers every
  living add, and at 50% **Stampede** calls a bull and two hawks.
- **Forest:** the Timberclaw's threat is its **Bestial Frenzy**, which ramps up over the
  fight, not its opening hits.
- **Swamp:** no longer requires Cleanse. Bile pools hurt, Mire pools slow, **Mire Lash**
  drags you toward a pool, and **Bile Rain** drops more pools. At Tier 3, **Spore Bloom**
  (60%) and **Rot Bloom** (25%) spread spores and rot across the arena.
- **Mountain:** at Tier 2 its stone plate makes it immune to control. Stop the cast or
  break the plate. At Tier 3 it gains **Double Charge** and **Crag Rush**; at Tier 4,
  **Double Charge**, **Rockfall** and **Landslide**.
- **Cave:** the burrower surfaces as a mound you can hit, and damage drags it up.
  Sinkholes stack **Eroded**. At 50% it dives again; at Tier 3 it adds **Tunnel Chase**
  and **Collapse**, and a root pins the mound.
- **Desert:** **Standoff** keeps you at range while it dashes away (root the dash), and
  **Sandstorm** closes out the fight. At Tier 4, **Hit and Run** dashes in for a Death
  Sting and withdraws; catch it with a root or stun.
- **Jungle:** the predator flees faster and goes into a frenzy after landing an ambush. It
  gains **Venomous Bite** and **Hunted** at Tier 3, and **Thorn Snares** and **Cornered**
  at Tier 4.
- **Tundra:** can't be stunned or rooted. Its Chill builds to a **Deep Freeze**, Frostbite
  lingers, **Brittle** leads into Shatter, and **Blizzard** ends the fight. At Tier 4 it
  also gains **Ice Armor**.
- **Volcanic:** can't be stunned or rooted. Vents erupt around the arena on a rhythm, and
  fissures open under your feet. At Tier 4 it adds **Magma Shove** and a **Simmering
  Burn** over the arena. Its final strike is a long cast that can't be dodged: kill it
  first, or survive the blast with a Guard and tank gear.
- **Wasteland:** the Charnel-Crown Sovereign is a commander with an army. It summons its
  entourage, hexes you from range and raises the dead. At 60% it takes a **Bone Tithe**,
  and at 25% it begins its **Harvest**, devouring corpses and its own army.
- **Trench:** stacks Wound, Crushing Pressure and Rend on you; **Depth** makes them last
  longer, and **Devour** hits harder for every debuff you carry. Devour is its only
  stunnable beat. It goes **Into the Dark** at 60% and brings **Crushing Depth** at 25%.
  Trench monsters also hit with the boss's Wound and Pressure.

New Rune conditions answer the new mechanics: **Enemy Shielded**, **Enemy Escaping** and
**Debuff Pile**. **Enemy Charging** now also covers boss impact circles and payoffs.
Late-phase weather (blizzard, ash fall, sandstorm, spores, the abyss) sets each arena.

## Boss difficulty

- **Tier 1:** the Gnarled Greatbear (Forest) attacks for 18 (was 24), and the Tusked
  Razorback (Plains) for 26 (was 34). The Razorback's swarm is thinner: 1 slime every 12
  seconds (was 2 every 10), at most 3 alive, and its 50% rally brings 2 slimes and no boar.
- **Tier 2:** every boss now takes about a minute and can be won by melee and ranged
  builds alike. The Plains and Forest bosses were the deadliest and are much softer. The
  Swamp, Jungle and Cave bosses hit a little less hard.
- **Tiers 3 and 4:** bosses take about 2 and 3 minutes. They are tougher, and the ramps
  that would have turned lethal in a longer fight are softened: Volcanic heat and final
  casts, Tundra Frostbite, Wasteland raises and Harvest, Jungle venom and Cornered, and
  the Desert Execution.

## Music and sound

- Every biome has its own theme.
- **Boss fights have a four-part soundtrack.** An anticipation track plays when you enter
  a dungeon. Activating the altar starts the battle track, and it intensifies at the
  boss's phase changes, continuing from the same point in the song instead of restarting.
  The Volcanic boss's final cast has a track of its own.
- New sound effects for every class's attacks, monster attacks, boss mechanics and status
  effects.
- **Settings** has separate volume sliders and mute toggles for music and sound.
- Sounds download as they are needed, so the game loads faster. The first time you hear a
  rare sound, it may play silently while it downloads.

## Animations

- **Bosses:** wind-ups show how long you have, big hits land with weight, a stopped cast
  looks stopped, and lasting states (frenzy, plates, Ice Armor, marks on you) stay
  visible while they last. Camera shake can be turned off in **Settings → Screen shake**.
- **Monsters:** ordinary monsters have new attack animations.
- **Your attacks grow with your character.** They gain glow and weight as you pick your
  frame, range and specialization. Every Tier 3 specialization, including all nine
  Conduit specializations, has its own attack animation.
- Large monsters are drawn at a size that matches them.

## Conduit

- **Area hits are shared across the formation.** One slam no longer wipes every summon.
- Summons rebuild four times faster out of combat.
- **Step Back** now moves your summons out of telegraphs too.
- **Recall (R):** your summons sprint back to you, hold there for 2 seconds and strike
  anything that follows them in. A "Recall" callout shows over your character.
- **Recall Summons** rune (1 RP, Conduit only): recall automatically on Low HP, while
  Traveling, or when an enemy is charging an attack.
- New auto-combat condition: **Formation Broken** (half or fewer of your summons
  standing). Pair it with Flee to back off and rebuild.
- Summons keep up with your movement speed boosts.
- Pressing an ability by hand now works: it uses your formation's target.
- Monsters fighting your summons now use their full kit, including slams and shields.
- **Effigy** (heavy Tier 4) formations deal 17% more damage.

## Weapons

- The Chaotic Axe and Ruinous Axe lose about 5%. Every other T1 weapon is stronger, and at
  +5 they all land within a few percent of the axe in real fights.
- The Iron Broadsword and Knight's Steelsword are now **Technique weapons**. They carry
  Technique Power alongside cooldown reduction, so Power Strike and Sweep hit harder and
  come back sooner.
- T2–T4 weapons are evened out. Every weapon at +0 now clearly beats the weapon it evolves
  from at +5, and no weapon towers over its tier. The biggest changes:
  - The Tundra maul and Rimebrand (T3) were far too strong and come down.
  - The Warmaul (T4) was far too weak and comes up.
  - The Gale Needle, Venom Knife and Steelsword get proper T2 upgrade curves.
  - The Glacial Rimebrand (T4) converts 60% of its damage over time (was 70%).
- **Thorn Needle is removed.** It duplicated the Jungle Stinger Rapier. If you own one, it
  becomes a Gale Needle at the same upgrade level (or better).
- **New: the Desert technique staff.** The Knight's Steelsword now evolves into the
  **Pilgrim's Quarterstaff** (T3), which evolves into the **Sunmonk's Warstaff** (T4).
  Both raise Technique Power and cut Technique cooldowns. The Warstaff adds **Kata**:
  every strike Technique you fire adds a stack, and at three stacks your next one spends
  them for +80% Technique Power.

## Damage over time

- Power Strike, Slam and Sweep's splash now feed your weapon's damage over time, just like
  your normal attacks do.
- **Detonate** has a faster 1.2-second cast. It deals 3.6× the weapon damage over time it
  consumes (4× at rank II), and 2× for class damage over time (Apprentice stacks,
  Conflagration, Permafrost).
- Damage over time and on-hit procs now go through half of the target's damage reduction,
  both for you and for monsters.

## Evasion

- Only a full dodge now blocks a monster's poison, plating shred and other on-hit effects. A
  partial dodge (a graze) still softens the hit, but the effect lands.

## Armor: every late vest has its own job

- **Desert (Dawn)** is the short-fight armor. Dawn's damage reduction no longer climbs by
  tier. It lasts longer instead: 6 seconds at T2, 8 at T3, 10 at T4. It rearms after 4
  quiet seconds (was 6). Plating grows much less with upgrades.
- **Jungle** weaves drop their plating and resist poison and other damage over time.
- **Tundra** stance now builds only while you're actually being attacked. It fades 2
  seconds after the attacks stop, builds over 4 seconds (was 3) and peaks lower (12% at
  T3, 16% at T4).
- **Volcanic** armor trades hardening for **reactive plating**. Every hit you take adds 1
  plating, up to 10 (T3) or 16 (T4), and heavy hits no longer crack it.
- **Graveyard** armor is back to its Swamp roots: stronger damage-over-time resistance and
  damage spreading.
- **Deep Sea Carapace (Trench)** is the elite-fighting armor: high damage reduction, more
  HP, and debuff resistance that weakens slows, plating shred, anti-heal and marks.
- **Mountain** plate gets a little more damage reduction at T3 and T4.

## Charms work with your Guards

Every charm now gains Recovery as you upgrade it, at every tier. From T2, most charms also
react when you use their biome's Guard. Techniques never trigger charm effects.

- **Mountain:** Brace, Endure and Bramble Guard restore part of your barrier (15% at T2,
  20% at T3, 30% at T4).
- **Swamp and Graveyard:** Cleanse and Break Free start your Recovery pulse at once.
- **Cave:** absorb is stronger while Brace, Endure or Bramble Guard is up.
- **Jungle:** any Guard pushes your ramping Recovery forward by 3–4 seconds.
- **Tundra:** the Glacial charms' barrier keeps recharging while you hold position, even
  while being hit, and Break Free restores it (half at T3, fully at T4). Deepfreeze Ward is
  now a pure ramping absorb.
- **Pressure Vessel (Trench)** is the Recovery-skill charm: Second Wind and Recuperate heal
  more and come back sooner.
- **Inferno Heart (Volcanic T4)** is now a real step up from Magmaheart Stone.
- **Overgrowth Pulse** turns less overflow healing into its ward, and the ward is capped at
  5% of max HP.

## Tier 4 specializations

- **Blunderbuss bug fixed.** Each pellet fed your weapon's damage over time at full damage,
  so a Rimebrand Blunderbuss was several times stronger than intended. Pellets now deal
  22% damage each, and the volley knocks enemies back a little less.
- **Heavy frames** hit a little less hard with their big finisher, execution or discharge
  (−1× for Striker and Squire, −2× for Spirit's Voidwalker and Invoker). They keep their
  extra health and armor.
- **Light Squire, Spirit and Apprentice specializations** gain +20% attack speed.
- **Every Spirit specialization** gains +15% attack.
- A Technique landing on an empowered hit no longer multiplies it twice (Charge on
  Empowered Ready was the worst case).
- Many specializations were tuned toward the middle of the pack; descriptions show the new
  numbers. Trimmed: Berserker, Destroyer, Stalwart, Tempest, Duelist, Warmonger, Bounty
  Hunter, Wind Spirit, Avenger, Icebreaker. Raised: Surge, Dynamo, Shockblade,
  Venomslinger, Zealot, Pyromancer, Firebrand.

## Mastery pacing

- **Tier 2** mastery is slower in most biomes, landing near 15 minutes. Cave, Swamp,
  Plains, Mountain, Forest and Jungle give less mastery XP per kill (×0.35–0.75). Desert is
  unchanged.
- **Tier 3** biomes are evened out to about 30 minutes. Swamp, Cave, Mountain and Volcanic
  give less mastery XP (×0.6–0.9); Tundra, Desert and Jungle give more (×1.2–1.4).
- **Tier 4** Mountain, Jungle, Graveyard and Trench give more mastery XP per kill
  (×2.6–3.4), so they keep pace with Tundra and Desert.
- Essence and catalyst drops are unchanged.

## Volcano (Tier 3) is much less deadly

- Smaller packs: a Magma Tortoise brings 2 Ember Scuttlers plus one more body (was 3 plus
  1–2), and a Cinder Hound brings 1 plus one more (was 2 plus 1–2).
- Ember Scuttler: 500 HP (was 650), 30 attack (was 45). Cinder Hound 55 attack (was 80),
  Magma Tortoise 90 (was 116), Ash Salamander 50 (was 70).
- Tier 3 Heat now caps at 15 stacks and adds 2% damage taken per stack (was 3.5%, no cap).
  Tier 4 Heat is unchanged.

## Fixes and quality of life

- Auto-combat no longer gets stuck on the Tier 4 Mountain ledges.
- Rune rules with a condition (such as Empowered Ready → Charge) now fire Charge even when
  you are already next to the target.
- Inventory and crafting filters are remembered, and each panel has a **Clear filters**
  button.
- Status and Rune icons have dark backdrops so they read clearly.
- Tile seams and stray border lines in the Trench and Wasteland are fixed.
