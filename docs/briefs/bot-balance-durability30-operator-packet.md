# Durability30 — Trench Stalker pacing and Jungle CPU diagnosis

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED. Execute once sequentially.
No subagents, retries, adaptive edits, production changes, commits or pushes.

## Decision from Durability29

Completed 144 observations: 120 window-ended, 20 deaths, 4 wall cutoffs.
T4 Mountain deaths fell 4/36 to 1/36 with retained longer body timings; retain
the candidate attack package for consolidated adoption review. T2 fell 10/36
to 5/36 but candidate Striker still died 3/6. Keep T2 provisional and record a
specific remaining build/pressure issue rather than another broad scalar grid.
The candidate T2 killing blows were Boulder Thrower, not proof of sole cause.
T4 Maestro's remaining death and sparse Slinger timings remain visible caveats.
No production adoption follows this report. Selected packages need reconciliation
with current source and regression before invited-playtest claims.

## Sealed matrix

| Block | Cells / observations | Simulated window | Seeds |
| --- | ---: | ---: | --- |
| trench | 24 / 72 | 600s or first death | 86011, 88001, 90001 |
| jungle | 4 / 12 | 120s or first death | 44017, 46021, 48017 |

Total 28 cells / 84 observations, sequential. Synthetic +5 prepared builds,
100ms ticks, natural ecology, unchanged runes, gear, stance and targeting.
No travel, economy, Docker, services or manual combat input.

Trench: six roots, nodes03/05, paired control/candidate. T4A paths are Maestro,
Reverb, Pyromancer, Bounty Hunter, Marshal, Equinox; medium frame/native range.
Both arms use the selected Dur22 HP package: Elder Leviathan17640,
Abyssal Serpent16800, Hadal Stalker16800. Candidate only raises Stalker to21000
(+25%). Absolute Leviathan shield remains fixed. Attacks, defenses, movement,
casts and ecology remain fixed. The shared installer also loads the same Dur22
off-biome package in both arms; it is not evidence about those absent species.
Previous Stalker center~34.95s motivates this probe toward the all-three-species
40–60s mini-boss target; do not assume HP scaling produces linear timing.
Keep slow Reverb/Conduit and fast Pyromancer results visible rather than demand
every class reach the same band or raise HP to chase the fastest build.

Jungle is a technical replay, NO durability treatment: unchanged Dur23 setups
for node03 Apprentice/Slinger and node05 Apprentice/Spirit, original three seeds.
These cover six prior cutoff observations and six comparators. Only the Jungle
block is CPU-profiled, producing results/jungle.cpuprofile. Profiling adds overhead;
wall-time changes alone are not gameplay or performance improvement evidence.
No new movement fix is claimed and no HP candidate is selected here.

## Frozen identity and readiness

Revision `e151f061be054242154cb327d3ec632307cc4a79`
Branch `codex/durability30-frozen`
Tree `3afae2c30bc5b7a0db407d97f5f7c5d0ea1fdb17`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same frozen gameplay as Dur29; concurrent main-checkout changes excluded.
All28 setups/14 short pilots passed at
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability30.
Focused overlay/restoration test, benchmark typecheck, syntax/diff checks passed.
Windows loader CPU-profile qualification smoke produced a valid profile; its
qualification rows are not combat evidence. Readiness is not full-suite/live proof.
Preflight metadata may name parent revision because qualification preceded freezing.

Expected roughly15–35 wall minutes, uncertain. Per observation120s wall/2GiB RSS;
per block30min soft/35min watchdog; queue3h safety. Preserve cutoffs and partials.
Budget partials advance; unexpected identity/runner/audit failure stops. A forced
process termination may prevent profile flush: report missing profile, no rerun.
No cap extensions, forced worktree deletion or global cleanup.

## Execute once

```powershell
$dur30Revision = 'e151f061be054242154cb327d3ec632307cc4a79'
$dur30Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917'
$dur30Source = "$dur30Root/source"
if(Test-Path -LiteralPath $dur30Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur30Root | Out-Null
git worktree add --detach "$dur30Source" $dur30Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur30Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur30Source/scripts/durability30-run.mjs" "--out=$dur30Root/results" "--revision=$dur30Revision" --tree=3afae2c30bc5b7a0db407d97f5f7c5d0ea1fdb17 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur30Exit = $LASTEXITCODE
@{exit=$dur30Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur30Root/operator-exit.json"
```

## Required report

Write docs/briefs/bot-balance-durability30-report.md and index docs/README.md.
Verify identities, counts and audits; preserve all raw artifacts and stop receipts.
Trench: compare paired READY geometry, player stats/gear and non-Stalker mob stats;
only Stalker HP differs between arms. Verify fixed absolute shield. Report survival,
minHP/barrier, kill throughput, incoming damage per simulated time and terminal
10s/30s damage windows. Killing blow alone is not causal attribution.

Timing: per-seed eligible clean-body medians then cell medians; require at least
two eligible paired seeds. Separate unfinished/regained, dead, quiet, cutoff and
missing rows. Keep real encounter durations/member/late-join measures separate
from individual body TTK. Never pool all kills into a pseudo-average class DPS.
Recommend retain/adjust/reject Stalker21000 against pacing AND attrition, without
another automatic scalar grid. Monitor unchanged Leviathan/Serpent as context.

Jungle: compare each row to the corresponding Dur23 row under
C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917/results/jungle.
List outcome, simulated progress, max tick time, quiet duration, HP and targeting/
movement evidence. Verify profile exists and parse its nodes/samples/timeDeltas.
Provide a bounded source-attributed CPU summary with self sample/time shares and
relevant caller paths; distinguish module loading, GC, reporting and simulation.
If possible map heavy intervals to observation boundaries; do not invent mappings
from a whole-process profile or equate one top frame with a proven defect.
Read implicated frozen source only as needed to propose one targeted repair or
next diagnostic. No operator fixes or further runs. CPU replay is not a complete
Jungle balance survey. A quiet bot can be blocked on pathfinding, movement logic,
targeting or terrain; none is presumed from the previous cutoff alone.

Remaining campaign work: consolidate retained mob candidates on current source,
resolve Jungle before tuning its HP, decide the narrow T2 Mountain exception, and
run bounded current-source regression. Boss/progression and x1 economy gates are
separate; these synthetic observations do not certify them or all T4 branches.
