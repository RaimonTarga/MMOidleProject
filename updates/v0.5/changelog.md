# v0.5 — A rebuilt game

2026-09-24 · New playtest

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
