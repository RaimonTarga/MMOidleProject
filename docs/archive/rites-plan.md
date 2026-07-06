> **ARCHIVED (2026-07-07) — HISTORICAL.** Implemented; live state in `docs/rites-current-state.md`. Kept for design rationale — do not treat as current.

# Rites — Implementation Plan (System Rework Step 11)

Companion to `docs/rites-current-state.md`. Roadmap: `docs/system-rework-roadmap.md` §Step 11.

> **🔨 IMPLEMENTED 2026-06-24.** Built per the approved plan
> (`.claude/plans/rustling-singing-biscuit.md`). All numbers are PLACEHOLDERS for the
> user balance pass (Step 15).

## What Rites are

T3, **always-on out-of-combat passives** that shape the between-fight rhythm. Unlike
Stances (one active posture, rune-switched) there is **no active slot, no rune action, no
tick reconciler** — every equipped rite is simply active while the player is OOC.

**Locked decisions (Q&A 2026-06-24):**
1. Always-on passive (no rune channel/action).
2. **2 fixed slots** + a stubbed `riteSlotCount(globalMastery)` getter (flat 2; GM-growth
   curve is the user's to tune later).
3. Worked v1 = all four brainstorm rites.

## Effect model

Rites carry only `rite.*` `mechanicEffects` (new `RITE_KEYS` namespace in `passives.ts`).
**Every** equipped rite folds its keys into `usesSkills.passives` in
`recalculatePlayerStats` (a new block, after the stance fold — `stats.ts`). The OOC systems
then read those keys at runtime. This reuses the Step 8 charm / Step 10 stance pipeline; the
difference is the *readers* live in the out-of-combat systems, not the in-combat stat path.

## The four worked rites + their readers

| Rite | Key(s) | Reader |
|------|--------|--------|
| **Quickened Breath** | `rite.ooc-regen-delay-reduction-pct` | `oocRegenDelay(player)` shortens the post-combat regen delay; read by the base OOC HP-regen gates in `combat/engine/combat.ts` (two spots). |
| **Cleansing Breath** | `rite.ooc-cleanse-stacks`, `rite.ooc-cleanse-interval-ms` | `runRiteOoc` pulses `removeStatusEffectStacks` on **harmful** effects only (slow, frost-ramp, monster DoTs, `data.isDot`) while OOC. |
| **Lingering Momentum** | `rite.ooc-buff-decay-slowdown-pct` | `runRiteOoc` adds back a fraction of `dt` to the `remainingMs` of **non-harmful** timed buffs while OOC (net decay = `(1 − slowdown)·dt`), capped at the buff's original `totalMs`. |
| **Hunter's Instinct** | `rite.on-kill-haste-pct`, `rite.on-kill-haste-ms` | `initRiteListeners` registers an `onKill` listener that applies the mobility `mob-haste` buff (reuses `FOREST_HASTE` so the existing descriptor renders + applies speed). |

`isHarmfulEffect()` in `riteOoc.ts` is the shared predicate keeping Cleansing Breath from
stripping (and Lingering Momentum from extending) beneficial buffs.

## Files

**Shared:** `rites.ts` (catalog + `riteSlotCount`), `riteRecipes.ts` (T3-band gating),
`RITE_KEYS` in `passives.ts`, `knownRites`/`equippedRites` on `TracksProgression`, the fold
block + `equippedRites` input in `systems/stats.ts`, protocol (`socketEvents.ts`,
`views.ts`, `admin.ts`), index exports.
**Server:** `systems/player/economy/riteCrafting.ts` (craft + full-list `setRiteLoadout`),
`systems/player/rites/riteOoc.ts` (readers + `oocRegenDelay` + Hunter's listener),
`combat/engine/combat.ts` (regen-delay seam), `defense/index.ts` (calls `runRiteOoc`),
`combatBootstrap.ts` (`initRiteListeners`), `ecs/playerEntityFormulas.ts` (passes
`equippedRites` to recalc), `db/playerRepo.ts` defaults, `admin/gameActions.ts` reset,
exported `FOREST_HASTE` from `mobilityBoots.ts`.
**Client:** `ui/RitesPanel.tsx` (N-slot list), atoms, `hudBus`, `intents`, `net/intents`,
`input/hudEvents`, `MenuButtons`, `overlayStack`, `MobileHUD`.
**Admin:** `AdminCharacterRecord` fields + `CharactersTab` row.
**Bench/tests:** added the two fields to the 5 `TracksProgression` literals (botFactory,
harness, netcode-baseline, targetPriority/runeMaintenance tests).

## Verification

4-package typecheck ✓ · shared build ✓ · server tests (targetPriority, runeMaintenance) ✓ ·
idle combat bench clean ✓ · sanity script (catalog/T3-gating/slot-count/fold/regen-delay) ✓.
