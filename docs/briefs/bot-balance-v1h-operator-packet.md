# V1h — current T1 counterplay and corrected T2 acceleration

2026-09-13. Astra prepares/interprets; Luna operates only this packet.
Frozen source: `3145246a1db79f3848bef7270f6e0f205ea94bd9`.
Frozen tree: `576d0efae1d961f3733ab85800ac6c0af06875d3`.
Study file SHA256 (prepared working copy): `bb8143dd915e018b2909565d4d889311abb48a248071073bddb288489b099246`.
Record the checkout's actual file hash too if Git line-ending conversion differs;
the committed JSON values and planned arm order must match.
Assessment: [V1g findings and direction](bot-balance-v1g-assessment.md).

## Budget and preflight

13 runs, three sequential manifests, one worker and one active manifest. Worker
ceilings total four hours; hard session deadline five hours after the time
recorded before setup. Do not start a new phase with less than35 minutes left.
Finish early when done. No queue, retries, edits, extensions, fast boss retry,
balance changes, or automatic downstream experiments. No T3/T4 tests.

Use a clean isolated checkout of the exact source. Run `pnpm bot:preflight` once;
it passed during preparation with bot/server typechecks, 15 targeted suites and
experiment/experience tests. RewardMultiplier, personalPlaytestPolish and
bossVolcanoPhase5 focused tests also passed. This is not a fresh full-suite or
live gameplay claim. Resolve a preflight failure with Astra, not local edits.

Before create, verify Docker and three simultaneous empty bridge slots. Astra
parked completed V1g storage services and released only their empty networks;
per-manifest `v1h-network-preparation.json` receipts preserve IDs, mounts and
original aliases. Containers, volumes and artifacts are retained. Do not resume
those old manifests or prune historical resources. Recheck capacity now: exact
uniquely named temporary empty probes may be created and removed by ID; stop if
capacity is unavailable. Three simultaneous bridge probes passed during Astra's
preparation and all three empty probes were removed.

For each manifest verify revision/tree, image/tooling/runtime hashes, copied
host atomic-write retry, input hash, isolated25x, intended policy, workers1,
zero automatic retries, fastBossRetry=false, count and cap. Launch only the
returned exact ID once. Use create → launch → status → report → stop as needed;
never hand-edit experiment.json or state.json. Record all13 planned slots.

## A — four Cave packages, two cases each (8 × 15 minutes)

Every T1 case independently imports the original immutable Night1 kit. No output
chaining or human save import. Legacy snapshotKind=tier2-handoff is handled by
the existing explicit root-only T1 converter; do not relabel the file. Require
strict atomic entry validation at GM30/root-only, no boss clears, original +5
equipped kit and Mountain Vest+5 in inventory. The inherited catalyst residues
use historical units; retain and disclose them, not canonical economy evidence.

```powershell
$v1hRevision = '3145246a1db79f3848bef7270f6e0f205ea94bd9'
$kitSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260912t233824z-striker-campaign-night-kit-t1/runs/001-striker-campaign-night-kit-t1-intended-r01/artifacts/striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2/snapshot-b.json'
if ((Get-FileHash -LiteralPath $kitSnapshot).Hash.ToLower() -ne '1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755') { throw 'Kit input mismatch' }
pnpm experiment:create --revision=$v1hRevision --study="docs/briefs/bot-balance-v1h-cave-study.json" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --maxRunMs=900000
```

| Arm | Technique | Guards in order | Charm +5 | RP | Ready marker |
|---|---|---|---|---:|---|
| expose-wind | Expose Weakness | Second Wind | Swamp |20/22|night:cave:ready|
| dual-swamp | none | Second Wind, Cleanse | Swamp |16/22|v1g:cave-dual:ready|
| dual-cave | none | Second Wind, Cleanse | Cave |16/22|v1h:dual-cave-charm:ready|
| triple-cave | none | Second Wind, Brace, Cleanse | Cave |21/22|v1h:triple-cave-charm:ready|

All arms retain Axe, Mountain Vest, Plains Boots+5 and identical ordered Rune
rules, no stances/rites. New charm is crafted/upgraded normally; Brace is learned
normally before final configuration. Do not spend unused RP or substitute gear.
Each case has one ordinary dungeon cycle, guardians included. Record the study
planner's rotated order: expose-wind, dual-swamp, dual-cave, triple-cave,
dual-swamp, dual-cave, triple-cave, expose-wind. The pure planner validated all
13 slots without creating an experiment. No shared random seed is implied. Finish all cases even
after repeated valid losses, subject to real stop conditions below.

Compare expose-wind versus dual-swamp for abilities, dual-swamp versus dual-cave
for recovery, and dual-cave versus triple-cave for Brace. Do not attribute the
combined expose-wind/triple-cave difference to one factor. Two replicates screen
candidates; they do not establish a win-rate ranking. Readiness/preparation
timeouts count as incomplete preparation, not boss losses. Human victory is a
strategy lead; it used different movement rules and is not pooled.

## B — current Mountain check (2 × 15 minutes)

```powershell
pnpm experiment:create --revision=$v1hRevision --routes="striker-campaign-night-mountain-t1" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=2 --policies=intended --maxRunMs=900000
```

Same original kit for both. Require Mountain Vest/Swamp Charm/Axe/Boots+5,
Expose/Second Wind20/22RP and `night:mountain:ready`. One cycle each. Current
uncapped Instinct means historical Mountain success is not a current replicate.
Record charge casts, dodges/hits and available Instinct evidence; absent stack
telemetry stays absent. Do not infer endless kiting from broken range aggregates.

## C — targeted T2 progression (3 × 30 minutes)

Independent of T1 wins. No snapshot argument. Synthetic clean T2 entry, existing
routes/policies unchanged, corrected25x catalyst rewards. Striker Balanced,
Squire Heavy and Spirit Heavy respectively.

```powershell
pnpm experiment:create --revision=$v1hRevision --routes="striker-t2-progression,squire-t2-progression,spirit-t2-progression" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --entryEconomy=clean --maxRunMs=1800000
```

No bosses or T3 ascent. Validate entry from durable bot logs and record actual
builds/acquisition transitions. These legacy routes may report
templateValidation=null and treatmentValidity=not-asserted; this is expected
for this diagnostic phase only, not evidence of qualified combat treatment.
Preserve every eligibility flag. A failed explicit assertion/rejection is still
a stop. Do not generalize one class's result to the other three untested classes.

Report time to each biome, GM/upgrades, Core acquisition, last step, full block
reasons and durations (including open censored spans), deaths by monster/step,
and whether the prior catalyst gate cleared. Separate movement/fighting/farming
from catalyst waiting; overlapping durations cannot be added. Capture any
ordinary emitted Snapshot B/checkpoint and hashes without editing or launching
follow-on runs. GM72 alone does not prove all equipment is+5 or boss-ready.

## Stop rules and evidence

Worker status `failed` alone is NOT infrastructure failure. Read terminal
reason, durable summary and validity. Complete valid isolated boss deaths with
bot_partial and normal farming caps/stalls CONTINUE. Do not retry or extend.
Stop the exact active experiment for invalid entry/build/assertions, unexpected
treatment/isolation failure, unhealthy/exited server, worker exception,
missing/lost terminal evidence or supervisor failure. Wait through ordinary
finalization before classification. Preserve any already-started interrupted
slot. At session deadline stop that exact active ID and list unstarted slots.
Direct stop of one verified owned worker is reserved for a durable supervisor
fatal failure; never stop unrelated resources or DB/Redis while operating.

Write/index `docs/briefs/bot-balance-v1h-report.md`: hashes, manifest/run ledger,
all planned slots, terminal reasons, why execution continued/stopped, preparation
versus guardian versus boss timing, last/lowest player HP and boss HP, abilities,
actual removed corrosion stacks, Brace activations and available mitigation.
Do not equate activation with an effective cleanse/mitigation or attribute all
healing to Second Wind. Damage/healing totals are run-wide unless filtered.
Corroborate victory with named boss kill, attempt outcome and authoritative
boss-clear progression: Obsidian Broodmother / Crag Behemoth. Cave Sentinel and
Stone Warden are guardians. Raw kill isBoss flags/entity IDs and range/add
aggregates retain their documented limitations; do not use them for kiting or
boss-add conclusions. Preserve25x/synthetic/legacy-input evidence boundaries.

No new balance verdict from one loss. Finish this packet and return results to
Astra for prepared T2 boss selection or a targeted farm-build correction.
