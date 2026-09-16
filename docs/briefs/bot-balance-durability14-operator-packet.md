# Durability14 — resume the pending Volcano technique comparison

Prepared2026-09-16. Manual Luna operator. Comparison **not launched**.
Run once, sequentially. No subagents, retries, source edits or adaptive builds.

## Decision and scope

The Swamp6151 failure was a repeated hazard-pull/chase handoff. An enemy briefly
crossing the hazard-clearance boundary cancelled an unfinished retreat; normal
chase reset the timeout. The frozen patch finishes the safe retreat leg and
retains the timeout across those switches, while actual contact still releases
the pull. A focused regression pins both failure conditions.

Hold all numeric balance and equipment values. No spawn, Heat, HP, attack,
plating, class, ability or weapon changes. Concurrent combat, Detonate, status,
heat/chill/death and presentation edits in the shared checkout are excluded.

This packet runs only the previously unexecuted comparison: T3 Volcano03/05,
six roots, Sweep/Slam, seeds3911/6151/8089. **24 cells /72 observations**.
Each observation uses a fresh prepared World, natural ecology,100ms ticks,
300s maximum, first death ends that observation. Templates remain the
Durability13 medium-frame/normal-range builds, with technique as the only
within-pair change. Preserve Conduit's minion damage and Slam's charge time.

The trial identifier intentionally remains `durability13swarm`: this is the
same pending matrix on a repaired runtime, in a NEW Durability14 output root.
Do not overwrite or extend Durability13 artifacts. Do not rerun Plains, the
roster, diagnostic probes, pilots or the already completed movement qualification.

Estimate10–20 wall minutes, up to6h simulated. Existing120s per-observation,
4h block and2GiB RSS ceilings remain. No Docker, database, services or travel.
Deaths advance the fixed matrix; tooling failure stops and retains partial data.

## Frozen identity and qualification

- Revision: `6be18a7b6974bc10df5fe2cb31cf24a628b784de`
- Tree: `ba4104ea9b2d9431d647b337b083515d73cba62c`
- Definitions SHA256: `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Qualification root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability14`.
The operator must verify the existing frozen `movement-confirmation` receipt
below, not rerun it. Candidate replays in `baseline`/`candidate1` are debugging
evidence and are not a second independent balance sample.

Frozen qualification completed: **15/15 full300s windows, zero deaths, exposure
gate passed**, maximum quiet intervals6.3–16.4s. Swamp6151's maximum is11.7s;
monster14 (the stalled Hexer) took its first damage174.8s and died176.0s.
It was killed, not merely skipped. Matrix/artifact verifier returned
`verified:true`; all24 Volcano configurations passed preparation qualification.
Frozen typecheck and all six focused movement tests passed: hazardPullApproach,
autoMovementSmoothness, runeDynamicHazardAvoidance, keepDistanceRing,
approachGoalStandable and autoCollisionRecovery. Full suite and live/browser playtest were
not rerun. Numeric balance and the pending comparison remain untested here.

Qualification SHA256 receipts:

| Artifact | SHA256 |
| --- | --- |
| movement-confirmation/manifest.json | `ED9DBB40DEC9B22C4E6AAFF754354939AA0A4B55D69F11FE7CA0D8BF737461F1` |
| movement-confirmation/index.json | `C9DC7B2C105FD97FC4FE734D24F3ACB810D15AADC3FD04E2C87237B6CD5DF3DB` |
| movement-confirmation/engagement-gate.json | `B77396FD608B17CBB911D5262EA87F7605ABCCF14CC525F0A3A491E4CBD651DC` |

## Operator commands

```powershell
$dur14Revision = '6be18a7b6974bc10df5fe2cb31cf24a628b784de'
$dur14Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability14-20260916'
$dur14Checkout = "$dur14Root/source"
$dur14Out = "$dur14Root/results-volcano"
$dur14Qualification = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/durability14/movement-confirmation'
$dur14Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur14HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur14Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur14Hitboxes).Hash -ne $dur14HitboxHash) { throw 'Hitbox mismatch' }
foreach ($dur14ReceiptHash in @(
    @{file='manifest.json'; hash='ED9DBB40DEC9B22C4E6AAFF754354939AA0A4B55D69F11FE7CA0D8BF737461F1'},
    @{file='index.json'; hash='C9DC7B2C105FD97FC4FE734D24F3ACB810D15AADC3FD04E2C87237B6CD5DF3DB'},
    @{file='engagement-gate.json'; hash='B77396FD608B17CBB911D5262EA87F7605ABCCF14CC525F0A3A491E4CBD651DC'}
)) {
    if ((Get-FileHash -LiteralPath "$dur14Qualification/$($dur14ReceiptHash.file)").Hash -ne $dur14ReceiptHash.hash) { throw 'Qualification receipt hash mismatch' }
}
$dur14Receipt = Get-Content -LiteralPath "$dur14Qualification/engagement-gate.json" -Raw | ConvertFrom-Json
$dur14QualificationManifest = Get-Content -LiteralPath "$dur14Qualification/manifest.json" -Raw | ConvertFrom-Json
if (!$dur14Receipt.passed -or $dur14Receipt.results.Count -ne 15 -or $dur14QualificationManifest.revision -ne $dur14Revision) { throw 'Missing successful frozen movement receipt; stop' }
node scripts/ttk-survey-verify.mjs "--out=$dur14Qualification" --trial=durability13movement "--revision=$dur14Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur14HitboxHash" --cells=5 --runs=15 --seeds=173,3911,6151
if ($LASTEXITCODE -ne 0) { throw 'Qualification identity failed' }
New-Item -ItemType Directory -Path $dur14Root | Out-Null
git worktree add --detach "$dur14Checkout" $dur14Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur14Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur14Checkout" rev-parse HEAD) -ne $dur14Revision) { throw 'Revision mismatch' }
if ((git -C "$dur14Checkout" rev-parse 'HEAD^{tree}') -ne 'ba4104ea9b2d9431d647b337b083515d73cba62c') { throw 'Tree mismatch' }
if (git -C "$dur14Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
$dur14Start = (Get-Date).ToUniversalTime().ToString('o')
pnpm --dir "$dur14Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability13swarm --mode=run "--revision=$dur14Revision" "--hitboxes=$dur14Hitboxes" "--out=$dur14Out"
$dur14Exit = $LASTEXITCODE
@{trial='durability13swarm'; start=$dur14Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur14Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur14Root/operator-ledger.jsonl"
if (Test-Path -LiteralPath "$dur14Out/index.json") {
    node "$dur14Checkout/scripts/ttk-survey-report.mjs" "$dur14Out"
    if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
}
if ($dur14Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
node "$dur14Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur14Out" --trial=durability13swarm "--revision=$dur14Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur14HitboxHash" --cells=24 --runs=72 --seeds=3911,6151,8089 2>&1 | Tee-Object -FilePath "$dur14Out/verification.log"
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
```

## Required report and interpretation

Write `docs/briefs/bot-balance-durability14-report.md` and index it. Record
revision/tree, manifest/index hashes, readiness/roster checks, completeness,
wall time/resources and the qualification receipt. Preserve failures as observed.

- First audit exposure: every30s outgoing-damage gap, selected versus combat
  targets, blocked reason, recovery, hazard contacts, casts and returning enemies.
  Quiet survivors cannot support sustained-safety or technique-strength claims.
- Compare paired Sweep/Slam within class/node/seed. Report per-seed clean species
  TTK medians then outer medians, kills, attack/minion beats, pressure, recovery
  and min HP. Keep unfinished, regained, missing and deaths separate. Do not pool
  fast/slow classes or different species into a single technique winner.
- Separate Scuttlers/Hounds/Salamanders from Tortoise anchors. Short first-hit-to-
  death TTK omits charge/approach time; include those costs in technique analysis.
- Inspect deaths and <20% survivors with10s/30s source windows. Separate direct
  hits, DoT, lava and Heat. No blanket swarm HP or Heat adjustment follows from
  low body TTK alone.
- Readiness and initial geometry must match within pairs. Changed movement can
  change subsequent fights, so historical same-seed comparisons are descriptive,
  not controlled HP/ability treatment estimates.

Finish with recommendations, no automatic balance patch. Synthetic prepared
combat only: no economy, acquisition, travel, browser, human-feel or complete-tier
certification. After this, resume remaining T2/T3 roster/role durability and
pressure gaps, including Forest; items/classes/abilities, boss TTK and T4 follow.
