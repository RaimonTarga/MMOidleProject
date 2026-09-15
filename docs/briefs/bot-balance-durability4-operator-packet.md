# Durability 4 — Conduit equipment counter and Eagle dive isolation

Prepared2026-09-15. READY, full experiment NOT run. Luna operates the declared
batch exactly once. No subagents, adaptation, source edits, retries or live
balance changes. User will review results with Astra.

## Questions and decisions this enables

1. Can Conduit use a heavier weapon to counter high plating, at an acceptable
   cost in kill time? The vulnerability is known; do not redesign class damage,
   add penetration or compensate summons in this packet. If all weapons stall,
   recommend keeping ordinary enemy plating below that threshold for now.
2. Does reducing only Stone Eagle's opening dive improve T2 Mountain pressure
   while preserving its ordinary attacks? Previous base-attack arms changed both.

Keep Apprentice's armored-enemy advantage acceptable. No DoT resistance. Ordinary
weapon reservoir DoT currently derives from post-mitigation damage; unchanged.
Troll rush/root/slam, Slam/Sweep proposals, other biomes, bosses and economy remain
separate. T2 is unfinished. Provisional toughest-enemy targets remain10–20s T2,
20–30s T3, not mandatory equality across classes or a band for swarm bodies.

## A: Conduit weapon by plating

Four nodes: node-t2-cave-02, node-t2-mountain-04, node-t3-cave-02,
node-t3-mountain-04. Same elite targets as before: cave-troll, granite-titan,
cavern-troll, mountain-colossus. Only Conduit in this submatrix.

| Weapon profile | T2 | T3 |
|---|---|---|
| axe | ruinous-axe | cave-cataclysm-axe |
| on-hit | jungle-stinger-rapier | jungle-venomthorn-rapier |
| heavy | quake-hammer | mountain-avalanche-maul |

For each weapon use three increments ABOVE existing definition plating:
T2 +0/+4/+8; T3 +0/+8/+16. Existing Cave plating is1/2; Mountain0. Node
modifiers may further alter actual plating: report ready.initialStats values.
The largest increments reproduce Durability3's problem, and the intermediate
increments locate the equipment counter's limits. All increments start fresh;
never stack a prior treatment on another.

Named HP is fixed at live x2.4 T2 / x4 T3 for ALL weapon/plating combinations,
matching Durability3 HP-trim. Existing DR stays fixed. T2 Cave elite base attack
is x0.75; others x1. Companions stay unchanged. No attack compensation or bypass.
The whole weapon changes, including its speed/damage/passives; keep all other
gear, +5 upgrades, skills, abilities, runes, stance and preparation identical.
This is an equipment comparison, not an attack-stat-only intervention.

4nodes x3weapons x3plating increments =36 cells.

## B: Eagle opening multiplier

T2 Mountain04, eight existing builds: six survey baselines plus the Slinger DoT
and Conduit on-hit alternatives. For each, compare Skyfall Rend multipliers
1.75 (current),1.50,1.25. Stone Eagle ordinary base attack remains75 throughout;
castMs1000, charge timing/speed and every other pattern field stay unchanged.
Actual spawned attack includes existing node modifiers. Thrower attack remains
unchanged. Granite Titan HP is live x3, existing defenses and full attack,
matching the prior pressure reference. No plating experiment is combined here.

8builds x3multipliers =24 cells. The Conduit heavy weapon is not added to this
submatrix: it answers the equipment question separately.

## Execution model and fixed replication

60 cells, five seeds each:173,947,2027,4093,5579 =300 observations.
Existing three seeds preserve comparisons; two additional seeds improve the
pressure screen. Each fresh World runs at most300 simulated seconds, stopping
on first death. Max25 simulated hours; estimated30–45 minutes wall time, not
guaranteed. Normal100ms ticks, normal AI/ecology/repopulation, one sequential
process. Two-minute replicate, four-hour batch and2GiB RSS limits remain.
Wall-limited outcomes are censored tooling evidence, not gameplay deaths.

Synthetic fully prepared legal builds only: normal range/medium frames when
available, matching armor/charm, Mountain boots, Tempered Core, no relic,
existing survey runes/abilities/mastery. No travel/acquisition/economy/network/
client or human-feel certification. Reversible in-process definition overlays
apply to initial spawn and repopulation, restoring stats AND nested Eagle
sequence values between worlds. No Docker, service restart or database writes.

## Frozen identity and checks

- Revision: `ac4595442d93e81f5e3eebc72e5ce4538ff6c94f`
- Tree: `48ccedb44b4c885658f362c9a242e14d9dd73dfc`
- Untreated definitions hash: `40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Qualification: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability4/frozen-qualification`
- Qualification index SHA256: `BBE1A29561C708C4E25098A262D6AAD09808278757A8409AD5B1507F2F2AF45E`

All60 builds qualified, including Mountain weapons and actual elite presence.
Matched initial geometry, fixed HP/attack/DR and intended plating differences
verified. Overlay/restoration test covers nested Eagle multiplier isolation.
Diagnostic typecheck and three30s pilots passed: T2/T3 heavy-high-plating plus
Spirit dive1.25; report generation passed. Sibling pilot directory names the
parent revision because it ran before committing identical runtime code.
Pilots are instrumentation evidence only. Full suite/browser tests not run.

## Operator commands

From shared repo, preserve dirty files and use a new detached source tree:

```powershell
$dur4Revision = 'ac4595442d93e81f5e3eebc72e5ce4538ff6c94f'
$dur4Root = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability4-20260915'
$dur4Checkout = "$dur4Root/source"
$dur4Hitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $dur4Root) { throw 'Output exists: inspect/report, do not overwrite or relaunch.' }
if ((Get-FileHash -LiteralPath $dur4Hitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $dur4Root | Out-Null
git worktree add --detach "$dur4Checkout" $dur4Revision
if ($LASTEXITCODE -ne 0) { throw 'Worktree setup failed' }
pnpm --dir "$dur4Checkout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
git -C "$dur4Checkout" rev-parse HEAD 'HEAD^{tree}'
git -C "$dur4Checkout" status --short
```

Verify revision/tree and clean tracked source, then execute once:

```powershell
pnpm --dir "$dur4Checkout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability4 --mode=run "--revision=$dur4Revision" "--hitboxes=$dur4Hitboxes" "--out=$dur4Root/results"
```

Record exit. Deaths advance to next declared cell. Failure/interruption ends
packet without retry. If index exists, generate tables even for a partial run:

```powershell
node "$dur4Checkout/scripts/ttk-survey-report.mjs" "$dur4Root/results"
```

Completion requires60cells/300runs, trial durability4, five expected seeds,
mode run, matching hashes, no failed.json. Preserve source/artifacts. No Docker
cleanup. No repeat qualification/pilot, source adaptation or extra experiments.

## Required report

Write docs/briefs/bot-balance-durability4-report.md and index in docs/README.md.
Report exact identity/hashes, times/resources, complete/censored/death counts.
Generate analysis first; then use index/ready/raw events for focused questions.

1. Join exact cell ID, experiment, weaponProfile, platingAdd, diveMultiplier and
   seed. Boolean alternate alone cannot distinguish Conduit heavy from on-hit.
   Check geometryRosterHash and actual initialStats; hpTreatment contains
   beforeDive/afterDive for Eagle cells. Normal attack/HP/DR must match within
   each intended comparison. Later pulling/RNG may diverge.
2. For Conduit show named elite TTK for every seed, median of available seed
   medians, kills/censors, HP regain, deaths and sampled incoming pressure.
   Include per-summon-hit damage distributions and fraction at1damage, damage
   intervals, owned-minion contribution and the enemy's actual plating. Compare
   heavy with axe/on-hit at SAME plating and each weapon against its own +0.
   Do not turn an unfinished fight into a zero or success. A300s survival with
   no elite kill is not a successful equipment counter.
3. Determine whether heavy restores repeatable kills at credible durations or
   merely changes a near-stall into another extreme outlier. Show duration-band
   departures and ratios; no new automatic pass threshold. Durability3 peers
   may contextualize +0/high on the original three seeds only; do not claim new
   same-batch six-class comparisons at intermediate plating.
4. For Eagles show survival, minima, largest hit/1s pressure and recovery across
   all five seeds, alongside cast/charge/first-hit chronology and final10s/30s
   damage-source breakdowns at deaths. Separate opening damage from subsequent
   hits when supported; the log lacks a definitive empowered-hit flag, so mark
   ambiguous attribution. The intervention itself isolates the multiplier.
5. Preserve gaps including summon damage, HP-regain/ward effects and natural
   episode merging. No client/pathfinding assertion from a long gap alone.
6. Return decisions: usable equipment counter and reasonable plating range,
   or lower plating pending class-design work; Eagle multiplier candidate or
   insufficient benefit. No penetration, compensation, DoT resistance, ability
   changes, live patches or operator-selected next attempts.
