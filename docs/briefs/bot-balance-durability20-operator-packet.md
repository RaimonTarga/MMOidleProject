# Durability20 — T2/T3 roster coverage and remaining mob decisions

Prepared 2026-09-16. Manual Luna operator; NOT launched. Run once sequentially.
No subagents, retries, adaptive builds, production patches or extra matrices.

## Planner decision from Durability19

Both candidates had zero deaths across36 observations each. Forest candidate had
one sub20% Apprentice survivor (9.9%, Spitter-dominated pressure); Volcano candidate
had none. Forest Striker's prior deep-low tail was removed. Volcano05 Conduit remains
inconclusive because only one pair met exposure criteria. This is enough to recommend
retaining both packages for adoption consideration, with explicit exceptions, rather
than demanding every class/node metric improve or replaying candidate selection.

Forest Slinger minHP remaining above52% and Conduit falling from91.5% to59.7% are
not equivalent to lethal regressions. Longer intended fights can consume more HP.
Conduit's uncertain class/minion baseline belongs to the later class pass; actual
engagement failures stay separate. Forest Apprentice's isolated9.9% episode remains
on the watch list; do not hide it or infer another Wolf nerf from Spitter pressure.

Planner corrected report19's Forest03 Apprentice delta to -9.8pp, the mixed-up
opening species names, low-HP geography and restored-checkpoint label. These were
fresh prepared Worlds. Synthetic evidence supports mob decisions within this setup;
live/browser work is useful later but is not an invented prerequisite for every
numeric recommendation. No production file change is part of this preparation.

## Coverage matrix

A single selected configuration per class/node, not another treatment comparison.
Six roots x28 nodes x3 fresh seeds =168 cells/504 observations.
Seeds20011/22003/24001. Nodes03 and05 in each listed biome:

- T2: Cave, Desert, Forest, Jungle, Mountain, Plains, Swamp.
- T3: Cave, Desert, Jungle, Mountain, Swamp, Tundra, Volcano.

Use current committed mob values in the frozen snapshot everywhere except these
process-local selected packages:

| Species | Base HP | Base attack |
| --- | ---: | ---: |
| T2 Dire Wolf | 1575 | 22 |
| T2 Ironclaw Badger | 945 | 25 |
| T3 Magma Tortoise | 3000 | 116 |
| T3 Ash Salamander | 1330 | 84 |

Tortoise Guard stays14% (base420). No follower HP, plating, Heat, Howl, class or
ability edits. All definitions restore between runs. Other biome values are the
existing baseline, not newly scaled from Forest/Volcano results.

Baseline templates inherit Night4's six medium-frame/native-range roots, +5 gear,
biome-matching armor/charm, mountain boots, Tempered Core and fixed class weapons.
Sweep and Second Wind/Cleanse, T3 Frenzy. Preserve previously selected defensive
stance for T2 Jungle Squire and T3 Jungle Conduit; other cells use offensive.
Do not silently invent class/weapon/rune changes during the survey. In particular,
this is a reference coverage grid, not proof that each class has its optimal build:
Tundra kiting/control equipment options and Conduit builds require interpretation
before mob nerfs. Keep previous successful routes as context when a template fails.

Fresh World, natural ecology,100ms ticks,300s maximum or first player death.
Expected35–60 wall minutes, up to42h simulated; existing120s observation wall,
4h block/2GiB RSS ceilings. No Docker, services, economy or travel. Gameplay deaths
and stalls advance through the matrix; tooling failure stops and preserves partials.

## Frozen identity and preparation

- Revision: `14fce3ed314a722488116dd3bd8074bb43200a31`
- Retained branch: `codex/durability20-frozen`
- Tree: `485e42a5ecf5d3dd290d29967d0f282424587b98`
- Definitions SHA256: `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`

Same current-combat snapshot as Durability19, including its attribution and ambient
cleanup changes. Later edits in the main checkout are not included automatically.
168 setups qualified. Four30s Striker pilots (T2 Cave/Forest03, T3 Tundra/Volcano03)
passed with zero deaths/long-quiet flags. Overlay isolation/restoration test and
benchmark typecheck passed. These checks are tooling evidence only, not coverage
results. Full suite/browser not rerun. Artifacts under:
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability20/{qualify,pilot}.
Do not rerun preparation. durability20-exposure.mjs audits one arm per class/node/
seed; its legacy matchedSets field counts individual observations, NOT comparisons.

## Operator commands

Run from main repository. Existing output root means inspect/report, no relaunch.
```powershell
$dur20Revision = '14fce3ed314a722488116dd3bd8074bb43200a31'
$dur20Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability20-20260916'
$dur20Checkout = "$dur20Root/source"
$dur20Out = "$dur20Root/results-roster"
$dur20Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
$dur20HitboxHash = '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83'
if (Test-Path -LiteralPath $dur20Root) { throw 'Output exists; inspect/report, no relaunch' }
if ((Get-FileHash -LiteralPath $dur20Hitboxes).Hash -ne $dur20HitboxHash) { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur20Root | Out-Null
git worktree add --detach "$dur20Checkout" $dur20Revision
if ($LASTEXITCODE -ne 0) { throw 'Checkout failed' }
pnpm --dir "$dur20Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependencies failed' }
if ((git -C "$dur20Checkout" rev-parse HEAD) -ne $dur20Revision) { throw 'Revision mismatch' }
if ((git -C "$dur20Checkout" rev-parse 'HEAD^{tree}') -ne '485e42a5ecf5d3dd290d29967d0f282424587b98') { throw 'Tree mismatch' }
if (git -C "$dur20Checkout" status --porcelain --untracked-files=no) { throw 'Dirty source' }
$dur20Start = (Get-Date).ToUniversalTime().ToString('o')
pnpm --dir "$dur20Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability20 --mode=run "--revision=$dur20Revision" "--hitboxes=$dur20Hitboxes" "--out=$dur20Out"
$dur20Exit = $LASTEXITCODE
@{trial='durability20'; start=$dur20Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$dur20Exit} | ConvertTo-Json -Compress | Add-Content -LiteralPath "$dur20Root/operator-ledger.jsonl"
if (Test-Path -LiteralPath "$dur20Out/index.json") {
    node "$dur20Checkout/scripts/ttk-survey-report.mjs" "$dur20Out"
    if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; preserve partial' }
}
if ($dur20Exit -ne 0) { throw 'Simulation failed; retain partial and stop' }
node "$dur20Checkout/scripts/ttk-survey-verify.mjs" "--out=$dur20Out" --trial=durability20 "--revision=$dur20Revision" --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 "--hitboxes=$dur20HitboxHash" --cells=168 --runs=504 --seeds=20011,22003,24001 2>&1 | Tee-Object -FilePath "$dur20Out/verification.log"
if ($LASTEXITCODE -ne 0) { throw 'Verification failed; preserve and stop' }
node "$dur20Checkout/scripts/durability20-exposure.mjs" "$dur20Out"
if ($LASTEXITCODE -ne 0) { throw 'Exposure audit failed; preserve and stop' }
```

## Required report: produce a finite remaining-work map

Write docs/briefs/bot-balance-durability20-report.md and index it. Record frozen
identity, hashes, completeness, wall time and READY legality/species stats. Use
actual READY values; do not copy scaled numbers from previous reports.

For every tier/biome/node/class list deaths, minimumHP, kills, species clean TTK,
clean/unfinished/regained/missing counts, incoming sources, recovery and exposure
flags. Compute per-seed eligible species medians then outer medians. Mixed-body
TTK is not an elite median or pack-clear time. Conduit needs minion beats/damage;
zero player beats alone are not inactivity. Single-hit kills may have0s body TTK.

Retain all raw observations. Separately flag >=30s internal/terminal outgoing gaps;
quiet survival is not safety. With fewer than two eligible seeds in a cell mark
conclusions inconclusive. There are NO paired treatment effects to estimate here.
Historical comparisons are descriptive: seeds/runtime/stance may differ.

For deaths and <20% minima inspect10s/30s pressure sources, recovery/approach,
Howl/Guard and environmental state as relevant. Keep DoT/debt/event attribution
separate. For long TTK check species/defenses and actual class delivery before
calling it excessive durability. Do not nerf an encounter solely because Conduit
is slow. Retain Forest03 Apprentice low-HP and Volcano05 Conduit exposure as named
watch-list items even if these fresh seeds happen to pass.

Deliver a14-row tier/biome summary with four possible dispositions:
1. Acceptable for this mob pass within tested prepared templates.
2. Mob-stat/mechanic candidate requiring one concrete adjustment.
3. Class/build-sensitive result to retain for that later pass.
4. Tooling/exposure-limited result that cannot support balance conclusions.
A row may have an acceptable majority plus a named exception; do not let one
inconclusive class erase usable evidence or declare the whole biome certified.

Prioritize at most three remaining MOB interventions with species, proposed scope,
and evidence; list class/tooling exceptions separately. Duration planning regions:
T2 toughest elites around15–20s, T3 around20–30s (20–25s floor under discussion),
with fragile swarm followers substantially shorter. These are role goals, not
mandatory per-class thresholds or instructions to endlessly raise HP. Preserve
build differentiation and recognize pack leaders aren't identical to solo elites.

No automatic production adoption or additional runs. Return concrete adoption/
remaining-coverage recommendations; avoid another blanket request to repeat the
whole survey. Existing Forest/Volcano recommendations should not be reopened just
because minimum HP is lower for a still-safe class. T1, bosses, T4, class/ability
balance, acquisition and economy remain outside this packet. No human-feel or
complete-tier certification follows from synthetic combat alone.
