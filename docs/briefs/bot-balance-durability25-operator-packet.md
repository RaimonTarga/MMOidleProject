# Durability25 — matched Mountain and Desert tier-pacing screen

Prepared 2026-09-17. Manual Luna operator. NOT LAUNCHED. Run once sequentially;
no subagents, retries, adaptive builds, source edits, cap extensions, commits or pushes.

## Decision from Durability24

Verified raw arm counts: CN 5/42 deaths, CF 20/42, RN 0/42, RF 12/42.
Retain the exact Gravewright 5702 HP / escorts 1235,1901,1616,950 HP package for
adoption review under normal targeting. Root-weighted Gravewright TTK was about
15.925s; escort kills were quicker and survival improved, including Blunderbuss.
Do not keep repeating the four-arm grid or adopt universal Focus Elites.

CORRECTION: 40–60s is the explicit three-species Trench mini-boss target, NOT an
agreed Gravewright target. The report's claim that Gravewright fails a 40–60s goal
does not follow from the design. Retain its durability shape pending role-specific
pacing assessment. Also, its columns labelled pack median are described as
all-target body medians: they must not be reused as actual encounter clear times.

Next question: with tier-appropriate prepared builds, do comparable low-density
roles take longer at T3 than T2 and at T4 than T3? Mountain and Desert provide
recurring roles and avoid mixing swamp/swarm timing into the elite benchmark.
This is a focused screen, not complete tier certification or class balance.
Jungle performance/durability remains a separate pending investigation.

## Matrix and build contract

Two separately budgeted blocks: mountain and desert. Each has T2/T3/T4, nodes
03/05, six roots, seeds 56003/58013/60013: 36 cells / 108 observations per block,
72 cells / 216 observations total. 600 simulated seconds or first death per run.
100ms authoritative ticks, natural ecology, synthetic fully prepared +5 gear.
No services, Docker, economy, travel, respawn or manual intervention.

All tiers: medium frame, biome armor/charm, Mountain boots, Tempered Core,
Offensive stance, Sweep, Second Wind and Cleanse, normal targeting. T3+ adds
native close/medium range and Frenzy; T4 adds Colossus Heart and branch A.
These normal progression unlocks are intentional, not equal-stat DPS controls.

| Root | T2 weapon | T3 weapon | T4 weapon / specialization |
| --- | --- | --- | --- |
| Striker | gale-needle | volcanic-cinderlash | volcanic-eruption-lash / Maestro |
| Squire | quake-hammer | mountain-avalanche-maul | mountain-warmaul / Reverb |
| Apprentice | ruinous-axe | cave-cataclysm-axe | graveyard-plague-axe / Pyromancer |
| Slinger | jungle-stinger-rapier | jungle-venomthorn-rapier | jungle-deathfang-rapier / Bounty Hunter |
| Conduit | jungle-stinger-rapier | jungle-venomthorn-rapier | jungle-deathfang-rapier / Marshal |
| Spirit | gale-needle | volcanic-cinderlash | volcanic-eruption-lash / Equinox |

Conduit and Spirit T2/T3 weapons deliberately differ from the historical Night5A
axe defaults to preserve the T4 on-hit/fast-attacker strategy across this ladder.
Do not treat differences from older reports as a mob-only effect. Other gear and
policy are fixed by the matrix. Report exact paths, equipment and actual range;
T4 is these six specializations, not every build of each root.

T2/T3 use the selected baseline definitions, without additional HP overlays in
these two biomes. T4 uses Durability22's candidate package with absolute shield,
ward and self-shatter budgets preserved. The installer restores all 14 definitions
after each observation; only Mountain/Desert populations are exercised here.
No new candidate multiplier, attack change or production adoption is introduced.

## Role comparisons and interpretation

Primary repeated roles: Granite Titan -> Mountain Colossus -> Granite Mammoth;
Stone Basilisk -> Desert Basilisk -> Dune Basilisk. Keep all other species visible
by authored role. Dune Tyrant and Rhino are separate anchors, not interchangeable
with a cheap scarab or ranged support. Do not invent lineage where none exists.

For each root/node/species, report eligible per-seed body medians and then the
median across eligible seeds. Show tier deltas/ratios per root and node, then
equal-root-weight summaries and fast/slow tails. At least two eligible seeds;
missing, quiet, dead and unfinished observations stay explicit. Do not pool kills
or exclude weak classes silently. A root with insufficient eligible timing is
inconclusive, not a zero or a success. Same seed across tiers is a repeat label,
not identical geometry: map and enemy composition intentionally differ by tier.

The ladder measures experienced progression with matched build philosophies,
not isolated specialization power or strict randomized causal tier effects.
Report whether role medians generally rise, which profiles reverse the trend,
and whether long fights become attrition failures. Survival alone is insufficient.
Earlier user pacing guidance: T2 toughest enemies around 15s minimum; T3 elites
around 20–30s, with discussion of a 20–25s floor. These are role-level guides,
not a demand that every fast build take identical time. Trench's separate 40–60s
goal is not a universal T4 floor. Do not fabricate a precise new T4 target.

## Limits, frozen source and readiness

Expected roughly 20–45 wall minutes, uncertain with longer selected T4 fights.
Per observation: 120s wall ceiling / 2GiB RSS. Each block: 30min soft budget and
35min watchdog. Queue safety cap three hours, not an extension of block caps.
Budget partials advance; unexpected runner/identity/audit failure stops. Retain
partials and failures. No retry, forced cleanup or cap extension.

Revision `03a3bf24fb5799119f0e8a4c98a584a67cf8275a`
Branch `codex/durability25-frozen`
Tree `31e2f2226b63bcca85c40eea2e39c231e35f9d49`
Definitions `a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0`
Hitboxes `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83`

Same frozen runtime as Durability24; concurrent shared-checkout changes excluded.
Current-source reconciliation remains required before production adoption.
Readiness receipts: C:/Users/osaif/AppData/Local/mmo-idle/validation/durability25.
Preparation ran on identical source around freezing; metadata may name its parent.
All 72 configuration checks and 36 short pilots passed. Matrix/
restoration test, benchmark typecheck and syntax/diff checks passed. These are preparation evidence,
not a full repository suite, live playtest, or balance run.

## Execute once

```powershell
$dur25Revision = '03a3bf24fb5799119f0e8a4c98a584a67cf8275a'
$dur25Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability25-20260917'
$dur25Source = "$dur25Root/source"
if(Test-Path -LiteralPath $dur25Root){throw 'Root exists; inspect/report, no retry'}
New-Item -ItemType Directory -Path $dur25Root | Out-Null
git worktree add --detach "$dur25Source" $dur25Revision
if($LASTEXITCODE -ne 0){throw 'Checkout failed'}
pnpm --dir "$dur25Source" install --offline --frozen-lockfile
if($LASTEXITCODE -ne 0){throw 'Dependencies failed'}
node "$dur25Source/scripts/durability25-run.mjs" "--out=$dur25Root/results" "--revision=$dur25Revision" --tree=31e2f2226b63bcca85c40eea2e39c231e35f9d49 --definitions=a30458ee24ad7054c5389b1ed16d47f3435456c18feb34f72ded75c84b0828c0 --hitboxes=C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json --hitbox-hash=08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83
$dur25Exit = $LASTEXITCODE
@{exit=$dur25Exit;ended=(Get-Date).ToUniversalTime().ToString('o')} | ConvertTo-Json | Set-Content "$dur25Root/operator-exit.json"
```

Retain detached source/raw data/ledger. Launcher uses the shared Windows-safe
Node file-URL import helper. Do not recreate shell loader arguments manually.

## Required deliverable and next decision

Write docs/briefs/bot-balance-durability25-report.md and index docs/README.md.
Audit READY builds against the matrix, all actual HP/defense products and sample
completeness. Use night5-audit.json for eligible body timing. Report actual pack
clear durations from index episodes (start/end/duration/outcome), with initial
members, late joiners and unfinished episodes; never relabel pooled target TTK
as pack duration. Report corpse/summon removals separately from damage kills.

Keep per-specialization deaths, minHP, clean/unfinished/regained targets, quiet
and wall cutoffs, incoming damage, recovery/pursuer exposure and mechanics fired.
Inspect 10s/30s windows for repeated deaths; normalize pooled exposure by observed
simulated time. Sparse samples are a limit, not a request for automatic reruns.

Conclude with a role-by-role pacing pass/gap/inconclusive table and the smallest
supported numeric adjustment proposal, if any. Do not patch. Retain the 16 prior
candidates plus Graveyard's five-species normal-targeting package for adoption
review. Do not reopen Focus Elites or all T4 branches. Jungle runtime/durability,
Trench's sub-target Stalker and current-source regression remain explicit pending
items; this limited ladder does not certify all mobs or invited-playtest readiness.
