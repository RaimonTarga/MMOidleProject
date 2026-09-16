# Durability 9 — role durability patch and Bear pressure screen

Prepared2026-09-16. Manual Luna execution: two blocks once, sequentially.
Planner has applied the approved source patch and prepared the experiment;
the full experiment has NOT been launched. No adaptive operator decisions.

## Applied balance patch

Authored values, before normal node modifiers:

| Monster | Previous | Selected live value |
| --- | --- | --- |
| T2 Dire Wolf | HP350 | HP525 |
| T2 Stampede Bull | HP330 | HP495 |
| T2 Jungle Ape | HP600 | HP1200 |
| T3 Silverback | HP1045 | HP2090 |
| T2 Moss-Shell Snapper | HP340 | HP680 |
| T3 Plague-Shell Snapper | HP580 | HP1160 |
| T2 Sun Scarab | Attack60 | Attack48 |
| T3 Dune Stalker | HP1350 | HP4050 |
| T3 Desert Basilisk | HP1350 | HP4050 |
| T3 Gilded Scarab | Attack120 | Attack96 |

This is the first propagation pass, not a final duration certification. Keep
small swarm bodies/dealers' HP, controller damage, DR/plating, attack cadence,
abilities, ecology, rewards and Cave/Mountain HP unchanged. T1/T4 untouched.
T2 Desert gets pressure relief before controller HP changes. T3 adopts the
Night4 candidate while retaining its alternate-Slinger and Conduit watchlist.
No live Bear change: its pressure comparison is still experimental.

## Fixed matrix

| Block | Trial | Cells | Runs |
| --- | --- | ---: | ---: |
| A old/new roster patch | durability9roster | 200 | 600 |
| B Bear pressure | durability9bear | 32 | 96 |

Total232 configurations /696 observations,18 nodes. Three seeds173/947/2027,
300s fresh Worlds,100ms ticks, stop first player death; natural ecology.
Maximum58 simulated hours; estimate45–90 wall minutes based on Night4, not a
guarantee. Existing120s observation/4h block/2GiB RSS limits remain. Two block
ceilings could total8h; any tooling failure/censor stops the packet, no retry.

A: nodes03/05 in T2 Forest, Plains, Jungle, Swamp, Desert and T3 Jungle, Swamp,
Desert. Six baseline classes everywhere; add Slinger DoT and Conduit on-hit only
in T3 Desert. Two arms: absolute previous values versus selected live values,
on identical frozen runtime. Previous restores all ten patch fields; selected
asserts the applied values. Geometry and builds must match across arms.

B: T3 Tundra03/05; six baselines plus Slinger DoT/Conduit on-hit. Both arms use
Glacier Bear HP3750 (2.5x original), shieldPct0.08 (original300 authored shield
capacity); Bear attack185 versus148. Node HP modifiers apply to shield capacity.
Cadence11s/duration6s,12% max-HP shatter damage and30%/4s vulnerability unchanged.
Other Tundra enemies/chill unchanged. This isolates Bear base attack and its
attack-derived specials. It does not compare to live BearHP1500 or test more HP.

All builds retain +5 gear, biome armor/charm, Mountain boots, Tempered Core,
medium frames, normal close melee/mid ranged branches, offensive stance,
Sweep, Second Wind/Cleanse and T3 Frenzy. No Slam or weapon adaptation. Normal
survey skill/recipe/upgrade legality applies; acquisition is synthetically granted.
All overlays restore definitions between Worlds, including shield fractions.

## Questions and decision rules

1. Does the new role package lengthen the selected bodies across classes and both
   nodes without creating unacceptable attrition or class-specific walls? Return
   retain/adjust/revert recommendations by species/role, not automatic live edits.
2. Does Sun Scarab relief improve Striker/Apprentice survival? Does T3 Desert's
   selected package generalize to05? Keep controllers/dealer separate; inspect
   alternate Slinger and slow Conduit rather than hiding them in the center.
3. At fixed Bear HP/shell, does attack relief address Apprentice/Slinger deaths?
   Inspect Bear versus caster damage and slow/control exposure before recommending
   a mechanic change. Do not further increase Bear HP to force the timing band.

Per species/node/build/arm: compute each seed's clean TTK median then outer median
of seed medians from raw targets. Include clean sample/kill counts, unfinished,
regain exclusions and missing seed medians. Six-baseline center only; alternatives
separate. Toughest-elite reference15–25s T2/25–35s T3 is not a required floor for
every build or a target for swarm bodies. Do not pool support/dealer/elite TTK.
Record per-seed death/time, minimum HP, peak hit/1s damage and recovery; inspect
damage sources around each death AND the minimum-HP timestamp for survivors
below20%, not merely the last30s of an otherwise recovered run. Report exposure
and kill ordering alongside body TTK. Episodes can merge pulls/repopulation.

The runner now reports minionAttackBeats and totalAttackBeats as well as legacy
player-only attackBeats. These count cooldown timestamp changes, not damage
events or guaranteed hits. Conduit's zero player-only count is not inactivity.
Keep existing body-TTK semantics for continuity: first damage to kill excludes
pre-hit charge/acquisition. No technique balance conclusion from this batch.
Full charge/secondary-hit instrumentation is deferred to the later AoE pass;
existing technique-adapter budgets are not actual secondary damage hits.

This is prepared synthetic combat evidence, not acquisition/travel/economy,
client/browser/human-feel validation. No Docker/database/services needed.

## Frozen identity and readiness

- Revision: `02758290bc40042d0f65618e465ecb5e0b78d09d`
- Tree: `3e5c4e11b39549289fae8843b911d44e1ad9417a`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Qualification root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability9`

Workspace/bench typecheck, Durability9 overlay isolation/restoration, Desert
pairs, Tundra chill, ecology polish and Night4 tests passed. The Desert pair
assertion now compares nominal basic-attack DPS instead of per-hit attack;
Sun Scarab still exceeds Basilisk DPS after relief due to faster cadence.
Full suite and live playtest not run. Frozen qualification receipt appended below.

## Operator workflow

Execute the commands below from the shared repository. No repeat qualification,
pilots, source/balance edits, adaptive build changes, retries or extra experiments.
Deaths advance the matrix. Tooling failure/interruption stops the entire packet;
preserve partial artifacts, report and wait. Do not clean unrelated resources.

Write `docs/briefs/bot-balance-durability9-report.md` and index in docs/README.md.
Include both blocks' completeness, manifest/index hashes, frozen identity,
timing/resource limits and explicit evidence boundaries. Verify treatment
isolation/build/geometry from ready files; unrelated stats and companion HP must
match. Use actual post-overlay ready values, not the unmodified manifest hash,
to distinguish arms. Preserve source and all artifacts for planner review.


```powershell
$dur9Revision = '02758290bc40042d0f65618e465ecb5e0b78d09d'
$dur9Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability9-20260916'
$dur9Checkout = "$dur9Root/source"
$dur9Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $dur9Root) { throw 'Output exists: inspect/report, no overwrite or relaunch' }
if ((Get-FileHash -LiteralPath $dur9Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur9Root | Out-Null
git worktree add --detach "$dur9Checkout" $dur9Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree failed' }
pnpm --dir "$dur9Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
if ((git -C "$dur9Checkout" rev-parse HEAD) -ne $dur9Revision) { throw 'Revision mismatch' }
if ((git -C "$dur9Checkout" rev-parse 'HEAD^{tree}') -ne '3e5c4e11b39549289fae8843b911d44e1ad9417a') { throw 'Tree mismatch' }
if (git -C "$dur9Checkout" status --porcelain --untracked-files=no) { throw 'Dirty tracked source' }
$dur9Jobs = @(
    @{ trial='durability9roster'; cells=200; runs=600 },
    @{ trial='durability9bear'; cells=32; runs=96 }
)
foreach ($dur9Job in $dur9Jobs) {
    $dur9Out = "$dur9Root/results-$($dur9Job.trial)"
    $dur9Start = (Get-Date).ToUniversalTime().ToString('o')
    pnpm --dir "$dur9Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts "--trial=$($dur9Job.trial)" --mode=run "--revision=$dur9Revision" "--hitboxes=$dur9Hitboxes" "--out=$dur9Out"
    $dur9Exit = $LASTEXITCODE
    @{ trial=$dur9Job.trial; start=$dur9Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur9Exit } | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur9Root/operator-ledger.jsonl"
    if (Test-Path -LiteralPath "$dur9Out/index.json") {
        node "$dur9Checkout/scripts/ttk-survey-report.mjs" "$dur9Out"
        if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; stop and report partial batch' }
    }
    if ($dur9Exit -ne 0 -or (Test-Path -LiteralPath "$dur9Out/failed.json")) { throw 'Simulation failed; stop and report partial batch' }
    $dur9Done = Get-Content -Raw -LiteralPath "$dur9Out/complete.json" | ConvertFrom-Json
    $dur9Manifest = Get-Content -Raw -LiteralPath "$dur9Out/manifest.json" | ConvertFrom-Json
    if ($dur9Done.cells -ne $dur9Job.cells -or $dur9Done.runs -ne $dur9Job.runs -or $dur9Done.mode -ne 'run') { throw 'Incomplete block' }
    if ($dur9Manifest.trial -ne $dur9Job.trial -or $dur9Manifest.revision -ne $dur9Revision -or $dur9Manifest.definitionsHash -ne '9db8e38909cb8ec1b60faac20cdb412ff798498ebeee4c5d05f6fbd70a9f8aed' -or $dur9Manifest.hitboxesSha256 -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83' -or ($dur9Manifest.seeds -join ',') -ne '173,947,2027') { throw 'Identity mismatch' }
}
```

## Qualification receipt

READY. All232 configurations qualified in frozen source; four30s pilots and
report generation passed. These are tooling checks, not balance outcomes.
Paired geometry, builds, unchanged defense stats and companion HP verified.
Both Conduit pilots record positive minion/total attacks with zero player attacks.

Definitions SHA256: `9db8e38909cb8ec1b60faac20cdb412ff798498ebeee4c5d05f6fbd70a9f8aed`.

| Trial | Qualification index SHA256 |
| --- | --- |
| durability9roster | `c308de7dc265663b483230f1766403675527352e4493948d78c91d2d63ecd4fd` |
| durability9bear | `0c6033e22960a28d3db5a7993c7d167d0b1530fa30580369ccd8ce4549ded116` |
