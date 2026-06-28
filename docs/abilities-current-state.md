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
  (`in-combat` | `hp-below` | `n-aggro` | `has-debuff`), `AbilityEffectSpec`
  (`cleave` | `empower` | `damage-reduction` | `cleanse` | `heal`), `AbilityDef`.
- `ABILITY_DATABASE` (Sweep, Brace, Cleanse, Heavy Strike, Second Wind), `abilityDef()`,
  `validAbilityIds()`, `emptyEquippedAbilities()`.

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

## In-combat HUD + Sweep FX (placeholder visuals)

The equipped Technique/Guard now show as a **bottom-left ability bar** (`AbilityBar.tsx`,
mounted in `#ability-overlay`), styled after the buff bar (colored placeholder shapes + glyph +
short label + a `T`/`G` slot badge). State is derived **client-side** (no protocol churn):
- **Cooldown sweep** — a dark conic overlay of the REMAINING cooldown, approximated from the
  last-fired wall clock (`abilityFiredAtAtom`) + the ability's `cooldownMs`. Approximate (rune
  timing overrides / Step 8 `guard.*` charms shift the real cd), fine for a placeholder.
- **Technique fire** is signalled by a new shared client-effect tag `ABILITY_SWEEP_FX`
  (`"ability-sweep"`): `abilityEffects.ts` stamps it into `ctx.metadata.clientEffects` when
  Sweep's cleave lands, combat.ts forwards it on the `player-hit` event, and `combatFx.ts` both
  plays `fxSweep` (a bold horizontal cleave arc laid ON TOP of the normal attack FX, `fx/sweep.ts`)
  and pulses the Technique icon via `notifyAbilityFired('technique')`.
- **Guard** derives active-glow + cooldown from the rising/falling edge of its `ability-guard`
  buff (already in `activeBuffs`); no FX tag needed.
- Mobile: buffs occupy bottom-left, so the ability bar floats just above them (hud.css media query).

All HUD colors/glyphs are placeholders — swap for real icon textures without touching layout.

## Worked content (placeholders)

- **Sweep** (Technique, forest): trigger `in-combat`, cleave 60% / radius 90, cd 4 s. Recipe
  `ability-recipe-sweep` (forest L2, 160 green).
- **Brace** (Guard, forest): trigger `hp-below 0.5`, **damage-reduction buff** 40% for 5 s (explicit
  `ability-guard` buff), cd 8 s. Recipe `ability-recipe-brace` (forest L2, 140 green + 60 blue).

### Rough T1 per-biome additions (Step 7 follow-up — placeholder numbers)
Each is its biome's **mid-biome "answer tool"** — gated at biome level **3** (mid of the L1–4 T1
band) so the player meets the biome's challenge first and then earns the response. All learned
**permanently** into `knownAbilities` via the existing AbilityRecipe path (biome-gated by
`recipeGroup` + `requiredBiomeLevel`, **no boss-clear requirement**), surfaced automatically in the
Abilities panel's "Learn Abilities" list + the forge (both iterate `ABILITY_RECIPE_DATABASE` and gate
on `isAbilityRecipeUnlocked`). Costs/levels are PLACEHOLDERS (user balance pass).
- **Cleanse** (Guard, swamp): trigger `has-debuff`, **strips** up to 3 stacks from each harmful
  debuff/DoT on the player (rot/slow/antiheal/marks/monster-DoT/node-hazard) AND applies a short
  post-cleanse `ability-guard` DR buff (20% for 3 s), cd 9 s. Recipe `ability-recipe-cleanse`
  (**swamp L3**, 150 green). The defensive answer to rot/DoT/debuff pressure.
- **Heavy Strike** (Technique, mountain): trigger `in-combat`, `empower` rider — next landed hit deals
  ×1.8 **single-target** damage (no splash; applied in the `onHit` rider, mitigated normally by
  `onDamageTaken`), cd 5 s. Recipe `ability-recipe-heavy-strike` (**mountain L3**, 150 yellow).
- **Second Wind** (Guard, cave): trigger `hp-below 0.35`, `heal` — deposits 30% max HP into the
  recovery burst pool (antiheal applies; shows the **Regen** tile), cd 12 s. Recipe
  `ability-recipe-second-wind` (**cave L3**, 150 purple). Emergency sustain vs. sparse elite pressure.

> **Deferred (T2 direction):** DoT AoE/spread is reserved for a future **T2 ability** — Sweep
> remains a **generic cleave** (it does not apply DoTs, and there is no DoT-AoE/spread ability yet).
> Technique/Guard **rune-override** compatibility (`fire-technique`/`fire-guard`, plus the
> `before-empowered` condition) is preserved for all of these — they are normal Technique/Guard
> abilities that the override channels drive like Sweep/Brace.

**Shared authority added:** `isHarmfulPlayerStatusEffect(id, data)` (`shared/src/systems/monsterDebuffs.ts`)
is now the single definition of "a debuff/DoT on the player" — used by Cleanse, the `has-debuff` trigger,
AND the Cleansing Breath rite + Lingering Momentum (refactored off their local copy; it also broadened
the set to cover rot/antiheal/marks/heat/node-hazards, a strict improvement that incidentally stops
Lingering Momentum from extending those debuffs).

- All numbers are PLACEHOLDERS (user balance pass).
- **Deferred polish:** Heavy Strike has no client FX tag (so the Technique HUD icon doesn't pulse and
  its cooldown sweep doesn't animate); Second Wind grants no `ability-guard` buff, so the Guard HUD
  icon's active-glow/cooldown sweep doesn't run for it (the Regen tile covers it). No target-quality
  preference on Heavy Strike (fires on plain `in-combat`); "HP low while debuffed" is folded into the
  plain `has-debuff` trigger for Cleanse. Real DoT-specific resistance (vs. the generic DR stand-in)
  is deferred.

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
- Admin **grant** action (read-only for now).
- All numbers/balance; Step 8's charm `guard.*` amplifier keys off the Guard ability shape defined here.
