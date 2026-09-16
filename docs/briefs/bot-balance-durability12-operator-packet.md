# Durability 12 — hazard approach verification and swarm ability comparison

Prepared 2026-09-16. Manual Luna operator. Full experiment **not launched**.
Execute this packet once, sequentially; do not spawn another operator.

## Decision and scope

Keep adopted Bear HP3750/attack148/shield0.08, Snapper HP2320, and targeted
Jungle defensive preparations. Durability11 was sufficiently positive to move
on; another identical confirmation would add little. No additional enemy HP,
attack, plating, resistance, ability or item balance change is bundled here.

Applied movement fixes:

- Swamp05 Striker/173 was oscillating between two positions every 100ms. The
  old one-second samples hid that motion. Pull-point/skirt selection reversed
  at its arrival boundary; a ranged Hexer could remain inside the pool.
- Jungle05 Squire/3911 selected a Canopy Harrier inside slowing vegetation.
  Navigation avoided status terrain, while combat approach recognized only
  damaging terrain, leaving a truncated path outside attack range.
- Combat approach now uses the navigation hazard classification. An engaged
  target is drawn beyond its range with a retained pull destination; unengaged
  skirt legs finish before another is selected. Target clearance prevents early
  release at the hazard edge. Actual safe attack range releases pulling.
- Movement observations now persist 100ms samples, selected target, motion and
  enemy positions. Other trials retain one-second samples. Minion telemetry stays.

Short local replays reached Snapper and Silverback instead of the original stalls.
Those are debugging evidence, not full-window success or proof against every
hazard geometry. Boundary-clamped pulls, overlapping hazards, lost aggro and
new long stalls must remain visible in this run.

## Fixed matrix

| Block | Configurations | Seeds | Observations |
| --- | ---: | --- | ---: |
| `durability12movement` | T3 Swamp05 Striker and T3 Jungle05 Squire | 173,3911 for both | 4 |
| `durability12swarm` | T2 Plains03/05 and T3 Volcanic03/05, six classes, Sweep/Slam pair | 3911,6151,8089 | 144 |
| Total | 50 | | 148 |

First block includes the two exact historical node/class/seed combinations plus
cross-seed checks. Current adopted HP is retained: it is not a replay of the old
Swamp control HP, nor a causal old/new balance comparison.

Second block is a same-seed **Sweep versus Slam** comparison on current mob
numbers. All six roots use medium frames, normal melee-close/ranged-mid at T3,
baseline weapons, +5 biome armor/charm, Mountain boots and Tempered Core.
Offensive stance, Second Wind/Cleanse and T3 Frenzy are retained. Only the
technique changes within a pair; no gear optimization or winner selection.
Keep fast and slow weapon classes separate. Conduit damage includes minions.
Night4 already screened these techniques. This follow-up uses current adopted
durability, the movement correction and later seeds; Night4 is context, not a
same-runtime control and not evidence that this is the first Slam trial.

Each observation: fresh synthetic World, natural ecology, 100ms ticks, 300s
maximum, stop first player death. Estimate 15–25 wall minutes, up to 12h20m
simulated time. No Docker, database, services, travel or acquisition simulation.
Existing 120s observation wall ceiling, four-hour block ceiling and 2GiB RSS
ceiling remain. Deaths advance the fixed matrix; tooling failure stops it.

## Frozen identity and concurrent work

- Revision: `7b37b3938937dcbb177bbd5b24ebfd762b941f6e`
- Tree: `ef3d93eff805f97da42bdd60732ac5f338017f4e`
- Definitions SHA256: `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

The shared checkout contains concurrent heat/chill cleanup, killing-blow metadata
and status presentation work. It was preserved and **not included** in this
frozen revision. These single-node, first-death observations do not test biome
exit or death cleanup. Use this exact source, not current develop or a dirty
snapshot; do not infer that newer death-label behavior was validated here.

Qualification is retained under
`C:/Users/osaif/AppData/Local/mmo-idle/validation/durability12`.
Do not rerun qualification/pilots. They establish legal builds and tooling only.

## Operator commands

Run from the shared repository. Preserve all existing resources and dirty work.
No retries, alternate seeds, balance edits or adaptive templates.

```powershell
$dur12Revision = '7b37b3938937dcbb177bbd5b24ebfd762b941f6e'
$dur12Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability12-20260916'
$dur12Checkout = "$dur12Root/source"
$dur12Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur12HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur12Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur12Hitboxes).Hash -ne $dur12HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur12Root | Out-Null
git worktree add --detach "$dur12Checkout" $dur12Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur12Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur12Checkout" rev-parse HEAD) -ne $dur12Revision) { throw 'Revision mismatch' }
if ((git -C "$dur12Checkout" rev-parse 'HEAD^{tree}') -ne 'ef3d93eff805f97da42bdd60732ac5f338017f4e') { throw 'Tree mismatch' }
if (git -C "$dur12Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
foreach ($dur12Block in @(
    @{trial='durability12movement'; cells=2; runs=4; seeds='173,3911'},
    @{trial='durability12swarm'; cells=48; runs=144; seeds='3911,6151,8089'}
)) {
    $dur12Trial = $dur12Block.trial
    $dur12Out = "$dur12Root/results-$dur12Trial"
    $dur12Start = (Get-Date).ToUniversalTime().ToString('o')
    pnpm --dir "$dur12Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts "--trial=$dur12Trial" --mode=run "--revision=$dur12Revision" "--hitboxes=$dur12Hitboxes" "--out=$dur12Out"
    $dur12Exit = $LASTEXITCODE
    @{trial=$dur12Trial; start=$dur12Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur12Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur12Root/operator-ledger.jsonl"
    if (Test-Path -LiteralPath "$dur12Out/index.json") {
        node "$dur12Checkout/scripts/ttk-survey-report.mjs" "$dur12Out"
        if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
    }
    if ($dur12Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
    node "$dur12Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur12Out" "--trial=$dur12Trial" "--revision=$dur12Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur12HitboxHash" "--cells=$($dur12Block.cells)" "--runs=$($dur12Block.runs)" "--seeds=$($dur12Block.seeds)" 2>&1 | Tee-Object -FilePath "$dur12Out/verification.log"
    if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
    if ($dur12Trial -eq 'durability12movement') {
        $dur12Rows = Get-Content -LiteralPath "$dur12Out/index.json" -Raw | ConvertFrom-Json
        foreach ($dur12Row in $dur12Rows) {
            $dur12Target = if ($dur12Row.cell -like '*swamp*') { 'plague-hydra' } else { 'silverback' }
            $dur12Contact = @($dur12Row.targets | Where-Object { $_.type -eq $dur12Target -and $null -ne $_.firstDamageMs })
            if ($dur12Contact.Count -eq 0) { throw "Movement gate: no $dur12Target contact in $($dur12Row.cell)/$($dur12Row.seed); report and stop" }
        }
    }
}
```

The contact gate is deliberately minimal; it does not declare navigation solved.
If it fails, report the four observations and skip the swarm block. Preserve
failures and partial artifacts; do not repair/relaunch during the operator run.

## Required interpretation and report

Write `docs/briefs/bot-balance-durability12-report.md` and index it in docs/README.md.
Record revision/tree, manifest/index hashes, verification outputs, completeness,
wall duration and resources. Verify actual READY equipment and techniques and
matching initial geometry/roster for every Sweep/Slam pair.

1. Movement: time to first named elite damage, kills, attacks, deaths, terrain
   contacts and longest no-damage interval. Inspect every >=30s interval with
   attack intent and no outgoing damage. Use selected targets and 100ms positions
   to distinguish oscillation, waiting for a pull, recovery, leash and a blocked
   path. Report any repeated static-hazard entry. New contact alone does not
   erase late stalls or close all movement issues.
2. Swarms: per species/node/class/technique, show each seed's median clean body
   TTK and the outer median. Eligible means clean, killed, finite TTK and no HP
   regain. Keep missing, unfinished, regained and death rows separate, never zero.
   Show total kills, pressure, minimum HP, recovery and attack/minion beats.
3. Compare paired Sweep/Slam deltas within each class, node and seed. Identify
   slow Squire versus fast Striker response without pooling them. Audit casts
   and damage delivery, including charge exposure. Body TTK begins on first
   damage, so include pre-hit casting/engagement delay in interpretation.
4. Separate swarm small bodies from durable anchors: Plains Yearling/Hawk/Wolf
   versus Bull; Volcano Scuttler/Hound/Salamander versus Tortoise. Natural
   encounter episodes may merge pulls; do not label them exact authored-pack TTK.
   Do not apply the toughest-elite target to every swarm member.
5. For deaths and survivors below20% HP, inspect10s/30s source windows. Attribute
   lava, Heat, enemy species, direct hits and DoT separately. Low inactivity
   exposure is not proof a biome is safe. Do not call a tool failure a death.
6. Finish with decisions this evidence supports: hold current swarm numbers,
   propose selective anchor/small-body durability changes, identify an ability
   outlier for later, or isolate remaining movement failure. No automatic patch.

After this: remaining T2/T3 roster gaps (including Forest), then wider item and
class/ability balance. Detonate belongs with that ability/class work. Boss TTK
gets its own pass. T4 follows with broader branch/build coverage; no blind
propagation of T2/T3 HP multipliers. Real x1 economy runs come after combat settles.

Synthetic prepared-combat evidence only; no economy, acquisition, travel, browser,
human-feel or complete-tier certification.

## Preparation receipt

All50 configurations qualified on the frozen checkout:48 swarm and2 movement.
The48 READY records have the intended technique, offensive stance, no overlays,
and matching initial geometry across all24 technique pairs. Four30s tooling
pilots completed (two per block); both report generators and the verifier tests
passed. Movement pilots use seed173; the exact Jungle3911 replay remains in the
operator matrix. Qualification and pilots are not full balance observations.

Workspace and frozen-checkout typechecks (including bench) passed. Frozen
hazardPullApproach, runeDynamicHazardAvoidance and autoMovementSmoothness tests
passed; durability12Spec matrix test passed. Operator PowerShell parsed cleanly.

Two older balance assertions also fail on the clean frozen source: biomeEcology
expects an older Moss-Shell Snapper health relationship, and durability8 compares
fixed-shell fractions exactly (0.05333333333333334 versus0.05333333333333333).
They do not exercise this movement change. Their logs are retained as
`frozen-ecology.log` and `frozen-durability8.log` in the qualification directory;
this packet does not silently change old balance assertions to obtain a green
suite. The preparation-receipt.json there hashes all qualification/pilot artifacts.

Full workspace suite completed **214/218 passed**. In addition to those two,
shared tier1Snapshot rejects an unsupported range branch in its legacy fixture,
and bot harness rejects the historical spirit-volcano-control-t3-v1r template
(unowned/obsolete rune rules;28 RP versus16 budget). Both reproduced on the clean
frozen checkout, with frozen-tier1Snapshot.log and frozen-harness.log retained.
They are outside this packet's direct synthetic runner; all50 current prepared
builds passed their actual legality checks. Do not claim a green full suite.
Full log: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability12-full-tests.log`.
