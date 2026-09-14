# V1m — Earn Wisp before Spirit T3 travel

Prepared 2026-09-14. User-launched Luna only. Nothing created or launched.
Astra prepares/reviews; Luna operates this single case and returns evidence.

## Question and frozen source

Can Spirit reach a recovered T3 Sanctuary when it spends its naturally earned
range point before travel? V1l earned three seals but died to Ash Salamander
ranged damage. Avoid Enemies was already equipped; no lava contact was recorded.
Leaving the earned point unused was avoidable underpreparation.

Execution revision `38116567012374bcaef51f10fba60d27d1ed2d15`;
tree `1ded4d2c0928515e37a3a4ca3a39949a46420fee`.
This contains the static-hazard fix from V1l. The only new treatment is ordinary
unlock of `energy-range-far` (Wisp) after the third seal, before travel setup.
Wisp adds 80 attack range, 12% movement, 3% attack, 3% max HP and 2% attack
speed in authored stat effects. This tests the branch package, not range alone.
The hypothesis is improved standoff/mobility and fewer damaging contacts;
one independent run cannot establish a causal survival effect or reliability.

Astra checks: `pnpm bot:preflight` and `pnpm typecheck` pass. Route regression
checks preserve the old boss/travel steps and failed-seal dependency behavior.
Luna must repeat preflight in the clean exact-revision checkout before creation.

## One fixed case

- Route `spirit-wisp-travel-t2-bridge-v1m`, intended policy, count 1, workers 1.
- Smoke-isolated, reward multiplier 25, maxRunMs 2700000 (45 minutes), retries 0,
  fastBossRetry=false. One manifest, no replication or automatic retry.
- Record setup start. Total setup/run/report/release ceiling 90 minutes;
  launch only with at least 55 minutes remaining.
- First death anywhere stops before respawn acknowledgement. Missing seals,
  failed unlock/build, recovery timeout, invalid input, infrastructure failure
  or evidence loss stops the case. Preserve evidence; do not repair or rerun.

Input, unchanged from V1l:
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json`

SHA256 `4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6`.
Prepared T2 Spirit, energy-root/energy-heavy, GM72, no range, no T2 seals,
zero skill points. Retain synthetic/reward25 provenance and false combat/economy
eligibility. Never substitute a death state or merge seals.

Keep ordinary +4 to +5 upgrades of Ruinous Axe, Cave Vest, Mountain Charm and
Plains Boots, Tempered Core and no relic. Defensive stance, existing Find
Enemies/Step Back/Keep Distance/Avoid Hazards/Recover First rules remain fixed.

| Leg | Techniques | Guards | RP |
|---|---|---|---:|
| Plains T2 | Sweep, Expose Weakness | Second Wind | 29 |
| Forest T2 | Expose Weakness | Second Wind, Brace | 28 |
| Desert T2 | Expose Weakness | Second Wind, Cleanse | 26 |
| Post-third-seal travel | Sweep | Second Wind, Brace | 28 |

Each boss gets one guardian-inclusive attempt after full-HP/no-DoT Sanctuary
recovery. Later legs require prior seals. Natural T3 unlocks the point. The
ordinary unlock step waits for observed `energy-range-far` in unlockedSkills,
then emits `v1m:wisp:applied`. No debug grant, reset or inventory substitution.
Next the unchanged travel build adds While Traveling→Avoid Enemies/Fight Back,
recovers inside the cleared Desert dungeon, emits `night2:travel:ready`, and
navigates to T3 Sanctuary. Legacy bot transit combat stays suppressed; ordinary
Fight Back owns combat response. At Sanctuary observe 20 seconds alive/auto
and full HP/no incoming DoT, recovery cap 180 seconds, before final assertions.
No T3 farm/boss probe or downstream case is authorized.

## Execution and retention

Read CLAUDE.md. Use a clean isolated checkout of the exact execution revision;
preserve unrelated edits. Record setup dependency repair if needed. Verify
source/tree/image digest and copied host tooling hashes. Check disk and active
experiments. Before creation, create one uniquely named empty Docker bridge
capacity probe, inspect it empty, and remove only that exact ID. No global
prune, volume deletion, historical resume or unrelated service stop.

```powershell
$v1mRevision = '38116567012374bcaef51f10fba60d27d1ed2d15'
$spiritSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json'
if ((Get-FileHash -LiteralPath $spiritSnapshot -Algorithm SHA256).Hash.ToLower() -ne '4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6') { throw 'Input hash mismatch' }
pnpm experiment:create --revision=$v1mRevision --routes="spirit-wisp-travel-t2-bridge-v1m" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=2700000
```

Inspect sealed manifest values before launch, including retry settings. Follow
create→launch→status→report, stopping only the exact active ID if necessary.
Verify terminal network-release receipt and exact network absence; retain
artifacts, volumes and service containers. If automatic release fails, use
`pnpm experiment:release --id=<exact-id>` only after terminal state. No
`experiment:clean`, source/template edits, balance changes or extra runs.

## Report and decision gate

Write/index `docs/briefs/bot-balance-v1m-report.md`. Include actual clocks,
manifest/source/tree/input/image/tooling hashes and terminal release. Generate
artifact filename/hash pairs mechanically. Pair boss kills with earned seals;
separate boss-only combat from guardian/attempt durations.

Record Wisp skill build-change, milestone, selectedRange/unlockedSkills/points,
actual stats when available, 28RP travel build convergence and recovery readiness.
A failure before the Wisp marker is not evidence about Wisp travel. Report node
sequence, damage sources, abilities, kills, deaths, recovery and final HP/DoT.
Use authoritative cause/time; death-window killingBlow can be stale. Preserve
available hazard-escape/contact records with feature IDs and timestamps. Missing
position, contact or movement fields remain unobserved. No lava contact means
no live lava-fix verdict, even on a successful arrival.

Success requires actual T3/currentSkillTier3, three earned T2 seals,
selectedRange=`energy-range-far`, unlocked Wisp, zero unspent points, and a
recovered T3 Sanctuary tail. Preserve the exact final snapshot path/hash,
GM/biome levels, gear/wallet/node/HP/DoT and canonical flag.

The current strict T3 importer only accepts an unbranched checkpoint with one
unspent point. A successful V1m branched snapshot is therefore NOT yet qualified
for reuse by that importer. Preserve it unchanged; Astra must separately qualify
branched import before future probes. Do not edit, refund or relabel the snapshot
to pass validation. This packet prioritizes legitimate preparation over keeping
the old importer convenient. Stop after reporting for review.

## User handoff prompt

Run only the prepared V1m packet at
`C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1m-operator-packet.md`.
You are the Luna operator: use its exact source/input and single-case limits,
write/index the report, preserve evidence and verify terminal network release.
Do not change builds, fix gameplay, retry or start another experiment.
