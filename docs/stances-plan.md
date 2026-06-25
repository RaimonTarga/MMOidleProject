# Stances — Implementation Plan (Step 10)

Companion to `docs/stances-current-state.md`. Roadmap: `docs/system-rework-roadmap.md` §Step 10.

**Goal:** persistent combat **postures** (a T2 system). The player owns a pool of stances (learned
from recipes), picks **one default/active** stance, and may equip **one reactive** stance that an
RP-costed rune rule auto-switches to when its situation holds. Stances are stat/behaviour deltas, free
to equip, switched automatically via the rune spine.

**Scope discipline (matches every prior rework step):** build the **machinery + a worked example
set**; the user authors the rest of the content and tunes all numbers. No balance tuning here.

## Resolved design decisions

| Decision | Choice | Source |
|---|---|---|
| **Rune-switch model** | **Default + reactive slot** (mirror Step 7 abilities). Loadout = `{ default, reactive }`. A single `switch-stance` rune action swaps to the reactive stance while its condition holds, reverts to default otherwise. **No `EquippedRule` change, no per-stance action explosion.** | Q&A 2026-06-24 |
| **Effect application** | **Stat recalc on switch.** Stances carry `StatEffects` + `mechanicEffects`; the active stance folds into `recalculatePlayerStats`. A switch triggers a recalc. The anti-thrash switch cooldown bounds recalc frequency. | Q&A 2026-06-24 |
| **State home** | On `TracksProgression` (`knownStances`, `equippedStances`, `activeStance`) — like abilities/runes. No new component / migration / networked slice / invariant churn. | mirror Step 7 |
| **T2 gating** | **Biome-level band placement** on `StanceRecipe` (`biomeLevelCap()` tier-gates it). Same lever cores used. The panel can additionally hide pre-T2 via `playerTier`. | mirror Step 9 |
| **Worked content** | 2–3 placeholder stances in one T2-band biome (e.g. Offensive default + Defensive reactive, optional Tanking) — exercises both slots and the switch path. Numbers = user pass. | mirror Step 9 |

## Data model

### Static catalog — `shared/src/stances.ts` (new; parallels `abilities.ts`)
```ts
export type StanceSlot = 'default' | 'reactive';

export interface StanceDef {
  id: string;
  name: string;
  blurb: string;
  statEffects?: Partial<StatEffects>;          // reuse skill-tree StatEffects shape
  mechanicEffects?: Record<string, number>;    // reuse the passives pipeline
  // gating metadata is on the recipe, not here
}

export const STANCE_DATABASE: Map<string, StanceDef>;
export function stanceDef(id: string): StanceDef | undefined;
export function validStanceIds(ids: string[]): string[];

export interface EquippedStances { default: string | null; reactive: string | null }
export function emptyEquippedStances(): EquippedStances; // { default: null, reactive: null }
```
- `statEffects` reuses the exact `StatEffects` shape skill-tree nodes use, so the stats fold is a copy
  of the existing node loop. `mechanicEffects` reuses `mergePassives`.
- **v1 = pure stat/passive deltas only** (no bespoke combat hooks). Every brainstorm example stance
  (Offensive/Defensive/Tanking/Evasive/Balanced) expresses as stat deltas — Evasive's dodge rides the
  existing `evasion` stat → `evasionDodgeRate`. Bespoke combat-listener stances are **deferred**.

### Recipes — `shared/src/stanceRecipes.ts` (new; parallels `abilityRecipes.ts`)
```ts
export interface StanceRecipe {
  id: string;
  stanceId: string;                 // the stance this recipe LEARNS
  recipeGroup: string;              // biome group
  requiredBiomeLevel: number;       // T2 band → biomeLevelCap() gates it
  requiredBossClear?: string;       // reserved: boss-signature stance variants
  cost: Partial<Record<EssenceType, number>>;
  catalystCost?: Partial<Record<string, number>>;
}
export const STANCE_RECIPE_DATABASE: Map<string, StanceRecipe>;
export function isStanceRecipeUnlocked(recipe, { biomeLevel, bossesCleared }): boolean;
export function validateStanceRecipes(): void;  // dev-boot sanity (stanceId exists, etc.)
```
- Crafting **learns** the stance into `knownStances` (permanent, one-time). Mirror
  `craftAbilityRecipe`.

### State — three fields on `TracksProgression` (`shared/src/components/core/networkedSlices.ts`)
```ts
knownStances: string[];            // learned pool (slottable)
equippedStances: EquippedStances;  // { default, reactive } — build/loadout data
activeStance: string | null;       // RUNTIME: which posture is folded into stats right now
```
- `activeStance` is networked (client shows the current posture) but is **derived runtime state**:
  initialized to `equippedStances.default` on attach and corrected by the switch system. Persisting it
  is harmless; the switch system reconciles it next tick.

## The two real mechanics

### 1. Active-stance fold in `stats.ts` (the only shared-logic change)
- In `recalculatePlayerStats(p)`, add **one block** (after the skill-node loop, before/with the
  equipment loop) that reads `p.tracksProgression?.activeStance`, looks up the `StanceDef`, and applies
  its `statEffects` (same per-field adds as the skill-node loop, incl. `evasion`→`evasionChance` and
  `attackSpeedPct` accumulation) + `mechanicEffects` via `mergePassives`. Guard the optional
  `tracksProgression` (benches/preview callers may lack it → no-op).
- ⚠️ **Re-clamp ordering:** `damageReduction` is clamped at step 2 and re-clamped after equipment.
  Put the stance fold **before** the post-equipment re-clamp so a defensive stance's DR is clamped too.

### 2. `stanceSwitch.ts` per-tick system (server; sibling of `abilityFiring.ts`)
`server/src/systems/player/stances/stanceSwitch.ts` → `updateStanceSwitch(world)`, run in `World.tick`
**after** `updateRuneDerivedConfig` (so the rune flag is fresh) and after `updateAbilityFiring`
(adjacent placement). Per live player with `equippedStances`:
```text
desired = (has switch-stance rune AND RUNE_SWITCH_STANCE_FLAG set AND reactive != null)
            ? reactive : default
if desired !== activeStance AND switch-cooldown elapsed:
    activeStance = desired
    setCooldown(tracksCombat, "stance.switch.cd", STANCE_SWITCH_COOLDOWN_MS)  // anti-thrash
    recalculatePlayerStats(player)        // server recalc path used by equip/unequip
    markSliceDirty(world, player, "tracksProgression")
```
- **Anti-thrash:** the cooldown both prevents per-tick flapping at a threshold boundary (e.g.
  hp-below-25 hovering at 25%) and bounds recalc cost. Placeholder `STANCE_SWITCH_COOLDOWN_MS` (user
  tunes). No `initCombatSystems()` change — this is a tick system, not a combat listener.

## Rune catalog (shared) — `STANCE` channel + `switch-stance` action
Mirror the Step 7 ability-channel work in `shared/src/runeDatabase.ts`:
- Add `"STANCE"` to `RuneChannel`, `RUNE_CHANNELS`, `runeChannelLabel`, and `emptyClaims()`.
- Add `"switch-stance"` to `RuneActionId` + `ACTION_DATABASE` (channel `STANCE`, placeholder cost
  ~2 RP, `allowedConditionIds` = combat-reactive set: `in-combat` / `hp-below-25` / `n-aggro-3`).
- `DerivedRuneConfig` gains `stanceAction` + `switchStance: boolean`; the derive loop sets
  `switchStance` when the `STANCE` channel is claimed by `switch-stance`.
- `runeConfig.ts`: export `RUNE_SWITCH_STANCE_FLAG = "rune.switchStance"`; `setFlag(... , d.switchStance)`.
- **Starter availability:** add `switch-stance` to `STARTER_RUNE_IDS` (consistent with `fire-technique`/
  `fire-guard` — the action is a timing preference; the *stance recipes* are the real T2 gate).
  Equipping it still costs RP and is inert with no reactive stance. (User can move it onto a recipe.)

## Protocol + client + admin (clone Abilities)
- `socketEvents.ts`: `stance:craftRecipe(recipeId)`, `stance:setLoadout(EquippedStances)` (client→server);
  `stance:craftResult({ recipeId, success, reason? })` (server→client). Handlers in `index.ts` call
  `craftStanceRecipe` / `setStanceLoadout` (`server/src/systems/player/economy/stanceCrafting.ts`).
  - `setStanceLoadout` validates ownership (`knownStances`), sets `equippedStances`, resets
    `activeStance = equippedStances.default`, recalcs, marks dirty.
- `PlayerView` + composer (`shared/src/protocol/views.ts`): carry `knownStances`, `equippedStances`,
  `activeStance` (composer defaults for old/loose rows).
- Client: `hudBus.requestCraftStanceRecipe` / `requestSetStanceLoadout` → intents → `net/intents`
  senders. Atoms `knownStancesAtom` / `equippedStancesAtom` / `activeStanceAtom` synced from `PlayerView`
  (+ reset). New `StancesPanel.tsx` (default + reactive `<select>`s + Learn list) wired into the desktop
  sidebar (`MenuButtons`), Escape (`overlayStack`), and the mobile "More" sheet — clone `AbilitiesPanel`.
  `RunesPanel` surfaces `switch-stance` automatically; add `STANCE` to `CHANNEL_COLOR`.
  Light **active-posture indicator** (panel highlight, optionally a HUD chip) reads `activeStanceAtom`.
- Admin: `AdminCharacterRecord` carries the three fields; `CharactersTab` shows them read-only
  (e.g. `Stance: <default> / <reactive> (active: <x>)`). Grant action deferred (read-only, like abilities).

## Build phases

### Phase A — shared foundation
- `shared/src/stances.ts` (catalog + helpers); `shared/src/stanceRecipes.ts` (recipes + predicate +
  validator). Wire `validateStanceRecipes()` into the dev-boot sanity pass alongside the ability one.
- Three `TracksProgression` fields + `EquippedStances` type export.
- Rune catalog: `STANCE` channel + `switch-stance` action + derived flag.

### Phase B — server authority
- `stats.ts` active-stance fold (the one shared-logic change) + correct re-clamp ordering.
- `stanceSwitch.ts` tick system; register in `World.tick` after rune-config / ability-firing.
- `stanceCrafting.ts` (`craftStanceRecipe`, `setStanceLoadout`); `index.ts` handlers + validation.
- `runeConfig.ts` flag stamp.
- `playerRepo` defaults (fresh + hydrate; `knownStances` filtered via `validStanceIds`,
  `equippedStances` → `emptyEquippedStances()`, `activeStance` → default-or-null on attach).
- **Mechanical fixups** (typecheck will flag): bench/test fixtures that build a `TracksProgression`
  literal need the three fields (`server/bench/balance/*`, `server/test/*`, any `PlayerView` fixtures).

### Phase C — protocol + client + admin
- `socketEvents.ts` events + `PlayerView` fields + composer.
- `hudBus` / intents / `net/intents` senders; atoms; `StancesPanel.tsx`; `MenuButtons` + `overlayStack`
  + mobile "More" wiring; `CHANNEL_COLOR` STANCE entry; active-posture indicator.
- Admin record + `CharactersTab` surfacing.

### Phase D — worked content (placeholders)
- 2–3 stances in one T2-band biome (`shared/src/data/recipes/<biome>.recipes.ts` style or a stance
  recipe block), placeholder numbers, **pure `statEffects`/`mechanicEffects`**:
  - **Offensive Stance:** +attack% (and/or +attackSpeedPct), small −DR or −maxHp tradeoff.
  - **Defensive Stance:** +damageReduction / +plating, −attack tradeoff.
  - *(optional)* **Tanking Stance:** +maxHp / +plating, −speed/−attack.
- Author a worked **default + reactive** loadout (e.g. default Offensive, reactive Defensive) and a
  starter-able rule `hp-below-25 → switch-stance` so the switch path is exercised end to end.

### Phase E — verify (cross-cutting checklist)
- 4-package `pnpm typecheck`; rebuild `shared` dist.
- Server tests (`targetPriority`, `runeMaintenance`).
- A combat bench (`autoCombatSameNode`) — no regression from the new tick system + recalc-on-switch +
  the stats fold.
- Sanity: equip default+reactive; drop HP under the threshold → `activeStance` flips to reactive and
  the stat sheet changes; cooldown prevents per-tick flapping; reverts on recovery; RP cost enforced on
  the `switch-stance` rule; with no reactive stance the rule is inert.

## Cross-cutting concerns (per roadmap checklist)
- **Persistence/migration:** none beyond defaults — new `TracksProgression` fields hydrate with
  defaults on old rows (clean cutover, pre-release). Mirror abilities.
- **Networked allowlist / dev-boot invariants:** none — the three fields are nested under the
  already-networked `TracksProgression`; no `NETWORKED_PLAYER_KEYS` change. Confirm invariants pass.
- **Protocol / PlayerView:** add the three fields + composer defaults. Update shared first.
- **Admin:** read-only surfacing now; grant deferred.
- **combatBootstrap parity:** unaffected — stance switching is a `World.tick` system, not a combat
  listener. (Only a *bespoke* stance with on-hit/on-damage behaviour would need `initCombatSystems()`;
  deferred.)
- **Rune-action catalog (shared hub):** `switch-stance` is the **third** addition after Steps 5/7.
  Keep RP costs/channels coherent — it is single-claim on its own `STANCE` channel, like TECHNIQUE/GUARD.

## Deferred (not this step)
- Bespoke stances needing new combat hooks (threat/aggro postures, on-hit riders, banner/support
  auras) — new `mechanicEffects` keys + combat listeners, authored per-stance later.
- More than one reactive slot / multi-target auto-switch (would need the parametrized-rule model — the
  rejected Q&A option B; revisit only if v1's single reactive proves too limiting).
- Boss-signature stance variants (`requiredBossClear` channel is reserved but unused in v1).
- Per-biome stance content beyond the worked set; all numbers (effect magnitudes, RP cost, switch
  cooldown, recipe costs, T2 level values) — user balance pass (Step 15).

## Red-team (carry from roadmap)
- *Currency bloat?* — stances reuse essence/catalyst costs; no new currency.
- *Does auto-switch thrash / tank perf?* — the switch cooldown bounds both flapping and recalc
  frequency; verify in the bench.
- *Is the default-only player penalised?* — no stance equipped = neutral baseline; stances are upside,
  not a tax. The reactive slot is optional.
