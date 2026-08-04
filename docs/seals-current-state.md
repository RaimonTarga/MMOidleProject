# Tier Seals — Current State

Implemented: mechanism 2026-08-02; presentation 2026-08-04.

## Player rule

Tier 0 advances through the tutorial kill quest because no Tier 0 bosses exist.
From Tier 1 onward, a player advances by collecting seals from distinct biome
bosses at their current tier. A seal is the boss's first-clear record; repeat
kills and lower-tier clears do not count.

Current requirements are:

| Advance from | Seals required |
|---|---:|
| T1 | 2 |
| T2 | 3 |
| T3 | 4 |
| T4 | 5 |

The requirement plateaus at five. T5/T6 rows must be added in the same changes
that author those tiers' bosses; an absent row is a content ceiling and cannot
auto-advance.

## Authority and persistence

There is no stored seal wallet. `TracksProgression.bossesCleared` already
persists one `biomeGroup:tier` key per boss first-clear, and shared helpers derive
held seals, required seals, advancement readiness, and remaining sources from
that list. This keeps persistence, server authority, and client presentation on
one source of truth.

`checkSealTierAdvance` runs after a boss first-clear is recorded. Meeting the
requirement increments `playerTier`, grants one skill point, dirties progression
state, and emits the existing tier-up logging/analytics flow. Higher-tier quest
counters remain for target priority and UI unlock policy, but they have no tier-
advancement authority.

Primary seams:

- shared rules and validation: `shared/src/systems/tierAdvancement.ts`
- tier mutation: `server/src/systems/player/progression/questSystem.ts`
- first-clear and advancement ordering:
  `server/src/systems/player/progression/rewards.ts`
- wiring test: `server/test/tierSeals.test.ts`

## Presentation

At seal-gated tiers, the Progression panel shows:

- a collapsed-by-default summary with a prominent tier crest, required and held
  seals, and the full Mastery meter anchored below it in either view;
- a click-to-toggle detailed view with every biome boss source at the current
  tier, marked obtained or available;
- a separate Boss Seal Ledger showing every configured tier, its passage
  requirement, all obtained seals, and still-available optional trophies.

The same interaction works on desktop and mobile. Provisional small seal pips
and the dungeon-locate actions were removed on 2026-08-04: the numeric state is
clearer without a placeholder glyph, and map navigation needs a better
affordance before it returns. Tier 0 continues to show its tutorial quest, and a
tier with neither a quest nor a seal requirement is presented as the current
content ceiling.

Primary presentation seams:

- panel and source composition: `client/src/ui/QuestPanel.tsx`
- all-tier ledger: `client/src/ui/SealLedgerPanel.tsx`
- shared presentation projection: `client/src/ui/sealPresentation.ts`
- layout: `client/src/hud/hud.css`, `client/src/ui/sealLedger.css`
- static layout checks: `tools/uishot/harness/progression.html`,
  `tools/uishot/harness/seals.html`

## Remaining work

- Add T5 and T6 requirement rows and source bosses with their content.
- Revisit the placeholder requirement numbers during the balance pass.
