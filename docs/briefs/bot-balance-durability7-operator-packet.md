# Durability 7 — T2 Mountain pressure attribution

Prepared 2026-09-15. Full experiment NOT run. Luna executes exactly once; no
subagents, adaptation, retries, source/balance edits or extra experiments.

## Decision and fixed matrix

Durability6 met the typical-duration targets closely enough to retain all four
selected HP values. Do not increase durability again. T2 Mountain remains the
pressure question: both companions and Titan contribute to deaths. Compare
these alternatives separately before selecting a live damage change:

| Arm | Stone Eagle attack | Granite Titan attack |
| --- | ---: | ---: |
| control | 75 | 105 |
| eagle-soft | 60 | 105 |
| titan-soft | 75 | 84 |

All arms: Titan HP1656, authored plating0/DR0 (node adds normal DR), Eagle dive
1.25x, all other HP/defenses/abilities/cadence/rosters unchanged. These are base
attack changes: Eagle dive and Titan slam also weaken proportionally before
mitigation. They are NOT ordinary-hit-only interventions. No combined-soft arm.
Use absolute attack overrides, restore between Worlds, apply to repopulations.
Live definitions remain at control attack values pending the user/Astra decision.

Node `node-t2-mountain-04`, six survey baselines plus Slinger DoT and Conduit
on-hit alternatives, three arms, five seeds173/947/2027/4093/5579:
**24 cells /120 observations**. Keep every build identical across arms: +5 gear,
medium frames, normal class range, Mountain armor/charm/boots, Tempered Core,
offensive stance, existing survey abilities/runes. Current Sweep Tempo is fixed;
no Slam equipped or ability balance conclusions. No Desert weapons or pending
Desert rework, other biomes, bosses, class compensation or economy scope.

Fresh300s Worlds, stop at first death. Normal100ms ticks, AI/ecology/repopulation;
one sequential process. Death advances matrix; failure/interruption ends packet
without retry. Max10 simulated hours; estimate15-25 wall minutes, not guaranteed.
Retain two-minute replicate, four-hour batch and2GiB RSS ceilings. Wall limits
are tooling censors, not gameplay deaths. No Docker/database/restart.
Synthetic prepared-combat evidence only; not travel/acquisition/economy,
client/network or human-feel certification.

## Frozen identity and qualification

- Revision: `e538db33bcc8b5df9c828af53daaa2ab8c02325f`
- Tree: `297454cff84f7d918b916bdf7efdcce5bf8fb212`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Definitions SHA256: `cc1dbbe1845182c5ba2faeaf7890b4e27d5b694febe29a3a94c48db60c4a5a2c`
- Qualification: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability7/qualification`
- Qualification index SHA256: `5F7389BFF3799074BC609A7A26524426FEEDDB8AE3DAC9870910D03C6F2D164C`

READY. All24 configurations qualified in clean frozen source. Matching player
views, rosters/HP/geometry and exact attack/defense values verified across arms.
Frozen workspace/bench typecheck and overlay/restoration test passed. Three30s
Conduit baseline pilots (all arms) and report generation passed; artifacts in
sibling `pilot`. Pilots are tooling evidence only. Full suite/human playtest not run.

The frozen source excludes concurrent uncommitted Desert/weapon work in the
shared checkout. No copying dirty source into the experiment.

## Operator commands

From shared repo, preserve existing files and create a fresh detached checkout:

```powershell
$dur7Revision = 'e538db33bcc8b5df9c828af53daaa2ab8c02325f'
$dur7Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability7-20260915'
$dur7Checkout = "$dur7Root/source"
$dur7Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $dur7Root) { throw 'Output exists: inspect/report, do not overwrite or relaunch' }
if ((Get-FileHash -LiteralPath $dur7Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur7Root | Out-Null
git worktree add --detach "$dur7Checkout" $dur7Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree failed' }
pnpm --dir "$dur7Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
if ((git -C "$dur7Checkout" rev-parse HEAD) -ne $dur7Revision) { throw 'Revision mismatch' }
if ((git -C "$dur7Checkout" rev-parse 'HEAD^{tree}') -ne '297454cff84f7d918b916bdf7efdcce5bf8fb212') { throw 'Tree mismatch' }
if (git -C "$dur7Checkout" status --porcelain --untracked-files=no) { throw 'Dirty tracked source' }
pnpm --dir "$dur7Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability7 --mode=run "--revision=$dur7Revision" "--hitboxes=$dur7Hitboxes" "--out=$dur7Root/results"
$dur7Exit = $LASTEXITCODE
```

Record exit and times/resources. If index exists, generate analysis even for a
partial run; never rerun combat to obtain a report:

```powershell
node "$dur7Checkout/scripts/ttk-survey-report.mjs" "$dur7Root/results"
```

Completion:24cells/120runs, trial durability7, mode run, exactly five declared
seeds per cell, matching hashes and no failed.json. Preserve source/artifacts;
no repeat qualification/pilot or cleanup of unrelated resources.

## Required report and next decision

Write `docs/briefs/bot-balance-durability7-report.md` and index in docs/README.md.
Record identity/hashes, timing, completeness, death/censor counts and limitations.

1. Join exact class/alternate/arm/seed. Verify identical starting geometry,
   player views, HP and defenses; only intended species attack changes. The
   historical `hpTreatment` field contains attack changes here: control empty,
   soft arms one entry with unchanged before/after HP and declared attack.
2. Compare per-seed survival/time-to-death, minimum HP, largest hit/1s pressure,
   recovery and interrupted recovery. Show every seed, not only pooled totals.
   Fewer deaths in five seeds is descriptive evidence, not a precise rate.
3. For every death and severe surviving near-death (minimum HP below20%), inspect
   the preceding10s/30s damage sources. Separate Eagle, Titan and Thrower;
   record overlapping attackers and available cast chronology. Do not blame
   only the killing blow. Dive attribution from first-hit timing is approximate.
4. Named Granite Titan TTK: per-seed clean medians, median of available seed
   medians, clean count, kills, unfinished and HP-regain traces. Generic all-enemy
   or pooled per-type medians are not this measure. Flag no-kill runs explicitly.
   Typical six-baseline center remains15-25s; alternatives do not enter it.
5. Include companion kill counts and encounter/target damage gaps so changes
   in pulling/targeting are visible. Less incoming damage caused by different
   exposure is not identical to lower damage at matched exposure. A window-end
   unfinished target is not necessarily stalled. Do not infer pathfinding bugs.
6. Keep Conduit baseline seed2027 visible: it previously died at27.4s with no
   clean Titan median. Determine whether either arm changes that outcome.
7. Cross-run comparisons use matching seeds; current same-batch control is the
   primary comparator. Return Eagle reduction, Titan reduction, neither, or
   insufficient evidence; do not apply a winner or invent a combined trial.

After review: make a focused damage decision if supported, then broaden biome
coverage. Retain Cave's isolated attrition cases and T3 Cave's38-40s slow builds
on the later-review list rather than expanding this experiment's scope.
