# v0.01 — Smarter Auto-Combat

## New: Auto-Combat now thinks before it swings

Auto-combat no longer just runs at whatever enemy happens to be closest. It now
scores every nearby target based on **how much damage you'd actually do, how far
away it is, and how dangerous it is to you.**

- **Won't waste time on enemies it can't hurt.** Invulnerable targets and
  heavily-armored "glancing hit" enemies are deprioritized or skipped entirely.
- **Won't wake bosses you didn't mean to fight.** Dormant ultimate encounters
  (like the Void Overlord) are left alone unless you opt in.
- **Won't suicide.** If a target would kill you before you kill it, auto-combat
  steers clear.
- **Won't run across the zone** chasing a juicier target. Targets outside your
  acquire radius are ignored unless they're already attacking you.
- **Sticks to its target.** A new switch margin stops the stutter where it
  flip-flopped between two similar enemies every tick.
- **Finishes wounded enemies, prioritizes quest targets, clusters for AoE, and
  stops over-stacking DoTs** on enemies that are already as good as dead.

## New: Flee & recover

When you're about to die and losing the fight, auto-combat will now **retreat to
the nearest exit, leave the zone, heal up, and return to re-engage.**

- **Party leaders wait** until the whole party is healed before heading back in.

## Improved: Melee positioning (no more "tunneling")

Fast melee — and any monster whose speed has ramped from chasing — used to blow
straight through its target, swap sides, and never actually land in attack range
(which also made chasers ramp speed forever). Both players and monsters now
**settle at a clean standoff just inside their reach** instead of charging the
target's center, so fights lock in immediately and fast movers stop on the
correct side.

## New: Autocombat settings tab

A dedicated **Autocombat** tab in Settings (the Auto-traverse toggle moved here):

- Engage ultimate bosses automatically (off by default)
- Flee when losing the fight + flee HP threshold
- Priority mode: Balanced / Nearest / Damage / Threat
- Acquire radius
- Prefer party leader's target

---

## Technical changelog

### `shared`

- Added `combatEstimates.ts` (`estimatePlayerHitDamage` / `estimateMonsterHitDamage`
  / `isGlancingHit`) mirroring the authoritative combat formulas, including
  plating-shred handling.
- Added `approachPoint()` + `MELEE_CONTACT_MARGIN` / `MELEE_STANDOFF_FRAC` to
  `spatial.ts`: returns a standoff destination inside reach so `advanceMotion`
  can't overshoot the target center (anti-tunnel). Added `approachPoint` unit
  tests to `spatialHitbox.test.ts`.
- Extended `UsesAutocombat` with an `AutocombatConfig` (engageUltimateBosses,
  fleeWhenLow, fleeHpPct, priorityMode, acquireRadius, focusLeaderTarget); added
  `DEFAULT_AUTOCOMBAT_CONFIG` and the `player:setAutocombatConfig` socket event.

### `server`

- New `targetPriority.ts` priority engine (gates -> weighted score -> hysteresis)
  returning `attack` / `flee` / `idle`.
- New `flee.ts` state machine (`out` -> `recover` -> `return`) with the
  `isFleeing` component and party-leader heal gating.
- `updateAutoTargets` rewired into a thin dispatcher and now receives `now`;
  flee skips added to `partyFollow` and `autoTraverse`; config intent handler +
  slice defaults.
- `ai.ts`: chasing monsters now steer to `approachPoint` instead of the target
  center, fixing tunnel-through and runaway kite-speed ramp.
- `hitbox/cache.ts`: added `hydrateHitboxCacheFromDb()` to load baked hitboxes
  without a full rebake.

### `client`

- New Autocombat settings tab, gameplay-settings persistence, intent/hudBus/net
  wiring, and config re-emit on connect/resync (matching the existing
  auto-traverse pattern).

### `bench`

- Bots opt into `engageUltimateBosses: true` so the Overlord is woken
  intentionally and no longer poisons runs.
- `balanceRun.ts` `main()` is now async and calls `ensureBenchHitboxCache()`
  before simulating (skipped on `--dry-run`), so bench combat reach matches the
  live server.

### Validation

- `pnpm typecheck`, `pnpm bench:server`, and `pnpm bench:balance` all pass.
