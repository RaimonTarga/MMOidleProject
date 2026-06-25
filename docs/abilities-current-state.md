# Step 7 — Abilities — Current State

Paired with `docs/abilities-plan.md`. Reflects what shipped this session: the **full
Abilities system + the Sweep / Brace worked pair**. Authoring more abilities, ability
evolution, and tuning the numbers are later passes.

> **Name collision (kept distinct).** The passive talent tree (`UsesSkills`, `skillTree/`) is
> class progression and is **untouched**. "Abilities" is the new active system (Technique / Guard).

## Data model — state rides `TracksProgression` (like runes)

**Implementation refinement vs. the plan:** ability state lives on `TracksProgression`, NOT a new
`UsesAbilities` component. Rationale: it's build/loadout data exactly like runes
(`runesOwned`/`runeRecipesCrafted`/`runesEquipped` already live there), and this avoids a DB
migration, a new networked slice + dev-boot invariant churn, a new `ServerEntity` key, and fixture
churn. Two fields added (`shared/src/components/core/networkedSlices.ts`):
- `knownAbilities: string[]` — abilities learned (crafted); the slottable pool.
- `equippedAbilities: EquippedAbilities` — `{ technique: string | null; guard: string | null }`.

Static catalog — `shared/src/abilities.ts`:
- `AbilitySlot` (`technique` | `guard`), `AbilityTag` (`mobility`, grows), `AbilityTrigger`
  (`in-combat` | `hp-below` | `n-aggro`), `AbilityEffectSpec` (`cleave` | `shield`), `AbilityDef`.
- `ABILITY_DATABASE` (Sweep, Brace), `abilityDef()`, `validAbilityIds()`, `emptyEquippedAbilities()`.

Recipes — `shared/src/abilityRecipes.ts` (parallel to `RuneRecipe`):
- `AbilityRecipe` (essence `cost` + `catalystCost`, `recipeGroup`+`requiredBiomeLevel` gate,
  `requiredBossClear` reserved), `ABILITY_RECIPE_DATABASE`, `isAbilityRecipeUnlocked()`,
  `validateAbilityRecipes()`. Crafting LEARNS the ability into `knownAbilities` (permanent).

Persistence: defaulted in `playerRepo` (fresh + hydrate; `knownAbilities` filtered through
`validAbilityIds`, `equippedAbilities` defaults to empty). Whole-slice JSON write persists them.
`PlayerView` carries both fields (composer defaults for old/loose rows). 5 bench/test fixtures
made well-formed.

## Firing — built-in heuristic + rune override (server)

- **`hasArmedAbility` component** (`server/src/ecs/entity.ts`) — server-only `{ abilityId }`,
  **sibling to `hasEmpoweredAttack`** (kept separate so it never collides with the class-owned
  empowered flag). NOT networked (the "armed" UI indicator is deferred).
- **`abilityFiring.ts`** (`server/src/systems/player/abilities/`) — `updateAbilityFiring(world)`,
  run each tick in `World.tick` after `updateAutoTargets` and before combat resolves. Per equipped
  ability: gate on a per-ability cooldown (`ability.technique.cd` / `ability.guard.cd` on
  `TracksCombat`); fire on the built-in trigger UNLESS a `fire-technique`/`fire-guard` rune is
  equipped, in which case the rune's derived flag drives (override suppresses the built-in). Technique
  arms `hasArmedAbility`; Guard applies its immediate effect (`applyShieldPercent`).
- **`abilityEffects.ts`** — `initAbilitySystems()` (registered in `initCombatSystems()` for bench
  parity) registers TWO listeners: an `onHit` Technique rider (consumes `hasArmedAbility` respecting
  the chaotic-miss rule; Sweep's `cleave` reuses `applyPlayerAoe` — **archetype-agnostic**, rides
  `ctx.damage`), and an `onDamageTaken` Guard-buff DR reader (mirrors reload's cover-fire: reduces
  incoming damage by the active guard buff's `drPct`, capped at 0.9).

### Guard abilities are EXPLICIT buffs (buff system)
Guard boons go through the game's **buff system**, not raw shields — they show in the buff bar with
icon + timer. A Guard ability with a `damage-reduction` effect applies the
`ABILITY_GUARD_EFFECT_ID` (`"ability-guard"`) **status effect** on `TracksCombat`
(`{ totalMs, drPct }`, refreshable; `updateTracksCombat` decrements it). The `onDamageTaken` listener
reads `drPct`; a buff descriptor (`abilityBuffs.ts` → `ABILITY_BUFFS`, spread into `ALL_BUFFS` in
`buffSync.ts`) projects it as the `ability-guard` `PlayerBuff` each tick (label/color from the
equipped ability def). One Guard slot ⇒ at most one active, so a single buff id covers all guard
buffs. `ability-guard` added to shared `BUFF_IDS`.

## Rune catalog (shared) — dedicated channels

**Refinement vs. the plan's "CONTROL channel":** each ability slot gets its OWN rune channel so a
Technique override, a Guard override, and a CONTROL taunt can all be equipped at once (CONTROL is
single-claim). `shared/src/runeDatabase.ts`:
- New channels `TECHNIQUE` / `GUARD`; new actions `fire-technique` / `fire-guard` (cost 1 RP each).
- Derive produces `fireTechnique` / `fireGuard` flags; `runeConfig.ts` stamps
  `RUNE_FIRE_TECHNIQUE_FLAG` / `RUNE_FIRE_GUARD_FLAG` onto `TracksCombat`.
- Both actions added to `STARTER_RUNE_IDS` (v1: the override is a timing preference for an ability
  you already unlocked — gating behind another recipe is friction; user can move them to recipes).

## Protocol + client

- `socketEvents.ts`: `ability:craftRecipe`, `ability:setLoadout` (client→server),
  `ability:craftResult` (server→client). Handlers in `index.ts` call
  `craftAbilityRecipe` / `setAbilityLoadout` (`server/src/systems/player/economy/abilityCrafting.ts`).
- Client bridge: `hudBus.requestCraftAbilityRecipe` / `requestSetAbilityLoadout` → intents →
  `net/intents` senders → socket. Atoms `knownAbilitiesAtom` / `equippedAbilitiesAtom` synced from
  `PlayerView` (+ reset). New `AbilitiesPanel.tsx` (slot selects + Learn list) wired into the desktop
  sidebar (`MenuButtons`) + Escape handling (`overlayStack`) AND the mobile HUD ("More" sheet →
  Abilities). RunesPanel surfaces the new actions
  automatically (it iterates `ACTION_DATABASE`); `CHANNEL_COLOR` got `TECHNIQUE`/`GUARD` entries.
- Admin: `AdminCharacterRecord` carries `knownAbilities` + `equippedAbilities`; `CharactersTab` shows
  `T:/G: (n known)`.

## Worked content (placeholders)

- **Sweep** (Technique, forest): trigger `in-combat`, cleave 60% / radius 90, cd 4 s. Recipe
  `ability-recipe-sweep` (forest L2, 160 green).
- **Brace** (Guard, forest): trigger `hp-below 0.5`, **damage-reduction buff** 40% for 5 s (explicit
  `ability-guard` buff), cd 8 s. Recipe `ability-recipe-brace` (forest L2, 140 green + 60 blue).
- All numbers are PLACEHOLDERS (user balance pass).

## Verified

Typecheck clean (4 pkgs); shared rebuilt; `targetPriority` + `runeMaintenance` tests pass; a
combat bench scenario (`autoCombatSameNode`, 5 players) runs clean (no regression from the new tick +
listeners + the per-tick buff projection); sanity scripts confirm the ability DB, recipe gating,
starter availability, the fire-guard hp-threshold override, Technique + taunt coexisting on separate
channels, and the `ability-guard` buff projecting (label from equipped ability, DR%, duration clock).

## Deferred (not this session)

- **Ability evolution** (Sweep→Whirlwind families) + generalizing Step 6's machinery — follow-up.
- Per-biome ability content beyond the forest Sweep/Brace pair (user content pass).
- Mobility-tag *movement* effects (Leap Strike etc.) beyond the tag.
- "Technique armed" HUD indicator (would need networking `hasArmedAbility` or a derived view bool).
- In-combat ability bar (equipped slots + cooldown sweep). Guard buffs already show in the buff bar.
- Admin **grant** action (read-only for now).
- All numbers/balance; Step 8's charm `guard.*` amplifier keys off the Guard ability shape defined here.
