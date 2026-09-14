# V1z - T4 Jungle/Desert farming and +2 preparation

Prepared 2026-09-14. **Not launched; user launches Luna.** Read CLAUDE.md.
One character, one worker, sequential Jungle then Desert. No boss attempts,
balance changes, skill unlocks, adaptive retries or automatic follow-on session.

## Assessment and decision

V1y passed51/51 steps in604224ms (10m04s): ordinary Voidwalker unlock, T4 entry,
Mountain24 and GM124, +1 defenses, five-minute observation and rested return.
Mountain had74 kills across the run and no recorded damage taken. The observation
window sampled single attackers, not sustained multi-enemy pressure. Per-target
TTK and discharge/early-execute events were unavailable; do not infer mechanic
coverage. The lowest sampled HP occurred during equipment preparation, not a
confirmed combat low. Generic healed/HP-loss aggregates include setup effects.

Next broaden T4 farming to nearby Jungle and Desert, keeping the proven tempo
weapon/core and +1 defenses. Jungle tests groups/ambushes; Desert tests control
and ranged pressure. Reach their actual current mastery caps18, observe each for
five minutes, return safely, then buy+2 defenses. Shared rules give GM124 ->130
(Jungle12->18) ->132 (Desert16->18). Do not assume every T4 biome caps at24.
GM130 still permits only+1; GM132 permits+2. No upgrade wait before the second leg.

Swamp T3 remains open for later human playtest. Six T3 bosses have diagnostic
wins. No claim of complete T3 or T4 balance, or canonical combat/economy evidence.

## Frozen source and input

Revision `146ad0ced0d521e7313005578ab45e7b4ff1c461`.
Tree `d08c19defc84e387b87fa1d8b90deedd3cf08914`.
Route `voidwalker-jungle-desert-t4-v1z`, version1.0.0.

```powershell
$v1zRevision = '146ad0ced0d521e7313005578ab45e7b4ff1c461'
$v1zInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t183213z-voidwalker-mountain-entry-t4-v/runs/001-voidwalker-mountain-entry-t4-v1y-intended-r01/artifacts/voidwalker-mountain-entry-t4-v1y-intended-2026-09-14T18-36-16-711Z-4f3c4531/checkpoint-v1y-mountain-qualified-returned.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1zInput
```

SHA256 `f15a9997537cfabef079ab66f30ac51637ad08fe95a410f89b31f8ee37a2bf83`.
Boundary `v1y-mountain-qualified-returned`; state hash
`1b75a7961da6a1a27caef4808cb26dffc46731e405a537b8aaa95595df5b615d`.
Input revision `7bf4dd35bbdd8dfbf2062b775c239f295173f77d`.
Explicit-current-revision restore; unchanged definitions hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
Retain restored/synthetic/noncanonical ancestry and all eligibility flags.
No input editing, currency floors, invented mastery or checkpoint substitution.

## Routes, builds and purchases

Input T4, GM124, Mountain24/Jungle12/Desert16, Voidwalker energy-heavy-t3-a,
ranged Wisp energy-range-far, currentSkillTier4 and zero unspent points.
Cinderlash T3+5, Titan's Keep T4+1, Fortress Heart T4+1, Desert Boots T2+5,
Accelerant. Keep all gear/skills unchanged throughout both farming legs.

| Leg | Explicit path from T4 Sanctuary | Target modifier | Farming build |
|---|---|---|---|
| Jungle | node-t4-sanctuary -> node-t4-jungle-05 | alacrity | Offensive; Frenzy, Sweep, Hamstring; Second Wind, Cleanse (35RP) |
| Desert | node-t4-sanctuary -> node-t4-mountain-05 -> node-t4-desert-05 | dominion | Offensive; Frenzy, Hamstring; Second Wind, Brace, Cleanse, Break Free (37RP) |

Jungle uses the previously authored V1w Jungle repertoire: Sweep supports groups,
Hamstring spacing, Frenzy attack tempo, Cleanse for relevant afflictions. Brace
and Break Free are absent in this fixed candidate; do not silently substitute.
Desert retains the V1v control/defensive repertoire. Travel uses Defensive38RP:
Sweep, Hamstring; Second Wind, Brace, Cleanse, Break Free. Existing Keep Distance,
Step Back, Avoid Hazards, recovery and travel Avoid Enemies/Fight Back rules stay.
No ordinary Volcano/Tundra/Trench/Graveyard travel is required.

Each leg farms to mastery18 (30-minute cap, five-minute no-progress stall), then
runs a separate five-minute alive/auto-enabled observation using elapsedMs0 and
observeForMs300000. This works at the mastery cap. The observation is not required
to be fully healed during combat. Return exact reverse path, move to Sanctuary
center and recover normally before capture. If transit earns a gate, record that
honestly; the separate observation must still execute.

After BOTH recovered returns and GM>=132, buy exactly+2 on mountain-vest-t4 and
mountain-charm-t4. Costs331+143=474 blue,83+19=102 red, no catalysts. Input wallet
blue14971/red2064 covers this before any new rewards. No farming for purchases,
opportunistic higher upgrade, replacement weapon/core or equipment evolution.
Recover again and capture. +2 is purchase/setup evidence only: both combat screens
used+1, and no post-upgrade farming is planned here.

## Capture sequence

- `v1z-two-biome-ready`: unchanged +1 kit, T4 Sanctuary.
- `v1z-jungle-qualified-returned`: Jungle18, five-minute window completed, recovered.
- `v1z-desert-qualified-returned`: both caps18, both windows completed, recovered.
- `v1z-plus2-prepared-returned`: +2 armor/charm, GM>=132, recovered at T4 Sanctuary.

Files use `checkpoint-<boundary>.json`. Verify full HP, no incoming DoT, alive,
stationary normal capture. Check barrier separately; do not infer its minimum.
On first death or failure stop the case, preserve earlier captures and report.
No automatic continuation from an intermediate checkpoint or independent second
case. A failed Jungle leg leaves Desert untested; a return failure leaves the
handoff incomplete even if a farming window succeeded.

## Execution and resource bounds

One fresh case, one worker, intended policy, smoke-isolated1x, no fast retry or
automatic retry. maxRun90 minutes; session ceiling120 minutes including setup;
require100 minutes remaining to launch. These are ceilings, not predicted runtime.
Each observation cap7 minutes; travel cap3 minutes per hop. Global deadline wins.

```powershell
pnpm experiment:create --revision=$v1zRevision '--routes=voidwalker-jungle-desert-t4-v1z' --tierEntrySnapshot=$v1zInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=5400000
```

Quote the complete routes argument. Verify sealed manifest source/tree/input,
one case, worker/reward/caps/no retries and record image ID/hash before launch.
Preserve unrelated worktree changes; image must use the frozen revision.

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# After supervisor and all runs are terminal:
pnpm experiment:release --id=<returned-id>
```

At deadline use experiment:stop, then report/release once terminal. Infrastructure,
restore, purchase or gameplay failure ends the packet. No operator code fixes,
balance edits, extra agents or follow-on experiments.
Before launch/after release record timestamp, docker ps/stats, free disk and
Windows Docker/vmmemWSL working sets separately, using V1y packet's resource
procedure (and V1x's command block). V1y worker max193.1MiB and WSL1226->3028MiB
were different scopes; workers/services stopped and network released. No leak
conclusion. Preserve normal services, stopped volumes and artifacts; verify this
experiment's terminal resources/network released. Already-released is normal.
No global prune, Docker restart, RAM changes or arbitrary6GB approval gate.

## Reporting and next decision

Write/index `docs/briefs/bot-balance-v1z-report.md`. Check source/input hashes,
unchanged definitions and normal receipts; include exact capture paths/SHA/state
hashes. Separate inherited and newly earned mastery, preparation, approach,
mastery farming, each observation, return and recovery. No overlapping totals.
For each observation report actual alive/auto-enabled duration, target kills by
monster/modifier, attacker concurrency, direct/DoT damage, HP and available
barrier samples, abilities and movement. Distinguish whole-run/biome totals from
window totals. No kills/sparse encounters means survival-only, not sustained
farming proof. Do not silently extend or add a run.

Mark missing engagement starts, TTK or discharge telemetry explicitly. If first
and last damage timestamps support a duration, label its exact definition;
kill counts divided by time are throughput, not per-enemy TTK. Separate setup HP
changes from encounter damage. Avoid generic telegraph-to-mechanic inferences.
Report late-tier low-eHP/low-TTK concerns as unresolved when telemetry is missing.

If both pass, we have Mountain/Jungle/Desert farming candidates and a prepared+2
checkpoint. Next inspect a first T4 boss candidate and the remaining farming
biomes (Tundra, Volcano, Graveyard, Trench), choosing preparation from that
checkpoint. No requirement to grind every biome to cap before any boss screen;
judge readiness from evidence. Failures get controller/build versus encounter
review and human advice if counterplay is unclear. Swamp T3 remains open.
Broad mobs -> items -> classes balance, then canonical1x economy remain later.

## Qualification

`server/scripts/v1zPreflight.ts` verified actual V1y file SHA, authoritative
persistent restore/definitions, Voidwalker/range, GM124 and starting mastery,
all builds, both forward/reverse paths, actual group caps18 and GM130/132
upgrade gates. Hypothetical future mastery only; ordinary +2 handlers use the
real wallet, no currency grants or playable model checkpoint. Zero ticks.
Artifact: `C:/Users/osaif/AppData/Local/mmo-idle/validation/v1z-preflight-20260914.json`.
Bot/diagnostics TypeScript, actual-input preflight and observation/transit
regressions passed; diff check clean. Full suite and live V1z not run.

Handoff: "Operate docs/briefs/bot-balance-v1z-operator-packet.md exactly: Jungle
then Desert mastery18 and five-minute windows with recovered returns, buy the
qualified+2 defenses, capture, report, release and stop."
