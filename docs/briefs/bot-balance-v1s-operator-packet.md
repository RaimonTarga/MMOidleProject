# V1s — Repeat sustained natural Volcano farming

Prepared 2026-09-14; **not launched**. User launches Luna. Read CLAUDE.md.
This packet is the next operation after V1r. Six fresh runs, sequentially on
one worker, no retry/resume, no adaptive edits and no balance changes.

## Question and comparison

V1r control and pursuit survived the one-minute target observation with kills
and completed a recovered Sanctuary return. Focus died at 57.825 seconds.
Those successes warrant testing sustained exposure and repeatability before
another nerf. V1s keeps the successful kits intact and extends the target
observation to **five minutes**, three independent replicas per kit.

| Route | Replicas | Combat RP | Kit |
|---|---:|---:|---|
| `spirit-volcano-control-t3-v1s` | 3 | 27 | V1r control, Plains Boots +5 |
| `spirit-volcano-pursuit-t3-v1s` | 3 | 31 | V1r pursuit, Hamstring and Desert Boots +5 |

Both retain Wisp/Far, Ruinous Axe +5, Cave Vest +5, Mountain Charm +5,
Tempered Core, Defensive stance, Sweep, Second Wind and Brace. Combat Runes,
their order and travel configuration match V1r exactly. Pursuit does not gain
Focus Lowest HP. Its normal purchases still cost 70 green, 432 yellow and
1 Dominion catalyst. Control makes no purchase. Pursuit is a package screen,
not an isolation of slow versus footwear; separate those only after sustained
viability is established. Do not rerun Focus in this packet.

Natural population, recruitment, lava, repopulation and ordinary recovery remain
active. Repeated pulls may occur but a particular pack size or chain-pull pattern
is not forced. Fresh worlds are not matched seeds; differences are descriptive,
not clean causal build rankings. Three replicas are a small robustness screen,
not a population survival-rate estimate.

## Frozen source and common checkpoint

- Revision: `b0e6619141cc6fd5fef230219308e1b35250ec92`.
- Tree: `8a25b84d2eb55cff0fe23272d51c7d1bdf9ac406`.
- V1s source delta: new derived routes and registry only. V1r stays unchanged.
- Mode `smoke-isolated`, rewards 1x, one worker, three replicas per route.
- Bot ceiling 900,000 ms per run (15 minutes), no fast retry or automatic retries.
- Whole packet ceiling **120 real minutes**, including image creation. Launch
  only with at least 105 minutes remaining; otherwise report setup incomplete.
  Based on V1r transit times, roughly 50–65 minutes of execution is plausible,
  not a promise. Early deaths shorten the session.

Use the original shared pre-Volcano checkpoint for **every** run. Do not use
the successful V1r returned states, which contain extra loot and history.

```powershell
$v1sRevision = 'b0e6619141cc6fd5fef230219308e1b35250ec92'
$v1sInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t112129z-checkpoint-pre-volcano-capture/runs/001-checkpoint-pre-volcano-capture-intended-r01/artifacts/checkpoint-pre-volcano-capture-intended-2026-09-14T11-23-17-505Z-78b380cf/checkpoint-pre-volcano-rested.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1sInput
```

Required SHA256: `015a40785122af6b2a684827e344f0d2465d1b4462d6866801fbc4d9dad5cf55`.
Checkpoint source revision: `e4ee4cb9b5ad800320fd61b30975c5a06c2dafc4`.
Persistent state hash: `d200fe6ebc012dd2dbef909350917c6370a43dd75e224865d8223cfb31bd4552`.
Expect identical authoritative pre-treatment persistent state and no changed
definition sections. Explicit current-revision compatibility is authored.
Stop on unexpected input, definitions, restoration or build mismatch.

These remain restored diagnostic runs with synthetic tier-entry and inherited
25x ancestry. Rewards 1x do not remove those taints or make skipped preparation
free. No canonical progression, economy or uninterrupted-run claim.

## Authored execution

The routes reuse V1r preparation, travel and recovery. Only route/checkpoint
names and the measured farm duration/ceiling change:

1. Restore independently, record `checkpoint-restore.json` before treatments.
   Complete ordinary paid preparation and save `v1s-<arm>-prepared`.
2. Travel with the common 28-RP travel build from Sanctuary to exact
   `node-t3-volcanic-01`, up to 180 seconds. Pursuit's boots also affect travel.
3. Record target arrival, configure combat, then `measurement-start`. No heal,
   resource precharge or Heat reset on arrival.
4. Observe **300 seconds of alive auto-enabled farming**, maximum 330 seconds
   for that step. Its finish predicate does not wait for full HP in Volcano.
   First death ends the run. No reset between packs or minutes.
5. If alive, record `measurement-end`, configure common travel rules, record
   `return-start`, and return (180-second ceiling). Walk to Sanctuary center
   (45-second ceiling), recover with a ten-second observation (60-second cap),
   save `v1s-<arm>-returned`, and assert full HP/no incoming DoT.

Every replica starts fresh from the same original file. A gameplay death or
ordinary bounded gameplay stall is evidence and moves to the next scheduled
independent case, not a retry. Stop the packet on setup, build, restore or
infrastructure failure. No manual movement, free gear, debug recovery, extra
cohort, source patch or T4 experiment. Keep completed and partial artifacts.

## Preparation checks

Passed before freezing: bot TypeScript check, diff whitespace check, actual
route-registry assertions for two routes, unchanged V1r builds, declared
checkpoint entry, first-death stop, five-minute window/330-second cap, and
preservation of V1r's one-minute routes. Original input hash reverified.
V1r already exercised these same purchases through the real server and recorded
27/31-RP legality. No V1s combat was executed and no full-suite pass is claimed.

## Operator commands and resources

Check clocks, free disk (at least 6 GB), no other experiment worker and preserved
development services. If capacity is unavailable, report blocked; never globally
prune Docker or silently increase concurrency. From project root:

```powershell
pnpm experiment:create --revision=$v1sRevision '--routes=spirit-volcano-control-t3-v1s,spirit-volcano-pursuit-t3-v1s' --tierEntrySnapshot=$v1sInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=3 --policies=intended --maxRunMs=900000
```

Record the ID; inspect manifest and sealed input for the frozen revision/tree,
two route IDs, three replicas each (six total), one worker, 1x rewards, no fast
retry and zero automatic retries. Use the manifest's scheduled order; do not
pick winners or reorder after seeing results. Then:

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# After supervisor and all runs are terminal:
pnpm experiment:release --id=<returned-id>
```

Monitor within the packet ceiling. Use `experiment:stop` on deadline or a
setup/infrastructure error; retain partial results. Report/release once terminal.
Automatic release and `already-released` are expected. Retain volumes and all
evidence. Do not delete earlier checkpoints or experiment data.

## Report and decisions

Write/index `docs/briefs/bot-balance-v1s-report.md`. Verify source/input/receipt
hashes, independent databases, identical pre-treatment state, paid preparation,
no changed definition sections and inherited provenance for all six runs.
Separate setup, approach, arrival configuration, target window, return and recovery.

For each replica, report:

- Whether it reached the target, survived the five-minute observation with
  kills, and separately returned/recovered; phase-specific deaths or stalls.
- Kills by species per minute (0–60, 60–120, 120–180, 180–240, 240–300 seconds)
  relative to `measurement-start`; alive exposure in partial bins. Keep any
  observation-boundary overhead outside those fixed bins. Do not credit return kills.
- First-kill time, longest observed no-kill interval, HP/barrier trajectory,
  concurrent attackers, natural population samples and ability activations.
  Five minutes alive but idle is not successful farming.
- Incoming species damage and lethal trace when available, labeling full-route
  aggregates separately. Record actual pack context; node population is not pack size.

Use existing events, deaths, summaries and snapshots. V1r had no per-hit normal
attack stream, detailed slow effects, or in-combat environmental Heat time series.
Do not invent these or treat a class-resource `heatPct` as Volcano Heat evidence.
Cooling-rate and mechanic-attribution conclusions remain pending telemetry or
a focused diagnostic; this packet tests sustained farming behavior.

Aggregate target survival and recovered returns as counts out of three for each
arm; show every failure. A kit with three farming-and-return successes provides
repeatable sampled viability. Two successes still leave meaningful fragility;
one is not evidence of robust farming. These are screening decisions, not a
global balance verdict. Report five-minute versus initial-minute survival to
distinguish early pressure from longer-exposure failures.

If sustained successes reproduce, the next decision is broader Volcano ecology
and boss validation, with optional slow/footwear separation if needed. If failures
cluster under a reproducible enemy/pack pattern, return that evidence for focused
counterplay or tuning review. No automatic nerf or winner follows this packet.
T3/T4 low-TTK flags and provisional T4 fodder tuning remain open; do not reopen
T1/T2 or launch additional tiers here.

Handoff: “Operate bot-balance-v1s-operator-packet.md at its frozen revision.
Run three independent control and three pursuit checkpoint continuations,
sequentially, with five-minute Volcano observations. Report per-minute combat,
survival and recovered returns, verify provenance and release resources, then
stop. No retries, edits, balance changes or extra experiments.”
