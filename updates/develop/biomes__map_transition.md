# Biome Map Transitions & Collision

## Player-facing changes

- Moving between nodes now plays a smooth Link's-Awakening-style map slide instead of a hard cut, with adjacent nodes pre-rendered and lightly fogged so you can peek into neighboring areas at the screen edges.
- Forest biomes are now scattered with trees that act as real obstacles: players, monsters, and minions walk around trunks instead of through them, and click-to-move/auto-path route around them.
- Movement feels more reliable near obstacles and node edges, with smoother camera follow and fewer stalls when entering a new node.

## Technical notes

- Added a shared collision package (`shared/src/collision/`) covering nav grid generation, A*-style pathfinding, slide resolution, static regions, gates, node adjacency, and projection/query helpers, with a `collision.test.ts` suite wired into `pnpm test:spatial`.
- Deterministic per-node tree layout and baked trunk hitboxes live in `shared/src/world/trees.ts`; regenerate hitboxes via `pnpm --filter @mmo-idle/server bake:tree-hitboxes` (`server/src/hitbox/bake/treeHitbox.ts`).
- Server movement, AI targeting/priority, auto-target, AoE, and summoner AI now consult the collision index (`server/src/world/collision/CollisionIndex.ts`) and path motion (`server/src/systems/world/pathMotion.ts`).
- Client gains a map-transition/peek-camera/neighbor-scene rendering stack (`mapTransition.ts`, `peekCamera.ts`, `neighborScenes.ts`, `sceneCoords.ts`, `collisionLayer.ts`, `nodeGates.ts`) plus path prediction and obstacle-aware client movement.
- Added scene-coordinate and peek-bounds helpers and new tuning constants (`MAP_SLIDE_MS`, `NEIGHBOR_FOG_ALPHA`, etc.) to `shared/src/config/gameConfig.ts`.

## Validation

- `pnpm typecheck`
- `pnpm test:spatial` (spatial hitbox + collision suites)
