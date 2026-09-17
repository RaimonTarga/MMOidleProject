# Durability29 — Mountain pressure relief with retained durability

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED. Execute once sequentially.
No subagents, retries, adaptive changes, production patches, commits or pushes.

## Decision from Durability28

Raw outcomes verified: T2 Mountain3/12 deaths in each stance; T2 Desert6/12
Offensive deaths vs0/12 Defensive; T4 Mountain2 Offensive and3 Defensive deaths,
one wall cutoff per arm. All T4 deaths were Maestro. Desert Defensive is a valid
sampled solution, with substantial output cost and23.5->34.3s two-member episode
duration. Retain Desert's controller HP and a situational defensive Striker template
for adoption review; stop repeating Desert. No broad stance winner is inferred.

Mountain remains mixed ordinary/ability and overlap pressure. Prior T2 reduction
helped most roots but not enough for Striker; the five of six Dur27 candidate
killing blows from Titan motivate a Titan-only follow-up, not proof of sole cause.
T4 terminal windows involve Mammoth/Roc/Tyrant and prior Rhino pressure; a local
roster attack candidate tests aggregate damage budget while preserving roles.
This is an authorized new experiment proposal, not a conclusion that further
damage cuts are already proven or a change to production.

## Sealed matrix

Blocks mountain2 and mountain4; each six roots, nodes03/05, control/candidate,
seeds80021/82003/84011:24 cells/72 observations per block; total48/144.
600 simulated seconds or first death,100ms ticks; natural ecology, synthetic +5.
Same six builds as Durability25, Offensive stance in BOTH arms, ordinary targeting.
T4: Maestro, Reverb, Pyromancer, Bounty Hunter, Marshal, Equinox. Medium/native range
nodes and tier-appropriate gear; no new skill/rune/weapon/ability/recovery changes.
This returns to paired Offensive controls to isolate mob attack, not a stance+mob
combination. No economy, travel, Docker, services or manual input.

Both arms use the previously selected HP and pressure packages:
- T2 control: Titan67/Eagle60/Boulder72 attack, unchanged original HP (Dur27 candidate).
- T4 control: Dur22 HP package plus Mammoth13800 HP/fixed absolute ward (Dur26 candidate).

Additional candidate attack changes, base values before node modifiers:

| Tier | Species | Control attack | Candidate attack |
| --- | --- | ---: | ---: |
| T2 | Granite Titan | 67 | 54 |
| T4 | Granite Mammoth | 184 | 147 |
| T4 | Cragback Rhino | 113 | 90 |
| T4 | Cliffside Roc | 179 | 143 |
| T4 | Avalanche Tyrant | 145 | 116 |

Rounded80% of selected attack. T2 Eagle/Boulder unchanged at60/72. All HP, defenses,
absolute ward budgets, cast/cadence multipliers, speed, aggro and ecology stay fixed.
Attack-derived abilities scale normally, so this is not ordinary-attacks-only.
Only these species are treated; no propagation to other tiers or bosses. Full
database restoration, including attack, is tested after every overlay pair.

## Frozen identity / readiness

Revision `699122f65a583f5b828e1b32753d5065e1ac607a`
Branch `codex/durability29-frozen`
Tree `c7f43c8bdaf93415c92ebd87b2e7ad397324d33e`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same frozen runtime as28; shared-checkout concurrent changes excluded. Reconcile
current source before production adoption. Receipts:
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability29.
All 48 setups and 24 short pilots passed. Matrix/attack-only/full-restoration test,
benchmark typecheck and syntax/diff checks passed; readiness, not full-suite/live proof.
Metadata may name parent revision because identical source was qualified around freezing.

Expected20–40 wall minutes, uncertain. Per observation120s wall/2GiB RSS;
per block30min soft/35min watchdog; queue3h safety. Preserve all cutoffs/partials.
Budget partials advance; unexpected identity/runner/audit failure stops. No retries,
cap extensions, forced worktree deletion or global cleanup.

## Execute once

```powershell
$dur29Revision = '699122f65a583f5b828e1b32753d5065e1ac607a'
$dur29Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability29-20260917'
$dur29Source = "$dur29Root/source"
if(Test-Path -LiteralPath $dur29Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur29Root | Out-Null
git worktree add --detach "$dur29Source" $dur29Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur29Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur29Source/scripts/durability29-run.mjs" "--out=$dur29Root/results" "--revision=$dur29Revision" --tree=c7f43c8bdaf93415c92ebd87b2e7ad397324d33e --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur29Exit = $LASTEXITCODE
@{exit=$dur29Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur29Root/operator-exit.json"
```

## Required report and decision

Write docs/briefs/bot-balance-durability29-report.md and index docs/README.md.
Verify paired READY geometry, roster HP and player builds identical; only declared
monster attack differs. Verify runtime rounding and unchanged ward capacity.
Compare fresh same-seed control/candidate per class/node, not historical totals.

Primary outcomes: death/time/kills before death, minHP/barrier, recovery/pursuers,
incoming10s/30s windows and per-simulated-time damage/cast exposure. Show Striker
separately and all other roots to detect over-relief. Killing blow is not total
cause; ordinary/cast attribution only where the schema supports it. One-second
samples cannot prove uninterrupted safety or exact hit-time overlap.

Timing: eligible per-seed clean body medians then cell medians; at least2 eligible
paired seeds. Keep unfinished/regained, dead, quiet and cutoff rows visible. Real
episode clear duration/member/late-join measures stay separate. No pooled-kill
average DPS; no six-root center that silently drops the failed root. TTK should
not be expected to rise from this attack-only treatment; check retained pacing
and changed pull paths as context. A long chain is not a simultaneous swarm.

Recommend adopt/adjust/reject per tier, balancing reduced systematic deaths against
remaining pressure. Do not require zero deaths or automatically request another
intermediate scalar because one class differs. If unsuccessful, identify a precise
mechanic/build question rather than broadening HP and attack together. No production
adoption or further run is authorized to the operator.

Desert/Graveyard and other retained packages remain pending adoption review. Jungle
performance/durability and Trench Stalker pacing remain open; after Mountain's
decision, prioritize those gaps rather than indefinite stance/HP grids. Reconcile
and regress on current source before invited-playtest claims. No live/economy proof.
