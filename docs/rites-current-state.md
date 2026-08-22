# Rites — current state

- **Code audit:** 2026-08-09
- **Authoring contract:** `docs/rites-authoring-guide.md`
- **Archived design handoff:** `docs/archive/rites-rework-design-handoff.md`
- **Historical implementation plan:** `docs/archive/rites-plan.md`

Rites are passive combat-boundary rules. There are no Rite slots, ranks, or capacity stat: any learned combination may be equipped if the character's one shared Runic Point budget remains legal.

## Shared RP authority

Each `RiteDef` has `runeCost`. `runicPointLoadoutCost` is the shared pure authority:

```text
Rune condition/action costs
+ every switch rule's destination stance cost
+ every equipped Rite cost
```

Rune and Rite setters reject the full proposal when it is invalid or over budget and acknowledge through `build:loadoutResult`. Hydration preserves legal Rune rules first, then admits persisted Rites in stored order while total RP fits.

## Combat phases

`server/src/systems/combat/ai/engagement.ts` owns the server-authoritative phase model:

```text
ACTIVE → POST_COMBAT → OUT_OF_COMBAT
```

ACTIVE is determined from a live target or authoritative monster aggro. POST_COMBAT begins after the final hostile interaction and lasts for the shared exit delay. When the delay expires, `updateCombatTransitions` applies combat-end Rites once and removes the engagement component; re-engagement naturally cancels the transition.

Lingering Battle adds 50% to the base exit delay. Swift Repose removes 50%. Equipping both returns the delay to baseline. Base OOC HP regeneration now runs through the defense healing funnel and uses this same boundary, including anti-heal, recovery multipliers, overheal shields, dirty state, and logs.

## Catalog

| Rite | RP | First-pass behavior |
|---|---:|---|
| Lingering Battle | 2 | Combat state lasts 50% longer |
| Swift Repose | 2 | Combat state ends 50% sooner |
| Purification | 3 | On combat end, removes all qualifying carried harmful stacked and instanced effects |
| Mechanic Renewal | 5 | On combat end, advances class-specific next-fight readiness by roughly 30% |
| Ability Reprieve | 5 | On combat end, reduces every equipped ability's remaining cooldown by 30% |
| Blood Offering | 3 | On credited kill, heals 5% maximum HP through `applyHealToPlayer` |

Purification preserves harmful statuses still owned by an active `node-feature:` or `ground-zone:` source; those sources remove or refresh their own effect. It removes carried anti-heal, slow, control/debuff, and player DoT instances through the shared harmful-effect classifier.

Mechanic Renewal mappings:

- Cooldown: reduce remaining execution cooldown by 30%.
- Energy: restore 30% maximum energy.
- Reload: restore 30% maximum ammunition and advance a current reload by 30%.
- Cadence: advance count by 30% of threshold, capped below ready.
- Summoner: advance an active reconstruction by 30% of its duration.
- DoT: deliberately no effect in v1 because its meaningful preparation state is enemy-owned.

Blood Offering uses the existing player-credit `onKill` pipeline, so direct attacks, abilities, player DoTs, summons, and supported player-owned indirect damage share attribution.

## Persistence and migration

Rites remain `knownRites: string[]` and `equippedRites: string[]` in progression JSON. Hydration filters/deduplicates IDs and maps legacy content:

| Legacy | Current |
|---|---|
| Quickened Breath | Swift Repose |
| Cleansing Breath | Purification |
| Lingering Momentum | Lingering Battle |
| Hunter's Instinct | Blood Offering |

No SQL migration is required. `PlayerView.riteSlots` remains temporarily as a compatibility field for older clients, but it does not constrain server behavior.

## Player interface

- Loadout → Rites is a ritual-circle card grid; cards bind/unbind directly and become dormant when shared RP is insufficient.
- The panel states there are no slots and displays total shared RP.
- Rune and overview meters include Rite and stance-destination costs.
- Crafting contains all six Rite recipes in the T3 mastery band.

## Progression

One Rite per biome, each charging that biome's native catalyst family and homed where its
effect answers that biome's pressure:

| Rite | Biome (level) | Why there |
|---|---|---|
| Swift Repose | cave (15) | Sparse elite fights leave long gaps worth recovering in |
| Purification | swamp (15) | The poison biome is where carryover is the problem |
| Lingering Battle | mountain (15) | Ponderous by identity; a rite about staying engaged |
| Blood Offering | volcanic (5) | Kill-credit recovery wants the biome that supplies the chain |
| Mechanic Renewal | tundra (5) | Unchanged |
| Ability Reprieve | desert (11) | Unchanged |

Fixed 2026-08-22. Four of the six previously sat in Forest, which has no nodes past T2, so
reaching forest 13-14 as a T3 character meant 300-600 extra kills of outgrown content.
Separately, three charged retired catalyst families (blight / predation / volatility) and
one charged Alacrity in a Tundra that bans it — those four could not be crafted at all
outside the test room. Essence amounts are unchanged; each moved recipe's primary essence
follows its new home. `shared/src/data/recipeGates.test.ts` enforces all of this.

New Rites currently reuse the closest existing Rite glyphs until dedicated concept art is authored.

## Coverage

`server/test/rites.test.ts` covers opposed boundary timing, full harmful cleanup with source-owned hazard preservation, Energy renewal, ability cooldown reduction, exact-once combat-end dispatch, shared-RP competition, and stale-ID filtering. Existing combat kill-hook coverage exercises the common player-credit pipeline used by Blood Offering.

Known balance follow-ups: tune percentages/RP/gates; provide explicit combat-end and heal feedback; decide a future DoT-class interpretation if a portable player-side state is introduced.
