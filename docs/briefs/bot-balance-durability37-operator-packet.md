# Durability37 — mob integration regression

Prepared 2026-09-18. Manual Sonnet operator. **PREPARED, NOT LAUNCHED.** Execute once,
sequentially. No subagents, retries, adaptive source/build changes, production patches, commits
or pushes. Two **independent** blocks, 74 observations.

## Purpose

This packet is a **regression of one integrated candidate**, not another selection search.

| Block | Question | Runs |
|---|---|---:|
| J `jungle-ladder` | On the adopted Jungle ladder, does representative encounter duration now RISE across T2 → T3 → T4 instead of falling? | 54 |
| I `mob-integration` | Does every other changed biome-tier family behave sanely in authored source, having only ever been measured under an overlay? | 20 |

Neither block gates the other. All evidence is synthetic: `synthetic=true`,
`economyEligible=false`. Three seeds (J) and one seed (I) are directional, not certification.

## The one structural fact about this packet

**Durability37 installs NOTHING.** Every package it exercises is authored source as of the
consolidated adoption at the frozen revision below. There is no control arm, no HP grid, and no
overlay to restore. `ready.json` `hpTreatment` must be **empty in all 74 observations** — a
non-empty treatment means a retired overlay came back to life, and the preflight fails on it.

## Frozen identity

| Item | Value |
|---|---|
| Frozen revision | `FILL AT LAUNCH — the consolidated adoption commit on develop` |
| Frozen tree | `FILL AT LAUNCH — git rev-parse HEAD^{tree}` |
| Definitions hash | `FILL AT LAUNCH — emitted by the runner at this revision` |
| Hitbox artifact | `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json` |
| Hitbox sha256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Trial | `durability37` |
| Simulation | 100 ms fixed step, natural ecology, window per block below |

**The definitions hash WILL change** from Durability36's `80f64f6e…`, because 37 species moved
into authored source at this revision. That is expected and is the whole point of the packet. The
hitbox hash is unchanged: no geometry moved.

`assertDurability37Definitions()` pins the adopted Jungle ladder, the three ladder nodes and
their shared modifier, every Block I family's node and pool membership, and the absence of the
superseded Durability34 values. It aborts on drift.

## The baseline this packet sits on

The consolidated adoption wrote 37 species into `shared/src/data/monsters/*.monsters.ts`:
the retained Forest/Volcano, Graveyard, Desert, Mountain, Tundra and Trench packages, plus the
**new** command-center Jungle duration ladder accepted from Durability36 Block J.

Three things about that baseline the report must not misdescribe:

1. **The Jungle T4 values are 10000 / 12000, not 2900 / 3400.** Durability34's package was
   superseded before it reached source; Durability36 Block J measured the primary lineage's
   duration *falling* (10.95 → 9.95 → 6.55 s) and the adopted correction is coarser and
   role-based. The `apex-silverback` figure is **not** a factor applied to 2900.
2. **Two nested shields diverge from what their own experiment measured.** `magma-brute`'s Molten
   Guard and `magma-salamander`'s Obsidian Shell are now held at their pre-adoption ABSOLUTE
   budgets (280 and 813.12), because the adoption applied the Durability22 coupling rule
   uniformly. Durability15/D23 never scaled them, so those two species are **weaker** here than in
   the runs that selected their HP. Block I's Volcano families exist partly to observe this.
3. **`cragback-rhino`'s soft cap was deliberately NOT rescaled.** `capPct` is a fraction of the
   monster's own pool, and the retained installer never touched it. Its absolute clip threshold
   therefore moves 275 → 1650, so the soft cap clips far less often. Report it if it shows; do not
   "fix" it mid-run.

## Block J — the Jungle ladder, re-measured (54)

Six roots × T2/T3/T4 × one node per tier × three seeds.

| Tier | Node | Modifier | Primary lineage member | Adopted HP |
|---|---|---|---|---:|
| 2 | `node-t2-jungle-03` | dominion | `jungle-ape` | 1200 (unchanged) |
| 3 | `node-t3-jungle-03` | dominion | `silverback` | 3200 |
| 4 | `node-t4-jungle-03` | dominion | `apex-silverback` | 10000 |

Cells are **Durability36's, re-identified** — same nodes, same six roots per tier, same tier-legal
builds, same skill-path depth, same gear. The seeds `81013`, `83003`, `85009` are **reused
deliberately**: same seeds, same builds, changed monsters is what makes this a regression. Label
it as reuse. It is **not** fresh independent evidence, and equal seed numbers across tiers still
do not make geometries or trajectories identical.

The shared `dominion` modifier is re-verified from `NODE_BIOMES` at launch, not inherited from
Durability36 and not inferred from the `-03` suffix.

### What to report, and what not to

**Body clean-TTK is primary for the ladder.** Report per-species centres, root and seed spread,
unresolved targets, HP regain, survival, recovery, and actual mechanic-specific exposure. Do not
substitute mixed-species episode medians for body TTK — they are a different measurement, and
Durability36's episode figures contained zero-duration observations that need a definition check
before anyone calls them pull-to-clear time.

The working intent is roughly **11 → 15 → 23 s** for the primary lineage and **4 → 5 → 6 s** for
the fast lineages. Those are *projections* from Durability36 centres scaled by HP, assuming
roughly unchanged effective output. Real pressure, recovery, mechanics and target selection can
invalidate them. A miss is a measurement, not a failure to be corrected mid-run.

More HP exposes the existing Apex ramp and Constrict cadence for longer. **Test survival and
recovery; do not assume Durability36's zero deaths carry over.** Report `emerald-constrictor` as
its own T4 control-predator role, and the fast bodies separately. Do not demand that every fast
T4 body exceed every durable T3 body.

Squire and Conduit slow tails are expected to remain visible. Report them; do not treat unequal
class performance as a ladder failure.

## Block I — bounded checks of the other integrated packages (20)

Ten families × two roots × one seed. `sensitive` is the root with prior adverse evidence or the
one most exposed to that family's change; `comparator` contrasts it. **All six roots appear across
the collection — not every root in every family.**

| # | Family | Node | Modifier | Sensitive | Comparator | Window | What it observes |
|---|---|---|---|---|---|---:|---|
| 1 | T2 Forest | `node-t2-forest-03` | dominion | apprentice | striker | 300 s | `ancient-wolf` 1575/22, `ironwood-golem` 945/25 |
| 2 | T3 Volcano | `node-t3-volcanic-03` | swarming | squire | striker | 300 s | `magma-brute` 3000/116 + Molten Guard held at 280; `ash-slinger` 84 |
| 3 | T4 Volcano | `node-t4-volcanic-03` | swarming | conduit | striker | 300 s | `obsidian-tortoise` 4488; `magma-salamander` 5808 + Obsidian Shell held at 813.12 |
| 4 | T4 Graveyard | `node-t4-graveyard-03` | swarming | slinger | spirit | **900 s** | leader up 5702, escorts down 1235/1901/1616/950 |
| 5 | T2 Desert | `node-t2-desert-03` | dominion | spirit | striker | 300 s | `sand-scorpion` and `stone-basilisk` 1365 |
| 6 | T4 Desert | `node-t4-desert-03` | dominion | squire | slinger | 300 s | `dune-basilisk` **9006** (the retained selection, not 4503), `sand-viper` 4029, `dune-tyrant` 6952 |
| 7 | T2 Mountain | `node-t2-mountain-03` | dominion | striker | apprentice | 300 s | `granite-titan` 54 (both cuts), `stone-eagle` 60, `peak-archer` 72 |
| 8 | T4 Mountain | `node-t4-mountain-03` | dominion | apprentice | conduit | 300 s | `granite-mammoth` 13800 + ward held at 287.5; `cragback-rhino` 6600 + un-rescaled soft cap |
| 9 | T4 Trench | `node-t4-trench-03` | swarming | squire | spirit | **600 s** | 17640 / 16800 / 16800 — the longest bodies in the game |
| 10 | T4 Tundra | `node-t4-tundra-03` | dominion | slinger | conduit | 300 s | `glacial-direbear` 4884 + barrier 268.62 AND self-shatter 170.94 |

**Tiers here are the ones the biome pools actually author, not the labels the adoption manifest
carried.** Four had drifted: `obsidian-tortoise` and `magma-salamander` are **T4** Volcano (the
manifest said T3), and `sand-scorpion` and `stone-basilisk` are **T2** Desert (the manifest said
T4). The manifest has been corrected; the packet uses the resolved tiers.

T3/T4 Jungle is excluded because Block J covers it. T1 Mountain is excluded because
`t1MountainPressureAdoption.test.ts` already guards it in current source and Durability35/36
already measured it.

Modifiers differ between families. That is fine — these are **independent spot checks, not a
ladder**, so cross-family modifier parity is not required and must not be asserted in the report.

One seed per family is a spot check. **It is not fresh balance certification**, and the retained
historical evidence is what actually supports these packages. Report what happened; escalate only
a gross, unambiguous problem.

### T2 Mountain carries a named open exception

Family 7 sits on the **open-exception** T2 Mountain Striker attrition case: at the selected
relief, Durability29's extraction showed control 6/6 deaths versus candidate 3/6, i.e. halved,
not resolved. A Striker death there is **expected and dispositioned**, not a new finding. Report
it against that exception; do not reopen it, and do not propose a second enemy nerf from one seed.

## Scheduling and budgets

Order **J → I**, sequentially. Independent allocations: a local problem in one never consumes the
other's. A global identity failure (`trial`, `revision`, `definitionsHash`, `hitboxesSha256`)
writes `stopped.json` and stops the batch.

| Scope | Limit |
|---|---|
| Per observation | 120 s wall, 2 GiB RSS (runner-enforced) |
| Block J | 35 min watchdog |
| Block I | 45 min watchdog — it carries the 600 s and 900 s windows |
| Batch | 3 h ceiling; 4 h hard assert |

**Never raise a limit mid-run.** No retries, no recycled observations, no added comparator, no
adaptive numerical change. A budget is a safety limit, not a quota to consume or a promised
duration. The navigation watch runs on Block J as existing protection, not a new study.

Keep synthetic/economy labels, identity checks, terminal outcomes and partials. Reuse the
existing resource limits; do not build a new scheduler or reporting framework.

## Commands

```bash
# Preflight (qualify + pilot for both blocks, semantic checks on the derived reports)
node scripts/durability37-preflight.mjs <NEW-preflight-root> <hitboxes.json>

# Execute once
node scripts/durability37-run.mjs \
  --out=<NEW-output-root> \
  --revision=<frozen revision> \
  --tree=<frozen tree> \
  --definitions=<definitions hash> \
  --hitboxes=<hitboxes.json> \
  --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
```

The run script refuses a dirty tree, a reused output root, a revision mismatch and a hitbox-hash
mismatch. `runs` is derived per block (`cells × seeds`), so Block I's single seed is 20 runs and
not silently expected to be 60.

## Qualification already performed

At the preparing revision, by the preparing agent:

- `pnpm typecheck` green across all packages and `typecheck:bench`.
- `mobAdoptionIntegration.test.ts` green: all 37 adopted stats as absolute values, the fields the
  adoption was required not to move, all five absolute defence budgets after runtime rounding,
  every retired overlay proven inert, tiers resolved from live biome pools, and the Jungle
  role ladders monotonic. Mutation-checked: it fails when the ward coupling or an adopted HP is
  reverted.
- `durability37Matrix.test.ts` green: 18 + 20 cells, seed reuse pinned, Block J proven identical
  to Durability36's ladder apart from cell identity, ten families each covered once with all six
  roots, per-family windows, and the no-op installer proven not to move the database.
- `durability36Matrix.test.ts` and `t1MountainPressureAdoption.test.ts` rebased and green.

## What this packet does not do

- No reward edits. ECON-1 stays after the integrated baseline and is not measured here.
- No boss observations. Those belong to the separate boss starter packet.
- No class tuning, and no demand for equal TTK across roots.
- No adoption decision. Both blocks report; the command center decides.
