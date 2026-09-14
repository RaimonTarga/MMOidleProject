# V1l — Spirit bridge after static-hazard escape fix

Prepared2026-09-14 for a user-launched Luna operator. Nothing has been created
or launched during preparation. Astra plans/reviews; the user launches Luna
and brings back the report. No autonomous subagent or downstream dispatch.

## Question and frozen source

Can the unchanged Night2-C Spirit preparation earn its three T2 seals and
reach a recovered T3 Sanctuary now that Avoid Hazards handles static terrain?
Retain **Always→Avoid Hazards and Always→Recover First**. Do not remove the
recovery rule: the user had the actual bug fixed after reproducing it manually,
and this case tests that fix with the previous loadout intact.

Execution revision `6e1f1ee11cb9c8732468b68c97ddffddd2226b41`;
tree `ee98c5efe2c1d9a0d5de5308072346f46e6d3df6`.
The commit adds static damage features and their contact bands to persistent
hazard escape, shares damage-contact eligibility with recovery suppression,
and displays escape intent before recovery. It adds swamp/lava regression
coverage. No balance values or bot route were changed by that commit.

Astra preparation checks: `runeDynamicHazardAvoidance.test.ts` passes. The
existing `botStaticLavaDiagnostic.ts` now returns an escape destination and
moving=true with Recover First enabled (previously destination=null and
moving=false). These are isolated checks, not live traversal success. The
user has not yet human-playtested the fix. Luna must run clean exact-revision
`pnpm bot:preflight` before creation.

## One fixed case

- Route `spirit-travel-t2-bridge-night2`, intended policy, count1, workers1.
- Smoke-isolated, reward25, maxRunMs2700000 (45minutes), retries0,
  fastBossRetry=false. One manifest only; no replicate or automatic retry.
- Record setup start; entire setup/run/report/release ceiling90minutes.
  Launch only with at least55minutes left. This is a new packet with a new
  relative deadline; the old overnight deadlines do not apply.
- First death anywhere aborts before respawn acknowledgement. Missing seals,
  recovery timeout, invalid entry/build, infrastructure or evidence loss stops
  the case. Preserve artifacts and return for review. Do not repair or rerun.

Original input, unchanged:
`C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json`

SHA256 `4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6`.
Prepared T2 Spirit, energy-root/energy-heavy,GM72,no range/no T2 seals.
Never substitute a Night2 death state or merge seals. Synthetic/reward25
provenance and false combat/economy eligibility remain explicit.

The route retains ordinary +4→+5 Ruinous Axe/Cave Vest/Mountain Charm/Plains
Boots acquisition, Tempered Core and no relic. Defensive stance and common
Find Enemies/Step Back/Keep Distance/Avoid Hazards/Recover First rules:

| Leg | Techniques | Guards | RP |
|---|---|---|---:|
| Plains T2 | Sweep, Expose Weakness | Second Wind | 29 |
| Forest T2 | Expose Weakness | Second Wind, Brace | 28 |
| Desert T2 | Expose Weakness | Second Wind, Cleanse | 26 |
| Post-third-seal travel | Sweep | Second Wind, Brace | 28 |

Each boss gets one guardian-inclusive attempt, with full-HP/no-DoT Sanctuary
recovery beforehand. Subsequent legs require prior seals. After natural T3,
the travel build adds While Traveling→Avoid Enemies and Fight Back, recovers
inside cleared Desert dungeon, emits `night2:travel:ready`, then navigates to
T3 Sanctuary. The bot's legacy transit combat remains suppressed; ordinary
Fight Back owns combat response. Leave the earned range point unspent.
At Sanctuary observe20seconds alive/auto and full HP/no incoming DoT,
cap180seconds, before the final assertions/snapshot. No T3 farming or boss
probe is scheduled. Travel contact is observed, not artificially forced.

## Execution and retention

Read CLAUDE.md. Use an isolated clean checkout of the exact execution revision;
preserve unrelated working-tree edits. Preflight dependency repair is setup
only and must be recorded. Verify image revision/tree/digest and copied host
tooling checksums. Check disk and no active conflicting experiment. Before
creation, create one uniquely named empty Docker bridge capacity probe,
inspect it empty and remove only that exact ID. No global prune, volume
deletion, historical resume or unrelated service stop.

```powershell
$v1lRevision = '6e1f1ee11cb9c8732468b68c97ddffddd2226b41'
$spiritSnapshot = Join-Path $env:LOCALAPPDATA 'mmo-idle/experiments/20260913t141015z-striker-t2-progression-squire/runs/003-spirit-t2-progression-intended-r01/artifacts/spirit-t2-progression-intended-2026-09-13T15-11-50-031Z-cec0d48d/snapshot-b.json'
if ((Get-FileHash -LiteralPath $spiritSnapshot -Algorithm SHA256).Hash.ToLower() -ne '4938a6911756ff28d4af9e276b6ec6656608a5e5b9aca0ca1184d8e89f92a8c6') { throw 'Input hash mismatch' }
pnpm experiment:create --revision=$v1lRevision --routes="spirit-travel-t2-bridge-night2" --tierEntrySnapshot="$spiritSnapshot" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=2700000
```

Inspect the sealed manifest for those exact values before launch. Follow
create→launch→status→report, stopping only the exact active ID when necessary.
Verify terminal network-release receipt and exact network absence, retaining
artifacts/volumes/service containers. If automatic release fails, use
`pnpm experiment:release --id=<exact-id>` only after terminal state; no
`experiment:clean`. No code/template edits, balance changes or extra run.

## Report and decision gate

Write/index `docs/briefs/bot-balance-v1l-report.md`; report actual setup/run
clocks, manifest/source/tree/input/image/tooling hashes and terminal release.
Generate filename/hash pairs mechanically. Separate boss-only windows from
guardian/attempt durations; pair named kills with actual seal/tier facts.

For transit report readiness/build convergence, node sequence, ability
activations, kills, deaths, recovery windows and final HP/DoT. Preserve any
available `hazard-escape` records, including feature IDs/kinds and attempt/
result timestamps. Report position/active Rune/contact observations only when
actually available; missing fields are unobserved, not successful escape.
Do not infer lava-specific validation from simply reaching Sanctuary if no
lava contact/escape was observed. Do not claim an exact before/after survival
effect from independent RNG. Environmental death names can still fall back
to Tiny Wisp; the fix does not change killer attribution. Death-window
`killingBlow` may be stale; use authoritative cause/time.

If successful, provide the actual final snapshot path/hash plus T3,
currentSkillTier3,one unspent point,no range,three earned T2 seals,GM/biome
levels/equipment/wallet/node/full HP/no DoT/canonical flag. The legacy file
name and kind do not authorize editing the state. Stop after this case:
Astra must verify the earned checkpoint before preparing separate T3 probes.
If hazard behavior still fails, report it for the user's deeper investigation;
do not keep running or weaken the success criterion.

## User handoff prompt

Run only the prepared V1l packet at
`C:/Users/osaif/Documents/Claude/Projects/MMO idle/docs/briefs/bot-balance-v1l-operator-packet.md`.
You are the Luna operator: use its exact source/input and single-case limits,
write/index the report, preserve evidence and verify terminal network release.
Do not change builds, fix gameplay, retry or start another experiment.
