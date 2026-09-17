# Durability24 — Graveyard leader/escort durability and targeting

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED.
Execute once, sequentially. No subagents, retries, adaptive builds, production
patches, commits, pushes or cap extensions. Preserve unrelated work and failures.

## Decision and scope

User design supersedes the older squishy-necromancer interpretation: Gravewright
should be durable, accompanied by lower-HP creatures. Durability23 demonstrated
that Focus Elites changes targeting, but deaths rose from 3/42 controls to 17/42
focused observations. All focused Conduit and Spirit observations died. Do not
adopt Focus Elites as a universal template improvement.

Test a single HP redistribution under both targeting policies. This four-arm
design distinguishes the HP package effect from its interaction with targeting.
No damage, defense, resurrection cadence/cap/scalars, gear or class changes.
Jungle performance investigation is a separate pending task, not in this launcher.
Carry Durability22's 14 and Durability23's two Volcano HP candidates forward for
consolidated review without rerunning them or claiming they are live.

## Sealed matrix

- Six Night5A roots, plus Night5B Slinger/Blunderbuss as a separate stress case.
- Graveyard nodes 03 and 05; seeds 50021, 52009, 54001.
- Four arms: control-normal, control-focus, redistributed-normal, redistributed-focus.
- 56 cells / 168 observations. Each lasts 900 simulated seconds or first death.
- Focus arms add only legal In Combat -> Focus Elites, with ownership and RP checks.
- Same fully prepared synthetic +5 gear and skills as Durability23. No economy,
  progression, travel, Docker or services. 100ms authoritative ticks.
- Six root builds use medium frame/native range nodes; Blunderbuss's authored
  short actual range is preserved. Report actual range separately from node choice.

| Species | Control HP | Redistributed HP |
| --- | ---: | ---: |
| Gravewright | 2851 | 5702 |
| Bone Crawler | 2059 | 1235 |
| Plague Hound | 3168 | 1901 |
| Carrion Vulture | 2693 | 1616 |
| Bone Rat (plague-rat) | 1584 | 950 |

Leader HP doubles; escorts have 40% less HP, rounded. The authored leader-plus-
escort starting HP totals change by approximately -4.5% to +4.2% across variants.
This is roughly a redistribution, not a blanket pack durability increase.
It is NOT total encounter eHP neutrality: resurrection, overkill, targeting and
time exposed to mechanics can change the actual workload. Escort species changes
also affect loose individuals, and ordinary resurrection can inherit lower HP;
inspect actual Risen stats/events rather than treating them as an independent edit.

## Timing and operational boundaries

Expected roughly 20–30 wall minutes based on Durability23, not a guarantee.
Per observation: 120s wall ceiling and 2GiB RSS guard. Block: 30min soft budget,
35min watchdog. Existing queue safety cap: three hours; it does not extend the
single block's limits. Preserve partials; no retry or cap extension. Unexpected
source/identity/runner/audit failure stops. No global cleanup or force deletion.

## Frozen identity and readiness

Revision: `d00215b48edeba90110a23f48acb3c9e364da2e6`
Branch: `codex/durability24-frozen`
Tree: `31261e23f1b9f853941006e6cc68834e3aee939d`
Definitions: `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes: `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same frozen gameplay baseline as Durability23; concurrent main-checkout gameplay
changes excluded. Reconcile current source before eventual production adoption.
All 56 configurations qualified and 28 short node03 pilots passed preparation.
Receipts: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability24`.
Preparation ran immediately before the identical source was committed/frozen;
its metadata may name parent b12bb917, not the final revision. Do not present
these readiness pilots as balance evidence. Matrix/restoration test, benchmark
typecheck, launcher syntax and diff checks passed. No full-suite/live playtest.

## Execute once

```powershell
$dur24Revision = 'd00215b48edeba90110a23f48acb3c9e364da2e6'
$dur24Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability24-20260917'
$dur24Source = "$dur24Root/source"
if(Test-Path -LiteralPath $dur24Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur24Root | Out-Null
git worktree add --detach "$dur24Source" $dur24Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur24Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur24Source/scripts/durability24-run.mjs" "--out=$dur24Root/results" "--revision=$dur24Revision" --tree=31261e23f1b9f853941006e6cc68834e3aee939d --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur24Exit = $LASTEXITCODE
@{exit=$dur24Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur24Root/operator-exit.json"
```

Retain clean detached source, raw data and ledger. Shared Windows-safe child
launcher uses a file URL for Node's import loader. Do not improvise shell paths.

## Required analysis and report

Write `docs/briefs/bot-balance-durability24-report.md`; index in docs/README.md.
Verify all READY builds and identical initial geometry within each four-arm
node/profile/seed group. HP differs only by the five declared species; combat
attack/plating/DR is unchanged. Within an HP policy, roster hashes must match.

Report paired effects separately:
1. Redistributed-normal minus control-normal.
2. Redistributed-focus minus control-focus.
3. Focus minus normal within each HP package.
Do not compare only control-normal against redistributed-focus: that confounds
both factors. Keep each specialization and node visible; at least two eligible
paired seeds for a timing conclusion. No class-global winner selection.

Primary TTK: per-seed clean body medians, then eligible seed median per cell.
Use night5-audit.json; exclude inconclusive cells from headline summaries, retain
unfinished/regained/dead/censored/quiet observations explicitly. Show all root
rows, equal-weight six-root summaries and fastest/slowest eligible results.
Blunderbuss is an extra stress case, not extra weight for Slinger in the center.
Do not pool all kills: faster builds generate more kills and would dominate.

Report Gravewright and escort species TTK, pack clear times, deaths, minimum HP,
time/kills before death, live pursuers, recovery interruption and targeting samples.
Body TTK starts at first damage; report travel/first contact separately. Necromancer
death can crumble summons, so summon removal must not masquerade as player DPS.
For Raise Dead, Risen activity and DoT exposure, give simulated-time denominators
alongside totals: arms ending in death have unequal exposure. Inspect 10s/30s
pre-death windows for repeated failures. Distinguish position/pursuit hypotheses
from event-supported causes. Check whether earlier follower deaths fuel more
raises even as each resurrected follower is easier to kill. No general DoT nerf.

## Tier pacing guardrail and finite next decision

USER GOAL: TTK rises by tier, with a sharper rise for low-density elite encounters;
all three Trench species target representative 40–60s mini-boss fights. Swarm
followers remain quick to dispatch; compare their pack duration and pressure too.
Survival alone does not meet this pacing gate. Durability22 Stalker ~35s remains
below target. Volcano ~10–14s anchors are a local improvement, not proof that
T4 pacing exceeds T3. The tier ladder has NOT yet been certified.

Do not choose one T4 class as universal average DPS. Use equal-weight root/profile
results by encounter role, separate specialization stress cases, and show fast/slow
tails. A future focused tier-ladder regression must compare equivalent prepared
build philosophies at appropriate tier gear and role-matched encounters, with a
consistent source snapshot. Existing mixed-tier/mixed-revision medians are context,
not matched evidence. Do not rerun the entire campaign to manufacture this report.

Finish with adopt/adjust/reject for this Graveyard package under each targeting
policy and exact remaining gaps. Retain selected 16 other candidates. Pending
Jungle performance/durability work and tier-ladder regression precede declaring
the initial mob pass complete. Class/item/ability outlier tuning stays later,
unless a severe blocker makes the mob decision uninterpretable. No production
patch or further experiment is authorized to the operator by this packet.
