# Validation exit — qualified Volcano diagnostic and remaining T4 coverage

Prepared 2026-09-15. **Not launched. User launches Luna; no subagents.** This
is the frozen operator packet produced from the validation-exit plan. It covers
one bounded Volcano control diagnostic and one six-case T4 boss breadth screen.
It does not authorize source edits, balance changes, adaptive tactics, retries,
or follow-on experiments. The two stages use different declared inputs and
must remain separate.

## Operating boundary

Run Stage 1 first when investigating the Night3 Volcano control gap. Stage 2 is
an independent coverage screen and does not consume Stage 1 progress. Each
Stage 2 route restores the same declared Night3 Mountain return; no mastery,
seals, gear, wallet or checkpoint may be pooled between cases. A gameplay
failure ends only that predeclared case. An invalid restore, build, purchase,
definition, source or infrastructure result stops the affected experiment
before any repair or relaunch.

The current decision is diagnostic, not a balance verdict. Night3's Volcano
control had a 572051 ms idle-classified interval with full sampled HP, zero
attackers and monsters present after a successful lava escape. The last target
kill was at 423068 ms, the escape at 420067 ms, and measurement ended at
995264 ms. This supports a productive-activity gap; it does not establish a
hazard bug or a relic-DPS comparison. The diagnostic must explain or contain
that gap before any control-versus-relic throughput interpretation.

## Frozen source and qualified inputs

The packet source is the committed technical preparation below. The setup
qualification is zero-tick and does not create playable state.

| Item | Exact value |
|---|---|
| Source revision | `862448b6d8a6f298ead258447a0c5fa5aaeb9584` |
| Source tree | `33d2de038abb79950cd292e659b555ed5c7160f4` |
| Definition hash | `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4` |
| Setup preflight | `C:/Users/osaif/AppData/Local/mmo-idle/validation/t4-validation-exit-preflight-20260915-r2.json` |
| Setup preflight SHA256 | `E39D7D1B8645BFA41251B383737B39AE8EB7E548EA33555ADAA24F27754A8A60` |
| Route versions | `1.0.0` |
| Runtime mode | `smoke-isolated`, reward multiplier `1`, intended policy |
| Concurrency | one worker, one replica per declared route |
| Retries | `automaticRetries=0`, `fastBossRetry=false` |

The exact current source revision is recorded at experiment creation from the
committed archive. `dirtyWorkingTreeIncluded=false` is required. Do not launch
if the created manifest does not show the values above. Do not add
`--requireTierEntrySnapshot=true`: these are explicit named progression
continuations using non-canonical diagnostic captures, and the route contract
plus exact file hash is the intended restore guard.

### Stage 1 input — original empty-relic control

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t210709z-voidwalker-jungle-desert-t4-v1/runs/001-voidwalker-jungle-desert-t4-v1z-intended-r01/artifacts/voidwalker-jungle-desert-t4-v1z-intended-2026-09-14T21-09-00-375Z-253ef36e/checkpoint-v1z-plus2-prepared-returned.json
```

SHA256 `e6b357f51cadb344307e56aa7d43eb247b8755bf5284ba91e9342711942ae844`.
Boundary `v1z-plus2-prepared-returned`; state hash
`32ec146718e8e4635d624639155b560dc9a2bd93712e50012c6750ef023a8afb`.
The capture is T4, GM132, rested at T4 Sanctuary, has the fixed +2 Mountain
vest/charm preparation, and retains no `mountain:4` seal. Its capture source
revision is `146ad0ced0d521e7313005578ab45e7b4ff1c461`.

### Stage 2 input — first Night3 Mountain control return

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t221002z-night3-mountain-control-r1-nig/runs/001-night3-mountain-control-r1-intended-r01/artifacts/night3-mountain-control-r1-intended-2026-09-14T22-12-28-393Z-15aeb7e3/checkpoint-night3-mountain-control-r1-returned.json
```

SHA256 `866db03766d0e7cd4ceeeea48506bd9c11c2a9eaf0f72037e49a0cc20c052f98`.
Boundary `night3-mountain-control-r1-returned`; state hash
`c17fccd4238740778cc6b78c5561c6edc2b4771e17b298783cb1786eb39e8bff`.
The capture is T4, GM132, rested at T4 Sanctuary, has the fixed +2 Mountain
vest/charm preparation and the authoritative `mountain:4` seal. Its capture
source revision is the historical Night3 revision
`f6e94e3ebae10d07f1b600cce3f84046600120a1`.

Both files have definition hash
`92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`, reward
multiplier `1`, and explicit-current-revision restore is required. Both carry
`RESTORED_PROGRESSION_CHECKPOINT`, `SYNTHETIC_TIER_ENTRY` and
`NON_CANONICAL_REWARD_MULTIPLIER` ancestry. They are non-canonical evidence,
not from-zero economy samples; never edit them or treat a returned output as a
new canonical input without a separately qualified decision.

## Stage 1 — bounded Volcano control diagnostic

### Fixed route and treatment

| Field | Frozen value |
|---|---|
| Route ID | `t4-exit-volcanic-control-diagnostic` |
| Treatment | Empty relic control; no purchase and no relic comparison |
| Fixed path out | `node-t4-sanctuary -> node-t4-trench-05 -> node-t4-graveyard-03 -> node-t4-volcanic-05` |
| Fixed path back | Exact reverse of the outbound path |
| Travel build | V1V Defensive, `38RP`: Sweep/Hamstring; Second Wind, Brace, Cleanse, Break Free |
| Measurement build | V1W Jungle, `35RP`: Frenzy/Sweep/Hamstring; Second Wind, Cleanse |
| Observation | `600000 ms` (10 minutes) alive/auto-enabled farm window at `node-t4-volcanic-05` |
| Route step/stall bound | `720000 ms` per bounded farm step/watchdog |
| Completion | Rested return capture at `t4-exit-volcanic-diagnostic-returned` |

The input's Cinderlash T3+5, Titan's Keep T4+2, Fortress Heart T4+2, Desert
Boots T2+5, Accelerant, Voidwalker and ranged Wisp are inherited unchanged.
The route performs normal rest, captures a ready boundary, follows only the
fixed path, observes the exact bounded window, returns by reverse path and
rests before the returned capture. No mastery quota, kill quota, gear upgrade,
relic craft, manual combat or adaptive substitution is allowed.

### Activity qualification

The new bounded telemetry is schema version `6` and emits `activity-diagnostic`
records only for an alive, auto-enabled farm state with no attackers and no
`attackTargetId`. It records a `start` after `60000 ms` of continuous
idle-classified time, sparse samples every `30000 ms`, and one `end` record;
the recorder retains at most `12` records per window. The event captures:

- activity reason and structured auto intent;
- player position, movement target/distance and current target details;
- HP, barrier, wards, damage-over-time, heal/effect and buff state;
- player/monster population and monster type counts;
- active hazards and escape counters; and
- recent kill, damage, heal, ability, target and hazard progress timestamps or
  counts.

Any window at or above `60000 ms` is `review`, not an automatic bug or failure.
Report the authoritative reason and state for each flagged interval. Mark the
interval `contained` only when the evidence shows an intentional recovery,
empty or unreachable target state, an explicitly demonstrated movement/path
condition, or engagement resumption, with no unexplained remainder. If full HP,
no target and monsters present remain without an authoritative reason, mark the
gap `unresolved`. If timing shows a gap but no bounded event is emitted, mark a
telemetry/preparation defect rather than claiming containment.

Preserve new-world seed and occupancy as a confounder: the replay restores the
progression state, not the Night3 encounter seed. Do not impose an arbitrary
kill quota, label every idle interval a hazard defect, or compare control and
Colossus throughput from this diagnostic.

### Stage 1 launch

Run from the repository at the frozen revision. The command creates a manifest
only; inspect it before launch.

```powershell
$exitRevision = '862448b6d8a6f298ead258447a0c5fa5aaeb9584'
$volcanoInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t210709z-voidwalker-jungle-desert-t4-v1/runs/001-voidwalker-jungle-desert-t4-v1z-intended-r01/artifacts/voidwalker-jungle-desert-t4-v1z-intended-2026-09-14T21-09-00-375Z-253ef36e/checkpoint-v1z-plus2-prepared-returned.json'
$diagnosticRoutes = 't4-exit-volcanic-control-diagnostic'
pnpm experiment:create --revision=$exitRevision "--routes=$diagnosticRoutes" --tierEntrySnapshot=$volcanoInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=1800000
```

After reviewing the manifest and image identity:

```powershell
pnpm experiment:launch --id=<diagnostic-id>
pnpm experiment:status --id=<diagnostic-id>
pnpm experiment:report --id=<diagnostic-id>
# Only after the run is terminal:
pnpm experiment:release --id=<diagnostic-id>
```

The `30-minute` run cap is a ceiling, not a requirement to wait or extend the
window. Stop only for invalid restore/build/definition/infrastructure or a
deadline; preserve the artifacts and report the exact terminal state. Do not
repair, relaunch or add a comparison arm in response to a gameplay outcome.

## Stage 2 — six remaining T4 boss screens

### Shared case contract

Each route is one independent ordinary attempt from the exact Stage 2 input.
Every case uses the same fixed +2 equipment, inherited Voidwalker/ranged Wisp
profile and original wallet. There are no purchases in these routes. Travel
uses the V1V Defensive 38RP build. The encounter build is V1V Offensive 37RP
(Frenzy/Hamstring; Second Wind, Brace, Cleanse, Break Free) for Desert, Tundra
and Trench, and the V1W Jungle 35RP build (Frenzy/Sweep/Hamstring; Second Wind,
Cleanse) for Jungle, Graveyard and Volcanic. Empty relic is the provisional
reference; no Colossus arm is included.

The route captures `<route-id>-ready`, marks approach and dungeon arrival,
configures the encounter build, performs one `attemptBoss` with `maxAttempts=1`
and a `720000 ms` step bound, asserts the named boss victory, then returns by
the exact reverse path, rests and captures `<route-id>-returned`. `stopOnFirstDeath`
and `suppressTransitCombat` are fixed. Do not require another Mountain run,
all remaining mastery caps, T5 or a continuous from-zero campaign.

All outbound and reverse hops were source-qualified as known, bidirectional
direct paths. Dungeon definitions, boss IDs, guardian IDs/counts and route
order were checked by the setup preflight.

| Order | Route ID | Dungeon / boss | Guardian roster | Fixed outbound path |
|---:|---|---|---|---|
| 1 | `t4-exit-jungle-boss` | `node-t4-jungle-dungeon` / `verdant-crown-predator` (Verdant-Crown Predator) | `jungle-t4-guard`, 9 | Sanctuary -> Mountain05 -> Tundra05 -> Mountain03 -> Mountain02 -> Jungle dungeon |
| 2 | `t4-exit-desert-boss` | `node-t4-desert-dungeon` / `dune-throne-sovereign` (Dune-Throne Sovereign) | `desert-t4-guard`, 3 | Sanctuary -> Mountain05 -> Tundra05 -> Tundra03 -> Tundra01 -> Desert dungeon |
| 3 | `t4-exit-tundra-boss` | `node-t4-tundra-dungeon` / `glacial-patriarch` (Glacial Patriarch) | `tundra-t4-guard`, 3 | Sanctuary -> Mountain05 -> Tundra05 -> Tundra04 -> Tundra02 -> Tundra dungeon |
| 4 | `t4-exit-trench-boss` | `node-t4-trench-dungeon` / `elder-trench-serpent` (Elder Trench Serpent) | `trench-t4-guard`, 2 | Sanctuary -> Trench05 -> Graveyard04 -> Trench06 -> Trench01 -> Trench dungeon |
| 5 | `t4-exit-graveyard-boss` | `node-t4-graveyard-dungeon` / `charnel-crown-sovereign` (Charnel-Crown Sovereign) | `graveyard-t4-guard`, 9 | Sanctuary -> Trench05 -> Graveyard04 -> Graveyard05 -> Graveyard02 -> Graveyard01 -> Graveyard dungeon |
| 6 | `t4-exit-volcanic-boss` | `node-t4-volcanic-dungeon` / `caldera-sovereign` (Caldera Sovereign) | `volcanic-t4-guard`, 9 | Sanctuary -> Trench05 -> Graveyard04 -> Graveyard05 -> Volcanic06 -> Volcanic02 -> Volcanic dungeon |

`Sanctuary`, `Mountain05` and similar shorthand in the table mean the exact
`node-t4-*` IDs shown in the source route. Use the route's authored waypoints;
do not search for a shorter path or reroute after a transit issue. A failure on
an approach is reported against the actual node and remains separate from the
target encounter.

### Boss acceptance and launch

An accepted win requires all three independently: the named boss is killed, the
attempt is victorious, and the authoritative matching seal is present in the
readback. Guardian clear, boss combat and return are separate outcomes. A boss
win that cannot safely return remains a verified encounter win but provides no
reusable returned checkpoint. Six cases do not combine into one character or
earn a pooled progression state.

Create Stage 2 only after the Stage 1 experiment has been reported/released or
explicitly left isolated by the operator. The Stage 2 command is:

```powershell
$exitRevision = '862448b6d8a6f298ead258447a0c5fa5aaeb9584'
$bossInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t221002z-night3-mountain-control-r1-nig/runs/001-night3-mountain-control-r1-intended-r01/artifacts/night3-mountain-control-r1-intended-2026-09-14T22-12-28-393Z-15aeb7e3/checkpoint-night3-mountain-control-r1-returned.json'
$bossRoutes = @(
  't4-exit-jungle-boss', 't4-exit-desert-boss', 't4-exit-tundra-boss',
  't4-exit-trench-boss', 't4-exit-graveyard-boss', 't4-exit-volcanic-boss'
) -join ','
pnpm experiment:create --revision=$exitRevision "--routes=$bossRoutes" --tierEntrySnapshot=$bossInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=3600000
```

Review the manifest for exactly six routes in the order above, one worker,
count1, reward1, no retries, the exact input SHA and frozen source/tree before
launching. Then operate the sealed experiment:

```powershell
pnpm experiment:launch --id=<boss-id>
pnpm experiment:status --id=<boss-id>
pnpm experiment:report --id=<boss-id>
# Only after all six cases are terminal:
pnpm experiment:release --id=<boss-id>
```

The `60-minute` per-case cap allows the longest fixed approach/return plus one
boss attempt; it is a ceiling, not a request for arbitrary waiting. Continue
predeclared cases after gameplay death or timeout. Stop the experiment for an
invalid shared setup or infrastructure failure, and do not repair/relaunch or
repeat an unchanged failure. If a deadline arrives, stop and mark remaining
cases unrun.

## Resource and evidence handling

Before each create/launch, record UTC time, free C: capacity, `docker ps`,
scoped worker/container memory and Windows Docker/vmmemWSL working sets
separately. Repeat at terminal release. Keep the existing `768m` worker limit;
do not raise concurrency, restart Docker, globally prune, change RAM settings
or delete retained volumes/artifacts. Shared `mmo-gamedb`, `logdb` and Redis
services remain untouched. Confirm this experiment's scoped containers,
network and workers are released after reporting; already-released is valid.

For Stage 1 report setup, ready capture, approach, measurement, diagnostic
windows and return separately. Include the event phase, activity reason,
movement/target/path, population, HP/barrier/debuff/hazard state, recent
progress, kills, seed/occupancy note, flagged-window duration and
explained/contained/unresolved result. A sparse or zero-engagement window is
survival/diagnostic evidence only.

For Stage 2 report one row per route with setup/restore, ready, approach,
guardian, named boss, victory/seal and return statuses separately. Include
actual boss combat duration where present, death/stall cause, actual failure
node, guardian count, named kill evidence, authoritative seal readback, and
ready/returned capture paths plus SHA/state hashes. Do not infer TTK, discharge,
cast completion/interruption or mechanic absence from aggregate logs that do
not record it. Distinguish whole-run totals from target-encounter totals.

Restored checkpoints and any new outputs retain their non-canonical ancestry.
These experiments can establish sampled encounter viability and a reliable
measurement surface; they cannot certify canonical economy/pacing or universal
class/relic balance. Keep Swamp T3 open. Begin scoped mob measurements only for
clean, viable encounters with reliable engagement/downtime evidence. Current
Night3 data alone still justifies no buff or nerf.

## Handoff

Operate this packet exactly: run the bounded empty-relic Volcano diagnostic,
preserve and classify its productive-activity gap, then run six independent
remaining-T4 boss screens from the declared Mountain4 return, report guardian /
boss / return separately, release scoped resources and retain all evidence. No
subagents, adaptive changes, retries, balance edits, pooled progression or
follow-on experiments.
