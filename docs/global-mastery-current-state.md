# Biome Mastery and Global Mastery — Current State

**Audited:** 2026-09-27
**Implementation:** shared/src/config/gameConfig.ts,
shared/src/runeDatabase.ts, shared/src/systems/itemUpgrades.ts,
shared/src/protocol/views.ts, and the progression reward/upgrade callers.

This replaces the former Step 3/4 planning snapshot, which still described a
four-level segment and a not-yet-built Global Mastery system. The historical
plan remains at [docs/archive/global-mastery-plan.md](archive/global-mastery-plan.md).

## Biome mastery

Normal biome content uses six local levels per tier segment:

- BIOME_LEVELS_PER_TIER is 6.
- The local XP shares are 12, 14, 16, 18, 19, and 21 percent of that
  segment's authored budget.
- Segment budgets are currently 1,750 XP for T1, 3,750 for T2, 42,000 for T3,
  and 600,000 for T4. Future tiers use the configured growth fallback; these
  are pacing inputs, not a permanent balance guarantee.
- Clearing is T0 tutorial content with its separate four-level threshold table
  [0, 43, 172, 430, 860]. It does not use the normal six-level curve.

Biome start and final tiers are derived from NODE_BIOMES. Current authored
start/final ranges are:

| Biome group | Start | Final |
| --- | ---: | ---: |
| Plains | 1 | 2 |
| Forest | 1 | 2 |
| Mountain | 1 | 4 |
| Swamp | 1 | 3 |
| Cave | 1 | 3 |
| Jungle | 2 | 4 |
| Desert | 2 | 4 |
| Tundra | 3 | 4 |
| Volcanic | 3 | 4 |
| Graveyard | 4 | 4 |
| Trench | 4 | 4 |

The exact cap is biomeLevelCap(playerTier, biomeGroup): six levels per authored
tier between the start and final tier. A retired biome stops gaining headroom
when its authored content ends; this is a gain stop, not a retroactive clamp on
legacy saves. Use the function rather than inventing a fixed cap table.

Recipe and upgrade gates compare against the persisted biome-local level.
Recipes with explicit requiredBiomeLevel values own their exact gate; the
generic item-upgrade fallback derives its gate from the six-level segment
constant. isBiomeFullyDoneAtTier only requires content reachable at the
player's current tier, so a biome does not become an endless grind merely
because the curve has room for later tiers.

## Global Mastery

globalMastery(biomeLevel) is derived on demand as the sum of non-negative
levels for real biome groups. It excludes Clearing and sanctuary and is not a
separately persisted wallet or slice field. The same derivation is used for
player views, character summaries, admin views, and server-side economy checks.

The maximum reachable aggregate at each player tier is currently:

| Player tier | Maximum Global Mastery |
| ---: | ---: |
| T0 | 0 |
| T1 | 30 |
| T2 | 72 |
| T3 | 114 |
| T4 | 156 |
| T5+ | 156 until new authored biome content exists |

These maxima are sums of biomeLevelCap for the content actually authored at
that tier. They are not a promise that a character has reached the value.

## Systems driven by Global Mastery

### Rune capacity

The rune budget is:

- base capacity: 16 points;
- one additional point per five Global Mastery;
- non-negative, finite Global Mastery is clamped before calculation.

The authority is runeBudgetForGlobalMastery in shared/src/runeDatabase.ts.
Old tier-based or crafted rune-point formulas are not current.

### Item upgrade ceiling

MAX_UPGRADE is 5 for ordinary fallback items. An item's explicit upgrades array
may set a different structural length. Cores and Relics are intentionally off
the ordinary +N track and return a maximum of 0 from getMaxUpgrade.

globalMasteryRequiredForUpgrade spreads +1 through +5 across the current tier's
Global Mastery band:

| Item tier | +1 | +2 | +3 | +4 | +5 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| T1 | 6 | 12 | 18 | 24 | 30 |
| T2 | 38 | 47 | 55 | 64 | 72 |
| T3 | 80 | 89 | 97 | 106 | 114 |
| T4 | 122 | 131 | 139 | 148 | 156 |

The server's checkUpgrade applies the Global Mastery ceiling in addition to
the item's structural cap and its biome-level/economy requirements. The client
uses the same shared calculator for display and affordability; it is not an
authority.

## Network and persistence contract

biomeXP and biomeLevel remain persisted inside TracksProgression. Global Mastery
is derived and exposed in PlayerView, character summaries, and admin summaries.
Adding or changing a derived display must not add a second persisted source of
truth.

The relevant focused coverage includes:

- shared/src/systems/itemUpgrades.test.ts for upgrade bands and ceilings;
- server-side biome progression/economy tests for caps and recipe reachability;
- shared/src/protocol/characters.test.ts for derived character summaries; and
- server/test/clearingMastery.test.ts for the tutorial curve.

When changing tier content, update the world authoring and let the derived
start/final maps and cap tests expose the resulting economy. Do not edit this
page to preserve an old numerical table.
