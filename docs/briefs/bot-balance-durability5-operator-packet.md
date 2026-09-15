# Durability 5 — combined patch confirmation

Prepared 2026-09-15. Full experiment NOT run. Luna executes this batch once,
then reports to the user. No subagents, retries, build adaptation, source edits,
extra experiments or further balance changes. Qualification status below.

## Purpose and fixed matrix

Confirm the selected authored Cave/Mountain patch with six existing class
baselines plus Slinger DoT and Conduit on-hit alternatives. Keep medium frames,
close range for Striker/Squire and medium range for ranged classes at T3.
Builds exactly match the prior survey: +5 gear, matching armor/charm, Mountain
boots, Tempered Core, offensive stance, established abilities/runes, no relic.
The runner validates legal preparation. Do not optimize a failing build mid-run.

Four nodes: T2/T3 Cave02 and Mountain04, eight builds each, five seeds
173/947/2027/4093/5579: **32 cells / 160 observations**. Each fresh World lasts
300 simulated seconds or until first death. This is a confirmation, not another
defense/weapon sweep. No heavy Conduit alternative: axe outperformed it in Durability4.

Authored values, before node modifiers:

| Target | HP | Attack | Plating | DR |
| --- | ---: | ---: | ---: | ---: |
| Cave Troll T2 | 1320 | 86 | 1 | 26.4% |
| Cavern Troll T3 | 3780 | 124 | 2 | 28% |
| Granite Titan T2 | 1380 | 105 | 0 | 0% |
| Mountain Colossus T3 | 4250 | 130 | 0 | 0% |

Stone Eagle attack 75, Skyfall Rend 1.25x. Mountain wards still scale with max HP.
All other monster definitions/mechanics and rewards retain the frozen source.
**No definition overlay is installed.** `hpTreatment` must be empty; applying
Durability2/3/4 multipliers here would double the treatment. A preflight asserts
selected values before measurement and after setup.

Provisional toughest-enemy bands: T2 10-20s, T3 20-30s from first positive owned
damage to kill. These are design targets, not mandatory equality across classes
or targets for swarm bodies. T2 remains unfinished. No bosses, new AoE abilities,
penetration, class compensation, DoT resistance or economy measurement here.

## Execution and evidence limits

Same real World/combat implementation, normal 100ms ticks, ecology/repopulation
and prepared synthetic bot setup as previous surveys. One sequential process;
no Docker, service restart or database writes. Max 13h20m simulated time.
Budget roughly 15-30 minutes wall time, not guaranteed; retain two-minute replicate,
four-hour batch and 2GiB RSS limits. Wall ceilings are tooling censors, not deaths.
A gameplay death advances to the next declared observation. Failure/interruption
ends the packet; no retry. Synthetic evidence does not certify acquisition,
travel, canonical economy, client behavior or human feel.

## Frozen identity and qualification

- Revision: `3a0220aed0c6765e72ecbfae9cdc2de224b38a30`
- Tree: `f7b6f937366c5c9b244687444822b4984441a939`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Definitions SHA256: `447f3ff286e15aeda8be985a97baebac566813cf5a7e138bd1a5317f805a660d`
- Qualification: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability5/qualification`
- Qualification index SHA256: `1CEEFC7C12FC04FB37779AD33A2EC97474FDD01C531932787B4E97EAAF737F2F`

READY. All 32 builds qualified in the clean frozen checkout; matched initial
geometry and empty overlays verified. Workspace/bench typecheck and the focused
confirmation test passed. Three 30s pilots (T2 Conduit Mountain, T3 Apprentice
Cave, T3 Slinger DoT Mountain) and report generation passed under the same
revision; artifacts are in the sibling `pilot` directory. These are tooling
checks, not full balance evidence. Full suite and human playtest not completed.

## Operator commands

From the shared repository, preserve dirty files. Create a separate frozen checkout:

```powershell
$dur5Revision = '3a0220aed0c6765e72ecbfae9cdc2de224b38a30'
$dur5Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability5-20260915'
$dur5Checkout = "$dur5Root/source"
$dur5Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $dur5Root) { throw 'Output exists: inspect/report, do not overwrite or relaunch' }
if ((Get-FileHash -LiteralPath $dur5Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur5Root | Out-Null
git worktree add --detach "$dur5Checkout" $dur5Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree failed' }
pnpm --dir "$dur5Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
if ((git -C "$dur5Checkout" rev-parse HEAD) -ne $dur5Revision) { throw 'Revision mismatch' }
if ((git -C "$dur5Checkout" rev-parse 'HEAD^{tree}') -ne 'f7b6f937366c5c9b244687444822b4984441a939') { throw 'Tree mismatch' }
if (git -C "$dur5Checkout" status --porcelain --untracked-files=no) { throw 'Dirty tracked source' }
pnpm --dir "$dur5Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability5 --mode=run "--revision=$dur5Revision" "--hitboxes=$dur5Hitboxes" "--out=$dur5Root/results"
$dur5Exit = $LASTEXITCODE
```

Record exit and wall/resource observations. If an index exists, generate analysis
even for partial results, without rerunning combat:

```powershell
node "$dur5Checkout/scripts/ttk-survey-report.mjs" "$dur5Root/results"
```

Completion requires 32 cells/160 runs, trial durability5, mode run, five expected
seeds per exact cell ID, matching definitions/hitbox hashes and no failed.json.
Preserve source and artifacts. Do not repeat qualification/pilots or launch
additional cases. Do not clean unrelated Docker or filesystem resources.

## Required report and next decision

Write `docs/briefs/bot-balance-durability5-report.md` and index in docs/README.md.
Record revision/tree, manifest/index SHA256, timings, completion, deaths, censors
and limitations. Generated analysis is a starting point; use raw index/ready/events
for the named targets. Its generic all-enemy median and pooled per-type median
are not the requested named-elite median of seed medians.

1. Join exact cell ID, class, tier, node, alternate and seed. For each named elite,
   report all five seed medians, median of available seed medians, clean sample
   count, kills, unfinished targets and HP-regain exclusions. Keep baselines and
   alternatives distinct. Never count an unfinished fight as zero or a success.
2. Show actual spawned HP/attack/plating/DR from ready data, expected target
   presence, unchanged builds and empty hpTreatment. Check matched initial
   geometry across builds at the same node/seed; later pulls/RNG may diverge.
3. Pair T2/T3 durations within each class and enemy role. Compare the original
   three seeds descriptively with Durability2 HP-high and Durability3 Cave DR
   arms; cite source/artifacts and treatment differences. Durability4 Eagle1.25
   uses the same intended T2 Mountain stats, but Conduit plate0 used HP-trim
   and Cave used original DR: those are not identical patch controls.
4. Show per-seed deaths, minimum HP, largest hit/1s pressure, recovery and
   interrupted recovery. For every death inspect final 10s/30s damage sources,
   including companions, rather than blaming the killing blow alone.
5. Show available cast/ward activity and HP regain; longer max-HP-scaled wards
   are part of Mountain durability. Eagle dive attribution from cast/first-hit
   chronology is approximate: no definitive empowered-hit flag exists.
6. Flag Conduit on-hit summon damage floors, Apprentice/DoT advantage and
   slow Squire cases. A moderate advantage is acceptable; repeated approximately
   4x speed differences warrant review, not an automatic class/DoT nerf.
7. Separate movement/inactivity, attrition and damage-output failures. Do not
   infer a pathfinding bug from a long gap alone. Preserve sparse/censored cells.

Conclude which targets are ready to retain provisionally, which need a local
damage/durability adjustment, and whether evidence is sufficient to broaden
to remaining biomes. No automatic pass from aggregate survival or a single kill.
Astra/user decide changes after the report; human playtesting remains useful.
