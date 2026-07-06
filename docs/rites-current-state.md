# Rites — Current State

Companion to `docs/archive/rites-plan.md`. Roadmap: `docs/system-rework-roadmap.md` §Step 11.

> **🔨 IMPLEMENTED 2026-06-24** — machinery + the four worked rites (Quickened Breath,
> Cleansing Breath, Lingering Momentum, Hunter's Instinct), the always-on 2-slot model, and
> the full stack (stats fold, OOC readers, crafting, protocol, client panel, admin). All
> numbers are PLACEHOLDERS for the user balance pass.

## TL;DR

Rites are the **simplest-runtime** member of the loadout cluster: build/loadout state on
`TracksProgression` (`knownRites` + `equippedRites`), a parallel T3-gated recipe file, a
panel/protocol/admin surface — all cloned from Stances (Step 10). The genuinely net-new part
is the **out-of-combat readers**: rites carry `rite.*` `mechanicEffects` that the OOC systems
consume, rather than in-combat stat deltas.

## How it works

- **State** (`shared/src/components/core/networkedSlices.ts`): `knownRites: string[]` (learned
  pool) + `equippedRites: string[]` (interchangeable list, length ≤ `riteSlotCount`). No
  `activeStance` analogue — rites are always-on. Networked (inside `tracksProgression`,
  already an allowlisted slice) + persisted; defaulted in `playerRepo` (fresh + hydrate,
  `knownRites`/`equippedRites` filtered through `validRiteIds`).
- **Slots**: `riteSlotCount(globalMastery)` is a stub returning a flat **2**. The GM parameter
  is wired through so the "GM unlocks more slots" curve can land later without re-plumbing.
- **Catalog** (`shared/src/rites.ts`): `RiteDef` carries only `mechanicEffects` (`rite.*`
  keys). `shared/src/riteRecipes.ts` mirrors `StanceRecipe`; the four recipes sit on **forest**
  in the **T3 band** (`requiredBiomeLevel` 13–14) — gated for free by `biomeLevelCap()`.
- **Fold** (`shared/src/systems/stats.ts`): every equipped rite's `mechanicEffects` merges
  into `usesSkills.passives` in `recalculatePlayerStats` (block 2b). The server passes
  `equippedRites` via `playerEntityFormulas.ts`; `setRiteLoadout` recalcs on change.
- **Readers** (`server/src/systems/player/rites/riteOoc.ts`):
  - `oocRegenDelay(player)` → used in `combat/engine/combat.ts` (Quickened Breath).
  - `runRiteOoc(world, player, dt, now)` → called from `defense/index.ts`, self-gated to OOC;
    runs Cleansing Breath (pulse-strip harmful effects) + Lingering Momentum (slow beneficial
    buff decay).
  - `initRiteListeners()` → `onKill` haste buff (Hunter's Instinct), registered in
    `combatBootstrap.ts` for live/bench parity.

## Decisions & rationale

- **No rune action.** Rites are passive between-fight behaviors; adding a channel would
  contradict the framing and add machinery for no gameplay gain. (Diverges from Steps 7/10.)
- **Full-list `setRiteLoadout`.** Rites are interchangeable, not role-named (no
  default/reactive), so the client sends the whole equipped list; the server dedupes + caps.
- **Reuse `mob-haste` for Hunter's Instinct.** There is no target-acquisition *delay* to
  shorten (acquisition is immediate in `autoTarget.ts`), so "acquire faster" is expressed as
  post-kill movement haste — and the mobility `FOREST_HASTE` buff already renders + applies
  speed unconditionally, so no new buff id/descriptor was needed.

## Known refinement points (for the balance/playtest pass)

- **Lingering Momentum scope is the fuzziest.** It extends *non-harmful, non-instanced, timed*
  status effects (`isHarmfulEffect()` excludes slow/frost-ramp/DoTs). In practice the stored
  beneficial buffs are mostly the mobility ones (`mob-*`); class-resource buffs are projected
  from component state, not stored as status effects, so they are untouched. If a future buff
  is stored as a non-harmful status effect and should NOT linger, tighten the predicate.
- **Quickened Breath** only affects the *base OOC HP-regen* gate in `combat.ts`, deliberately
  not the kite/rune-arbitration `isPlayerInCombat` checks (those stay on the global constant).
- All magnitudes/costs/T3-band placement are placeholders.

## Not built (deferred)

- Ranks / rank caps (reuse the gear/core evolution-chain pattern later).
- GM-driven slot-count curve (getter stubbed at 2).
- Boss signature rites (`requiredBossClear` reserved on `RiteRecipe`, no content).
