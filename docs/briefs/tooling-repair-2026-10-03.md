# Tooling repair — brief (2026-10-03, overnight, designer-run Astra session)

Five mechanical repairs left by the progression rework (review findings and the
course-correction report's "not exercised" list). All are test-pinned and none is a design
call. **Worktree `../mmo-lin-w2a`**: `pwd` and `git status` first (must be clean; it is on
`feat/cc-fx`, merged), then `git checkout -b fix/tooling-repair develop`. Never `pnpm
install`, never push, strip CR only on files you touch, never kill processes by image name,
one dev server per bot arm (ports 4301+, see docs/bot-harness docs). **Do not touch**:
`bot/src/routes/tutorialRoutes.ts`, `shared/src/tutorial/**`, `client/**`,
`shared/src/data/lineages/**`, `server/src/systems/combat/**` — the verbs-that-fire run is
live on those. Related tests + `pnpm typecheck` before every commit; one commit per item.

1. **Legacy bot routes.** Since the +N ladder and the evolve path were retired on every slot
   (design §24.5), about 76 T2 routes evolve a weapon and now stall with a named reason, and
   about 135 upgrade steps are skipped (course-correction report, "not exercised"). Make the
   route builders (`bot/src/routes/t2RouteBuilder.ts`, `t2GearPlans.ts`, `t1GearPlans.ts`,
   `t1RouteBuilder.ts`) emit the live equivalents: a weapon T2 form is reached through the
   lineage gate steps (`unlockForm` + `wearForm`, see how `tutorialRoutes.ts` does it, read
   only); a non-weapon T2 item is a plain `craft`; upgrade steps are dropped. Every route in
   `bot/src/routes/*.ts` must pass the existing semantic tests (`t1Routes.semantic.test.ts`,
   `t2Routes.semantic.test.ts`, `campaign*.test.ts`) with no step that references a retired
   action. Where a route's intent cannot be expressed any more, mark it `retired` with the
   reason in one line rather than deleting it.
2. **Report tools.** `tools/dps-report.ts` and `tools/ehp-report.ts` clamp every item to +0
   now that `itemUpgrades` is gone; they should read the item's base stats as full power
   (design §23) and drop their upgrade columns/flags. `pnpm dps:report` and `pnpm
   ehp:report` run clean and their output for the five T1 weapons matches
   `weaponCurve.test.ts`'s pinned numbers.
3. **The excluded test.** `server/test/conduitPlayerBodies.test.ts` is listed under
   `exclude` in `server/tsconfig.test.json`; the comment says the excluded tests import
   client source, but this one likely fails on `import.meta.dirname` under CommonJS
   (TS1343). Make it compile under the test tsconfig (`fileURLToPath(import.meta.url)` or
   `__dirname` the way sibling tests do), remove it from the exclude list, and make sure it
   runs green under `pnpm test -- conduitPlayerBodies`.
4. **Hitbox bake.** `pnpm bake:hitboxes` has not run since five T1 sprites were added
   (grass-kite, bramble-pod, rockback-ram, brood-spiderling, fen-hexer). Run it, commit the
   artifact it produces where the pipeline expects it (read `server/src/hitbox/` and the
   script header to find out; never hand-edit), and run `pnpm test:spatial`.
5. **Contract bench vs per-node shards.** `server/bench/lineage/laneMeasure.ts` and the
   family-contract bench still assume the dead mob's family pays the shard. Since the
   course-correction run every kill pays the NODE's shard (`nodeShard` in
   `shared/src/world/nodeBlends.ts`). Update the bench's shard accounting to read the node,
   add a test that a kill in a blended node is counted under the node's shard, and re-run the
   contract bench once on the five T1 biomes to confirm it still produces a table. Do not
   change any family or node data.

Finish with `docs/briefs/tooling-repair-report-2026-10-03.md`: per item what changed, the
test that pins it, and anything you could not do mechanically. Leave the branch unmerged;
the designer's session merges it.
