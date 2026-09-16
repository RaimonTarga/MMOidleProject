# Durability 10 — missing Bear block, Swamp durability and Jungle exposure

Prepared2026-09-16. Manual Luna execution. Three fixed blocks once, in order.
Full experiment NOT launched by planner. No subagent, adaptive rerun or live edit.

## Decision and investigation

Retain the approved Durability9 production patch. Its completed600 observations
remain valid; do not repeat Block A. The missing Bear96 observations run FIRST,
using their ORIGINAL frozen runtime and matrix, into a NEW output directory.

The original post-block identity failure could not be reproduced: persisted
trial/revision/definitions/hitbox/seeds all match. Do not claim a proven cause.
Replaced the generic compound PowerShell guard in this packet with the tested
`scripts/ttk-survey-verify.mjs`. It reports field-level mismatches, verifies full
cell/seed coverage and artifact presence, and rejects failed/censored outcomes.
It passes the completed600-row block. The operator must still stop on failure.

Jungle inspection: Conduit minions continued dealing damage in the final15s
of the T3 Jungle03/s173 death (1320 logged HP damage). Silverback dealt717 and
Stalker349 to the player in that window. There were no minion-kill events in the
retained stream, which is not proof that no summons died. Added per-second
minion HP/position/target/attack timestamps and summon-slot snapshots for the
NEW trials so loss, delivery and exposure can be distinguished.
Silverback's attack ramps3%/s to45%; longer encounters may expose more of that
ramp. This is a testable explanation, not an established sole cause. The T2
Squire death instead had Chameleon379/Snake225/Ape48 damage in the last15s;
do not nerf Ape damage to address a primarily ranged/overlap failure.

No additional production stat change this turn: the new stat adjustments are
isolated experimental overlays; the player adaptation changes only stance.

## Fixed matrix

| Order | Trial | Cells | Observations | Frozen runtime |
| --- | --- | ---: | ---: | --- |
| A | durability9bear | 32 | 96 | original Durability9 |
| B | durability10swamp | 36 | 108 | Durability10 |
| C | durability10jungle | 40 | 120 | Durability10 |

Total108 configurations /324 observations, maximum27 simulated hours.
Three seeds173/947/2027, fresh300s Worlds,100ms ticks, stop first player death.
One sequential process per block, natural ecology. Planning estimate25–50 wall
minutes; not guaranteed. Existing120s observation/4h block/2GiB RSS limits.
A tooling failure/censor stops the packet; no next block or retry. Death is valid.

### A: original missing Bear comparison

T3 Tundra03/05, six baselines plus Slinger DoT/Conduit on-hit alternatives.
Bear HP3750, shield0.08 (300 authored capacity before node modifier), attack185
versus148. Shield11s cadence/6s duration,12% max-HP shatter and30%/4s vulnerability
unchanged. No higher HP, live Bear patch, or change to caster/chill/other enemies.
Exactly the original durability9bear matrix; do not substitute the newer runtime.
Qualification/pilots already completed under Durability9; do not repeat them.
The new minion snapshot fields do NOT exist in this old runtime.

### B: T3 Swamp sturdy-body bracket

Plague-Shell Snapper only, nodes03/05, all six baselines. HP1160 current versus
1740 (+50%) versus2320 (+100%). Attacks/plating/shell/pool/poison/support mobs
unchanged. No new DoT resistance. Measure direct and DoT class tails separately
as shell mechanics gain time to matter. Do not force swarm/support bodies into
the toughest-elite25–35s band or promote the largest value automatically.

### C: Jungle adaptation versus late pressure

T3 Jungle03/05, six baselines, three separate arms:

- control: current HP2090, base attack83, ramp3%/s to45%, offensive stance.
- defensive: only swap offensive stance for defensive stance; same enemies.
- ramp25: offensive stance, only reduce Silverback ramp cap45%->25%; still3%/s.

Do not combine the stance and ramp arms. The cap probe reduces maximum ramped
attack by approximately14%, while leaving the initial base attack unchanged.
It can also reach its cap earlier. This is not a20% base-attack reduction.
All-class coverage tests whether relief helps the slow Conduit tail without
unnecessarily reducing pressure for faster classes. Hold Jungle HP fixed.

T2 Jungle03/05 adds Squire only, control versus defensive stance. No T2 enemy
change. This is a focused follow-up to the Squire failure, not a new T2 class survey.

All builds retain previous baseline weapons, +5 biome armor/charm and Mountain
boots, Tempered Core, medium frame, close melee/mid ranged branches, Sweep,
Second Wind/Cleanse, T3 Frenzy and existing runes. No Slam, weapon adaptation,
class respec or operator changes. Recipe/RP/upgrade legality remains checked.

## Frozen identity

- New runtime: `6d8f97fc2f4a70a329b471cf5d16468c456bc277`
- New tree: `3fb3a87ad96ede9ec2a45f4f9df41ae1bf5447a6`
- Original Bear runtime: `02758290bc40042d0f65618e465ecb5e0b78d09d`
- Original Bear tree: `3e5c4e11b39549289fae8843b911d44e1ad9417a`
- Both definitions SHA256: `9db8e38909cb8ec1b60faac20cdb412ff798498ebeee4c5d05f6fbd70a9f8aed`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Original Bear qualification index: `0c6033e22960a28d3db5a7993c7d167d0b1530fa30580369ccd8ce4549ded116`

Typecheck, Durability9/10 isolation/restoration tests and verifier success/failure
fixtures passed. Full suite/live playtest not run. Qualification receipt below.

## Operator execution

Run from the shared repository. Preserve unrelated changes and completed results.
Existing original Bear checkout must match its identity; stop if absent/dirty.
Create a new checkout only for the new trials/validator. Do not run the old
Durability9 wrapper, which would repeat the completed roster block.

```powershell
$dur10Revision = '6d8f97fc2f4a70a329b471cf5d16468c456bc277'
$dur10BearRevision = '02758290bc40042d0f65618e465ecb5e0b78d09d'
$dur10Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability10-20260916'
$dur10Checkout = "$dur10Root/source"
$dur10BearCheckout = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916/source'
$dur10Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur10HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
$dur10Defs = '9db8e38909cb8ec1b60faac20cdb412ff798498ebeee4c5d05f6fbd70a9f8aed'
if (Test-Path -LiteralPath $dur10Root) { throw 'Output exists; report, do not overwrite/relaunch' }
if (!(Test-Path -LiteralPath $dur10BearCheckout)) { throw 'Original Bear checkout missing' }
if ((git -C "$dur10BearCheckout" rev-parse HEAD) -ne $dur10BearRevision) { throw 'Bear revision mismatch' }
if ((git -C "$dur10BearCheckout" rev-parse 'HEAD^{tree}') -ne '3e5c4e11b39549289fae8843b911d44e1ad9417a') { throw 'Bear tree mismatch' }
if (git -C "$dur10BearCheckout" status --porcelain --untracked-files=no) { throw 'Dirty Bear checkout' }
if ((Get-FileHash -LiteralPath $dur10Hitboxes).Hash -ne $dur10HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur10Root | Out-Null
git worktree add --detach "$dur10Checkout" $dur10Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree setup failed' }
pnpm --dir "$dur10Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur10Checkout" rev-parse HEAD) -ne $dur10Revision) { throw 'New revision mismatch' }
if ((git -C "$dur10Checkout" rev-parse 'HEAD^{tree}') -ne '3fb3a87ad96ede9ec2a45f4f9df41ae1bf5447a6') { throw 'New tree mismatch' }
if (git -C "$dur10Checkout" status --porcelain --untracked-files=no) { throw 'Dirty new checkout' }
$dur10Jobs = @(
    @{ trial='durability9bear'; cells=32; runs=96; source=$dur10BearCheckout; revision=$dur10BearRevision },
    @{ trial='durability10swamp'; cells=36; runs=108; source=$dur10Checkout; revision=$dur10Revision },
    @{ trial='durability10jungle'; cells=40; runs=120; source=$dur10Checkout; revision=$dur10Revision }
)
foreach ($dur10Job in $dur10Jobs) {
    $dur10Out = "$dur10Root/results-$($dur10Job.trial)"
    $dur10Start = (Get-Date).ToUniversalTime().ToString('o')
    pnpm --dir "$($dur10Job.source)" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts "--trial=$($dur10Job.trial)" --mode=run "--revision=$($dur10Job.revision)" "--hitboxes=$dur10Hitboxes" "--out=$dur10Out"
    $dur10Exit = $LASTEXITCODE
    @{trial=$dur10Job.trial; start=$dur10Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur10Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur10Root/operator-ledger.jsonl"
    if (Test-Path -LiteralPath "$dur10Out/index.json") {
        node "$($dur10Job.source)/scripts/ttk-survey-report.mjs" "$dur10Out"
        if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial and stop' }
    }
    if ($dur10Exit -ne 0) { throw 'Simulation failed; preserve partial and stop' }
    node "$dur10Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur10Out" "--trial=$($dur10Job.trial)" "--revision=$($dur10Job.revision)" "--definitions=$dur10Defs" "--hitboxes=$dur10HitboxHash" "--cells=$($dur10Job.cells)" "--runs=$($dur10Job.runs)" '--seeds=173,947,2027' 2>&1 | Tee-Object -FilePath "$dur10Out/verification.log"
    if ($LASTEXITCODE -ne 0) { throw 'Verification failed; retain named mismatches and stop packet' }
}
```

No repeated pilots, qualification, source/balance edits, services/Docker restarts,
resource cleanup or additional experiments. Report partial if stopped.

## Required report

Write `docs/briefs/bot-balance-durability10-report.md`; index in docs/README.md.
Keep original Durability9 report/artifacts unchanged and link this continuation.
Per block record counts, identity, manifest/index hashes, timings, deaths and
tooling censors. Preserve verification logs. No live changes by operator.

1. Verify geometry/build equivalence, allowed stance difference and stat/ramp
   overlays. Read hpTreatment for ramp cap: starting attack alone cannot show it.
2. Per named species/node/class/arm compute each seed's clean TTK median, THEN
   median across seeds for that class, THEN median across the SIX class values.
   Do not swap the seed/class aggregation order or pool unrelated species into
   a node median. Show class range, sample counts, missing medians, unfinished
   and regained targets; never treat missing kills as0. Alternatives separate.
3. Per seed report death/time/minimum HP, peak hit/1s pressure and recovery.
   Inspect10s/30s around deaths and actual sampled HP minima for survivors<20%.
   Attribute Silverback/Stalker/Chameleon and Bear/caster contributions separately.
4. B: show whether higher Snapper HP exposes shell/pool mechanics, increases
   poison/overlap attrition or disproportionately extends direct-damage classes.
   Keep support bodies unchanged. Return retain1160/select1740/select2320 or
   further-design-needed recommendation with survival and slow-tail evidence.
5. C: compare control/defensive for a player-available solution; control/ramp25
   for late-pressure relief. Do not credit a stance benefit to monster tuning.
   Use minion/slot samples to assess loss/respawn, target delivery and player
   exposure; one-second samples can miss brief states. Report missing evidence.
   T2 Squire has no ramp arm; do not attribute its result to Silverback tuning.
6. A: resolve original Bear attack185/148 question at fixedHP/shell. Missing
   explicit break/vulnerability events remain a limitation. Original runtime
   lacks the new minion snapshots; do not claim it recorded them.
7. Body TTK excludes pre-hit charging; episodes may span several pulls. Neither
   measures an authored pack perfectly. Zero player-only attackBeats for Conduit
   is normal; use minion/total attacks and damage. No AoE winner from this packet.

Synthetic prepared combat only. No economy, acquisition, travel, client, human
feel or live-play certification. Return a short decision list, not an auto patch.

## Qualification receipt

READY. All76 new configurations passed frozen qualification; three30s pilots
and report generation passed. These are tooling checks, not balance evidence.
Build equipment/skills/abilities and geometry matched across arms; only declared
stance, Snapper HP and Silverback ramp differ. New minion snapshots verified.

| Trial | Qualification index SHA256 |
| --- | --- |
| durability10swamp | `0d4c623ac375de9710f6df419bd2d38c172484f27d1be114980d59001a4a9f11` |
| durability10jungle | `1717081336b64fe8bc30935aef2fa05bd32152b8f30d57ade9788bafd178ede8` |

Original32-cell Bear qualification hash reverified; no repeat pilot/run.
New qualification/pilot root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability10`.
