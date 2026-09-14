# Night3 - T4 Colossus Heart comparison and remaining farming coverage

Prepared 2026-09-15. **Not launched. User launches Luna; no subagents.**
Read CLAUDE.md. This packet authorizes operating ONE frozen batch of12 cases,
not autonomous redesign, balance changes or follow-on experiments. Astra planned
and qualified the treatments; Luna operates, preserves evidence and reports.

## Purpose and current state

V1z passed Jungle and Desert: 43/61 observation kills, Jungle sampled HP1.0,
Desert minimum sampled HP0.802, both recovered; final defenses+2 at GM132.
Together with V1y, Mountain/Jungle/Desert have diagnostic farming candidates.
No T4 boss has been attempted yet. Swamp T3 remains open for later human playtest.
Six other T3 bosses have diagnostic wins. Noncanonical ancestry remains intact.

User explicitly confirmed **Colossus Heart** as the max-energy relic used with
Voidwalker. We will measure its tradeoff rather than assume it wins everywhere.
Four Mountain boss screens (two per arm), plus paired15-minute farming screens
in Tundra, Trench, Graveyard and Volcano. Each case starts from the exact SAME
V1z returned checkpoint and buys its own relic if assigned. A death terminates
only that case; remaining predeclared cases still run. No progress/gear/seals are
combined across cases, no winner-selected checkpoint or mid-batch upgrade.

## Frozen source, input and qualification

Revision `f6e94e3ebae10d07f1b600cce3f84046600120a1`.
Tree `295317f42c6dca389e8b374632beff8a3bdf5630`.
All route versions1.0.0. Input is the final V1z +2 returned capture.

```powershell
$night3Revision = 'f6e94e3ebae10d07f1b600cce3f84046600120a1'
$night3Input = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t210709z-voidwalker-jungle-desert-t4-v1/runs/001-voidwalker-jungle-desert-t4-v1z-intended-r01/artifacts/voidwalker-jungle-desert-t4-v1z-intended-2026-09-14T21-09-00-375Z-253ef36e/checkpoint-v1z-plus2-prepared-returned.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $night3Input
```

SHA256 `e6b357f51cadb344307e56aa7d43eb247b8755bf5284ba91e9342711942ae844`.
Boundary `v1z-plus2-prepared-returned`; state hash
`32ec146718e8e4635d624639155b560dc9a2bd93712e50012c6750ef023a8afb`.
Input revision `146ad0ced0d521e7313005578ab45e7b4ff1c461`.
Explicit-current-revision restore, unchanged definition hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
Keep RESTORED_PROGRESSION_CHECKPOINT, SYNTHETIC_TIER_ENTRY and
NON_CANONICAL_REWARD_MULTIPLIER ancestry/eligibility flags. Reward1x does not make
these canonical economy/combat samples. Never edit input or invent progression.

`server/scripts/night3Preflight.ts` verified exact SHA/persistent restore,
Voidwalker/range/+2 equipment, empty relic slot, actual-wallet craft/equip through
normal handlers, runtime max-energy change and shared profile calculation,
all12 builds, both directions of every path and actual Mountain dungeon.
Setup-only, zero ticks; no generated gameplay input or granted resources.
Artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/night3-preflight-qualified-20260914.json`.
Bot/diagnostics TypeScript and relic/core integration tests passed; diff check
clean. Full suite and live Night3 have not run. No gameplay values changed.

## Fixed arms and equipment

Common input: T4, GM132, Mountain24/Jungle18/Desert18, Voidwalker/ranged Wisp,
currentSkillTier4, skillPoints0. HP389/barrier265 after normal recovery.
Cinderlash T3+5, Titan's Keep T4+2, Fortress Heart T4+2, Desert Boots T2+5,
Accelerant. No relic in control. No further gear upgrades or skill unlocks.

Colossus arm: ordinary craft `relic-colossus-heart`, equip, assert equipped,
configure travel and recover before ready capture. Mountain24 gate already met.
Cost3300 blue and10 heavy catalysts; actual input has14545 blue and155 heavy.
Every fresh Colossus case has the full original wallet; costs are not cumulative
across replicas. No catalyst farming, reconstruction or debug grants.

Qualified profile at T4:

| Attribute | Empty relic control | Colossus Heart |
|---|---:|---:|
| Max energy | 200 | 280 |
| Base gain per hit before Voidwalker acceleration | 20 | 14 |
| Full discharge multiplier | 6 | 8 |

The relic ratings are frequency-30%, potency+40%. These are qualified parameters,
not measured DPS or a guaranteed improvement. Early execute, acceleration and
monster durability affect the outcome. The user's attack-frequency strategy
remains Cinderlash/Accelerant/Frenzy; range selection stays energy-range-far.

## Exact case order

| # | Route ID | Objective | Relic |
|---:|---|---|---|
| 1 | night3-mountain-control-r1 | Mountain T4 dungeon, one attempt | none |
| 2 | night3-mountain-colossus-r1 | Same, independent replica | Colossus |
| 3 | night3-mountain-control-r2 | Second control replica | none |
| 4 | night3-mountain-colossus-r2 | Second Colossus replica | Colossus |
| 5 | night3-tundra-control | Tundra15-minute farming | none |
| 6 | night3-tundra-colossus | Same paired candidate | Colossus |
| 7 | night3-trench-control | Trench15-minute farming | none |
| 8 | night3-trench-colossus | Same paired candidate | Colossus |
| 9 | night3-graveyard-control | Graveyard15-minute farming | none |
| 10 | night3-graveyard-colossus | Same paired candidate | Colossus |
| 11 | night3-volcanic-control | Volcano15-minute farming | none |
| 12 | night3-volcanic-colossus | Same paired candidate | Colossus |

Use count1 for these12 UNIQUE routes. Do not use count2, which doubles the batch.
The boss replicas are predeclared independent trials, not retries after failure.
Keep arm order; do not skip a Colossus case because its control died or vice versa.
Two boss replicas and one farming window per arm are exploratory, not statistical
balance proof. Random encounters/routes need not be identical across arms.

## Builds and encounter rationale

Travel: V1v Defensive38RP, Sweep/Hamstring; Second Wind, Brace, Cleanse, Break Free.
Existing Avoid Enemies/Fight Back travel rules, Step Back, Keep Distance,
Avoid Hazards and recovery remain. Travel can still incur fights.

Mountain/Tundra/Trench measurement: V1v Offensive37RP, Frenzy/Hamstring;
Second Wind, Brace, Cleanse, Break Free. Mountain has four Granite Mammoth
Stone Wardens before Iron-Crest Titan (19499 base HP,228 attack). Step Back and
spacing address charge; Earthshatter/fault lines follow a landed charge, so
report specific evidence before claiming mechanics fired. A guardian failure
leaves boss viability unmeasured. One Mountain4 seal does not advance to T5;
T4 requires five distinct seals. No T5 assertion, unlock or continuation.

Tundra: Hamstring/Desert Boots support kiting against pursuit; Cleanse/Break Free
are retained for Chill/control. It is still a high-risk ecology and biome-effect
screen, not a guarantee that the T3 solution transfers unchanged.
Trench: antiheal bite, committed pressure attacks and durable targets justify
Cleanse/Brace and movement. No phantom AoE/DoT treatment is assumed.

Graveyard/Volcano measurement: Offensive35RP, Frenzy/Sweep/Hamstring;
Second Wind/Cleanse (V1w Jungle repertoire). Sweep supports groups, Hamstring
spacing, Cleanse plague/control. Brace/Break Free are deliberately absent in
this fixed candidate. Graveyard mixes direct hits, plague and support creatures;
Volcano has swarm/Heat risks. Keep the same armor/core/boots and rune logic in
both relic arms. No operator substitutions or changing Heat/Chill values.

## Paths, boundaries and observation

Every node below has prefix `node-t4-`; S means sanctuary. All hops verified
adjacent both ways. Each case returns by its exact reverse path.

| Target | Path | Target modifier |
|---|---|---|
| Mountain dungeon | S, mountain-05, mountain-04, mountain-03, mountain-01, mountain-dungeon | dungeon |
| Tundra | S, mountain-05, tundra-05 | heavy |
| Trench | S, trench-05 | fortified |
| Graveyard | S, trench-05, graveyard-04, graveyard-05 | fortified |
| Volcano | S, trench-05, graveyard-03, volcanic-05 | fortified |

Mountain approach avoids Tundra. Graveyard and Volcano necessarily use the
specified Trench/Graveyard transit here; classify an approach death by the actual
node and do not call it a target-biome farming failure. No alternate path search
or rerouting by the operator. Exact waypoints are authored in the route.

Each case captures `<route-id>-ready` after paid preparation and normal rest,
then approaches/configures its fixed measurement build. Boss attempts include
normal guardian clear and altar activation, maxAttempts1. Farming uses an
elapsedMs0 predicate plus observeForMs900000, requiring15 minutes alive and auto
enabled in the exact target node. It keeps working at the mastery cap and does
not require full HP while fighting. XP may accrue normally but is not a gate.

Return, center movement and ordinary rest precede `<route-id>-returned` capture.
Files are `checkpoint-<boundary>.json`. Retain every ready/returned capture and
its hash. Do not normalize earned mastery away, merge states, select a winner
for a later case, resume from intermediate state or add an upgrade after GM rises.
A return failure leaves handoff incomplete while preserving measured combat.

## Batch bounds and launch

Single sealed experiment, one worker,12 cases, smoke-isolated1x, intended policy,
maxRun30 minutes PER CASE, first-death stop, automaticRetries0 and fastBossRetry
false. Farm observation cap17 minutes; boss attempt cap12 minutes; travel cap3
minutes per hop. Global per-run cap takes precedence. At most6 hours of case run
budgets. Overall session ceiling8 hours including setup/reporting; require at
least6h30m remaining before launch. Finish early when all cases are terminal;
never create filler work to consume the night.

```powershell
$night3Routes = @(
  'night3-mountain-control-r1', 'night3-mountain-colossus-r1',
  'night3-mountain-control-r2', 'night3-mountain-colossus-r2',
  'night3-tundra-control', 'night3-tundra-colossus',
  'night3-trench-control', 'night3-trench-colossus',
  'night3-graveyard-control', 'night3-graveyard-colossus',
  'night3-volcanic-control', 'night3-volcanic-colossus'
) -join ','
pnpm experiment:create --revision=$night3Revision "--routes=$night3Routes" --tierEntrySnapshot=$night3Input --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=1800000
```

Before launch verify exact frozen source/tree/input,12 distinct cases in order,
one worker, count1, no retries,1x and caps; record image ID/hash. Dirty invocation
is allowed only with dirtyWorkingTreeIncluded=false. Do not launch a malformed
manifest (especially accidental count2 or PowerShell comma splitting).

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# After supervisor and all cases are terminal:
pnpm experiment:release --id=<returned-id>
```

The supervisor queues cases sequentially and continues after terminal case
failures. Let it handle gameplay deaths/timeouts; preserve failures and continue
the fixed matrix. On detecting invalid restore/build/purchase, wrong definition
hash or infrastructure/capacity failure, stop the batch with experiment:stop,
then report/release after terminal. Do not repair/relaunch or repeat failures.
If the overall deadline is reached, stop and mark remaining cases unrun.
The supervisor may already have started the next case before an operator detects
a failure; record that honestly. No promise of atomic fail-fast tooling.

No subagents, balance changes, player-tool bypasses, manual combat, extra runs,
winner selection, or open-ended autonomous work. No need for Astra to supervise
or wake up. Luna should rely on the sealed supervisor and existing progress
artifacts, use bounded waits and avoid constant full-log polling. Report material
failure/completion; do not generate repeated narration of unchanged state.

## Resource hygiene

Before launch record UTC time, free C: capacity, running containers and their
memory, plus Docker/WSL host working sets separately. Repeat at terminal release;
use periodic compact resource snapshots only if diagnosing a material change.
Prior workers used roughly183-198MiB; WSL's roughly1->3GiB observed growth is a
separate scope and not proof of a leak. No competing experiment worker. Existing
768m worker memory limit remains. Do not raise concurrency to fill the night.

Verify all scoped workers/services terminal and network released; preserve
artifacts/checkpoints/volumes and shared mmo-gamedb/logdb/redis. Already-released
is expected. No global prune, destructive cleanup, Docker restart or RAM changes.
Actual resource errors stop the batch; no arbitrary6GB approval gate. Include
release record and leftover scoped-container states in the report.

## Report and morning decisions

Write/index `docs/briefs/bot-balance-night3-report.md`. Begin with a12-row matrix:
arm, ready/approach/guardian/measurement/return status, observation duration or
boss combat duration, kills, death/stall cause, actual failure node, returned
capture and resource validity. Then compare relic arms WITHOUT selecting a
balance winner from a single sample. Empty/unreached windows are not losses
against the target boss/biome. Keep partial and unrun cases explicit.

Verify common input hash/definitions, paid relic3300blue/10heavy only where
assigned, empty relic controls, maxEnergy200/280, retained range, fixed+2 gear
and no upgrades/unlocks. Capture SHA/state hashes and ancestry separately for
all returned states. No combining independently earned seals/mastery.

Boss proof: named Iron-Crest Titan kill + victorious attempt + mountain:4 marker;
raw isBoss may be false and is insufficient alone. Separate guardians from actual
boss combat and return; report phase/mechanic claims only if supported.
Farm proof: actual alive/auto-enabled15-minute window, kills by target/modifier,
attacker concurrency, direct/DoT pressure, actual HP samples, barrier observations
when available, Cleanse/Hamstring/Sweep/Frenzy/Guard/movement evidence. Separate
approach, farming and return damage/kills; do not sum overlapping aggregate times.
Report Heat/Chill behavior and recovery/debuff carryover only when logged.

Do not invent TTK, per-hit, discharge or early-execute events: recent runners did
not emit these. Kill throughput is not per-target TTK. Missing mechanic evidence
is a limitation, not absence of the mechanic. Sparse/zero encounters makes a
window survival-only. Record environment/seed differences as confounders.

If Mountain succeeds, accept sampled T4 boss viability for that package and plan
other bosses after review. Farming successes expand the coverage map; failures
get controller/build/biome review, with human advice where unclear. A relic
failure alongside a control success warrants further investigation, not an
immediate nerf. Preserve the user's later Swamp T3 playtest and the downstream
mobs -> items -> classes -> canonical1x economy sequence. Propose balance changes
only; none may be applied overnight. Stop after reporting and release.

Handoff: "Operate docs/briefs/bot-balance-night3-operator-packet.md exactly:12
independent sequential cases, empty relic versus Colossus Heart, four Mountain
boss attempts and eight15-minute farming screens; preserve failures, report and
release. No subagents, adaptive changes, retries or follow-on experiments."
