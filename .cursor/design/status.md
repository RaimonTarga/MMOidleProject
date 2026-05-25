# Status Effects — Component vs Lookup Policy

Running design notes on which status effects belong as marker components (driving narrow miniplex queries) versus which stay in `tracksCombat.statusEffects` as lookup-only entries.

---

## Current policy

After the ECS Convergence plan ([.cursor/plans/ecs_convergence_snapshot_retreat_ce736539.plan.md](.cursor/plans/ecs_convergence_snapshot_retreat_ce736539.plan.md)) Phase 2:

- **Marker components** (`hasDot`, `hasConflagration`, `hasChill`, `hasFrozen`, `hasDetonation`, `hasHemorrhage`, `hasEntropy`, `hasAshbrandBurn`) own the iteration story. Each tick driver loops over `world.<marker>Monsters` instead of scanning every monster.
- **Lookup-only entries** stay in `tracksCombat.statusEffects` because they're read by id from a single call site, not iterated by a tick loop. Promoting them to components would add bookkeeping without changing time complexity.

## Deferred — possibly promote `smolder` later

Status effects that are lookup-only (`plating-shred`, `vulnerability`, `smolder`, energy/cooldown buff-resource counters used only by their own archetype tick) stay in `tracksCombat.statusEffects` because they're read by id, not iterated. A future pass could consider whether `smolder` deserves a marker since multiple systems read it ([dotT3.ts](server/src/systems/classes/dot/dotT3.ts) `getSmolderMult` is called from both `updateDotArchetype` and `updatePermafrost`), but for now it's a single map lookup per call site, not a scan — promoting it would not change the time complexity, only the developer model.

If a future system needs to *iterate* the set of smoldering monsters (e.g. a global "ignite chain" effect, or a HUD that needs the count of smoldered enemies), promote `smolder` to a `hasSmolder` marker following the same pattern as the Phase 2 markers.

---

## Heuristic for adding a new status effect

| Question | If yes |
| --- | --- |
| Does any tick loop need to iterate every entity that has this effect? | Add a `hasX` marker component, attach on apply, detach on full expiry. |
| Is this effect read only via `getStatusEffect(state, 'X')` from one or two call sites that already have the entity? | Stay in `tracksCombat.statusEffects`. |
| Does the effect carry stacking semantics, refreshable duration, or `sourceId` tracking? | Keep the data payload in `tracksCombat.statusEffects` regardless — the marker is presence-only. |
