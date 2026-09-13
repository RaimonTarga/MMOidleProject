# V1f — atomic entry validation and interrupted T1 coverage

2026-09-13. Astra prepares and interprets; Luna operates. See the
[Night 1 assessment](bot-balance-night1-assessment.md) for evidence and scope.
Frozen revision: `9488d2715f1f5cd65f09a69e7c9ec6f6070884c0`.
This is the old combat baseline plus entry instrumentation repair. Concurrent
boss mechanic/evolution changes are excluded. Do not claim current-version
balance acceptance from these runs.

## Limits and prerequisites

13 planned runs, three sequential manifests, one worker/active manifest at a
time. No global queue. Hard session ceiling 3h30 from before first create,
including setup/reporting; planned worker ceilings total 2h36. Stop early when
finished; no extra work. Do not create another phase with under 25 minutes left.
At the deadline stop this exact active experiment and report interrupted and
unstarted slots separately from gameplay failures.

Run `pnpm bot:preflight` on the exact clean frozen revision first. Docker's Linux
engine must be running; it was unavailable during Astra's preparation. Confirm
capacity for three isolated bridge networks before creating experiments. Luna
may create three uniquely named temporary empty bridge networks simultaneously
and remove only those exact probe networks afterward. Record IDs and outcome.
If the daemon or capacity check fails, report the block and stop. Do not prune,
disconnect or remove historical resources, start another experiment or change
Docker configuration. No alternate source SHA or inclusion of dirty files.

For each create, verify revision/tree/image, manifest/input/tooling/runtime
hashes, copied host atomic-write retry, isolated mode, 25x, one worker, intended
policy, fastBossRetry=false, automatic retries zero, run count and time cap.
Launch only the returned exact ID once. Use the unchanged snapshot below for
EVERY run in EVERY phase; do not chain phase A outputs or earlier boss rewards.

```powershell
$kitSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260912t233824z-striker-campaign-night-kit-t1/runs/001-striker-campaign-night-kit-t1-intended-r01/artifacts/striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2/snapshot-b.json'
if ((Get-FileHash -LiteralPath $kitSnapshot).Hash.ToLower() -ne '1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755') { throw 'Night 1 kit snapshot mismatch' }
```

Input remains earned-but-accelerated T1, GM30, root-only, no boss clears. The
legacy snapshotKind is not permission to synthesize a T2 frame or relabel state.
All original canonical/eligibility taints remain.

## A — repeat the exact earned entry (3 runs, 2 minutes each)

```powershell
pnpm experiment:create --revision=9488d2715f1f5cd65f09a69e7c9ec6f6070884c0 --routes="striker-campaign-night-kit-t1" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=3 --policies=intended --maxRunMs=120000
```

The input already owns Mountain Vest +5; the existing upgrade step should be
satisfied without farming. Require all three completed, strict profile/spawn
validation, `night:kit-build`, `night:kit-ready`, final +5 armor assertion and
zero boss attempts. No first-success shortcut, healing loop, threshold relaxation
or repeated profile application. A timeout, acquisition attempt or failed check
stops the program for diagnosis. These are entry checks, not balance evidence.

## B — complete the Swamp comparison (6 runs, 15 minutes each)

Only after all A cases pass:

```powershell
pnpm experiment:create --revision=9488d2715f1f5cd65f09a69e7c9ec6f6070884c0 --study="docs/briefs/bot-balance-night1-swamp-study.json" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=3 --maxRunMs=900000
```

Require order expose, dual, dual, expose, expose, dual. Same Axe +5, Mountain
Vest +5, Swamp Charm +5, Plains Boots +5 and ordered Rune rules for both arms.
Expose Weakness + Cleanse costs 17/22 RP; no Technique with Second Wind + Cleanse
costs 16/22. Do not spend the remaining RP or alter conditions. Require each
arm's exact build and `night:swamp:ready` / `night:swamp-dual:ready` before its
one ordinary dungeon cycle. Continue predeclared cases after valid losses;
no retries or automatic winner selection. Do not pool Night 1's two valid cases
into V1f success fractions; show historical results separately.

## C — remaining T1 coverage (4 runs, 15 minutes each)

After B terminates without infrastructure/treatment failure, including valid
gameplay losses:

```powershell
pnpm experiment:create --revision=9488d2715f1f5cd65f09a69e7c9ec6f6070884c0 --routes="striker-campaign-night-forest-t1,striker-campaign-night-mountain-t1,striker-campaign-night-cave-t1,striker-campaign-night-plains-t1" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=900000
```

One independent probe per boss, each from the same original kit. Existing routes
use Expose/Second Wind (20 RP) for Forest/Mountain/Cave, Sweep/Second Wind
(19 RP) for Plains. Forest/Plains wear Plains Vest; Mountain/Cave wear Mountain
Vest. All wear Swamp Charm except Plains, which upgrades/equips Plains Charm
through ordinary actions. All gear is +5 with Axe and Plains Boots unchanged.
Require `night:<biome>:ready`, exact gear/build assertions, then one ordinary
dungeon cycle. No bypasses, extra attempts or strategy changes. One success
demonstrates possibility for that candidate; it does not establish reliability.

## Stops and report

Any invalid entry/build, missing reset-view acknowledgement, isolation failure,
supervisor failure or lost evidence stops the active manifest and program. Use
`experiment:stop` with the exact ID. If a subsequent case starts before the stop
is serviced, preserve it as interrupted. Do not weaken checks or rewrite state.
After a durable supervisor-fatal event only, verify the exact worker's ownership
and permit one `docker stop --timeout 20 <verified-worker>` if necessary. Never
stop storage or unrelated containers. No cleanup except the owned empty capacity
probes above. Valid boss losses and timeouts allow the other predeclared cases.

Write/index `docs/briefs/bot-balance-v1f-report.md`. Maintain a durable phase/run
ledger, hashes, input provenance, session/deadline times, counts and stop reasons.
Terminal records and never-started slots can overlap; report that explicitly.
For every boss case record readiness, deaths, guardians, attempt duration versus
boss duration, player versus boss HP, authoritative boss-clear progression,
ability activations and damage/healing with their measurement scope. Separate
last HP from lowest sampled HP. Preserve the raw kill stream's hardcoded false
boss flag; corroborate named boss kill, attempt victory and progression instead.
Do not invent missing buff/source/phase or healing attribution.

Compare all six Swamp slots, including invalid/interrupted/unstarted outcomes.
Report per-arm successes among valid attempts and the complete dispositions;
do not rank only survivors by time. No balance edits, T2/T3/T4 work or extra runs.
Next current-version work must first freeze the concurrent mechanic repairs.
T3/T4 low TTK remains an open balance issue, not a known broken-mechanics claim.
