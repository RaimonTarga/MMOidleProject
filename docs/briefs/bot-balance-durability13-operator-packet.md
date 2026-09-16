# Durability 13 — sustained engagement, then Volcano technique comparison

Prepared 2026-09-16. Manual Luna operator. Full experiment **not launched**.
Run once, sequentially. No subagents, retries, source edits or adaptive builds.

## Decision

Hold all balance values. Repair exposure before interpreting technique strength.
The runtime validates hazard pull destinations against other hazards and actual
path endpoints, defers unsuccessful hazard approaches after15s for30s, applies
hazard-aware reachability to target selection and its idle fallback, and lets
returning monsters finish returning before scanning for proximity aggro again.
Existing damage retaliation remains separate. No spawn, Heat, HP, damage,
weapon, ability, class or rune-cost changes are included.

Local diagnostic qualification reproduced the original rosters and then ran six
full300s cases on the candidate patch:

| Case | Seed | Kills | Last outgoing damage | Largest sampled quiet interval |
| --- | --- | ---: | ---: | ---: |
| Jungle05 Squire | 173 | 40 | 298.2s | 5.7s |
| Jungle05 Squire | 3911 | 37 | 299.4s | 9.0s |
| Swamp05 Striker | 173 | 27 | 299.9s | 8.2s |
| Volcano03 Spirit Sweep | 6151 | 67 | 299.8s | 10.2s |
| Volcano05 Squire Slam | 6151 | 60 | 299.2s | 12.2s |
| Volcano05 Squire Sweep | 6151 | 66 | 299.9s | 12.6s |

These are debugging/qualification cases, not independent confirmation or a
complete balance result. Source is now frozen for the wider operator matrix.
Do not rerun the diagnostic script or pilots.

## Matrix and gate

1. `durability13movement`: five configurations (the five distinct rows/classes/
   techniques above), each on173,3911,6151: **15 observations**.100ms samples.
2. Only if the engagement gate passes: `durability13swarm`, Volcano03/05,
   six roots, Sweep/Slam, each on3911,6151,8089: **72 observations**.1s samples.

Total87 observations,300s maximum each, first death ends that observation.
Same medium-frame/normal-range builds and equipment as Durability12; inherited
Jungle Squire defensive stance remains. The technique is the only within-pair
change in block2. Plains results are retained; do not rerun Plains or the roster.

The gate requires all15 movement observations to survive the full window with
no sampled outgoing-damage gap reaching30s. A death, valid blocked state or long
recovery also stops expansion: retain it for planner diagnosis, not automatic
failure attribution or retry. Initial elite contact alone does not pass the gate.
The gate is conservative, not a claim that every shorter interruption is correct.

Estimate10–20 wall minutes, up to7h15m simulated. This is an estimate; retain
the harness120s observation /4h block /2GiB RSS ceilings. No Docker or database.

## Frozen identity

- Revision: `8cf9cb73e59862e5f3e1dbb9a392a92ba5bff269`
- Tree: `5762bd013cf2061cd983c76dab378a79a589f529`
- Definitions SHA256: `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Qualification artifacts: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability13/`.
`candidate2` holds the six detailed replays. `qualify-durability13movement` and
`qualify-durability13swarm` certify preparation of all5/24 configurations on the
frozen revision. Candidate replay manifests precede the commit; they are explicitly
dirty candidate qualification, not the frozen operator run. Concurrent status,
heat/chill/death and other combat changes in the shared checkout are excluded.
Use the exact frozen revision; do not substitute the current dirty tree.

Qualification receipt: frozen `pnpm typecheck` passed; all nine focused tests
passed (`autoMovementSmoothness`, `runeDynamicHazardAvoidance`, `keepDistanceRing`,
`approachGoalStandable`, `autoCollisionRecovery`, `eliteTargeting`, `targetPriority`,
`runeTargetingPreference`, `hazardPullApproach`). The latter includes overlapping
bush destination/path checks, bounded deferral/expiry, completed leash return,
and deep-lava selection with/without avoidance. Gate fixtures accepted continuous
damage and rejected quiet/death/missing-telemetry cases. A30s single-cell frozen
telemetry pilot completed with30 samples and outgoing-damage timestamps.
Packet PowerShell syntax parsed successfully. Full suite and live playtest were
not rerun; no full-matrix result is claimed. Frozen checkout remained clean.

## Operator commands

Run from the shared repository. Preserve existing resources. If output exists,
inspect/report it; never relaunch into it or delete it to make these commands pass.

```powershell
$dur13Revision = '8cf9cb73e59862e5f3e1dbb9a392a92ba5bff269'
$dur13Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability13-20260916'
$dur13Checkout = "$dur13Root/source"
$dur13Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur13HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur13Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur13Hitboxes).Hash -ne $dur13HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur13Root | Out-Null
git worktree add --detach "$dur13Checkout" $dur13Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur13Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur13Checkout" rev-parse HEAD) -ne $dur13Revision) { throw 'Revision mismatch' }
if ((git -C "$dur13Checkout" rev-parse 'HEAD^{tree}') -ne '5762bd013cf2061cd983c76dab378a79a589f529') { throw 'Tree mismatch' }
if (git -C "$dur13Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
foreach ($dur13Block in @(
    @{trial='durability13movement'; cells=5; runs=15; seeds='173,3911,6151'},
    @{trial='durability13swarm'; cells=24; runs=72; seeds='3911,6151,8089'}
)) {
    $dur13Trial = $dur13Block.trial
    $dur13Out = "$dur13Root/results-$dur13Trial"
    $dur13Start = (Get-Date).ToUniversalTime().ToString('o')
    pnpm --dir "$dur13Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts "--trial=$dur13Trial" --mode=run "--revision=$dur13Revision" "--hitboxes=$dur13Hitboxes" "--out=$dur13Out"
    $dur13Exit = $LASTEXITCODE
    @{trial=$dur13Trial; start=$dur13Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur13Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur13Root/operator-ledger.jsonl"
    if (Test-Path -LiteralPath "$dur13Out/index.json") {
        node "$dur13Checkout/scripts/ttk-survey-report.mjs" "$dur13Out"
        if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
    }
    if ($dur13Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
    node "$dur13Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur13Out" "--trial=$dur13Trial" "--revision=$dur13Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur13HitboxHash" "--cells=$($dur13Block.cells)" "--runs=$($dur13Block.runs)" "--seeds=$($dur13Block.seeds)" 2>&1 | Tee-Object -FilePath "$dur13Out/verification.log"
    if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
    if ($dur13Trial -eq 'durability13movement') {
        node "$dur13Checkout/scripts/durability13-gate.mjs" "$dur13Out"
        if ($LASTEXITCODE -ne 0) { throw 'Exposure gate stopped expansion; report and return to planner' }
    }
}
```

## Required report

Write `docs/briefs/bot-balance-durability13-report.md` and index it. Preserve
revision/tree, manifest/index hashes, completeness, wall/resource usage, gate
receipt and matched READY builds/initial rosters for technique pairs.

- Movement: longest damage-free interval, actual target contact, target changes,
  selected versus combat target, aggro/return state, hazard contact and blocked
  reason. Retargeting past an inaccessible enemy is not defeating that enemy.
  Distinguish valid blocked states, recovery, casting, deaths and movement bugs.
- Compare Sweep/Slam per class/node/seed, keeping minion damage and charge time.
  Report per-seed clean body medians then their outer median; retain missing,
  unfinished/regained/death cases separately. Separate small swarm bodies from
  Tortoise anchors. Do not pool all classes into a technique winner.
- Inspect every30s quiet interval, death and <20% HP survivor in block2. Attribute
  enemy hits, DoT, lava and Heat separately using10s/30s source windows. A survivor
  who stopped fighting cannot support a safety or durability conclusion.
- Compare Durability12 exposure and durations cautiously: changed movement changes
  encounter composition. Same seed does not guarantee identical later fights.
- End with evidence-supported recommendations. No automatic balance patch.

Synthetic prepared-combat evidence only: no economy, acquisition, travel, live
client, human feel or complete-tier certification. After engagement confirmation,
resume remaining T2/T3 roster/role gaps, then item/class/ability work, boss TTK
and later T4. No direction change is needed before this experiment.
