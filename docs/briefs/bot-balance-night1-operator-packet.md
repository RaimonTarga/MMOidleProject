# Night 1 — T1 boss coverage, dual-Guard Swamp comparison, T2 progression

2026-09-13. Astra prepares/interprets; Luna operates this bounded overnight program.
Frozen source: `0514ad0139b7c4d6a48b3512ae496857de8f4164`.

## Authority, duration and sequence

Maximum 25 planned runs across four manifests, strictly one active worker and one
active manifest at a time. Never register these in the global cross-cohort queue
or launch the next manifest before the current one is terminal. No gameplay,
route, build, runtime, assertion or economy edits; no unplanned retries, tactics,
resource injection, guardian bypass or fast boss retry. Planned replicas are
independent cases, not retries of a failed character. Report every planned slot.

Record `sessionStartedAt` before the first create and `deadline = start + 9 hours`.
At the deadline use experiment:stop for this session's current exact ID and
report its active/queued runs as interrupted or unstarted, not gameplay failures.
Do not start a new phase with less than 35 minutes remaining. Nine hours includes
setup/build; the maximum planned run ceilings total 7h50, leaving 70 minutes for
setup and final reporting. Finishing early is allowed; do not fill unused time.

Run preflight once on the exact frozen revision before creation. For EACH phase,
verify source/tree/image, manifest/input/tooling/runtime hashes, run count, 25x
rewards, intended policy, one worker, fastBossRetry=false and the stated ceiling.
Host tooling is copied from the invoking checkout: confirm the copied runtime's
bounded atomic rename retry. On unexpected drift or infrastructure failure stop
the program; no alternate SHA, rewritten manifest, reconciliation or cleanup.

## A — Earn the missing armor upgrade once (1 run, 20 minutes)

Use the unchanged V1d final snapshot, never V1e's post-boss snapshot. Expected
SHA-256: `7917f16cd5ad24534934472a4f9a57e35d0fb40c88b21fd706dd099ea12f5f29`.

```powershell
$snapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260912t214718z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-50-24-240Z-68746475/snapshot-b.json'
if ((Get-FileHash -LiteralPath $snapshot).Hash.ToLower() -ne '7917f16cd5ad24534934472a4f9a57e35d0fb40c88b21fd706dd099ea12f5f29') { throw 'V1d snapshot mismatch' }
pnpm experiment:create --revision=0514ad0139b7c4d6a48b3512ae496857de8f4164 --routes="striker-campaign-night-kit-t1" --tierEntrySnapshot="$snapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=1200000
```

Launch only the returned exact ID, once. This restores the qualified kit and
earns Fallen Knight Plate +5 through ordinary supplier farming/upgrade, retaining
the original equipped Plains Vest/Murk Eye kit. No boss step or fresh mastery
route. The final assertion prevents completion before `night:kit-build` and
`night:kit-ready`. Require completed terminal agreement, valid profile/spawn,
Mountain Vest +5 in the final snapshot, T1/root-only/GM30 and zero boss clears.

Read the completed state's sole run `summaryPath`; the sibling `snapshot-b.json`
is the candidate input. Validate its state against the final summary and marker
events. Set `$kitSnapshot` to that exact absolute file and record its SHA-256.
It must retain the actual earned wallet and state; do not edit/relabel it. Both
phases B and C must seal this SAME file/hash and revalidate it at each spawn.

If A has a valid gameplay/preparation failure, skip B and C (record unstarted)
and proceed to independent phase D if time remains. Do not retry A or substitute
an under-upgraded kit. Any infrastructure/treatment/entry failure stops all phases.

## B — Swamp repertoire comparison (6 runs, 15 minutes each)

The user's manual playtest suggested replacing Expose with a second Guard.
Same Chaotic Axe +5, Fallen Knight Plate +5, Murk Eye +5, Fleet Boots +5;
same five movement/hazard/recovery Rune rules, no frame/stance/Rite/Core/Relic.

| Arm | Technique | Guards, in order | Total RP / budget |
|---|---|---|---|
| expose-cleanse | Expose Weakness | Cleanse | 17 / 22 |
| dual-guard | none | Second Wind, Cleanse | 16 / 22 |

```powershell
pnpm experiment:create --revision=0514ad0139b7c4d6a48b3512ae496857de8f4164 --study="docs/briefs/bot-balance-night1-swamp-study.json" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=3 --maxRunMs=900000
```

Verify sealed study arms and order: expose, dual, dual, expose, expose, dual.
Same snapshot each time, new isolated character/world. Pair IDs describe launch
blocks, NOT shared RNG seeds. Require exact final build and `night:swamp:ready`
or `night:swamp-dual:ready` before the single authored dungeon cycle. Both guards
must be attuned in the dual arm; no Technique or stale ability-targeting rule.
No tactical or repertoire changes between replicas. Continue planned replicas
after valid gameplay losses; do not automatically select a winner.

## C — Remaining T1 boss coverage (12 runs, 15 minutes each)

```powershell
pnpm experiment:create --revision=0514ad0139b7c4d6a48b3512ae496857de8f4164 --routes="striker-campaign-night-plains-t1,striker-campaign-night-forest-t1,striker-campaign-night-mountain-t1,striker-campaign-night-cave-t1" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=3 --policies=intended --maxRunMs=900000
```

Three independent cases per boss; earlier victories cannot grant later cases
power. All use Axe/Fleet Boots +5 and the unchanged five Rune rules.

| Boss | Armor +5 | Charm +5 | Technique / Guard | RP |
|---|---|---|---|---|
| Plains | Plains Vest | Plains Stone | Sweep / Second Wind | 19 |
| Forest | Plains Vest | Murk Eye | Expose Weakness / Second Wind | 20 |
| Mountain | Fallen Knight Plate | Murk Eye | Expose Weakness / Second Wind | 20 |
| Cave | Fallen Knight Plate | Murk Eye | Expose Weakness / Second Wind | 20 |

Plains Stone is upgraded from the common input using the earned wallet, as in
V1e. All target gear and final builds are asserted. Require `night:<biome>:ready`
and one ordinary attempt cycle. No boss/guardian bypass or repeated attempts.
Continue the remaining planned cases after valid encounter losses/timeouts.
These are expert-prepared candidates, not a claim of global optimality. V1e is
historical context, not an extra replica from this new common input snapshot.

## D — Six-class T2 progression screen (6 runs, 30 minutes each)

Run only when all earlier launched work is terminal (or A failed validly and B/C
were explicitly skipped). Do NOT pass `$snapshot` or `$kitSnapshot` here.

```powershell
pnpm experiment:create --revision=0514ad0139b7c4d6a48b3512ae496857de8f4164 --routes="striker-t2-progression,squire-t2-progression,apprentice-t2-progression,slinger-t2-progression,spirit-t2-progression,conduit-t2-progression" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --entryEconomy=clean --maxRunMs=1800000
```

These existing routes explicitly seed synthetic T2 entry at GM30: Striker
Balanced, Squire Heavy, Apprentice Balanced, Slinger Heavy, Spirit Heavy,
Conduit Balanced. Require profile/spawn validation. Routes farm toward GM72;
they contain NO boss attempts and do not ascend to T3. Old route descriptions
mention a T2 boss rework: that historical wording is not a claim that current
T2 content is unfinished; this phase deliberately measures progression only.

One case per class is a screen, not replication or a class ranking. Report the
actual last reached biome/mastery/build, transitions, upgrades/resource blocks,
death/recovery and no-progress cause. Distinguish a 30-minute censor from an
internal stall, invalid acquisition or inability to fight. Revisit Jungle
engagement/recovery evidence specifically; do not recycle old stall percentages.
No current T2 boss or canonical 1x economy conclusions are supported.

## Stops, evidence and morning handoff

Across every phase, failed entry/assertions, wrong builds, isolation loss,
infrastructure failure or lost evidence stop the active manifest and the program.
Preserve any next run that already started before the stop was serviced. An
ordinary death, completed loss or valid gameplay timeout is retained and does
not authorize a retry; remaining predeclared replicas may proceed as above.

Use experiment:stop for the exact current ID while its supervisor is alive.
Only after a durable supervisor-fatal event confirms death may Luna inspect the
recorded worker, verify exact ownership/worker role, and issue ONE
`docker stop --timeout 20 <verified-worker>` if still running. Never apply this
to DB/Redis or another session. No state rewrites, cleanup, global queue commands,
network/volume removal, alternative manifests or additional work.

Write/index `docs/briefs/bot-balance-night1-report.md`, maintaining a durable
session ledger of exact phase IDs, hashes, source inputs, started/deadline times,
planned/started/terminal/unstarted counts and stop reasons. For each T1 case:
record preparation validity, guardians/deaths, actual boss engagement duration,
lowest/last HP distinction, boss HP outcome, authoritative clear, ability
activations and damage/healing. The existing kill stream hardcodes `isBoss=false`:
corroborate named boss victim, attempt result and progression; never rewrite the
raw flag or count it alone. Missing altar/phase/healing-source telemetry remains
missing, not inferred. For Swamp compare all six cases, including failures;
report per-arm success counts, time/HP/deaths, Cleanse/Second Wind activation and
poison/pool pressure where observable. Do not rank arms by survivors' timing alone.

Preserve all eligibility flags and terminal agreement. Every phase uses 25x;
T1 has earned-but-accelerated input, T2 has synthetic input. Separate these from
canonical economy. Report recommended next questions and possible tuning targets
with uncertainty; do not tune. No T3/T4 work even if the program finishes early.
