# Durability15 — Volcano anchor durability and pressure

Prepared 2026-09-16. Manual Luna operator. Full experiment NOT launched.
Run once, sequentially; no subagents, retries, source edits or adaptive builds.

## Question and fixed matrix

Can the Tortoise anchor last longer without excessive attrition, and does reducing
anchor/gunner attack make that sustainable across six classes? This is a local
benchmark overlay trial, not a production balance patch.

| Arm | Tortoise HP | Tortoise attack | Salamander attack |
| --- | ---: | ---: | ---: |
| control | 2000 | 145 | 105 |
| pressure80 | 2000 | 116 | 84 |
| anchor150 | 3000 | 145 | 105 |
| anchor150-pressure80 | 3000 | 116 | 84 |

Salamander HP stays1330. Tortoise Molten Guard remains14% of HP: the HP treatment
also increases its base shield capacity280 to420 before node modifiers. This is
anchor durability including its natural shield scaling, not raw HP in isolation.
Attack relief bundles two species; it cannot identify their separate effects.
Raw attack reductions need not produce exactly20% less final damage.

Six roots x Volcano03/05 x four arms =48 cells; seeds3911/6151/8089 =144 observations.
All use Sweep, fixed medium frames and native close/mid ranges, inherited +5 gear,
stances and runes. Sweep is a control choice, not a claim it wins for every class.
No Slam/ability changes. Scuttlers, Hounds, Salamander HP, plating, DR, Heat, packs,
weapons and classes stay unchanged. Overlays restore definitions after each run.
Fresh prepared World per observation,100ms ticks,300s maximum, first player death
ends that observation. These are paired historical seeds, not independent replication.

Estimate20–35 wall minutes, up to12h simulated; existing120s observation wall,
4h block and2GiB RSS ceilings remain. No Docker, database, travel or services.
Gameplay deaths/stalls advance the fixed matrix. Tooling failure stops; preserve
partial data. Do not reinstate an all-or-nothing movement gate.

## Evidence limits and residual movement

Durability14 completed72 observations with two deaths and four terminal quiet
intervals. Diagnostic replays reproduced all four kill counts/last-damage times.
Outputs: C:/Users/osaif/AppData/Local/mmo-idle/validation/durability15/residuals
and residual-details. No movement patch is included here.

- Slinger03/Sweep3911:24 kills, last damage132.5s. Returning targets can receive
  pack assistance from engaged mates; pack reacquisition is a source-backed
  candidate for repeated leash return, not yet a causally verified repair.
- Striker05/Slam6151:62 kills, last260.6s; similar returning/pack-assist candidate.
- Slinger05/Slam3911:27 kills, last179.2s; vent-edge pull/target switching is a
  candidate. Stationary firing was not established in the inspected window.
- Conduit05/Slam6151:21 kills, last210.4s; stationary player and changing target
  movement remain unresolved. Do not assign a confirmed cause.

Only the first exact case is in the new Sweep matrix; the three Slam failures
remain recorded, not resolved. Treatments can create new exposure failures.
The exposure audit flags internal/terminal outgoing-damage gaps >=30s. Keep ALL
raw rows and deaths. Report all outcomes, then sensitivity restricted to entire
four-arm matched class/node/seed sets without long inactivity. Do not delete only
a bad arm or treat quiet survival as pressure tolerance. Completed clean body
TTK before a stall may be descriptive with explicit exposure limits. The flag is
an exclusion warning, not proof every unflagged fight is mechanically clean.

## Frozen identity and preparation

- Revision: `df86303f8921260845f7ffecc656b9f70764f30b`
- Tree: `716b46157a2f93916dd5539482ac20385a6bff2f`
- Definitions SHA256: `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Frozen local preparation:48 configurations qualified; four Squire05/3911 arms
passed30s pilot with zero deaths or long quiet flags. Pilot is tooling validation,
not balance evidence. Artifacts: C:/Users/osaif/AppData/Local/mmo-idle/validation/durability15
under qualify and pilot. Exact overlay/restoration unit test and frozen typecheck passed. Full suite/live browser playtest not rerun.
Runtime combat remains the Durability14 baseline; concurrent shared-checkout
combat/Detonate/status changes are excluded deliberately for comparability.

## Operator commands

Run from the main repository. Do not rerun local preparation/pilot or diagnostics.

```powershell
$dur15Revision = 'df86303f8921260845f7ffecc656b9f70764f30b'
$dur15Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability15-20260916'
$dur15Checkout = "$dur15Root/source"
$dur15Out = "$dur15Root/results-volcano"
$dur15Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur15HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur15Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur15Hitboxes).Hash -ne $dur15HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur15Root | Out-Null
git worktree add --detach "$dur15Checkout" $dur15Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur15Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur15Checkout" rev-parse HEAD) -ne $dur15Revision) { throw 'Revision mismatch' }
if ((git -C "$dur15Checkout" rev-parse 'HEAD^{tree}') -ne '716b46157a2f93916dd5539482ac20385a6bff2f') { throw 'Tree mismatch' }
if (git -C "$dur15Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
$dur15Start = (Get-Date).ToUniversalTime().ToString('o')
pnpm --dir "$dur15Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability15 --mode=run "--revision=$dur15Revision" "--hitboxes=$dur15Hitboxes" "--out=$dur15Out"
$dur15Exit = $LASTEXITCODE
@{trial='durability15'; start=$dur15Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur15Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur15Root/operator-ledger.jsonl"
if (Test-Path -LiteralPath "$dur15Out/index.json") {
    node "$dur15Checkout/scripts/ttk-survey-report.mjs" "$dur15Out"
    if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
}
if ($dur15Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
node "$dur15Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur15Out" --trial=durability15 "--revision=$dur15Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur15HitboxHash" --cells=48 --runs=144 --seeds=3911,6151,8089 2>&1 | Tee-Object -FilePath "$dur15Out/verification.log"
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
node "$dur15Checkout/scripts/durability15-exposure.mjs" "$dur15Out"
if ($LASTEXITCODE -ne 0) { throw 'Exposure audit failed; preserve and stop' }
```

## Required report and decisions

Write docs/briefs/bot-balance-durability15-report.md and index it. Record frozen
identity, manifest/index hashes, completion, wall time/resources, all exclusions
and deaths. Compare initial geometryRosterHash and equipment within each four-arm
set, and confirm overlay READY values before interpreting differences.

Report per-seed clean species TTK medians, then outer medians; separate unfinished,
regained and missing targets. Include Tortoise guard/HP, minion beats, kills,
exposure/recovery, minHP and deaths by class/node/arm. Include all-outcome and
matched-exposure sensitivity tables. No pooled species/class global winner.
Inspect deaths and <20% survivors with10s/30s source windows; separate direct,
DoT and environmental evidence. Heat6 does not quantify its causal contribution.

Compare pressure80-control and combined-anchor150 for attack relief; compare
anchor150-control and combined-pressure80 for durability. Report interaction
and class tails, especially Conduit, rather than assume a universal HP multiplier.
Tough T3 enemies have a provisional20–30s design region, with20–25s floor under
consideration; it is not a requirement that every swarm body lasts that long.
The trial asks whether anchor durability improves without unacceptable attrition,
not whether an arbitrary target justifies repeated HP buffs.

Recommend adoption, rejection or a smaller follow-up; do not auto-apply production
balance. Then resume remaining T2/T3 role/roster gaps including Forest. Slam and
other abilities stay for the later ability pass; T4 and boss TTK remain later.
Synthetic prepared combat only, no economy/acquisition or complete-tier claims.

