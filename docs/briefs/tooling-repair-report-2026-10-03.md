# Tooling repair report — 2026-10-03

Completed on 2026-10-04 in `../mmo-lin-w2a`, branch `fix/tooling-repair`, based on
`develop` at `aae854cf`. Initial `pwd` / `git status` confirmed the requested worktree,
a clean checkout, and `feat/cc-fx` before creating the branch. Five ordered item commits;
this report and the evidence accompany item 5. Leave unmerged for the designer; no push.

## 1. Legacy bot routes — `7d63e47e`

T2 acquisition now resolves weapons to their live lineage and emits `unlockForm`, then
`wearForm` for adoption; acquire-only plans unlock without wearing. Other slots use
plain `craft`. Removed upgrade steps from T1 plans, standalone variants and campaign
builders, and replaced upgrade-level completion/assertion predicates with item ownership.
T1's builder inherits the corrected gear plans; T2's upgrade loop is gone. The optional
`striker-decisions-t1` experiment is retained as **retired**, with its one-line reason:
its before/after-boss upgrade decision no longer exists. Execution fails immediately with
that reason instead of silently running a different experiment.

Pins: `t1Routes.semantic`, `t2Routes.semantic`, all five `campaign*.test.ts` scripts,
`liveRouteActions` (all registered routes, including nested steps), `policy/choices`,
and `t1EconomyCompatibility`: ten scripts passed across the final focused runs.
`pnpm typecheck` passed before commit.

Limit: this is route-action migration and semantic validation, not live route completion.
The existing unlock executor still enforces mastery, shards and boss capstones. Old entry
snapshots are not proven to fund those gates; missing capstones remain an explicit
prerequisite failure. No wallets, boss policies or live balance were changed to bypass it.

## 2. Report tools — `65b67b4d`

DPS/eHP tools use full-power item base stats without upgrade arguments, clamps, columns,
or labels. Removed duplicate upgrade variants and the eHP entry/geared duplication.
`pnpm dps:report` and `pnpm ehp:report` both generated their HTML successfully.

Pins: `reportTools.test.ts` runs both real T1 Markdown generators and verifies no upgrade
columns/levels remain. Its DPS input rows match `weaponCurve.test.ts`: Poison Dagger
(`ashbrand-blade`) 18, Chaotic Axe 29, Flash Rapier 12, Heavy Hammer 38, Iron Broadsword 19.
Both tests passed, as did `pnpm typecheck` before commit. eHP intentionally holds the weapon
slot empty, so weapon-attack pins apply to DPS; eHP checks cover its actual armor/charm
and progression output. Generated historical report files were restored after validation;
the tool changes and reproducible regression are committed.

## 3. Excluded Conduit test — `c03e8e43`

Replaced `import.meta.dirname` with CommonJS-compatible `__dirname`, removed
`conduitPlayerBodies.test.ts` from the exclude list, and removed the stale exclusion count.
`pnpm test -- conduitPlayerBodies` and the full `pnpm typecheck` passed before commit.
No client source was changed.

## 4. Hitbox bake — `d7a222ea`

The existing default command writes both the development DB cache and client shadows.
That conflicts with the brief's `client/**` ban. Added `--artifact-only` to the same CLI
and an optional shadow-write switch to the existing artifact baker. Ran:

```text
pnpm bake:hitboxes --artifact-only
```

Committed the generated `server/src/hitbox/baked-hitboxes.json`, the source runtime
loader's default location. The production build still generates its dist artifact through
the existing build CLI. The JSON was not hand-edited. Default development/build behavior
is preserved; this run made no DB or client-shadow write.

Pins: `bakedHitboxArtifact.test.ts` checks the atlas hash and hydrates nonempty runtime
geometry for grass-kite, bramble-pod, rockback-ram, brood-spiderling and fen-hexer.
That test, `pnpm test:spatial` (both suites), and `pnpm typecheck` passed before commit.

## 5. Node shard accounting

Both measurement callbacks now count normal kills by the victim node's `nodeShard`,
exclude boss kills, and save `killsByShard`. These are kill counts, not synthetic wallet
balances or reward-multiplied payout totals. Lane-node metadata reads the authored node
shard; deduplication includes that shard so identical resolved spawn cycles cannot merge
different currencies. Family-contract favored-lane lookup reads the node as well, and its
report includes a node-shard kill table. Family and node data files were not changed.

Pins: `benchNodeShards.test.ts` invokes the shared on-kill counter for a real blended node's
minority body whose family shard differs from the node shard, and checks boss exclusion.
It, `lineageMaterials.test.ts`, and `compositionPairs.test.ts` passed. A callback type
annotation was corrected after typecheck caught an unnecessary second parameter; it has
no runtime effect and did not restart the benchmark.

### Single bounded contract-bench run

```powershell
$env:FAM_TIERS='1'
$env:FAM_BANDS='1'
$env:FAM_KILLS='3'
$env:FAM_CAP_MS='60000'
$env:FAM_SEEDS='101009'
$env:FAM_REPORT='family-contracts-t1-smoke'
$env:LANE_HITBOX='<worktree>/server/src/hitbox/baked-hitboxes.json'
pnpm --filter @mmo-idle/server exec tsx --conditions=development bench/familyContracts.ts ../reports/tooling-repair-2026-10-03
```

The bench retains its existing process-local forced pure-family encounters. This is a
one-seed, three-kill smoke check of table generation and accounting, not sufficient
balance/adoption evidence. No retry, reseed or second bench run was performed.

The run completed successfully: 15 family nodes across Plains, Forest,
Mountain, Cave and Swamp; 124 measured rows; 372 kills;
0 censored rows; 0 rows with refused purchases.
Every row's shard-count sum equals its kill count, and every paid shard matches its host
node's reported currency. Wall time: 105.9 seconds.

Evidence: [table](../../reports/tooling-repair-2026-10-03/family-contracts-t1-smoke.md)
and [raw rows](../../reports/tooling-repair-2026-10-03/family-contracts-t1-smoke.json).
The generated header names base HEAD `d7a222ea`; the measurement used the item-5 working
changes committed alongside this report. The later callback annotation fix was type-only.

Final item-5 `pnpm typecheck` passed, including bench and test configs.

## Scope and delivery

No banned paths changed: `bot/src/routes/tutorialRoutes.ts`, `shared/src/tutorial/**`,
`client/**`, `shared/src/data/lineages/**`, or `server/src/systems/combat/**`.
No family/node data edits, dependency installation, dev server launch, process termination,
push, merge or deployment. Related tests and full typecheck were run per item; the entire
runtime test suite was not run. The branch remains for the designer's merge.
