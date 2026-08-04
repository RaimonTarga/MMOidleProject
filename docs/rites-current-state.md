# Rites — implementation export and rework context

- **Code audit:** 2026-08-04
- **Purpose:** self-contained handoff for an external design review and rework.
- **Historical rationale:** `docs/archive/rites-plan.md`; broader sequencing is in `docs/system-rework-roadmap.md` §Step 11.

**Rule:** this document describes the current code first. Where historical plans disagree, the code is authoritative.

## Executive summary

Rites are a T3 loadout layer intended to shape the **between-fight rhythm**: recovery, cleansing, retained momentum, target-to-target movement, and eventually similar long-cadence behaviors. A character permanently learns rites through biome-mastery recipes and equips up to two. Every equipped rite is active; there is no selected rite, trigger rule, active runtime field, or rite-specific tick reconciler.

The machinery is complete across data, persistence, networking, server authority, client loadout UI, crafting, admin visibility, passive folding, OOC readers, and a wiring test. The catalog is thin: four Forest recipes fill two fixed slots, all values are placeholders, no rank/slot growth/signature content exists, and one of the four rites is actually an on-kill in-combat hook rather than a pure OOC effect.

The current playtest roadmap's acceptance criterion is simple: there must be enough differentiated rites that choosing two is a real build decision.

## Intended product role

The approved role is:

- Rites are T3 **between-fight / long-rhythm passive behaviors**.
- All equipped rites are always enabled; they do not fire through runes.
- Runes own automation and “when”; rites change the character's recovery/transition behavior without adding another rule channel.
- Slots are interchangeable, not named by role or priority.
- Biome Mastery recipes unlock rites. Global Mastery was expected to influence later slot/rank growth, but that curve is not designed.
- The name **Rites** is locked.

System boundaries:

| System | Owns |
|---|---|
| Charms / recovery gear | Equipped recovery stats, shields, cleanse, and Guard amplifiers |
| Mobility boots | Combat and travel movement behaviors, including on-kill haste |
| **Rites** | Persistent between-fight/long-cadence modifiers chosen from a small slot budget |
| Runes | Conditional behavior and automation |
| Stances | One current combat posture, optionally switched by rune |

The boundary is imperfect in current content: Cleansing Breath overlaps recovery/cleanse space, and Hunter's Instinct reuses the exact on-kill haste status effect owned by Forest mobility boots. A rework should decide whether this overlap is intentional composition or evidence that the rite needs a different axis.

## Current data and content

The catalog is `RITE_DATABASE` in `shared/src/rites.ts`.

```ts
interface RiteDef {
  id: string;
  name: string;
  blurb: string;
  mechanicEffects?: MechanicEffects;
  icon?: string;
}

type EquippedRites = string[];
```

Rites have no `statEffects` field. Their `rite.*` mechanic keys merge into `usesSkills.passives` during a full stat rebuild, after which runtime systems read the keys.

Current definitions and exact placeholder values:

| ID | Live effect | Recipe gate | Cost |
|---|---|---|---|
| `quickened-breath` | Reduces the base post-combat HP-regen delay by 50% | Forest level 13, tier 3 | 120 green essence + 4 Alacrity catalysts |
| `cleansing-breath` | While OOC, immediately and then every 1000 ms removes 1 stack from **each** qualifying harmful, non-instanced status-effect ID | Forest level 13, tier 3 | 120 green + 40 purple essence + 4 Blight catalysts |
| `lingering-momentum` | While OOC, slows positive-duration, non-instanced, non-harmful status-effect decay by 50% | Forest level 14, tier 3 | 130 green + 40 yellow essence + 5 Alacrity catalysts |
| `hunters-instinct` | On a player-credited kill, applies 30% movement haste for 2000 ms | Forest level 14, tier 3 | 130 green + 40 red essence + 5 Predation catalysts |

All magnitudes, costs, catalyst families, gates, and the concentration in Forest are placeholders. Definition `icon` strings exist, but the current Loadout/Crafting presentation has no approved rite art and displays text/initial fallbacks.

The passive key namespace in `shared/src/passives.ts` is:

```text
rite.ooc-regen-delay-reduction-pct
rite.ooc-cleanse-stacks
rite.ooc-cleanse-interval-ms
rite.ooc-buff-decay-slowdown-pct
rite.on-kill-haste-pct
rite.on-kill-haste-ms
```

`mergePassives` adds ordinary numeric keys when multiple sources provide them. Normal rite loadouts cannot duplicate an ID, but future content or other systems could contribute to the same key, so stacking semantics remain relevant.

## Slot model

`riteSlotCount(globalMastery)` is the shared authority used by the server and `PlayerView`. It currently ignores its argument and returns a flat two:

```ts
const RITE_SLOTS_BASE = 2;
function riteSlotCount(_globalMastery: number): number {
  return RITE_SLOTS_BASE;
}
```

The Global Mastery parameter is an extension seam, not a shipped progression curve. There are no locked slot placeholders, ranks, rite levels, slot types, ordering effects, active priorities, or per-rite cooldown fields in persisted state.

The equipped list is dense. Clearing slot 1 removes that element and shifts later rites left; there is no persistent empty middle slot.

## Acquisition and loadout authority

Recipes live in `shared/src/riteRecipes.ts`; crafting and slotting live in `server/src/systems/player/economy/riteCrafting.ts`.

Crafting a recipe:

1. Resolves the recipe ID.
2. Rejects an already learned rite.
3. Checks `recipeGroup` + `requiredBiomeLevel` and optional `requiredBossClear` outside the test room.
4. Checks and spends essence and catalysts.
5. Appends the rite ID to `knownRites` and dirties `tracksProgression`.

The test room fills the required wallets before spending. `requiredBossClear` is structurally supported but unused by current rite content.

`setRiteLoadout(world, player, riteIds)` is the authoritative full-list setter. It:

- filters IDs through `validRiteIds`;
- deduplicates while preserving first occurrence;
- rejects a valid-but-unlearned rite;
- truncates to `riteSlotCount(globalMastery(biomeLevel))`;
- writes `equippedRites`, dirties progression, and performs a full stat rebuild.

Unknown IDs are silently removed rather than causing the setter to fail. As with stances, the loadout socket event has no result/ack event; only crafting has a result event.

## Persisted and networked state

All state lives in the existing persisted/networked `TracksProgression` JSON slice:

```ts
knownRites: string[];
equippedRites: string[];
```

There is no runtime `activeRite` field because all equipped entries contribute. This required no SQL column migration and no new networked component.

Fresh characters start with empty lists. Hydration filters both lists through `validRiteIds`, so stale/removed IDs are pruned. It does **not** deduplicate or cap the stored equipped list to the current slot count. The stat fold iterates the full hydrated `equippedRites` array, while the client renders only `riteSlots` sockets. A malformed/legacy save can therefore receive more than two rite contributions until the loadout is set again. A rework that changes IDs, slots, or caps should add a canonical hydrate normalizer.

`PlayerView` exposes `knownRites`, `equippedRites`, and the derived `riteSlots`; the admin character record exposes the two stored lists.

## Runtime effect pipeline

On any equipment/loadout/class stat rebuild:

```text
for each equipped rite ID
  → resolve RiteDef
  → merge its mechanicEffects into usesSkills.passives
```

There is no generic rite executor. Each behavior has a specific reader:

```text
Quickened Breath    → combat.ts asks oocRegenDelay(player)
Cleansing Breath    → defense tick calls runRiteOoc(...)
Lingering Momentum  → defense tick calls runRiteOoc(...)
Hunter's Instinct   → combat pipeline onKill listener
```

The relevant world-tick order is:

```text
tick cooldowns and status-effect durations
  → AI / abilities / stance / movement / monsters
  → resolve combat and kills
  → run defensive systems, including runRiteOoc
  → sync visible buffs and authoritative deltas
```

This order is important for Lingering Momentum: ordinary status duration is reduced at the top of the tick, then the rite adds `slowdown × dt` back at the end. At 50%, the net decay is 50% of elapsed time.

## What “out of combat” means today

The four effects do not use one shared transition boundary.

### Quickened Breath

`oocRegenDelay(player)` clamps the reduction to `[0, 0.95]` and returns:

```text
GAME_CONFIG.COMBAT_REGEN_DELAY × (1 - reduction)
```

Only the base HP-regeneration gates in `server/src/systems/combat/engine/combat.ts` use this shortened value. The player must also have no active damaging node feature. This rite does not change the general `isPlayerInCombat` predicate used by mobility, rune behavior, defense resets, cleansing, or lingering.

### Cleansing Breath and Lingering Momentum

`runRiteOoc` calls `isPlayerInCombat(player, now)`, which remains true while the player has an attack-target component or is within the full global `COMBAT_REGEN_DELAY` after the last engagement. These rites therefore begin later than Quickened Breath can allow HP regeneration to begin.

This is current behavior, not a documented design choice. A rework should decide whether rites share one OOC phase, have intentionally different phases (fight ended / recovering / rested), or use explicit transition events.

### Hunter's Instinct

This effect triggers on `onKill`, so it begins at the end of a combat interaction rather than after any OOC delay. Its thematic purpose is to carry momentum to the next target, but mechanically it is an immediate combat-pipeline effect.

## Exact behavior of the four readers

### Quickened Breath

- A 0.5 passive halves the base regen delay.
- Reduction is clamped to a maximum of 95%; regen can never become immediate through this key.
- It affects both direct-attacking players and `CannotAttack` players such as summoners because `combat.ts` has a regen branch for each.
- It changes only the delay, not regen magnitude, anti-heal, active hazards, recovery runes, or the general combat-state predicate.

### Cleansing Breath

- `cleanseStacks` is rounded to an integer.
- The first OOC call fires immediately because cooldown `rite-cleanse` is initially absent.
- Each pulse collects every unique qualifying harmful ID and removes the configured stack count from each one.
- It handles only **non-instanced** effects. Harmful instanced DoTs are deliberately skipped by the current loop.
- It uses `isHarmfulPlayerStatusEffect`, the shared authority also used by the Cleanse ability.
- The shared classifier currently recognizes slow, frost ramp, Sun Mark, volcanic heat, anti-heal, swamp rot, registered monster DoT IDs, and effects marked `data.isDot` or `data.isNodeFeature`.
- Changing that classifier changes both the rite and other cleanse behavior.

### Lingering Momentum

- Slowdown is clamped to `[0, 0.95]`.
- It skips instanced effects, permanent/expired effects (`remainingMs <= 0`), and anything the shared harmful classifier recognizes.
- It extends every other positive-duration status effect; there is no explicit allowlist of “beneficial buffs.” Unknown timed effects default to non-harmful and will linger.
- If an effect stores positive `data.totalMs`, remaining duration is capped to that original total. Without `totalMs`, the rite still reduces net decay but has no original-duration cap.
- Component-owned class buffs/resources that are projected directly rather than stored in `TracksCombat.statusEffects` are untouched.

### Hunter's Instinct

- A player-credited kill applies the shared `FOREST_HASTE` (`mob-forest-haste`) status effect.
- The default current rite values are 30% speed for 2000 ms.
- Direct attacks and player-owned DoT kills flow through the player `onKill` pipeline and can trigger it.
- The effect uses the existing mobility buff descriptor, so it appears as Haste and contributes to the shared movement-speed multiplier without a new client buff type.

There is a concrete collision with Forest mobility boots: both systems apply the same non-instanced status-effect ID. `initRiteListeners` is registered before `initMobilityBoots`, and reapplying an existing status effect refreshes its duration but does not replace its `data`. When both effects trigger on the same kill, they do not stack cleanly; the data/magnitude from whichever source created the active effect remains while later applications mainly refresh it. This coupling should be resolved explicitly in a rework.

Hunter's Instinct also composes with Lingering Momentum because the haste is a non-harmful, non-instanced timed status effect.

## Full stat-rebuild coupling

Rite loadout changes call `recalculatePlayerEntityStats`, even though current rites only alter passive keys. Like stance switching, this is the game's full stat rebuild and also resets/reconciles cadence counters, several defensive ramps, archetype maxima, marker components, and other derived state.

Rites do not switch during normal combat, so this coupling is less frequent than the stance issue, but changing the loadout mid-fight can still reset unrelated combat progress. A redesigned live rite-swapping or activation system should not assume this rebuild is side-effect free.

## Client and operations surface

Current player flow:

- Crafting → Make includes rite recipes. Locked entries name the biome-level requirement and the detail pane describes the resulting effects.
- Loadout → Overview renders two Rite sockets.
- Loadout → Rites shows a dense list of available slots and learned candidates. A rite already equipped elsewhere is disabled.
- The section is progressively revealed at numeric `playerTier >= 3` or retained by known/equipped rite ownership.
- Desktop and mobile use the same authoritative view/visibility policy.

The admin Characters tab is read-only: it shows equipped rite IDs and known-count. Reset Progress clears learned/equipped rites. There is no rite-specific grant action.

Protocol surface:

```text
client → server: rite:craftRecipe(recipeId)
client → server: rite:setLoadout({ riteIds })
server → client: rite:craftResult({ recipeId, success, reason? })
PlayerView: knownRites, equippedRites, riteSlots
```

## Current coverage

`server/test/rites.test.ts` is a DB-free wiring test that verifies:

- equipped rite mechanic keys fold and an unequipped rite does not;
- Cleansing Breath removes stacks immediately and respects its own pulse cooldown;
- Lingering Momentum produces `(1 - slowdown) × dt` net decay for the shared Haste buff;
- Quickened Breath halves the effective regen delay at its current value;
- `validRiteIds` drops stale IDs, matching the hydrate filter.

Not currently covered by this test: Hunter's Instinct/onKill behavior, the Forest-boots collision, crafting/costs, actual DB hydration, slot cap/deduplication on hydrate, invalid loadout IDs, instanced harmful effects, the full harmful-effect matrix, unknown beneficial statuses, client presentation, or the full-rebuild side effects.

## Known gaps and review pressure

- **Only four choices for two slots.** There is little catalog breadth and no T4 continuation.
- **No biome identity.** Every recipe comes from Forest.
- **No slot progression.** `riteSlotCount(globalMastery)` is a flat-two stub.
- **No ranks or evolution.** Rank caps and Global Mastery growth were deferred.
- **No boss signatures.** `requiredBossClear` exists but no current rite uses it.
- **The OOC model is inconsistent.** Regen, cleansing/lingering, and on-kill momentum begin at three different moments.
- **System overlap is unresolved.** Cleanse overlaps recovery gear; haste directly collides with Forest boots.
- **The effect classifier is broad by default.** Lingering Momentum extends any unknown positive-duration non-instanced status unless it is added to the harmful classifier.
- **Instanced harmful effects are outside Cleansing Breath's reach.** Whether that is an intended balance rule is undocumented.
- **Hydrate does not enforce the slot budget.** Extra valid saved IDs all fold into passives.
- **No long-rhythm group behavior shipped.** Party regroup and target-acquisition ideas from the roadmap were not built; Hunter's Instinct approximates acquisition with movement speed.
- **Feedback is indirect.** Quickened Breath has no explicit state indicator; cleanse has no dedicated event; Hunter's effect appears as generic Haste.

## Decisions the external rework should return

A useful rework proposal should answer these questions explicitly:

1. What exactly is the player-facing niche of Rites beside charms/recovery gear, mobility boots, and runes?
2. Is “between-fight” one state or a sequence of phases such as fight-ended, recovering, regrouping, and rested?
3. Which phase should each existing/replacement rite affect, and what should interrupt it?
4. Are two slots fixed, unlocked over time, or supplemented by ranks? If mastery affects them, what is the curve and cap?
5. How many differentiated choices should exist by T3 and T4 so two slots create a meaningful sacrifice?
6. Should rites stay entirely passive, or may some react to explicit transition events while still avoiding rune ownership of timing?
7. Which effects may overlap or stack with recovery gear and mobility boots, and how are same-effect collisions resolved?
8. What is the cleanse rule for stacked versus instanced effects, hazards, anti-heal, crowd control, and future debuff types?
9. Should beneficial-effect retention use an allowlist/category instead of “anything not known harmful”?
10. How are current IDs/save data migrated, mapped into replacements, refunded, or intentionally removed?
11. What visible feedback tells a player that a rite changed the transition between fights?

## Implementation blast-radius checklist

Use this when converting an external design back into the repository:

- **Catalog/slots:** `shared/src/rites.ts`.
- **Passive keys and stacking:** `shared/src/passives.ts`, `shared/src/systems/stats.ts`.
- **Recipes/gates/costs:** `shared/src/riteRecipes.ts`.
- **State/defaults/migration/capping:** `shared/src/components/core/networkedSlices.ts`, `server/src/db/playerRepo.ts`, admin reset, test/bench fixtures.
- **OOC semantics:** `server/src/systems/combat/ai/engagement.ts`, inline defense/combat gates, `server/src/systems/player/rites/riteOoc.ts`.
- **Status classification:** `shared/src/systems/monsterDebuffs.ts`; changes affect the Cleanse ability too.
- **Kill/mobility interaction:** `server/src/systems/combatBootstrap.ts`, `server/src/systems/world/mobility/mobilityBoots.ts`, shared status-effect application semantics.
- **New combat behavior:** register listeners only through `server/src/systems/combatBootstrap.ts` so live server and benchmarks match.
- **Protocol/view:** `shared/src/protocol/socketEvents.ts`, `shared/src/protocol/views.ts`, `shared/src/protocol/admin.ts`; update shared contracts first.
- **Client:** atoms/sync, `client/src/ui/RitesPanel.tsx`, Loadout overview, Crafting Make entries, icons/effect descriptions, progressive disclosure.
- **Operations:** admin Characters view plus reset/grant behavior.
- **Verification:** expand `server/test/rites.test.ts`; run `pnpm typecheck` and `pnpm test`.

Hard project constraints remain: the server decides all gameplay; the client sends intents and renders authoritative state; component presence gates behavior; runtime combat scratch stays server-only; and cross-boundary definitions belong in `shared/`.
