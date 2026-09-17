# Durability23 — remaining T4 swarm roles and Graveyard counterplay

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED. Execute once sequentially;
no subagents, adaptive changes, retries, production balance edits or cap extensions.

## Planner decision from Durability22

All 288 observations completed:283 windows,5 deaths,0 wall ceilings; parity passed.
Raw index counts confirm36/36 candidate survivors in Trench/Tundra/Desert and33/36
in Mountain (three node03 losses); Desert's two deaths were controls.

Retain all 14 tested Durability22 HP candidates, including fixed absolute shield/
ward/self-shatter semantics, for the consolidated initial mob patch decision.
This is a planner recommendation, not an already applied production change. Do
not mark a whole species inconclusive merely because one class has a long tail or
three mixed-source deaths exist. Conversely, keep sparse per-cell estimates
inconclusive and do not call every class equally viable. No attack compensation
is supported strongly enough to add now. Preserve Mountain03 pressure and Conduit
long-duration tails as explicit watch items, without another full confirmation grid.

Recomputed candidate representative species medians EXCLUDING cells with fewer
than2 eligible seeds: Trench Leviathan57.75s, Serpent48.7s, Stalker34.95s;
Mountain Mammoth13.4s/Rhino16s; Tundra Behemoth17.1s; Desert Tyrant18.45s.
The operator report's62.1/38/18.7 figures include sparse cell values. These are
outer summaries across different builds, not a guarantee or universal TTK floor.
Retain Trench as sufficiently near the40–60s all-three-species design goal for
an initial playtest pass; do not chase exact medians while delaying other biomes.
No claims of economy/recovery cost or perfect play. Occasional deaths are allowed.

Next decision: finish the remaining T4 mob-role evidence, then prepare one
consolidated production patch with current-source reconciliation and regression.
Do not reopen every completed species or begin general class/item balance.

## Three sealed blocks

Seeds 44017/46021/48017; same Night5A six medium/native-range builds, primary biome
armor/charm, Mountain boots, Tempered Core, Colossus Heart; Sweep/Frenzy,
Second Wind/Cleanse, offensive stance and existing movement/recovery rules.
Same frozen gameplay as22; main-checkout concurrent changes excluded.

| Block | Cells / observations | Window | Question |
| --- | ---: | ---: | --- |
| volcanic | 24 /72 | 300s | Control vs HP-only doubling of two slow anchors |
| graveyard | 28 /84 | 900s | Control vs In Combat Focus Elites; six A branches plus Blunderbuss |
| jungle | 12 /36 | 120s | Unmodified A-branch roster, bounded exposure/runtime screen |

Total 64 cells/192 observations. Each has nodes03/05 and3 fresh seeds, first death
ends the observation. Natural ecology,100ms ticks, synthetic fully prepared +5.
No Docker/services/travel/rewards/economy. Each block has30min soft budget,
35min watchdog,120s per-observation wall ceiling and2GiB RSS guard. Three-hour
queue safety ceiling plus bounded reports. Expected roughly20–50 wall minutes,
not a minimum or promise; Jungle can still be partial. Budget partials advance;
unexpected runner/identity/audit failure or watchdog stops. No cap extensions.

### Volcano local overlay

Only candidate: Obsidian Tortoise2244 ->4488 base HP; Magma Salamander2904 ->5808.
All attack/plating/DR, abilities, Burn/Heat, pack composition and follower HP stay
unchanged. These slow anchors had representative~5–7s body windows; test a modest
increase without making small swarm enemies tanky. Candidate duration isn't
assumed linear. Definitions restore after every observation. No shield scaling
is introduced; these two definitions have no proportional defensive shield.
Do not turn a single Conduit death into a general Burn nerf.

### Graveyard target-priority comparison

All six Night5A roots plus Slinger/Blunderbuss (Night5B) at both nodes. Arm changes
ONLY the additional in-combat -> focus-elites rune, owned/unlock-legal and included
in RP checks. Other abilities/equipment/stance unchanged; no mob stats change.
Blunderbuss remains its authored short-range specialization even though its range
node is medium. Do not mislabel its actual range as a setup error.

Source design: Gravewright is a deliberately killable backline necromancer, elite
priority is taught as counterplay, and its raised mobs crumble when it dies. Do
not increase Gravewright HP solely because it has an elite tag. The observed
Graveyard deaths involved risen Hounds/pack pressure; test the intended answer
before nerfing DoT or changing every mob's HP. Configuration alone does not prove
the focus rule affected target selection; inspect eligible targeting opportunities.

### Jungle boundary

No treatment or mob edits. Short120s windows target initial encounter duration,
actual engagement and simulation cost, not fifteen-minute safety. Retain all
cutoffs and zero-progress cases. Compare simulated time, wall time/maxTick and
outgoing gaps; do not equate faster wall completion with a gameplay fix. Any
remaining runtime issue goes to a bounded source/performance investigation;
never repeatedly extend the whole batch. Jungle cannot be certified from short
survival or incomplete rows.

## Frozen identity / preparation

Revision `b12bb917f5a3d7c195c018b645a30d1c8872b325`
Branch `codex/durability23-frozen`
Tree `dca62ff5baebd6a3edfe6d6e224320f2676ad9b7`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

All 64 setups and 32 short node03 pilots use the shared Windows-safe child argument
builder and exposure audit; all passed. Receipts:
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability23-r1.
Initial preparation rejected an Always / Focus Elites pairing. It was corrected to In Combat / Focus Elites; failed receipts remain in validation/durability23. The corrected full preparation passed in durability23-r1.
Matrix/restoration test, benchmark typecheck, syntax and diff checks passed.
No full-suite or live playtest rerun. Pilots are readiness, not balance evidence.
No production files have been retuned. Do not rerun preparation overnight.

## Execute once

```powershell
$dur23Revision = 'b12bb917f5a3d7c195c018b645a30d1c8872b325'
$dur23Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability23-20260917'
$dur23Source = "$dur23Root/source"
if(Test-Path -LiteralPath $dur23Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur23Root | Out-Null
git worktree add --detach "$dur23Source" $dur23Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur23Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur23Source/scripts/durability23-run.mjs" "--out=$dur23Root/results" "--revision=$dur23Revision" --tree=dca62ff5baebd6a3edfe6d6e224320f2676ad9b7 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur23Exit=$LASTEXITCODE
@{exit=$dur23Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur23Root/operator-exit.json"
```

Retain source/raw data/ledger. No force deletion or global Docker cleanup. Prior
Windows worktree removal had long-path trouble; leave this clean source retained.

## Required report and finite decisions

Write docs/briefs/bot-balance-durability23-report.md and index docs/README.md.
Record outcomes, completeness, identity and measured runtime independently for
all three blocks. READY gear/RP/runes/skills must match. For paired arms verify
initial geometryRosterHash equality; unchanged mobs in Graveyard should also have
matching initial roster stats. Report the two actual Volcano HP changes only.

Primary estimator: eligible per-seed clean species medians, then outer median.
Use night5-audit.json, not generic pooled per-type medians; exclude inconclusive
cells from representative headline medians and report their missingness separately.
Show paired seed deltas only where both arms have eligible observations (at least2
pairs for a conclusion). Preserve killed/unfinished/regain/death/censored/quiet
counts. A long-quiet survivor is not safety. No class-global winner selection.

Volcano: species/pack duration, casts, damage sources, Heat/Burn exposure where
recorded, recovery, pursuit and time/kills before death. Inspect10s/30s windows
for failures. Evaluate whether longer anchors let mechanics matter while keeping
swarm pressure manageable. Recommend adopt/adjust/retain, not automatic patching.

Graveyard: per specialization paired deaths/minHP/kill throughput; Gravewright
first-damage and kill timing, targeting opportunities with ordinary+elite options,
which target is selected, raise casts/risen mobs, Hound DoT exposure and recovery.
Use sampled selection as a proxy and event identities where available. No eligible
opportunity means untested, not failed rune. Distinguish an ineffective rule from
successful elite priority that still takes too long or costs too much health.
Does the ordinary player tool address the specific Blunderbuss problem? A result
can support a bot-template choice without authorizing mob or class balance changes.

Jungle: all species reached/killed, durations, missingness, wall-to-sim cost and
remaining bad tick/quiet cases. Return a precise diagnostic location if blocked,
not a vague recommendation to repeat every class. No HP change in this block.

Finish with updated finite seven-biome T4 work map, carrying forward22 candidates
as planner-selected pending adoption rather than re-testing them. Identify the
smallest remaining obstacle to a consolidated T1–T4 mob patch. Later focused
regression, representative bosses/progression, basic x1 pacing and operational
checks precede invited players; full item/class/ability parity remains later.
No production adoption, extra run, cap extension or playtest-readiness claim.
