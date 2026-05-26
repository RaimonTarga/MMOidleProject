# Cleanup / Tech Debt

Running list of follow-up items deferred from the server / client refactor PRDs. Each entry should have enough context to pick up cold without re-reading the originating plan.

---

## Completed

### Extract `spawning/` from `World.ts` — done
Spawning logic lives in [server/src/systems/spawning/index.ts](server/src/systems/spawning/index.ts). `World` keeps thin wrapper methods for backward compatibility.

### Remove buff descriptor casts — done
`BuffDescriptor` / `defineBuff` moved to [server/src/systems/registry/buffs.ts](server/src/systems/registry/buffs.ts) with typed `World` and `TracksCombat` in `BuffProjectionContext`. No more `world as World` or combat-state casts in descriptor bodies.

### Replace empty `MechanicTickWorld` — done
`MechanicModule` / `defineMechanic` moved to [server/src/systems/registry/mechanics.ts](server/src/systems/registry/mechanics.ts). Module `tick` bodies receive concrete `World` directly.

### Lift `BuffId` union into `shared/` — done
[shared/src/components/buffs.ts](shared/src/components/buffs.ts) exports `BUFF_IDS` and `BuffId`. Client [BuffBar.tsx](client/src/hud/BuffBar.tsx) uses exhaustive `Record<BuffId, …>` category mapping. Server derives `ServerBuffId` from `ALL_BUFFS` with a compile-time equality check in [buffSync.ts](server/src/systems/buffSync.ts).

### Normalize `durationPct` on the 4 "elapsed" buffs — done
`cooldown-channel`, `energy-ac-discharge`, `dot-frozen`, and `dot-conflag` now send remaining-time percentages matching the shared `PlayerBuff` contract.

### Networked slice taxonomy + component delta boundary — done (infrastructure)
Server Phase 4 landed the typed slice taxonomy and the old snapshot projection boundary has since been removed. `World.buildDelta` produces component `DeltaSnapshot` payloads from allowlisted networked slices stamped at attach/spawn. Vector primitives (`Vec2`, `MotionVector`, `pointFromMotion`, `advanceMotion`) live in [shared/src/systems/spatial.ts](shared/src/systems/spatial.ts); networked slice shapes live in [shared/src/components/networkedSlices.ts](shared/src/components/networkedSlices.ts); client-facing view composition lives in [shared/src/protocol/views.ts](shared/src/protocol/views.ts). Snapshot round-trip parity checks were removed once hydrate, persistence, archetype sync, and monster spawn became component-native.

### Component-native snapshot-removal prep — done
Internal server work no longer round-trips through `PlayerSnapshot` / `MonsterSnapshot`: archetype slice sync reads components directly, `characters` persists one JSON blob per long-lived player slice, player hydrate attaches slices directly, and monster spawning stamps `MonsterEntity` directly. The legacy `PlayerSnapshot`, `MonsterSnapshot`, and `NodeSnapshot` DTOs have been removed; component deltas are tracked in [.cursor/design/netcode.md](.cursor/design/netcode.md).

### Rename legacy component keys to the verb-phrase taxonomy — done
The pre-existing ECS keys now use the verb-phrase taxonomy: `tracksCombat`, `tracksEngagement`, `controlsMonster`, `hasKnockback`, `scriptsBoss`, `usesCadence`, `usesEnergy`, `appliesDots`, `chillsTarget`, `usesCooldown`, and `usesReload`. Archetype behavior is gated by component presence.

---

## From Server Phase 3 — Miniplex ECS (S6–S13)

Source: [.cursor/plans/server-phase-3-miniplex-ecs_ac48b095.plan.md](.cursor/plans/server-phase-3-miniplex-ecs_ac48b095.plan.md)

### Add Map-backed entity indexes only if profiling justifies
`world.getMonsterEntity(id)` and `world.getPlayerEntity(id)` are O(N) linear scans over miniplex queries. With ~50 monsters / ~10 players this is fine. If profiling shows hot lookups (likely candidates: combat-tick target resolution, `getMonsterCombatState` calls per pipeline event), add optional `monsterById: Map<string, MonsterEntity>` / `playerById: Map<string, PlayerEntity>` indexes maintained alongside the queries via miniplex `onEntityAdded`/`onEntityRemoved` hooks.

---

## From Server Phase 4 — Snapshot Slice Decomposition (s14-3, s14-5)

Source: [.cursor/plans/server-phase-4-snapshot-slices_f3c9a8d2.plan.md](.cursor/plans/server-phase-4-snapshot-slices_f3c9a8d2.plan.md)

This phase is complete. Server systems, socket handlers, persistence, archetype sync, and monster spawning operate on typed slices directly. The snapshot DTO layer has been removed; `state:sync` and `node:delta` now send component `DeltaSnapshot` payloads.

**Movement representation invariant.** `targetX` / `targetY` exist only inside `assemblePlayerSnapshot` / `assembleMonsterSnapshot`. They are computed via `pointFromMotion(hasPosition.current, isMoving.motion)`. To stop an entity in place, detach the `isMoving` component.

**Entity formula guardrail.** Player stat recalculation and skill-unlock checks are entity-native wrappers around shared pure formulas. They are for low-frequency boundary operations only (hydrate, skill unlock, equip / unequip, respawn, test-room reset). Per-tick hot paths and combat-pipeline listeners should mutate slices directly.

### Remove `playerSnapshot` / `monsterSnapshot` from `ServerEntity` — done
The bridge fields and snapshot draft helpers are gone. `ServerEntity` lists component slices only; `World.buildSnapshot` assembles legacy wire DTOs from those slices.

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
