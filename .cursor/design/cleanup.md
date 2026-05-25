# Cleanup / Tech Debt

Running list of follow-up items deferred from the server / client refactor PRDs. Each entry should have enough context to pick up cold without re-reading the originating plan.

---

## Completed

### Extract `spawning/` from `World.ts` — done
Spawning logic lives in [server/src/systems/spawning/index.ts](server/src/systems/spawning/index.ts). `World` keeps thin wrapper methods for backward compatibility.

### Remove buff descriptor casts — done
`BuffDescriptor` / `defineBuff` moved to [server/src/systems/registry/buffs.ts](server/src/systems/registry/buffs.ts) with typed `World` and `CombatState` in `BuffProjectionContext`. No more `world as World` or `playerCs as CombatState` in descriptor bodies.

### Replace empty `MechanicTickWorld` — done
`MechanicModule` / `defineMechanic` moved to [server/src/systems/registry/mechanics.ts](server/src/systems/registry/mechanics.ts). Module `tick` bodies receive concrete `World` directly.

### Lift `BuffId` union into `shared/` — done
[shared/src/components/buffs.ts](shared/src/components/buffs.ts) exports `BUFF_IDS` and `BuffId`. Client [BuffBar.tsx](client/src/hud/BuffBar.tsx) uses exhaustive `Record<BuffId, …>` category mapping. Server derives `ServerBuffId` from `ALL_BUFFS` with a compile-time equality check in [buffSync.ts](server/src/systems/buffSync.ts).

### Normalize `durationPct` on the 4 "elapsed" buffs — done
`cooldown-channel`, `energy-ac-discharge`, `dot-frozen`, and `dot-conflag` now send remaining-time percentages matching the shared `PlayerBuff` contract.

### Snapshot slice taxonomy + projection boundary — done (infrastructure)
Server Phase 4 (s14-1, s14-2, s14-4) landed the typed slice taxonomy and the wire-projection boundary. `World.buildSnapshot` now produces wire DTOs by calling `assemblePlayerSnapshot` / `assembleMonsterSnapshot` over typed slices stamped at attach/spawn. Vector primitives (`Vec2`, `MotionVector`, `vectorTo`, `pointFromMotion`, `advanceMotion`) live in [shared/src/systems/spatial.ts](shared/src/systems/spatial.ts); the slice taxonomy in [server/src/ecs/components/snapshotSlices.ts](server/src/ecs/components/snapshotSlices.ts); projection helpers + round-trip parity diff in [server/src/ecs/projection.ts](server/src/ecs/projection.ts); the boundary adapter for `recalculatePlayerStats` / `canUnlockSkill` in [server/src/ecs/playerSnapshotAdapter.ts](server/src/ecs/playerSnapshotAdapter.ts). Wire parity verified on boot via `diffMonsterRoundTrip` / `diffPlayerRoundTrip`. **System migration (s14-3) and fat-component removal (s14-5) are tracked in the new "From Server Phase 4" section below.**

---

## From Server Phase 3 — Miniplex ECS (S6–S13)

Source: [.cursor/plans/server-phase-3-miniplex-ecs_ac48b095.plan.md](.cursor/plans/server-phase-3-miniplex-ecs_ac48b095.plan.md)

### Add Map-backed entity indexes only if profiling justifies
`world.getMonsterEntity(id)` and `world.getPlayerEntity(id)` are O(N) linear scans over miniplex queries. With ~50 monsters / ~10 players this is fine. If profiling shows hot lookups (likely candidates: combat-tick target resolution, `getMonsterCombatState` calls per pipeline event), add optional `monsterById: Map<string, MonsterEntity>` / `playerById: Map<string, PlayerEntity>` indexes maintained alongside the queries via miniplex `onEntityAdded`/`onEntityRemoved` hooks.

---

## From Server Phase 4 — Snapshot Slice Decomposition (s14-3, s14-5)

Source: [.cursor/plans/server-phase-4-snapshot-slices_f3c9a8d2.plan.md](.cursor/plans/server-phase-4-snapshot-slices_f3c9a8d2.plan.md)

The plan's Step 1, Step 2, Step 4, and the wire-parity portion of Step 5 landed in the initial commit. The remaining work below covers Step 3 (full system migration) and the structural-removal portion of Step 5. These are intentionally split off because they touch ~30 system files and have a large diff that benefits from being broken into reviewable subsystem-group commits.

### Migrate system reads/writes from `playerSnapshot` / `monsterSnapshot` to typed slices
**Scope.** Every server system that today reads or writes `entity.playerSnapshot.X` / `entity.monsterSnapshot.X` needs to switch to the owning slice (`entity.hasPosition.current.x`, `entity.hasHealth.hp`, etc.). Until this lands, the bridge `refreshPlayerSlicesFromSnapshot` / `refreshMonsterSlicesFromSnapshot` helpers in [server/src/ecs/projection.ts](server/src/ecs/projection.ts) run inside `World.buildSnapshot` to keep slices in sync — that bridge can only be removed once every system writes to slices.

**Migration order** (each row is one reviewable commit; each commit must keep typecheck green and wire output unchanged):

1. **Movement / AI / transitions** — [server/src/systems/movement.ts](server/src/systems/movement.ts), [server/src/systems/transitions.ts](server/src/systems/transitions.ts), [server/src/systems/autoTarget.ts](server/src/systems/autoTarget.ts), [server/src/systems/ai.ts](server/src/systems/ai.ts), [server/src/systems/knockback.ts](server/src/systems/knockback.ts). Target slices: `hasPosition`, `isMoving`, `usesAutocombat`, `performsAttack`, `hasAwareness`, `monsterAi`. Destination decisions become `entity.isMoving.motion = vectorTo(entity.hasPosition.current, desiredPoint)`; `targetX` / `targetY` must not appear on any entity slice.
2. **Combat / defense / weapon effects / boss scripts** — [server/src/systems/combat.ts](server/src/systems/combat.ts), [server/src/systems/combatPipeline.ts](server/src/systems/combatPipeline.ts), [server/src/systems/aoeDamage.ts](server/src/systems/aoeDamage.ts), [server/src/systems/defenseSystems.ts](server/src/systems/defenseSystems.ts), [server/src/systems/weaponEffects.ts](server/src/systems/weaponEffects.ts), [server/src/systems/debuffMechanics.ts](server/src/systems/debuffMechanics.ts), [server/src/systems/bossScripts.ts](server/src/systems/bossScripts.ts). Target slices: `hasHealth`, `dealsDamage`, `performsAttack`, `mitigatesDamage`, `evadesHits`, `hasStatus`, `isMonster`, `showsSacred`.
3. **Progression / inventory / skills / crafting / stats / test room** — [server/src/systems/rewards.ts](server/src/systems/rewards.ts), [server/src/systems/questSystem.ts](server/src/systems/questSystem.ts), [server/src/systems/crafting.ts](server/src/systems/crafting.ts), [server/src/systems/inventory.ts](server/src/systems/inventory.ts), [server/src/systems/skills.ts](server/src/systems/skills.ts), [server/src/systems/stats.ts](server/src/systems/stats.ts), [server/src/systems/testRoomInteract.ts](server/src/systems/testRoomInteract.ts). Mutating paths should call the existing [server/src/ecs/playerSnapshotAdapter.ts](server/src/ecs/playerSnapshotAdapter.ts) helpers (`withPlayerSnapshotDraft`, `recalculatePlayerEntityStats`, `canUnlockEntitySkill`) at boundary points rather than re-implementing the shared formula.
4. **Archetype mechanics** — [server/src/systems/classes/cadence/cadencePrototype.ts](server/src/systems/classes/cadence/cadencePrototype.ts), [server/src/systems/classes/cooldown/cooldownPrototype.ts](server/src/systems/classes/cooldown/cooldownPrototype.ts), [server/src/systems/classes/cooldown/cooldownT3.ts](server/src/systems/classes/cooldown/cooldownT3.ts), [server/src/systems/classes/dot/dotPrototype.ts](server/src/systems/classes/dot/dotPrototype.ts), [server/src/systems/classes/dot/dotT3.ts](server/src/systems/classes/dot/dotT3.ts), [server/src/systems/classes/energy/energyPrototype.ts](server/src/systems/classes/energy/energyPrototype.ts), [server/src/systems/classes/energy/energyT3.ts](server/src/systems/classes/energy/energyT3.ts), [server/src/systems/classes/reload/reloadPrototype.ts](server/src/systems/classes/reload/reloadPrototype.ts), [server/src/systems/classes/reload/reloadT3.ts](server/src/systems/classes/reload/reloadT3.ts). Each `project*ToSnapshot` helper rewrites to populate the owning wire-mirror slice (`usesCadence`, `usesEnergy`, `appliesDots`, `chillsTarget`, `usesCooldown`, `usesReload`) instead of `playerSnapshot` fields.
5. **Utility / buff / status / counter** — [server/src/systems/buffSync.ts](server/src/systems/buffSync.ts), [server/src/systems/resourceMechanics.ts](server/src/systems/resourceMechanics.ts), [server/src/systems/statusEffects.ts](server/src/systems/statusEffects.ts), [server/src/systems/empoweredAttacks.ts](server/src/systems/empoweredAttacks.ts), [server/src/systems/attackCounter.ts](server/src/systems/attackCounter.ts), [server/src/systems/classMechanics.ts](server/src/systems/classMechanics.ts). Mostly signature updates to accept entity/slice views instead of `PlayerSnapshot` DTOs. `combatState` continues to be the runtime bag and is unchanged.
6. **Node-scoped helpers** — [server/src/world/nodeQueries.ts](server/src/world/nodeQueries.ts) `getNodePlayers` / `getNodeMonsters` should yield entities (via the existing `playerEntitiesInNode` / `monsterEntitiesInNode` iterators on `World`) rather than DTOs, once callers are migrated.
7. **Socket / persistence boundary** — [server/src/index.ts](server/src/index.ts) `player:move`, `player:setAuto`, `player:unlockSkill`, `inventory:equipItem`, `inventory:unequip`, `crafting:craftRecipe`, `debug:goToTestRoom`, `disconnect`, and the 30 s autosave loop all read or mutate `world.getPlayerSnapshot(socket.id)`. After system migration, these should resolve a `PlayerEntity` and use slice accessors (motion-vector assignment for `player:move`, `usesAutocombat.auto` for `player:setAuto`, etc.). [server/src/db/playerRepo.ts](server/src/db/playerRepo.ts) should grow a `saveCharacterFromEntity(db, accId, entity)` overload and `hydratePlayer` should route through `applyPlayerSnapshotDraft` on attach.

**Movement representation invariant.** Once migrated, `targetX` / `targetY` exist only inside `assemblePlayerSnapshot` / `assembleMonsterSnapshot`. Computed via `pointFromMotion(hasPosition.current, isMoving.motion)`. To stop an entity in place, assign `zeroMotion()` to `isMoving.motion`.

**Adapter-misuse guardrail.** [server/src/ecs/playerSnapshotAdapter.ts](server/src/ecs/playerSnapshotAdapter.ts) `withPlayerSnapshotDraft` is for low-frequency boundary operations only (hydrate, skill unlock, equip / unequip, respawn, test-room reset). It must not appear in per-tick hot paths or combat-pipeline listeners — they should mutate slices directly.

### Remove `playerSnapshot` / `monsterSnapshot` from `ServerEntity`
Depends on the migration above. After every system uses slices:

1. Delete the bridge `playerSnapshot?` / `monsterSnapshot?` fields from [server/src/ecs/entity.ts](server/src/ecs/entity.ts).
2. Drop `'playerSnapshot'` / `'monsterSnapshot'` from `PlayerEntity` / `MonsterEntity` in [server/src/ecs/components/player.ts](server/src/ecs/components/player.ts) and [server/src/ecs/components/monster.ts](server/src/ecs/components/monster.ts).
3. Remove `'playerSnapshot'` / `'monsterSnapshot'` from the `playerEntities` / `monsterEntities` `with(...)` queries in [server/src/world/World.ts](server/src/world/World.ts).
4. Delete `refreshPlayerSlicesFromSnapshot` / `refreshMonsterSlicesFromSnapshot` from [server/src/ecs/projection.ts](server/src/ecs/projection.ts) and the corresponding calls in `World.buildSnapshot`.
5. Replace `world.getPlayerSnapshot(id)` / `world.getMonsterSnapshot(id)` call sites with `getPlayerEntity(id)` + slice access, then delete the helpers.
6. Drop the `Object.assign(entity.playerSnapshot, draft)` bridge mirror line at the end of `withPlayerSnapshotDraft` in [server/src/ecs/playerSnapshotAdapter.ts](server/src/ecs/playerSnapshotAdapter.ts).
7. Re-run the wire-parity check at boot (already wired in [server/src/index.ts](server/src/index.ts) behind `IS_DEV`).

### Rename legacy component keys to the verb-phrase taxonomy
Server Phase 4's naming table calls for renaming the pre-existing ECS components to match the new slice taxonomy: `combatState` → `tracksCombat`, `combatAt` → `tracksEngagement`, `monsterAi` → `controlsMonster`, `knockback` → `hasKnockback`, `bossState` → `scriptsBoss`, `cadence` → `usesCadence` (merge with the wire-mirror slice), `energy` → `usesEnergy` (merge), `dot` → `appliesDots` (merge, with chill mirrors split out into `chillsTarget`), `cooldown` → `usesCooldown` (merge), `reload` → `usesReload` (merge). These were left as-is during the slice-decomposition commits to avoid a cross-cutting rename on top of the migration. Land this only after the migration above is complete; the renames are mechanical and should be one commit per group.

### Optional: Map-backed `playerById` / `monsterById` indexes
Same trade-off as the Phase 3 entry above. After Phase 4 removes the snapshot bridge, `getPlayerEntity` / `getMonsterEntity` are O(N) linear scans against `e.isPlayer.id` / `e.isMonster.id`. Still fine at ~10 players / ~50 monsters; add indexes only if profiling justifies.

---

## From Server Phase 2 — Pure Formulas / Reorg (S2–S5)

Source: [.cursor/plans/server-phase-2-shared-and-reorg_ee11d4bd.plan.md](.cursor/plans/server-phase-2-shared-and-reorg_ee11d4bd.plan.md)

### Add `category` / `iconKey` / `shape` to wire `PlayerBuff`
S4 kept the wire `PlayerBuff` DTO byte-identical for client parity. Lifting the client's id-prefix `getBuffCategory` heuristic into a server-sent descriptor field would let the client render without ever switching on id strings. Wire-format change — pair with the client refactor.

---

## Tracked separately (not cleanup)

These are explicit PRD non-goals or have their own planning documents. Listed here only so they aren't re-added to the cleanup list by mistake.

- **Client refactor** — [.cursor/design/client.md](.cursor/design/client.md) C1–C7. Runs after Server Phase 3. Removes the `PlayerState` / `MonsterState` aliases from [shared/src/index.ts](shared/src/index.ts) (S1's compat shim).
- **Netcode** — [.cursor/design/netcode.md](.cursor/design/netcode.md). Component deltas, dirty tracking. Explicit non-goal for the server ECS refactor.
- **Project priorities from [CLAUDE.md](CLAUDE.md)** — deploy (Caddy + PM2 on Hetzner), T1 balance playtest, T2 biome design, Reload T3 server logic, Cooldown Heavy T3.
- **PRD non-goals** — persistence schema changes beyond projection, new T4–T7 mechanics, balance changes, Socket.IO replacement, authentication / character select.
