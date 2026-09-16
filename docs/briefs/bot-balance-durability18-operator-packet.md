# Durability18 — Forest03 Wolf attack versus defensive stance

Prepared 2026-09-16. Manual Luna operator; NOT launched. Run once sequentially.
No retries, adaptive builds, subagents, production edits or extra experiments.

## Decision and adjustments

Durability17's higher adult HP brought Wolf duration closer to intent, but the
pressure80 arm still killed Striker once and left two deep-low survivors. Wolves
were the dominant recorded pressure source. User approved the focused comparison.
Apply changes as benchmark overlays, not global production adoption of a failing
candidate. Keep class balance separate: Conduit's unsettled baseline and long
minion-driven fights are later class/build evidence, not a universal mob-TTK veto.
Actual movement failures remain distinct; this trial does not fix them.

Striker and Apprentice, Forest03 only, historical seeds9029/10427/12007.
Two classes x four arms x three seeds =8 cells/24 observations.
Fixed adult HP: Wolf1575, Badger945. Fixed Badger attack25. Whelps155HP/14attack,
Spitters300HP/31attack, Howl, charge, pack sizes and all other mechanics unchanged.

| Arm | Wolf attack | Stance |
| --- | ---: | --- |
| reference | 27 | offensive |
| wolf22 | 22 | offensive |
| defensive | 27 | defensive |
| wolf22-defensive | 22 | defensive |

Wolf22 is a further18.5% reduction from the prior27 candidate (original live34).
Forest03 scaling and integer rounding apply after these base values. This is
not a new blanket20% reduction to all adults. Defensive stance is an ordinary
player option; it changes both offensive and defensive stats and may extend TTK.
Only stance changes within those pairs: no new gear, runes, ability tuning or
class modifiers. Same medium frames, +5 gear, Sweep, Second Wind/Cleanse and
movement rules. Read READY to verify legal stance and resulting player stats.

Reference repeats Durability17 adults3-pressure80 for these two roots/seeds.
Require matching index outcomes/elapsed/minHP/targets before interpretation.
Repeated seeds intentionally include the failure; do not count reference replay
as independent confirmation. No selection of successful seeds or retrying deaths.

Fresh World, natural ecology,100ms tick,300s maximum, first death ends observation.
Expected3–8 wall minutes, up to2h simulated. Existing120s observation wall/4h block/
2GiB RSS limits. No Docker, DB, acquisition/travel or services. Gameplay failures
advance the fixed matrix; tooling failure stops and preserves partial evidence.

## Frozen identity

- Revision: `e8d4a6bd3cd126c2a646319b30b51f5759b1e1e7`
- Retained branch: `codex/durability18-frozen`
- Tree: `ac995a65a82238f4bf695aa27ea959a1b752d080`
- Definitions SHA256: `75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Runtime is Durability17's frozen source; concurrent combat/DoT/status edits are
excluded for comparability and preserved. Results require reconciliation before
production adoption. No Volcano changes or Slam/Conduit buffs are included.
Local preparation artifacts: C:/Users/osaif/AppData/Local/mmo-idle/validation/durability18.
Overlay isolation/restoration test and frozen benchmark typecheck passed.
Eight setups qualified; both four-arm geometry groups match. Four Striker03/9029 arms passed a30s pilot with zero deaths/long-quiet flags. Pilot is tooling evidence only. Full suite and
live/browser playtest not rerun. Operator must not rerun preparation.

## Operator commands

Run from main repository. Existing output root means inspect/report; no relaunch.
```powershell
$dur18Revision = 'e8d4a6bd3cd126c2a646319b30b51f5759b1e1e7'
$dur18Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability18-20260916'
$dur18Checkout = "$dur18Root/source"
$dur18Out = "$dur18Root/results-forest"
$dur18Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur18HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur18Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur18Hitboxes).Hash -ne $dur18HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur18Root | Out-Null
git worktree add --detach "$dur18Checkout" $dur18Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur18Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur18Checkout" rev-parse HEAD) -ne $dur18Revision) { throw 'Revision mismatch' }
if ((git -C "$dur18Checkout" rev-parse 'HEAD^{tree}') -ne 'ac995a65a82238f4bf695aa27ea959a1b752d080') { throw 'Tree mismatch' }
if (git -C "$dur18Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
$dur18Start = (Get-Date).ToUniversalTime().ToString('o')
pnpm --dir "$dur18Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability18 --mode=run "--revision=$dur18Revision" "--hitboxes=$dur18Hitboxes" "--out=$dur18Out"
$dur18Exit = $LASTEXITCODE
@{trial='durability18'; start=$dur18Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur18Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur18Root/operator-ledger.jsonl"
if (Test-Path -LiteralPath "$dur18Out/index.json") {
    node "$dur18Checkout/scripts/ttk-survey-report.mjs" "$dur18Out"
    if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
}
if ($dur18Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
node "$dur18Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur18Out" --trial=durability18 "--revision=$dur18Revision" --definitions=75d53efd1dab126103eb2788cf1776734d94be5ba5106739dfe7578d06924267 "--hitboxes=$dur18HitboxHash" --cells=8 --runs=24 --seeds=9029,10427,12007 2>&1 | Tee-Object -FilePath "$dur18Out/verification.log"
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
node "$dur18Checkout/scripts/durability15-exposure.mjs" "$dur18Out"
if ($LASTEXITCODE -ne 0) { throw 'Exposure audit failed; preserve and stop' }
```

## Required report and exit

Write docs/briefs/bot-balance-durability18-report.md and index it. Record hashes,
completeness, wall time, all deaths, minHP and6 four-arm geometry/equipment sets.
Equipment is fixed; player stats and stance differ intentionally. Verify READY
monster values, active stance, legal ability/rune budgets and declared dimensions.

Run the manifest-driven durability15-exposure.mjs as shown. Report all outcomes
and sensitivity using whole matched sets without >=30s internal/terminal quiet.
Never discard only the losing arm or equate quiet survival with pressure tolerance.
Keep deaths visible even when their set is excluded. No all-or-nothing movement gate.

Compare wolf22/reference and combined/defensive for attack relief; compare
stance-only/reference and combined/wolf22 for the stance tradeoff. Report per-seed
species clean TTK then outer medians, including killed/unfinished/regained/missing
counts. Do not pool species into a pack-clear duration. Include kills, recovery,
minHP, incoming sources, Howl starts/fires, and10s/30s death or <20% HP windows.
Longer survival can increase total incoming damage; compare duration/exposure too.
Record actual casts/hits where possible; do not infer ability contribution from
attack-beat counts alone. Zero post-first-hit TTK can mean a single-hit kill,
not literally no engagement time.

If defensive stance resolves the tail at attack27, report it as a viable build
answer with its damage/TTK cost, not proof offensive stance must always survive.
If attack22 is needed across both stances, that supports a Wolf-pressure candidate.
If only combined succeeds, keep both requirements explicit. If none succeeds,
inspect Howl/target choice/recovery evidence before more stat escalation; do not
auto-retry. Apprentice is a second pressure-sensitive comparison, not evidence
that all six roots have been retested. MinimumHP20% remains diagnostic, not a
universal rule. No automatic production adoption; report recommendation to planner.

Next decision is a shared Forest candidate or a bounded mechanics/build issue,
then current-source reconciliation and fresh confirmation alongside the parked
Volcano candidate. Do not lower all mob duration solely for Conduit or force every
fast class to the same floor. Broader class/ability balance and T4 remain later.
Synthetic combat only; no economy/acquisition/human-feel/complete-tier claims.
