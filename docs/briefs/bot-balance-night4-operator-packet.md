# Night 4 — broad encounter coverage, Desert/Bear follow-up, and AoE screen

Prepared 2026-09-16. Manual Luna operator packet. Execute the three blocks once,
sequentially, without adapting builds, choosing winners or changing live balance.
The full batch has NOT been launched by the planner.

## Why this batch

Durability8 completed144 observations. Fixing Bear shield capacity brought
Conduit's approximately142s scaled-shell fights down to16s. Desert HP3x killed
Striker in all three seeds; HP2x survived but reached only0.8–3% minimum HP.
These results justify a local pressure test, not an unconditional durability buff.

Broaden coverage now rather than repeat a long tuning ladder for each monster.
Use encounter roles to propose roster-wide rules, then reserve local tests for
outliers. No new live balance changes are authorized by this packet.

## Fixed matrix

| Order | Trial | Cells | Observations | Purpose |
| --- | --- | ---: | ---: | --- |
| A | night4survey | 168 | 504 | Current balance across28 T2/T3 nodes and six classes |
| B | night4followup | 48 | 144 | Desert controller durability/dealer pressure and fixed-capacity Bear shield |
| C | night4aoe | 96 | 288 | Current Sweep versus Slam in four tier/biome combinations |

Total312 cells /936 observations. Seeds173/947/2027, fresh300s Worlds,
100ms ticks, stop first player death. Sequential simulation; natural ecology.
Maximum78 simulated hours. Rough planning estimate2–4 wall hours, not a promise;
finish when done rather than filling the night. Existing120s per-observation,
four-hour per-block and2GiB RSS limits remain. Three blocks could reach12h at
their caps; a limit/failure ends this packet, never starts the next block.
No Docker, database or service restart. Synthetic prepared combat evidence only:
not acquisition, travel, economy, client presentation or human-feel validation.

### A: current roster survey

Nodes03 and05 of every T2/T3 biome: T2 Forest, Plains, Mountain, Cave, Swamp,
Jungle, Desert; T3 Tundra, Mountain, Cave, Jungle, Desert, Volcanic, Swamp.
Six established baseline classes, medium frame, close melee/mid ranged branches,
+5 gear, biome-matching armor/charm, Mountain boots, Tempered Core and existing
offensive stance/runes/abilities. Sweep held fixed; T3 retains Frenzy.
Weapons remain the established class baselines. No relics, Desert Falchion,
adaptive preparation, overlays or alternative weapons in A.
Two nodes per biome provide broader coverage, not proof of every roster member.
Inventory actual species and report missing intended roles explicitly.

### B: local treatments

T3 Desert03 and Tundra03; six baselines plus Slinger DoT/Conduit on-hit alternatives.
Same established biome builds as Durability8. Three arms per build, three seeds.

Desert changes only Dune Stalker/Basilisk HP and, where specified, Sandweaver
(Gilded Scarab dealer) base attack:

| Arm | Controller HP | Dealer attack |
| --- | --- | --- |
| hp2 | 2x | 100% |
| hp2-dealer80 | 2x | 80%, rounded |
| hp3-dealer80 | 3x | 80%, rounded |

Dealer HP and controller attacks/defenses/mechanics stay fixed. Attack reduction
also affects attack-derived specials. Compare the first two arms for pressure,
then the latter two for durability at the same pressure. Do not repeat3x with
full dealer output: the three Striker deaths already answered that question.

Bear arms: HP1.5x /2x /2.5x, each with the original shield capacity preserved by
shieldPct = originalPct * originalHP / newHP. Node HP modifiers still apply;
verify actual spawned capacity, allowing rounding. Shield interval11s/duration6s,
shatter self-damage12% and vulnerability30%/4s stay unchanged. Shatter damage
still increases with max HP; this is not a pure HP comparison after a break.
Other Tundra enemies, chill, attacks and defenses remain unchanged.

Treatments are in-process overlays restored between Worlds, including nested
shield fraction and attack. No persistent definition changes.

### C: paired AoE comparison

T2 Plains/Jungle and T3 Jungle/Volcanic, nodes03/05. Six baseline classes,
Sweep versus Slam. Change only the equipped technique; do not equip both.
Identical seeds, weapons, gear and other abilities in each pair. No enemy overlay.
This compares current Sweep (including Tempo) with current Slam, not old/new Sweep.
Assess slow and fast attackers separately. This is an initial ability screen,
not authorization to rebalance either ability or certify either as overpowered.

## Frozen identity and qualification

- Runtime revision: `115297985869598fe49b215a2c40e19b331b998f`
- Tree: `79d3f09d3988c9d736485fb62f43290055764a2c`
- Definitions SHA256: `ffa732ef753525d381623e4f8cefd131947357ffc1364445e63940cc5aaa59c0`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Qualification/pilot root: `C:/Users/osaif/AppData/Local/mmo-idle/validation/night4`

Workspace/bench typecheck and night4 matrix/isolation/restoration test passed.
Full test suite and human playtest not run. Qualification and30s pilots check
tooling/legality, not balance. READY: all312 configurations qualified in clean
frozen source; six30s pilots and all three generated pilot reports passed.
Qualification subdirectories are `qualification-<trial>`; pilot directories are
`pilot-<trial>`. Qualification index SHA256 receipts:

| Trial | Qualified | Index SHA256 |
| --- | ---: | --- |
| night4survey | 168 | `6B53A2339474051852DC51AF79E9137C1B95091DF51639D17375E7BA88AFAFED` |
| night4followup | 48 | `1AB6406627D3F2A063A7EA48AA7266009D12B8CE80DCC8166EFD2624234A53CE` |
| night4aoe | 96 | `61F7B3200451F77C40989F6FE0BB7A450DB202F7D95491EC887BB093A5DE2619` |

## Operator commands

Run from the shared repository. Preserve unrelated dirty files and existing runs.
No repeat qualification/pilots, no retries and no discretionary follow-up runs.

```powershell
$night4Revision = '115297985869598fe49b215a2c40e19b331b998f'
$night4Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/night4-20260916'
$night4Checkout = "$night4Root/source"
$night4Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $night4Root) { throw 'Output exists: inspect/report, no overwrite or relaunch' }
if ((Get-FileHash -LiteralPath $night4Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $night4Root | Out-Null
git worktree add --detach "$night4Checkout" $night4Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree failed' }
pnpm --dir "$night4Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
if ((git -C "$night4Checkout" rev-parse HEAD) -ne $night4Revision) { throw 'Revision mismatch' }
if ((git -C "$night4Checkout" rev-parse 'HEAD^{tree}') -ne '79d3f09d3988c9d736485fb62f43290055764a2c') { throw 'Tree mismatch' }
if (git -C "$night4Checkout" status --porcelain --untracked-files=no) { throw 'Dirty tracked source' }
$night4Jobs = @(
    @{ trial='night4survey'; cells=168; runs=504 },
    @{ trial='night4followup'; cells=48; runs=144 },
    @{ trial='night4aoe'; cells=96; runs=288 }
)
foreach ($night4Job in $night4Jobs) {
    $night4Out = "$night4Root/results-$($night4Job.trial)"
    $night4Start = (Get-Date).ToUniversalTime().ToString('o')
    pnpm --dir "$night4Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts "--trial=$($night4Job.trial)" --mode=run "--revision=$night4Revision" "--hitboxes=$night4Hitboxes" "--out=$night4Out"
    $night4Exit = $LASTEXITCODE
    @{ trial=$night4Job.trial; start=$night4Start; end=(Get-Date).ToUniversalTime().ToString('o'); exit=$night4Exit } | ConvertTo-Json -Compress | Add-Content -LiteralPath "$night4Root/operator-ledger.jsonl"
    if (Test-Path -LiteralPath "$night4Out/index.json") {
        node "$night4Checkout/scripts/ttk-survey-report.mjs" "$night4Out"
        if ($LASTEXITCODE -ne 0) { throw 'Reporter failed; stop and report partial batch' }
    }
    if ($night4Exit -ne 0 -or (Test-Path -LiteralPath "$night4Out/failed.json")) { throw 'Simulation failed; stop and report partial batch' }
    $night4Done = Get-Content -Raw -LiteralPath "$night4Out/complete.json" | ConvertFrom-Json
    $night4Manifest = Get-Content -Raw -LiteralPath "$night4Out/manifest.json" | ConvertFrom-Json
    if ($night4Done.cells -ne $night4Job.cells -or $night4Done.runs -ne $night4Job.runs -or $night4Done.mode -ne 'run') { throw 'Incomplete block' }
    if ($night4Manifest.trial -ne $night4Job.trial -or $night4Manifest.revision -ne $night4Revision -or $night4Manifest.definitionsHash -ne 'ffa732ef753525d381623e4f8cefd131947357ffc1364445e63940cc5aaa59c0' -or $night4Manifest.hitboxesSha256 -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83' -or ($night4Manifest.seeds -join ',') -ne '173,947,2027') { throw 'Identity mismatch' }
}
```

Deaths are valid observations and advance the matrix. Unexpected tooling errors,
interruption or resource limits stop the entire packet; report completed blocks
and partials, preserve artifacts, wait for planner. Do not clean unrelated resources.

## Required report

Write `docs/briefs/bot-balance-night4-report.md`, index it in docs/README.md.
Record revision, manifest/index hashes, counts, exit codes, timings/resources,
deaths and tooling censors separately for each block. Link external artifacts;
keep the summary readable, with detailed tables in companion artifacts if needed.

1. Verify paired builds/geometry and treatment isolation using ready records.
   In B only named HP, Bear shell and declared dealer attack may differ. In C
   only technique differs. A has no overlays. Check actual species coverage.
2. Per species/node/build/arm compute each seed's clean TTK median and the outer
   median of those seed medians from raw index.targets, not pooled per-type
   reporter medians. Include kills, clean samples, unfinished/regained targets,
   missing medians and sample counts. Never encode missing kills as zero.
3. Toughest-enemy reference15–25s T2 /25–35s T3 refers to the median of SIX
   baseline class medians. Show fast/slow tails; alternatives separately.
   Do not impose elite bands on dealers, support units or swarm bodies.
4. A: summarize each biome/tier and separate body TTK from natural encounter
   duration, overlap pressure and recovery. Inventory observed species/roles,
   largest hits/1s pressure, minimum HP and deaths. Propose role-based candidate
   adjustments across the roster; flag exceptions needing a narrow follow-up.
   Natural episodes/repopulation are not guaranteed authored pack boundaries.
5. B: report both Desert controllers separately, dealer exposure/kill ordering,
   and final10s/30s damage sources for deaths and survivors below20% HP. Determine
   whether dealer relief makes longer control duration tolerable. For Bear,
   inspect shield absorption/break/shatter/vulnerability chronology where logs
   support it, damage gaps and Conduit tails. No cast count is not proof of no
   automatic shield. Mark telemetry gaps. Use A's matching node control as
   current context; B's direct comparisons isolate the declared treatments.
6. C: paired per-class results for small-body TTK, kills, encounter clearance,
   survival and recovery. Inspect actual Sweep/Slam activations, hits/targets and
   interrupted charges where exposed in raw events; mark unavailable measures.
   Distinguish a technique not firing from a weak technique. Check whether Slam
   helps slow attackers and whether fast attackers benefit from Sweep Tempo.
   More kills alone do not establish overpowered balance or a safe encounter.
7. Investigate zero-contact/inactivity separately from durability, especially
   Volcano lava/recovery loops. Do not call missing combat a very long TTK.
8. End with a short decision queue: transferable roster changes, local biome
   exceptions, ability follow-up, unresolved movement/instrumentation issues.
   No live patch, class nerf, selected winner or new experiment by the operator.
