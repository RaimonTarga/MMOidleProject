# Durability22 — provisional T4 role durability and Trench mini-boss pacing

Prepared2026-09-17. Manual Luna operator, NOT LAUNCHED. Run once sequentially.
No source edits, retries, adaptive builds, production patches or cap extensions.

## Decision from Durability21

108/108 observations:107 full windows, one Volcano Conduit death, no timeouts,
all three verifiers passed,5m19s. Coverage of missing T4 biomes is now available.
One accumulated-DoT/late-pull death does not justify a Volcano-wide nerf. Keep
Graveyard/Slinger, Desert/Equinox and T2 Mountain Striker pressure as named build/
mechanic questions, not reasons to stall all durability work or require zero deaths.

Primary species evidence: T4 Tundra medians Yeti1.97s, Behemoth5.15s, Bear2.90s,
Mastodon2.67s. T4 Mountain Mammoth/Rhino about2s in Night5. Survival alone doesn't
meet the intended encounter duration. Desert controllers similarly die quickly;
keep their dealer fragile while lengthening controllers. No additional plating.

USER DESIGN UPDATE: ALL THREE Trench species should feel like40–60s mini-bosses,
not just Elder Leviathan. Existing cross-cell medians are Leviathan19.75s,
Serpent11s, Stalker6.9s. Node03 Conduit Leviathan112.4s, Squire42.2s and
Apprentice6.6s demonstrate major class spread. Target representative prepared
encounters, not a mandatory floor or ceiling for every class. Preserve the full
spread; don't tune the entire biome to the slowest or fastest specialization.

This packet is a provisional local overlay trial, not adoption of a balance patch.
It is authorized experiment preparation under the user's iteration request. Exact
production values remain for planner/user review after results.

## Matrix and controls

Four independent biome blocks, in order: Trench, Mountain, Tundra, Desert.
Each: nodes03/05 x six Night5A medium/native-range roots x control/candidate x
three new seeds38011/40009/42013. 24 cells /72 observations per biome,96 cells /
288 observations total. Same class, node and seed form a comparison block, but
changed survival changes combat trajectories; not identical realized encounters.

Trench windows600s; others300s, all terminate on first death. Longer Trench window
allows observed slow builds to finish targets instead of censoring every long tail.
100ms ticks, full prepared +5 natural ecology, no travel/economy/Docker/services.
No Jungle performance rerun, no Volcano/Graveyard HP increase in this trial.

Same primary gear and abilities as Night5A/Durability21: Maestro/Reverb/Pyromancer/
Bounty hunter/Marshal/Equinox; medium frames, close melee/mid ranged. Striker and
Spirit Eruption Lash, Squire Warmaul, Apprentice Plague Axe, Slinger/Conduit
Deathfang Rapier. Biome primary armor/charm, Mountain boots, Tempered Core,
Colossus Heart; offensive stance; Sweep/Frenzy, Second Wind/Cleanse, ranged orbit,
approach/Step Back/hazard avoidance/recovery. Standardized reference, not optimal
specialization proof. Keep candidate/control loadouts identical.

## Experimental HP values (base definitions; report scaled READY values)

| Biome / species | Control HP | Candidate HP | Rationale |
| --- | ---: | ---: | --- |
| Trench Elder Leviathan | 5880 | 17640 | x3 toward mini-boss duration |
| Trench Abyssal Serpent | 4200 | 16800 | x4 toward same encounter-duration goal |
| Trench Hadal Stalker | 2800 | 16800 | x6; currently shortest fight, retains armor/ranged identity |
| Mountain Granite Mammoth | 1150 | 6900 | durable ground bruiser, multiple cadence opportunities |
| Mountain Cragback Rhino | 1100 | 6600 | low-density armored elite |
| Mountain Avalanche Tyrant | 800 | 1600 | shorter mobile threat, not apex-sized HP |
| Mountain Cliffside Roc | 850 | 1700 | shorter mobile threat, not apex-sized HP |
| Tundra Permafrost Behemoth | 1914 | 7656 | main armored apex |
| Tundra Glacial Dire-Bear | 1221 | 4884 | defensive-window elite |
| Tundra Rime-Tusk Mastodon | 1100 | 3300 | deliberate heavy hitter |
| Tundra Hoarfrost Yeti | 900 | 1800 | shorter control caster |
| Desert Sand Viper | 1343 | 4029 | controller rather than dealer durability |
| Desert Dune Basilisk | 1501 | 4503 | controller rather than dealer durability |
| Desert Dune Tyrant | 1738 | 6952 | apex controller |

Sunshield Scarab stays569HP. All attacks, attack/cast cadence, plating, DR,
pack composition, movement, aggro, damage multipliers and ambient rules unchanged.
Candidate HP applies only within each observation and restores fully afterward.

To isolate body HP from proportional defenses, preserve absolute Mountain Mammoth
ward, Bear Ice Armor, Bear self-shatter damage, and Leviathan Carapace amounts by
scaling their HP percentages inversely with HP. Vulnerability duration/magnitude,
shield schedules and low-HP trigger thresholds remain unchanged. This changes
percentage parameters deliberately; it is not a claim that every non-HP field is
identical. Preserve these exact overlay semantics in any recommendation. Do not
silently multiply shields along with bodies when translating to a later patch.

Multipliers are hypotheses, not linear TTK promises. Longer fights can expose
mechanics, interrupt recovery or attract additional mobs. This experiment measures
those consequences. No automatic damage compensation is hidden in the candidate.

## Frozen identity and preparation

Revision `ffd6f1ec1ec70de238d631e0c3116e786694390b`
Branch `codex/durability22-frozen`
Tree `d3a2ce8e345c36acec52de76da0ea1c94574fb00`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same frozen gameplay baseline as21; no concurrent main-checkout edits included.
96 setups qualify;48 node03 short pilots exercise both arms and all six roots
through the Windows-safe child argument builder. Receipts:
C:/Users/osaif/AppData/Local/mmo-idle/validation/durability22.
Overlay test verifies HP, absolute shields/self-shatter and full database
restoration. Benchmark typecheck and diff/syntax checks passed. Full suite and
live playtests not rerun. Preparation is not survival/balance evidence.

Planning estimate10–30 minutes of simulation based on21, with allowance for longer
Trench fights and variable engine cost; not a minimum. Per observation120s wall,
2GiB RSS guard. Each biome gets30-minute soft budget and35-minute watchdog;
whole simulation queue3h safety ceiling plus bounded reports. Budget partials
advance to the next independent biome. Unexpected failures/watchdog stop queue.
No timeouts are counted as deaths or full survival. No retry or extending limits.

## Operator command

```powershell
$dur22Revision = 'ffd6f1ec1ec70de238d631e0c3116e786694390b'
$dur22Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability22-20260917'
$dur22Source = "$dur22Root/source"
if(Test-Path -LiteralPath $dur22Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur22Root | Out-Null
git worktree add --detach "$dur22Source" $dur22Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur22Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur22Source/scripts/durability22-run.mjs" "--out=$dur22Root/results" "--revision=$dur22Revision" --tree=d3a2ce8e345c36acec52de76da0ea1c94574fb00 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur22Exit=$LASTEXITCODE
@{exit=$dur22Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur22Root/operator-exit.json"
```

Retain all raw results and clean source. Windows long-path worktree cleanup failed
on21; no force cleanup or unrelated resource deletion in this packet. Runtime
process exits normally; no Docker services are created.

## Required decision-oriented report

Write docs/briefs/bot-balance-durability22-report.md and index it. Report block
identity/completeness/actual duration, death/censor counts, exposure and actual
READY species stats, including fixed absolute shields. Verify corresponding
control/candidate initial geometryRosterHash before interpreting comparisons.

For every species/class/node report per-seed eligible clean medians, then median
across available seeds; use night5-audit.json, not pooled generic per-type output.
Show paired candidate-minus-control seed differences where BOTH have eligible
observations; fewer than2 paired seeds is inconclusive. Keep missing/unfinished/
HP-regain/deaths separate; don't disguise survivor selection or long quiet time.

Trench: show ALL THREE species versus the user's40–60s encounter goal, full class
spread, target survival/censoring, damage gaps and approach/recovery interruptions.
Body TTK begins at first damaging hit; also inspect engagement episodes and
approach time, especially Stalker. Do not equate first-hit-to-death with full
engagement duration or a multi-target episode with one mini-boss. Flag outliers
above90s/unfinished descriptively, not as an automatic balance threshold. Explain
whether slow Conduit is low delivery, target shields, pursuit, or interrupted
engagement; no class patch and no forcing every build to the same target.

All biomes: report casts started/fired, minHP, time/kills before death, damage
sources, additional pursuers and recovery. Inspect10s/30s before death/minimum
for new candidate failures. More damage taken in a longer successful fight is
not itself regression; repeated early losses or loss of practical counterplay
matter. Rare deaths are not an automatic failure or mandatory nerf.

Finish with a finite species-level adopt/adjust/retain/inconclusive recommendation
for this proposed package, plus proposed attack compensation ONLY if new pressure
evidence supports it. Do not demand another entire survey for one class exception.
Keep other T4 biome decisions and outstanding Jungle performance separate.
No production adoption, extra experiment, class/ability tuning or release claim.
