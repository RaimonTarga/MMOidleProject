# Night5-R1 — Mountain pull control, T4 roster and sustained farming

Prepared 2026-09-17. NOT LAUNCHED. Manual Luna operator, one sequential batch.
Read this packet, then execute its launcher once. No subagents, source edits,
production balance patches, adaptive builds, retries or replacement seeds.

## Launcher repair / separately prepared run

The original Night5 failed before observation1; preserve its source and artifacts.
This R1 packet supersedes the failed launch, retaining ALL cells, seeds, builds,
ceilings and gameplay definitions. Only launcher import-path handling changes:
Windows absolute loader paths are converted with pathToFileURL().href. A shared
argument builder now drives both the launcher and its regression test.

The previous relative-path pilot did not exercise the failing absolute-path form.
The corrected exact child invocation completed four Mountain30s pilots and their
audit. Censored-verifier regression also passed. Validation output:
`C:/Users/osaif/AppData/Local/mmo-idle/validation/night5/windows-loader-pilot`.
Original524 setup/158 pilot evidence remains applicable because no templates or
runtime changed. These repair pilots are not extra experiment observations.
The full overnight batch has NOT been launched by the planner. Run R1 once using
the NEW root below; do not retry or mutate the old root. Write the R1 report to its
separate filename so the original failure report remains intact.

## Purpose and decisions

Durability20 retained 504 observations: 470 full windows, 14 deaths, 20 wall
ceilings (all Jungle). Eleven deaths were Mountain. Forest/Volcano selected
packages remained nonlethal in the fresh screen. Do not reopen their selection.
The old verifier rejected the runner's wall-ceiling label; that is an artifact
verification mismatch, not evidence of illegal rune setups. Earlier hazard and
approach repairs did change real behavior (see Durability13 planner follow-up).

The user's Mountain playtest explains a plausible mechanism: longer-lived mobs
follow kiting players around ledges, attracting additional enemies. Cave boots
reduce detection in source (T2 +5 stealth 48%, T3 +5 60%, subject to terrain and
runtime detection limits). Test that build tradeoff before another attack nerf.
Boots also change speed and other benefits: this is an equipment-package test,
not an isolated stealth coefficient test. No-orbit retains approach, telegraph
Step Back, hazard avoidance and recovery; it does NOT mean immobile combat.

Playtest gate: an initial balance pass on ALL mobs through T4, not merely one
successful progression route. T4 durability has not received the T2/T3 treatment.
This overnight screen informs that pass; it does not finish it automatically.
Do not infer readiness from zero deaths or use T2 as a settled duration reference.
Items/classes/abilities and x1 economy remain subsequent passes. Fix mechanics
when needed for valid evidence, but don't tune class numbers in this batch.

## Frozen source

- Revision: `d0492235ce8a8a9582825f3088ec88db10a4486b`
- Branch: `codex/night5-r1-frozen`
- Tree: `a7c3de8246f254c895a8c3f09ebf1492afb4ddbe`
- Definitions: `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
- Hitboxes: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same gameplay snapshot as Durability20, plus experimental templates, diagnostics
and orchestration only. Concurrent main-checkout gameplay/UI edits are excluded.
This isolates the comparisons; conclusions are about this frozen version.
No Docker, database, browser, traversal, acquisition or reward multiplier.
Fully prepared +5 synthetic Worlds with natural ecology, no earned progression
claim. Initial setup refills health/barrier; subsequent recovery is ordinary.

## Sealed queue

Seeds26003/28001/30011. First death ends that observation; no respawn or retry.
Every block uses separate output and a fresh process. All run once in this order:

| Block | Question | Cells / observations | Simulated window |
| --- | --- | ---: | ---: |
| mountain | T2/T3 Mountain03/05, six roots; ranged orbit on/off x Mountain/Cave boots, melee boots only | 80 / 240 | 15 minutes |
| t4a | All seven T4 biomes03/05, six medium-frame roots, specialization A | 84 / 252 | 15 minutes |
| weapons | T2/T3 Cave, Desert and swarm reference (T2 Plains/T3 Volcano), nodes03/05, six roots, baseline/alternate weapon | 144 / 432 | 15 minutes |
| t4b | Same T4 coverage, specialization B | 84 / 252 | 15 minutes |
| sustain | T2 Forest/Swamp and T3 Volcano/Tundra03/05, all six roots | 48 / 144 | 30 minutes |
| t4c | Same T4 coverage, specialization C | 84 / 252 | 15 minutes |

Total524 cells /1572 observations, maximum429 simulated hours. Planning range
roughly5–8 wall hours based on short pilots and Durability20 throughput; not a
promise or a minimum. End when the useful sealed work ends; do not pad the night.
75-minute soft ceiling per block (finish current observation), 120-second wall
ceiling per observation, 2GiB RSS guard. Launcher watchdog80 minutes per process
and8 hours for simulation queue, with bounded reporting afterward. A wall ceiling
is CENSORED, not a death or a full survival window. Do not extend caps on the fly.
A block budget keeps its partials and advances to the next independent block.
Unexpected errors, identity/audit failures or watchdog kill stop the queue.

## Templates and controls

T2/T3 inherit Durability20 medium/native-range builds, biome armor/charm, Tempered
Core, Sweep, Second Wind, Cleanse and (T3+) Frenzy. The previous selected packages
remain process-local: Dire Wolf1575HP/22attack; Ironclaw Badger945HP/25attack;
Magma Tortoise3000HP/116attack, Guard14%; Ash Salamander1330HP/84attack.
All mob definitions restore after every observation. No new mob treatments.

Mountain arms alter only orbit rule presence and mobility item. The four ranged
roots are Apprentice, Slinger, Conduit and Spirit. Striker/Squire retain their
normal non-orbit behavior, comparing boots only. Do not claim randomized combat
trajectories stay identical once movement diverges; compare fresh seed blocks.

Weapons: Striker swaps fast weapon for Mountain hammer; Squire swaps hammer for
Cave axe; Apprentice/Conduit/Spirit swap Cave axe for Jungle on-hit rapier;
Slinger swaps Jungle on-hit rapier for Swamp DoT weapon. Other loadout unchanged.
This screens build interactions, not a global weapon ranking or an item patch.

T4 biomes: Mountain, Tundra, Jungle, Desert, Volcano, Graveyard, Trench. Medium
frames, native close/mid range, legal specialization unlocked as fourth skill
(the source ID says t3 because skill tiers are zero based). Three branch screens:

| Root | A | B | C |
| --- | --- | --- | --- |
| Striker | Maestro | Wavecrest | Justicar |
| Squire | Reverb | Dynamo | Stalwart |
| Apprentice | Pyromancer | Firebrand | Cinder Lord |
| Slinger | Bounty hunter | Blunderbuss | Dualslinger |
| Conduit | Marshal | Chorister | Ritualist |
| Spirit | Equinox | Stormbringer | Aetherist |

T4 weapons: Striker/Spirit Eruption Lash; Squire Warmaul; Apprentice Plague Axe;
Slinger/Conduit Deathfang Rapier. Biome armor/charm primary branch, Mountain boots,
Tempered Core, Colossus Heart, offensive stance; same Sweep/Frenzy and two guards.
All item identities and unlocked skills are retained in manifest and READY.
These are standardized first-screen builds, NOT optimized specialization claims.
T4 has no new HP multiplier, DR or attack treatment in this packet. Relic/core and
weapon synergy remain confounds when comparing classes; compare the same build
across mob roles first. A poor specialization result goes to build review and
user advice before recommending a mob nerf. Voidwalker is not in this medium-frame
screen; retain its historical successful route as a separate expert reference.

## Preparation completed

524 setups qualified. 158 thirty-second pilots passed without death or wall
ceiling. These cover all42 class/node03 setups per T4 branch,12 paired weapon
setups (24 pilots), four Mountain ranged arms and four sustain biomes. A separate
four-case launcher-style Mountain pilot and exposure audit passed. Short pilots
are readiness only, not survival certification. Frozen-revision qualification
receipts: `C:/Users/osaif/AppData/Local/mmo-idle/validation/night5/frozen-qualify-*`.
Other preparation receipts live alongside those. Bench typecheck, matrix/overlay
restoration test, censored-verifier regression and diff check passed. Full suite
and live/browser tests were not rerun. Do not rerun preparation overnight.

## Operator launch

Run from main repo, use a NEW root. Existing root means inspect/report, not retry.
The launcher records identity, times and outcomes. It runs and audits every block;
Luna should wait for completion, not repeatedly inspect every individual fight.

```powershell
$night5Revision = 'd0492235ce8a8a9582825f3088ec88db10a4486b'
$night5Tree = 'a7c3de8246f254c895a8c3f09ebf1492afb4ddbe'
$night5Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917'
$night5Source = "$night5Root/source"
$night5Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if(Test-Path -LiteralPath $night5Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $night5Root | Out-Null
git worktree add --detach "$night5Source" $night5Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$night5Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependency setup failed'}
node "$night5Source/scripts/night5-run.mjs" "--out=$night5Root/results" "--revision=$night5Revision" "--tree=$night5Tree" --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 "--hitboxes=$night5Hitboxes" --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$night5Exit=$LASTEXITCODE
@{exit=$night5Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$night5Root/operator-exit.json"
```

No detached windows/services or parallel simulations. After terminal completion,
retain all raw results, source revision branch and ledger. You may remove ONLY the
clean disposable worktree with `git worktree remove "$night5Source"`; no force,
no global Docker prune, no experiment-artifact deletion. Leave it if dirty/busy.
Report failures and unstarted blocks, even if the batch never reaches its end file.

## Required report and interpretation

Write `docs/briefs/bot-balance-night5-r1-report.md` and index it in docs/README.md.
Use `night5-audit.json` species medians: eligible per-seed clean medians then outer
median, excluding wall-censored/long-quiet runs from the primary duration estimate.
Retain their raw data and failure counts. Fewer than two eligible seeds means
inconclusive. The generic reporter pools species targets; do NOT substitute its
per-type median for the audit's defined estimator. Deaths can contribute observed
kills, but discuss survivor selection and never treat their short windows as full
farming success. Missing, unfinished, HP-regain and censored remain separate.

For each block: planned/started/full/dead/censored/unstarted counts, wall time,
identity verification (or budget-partial status), exposure, species TTK/kill counts,
casts started/fired and incoming damage. Do not call a verified artifact set a
fully completed survival matrix: verifier now explicitly reports censored count.
Jungle wall time, max tick time and simulated seconds identify where further
performance investigation is needed; a cutoff alone does not diagnose RAM or AI.

Mountain: paired seed/node/class build deltas for deaths/minHP, peak simultaneous
player pursuers, seconds with3+ pursuers, late joiners, recovery interruptions,
outgoing gaps, species kill time and damage sources in10s/30s before death/minimum.
Distinguish per-run peak from a median. Aggro samples are1s proxies, not exact pull
events. Minion pursuit is not counted as player pursuit. Explain the protection
lost by changing boots, and whether no-orbit increases direct melee exposure.
Only propose attack tuning if ordinary legal build answers remain insufficient.

T4: a seven-biome/species work map across18 medium specializations. Compare mob
roles with T2/T3 evidence descriptively, accounting for gear/spec changes. Show
species never reached, rare encounters and incomplete windows. This covers03/05,
not every map, boss or T4 branch. Flag short fights that suppress mechanics and
pressure spikes. Recommend role-specific HP/defense/attack candidates for review,
not blanket xN HP or a mandatory universal floor. T4 duration targets are not yet
agreed. Identify where user theorycraft advice would prevent a wrong balance call.

Sustain: report each run's first5 minutes separately from the remainder, recovery
and pressure accumulation, environmental/DoT sources and inactivity. Deaths before
five minutes stay visible. Do not use time survived while inactive as safety.

Finish with a finite proposed mob worklist: Mountain treatment vs stat decision,
T4 numerical candidates, and named build/tooling exceptions. Class/ability issues
stay separate. No production adoption, automatic extra experiment or playtest
readiness declaration by the operator. Return findings for planner/user review.
