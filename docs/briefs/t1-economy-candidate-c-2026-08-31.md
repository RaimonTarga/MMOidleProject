# T1 Economy Candidate C — implementation and overnight cohort

**Date:** 2026-08-31
**Status:** implemented, verified locally, overnight cohort launched.
**Predecessor evidence:** [reports/t1-economy-cohort-deep-dive-2026-08-31.md](../../reports/t1-economy-cohort-deep-dive-2026-08-31.md)
**Scope:** economy only. No class stat, monster, boss, technique, path-effect or bot
combat-behaviour change was made.

Candidate id stamped in every run header: `t1-economy-candidate-c-2026-08-31`.

---

## 1. Exact code and economy changes

| # | Change | Files |
|---|---|---|
| 1 | T1 `+5` essence costs cut 25% (catalyst asks untouched) | `shared/src/data/recipes/{plains,forest,cave,mountain,swamp}.recipes.ts` |
| 2 | Catalyst mint threshold is now per **biome tier**; T1 = 150 kill-weight (was the global 100) | `shared/src/config/gameConfig.ts` (`CATALYST_PROGRESS_PER_UNIT_BY_TIER`, `catalystProgressPerUnit()`), `server/src/systems/player/progression/rewards.ts` |
| 3 | Catalyst progress no longer scaled by the dev reward multiplier | `server/src/systems/player/progression/rewards.ts` |
| 4 | Wallet snapshots at every economically meaningful instant | `bot/src/telemetry/events.ts`, `recorder.ts`, `summary.ts`, `route/executor.ts`, `botRun.ts` |
| 5 | Explicit failed-predicate block reasons (replaces `{blocked:1}`) | `bot/src/route/conditions.ts`, `bot/src/route/executor.ts` |
| 6 | `upgrade` events carry `fromLevel` alongside `newLevel` | `bot/src/telemetry/events.ts`, `executor.ts`, `summary.ts` |
| 7 | Candidate configuration stamped into every run header | `bot/src/telemetry/events.ts` (`EconomyCandidate`), `botRun.ts` |

Bot JSONL schema version bumped `2 → 3`.

**Retained deliberately:** the 2× reward setting for biome/mastery XP and essence
income. No move back to 1× or 1.5×.

**Untouched deliberately:** initial craft costs, `+1`–`+4`, recipe unlock
requirements, ability/rune costs, Global Mastery gates, catalyst *costs*
(every relevant T1 `+5` still asks for exactly 1 catalyst), the node-modifier
reward premium, and every tier above T1.

---

## 2. The +5 cost transformation

Rule applied uniformly, no hand-tuning: `new = round(old × 0.75 / 5) × 5`
(JavaScript `Math.round` semantics, the project's nearest-5 convention).

| Item | Essence | Old +5 | New +5 | Catalyst (unchanged) |
|---|---|---:|---:|---|
| chaotic-axe | red | 205 | **155** | swarming 1 |
| cave-vest-t1 | red | 260 | **195** | swarming 1 |
| cave-charm-t1 | red | 100 | **75** | — |
| cave-boots-t1 | red | 70 | **55** | — |
| flash-rapier | green | 205 | **155** | alacrity 1 |
| forest-vest-t1 | green | 200 | **150** | alacrity 1 |
| forest-charm-t1 | green | 100 | **75** | — |
| forest-boots-t1 | green | 60 | **45** | — |
| heavy-hammer | blue | 205 | **155** | heavy 1 |
| mountain-vest-t1 | blue | 205 | **155** | heavy 1 |
| mountain-charm-t1 | blue | 100 | **75** | — |
| mountain-boots-t1 | blue | 70 | **55** | — |
| iron-broadsword | yellow | 100 | **75** | — |
| plains-vest-t1 | yellow | 200 | **150** | alacrity 1 |
| plains-charm-t1 | yellow | 75 | **55** | — |
| plains-boots-t1 | yellow | 60 | **45** | — |
| ashbrand-blade | purple | 200 | **150** | fortified 1 |
| swamp-vest-t1 | purple | 200 | **150** | fortified 1 |
| swamp-charm-t1 | purple | 100 | **75** | — |
| swamp-boots-t1 | purple | 70 | **55** | — |

All 20 T1 items. Cohort total across the four clean roots' `+5` paths falls by
roughly a quarter of the post-mastery essence tail — the interval the deep-dive
identified as the remaining grind.

The per-item "same total (N)" comments in the recipe files now describe the
*pre-candidate* total; each of the five T1 files carries a header note saying so.

---

## 3. Catalyst acquisition: old versus new

### The formula

```
weight_per_kill = round( (monster.catalystWeight ?? monster.essenceReward)
                         × modifierRewardMult(nodeModifier, biomeTier)
                         × debugRewardMultiplier )          ← OLD
weight_per_kill = round( (monster.catalystWeight ?? monster.essenceReward)
                         × modifierRewardMult(nodeModifier, biomeTier) )  ← NEW

mint when Σ weight ≥ CATALYST_PROGRESS_PER_UNIT = 100                     ← OLD
mint when Σ weight ≥ catalystProgressPerUnit(biomeTier), T1 = 150         ← NEW
```

Two changes, both tier-level rules — no per-family exceptions.

1. **Decoupled from the dev reward multiplier.** The multiplier's purpose is to
   skip essence/mastery *farming*. A catalyst is a discovery gated on
   node-modifier exposure; multiplying its rate turns "I found a catalyst" into
   "I have another stack". The node-modifier premium (`modifierRewardMult`) still
   applies — that is real economy, not a debug knob.
2. **T1 mints at 150 kill-weight instead of 100** (×1.5 scarcer). Every other
   tier keeps 100 and is free to build a more elaborate catalyst economy later.

Net effect versus the analysed 2× cohort: **÷3** on T1 catalyst acquisition, at
an unchanged number of kills.

### Why 150, from the cohort telemetry

Measured per run over the 12 clean-root runs of the 2× batch
(`bot/runs/t1-day-x2-economy-2026-08-31/batch-2026-08-31T05-45-38-866Z/`), the
catalyst weight a run banks per family is essentially its essence earned under
that node modifier — because `catalystWeight` defaults to the monster's base
essence reward and both take the same modifier premium. A representative Striker
run banked, at 2×: fortified 1587, heavy 539, swarming 358, alacrity 202,
and minted 15 / 5 / 3 / 2 at a threshold of 100.

Projected forward (same route, same kills, halve for the decoupling, then divide
by 150 rather than 100):

| Family | 2× cohort earned/run | Spent/run | **Candidate C projected** |
|---|---:|---:|---:|
| Alacrity | 1–2 | 1 | **≈ 0.7** |
| Swarming | 3 | 1 | **≈ 1.2** |
| Heavy | 4–6 | 1 | **≈ 1.8** |
| Fortified | 15–20 | 0–1 | **≈ 5.3** |

Every family a route actually *spends* lands in the target band of 0–2 units when
its `+5` becomes eligible, with Alacrity — already the tightest family, first
minted at 43–64 min against a spend at 44–66 min — arriving just-in-time or
requiring a short targeted Alacrity-node farm. That is the intended
"I found a catalyst, what does this unlock?" identity.

### The family that does not fit, documented rather than special-cased

Fortified stays the outlier at ≈5 units. The cause is **route exposure, not the
rate**: the measured Striker run spent 28 minutes in Fortified nodes against 4
minutes in Alacrity nodes (Fortified is the safest modifier — same damage, more
armour — so the long mastery grind naturally lands there), a 7× asymmetry. T1's
node-modifier distribution is close to even, so this is a property of where the
routes choose to grind.

Driving Fortified down to ~2 would need roughly ÷4 across the board, which puts
Alacrity at ~0.25/run and makes a mandatory multi-minute Alacrity farm a
guaranteed feature of every run — the overshoot failure mode the brief names. Per
the brief's instruction, this is **documented rather than solved with
family-specific exceptions**: one simple tier-level rule, and Fortified's residual
is a route-shape artifact for a later route or modifier-placement decision.

---

## 4. Instrumentation added

### Wallet snapshots — `wallet-snapshot` event

Full `essences`, `catalysts`, **`catalystProgress`** (partial kill-weight banked
toward the next catalyst — the only direct read on the mint rate), `biomeLevels`,
`globalMastery`, `itemUpgrades` and `nodeId`, at:

| `reason` | When |
|---|---|
| `run-start` | first authoritative snapshot of the run |
| `milestone` | every route milestone — includes each `<biome>-maxed`, `all-biomes-maxed`, `gear-plus-5`, and each `<item>-plus-5` |
| `block-start` / `block-end` | both ends of every `blocked-on-resource` span |
| `pre-craft` / `pre-upgrade` | immediately before each craft/upgrade spend, tagged with the target (e.g. `plains-vest-t1+5`) |
| `run-end` | T1 completion |

Also mirrored into `summary.json` at `economy.walletSnapshots`.

### Explicit block reasons — `blocked-on-resource.blockReasons`

The generic `{blocked:1}` is gone. Every span now carries a typed list of the
predicates that were actually failing, re-evaluated against the same shared
`checkUpgrade`/recipe gates the server uses:

- `{kind:"essence", essence, current, required, missing}`
- `{kind:"catalyst", family, current, required, missing}`
- `{kind:"globalMastery", current, required, missing}`
- `{kind:"biomeLevel", biomeGroup, current, required, missing}`
- `{kind:"recipeLocked", recipeId}`
- `{kind:"prerequisite", detail}`

plus `gateReason`, the authority's own rejection string. The flat `missing` map
is retained (derived from the reasons) so existing dashboards keep working.
This makes essence-only / catalyst-only / mixed block time directly measurable
instead of inferred from the farm node the bot chose.

### Upgrade timing

`upgrade` events now carry `itemId`, **`fromLevel`**, `newLevel`, `atMs`,
`essenceSpent`, `catalystsSpent`, and node context — plus the `pre-upgrade`
wallet snapshot immediately before the spend.

### Run header

Every run header carries `economyCandidate`, read from the **live** shared data
at connect time rather than restated by hand:

```json
{ "id": "t1-economy-candidate-c-2026-08-31",
  "catalystProgressPerUnitT1": 150,
  "catalystsScaledByRewardMultiplier": false,
  "t1Plus5EssenceCosts": { "chaotic-axe": 155, ... } }
```

A build that does not carry the candidate cannot silently produce a run that
claims it.

---

## 5. Tests performed

`pnpm typecheck` clean (all packages plus the bench config). `pnpm test`
**118/118 passed**.

New: `bot/src/telemetry/economyInstrumentation.test.ts`
- every T1 `+5` essence cost, read from the live `RECIPE_DATABASE`, against the
  expected 25%-cut table — and that all 20 T1 items are covered, so a new one
  cannot slip past unpriced;
- every T1 `+5` still asks for exactly 1 catalyst;
- `+1`, `+4` and the initial craft cost are byte-identical to before;
- `catalystProgressPerUnit(1) === 150`, `(2) === 100`, base still 100;
- `upgradeBlockReasons` names essence colour/current/required and catalyst
  family/current/required exactly, and never re-emits a generic `blocked` marker;
- a Global-Mastery wall and a locked recipe each surface as their own reason;
- a wallet snapshot captures both wallets, `catalystProgress`, and its context.

Rewritten: `server/test/rewardMultiplier.test.ts` — now asserts catalyst progress
is **exactly equal** at 1× and 10× (not merely smaller), for both an ordinary kill
and a boss kill, while essence and biome XP still scale by ~the multiplier; and
that the node-modifier premium still reaches catalysts. **Mutation-checked**:
restoring `* debugMult` in the reward path fails it with
`catalyst progress must ignore the debug multiplier entirely (got 840 at 10x vs 80 at 1x)`.

Updated: `server/test/catalystRekey.test.ts` (threshold now tier-aware; fixture
kill count raised so it still exercises both the mint and the carried remainder),
`bot/src/harness.test.ts` and `bot/src/telemetry/requiredTelemetry.test.ts`
(fixtures for the new recorder method and header field).

Verified from the live database rather than by inspection: the `+5` cost rule,
the T1 catalyst threshold, and the run header's `economyCandidate` block as
written into the smoke run's JSONL.

---

## 6. Smoke run

**Not balance evidence.** A single 15-minute Striker slice against the live dev
server, run only to confirm the pipeline. Artifact:
`bot/runs/smoke-candidate-c-2026-08-31/striker-t1-intended-2026-08-31T21-46-25-561Z-906c1a0d/`
(`timed-out` by design at `maxRunMs=900000`; reached tier 1, GM 10, 1 death).

What it confirmed:

- **Wallet snapshots appear**, 30 of them, covering every reason:
  `run-start, milestone, pre-craft, block-start, block-end, pre-upgrade, run-end`.
  `summary.json` carries them at `economy.walletSnapshots`.
- **Explicit block causes appear.** Ten `blocked-on-resource` spans, each with a
  typed reason list — e.g. `craft:iron-broadsword` →
  `[{kind:"essence", essence:"yellow", current:4, required:10, missing:6}]`, and
  `ability:second-wind` → an essence shortage *and*
  `{kind:"biomeLevel", biomeGroup:"forest", current:1, required:2, missing:1}`.
  No `{blocked:1}` was emitted.
- **Catalyst progress behaves correctly, verified numerically.** By t=690s the
  run had earned **458** essence on Fortified nodes at the 2× multiplier, and
  held exactly **1 minted Fortified catalyst + 79 carried progress = 229**
  kill-weight. 458 / 2 = 229 to the unit: catalyst weight is the **undoubled**
  reward, and it minted at **150**, not 100. Both halves of the catalyst change
  are confirmed live, not just in unit tests.
- **Crafting and upgrading still work.** 9 crafts and 4 upgrades succeeded, each
  `upgrade` carrying `fromLevel`/`newLevel` (`iron-broadsword 0→1`,
  `plains-vest-t1 0→1`, …) with its `pre-upgrade` wallet snapshot.
- **The run header carries the candidate**, read from live shared data:
  `catalystProgressPerUnitT1: 150`, `catalystsScaledByRewardMultiplier: false`,
  and the full 20-item `t1Plus5EssenceCosts` map.


---

## 7. Overnight cohort

**Location:** `bot/runs/t1-candidate-c-2026-09-01/batch-2026-08-31T22-02-05-159Z/`
**Batch id:** `batch-2026-08-31T22-02-05-159Z`
**Launch log:** `bot/runs/t1-candidate-c-2026-09-01-launch.log`
**Started:** 2026-08-31 22:02:05Z · **git revision:** `721d2b57` (plus this
candidate's uncommitted working-tree changes; the server was hot-reloaded onto
them at 21:24:37Z, before both the smoke run and the cohort)

```
pnpm bot:batch --controlled=false --parallel=true --roundRobin=true   --count=5 --staggerMs=600000   --routes=striker-t1,squire-t1,apprentice-t1,conduit-t1   --rewardMultiplier=2 --maxRunMs=10800000   --out=bot/runs/t1-candidate-c-2026-09-01
```

**20 runs: 5 replicates each of `striker-t1`, `squire-t1`, `apprentice-t1`,
`conduit-t1`**, `intended` policy, round-robin so replicate order is interleaved
across classes and no class correlates with a time-of-night slot. Same route ids,
route versions, policy, execution mode (`uncontrolled-parallel`) and 10-minute
launch stagger as the analysed 2× cohort, so the two are directly comparable.
Expected wall clock ≈ 4.5–5 h (last bot launches at +190 min).

Spirit and Slinger were **not** run. Their known boss/route execution failures
would not inform economy tuning, and including them would have added ~2.5 h and
two more concurrent bots to the shared world.

Every run header records `economyCandidate.id = "t1-economy-candidate-c-2026-08-31"`
together with the live threshold and the full +5 cost map.


---

## 8. Caveats for tomorrow's interpretation

1. **The world is shared and uncontrolled**, as it was for the 1× and 2× cohorts.
   Contention and ambient population are not held constant, and both prior cohorts
   showed a measurable spread in `otherPlayersSeen`. Compare distributions, not
   single runs.
2. **Ambient population differs from the 2× cohort by construction.** That cohort
   ran six routes × 3; this one runs four × 5. Same bot count (18 vs 20) and same
   stagger, but the mix of concurrent classes is different, so cross-cohort
   `contestedFraction` is not exactly like-for-like.
3. **Two changes moved together.** The +5 essence cut and the catalyst
   rate/decoupling ship in the same candidate, so a runtime change cannot be
   attributed to one of them from the aggregate alone. The new instrumentation is
   what separates them: essence-only, catalyst-only and mixed block time are now
   directly measurable per span, so read the attribution from `blockReasons`
   rather than from total runtime.
4. **Fortified will still look abundant** (projected ≈5 units/run). That is the
   documented route-exposure asymmetry in §3, not a failure of the rate. Judge
   the catalyst change on Alacrity, Swarming and Heavy — the families a route
   actually spends — and on the wallet held at each `pre-upgrade` snapshot.
5. **The projection in §3 is derived from the 2× cohort's kill counts**, which will
   themselves shift slightly downward because the cheaper +5 needs less farming.
   Expect the observed catalyst totals to come in a little under the projection.
6. **The cohort runs against uncommitted working-tree changes.** `git revision`
   in the headers reads `721d2b57`; `economyCandidate` in the header, not the
   revision, is the authoritative record of what the run executed.
7. **The smoke run is not evidence.** It timed out by design at 15 minutes and
   reached only GM 10; it says nothing about runtime, the post-mastery tail, or
   whether the catalyst wait lands in the right place.
8. **Deaths and boss time are unchanged inputs.** No combat, monster, boss or
   route behaviour was touched, so any death/boss-time movement between cohorts
   is world noise, not a candidate effect.

