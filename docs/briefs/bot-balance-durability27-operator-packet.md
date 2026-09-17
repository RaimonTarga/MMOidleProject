# Durability27 — T2 Mountain pressure and Desert controller pacing

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED. Run once sequentially.
No subagents, retries, adaptive builds, source edits, commits, pushes or cap extensions.

## Planner disposition from Durability26

All144 observations completed without wall cutoffs. Mountain candidate timing
32.79s vs15.88s control; Desert23.50s vs13.00s. Retain Mammoth13800 and Basilisk9006
as provisional values for consolidated review, preserving Mammoth absolute ward.
The report's automatic adjust-both conclusion is too strict for an initial pass:
32.79s being above the T3 reference is the intended direction, not an overshoot
by definition. Slow Reverb/Marshal tails are recorded for build/class review;
do not lower all enemy HP merely to fit every specialization into one duration.

However, all three Mountain deaths were Maestro:3/6 candidate vs0/6 control.
This is a specific unresolved pressure signal, not a universally accepted package
or merely3/36 rare variance. Keep its pre-release pressure regression pending.
Neither these values nor previous candidates are adopted into production here.

Durability25 T2 Mountain had14/36 deaths. The subsequent read-only audit found
ordinary-hit pressure across all three species, with only3 of9 Eagle killing
blows following the dive. This supports testing one biome-local attack scalar,
not attributing all deaths to the dive or declaring the movement policy flawless.
Desert T2 controllers had representative body timings around8.5–8.8s, below the
intended tough-role guide. Test controller HP, preserving the cheap damage dealer.

## Sealed matrix

Two independent blocks: mountain and desert, T2 only. Each has six roots, nodes03/05,
control/candidate, seeds68023/70001/72019:24 cells/72 observations. Total48/144.
600 simulated seconds or first death;100ms ticks; natural ecology; synthetic +5.
Same T2 builds as Durability25: medium frames, biome armor/charm, Mountain boots,
Tempered Core, Offensive stance, Sweep, Second Wind/Cleanse, normal targeting and
existing runes. T2 has no T3 range node, T4 specialization or relic. Conduit uses
Jungle Stinger Rapier; Spirit uses Gale Needle as in the fresh tier-ladder baseline.
No other preparation change, services, Docker, progression, travel or economy.

| Block | Species | Control | Candidate |
| --- | --- | --- | --- |
| Mountain | Granite Titan | attack84 | attack67 |
| Mountain | Stone Eagle | attack75 | attack60 |
| Mountain | Boulder Thrower (peak-archer) | attack90 | attack72 |
| Desert | Sand Scorpion | HP780 | HP1365 |
| Desert | Stone Basilisk | HP780 | HP1365 |

Mountain uses rounded80% base attack. HP/defenses, cast multipliers/cadence,
range, movement, aggro and geometry remain unchanged. Attack-derived abilities
become weaker through normal runtime scaling; this is NOT ordinary-attacks-only.
Desert uses1.75x controller HP; attacks/DR/plating and the Sun Scarab remain
unchanged. No shields are added. Definitions restore after each observation.
These are biome-local experiments, not universal tier changes or approved patches.

## Frozen identity / limits

Revision `5925ee93fb3e60ff6dfa60a706ee2b895ea640d6`
Branch `codex/durability27-frozen`
Tree `7f74e57bb61cca99417754d0cfa48cd3673f2dfb`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same frozen gameplay as26; concurrent shared-checkout changes excluded. Current-
source reconciliation remains required before adoption. Readiness receipts:
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability27.
All 48 setups and 24 short pilots passed. Matrix/layer-isolation/restoration test,
benchmark typecheck and syntax/diff checks passed; preparation only. Metadata can name
the parent revision because identical source was qualified around commit time.
No full repository suite or live/browser playtest claimed.

Expected20–40 wall minutes, not a promise. Per observation120s wall/2GiB RSS;
per block30min soft/35min watchdog; queue3h safety. Preserve cutoffs and partials.
Budget partials advance; unexpected identity/runner/audit failure stops. No retries,
cap extensions, forced worktree deletion or global cleanup.

## Execute once

```powershell
$dur27Revision = '5925ee93fb3e60ff6dfa60a706ee2b895ea640d6'
$dur27Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability27-20260917'
$dur27Source = "$dur27Root/source"
if(Test-Path -LiteralPath $dur27Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur27Root | Out-Null
git worktree add --detach "$dur27Source" $dur27Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur27Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur27Source/scripts/durability27-run.mjs" "--out=$dur27Root/results" "--revision=$dur27Revision" --tree=7f74e57bb61cca99417754d0cfa48cd3673f2dfb --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur27Exit = $LASTEXITCODE
@{exit=$dur27Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur27Root/operator-exit.json"
```

## Required report / finite decision

Write docs/briefs/bot-balance-durability27-report.md and index docs/README.md.
Verify paired READY builds/geometry. Mountain roster HP hashes should match while
declared attack products differ; Desert attacks match while controller HP differs.
Do not reuse the previous assumption that all paired initialStats must be identical.
Check node/runtime rounding against actual READY products, not base values alone.

Use clean per-seed body medians then eligible cell medians; at least2 eligible
paired seeds, equal-root summaries with every class/node and fast/slow tail shown.
Keep deaths, unfinished/regained targets, quiet and cutoffs explicit; no kill pooling.
Show actual episode durations/membership/late joins separately from body timing.
An accumulated chain is not simultaneous swarm size. Survival is not pacing proof.

Mountain: paired deaths/minHP, time/kills before death, recovery interruptions,
incoming10s/30s terminal windows and health at encounter entry where recorded.
Track Eagle ordinary/dive and Titan/Boulder damage without relying on killing blow.
Report normalized incoming/cast exposure and whether the change improves the
fragile classes without making all pressure trivial. Compare fresh paired arms,
using the old14/36 result only as context, not a causal control.

Desert: both controller timings, Scarab timing, actual two-enemy encounter duration,
attrition and Conduit slow tail. Does center move toward roughly15s without
approaching/exceeding T3's~22s baseline for the representative roster? Compare
T3 as historical same-runtime context, not a new same-seed counterfactual.
Do not demand every class meet one hard floor or impose Trench's40–60s target.

Finish with adopt/adjust/reject per local package and a concrete evidence-based
recommendation, not automatic inconclusive because one class differs or a death
occurred. No zero-death requirement. No production adoption or extra runs.
Keep retained T4 primary values and Graveyard shape pending consolidated review;
do not reopen universal Focus. Remaining work includes T4 Maestro pressure,
Jungle performance/durability, Trench Stalker pacing, then current-source adoption/
regression and playtest-readiness checks. No full mob-balance certification here.
