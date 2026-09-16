# Durability16 — isolate Volcano anchor and gunner attack relief

Prepared 2026-09-16. Manual Luna operator; NOT launched. Execute once sequentially.
No subagents, retries, adaptive templates, source changes or production patches.

## Planner assessment of Durability15

144 observations completed in22m44s. Raw index and exposure audit confirm:

| Arm | Deaths /36 | Long-quiet observations |
| --- | ---: | ---: |
| control | 2 | 1 |
| pressure80 | 0 | 4 |
| anchor150 | 1 | 1 |
| anchor150-pressure80 | 0 | 2 |

Eight flags occur across the whole experiment, not eight in pressure80 alone.
31/36 four-arm matched sets survive the exposure screen. Volcano03 Conduit has
zero such sets; treating all its quiet survivors as successful balance is invalid.

Attack relief improves minimum-HP medians in all12 class/node groups. Combined
HP/attack changes preserve longer Tortoise fights with no deaths, lowest observed
HP about34.3%, versus anchor150's death and2.1% survivor. This supports a candidate,
not adoption. Adding HP alone is not a satisfactory solution. It also does not
prove HP3000 is inherently wrong: the question is its sustainable damage budget.
Squire05 Tortoise median moves12.8 to18.65s with the combined arm; Spirit03 moves
5.5 to8.3s. Do not increase all HP repeatedly to force the fastest class to20s.
Scuttlers remain short-lived; no blanket swarm durability increase is proposed.

The operator report's proposed movement prerequisite is advisory. This packet
continues useful balance work and retains exposure exclusions, without claiming
to repair movement or demanding all four-arm sets pass before any interpretation.

## Fixed experiment

Three pressure-sensitive roots: Conduit, Apprentice, Slinger. T3 Volcano03/05,
Sweep fixed, existing medium frames/native ranges/+5 gear/runes/stances.
24 cells x seeds3911/6151/8089 =72 observations. Paired historical seeds are
intentional for failure comparison, NOT independent replication.

Tortoise HP stays3000 in EVERY arm, Molten Guard remains14% (base420 capacity).
This conditions attack comparisons on the candidate durability level; it does
not retest the HP effect or compare to live HP2000 within this experiment.

| Arm | Tortoise attack | Salamander attack |
| --- | ---: | ---: |
| anchor150 reference | 145 | 105 |
| tortoise80 | 116 | 105 |
| salamander80 | 145 | 84 |
| both80 | 116 | 84 |

Salamander HP1330 and all other stats/mechanics remain unchanged: Scuttlers,
Hounds, Heat, plating, DR, shield percentage, pack behavior and abilities.
Process-local overlays restore all definitions after each observation. No live
balance patch. Each fresh World runs100ms ticks up to300s; first death ends that
observation. Retain natural ecology and hazard exposure. No artificial respawns,
teleports, refills or stripping awkward mobs to manufacture clean results.

Expected10–20 wall minutes, up to6h simulated. Existing120s observation wall,
4h block/2GiB RSS ceilings. No Docker, DB or services. Gameplay failure advances;
tooling failure stops and preserves partials. No movement prerequisite block.

## Frozen identity and local checks

- Revision: `1b0188d805e2357afdea3679e8886f6cace7faba`
- Retained branch: `codex/durability16-frozen`
- Tree: `637eadabf1a9ab1ff6ac3ff96ff33e8058860cfc`
- Definitions SHA256: `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Frozen parent is Durability15 runtime, not current shared HEAD. Concurrent combat,
DoT, Detonate and presentation edits are excluded for comparability. Reconcile
later before a production adoption; this experiment cannot validate those edits.

24/24 setup qualifications and four Apprentice05/3911 arms in a30s pilot passed;
zero pilot deaths/long-quiet flags. Overlay isolation/restoration test and frozen
benchmark typecheck passed. Qualification/pilot are tooling evidence only, not
new balance samples. Full suite and browser playtest not rerun.
Artifacts: C:/Users/osaif/AppData/Local/mmo-idle/validation/durability16.
Do not rerun pilot/qualify. Existing durability15-exposure.mjs is reused: its
four-arm grouping reads manifest treatment names and is compatible with this trial.

## Operator commands

Run from the main repository. If output root exists, inspect/report and stop.
```powershell
$dur16Revision = '1b0188d805e2357afdea3679e8886f6cace7faba'
$dur16Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability16-20260916'
$dur16Checkout = "$dur16Root/source"
$dur16Out = "$dur16Root/results-volcano"
$dur16Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur16HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur16Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur16Hitboxes).Hash -ne $dur16HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur16Root | Out-Null
git worktree add --detach "$dur16Checkout" $dur16Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur16Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur16Checkout" rev-parse HEAD) -ne $dur16Revision) { throw 'Revision mismatch' }
if ((git -C "$dur16Checkout" rev-parse 'HEAD^{tree}') -ne '637eadabf1a9ab1ff6ac3ff96ff33e8058860cfc') { throw 'Tree mismatch' }
if (git -C "$dur16Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
$dur16Start = (Get-Date).ToUniversalTime().ToString('o')
pnpm --dir "$dur16Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability16 --mode=run "--revision=$dur16Revision" "--hitboxes=$dur16Hitboxes" "--out=$dur16Out"
$dur16Exit = $LASTEXITCODE
@{trial='durability16'; start=$dur16Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur16Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur16Root/operator-ledger.jsonl"
if (Test-Path -LiteralPath "$dur16Out/index.json") {
    node "$dur16Checkout/scripts/ttk-survey-report.mjs" "$dur16Out"
    if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
}
if ($dur16Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
node "$dur16Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur16Out" --trial=durability16 "--revision=$dur16Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur16HitboxHash" --cells=24 --runs=72 --seeds=3911,6151,8089 2>&1 | Tee-Object -FilePath "$dur16Out/verification.log"
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
node "$dur16Checkout/scripts/durability15-exposure.mjs" "$dur16Out"
if ($LASTEXITCODE -ne 0) { throw 'Exposure audit failed; preserve and stop' }
```

## Report and decision rules

Write docs/briefs/bot-balance-durability16-report.md and index it. Record revision,
tree, manifest/index hashes, wall time, completeness and all deaths/exclusions.
Check READY overlays, geometry and equipment equality within all18 matched sets.
Recompute per-seed clean species medians, then outer medians. Keep missing,
unfinished, regained, deaths and minion attack beats separate. Include per-seed
values: three observations do not establish a precise population failure rate.

Report all-outcome and whole-four-arm exposure sensitivity tables. Flag internal
and terminal outgoing-damage gaps >=30s; quiet survival is not sustained safety.
Do not remove only a failing treatment. Keep every death, even in a set excluded
from clean exposure summaries. An unflagged run is not proof of perfect movement.
Clean pre-stall body TTK can be descriptive, with its limits stated.

Compare tortoise80-reference and both80-salamander80 for Tortoise attack effects;
compare salamander80-reference and both80-tortoise80 for Salamander effects.
Include interaction, kills, minHP, recovery, incoming damage and10s/30s windows
around deaths/<20% HP. Separate Heat/lava/DoT state from event damage attribution.
Changes in natural fight order are downstream treatment effects and can also
create exposure problems; initial geometry matching does not equalize all fights.

Reference and both80 should reproduce Durability15 anchor150/combined for the
same class/node/seed. Check outcomes, elapsed time, kills and minHP; label any
unexpected difference as a reproducibility problem before balance interpretation.
Do not count these repeats as independent confirmation. The single-species arms
provide the new information; reused bookends keep comparisons auditable.

Decision at review: recommend the smallest species-specific relief that retains
candidate anchor duration without deaths or deep HP collapses in comparable
exposure. <20% is a diagnostic threshold, not a universal pass/fail contract.
Both80 remains an option if neither single-species treatment suffices. Recommend
no adoption for exposure-limited class/node cases; do not invent a winner there.
No automatic production patch, further HP escalation or ability buff.

If Conduit03 still has no valid matched set, report its balance conclusion as
unresolved and keep a separate targeted movement/minion investigation. Do not
launch another whole-matrix retry. Use the usable Apprentice/Slinger evidence,
plus Durability15's other roots, to recommend a candidate or reject one. The next
broad balance coverage should return to remaining T2/T3 roles (including Forest),
with unresolved Volcano cases explicitly carried forward. An eventual candidate
needs reconciliation with current combat changes and fresh-seed confirmation;
this is not certification of the entire biome or all six classes.

Slam/ability tuning, item/class balance, boss TTK and T4 remain later. No economy,
acquisition, live/browser, human-feel or complete-tier claims.
