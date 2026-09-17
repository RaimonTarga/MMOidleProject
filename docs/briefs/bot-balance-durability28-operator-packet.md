# Durability28 — melee stance counterplay on retained mob candidates

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED. Execute once sequentially.
No subagents, retries, adaptive builds, production edits, commits or pushes.

## Decision from Durability27

Verified counts: Mountain deaths18/36 control ->6/36 candidate, with one candidate
wall cutoff; Desert0/36 ->6/36. Mountain retained pressure while improving most
builds. Four Mountain candidate deaths and all six Desert candidate deaths were
Striker. Candidate Desert controllers reached~15.2s in the eligible five-root
summary. Do not call the missing Striker timing a balanced six-root outcome.

Retain both numeric packages as candidates while testing an ordinary player
defensive option. No automatic further mob nerf, HP rollback or global class fix.
Conduit's27.6s T2 Basilisk is below its OWN T3 reference44.15s; comparing that tail
only to the22.1s all-root T3 center does not establish a per-class tier reversal.
Mountain attack-only tuning was never intended to raise body TTK.

Question: can Defensive stance make the problematic melee profiles sustain these
longer encounters, at an acceptable damage/time cost? This is a bot-build interaction
screen, not broad stance balance or proof that every player should use it.

## Sealed matrix

Three blocks: mountain2, desert2, mountain4. Each uses Striker and Squire, nodes03/05,
Offensive/Defensive stance, seeds74017/76001/78007:8 cells/24 observations per block.
Total24 cells/72 observations.600 simulated seconds or first death,100ms ticks.
Natural ecology, synthetic fully prepared +5; no services, Docker, travel or economy.

Both arms share these selected mob packages:
- Mountain T2: Titan attack67, Eagle60, Boulder Thrower72; HP unchanged (Durability27 candidate).
- Desert T2: Scorpion/Basilisk HP1365 each; Scarab and attacks unchanged (Durability27 candidate).
- Mountain T4: selected Durability22 package plus Mammoth HP13800, absolute ward
  preserved (Durability26 candidate); all other selected values unchanged.

The ONLY player treatment is Offensive -> Defensive stance. Same RP-legal abilities,
runes, gear, upgrades and skills. Squire is a second melee profile, not an untreated
causal control. Each class has its own paired Offensive control. T4 names MUST be
shown: Striker/Maestro and Squire/Reverb. T2 has medium frame, no T4 specialization.
Same weapons as25: T2 Gale Needle/Quake Hammer; T4 Eruption Lash/Warmaul.
Biome armor/charm, Mountain boots, Tempered Core, T4 Colossus Heart; Sweep, Second
Wind/Cleanse, T4 Frenzy; normal targeting and existing movement/recovery rules.

Defensive stance adds plating and damage protection at an outgoing-damage cost.
Use actual frozen READY modifiers and damage results, not a guessed linear TTK
conversion. Longer fights may still increase attrition: survival is not assumed.
No new mob candidate, weapon swap, range change or adaptive winner selection.

## Frozen identity and readiness

Revision `40eba357b9c7b2f71308b53116557c797c5c8bcd`
Branch `codex/durability28-frozen`
Tree `a169c249c9c9caf90b84374393d3972663c6f5be`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same frozen gameplay as27, concurrent shared-checkout changes excluded. Reconcile
current source before adoption. Receipts: C:/Users/osaif/AppData/Local/mmo-idle/validation/durability28.
All 24 setups and 12 short pilots passed. Matrix/identical-mob/restoration test,
benchmark typecheck and syntax/diff checks passed; preparation, not full-suite/live proof.
Metadata may name parent because identical source was qualified around freezing.

Expected10–25 wall minutes, uncertain. Per observation120s wall/2GiB RSS;
per block30min soft/35min watchdog; queue3h safety. Budget partials advance;
unexpected identity/runner/audit failure stops. Preserve partials; no retries,
cap extensions, forced worktree deletion or global cleanup.

## Execute once

```powershell
$dur28Revision = '40eba357b9c7b2f71308b53116557c797c5c8bcd'
$dur28Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability28-20260917'
$dur28Source = "$dur28Root/source"
if(Test-Path -LiteralPath $dur28Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur28Root | Out-Null
git worktree add --detach "$dur28Source" $dur28Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur28Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur28Source/scripts/durability28-run.mjs" "--out=$dur28Root/results" "--revision=$dur28Revision" --tree=a169c249c9c9caf90b84374393d3972663c6f5be --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur28Exit = $LASTEXITCODE
@{exit=$dur28Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur28Root/operator-exit.json"
```

## Required report and finite decisions

Write docs/briefs/bot-balance-durability28-report.md and index docs/README.md.
Verify same paired geometry/full monster roster/monster stats. Verify only stance
differs in player loadout, with the expected derived-stat/RP changes. Do not require
identical PLAYER combat stats across stance arms. Audit ward products in mountain4.

Compare fresh same-seed stance pairs, not historical deaths as causal controls.
Show each class/node/seed, deaths, time/kills before death, minHP/barrier, incoming
10s/30s windows, recovery interruptions and pursuer/late-join exposure. Separate
ordinary attacks and cast evidence where schema permits; do not infer everything
from the killing blow. Report simulation/wall time, quiet and cutoff rows explicitly.

Use eligible clean per-seed body medians then cell medians, at least2 eligible
paired seeds. Preserve unfinished/regained/dead/missing timing. Report real episode
durations, not pooled target TTK. Show survival versus damage/throughput cost;
death-truncated survivors are not an equivalent total-exposure denominator.
No six-class median from this two-class screen, no universal stance winner.

Classify each location as: ordinary defensive tool sufficient in sampled cases;
partial mitigation with remaining pressure; or unresolved. If it works, retain
the numeric package with a situational template choice pending current-source
regression. If not, propose ONE specific next pressure/build investigation, not
another broad six-class HP sweep. Do not require zero deaths to accept improvement,
but systematic early Striker deaths remain a blocker for that reference build.

Keep Mountain T2 scalar/Desert HP candidates provisional until this interaction
is assessed. T4 timing, long class tails and Maestro pressure remain separately
visible. Jungle performance/durability and Trench Stalker timing still pending;
this packet does not resolve them. No production adoption or further run.
