# Durability 6 — typical-duration adjustment

Prepared 2026-09-15. Full experiment NOT run. Luna operates exactly once with
no subagents, adaptation, retries, balance edits or additional experiments.

## Decision and treatment

User approved typical toughest-ordinary-enemy TTK of 15-25s T2 and 25-35s T3,
allowing favorable matchups below these ranges. These are cohort-center targets,
not minimums imposed on every class. Track fast/slow builds separately.

Selected live HP patch:

| Named target | Previous HP | Selected HP | Change |
| --- | ---: | ---: | ---: |
| T2 Cave Troll | 1320 | 1584 | +20% |
| T2 Granite Titan | 1380 | 1656 | +20% |
| T3 Cavern Troll | 3780 | 4725 | +25% |
| T3 Mountain Colossus | 4250 | 4675 | +10% |

Durability5's median across the six baseline class medians was about 14.55s,
14.10s, 20.075s and 23.275s respectively. Simple proportional projections are
17.46s, 16.92s, 25.09s and 25.60s; these guide the candidate, not its acceptance.
Wards, cast cycles, companion pressure and Sweep can make actual scaling nonlinear.
Attack, plating, DR and mechanics stay fixed. Eagle attack remains75/dive1.25.
No simultaneous Eagle nerf; pressure is a measured risk of longer exposure.

## Matrix and ability boundary

Same four nodes as Durability5: T2/T3 Cave02 and Mountain04. Six survey baselines
plus Slinger DoT and Conduit on-hit alternatives, two HP arms, three seeds
173/947/2027 = 64 cells / 192 observations. Both arms use the SAME frozen current
code, including Sweep Tempo. Previous-HP is a process-local absolute HP override,
not a replay of the old executable. Selected-HP uses the new authored values.
Only the named target HP changes; restore between every World. Repopulation
and max-HP-scaled Granite Barrier receive that same treatment.

Builds retain +5 gear, matching armor/charm, Mountain boots, Tempered Core,
medium frame, normal close/mid range, offensive stance and established abilities
and runes. No Slam is equipped. Sweep is already part of these baselines, so
current Sweep is held constant across both arms; this does NOT validate or tune
Sweep/Slam balance. Do not disable Tempo, alter cooldowns or introduce ability
arms. An old Durability5 comparison is contextual, not an isolated HP effect.
The user's pending Desert weapon rework and other biomes are outside this run;
the frozen builds contain no Desert weapon.

Measure fresh 300s Worlds, stopping each observation at first death. Normal AI,
ecology and 100ms ticks; one sequential process, no Docker/database/restart.
Max16 simulated hours. Estimate25-40 wall minutes; retain two-minute replicate,
four-hour batch and2GiB RSS limits. Death continues the matrix; tooling failure
or interruption stops without retry. Wall ceilings are censors, not deaths.
Fully prepared synthetic combat evidence only, not acquisition/economy/travel,
client/network or human-feel certification.

## Frozen identity

- Revision: `7398e25bce92e1c2efac4bc1bda8c715ef542ef7`
- Tree: `af40c6b1acfdea9c48dbf37bf9c3fb9f9749b124`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Definitions SHA256: `cc1dbbe1845182c5ba2faeaf7890b4e27d5b694febe29a3a94c48db60c4a5a2c`
- Qualification: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability6/qualification`
- Qualification index SHA256: `B4B954DBF42D497E09874EA91F27D861098409D571999E77324D1F66B5CEBAA3`

READY. All64 configurations qualified in the clean frozen checkout. Paired
geometry/player views/non-HP stats and exact named HP verified. Three30s
instrumentation pilots (T2 Conduit Mountain both arms; T3 Apprentice Cave new HP)
and report generation passed; artifacts in sibling `pilot`. Workspace/bench
typecheck, shared build, new overlay/restoration test and historical Durability5
contract test passed. The latter now supplies historical HP as its fixture,
while the frozen Durability5 CLI correctly rejects newer authored HP.
Full suite and human playtest not run; pilots are tooling evidence only.

## Operator commands

From shared repository, preserve dirty files and use a fresh detached checkout:

```powershell
$dur6Revision = '7398e25bce92e1c2efac4bc1bda8c715ef542ef7'
$dur6Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability6-20260915'
$dur6Checkout = "$dur6Root/source"
$dur6Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $dur6Root) { throw 'Output exists: inspect/report, do not overwrite or relaunch' }
if ((Get-FileHash -LiteralPath $dur6Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur6Root | Out-Null
git worktree add --detach "$dur6Checkout" $dur6Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree failed' }
pnpm --dir "$dur6Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
if ((git -C "$dur6Checkout" rev-parse HEAD) -ne $dur6Revision) { throw 'Revision mismatch' }
if ((git -C "$dur6Checkout" rev-parse 'HEAD^{tree}') -ne 'af40c6b1acfdea9c48dbf37bf9c3fb9f9749b124') { throw 'Tree mismatch' }
if (git -C "$dur6Checkout" status --porcelain --untracked-files=no) { throw 'Dirty tracked source' }
pnpm --dir "$dur6Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability6 --mode=run "--revision=$dur6Revision" "--hitboxes=$dur6Hitboxes" "--out=$dur6Root/results"
$dur6Exit = $LASTEXITCODE
```

Record exit. If index exists, generate analysis even for partial results:

```powershell
node "$dur6Checkout/scripts/ttk-survey-report.mjs" "$dur6Root/results"
```

Completion requires64cells/192runs, trial durability6, mode run, all three
declared seeds per cell, correct hashes and no failed.json. Preserve source
and artifacts. No repeat qualification/pilot or extra experiments. No Docker
cleanup or removal of unrelated worktrees/resources.

## Required report

Write docs/briefs/bot-balance-durability6-report.md and index in docs/README.md.
Record frozen identity, manifest/index hashes, elapsed time/resources, exact
64-cell/192-observation completion, missing/failed pairs, deaths and censors.
Use generated analysis then raw artifacts; preserve all outputs.

1. Check matching geometry/builds/actual attack/plating/DR within every node,
   class and seed pair. ready.hpTreatment must show exactly the named HP; actual
   HP and wards must match the arm. Check full target presence and legal setup.
2. For each named elite/build/arm, show all three seed medians, clean counts,
   kills, unfinished targets, HP regain and median of available seed medians.
   Never silently convert no-kill results to zero. Per-type generated medians
   pool kills: recompute the requested median of seed medians from index.targets.
3. Cohort center = median of the SIX BASELINE class medians, equally weighted.
   Do not give classes with more kills extra weight or include alternatives in
   that center. If a baseline has no usable median, label the cohort incomplete.
   Show min/max and alternatives alongside it. Targets15-25s/25-35s are context,
   not automatic per-build pass/fail thresholds. Report paired HP-arm changes.
4. Show per-seed survival, minimum HP, largest hit/1s pressure, recovery and
   interrupted recovery. Investigate all deaths through final10s/30s damage
   sources; separate Eagles/Throwers and trolls rather than killing-blow blame.
   Three seeds are a pressure screen, not a precise death-rate estimate.
5. Show available cast/ward activity, HP-regain exclusions, long damage gaps,
   summon-hit floors and possible outliers. An unfinished target at window end
   is not necessarily a stall; use its damage/target chronology. No pathfinding
   assertion from inactivity alone.
6. Compare previous-HP on current code to original Durability5 only on the SAME
   three seeds, recomputing both medians. Ability changes prevent attributing
   differences solely to HP. No old-five-seed versus new-three-seed outer median.
7. Return retain versus adjust per target, whether attrition limits the increase,
   and whether to proceed to other biomes or a focused T2 Mountain pressure pass.
   Do not choose or apply a new patch. Future scoped ability/swarm experiments
   must establish Sweep/Slam effects separately.
