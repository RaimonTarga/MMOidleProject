# v0.5 — A rebuilt game

2026-09-24 · New playtest · Updated 2026-09-25

## Playtest patch 2 — defenses, pacing and abilities

Thanks for all the feedback from the first days of the playtest. This patch rebalances
defenses, slows down late-tier mastery, cools off Volcano, reins in a few Tier 4
outliers, and changes how abilities are triggered.

> **Returning characters:** abilities no longer fire on their own. Open **Abilities** and
> press **Use default timing** on each ability to restore automatic casting, or wire it
> into your own Rune rules. Mastery progress is also not converted to the new XP curve;
> start a fresh character for accurate pacing.

### Abilities and Runes

- Abilities no longer have a built-in trigger. They fire automatically only through a
  **Use Ability** Rune rule. Without one, they are manual-only.
- To compensate, every ability costs less RP. An ability plus its default rule costs what
  the ability alone used to.
- **Use default timing** in the Abilities panel equips a sensible rule for you. The panel
  also lists which Runes fire each ability.
- New starter Rune conditions: **When Controlled** (stunned, frozen, locked down or rooted)
  and **Enemy in Contact** (a melee enemy within reach). Disengage no longer has a hidden
  distance requirement.
- **Break Free** now removes roots as well as your worst hard control, in a single use.
  Breaking a lair drag's root ends the drag.

### Defenses

Plating (flat reduction per hit) is now a specialist stat. General damage reduction (DR)
is the common defense layer.

- **Armor families:**
  - **Plains, Mountain, Tundra and Volcano** keep plating as their specialty, at reduced
    amounts, plus some DR.
  - **Jungle and Desert** keep a smaller amount of plating.
  - **Forest, Cave, Swamp, Graveyard and Trench** trade plating for DR and extra health.
- **Cave** is the dependable DR armor: 10% / 18% / 26% at T1 / T2 / T3, plus 0.8% per
  upgrade.
- **Jungle** evasion is stronger from T2 on: each evade softens the hit more.
- **Desert** trades its last-stand effects (cheat death, automatic cleanse, debuff
  resistance) for six seconds of opening protection. The protection triggers on the first
  attack you make or take, and rearms after six quiet seconds.
- **Tundra**'s stationary protection builds only while you stand still in combat. It builds
  over 3 seconds, drops within a second of moving, and stacks with your other damage
  reduction.
- **Volcano** hardening builds more slowly and needs enemies attacking you. A single big
  hit (25% of max HP or more) cracks half of it, even through shields.
- **Lava-Tempered** overheal wards are capped at 15% of max HP.
- **Plaguebound Mantle** gains temporary plating each time you're hit (up to 10).
- **Cores:**
  - Force, Scout and Sniper no longer cost health or plating. Scout is now +18% damage,
    and Sniper +30%.
  - Juggernaut is now +20% HP, +10% plating and 10% less damage taken (was +30% / +40% /
    14%).
- **Classes:**
  - Squire and Striker trade most of their root plating for damage reduction (28% and 18%).
  - Apprentice converts 15% of direct hits into delayed damage (was 10%).
  - Slinger's evade mitigation is +10 points (was +20).
- **Stances:** Defensive and Tanking Stance no longer add plating. Their damage-taken
  reduction is unchanged.
- **How damage is calculated:**
  - Guards (Brace, Endure and others) now reduce a hit before your wards and barrier absorb
    it, so shields last longer. Guards no longer reduce damage-over-time ticks.
  - Class and item damage reduction now multiply instead of adding. With 20% from your class
    and 10% from gear, you take 0.8 × 0.9 = 72% of the damage, not 70%.
  - General damage reduction now counts in full against monster damage-over-time (it used to
    count half).
  - Charged and empowered monster attacks subtract your plating once, from the full hit.
    Before, plating was also multiplied by the charge, so big telegraphed hits now land
    harder on high-plating builds.
  - Delayed damage (Swamp, Graveyard, Apprentice) is paid in four even one-second
    installments. Its resistance is fixed when the damage is taken.
  - Monster splash damage is defended like a normal hit: it can be evaded, and wards,
    barrier and delayed damage apply. Environmental hazards also drain wards and barrier.
  - Conduit summons take their share of your damage after your shields and before delayed
    damage. Splash that hits you is not redirected to summons.

### Volcano

- Heat now increases the damage you take by 3.5% per stack (was 4.5%). The bonus to the
  damage you deal is unchanged.
- **Ash Salamander** hits for less (84 → 70).
- **Ember Skink** hits for less (75 → 60), and its Burn is weaker (13 → 8).
- **Ashspitter Salamander** hits for less (110 → 95), and its Burn is weaker (16 → 12).

### Mastery pacing

- Biome mastery now takes longer at higher tiers, so each tier lasts long enough to matter.
  The aim is roughly 5 minutes per biome at T1, 15 at T2, 30 at T3, and 60 at T4.
- T2 mastery is faster: 3,750 XP per tier (was 5,000).
- T3 and T4 mastery need much more XP: 42,000 and 600,000 per tier (was 7,000 and 9,000).
- T4 Tundra and Desert give more mastery XP per kill (×1.8 and ×2.4), so they keep pace
  with the other T4 biomes.
- Essence and catalyst drops are unchanged.

### Tier 4 classes

- **Voidwalker:** the stored-energy discharge is now reduced by enemy armor and damage
  reduction, like any other hit (it used to ignore them). The early execute uses the same
  damage to decide when to trigger.
- **Berserker:** each Rampage stack speeds up attacks by 30 ms (was 60 ms).
- **Juggernaut:** Crescendo still climbs for as long as the fight lasts, but past +100%
  finisher damage it grows much more slowly.

### Auto-combat fixes

- Fixed auto-combat getting stuck circling the edge of a lava pool while trying to reach an
  enemy standing in it. It now skips enemies sheltering in a hazard, and moves on.
- **Recover First** no longer waits inside damaging terrain, where recovery never starts. It
  steps out first.

### Interface

- Ability tiles show one clear state at a time: casting, armed, active, cooling, or ready.
  Armed Techniques pulse gold until their hit lands. A short glint plays when an ability is
  ready again.
- Buffs and debuffs animate in and out. Dangerous stacks (Heat, Chill, Rot, Frost, Sundered,
  Corroded) surge as they build. A cleanse shatters the removed effect instead of just
  fading it. Marked, Stunned and Frozen are sorted first and highlighted.
- Status tooltips stay open while you read them. An effect that ends while its tooltip is
  open stays in place, marked **Ended** or **Cleansed**.

## Playtest patch — movement and multiplayer visuals

- Other players move smoothly between network updates, with corrected positions when entering a node or returning to the game.
- Restored other players' melee attack lunges and ability-specific attack effects.
- On mobile, the changelog is now under **Settings → Updates**, instead of floating over the game. The desktop panel remains available, and the notes fit the screen at larger UI scales.

## Playtest fixes

- Essence rewards now burst from defeated enemies and gather into your character, with color and size reflecting the reward. Party rewards show your own share.
- Fixed stale player positions when party members cross between areas, drift in other players' movement, and jumps when returning to the game tab.
- Fixed lingering movement on graves and respawned characters. Full resyncs now restore confirmed player positions, including within the same area.
- Fixed attack cooldown bars stretching backwards or appearing stuck when the player's computer clock differs from the server clock.
- Added a What's new panel at the bottom right so the changelog can be reopened at any time.
- Fixed phone scrolling in crafting, upgrading, mastery, Rune editing, and skill menus so details and action buttons remain reachable.
- Improved mobile layouts, tab swiping, and text wrapping across menus, including small screens, landscape orientation, and larger UI scales.
- Kept dialogs and account screens within the visible phone viewport, with room for device safe areas.

## The overview

This playtest brings a broad rebuild of progression, character builds, equipment,
the world, and encounters. Returning players will find familiar class foundations,
but many of the decisions around them have changed.

- **Conduit is available.** The summoner joins the production roster with rebuilt formations and specialization paths.
- **Build around a shared Runic Point budget.** Abilities, stances, Rune rules,
  and Rites now compete for the same capacity.
- **Progress through mastery and boss seals.** Explore different biomes to grow
  your mastery, unlock recipes, and earn the seals needed for the next tier.
- **Develop your equipment.** Gear evolution, reconstruction, Cores, and Relics
  give builds more room to specialize.
- **Learn each biome's combat.** Monster groups, hazards, casts, and dungeon
  bosses now express more distinct encounter identities.
- **Explore a rebuilt world and interface.** The map, environment art, character
  presentation, crafting screens, and combat information have received major passes.

## Progression and resources

- Biome mastery unlocks equipment and combat tools. Biomes have six mastery
  levels per authored tier segment, and stop gaining additional headroom when
  their authored tier range ends.
- Global Mastery combines your biome levels, excluding the Clearing. It governs
  Runic Point capacity and equipment upgrade access.
- After the tutorial, tier advancement uses seals earned from distinct biome
  bosses at your current tier. Repeating a boss does not produce another seal.
- The current seal requirements are two to leave Tier 1, three to leave Tier 2,
  four to leave Tier 3, and five to leave Tier 4. This is not an announcement of
  a completed Tier 5+ content roster.
- The progression display includes mastery and a ledger of obtained and
  available boss seals.
- Aspect essence and catalysts support crafting and build unlocks. Catalysts
  are associated with combat families, giving different farming locations
  different material roles.
- Progression costs, rewards, and encounter values have had extensive changes.
  Economy testing continues during this playtest. Costs, rewards, and pacing
  are provisional and may change in follow-up updates.

## Abilities, Runes, stances, and Rites

- Techniques and Guards provide offensive and defensive tools alongside your
  class mechanic. Their authored ranks change as you advance through tiers.
- The ability roster includes direct attacks, area attacks, control, affliction
  tools, and defensive responses, including Sweep, Slam, Contagion, Detonate,
  Cleanse, and Break Free.
- Learning an ability is permanent; attuning it reserves the capacity needed
  to use it. Abilities and stances share their RP budget with Rune logic and Rites.
- Capacity is driven by Global Mastery. Ability and stance selection is governed
  by that budget instead of a fixed number of slots per tier.
- Abilities have default automatic behavior. Rune rules can override when a
  specific ability fires, with rule priority controlling competing choices.
- Stances offer distinct combat trade-offs. Choose a default posture and use
  Rune conditions to switch between attuned stances.
- Rites add effects around entering, leaving, or recovering from combat.
- Common class maintenance behavior is now baseline. Specialized automation
  includes tools such as Wait It Out and Rebuild Formation.
- The build interface shows how much RP is reserved by abilities, stances,
  logic, and Rites, with clearer descriptions of costs and effects.

## Conduit

- Conduit is selectable in production without special server or client settings.
- Summon formations and specialization paths have been rebuilt, with distinct
  familiars and player-character appearances.
- Summon targeting, formation recovery, ability routing, and inheritance of
  owner targeting rules have received substantial revisions and fixes.

## Equipment and defenses

- Gear recipes include evolution paths. Eligible predecessor items can become
  the next item in a lineage; supported recipes also allow direct reconstruction
  at a different cost.
- Equipment upgrades extend through +5, subject to the item's authored track
  and Global Mastery requirements.
- Crafting and evolution previews explain the resulting item and its effects
  more clearly, including damage estimates and equipped-item comparisons.
- Charms support recovery and defensive abilities.
- Cores add a specialization slot with stat trade-offs and build-specific effects.
- Tier 4 Relics add a sixth equipment slot. Their ratings modify your class
  mechanic rather than supplying an ordinary set of stats or a +N upgrade track.
- Recovery provides a shared basis for healing effects.
- Barrier and Ward replace the old periodic-shield model: Barrier can recharge
  after avoiding damage, while Wards are temporary protection spent first.
- Class stat affinities, weapon effects, defensive interactions, and item
  outliers have received substantial revisions and fixes.

## World and encounters

- The world uses a new region-based map with authored connections, replacing
  the previous uniform grid layout. Nodes are larger and have more varied terrain.
- The map is available as a baseline interface feature.
- Biomes have distinct monster behavior: packs, patrols, supporting enemies,
  paired threats, hazardous terrain, and visible attack wind-ups.
- Dungeon encounters center on guarded altars and biome-specific boss mechanics.
- Bosses across Tiers 1–4 have been reworked around their biome's identity,
  with more visible casts, impact areas, and opportunities to respond.
- Forest emphasizes packs and attack cadence; Plains emphasizes swarms;
  Mountain emphasizes telegraphed impacts; Swamp emphasizes rot; and Caverns
  emphasizes defensive erosion.
- Jungle emphasizes pursuit and ambush pressure; Desert emphasizes setup and
  punishment; Volcanic areas build Heat; Tundra combines Chill and ice defenses;
  Wasteland uses resurrection; and Trench emphasizes dangerous sustained duels.
- Volcanic Heat buildup, cooling, and feedback have been revised. Heat and Chill
  gains have clearer visual feedback.
- Enemy barriers are visible on the target health display. Area abilities and
  dangerous attacks have received additional footprint and effect feedback.
- Encounter durability and pressure have received multiple tuning passes.
  These remain playtest values, with broader balance and economy review ongoing.

## Interface, art, and sound

- A substantial HUD redesign brings clearer character information, build
  navigation, resource displays, and combat tooltips.
- Skill-tree nodes can be inspected before confirming a purchase. Class mechanics
  and current class emblems are easier to identify.
- Crafting and upgrade screens better communicate available recipes, equipped
  items, and evolution outcomes, with more stable dialog layouts.
- Ability cooldown feedback, status descriptions, and buff/debuff icons have
  received fixes and expanded coverage.
- The Rune editor keeps its rule controls accessible, and the ability bar can
  wrap into rows on desktop.
- Biome backgrounds, environmental props, monsters, player bodies, item icons,
  and class emblems have received extensive new art and presentation work.
- A new audio system is present. Playtest audio starts muted, and placeholder
  sounds are identified as such.

## Accounts and returning players

- Discord account and character selection flows have been expanded.
- Guest play and Discord account linking are implemented.
- The landing experience includes live spectating.
- **Previous playtest saves are not guaranteed to carry over.** Old data may be
  reset; the world migration also clears exploration records and catalyst balances.
  This is a fresh playtest, and preserving the previous test economy is not a goal.

## Reliability fixes

- Improved movement around obstacles, attack approaches, hazards, and node borders.
- Fixed several cases where hazard escape, recovery behavior, or target changes
  could leave a character stalled.
- Improved summon target continuity and inheritance of owner targeting rules.
- Corrected several ability, stun, damage, and defensive-effect interactions.
- Improved combat animation feedback, including melee killing blows.
- Addressed UI clipping, wrapping, scroll behavior, stale cooldown presentation,
  and accumulated client event state.
