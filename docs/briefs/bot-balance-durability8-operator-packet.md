# Durability 8 — Desert controllers and Tundra shield scaling

Prepared 2026-09-15. Full experiment NOT run. Luna executes once without
subagents, retries, adaptations, source edits, live balance changes or extra runs.

## Scope and decisions

Approved live change: Granite Titan attack105->84, HP1656 unchanged. Eagle stays
75 attack/dive1.25. Durability7 supported broader heavy-hit relief from Titan;
it did not establish an unambiguous winner or eliminate every overlap death.
Move to new biome questions rather than another Mountain sweep.

Use T3 `node-t3-desert-03` and `node-t3-tundra-03`, eight established builds each
(six baselines plus Slinger DoT/Conduit on-hit), three arms and three seeds
173/947/2027 = **48 cells /144 observations**. Exact builds inherited from the
Durability1 biome setup: +5 gear, medium frame, close melee/mid ranged branches,
biome armor/charm, Mountain boots, Tempered Core, offensive stance and existing
survey abilities/runes. Current Sweep is held fixed, Slam not equipped.
No Desert weapon swap. The committed Falchion rework is present in the frozen
source, but no build equips that weapon; this is not a weapon comparison.

### Desert

Change only `dune-stalker` and `desert-basilisk` HP: control /2x /3x, authored
1350 /2700 /4050 each. The node's normal HP modifier still applies. This broad
bracket follows the earlier +50% probe, where many controller fights remained
short. Neither factor is a selected live value.
Leave `sandweaver` (Gilded Scarab dealer), controller attacks, defenses, gaze,
slow/root/sunder, pack composition and all other enemies unchanged. Measure
controllers individually and dealer exposure; do not pool them into one TTK.

### Tundra

Change only Glacier Bear; leave wolves/casters/chill/attacks/defenses unchanged:

| Arm | Authored Bear HP | Shield fraction | Authored-equivalent capacity |
| --- | ---: | ---: | ---: |
| control | 1500 | 20% | 300 |
| bear-hp1.5 | 2250 | 20% | 450 |
| bear-hp1.5-fixed-shell | 2250 | 13.333...% | 300 |

Actual capacity uses spawned max HP, so verify the node modifier in ready data.
Shield interval11s/duration6s, shatter self-damage12% and vulnerability30%/4s
remain fixed. Shatter self-damage also scales with HP: both high-HP arms share
that payoff, but comparison to control is not an HP-only defense comparison.
The two high-HP arms isolate capacity, including its effects on break timing and
vulnerability access. Do not remove the shield or alter its cadence.

All changes are reversible in-process definition overlays covering repopulation;
restore HP and nested shield fraction between Worlds. No Desert/Tundra live patch.

## Execution and limits

Fresh300s Worlds, stop first death, normal100ms ticks and natural ecology.
One sequential process, max12 simulated hours. Estimate20-35 wall minutes,
not guaranteed. Two-minute replicate/four-hour batch/2GiB RSS ceilings remain.
Death advances matrix; failure/interruption stops without retry. Wall ceilings
are tooling censors. No Docker/database/service restart. Fully prepared synthetic
combat evidence only; not acquisition/travel/economy/client/human-feel validation.

## Frozen identity

- Revision: `04e80e9ae38183c194f4cacc4b5fa171a3de8873`
- Tree: `8a7834e43ff2d5a0fa8a4f6f4fb72ab44f9115c6`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Definitions SHA256: `ffa732ef753525d381623e4f8cefd131947357ffc1364445e63940cc5aaa59c0`
- Qualification: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability8/qualification`
- Qualification index SHA256: `082AD1109709E3A2058ADEDBEB9EBE2E037EADC9B567BE47D2E10540FCB8D034`

READY. All48 configurations qualified in clean frozen source, with matching
builds/geometry/non-HP stats and unchanged companion HP. Target presence passed.
Three30s pilots (Conduit Bear both high arms; Squire Desert3x) and generated
report passed; artifacts in sibling `pilot`. Workspace/bench typecheck, treatment
isolation/restoration, historical Durability5/7 fixtures and Mountain charged
defenses tests passed. Full suite and human playtest not run. Pilots are tooling
checks, not balance evidence. HP rounding can cause tiny differences in actual
fixed-shell capacity; compare computed spawned capacities, not just fractions.

## Operator commands

From shared repo, preserve dirty files and create a new detached checkout:

```powershell
$dur8Revision = '04e80e9ae38183c194f4cacc4b5fa171a3de8873'
$dur8Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability8-20260915'
$dur8Checkout = "$dur8Root/source"
$dur8Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $dur8Root) { throw 'Output exists: inspect/report, no overwrite or relaunch' }
if ((Get-FileHash -LiteralPath $dur8Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur8Root | Out-Null
git worktree add --detach "$dur8Checkout" $dur8Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree failed' }
pnpm --dir "$dur8Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
if ((git -C "$dur8Checkout" rev-parse HEAD) -ne $dur8Revision) { throw 'Revision mismatch' }
if ((git -C "$dur8Checkout" rev-parse 'HEAD^{tree}') -ne '8a7834e43ff2d5a0fa8a4f6f4fb72ab44f9115c6') { throw 'Tree mismatch' }
if (git -C "$dur8Checkout" status --porcelain --untracked-files=no) { throw 'Dirty tracked source' }
pnpm --dir "$dur8Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability8 --mode=run "--revision=$dur8Revision" "--hitboxes=$dur8Hitboxes" "--out=$dur8Root/results"
$dur8Exit = $LASTEXITCODE
```

Record exit/times/resources. If index exists, generate analysis even for partials:

```powershell
node "$dur8Checkout/scripts/ttk-survey-report.mjs" "$dur8Root/results"
```

Completion requires48cells/144runs, trial durability8, mode run, all three seeds,
correct hashes and no failed.json. Preserve artifacts/source; no repeat pilots,
qualification, extra experiments or unrelated resource cleanup.

## Required report

Write docs/briefs/bot-balance-durability8-report.md and index in docs/README.md.
Record hashes, completeness, timing/resources, deaths and tooling censors.

1. Verify builds/geometry/non-HP stats match across arms. hpTreatment includes
   shield fraction for the Bear; verify that only declared targets changed and
   Desert dealer HP is unchanged. Confirm both controller types/Bear are present.
2. Per named species/build/arm: each seed's clean TTK median, outer median of
   seed medians, clean samples, kills, unfinished targets and regain exclusions.
   Recompute from raw index.targets, not pooled generated per-type medians.
   Report Dune Stalker and Basilisk separately. Never turn missing kills into0.
3. Typical T3 toughest-enemy target25-35s is the median of SIX baseline class
   medians, not a hard minimum for every build. Show spread and alternatives
   separately. Missing class medians make the center incomplete.
4. Pair Desert controller lifetime with dealer attacks, damage, kill ordering,
   recovery and overlap. Distinguish an intentional two-enemy pair from merged
   natural episodes/repopulation. Does longer control duration create excessive
   dealer pressure even though the dealer's stats stayed fixed?
5. Bear: compare the two HP1.5 arms directly. Report shield absorption and
   available break/shatter/vulnerability chronology from raw events, alongside
   damage gaps and kill/censor counts. Do not use zero cast counts as absence
   of an automatic shield mechanic. Mark telemetry gaps instead of inventing
   shield uptime. Is the old Conduit extreme lifetime reproduced or alleviated?
6. Per seed: deaths/time, minimum HP, largest hit/1s pressure, recovery. Inspect
   final10s/30s sources for deaths and severe survivors below20% HP. Longer fights,
   kiting/chill and overlapping enemies are distinct from a pure HP problem.
7. Controls can contextualize Durability1 on matching seeds, but source/ability
   changes prevent causal historical comparisons. Use this batch's control first.
8. Return a controller HP bracket and Bear shield-scaling recommendation, or
   insufficient evidence. No live patch, automatic winner, class nerf, weapon
   swap, combined new treatment or operator-selected retry. Separate ability/
   weapon balance remains later work.
