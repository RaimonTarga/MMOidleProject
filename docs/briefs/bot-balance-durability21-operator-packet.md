# Durability21 — close T4 biome coverage and interpret existing death cases

Prepared2026-09-17; NOT LAUNCHED. Manual Luna operator, once sequentially.
No subagents, retries, new balance changes, adaptive builds or cap extensions.
This is a compact follow-up toward the invited-playtest roadmap, not another night.

## Question and acceptance philosophy

Night5-R1 used6h43m but missed T4 Tundra/Volcano and most Trench. Get a bounded
species/pressure screen for those biomes before proposing a consolidated mob pass.
Use one existing medium/native-range reference specialization per root, not all18.
Do not repeat Jungle, Mountain or the completed weapon/sustain matrices.

The user accepts occasional deaths in a dangerous biome. A bot is a fixed policy,
not perfect expert play. Do NOT use zero deaths as a universal pass criterion,
require every class to clear every encounter without loss, or infer a mob nerf
from one death. Even an expert-prepared build can face RNG, accumulated pressure
or a bad pull. Assess frequency, time to death, preventability, farming achieved
before death and credible player counterplay. Respawn/economy costs need later
x1 evidence; these first-death synthetic windows cannot measure them. T2 Striker's
4/6 failures with either boot package deserve inspection, not an automatic patch.

## Frozen identity

Revision: `bcd0b0a3b61bf75451b1d1a3fc42c13d04e6b24e`
Branch: `codex/durability21-frozen`
Tree: `2f84f01cf2caffd16ebdc20b6471220be4101979`
Definitions: `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same gameplay as Night5-R1; only new matrix/orchestration. Concurrent main-checkout
runtime edits are excluded. Preserve that provenance when proposing patches on
current source. Synthetic fully prepared +5 gear; no acquisition/economy claim,
Docker, database, browser or travel. Windows loader uses the repaired file URL.

## Sealed matrix

Three independent blocks in order: tundra, volcanic, trench. Each has12 cells:
node03/05 x6 roots; seeds32003/34019/36007, hence36 observations per biome,
108 total. Fresh World and natural ecology per observation,100ms ticks,300s or
first death. All are new seeds; comparisons with Night5 are descriptive, not paired.

Reference branches retained from Night5A:
Striker/Maestro, Squire/Reverb, Apprentice/Pyromancer, Slinger/Bounty hunter,
Conduit/Marshal, Spirit/Equinox. This is a continuity baseline, not selection of
winners from the partial18-build screen or a claim of optimal specialization.
Spirit Equinox's Desert losses remain a separate review item below.

Weapons: Striker/Spirit Eruption Lash, Squire Warmaul, Apprentice Plague Axe,
Slinger/Conduit Deathfang Rapier. Biome primary armor/charm, Mountain boots,
Tempered Core and Colossus Heart; offensive stance; Sweep/Frenzy, Second Wind,
Cleanse. Ranged orbit; all approach, Step Back, hazard avoidance, recovery rules
as Night5. No mob overlays apply to these T4 cells, no HP/attack adjustment.

Tundra's baseline is NOT optimized control/kiting gear. If it fails, compare known
Hamstring/Binding Strike/Desert or slow-resist boot options in interpretation,
verify their applicability before any future proposal, and request user advice
if needed. Do not silently equip them during this matrix or immediately nerf mobs.

Planning estimate30–60 wall minutes for simulations, plus existing-log review;
not a promise. Per observation120s wall/2GiB RSS ceiling. Each biome has its own
30-minute soft budget (finish current observation) and35-minute watchdog. Queue
ceiling2 hours plus bounded reports. Budget-partial block advances to next biome;
unexpected runner/identity/audit errors or watchdog kill stop and preserve outputs.
Wall-censored is not a death, a full surviving window or a missing observation.
Independent budgets prevent one slow biome from consuming another's allocation.

## Preparation

All36 setups qualified and18 short node03 pilots were exercised through the same
shared Windows-safe child argument builder as the launcher, with exposure audits.
Preparation receipts: C:/Users/osaif/AppData/Local/mmo-idle/validation/durability21.
Benchmark typecheck and diff check passed. Full suite/live tests not rerun for
this matrix-only change. Pilots are readiness evidence, not balance results.
Do not rerun preparation or the full Night5 batch.

## Execute once

```powershell
$dur21Revision = 'bcd0b0a3b61bf75451b1d1a3fc42c13d04e6b24e'
$dur21Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability21-20260917'
$dur21Source = "$dur21Root/source"
if(Test-Path -LiteralPath $dur21Root){throw 'Existing root: inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur21Root | Out-Null
git worktree add --detach "$dur21Source" $dur21Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur21Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependency setup failed'}
node "$dur21Source/scripts/durability21-run.mjs" "--out=$dur21Root/results" "--revision=$dur21Revision" --tree=2f84f01cf2caffd16ebdc20b6471220be4101979 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur21Exit=$LASTEXITCODE
@{exit=$dur21Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur21Root/operator-exit.json"
```

Retain all raw data, logs and partials. No services need cleanup. After terminal
completion, the clean disposable worktree may be removed with git worktree remove
(no force); never delete experiment results, historical roots or unrelated Docker
resources. No extra runs after this packet.

## Read-only review of existing Night5-R1 observations

Use C:/Users/osaif/AppData/Local/mmo-idle/experiments/night5-r1-20260917/results.
Do not replay these fights or alter their artifacts. Review24 existing observations:

- Mountain: all T2 Striker03/05, both no-orbit boot arms, all3 seeds (12 rows).
- T4A: Spirit Desert03/05, all3 seeds (6 rows).
- T4B: Slinger Graveyard03/05, all3 seeds (6 rows).

Use each manifest to select exact cells; preserve successful controls alongside
deaths. Report per-row actual seconds/kills before death or end, minHP, damage
sources/types in10s/30s before death (or lowest sampledHP for survivors), peak
player pursuers and late joiners, recovery interruptions, cast starts/fires and
available defensive activation evidence. Sampled aggro counts are1s proxies;
minion pursuit differs from player pursuit. Distinguish a single huge hit,
overlapping casts, repeated pressure, DoT accumulation, extra pulls, and failed
movement/recovery. Do not label ability failure without an eligible opportunity.

For T4A/B inspect frozen specialization definitions and READY equipment to name
plausible mismatches, keeping conjecture separate from observed events. If this
requires broader theorycrafting, return a concrete question for the user; don't
redesign builds or begin class balance. Limit review to60 operator wall minutes;
if incomplete, explicitly list rows reviewed/unreviewed instead of guessing.

## Required report

Write docs/briefs/bot-balance-durability21-report.md and index docs/README.md.
Record frozen hashes, completeness per biome and wall time. Use night5-audit.json
eligible per-seed species medians then outer medians; fewer than2 eligible seeds
means inconclusive. Do not use generic pooled per-type medians as the primary
estimator. Keep death/censor/unfinished/regained/missing outcomes distinct, and
list species not encountered or never killed. Quiet survival is not safety.

Report per species/class/node: clean TTK, kill/sample counts, minHP/deaths,
casts fired versus started, incoming pressure and exposure flags. Use actual
READY HP/attack/defenses. Separate slow simulations from hard combat. Compare
with existing T4 Mountain/Desert/Graveyard evidence descriptively, not as matched
trials; five-minute survival does not replace longer-window attrition evidence.

Finish with one combined T4 seven-biome coverage/work map using Night5 plus this
screen: retain / durability candidate / pressure or mechanic candidate /
build-sensitive / unknown. Jungle remains performance-limited, not automatically
balanced. Name unobserved species and provisional conclusions explicitly.
Recommend role-based T4 numerical candidates for planner review; avoid one global
HP multiplier or a universal per-class TTK floor. Include the existing-death-case
review and distinguish acceptable danger from likely repeated farming failure.
No automatic production adoption, new experiment, cap extension or release claim.

Direction after this packet: consolidated initial T1–T4 mob pass, focused
regression/boss/progression checks, basic x1 pacing and operational readiness,
then invited player feedback. Full class/item/ability parity remains later work.
