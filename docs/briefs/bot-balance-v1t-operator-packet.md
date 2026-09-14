# V1t — Volcano dungeon and boss validation

Prepared 2026-09-14; **not launched**. User launches Luna. Read CLAUDE.md.
Two independent runs on one worker, one ordinary boss attempt per run, first-death
stop, no adaptive retries, edits or extra experiments.

## Assessment and next question

V1s established a viable sampled farming package: pursuit completed 3/3 five-minute
windows and 3/3 recovered returns, with 33/36/31 kills and five to six observed
concurrent attackers. Control died in all three replicas after 189.818, 9.032 and
30.960 seconds of target exposure. The manifest hash and all six identical initial
restore states were checked against disk; terminal network release was verified.

Accept pursuit as the current Wisp farming baseline and advance validation. This
does not isolate Hamstring from boots, validate every class or settle balance.
Do not spend this packet on additional farming repetitions or treatment ablation.
Defer control fragility, Salamander damage spikes, pack pressure and Heat/cooling
questions to later balance work. No further nerf is supported as a prerequisite
for the present viability goal. See the updated campaign state.

Next question: can the same legally prepared character clear the Volcano dungeon
guardians and defeat its T3 boss using ordinary player tools?

## Frozen execution and input

- Revision `d3fb1eb4767c305ac3b6875e96fc7c36aacb70f7`.
- Tree `f8b0a581eb98e176d875aba89bd03a0ad4687469`.
- Route `spirit-volcano-boss-t3-v1t`, version 1.0.0; two replicas, one worker.
- Mode `smoke-isolated`, reward 1x, fast boss retry false, automatic retries zero.
- Maximum run 1,200,000 ms (20 minutes); dungeon-attempt step maximum 720,000 ms
  including guardians, altar and boss. The global limit takes precedence.
- Whole session 60 minutes including setup. Launch with at least 50 minutes left.

Use the **first chronological V1s pursuit prepared checkpoint**, captured before
its farming outcome and extra loot. Do not select a returned checkpoint or a
later replica. This reuses paid preparation without making the purchases twice.

```powershell
$v1tRevision = 'd3fb1eb4767c305ac3b6875e96fc7c36aacb70f7'
$v1tInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t122828z-spirit-volcano-control-t3-v1s/runs/002-spirit-volcano-pursuit-t3-v1s-intended-r01/artifacts/spirit-volcano-pursuit-t3-v1s-intended-2026-09-14T12-36-05-203Z-633b2496/checkpoint-v1s-pursuit-prepared.json'
Get-FileHash -Algorithm SHA256 -LiteralPath $v1tInput
```

Expected file SHA256 `db973d37bd7371212665e03d06adbb7e977fb9fa964acbd347ee49aa0944ec79`.
Boundary `v1s-pursuit-prepared`; source revision `b0e6619141cc6fd5fef230219308e1b35250ec92`.
Persistent hash `b001138205903a9cfe785eeaa9d60dec5e593ba7267acf3c96aeb7ed3a2c704c`.
Current-definition compatibility is explicit; expect no changed definition sections
and definitions hash `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
Fail closed on mismatches. Preserve all synthetic tier-entry/25x ancestral taints.
This is safe/rested diagnostic reuse, not canonical economy or combat replay.

## Build and source-informed rationale

Wisp/Far, GM78, Ruinous Axe +5, Cave Vest +5, Mountain Charm +5, Desert Boots +5,
Tempered Core, Defensive stance. Combat: Sweep, Hamstring, Second Wind, Brace;
31 RP. Rules: Find Enemies, Step Back, Keep Distance, Avoid Hazards, Recover First,
in the unchanged V1s order/conditions. Travel uses the familiar 28-RP build with
Avoid Enemies and Fight Back. No new equipment, abilities or skills are granted.

The current generated dungeon has **three guardian groups**, each one Magma
Tortoise definition (`magma-brute`, named Ember Warden) plus three Scuttlers:
12 guardians total. Guardian modifiers include attack x1.25, attack speed x1.1
and DoT x1.25; success against ordinary overworld packs does not prove this gate.
Sweep and the validated movement package are retained for these packs.

Boss: Cinder-Shell Magma-Salamander, 11,462 HP, attack 179, plating 8, DR 4%,
base attack interval 3s. These are raw authored stats, not final hit predictions.
Shell starts at 85% HP, lasts 3.8s, repeats on a 16s clock and reduces direct
damage to 30%. It creates an eight-second, radius-190 magma vent with damage,
Heat acceleration and a pull. Avoid Hazards and movement address that space denial;
Cleanse cannot remove Heat. Attack rises x1.15 at 50% HP. Below 25%, Final Eruption
casts for eight seconds then threatens a radius-2000 impact with raw damage 650.
Do not assume Step Back's late telegraph response can escape that radius or that
this build can burst the final quarter in time; record what actually happens.

This is the first dungeon screen at the proven **GM78 entry kit**, not a claim
of globally optimal/end-T3 preparation. T3 item upgrades begin at GM80; this input
cannot legally receive them. A boss failure may justify later mastery/gear or
encounter-specific strategy preparation before any balance conclusion. Retain the
earned Wisp path; no range reset or synthetic specialization.

## Route and outcomes

Restore at Sanctuary center, assert paid boots/Hamstring and absent `volcanic:3`
clear, validate build, capture `v1t-boss-ready`. Travel normally to
`node-t3-volcanic-dungeon` (180s cap), record arrival, configure combat and start
one `attemptBoss`. The existing executor clears guardians, walks to the altar,
activates it normally and fights. No guardian suppression, debug heal, Heat reset,
forced boss spawn or manual movement. Its internal recovery behavior remains ordinary.

On victory, require the `volcanic:3` progression marker, record `boss-defeated`,
return to Sanctuary (180s), walk to center (45s), recover (60s cap, ten-second
observation), capture `v1t-volcano-cleared-returned` and assert full HP/no DoT.
Any first death ends the run, including travel or guardians. A bounded gameplay
failure continues to the second fresh replica; setup/restore/build/infrastructure
failure stops the packet. Two replicas are planned independent cases, not retries.

## Preparation already checked

Bot and diagnostics TypeScript checks, shared build, and setup-only actual-input
restore passed. `server/scripts/v1tPreflight.ts` verifies persistent fidelity,
definition equality, existing paid gear, legal 31/28-RP builds, target dungeon,
absent prior boss clear, one attempt and no purchase/unlock prefix. Zero combat ticks.
Final artifact:
`C:/Users/osaif/AppData/Local/mmo-idle/validation/v1t-preflight-server-parity-20260914.json`.
Earlier local probes lacked development-item registry initialization and therefore
had a differing item digest; the final preflight mirrors server startup registration
without granting those items. No gameplay or checkpoint safety validation was weakened.
No V1t live run or full repository suite has been executed.

## Luna commands and limits

Check clocks, at least 6 GB free disk, no other experiment worker, and preserve
unrelated work/services. Preparation observed about 11 GB free; recheck at launch.
Do not globally prune Docker if capacity fails. From project root:

```powershell
pnpm experiment:create --revision=$v1tRevision --routes=spirit-volcano-boss-t3-v1t --tierEntrySnapshot=$v1tInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=2 --policies=intended --maxRunMs=1200000
```

Inspect manifest revision/tree, sealed hash, two fresh cases, worker/reward/cap
and retry settings. Record immutable image metadata. Then:

```powershell
pnpm experiment:launch --id=<returned-id>
pnpm experiment:status --id=<returned-id>
pnpm experiment:report --id=<returned-id>
# After supervisor and all runs are terminal:
pnpm experiment:release --id=<returned-id>
```

Use `experiment:stop` at session deadline or infrastructure/setup failure, then
report/release once terminal. Retain artifacts, volumes and checkpoints. Automatic
network release / `already-released` is expected. No new packet, retries, Tundra,
T4, farming rerun, balance changes or operator fixes.

## Report and next decision

Write/index `docs/briefs/bot-balance-v1t-report.md`. Verify identical common restore,
source/input/receipt hashes, inherited provenance and zero new purchase debits.
Report approach, guardian start/end/count/reformation, altar activation, boss
combat and return separately. A `boss-attempt` starts before guardian clearance;
it alone is not proof the boss was reached. Record named boss kill, victorious
attempt and progression marker together; recovered return is a separate gate.

On failure: identify travel/guardian/boss phase; actual boss HP reached if observed;
incoming sources and death trace; shell/vent/Final Eruption timing when available;
Rune/ability activation and movement evidence. Keep full-route aggregate damage
separate from the encounter. Mark unavailable telemetry; a class `heatPct` field
does not measure environmental Volcano Heat. Do not fabricate cooling or per-hit
effect evidence.

One verified boss victory answers the initial beatability question for this build
and state; two give replication. A failure before boss spawn leaves boss viability
unmeasured. A low-HP boss failure calls for phase/strategy review; it does not undo
V1s's farming validation. A guardian wall calls for guardian preparation/ecology
review, not an automatic boss nerf. If unclear, return the case to Astra/user for
strategy advice before repeating it. No automatic balance decision.

Handoff: “Operate bot-balance-v1t-operator-packet.md exactly. Restore the paid V1s
prepared checkpoint for two independent Volcano dungeon attempts, one per run,
record guardian and boss outcomes separately, verify any kill/progression and
safe return, write/index the report, release resources and stop.”
