# Durability31 — observation-scoped Jungle navigation diagnosis

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED. Execute once sequentially.
No subagents, retries, adaptive source/build changes, production patches, commits
or pushes. This is a 12-observation technical replay, not another balance grid.

## Decision from Durability30

Verified 72/72 Trench windows with zero deaths and 6/12 Jungle windows plus six
wall cutoffs. Stalker21000 moves Slinger/Spirit toward40–60s, but Squire/Conduit
already take much longer and Apprentice remains fast. Keep selected Stalker16800
for now, alongside Leviathan17640/Serpent16800, pending consolidated adoption.
Do not raise all Trench HP to chase fast classes; class/build spread belongs in
the later class pass. This does not mean Trench pacing is uniformly solved.

Correction to the operator report's attrition interpretation: zero deaths over
36 complete600s windows per arm IS bounded survival evidence. MinHP/incoming
pressure remain mixed and no terminal windows exist; it is neither unlimited
safety proof nor an absence of survival evidence. The21k rejection is a planner
decision about the pacing tradeoff, not evidence that it caused deaths.

Jungle reproduced all six prior cutoffs; the whole-process profile attributes
93.52% of sampled time to movement/targeting. Per-observation attribution and
request counts were missing. Durability31 fills that gap without changing paths,
collision decisions, mob stats or player strategy. Current main has no differences
from the frozen baseline in pathfind/navGrid/spatial/autoTarget/targetPriority;
other concurrent gameplay edits remain excluded. This is deliberately a controlled
diagnostic of the reproducible runtime, not current-source release regression.

## Sealed matrix and artifacts

Same four Durability30 Jungle cells: node03 Apprentice/Slinger, node05
Apprentice/Spirit; seeds44017/46021/48017. Four cells,12 observations. Reuses
trial=durability30 and dur30 cell IDs intentionally for exact comparator identity;
Durability31 is the diagnostic wrapper, not a new combat treatment. T4A builds,
medium frame/native range, gear/runes/stance unchanged. Natural ecology, synthetic
+5 preparation;120 simulated seconds or first death,100ms ticks.

The launcher enables --navigation-diagnostics=true. Each row produces its normal
READY/events/samples/summary plus sibling files inside results/jungle:
- <cell>-s<seed>.cpuprofile: that observation's setup, simulation and teardown.
- <cell>-s<seed>-navigation.json: cumulative per-tick counters, path-call counts,
  null results, total path wall time, expanded A* cells, padded-segment checks,
  intermediate collision samples and exact repeated-request aggregates.

Counters are opt-in and disabled elsewhere. Inner-loop counters do not call a
clock; path timing uses monotonic performance.now, not simulated Date.now.
Request keys include node/mover/pad/exact from/to/hazard flag/suppression set;
only the first1000 distinct keys are retained, with droppedKeys explicit. A key
is a request signature, not an entity ID. overlapQueries counts direct queries
inside padded-segment checks, NOT every spatial query. Per-tick counters are
cumulative; difference them for interval work. Profile self-time and inclusive
path time overlap and must not be added. Profiling overhead can advance a wall
cutoff; compare gameplay only over common simulated prefixes.

## Frozen identity / readiness

Revision `d6643bde3551e510f879e7cab775f50e73964e02`
Branch `codex/durability31-frozen`
Tree `4ce106a953ab160606965d49416c74cde6e4d178`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Four qualifications/two30s pilots passed at
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability31.
Both pilots wrote valid profiles and counters; READY/events/samples matched
uninstrumented Durability30 pilots byte-for-byte. Navigation parity/repeated-key/
disable test, path-endpoint regression, benchmark typecheck and syntax/diff checks
passed. Not a full-suite or browser result. Qualification metadata may name the
parent revision; final metadata-only additions followed the pilot.

Expected12–20 wall minutes, uncertain. Per observation120s wall/2GiB RSS,
block30min soft/35min watchdog; inherited queue3h safety. No cap extensions.
Partial/censored outcomes are evidence. A watchdog may prevent profile flush;
preserve everything and report missing diagnostics, without retry or cleanup.

## Execute once

```powershell
$dur31Revision = 'd6643bde3551e510f879e7cab775f50e73964e02'
$dur31Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability31-20260917'
$dur31Source = "$dur31Root/source"
if(Test-Path -LiteralPath $dur31Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur31Root | Out-Null
git worktree add --detach "$dur31Source" $dur31Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur31Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur31Source/scripts/durability31-run.mjs" "--out=$dur31Root/results" "--revision=$dur31Revision" --tree=4ce106a953ab160606965d49416c74cde6e4d178 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur31Exit = $LASTEXITCODE
@{exit=$dur31Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur31Root/operator-exit.json"
```

## Required report / stop point

Write docs/briefs/bot-balance-durability31-report.md and index docs/README.md.
Verify source/hash/matrix,12 expected observations and diagnostics per completed
row. Compare corresponding Durability30 READY and gameplay prefixes under
C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability30-20260917/results/jungle.
Report setup/geometry/build parity, deaths, wall cutoffs, simulated progress,
quiet durations and any unexpected combat divergence. No HP timing certification.

For each observation report path calls/null fraction, pathMs per simulated second,
expanded cells/checks/samples per call, top repeated keys with their null fraction,
and profile self-time/caller paths. Compare original normal and cutoff rows.
Correlate counter deltas with sample position, selected target, motion/path and
quiet windows by simulated atMs; call out the initial setup count before tick0.
Inspect a few dominant exact request endpoints against frozen nav geometry. Decide
whether evidence points to repeated unreachable queries, costly successful routes,
target churn, or another mechanism. No inferred collider bug from CPU cost alone.

Provide ONE concrete source-level repair hypothesis with regression invariants
(safe endpoints/collision, retargeting, movement and combat preservation), or state
exactly which evidence is missing. The operator does not implement it or launch
follow-ups. Do not spend another full grid reproducing already-known timeouts.
The planner then owns the repair and bounded current-source regression.

Trench and Mountain are not repeated. T4 Mountain candidate remains retained for
adoption review; T2 Mountain Striker remains a specific pressure exception. Next
campaign milestone is consolidated mob candidates plus current-source regression,
with Jungle durability assessed after navigation is usable. Boss/progression/x1
economy and all-T4-branch balance remain separate gates.
