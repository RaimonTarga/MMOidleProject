# V1g — Plains coverage, Cave corrosion comparison, T2 progression

2026-09-13. Astra plans/interprets; Luna operates only this packet.
Frozen source: `d836321279ef3fa4927f293326a5483928f54378`.
Gameplay is unchanged from V1f; the new Cave route changes only its declared
ability package. Use this packet from the campaign docs checkout.

## Program and evidence boundaries

13 runs across three sequential manifests, one worker and one active manifest.
No global queue, automatic retries, fast boss retry, edits or unplanned work.
Hard session deadline: 5h30 after the time recorded before first create,
including setup/reporting. Worker ceilings total 4h45. Do not open a new phase
with under 35 minutes left. Stop this exact active experiment at the deadline;
report interrupted/never-started slots separately from gameplay failures.

Run preflight once on the exact clean frozen revision. Before any create verify
Docker and three simultaneous empty bridge slots. Unique temporary capacity
probes may be created and removed by exact ID after verifying they remain empty;
do not remove historical networks or storage. Stop on failed capacity rather
than pruning. For every manifest verify source/tree/image/input/tooling/runtime
hashes, copied host atomic-write retry, isolated mode, 25x, one worker,
intended policy, zero automatic retries, fastBossRetry=false, count and cap.
Launch only the returned exact ID, once; never rewrite a manifest or state.

### Mandatory outcome classification

**Do not stop because worker phase/status is `failed`.** Read the exact terminal
reason, summary and eligibility before deciding. A complete, entry-valid,
treatment-valid, isolated summary with `bot_partial` and one authored boss death
is a valid loss: record it and CONTINUE the other planned cases. This includes
Cave losses. Valid farming timeouts/stalls also continue after classification.
Do not extend their budgets or retry them. A pure `failed` status is not proof
of a supervisor or infrastructure failure.

Stop for invalid entry/build/assertions, treatment/isolation failure, server
exit/unhealthy, worker exception, missing/lost summary or evidence, or supervisor
failure. If a worker is still finalizing, wait for its terminal artifact within
the normal supervisor lifecycle; do not misclassify a transient phase. If the
next slot starts before a justified stop is serviced, preserve it as interrupted.
Use experiment:stop for this exact active ID. Only after a durable supervisor-
fatal event may one verified owned worker be stopped directly with
`docker stop --timeout 20`; never stop DB/Redis or unrelated resources.

## A — restore the interrupted Plains question (1 run, 15 minutes)

No preparation cohort. Every T1 case imports the SAME original Night 1 kit:

```powershell
$kitSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260912t233824z-striker-campaign-night-kit-t1/runs/001-striker-campaign-night-kit-t1-intended-r01/artifacts/striker-campaign-night-kit-t1-intended-2026-09-12T23-41-10-399Z-56ff9ea2/snapshot-b.json'
if ((Get-FileHash -LiteralPath $kitSnapshot).Hash.ToLower() -ne '1313455c04593386f0bd4e0479fb33dec594bc09b01253381eb5b42f211b6755') { throw 'Kit input mismatch' }
pnpm experiment:create --revision=d836321279ef3fa4927f293326a5483928f54378 --routes="striker-campaign-night-plains-t1" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=900000
```

Require strict atomic entry validation, ordinary Plains Charm upgrade/equip,
all +5 gear assertions, Sweep/Second Wind (19/22 RP), `night:plains:ready`,
then one normal dungeon cycle. No imported boss clears or synthetic frame.
Do not use A's output for B. Valid death/timeout still permits B and C.

## B — Cave survival/damage comparison (6 runs, 15 minutes each)

```powershell
pnpm experiment:create --revision=d836321279ef3fa4927f293326a5483928f54378 --study="docs/briefs/bot-balance-v1g-cave-study.json" --tierEntrySnapshot="$kitSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=3 --maxRunMs=900000
```

Sealed order: expose-wind, dual-guard, dual-guard, expose-wind, expose-wind,
dual-guard. Pair blocks rotate order; they are not shared RNG seeds.

| Arm | Technique | Guards in order | RP | Ready marker |
|---|---|---|---:|---|
| expose-wind | Expose Weakness | Second Wind | 20/22 | `night:cave:ready` |
| dual-guard | none | Second Wind, Cleanse | 16/22 | `v1g:cave-dual:ready` |

Both use Axe +5, Mountain Vest +5, Swamp Charm +5, Plains Boots +5, identical
ordered Rune rules and the same immutable kit input. No additional upgrades,
rule edits or spending unused RP. Each gets one ordinary dungeon cycle, no
guardian bypass. Require exact arm-specific build and readiness. All six cases
run even if one arm repeatedly dies, unless a real stop condition occurs.
Do not pool V1f's single Cave death into the six new cases.

Record Cleanse activations and actual removed `plating-shred` stacks, if emitted,
alongside Second Wind, boss outcome/HP, deaths and encounter time. Missing effect
telemetry stays missing. Do not assume every Cleanse activation removed corrosion
or every heal came from Second Wind. Compare all slots, not survivors alone.

## C — six-class T2 progression screen (6 runs, 30 minutes each)

Proceed after B terminates without infrastructure/treatment failure even if
neither Cave build wins. This phase is independent of T1 boss success and uses
synthetic clean T2 entry. Do NOT pass a T1 snapshot argument.

```powershell
pnpm experiment:create --revision=d836321279ef3fa4927f293326a5483928f54378 --routes="striker-t2-progression,squire-t2-progression,apprentice-t2-progression,slinger-t2-progression,spirit-t2-progression,conduit-t2-progression" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --entryEconomy=clean --maxRunMs=1800000
```

Profiles are Striker Balanced, Squire Heavy, Apprentice Balanced, Slinger Heavy,
Spirit Heavy, Conduit Balanced. Validate profile/frame/build at entry and normal
route acquisition transitions. Existing routes farm toward GM72; they contain
no boss attempts or T3 ascent. Record final biome/mastery/build/gear, upgrades,
resource blocks, deaths/recovery and last progress. Investigate Jungle engagement
from current evidence rather than quoting historical failure rates. Distinguish
the 30-minute ceiling from internal stall and invalid build acquisition.
One case per class is a screen, not a class ranking or canonical economy study.

## Reporting and completion

Write/index `docs/briefs/bot-balance-v1g-report.md`. Keep a durable manifest/run
ledger with hashes, immutable inputs, source, elapsed/capped times, every planned
slot, terminal reason and evidence classification. Explicitly state why execution
continued after each valid death or stopped after a real failure. Preserve all
eligibility/25x/synthetic-entry flags; never label this 1x economy evidence.

For T1 corroborate named boss kill, authoritative boss-clear progression and
attempt result. Expected bosses: Tusked Razorback (Plains), Obsidian Broodmother
(Cave). Forest Sentinel, Stone Warden and Cave Sentinel are guardians. The raw
kill flag remains hardcoded false and entity IDs are not catalogue type IDs.
Report boss-combat versus total-attempt time; player HP versus boss HP; last
versus lowest sampled HP. Damage/healing totals are run-wide unless explicitly
filtered. Current range/add aggregates include non-boss periods and the range
metric omits hitbox reach: exclude them from claims of boss kiting failure or
boss add pressure. Preserve raw values with limitations if reported.

No balance edits or T3/T4 tests. Keep low TTK in T3/T4 flagged for later tuning;
do not relabel their repaired boss functionality as broken. Finish when the
declared work completes; no extra tests to fill unused time.
