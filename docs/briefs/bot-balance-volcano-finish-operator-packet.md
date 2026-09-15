# Volcano finishing comparison — executable operator packet

Prepared 2026-09-15. **Ready for Luna to execute; not launched.** Run the four
cases below, write the report, release scoped resources and stop. Do not
implement another plan, spawn agents, change tactics, retry or rebalance.

## Question and decision

Can the prepared Voidwalker beat Caldera Sovereign with more damage amplification,
Colossus Heart, or both? This is a four-case 2x2 screening experiment, one attempt
per cell. The repeated reference is intentional: it supplies a contemporary
comparison with the newly added boss timeline. It is not an automatic retry.

The last six-boss batch won Jungle, Desert, Tundra, Trench and Graveyard. Together
with Mountain, T4 stands at six of seven sampled boss wins. Volcano T4 and Swamp
T3 remain encounter exceptions. Volcano farming inactivity is a separate
measurement defect to investigate; do not rerun its unchanged diagnostic here.
Successful encounters may proceed to focused mob-balance measurement independently.

The previous report understates Volcano evidence: boss combat was reached after
all nine guardians died. The death-context `killingBlow` ends at 292 HP, so it is
not the fatal blow. A radius-2000 telegraph immediately precedes a separate
549-damage death event. Cataclysm is the leading explanation, not a confirmed
source-attributed fatal event. Magma Vent also dealt 144 damage during one
7.4-second contact. Keep these observations distinct.

User playtest observation: killing the boss during Cataclysm cancels its damage,
but the animation can still play. Track the lingering animation as a future
visual issue; this packet changes neither combat nor visuals. Do not classify a
post-kill animation as an attack completing or a failed boss kill.

## Frozen identity and input

- Source: `67a7722559c4e7b4063032bda179ed1e8796aa4d`.
- Tree: `67798156542c8ddf0a795a03138d126907398f3a`.
- Definitions: `92ab80c967278d20e7546a94e5827b4ec20c27f74cf263d9c34cab9b43c206b4`.
- Preflight: `C:/Users/osaif/AppData/Local/mmo-idle/validation/volcano-finish-preflight-frozen.json`.
- Preflight SHA256: `7FBEF9AF2A6C12BDF7985FD7437B50753EA63F14D164F458AB14709F199009F2`.
- Input SHA256: `866db03766d0e7cd4ceeeea48506bd9c11c2a9eaf0f72037e49a0cc20c052f98`.
- Input state: `c17fccd4238740778cc6b78c5561c6edc2b4771e17b298783cb1786eb39e8bff`.
- Input boundary: `night3-mountain-control-r1-returned`.
- Route versions: `1.0.0`. One worker, one replica per route, intended policy,
  smoke-isolated, reward1, automaticRetries0, fastBossRetryfalse.

Every case independently restores this exact file:

```text
C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t221002z-night3-mountain-control-r1-nig/runs/001-night3-mountain-control-r1-intended-r01/artifacts/night3-mountain-control-r1-intended-2026-09-14T22-12-28-393Z-15aeb7e3/checkpoint-night3-mountain-control-r1-returned.json
```

It is GM132, rested at T4 Sanctuary, with Mountain4 earned and Volcano4 absent.
Keep the inherited ranged Wisp/Voidwalker, Cinderlash T3+5, Mountain vest/charm
T4+2, Desert boots T2+5, Accelerant and actual wallet. No upgrades, grants,
mastery grind, skill changes or merged progress. The setup-only preflight
restored the actual capture, checked gameplay-state fidelity and definitions,
validated every build and both travel directions, and paid the ordinary relic
cost on disposable state (zero ticks, no exported playable checkpoint).

## Four cases, in order

| Route ID | Encounter treatment | Relic | RP |
|---|---|---|---:|
| `t4-volcano-finish-reference-empty` | Previous encounter build | Empty | 35 |
| `t4-volcano-finish-expose-empty` | Add Expose Weakness | Empty | 42 |
| `t4-volcano-finish-reference-colossus` | Previous encounter build | Colossus Heart | 35 |
| `t4-volcano-finish-expose-colossus` | Add Expose Weakness | Colossus Heart | 42 |

All encounter builds use Offensive stance, Frenzy/Sweep/Hamstring, Second Wind
and Cleanse. Expose is already known and is added without removing another
ability; budget43 permits it. Retain auto-path-enemy, Step Back, Orbit,
Avoid Hazards and Recover First exactly. This tests damage amplification,
not an unmeasured change to movement or recovery. No mid-boss manual switching.

The two Colossus cases craft and equip `relic-colossus-heart` before departure
using normal handlers: blue3300 and heavy10. Preflight confirmed affordability,
energy cap200 ->280, gain per hit20 ->14, discharge multiplier6 ->8. Its net
benefit is a hypothesis; Night3 Mountain results did not favor it.

Travel remains the source-qualified Defensive 38RP build and exact previous path:

```text
node-t4-sanctuary -> node-t4-trench-05 -> node-t4-graveyard-04
-> node-t4-graveyard-05 -> node-t4-volcanic-06 -> node-t4-volcanic-02
-> node-t4-volcanic-dungeon
```

Return by the exact reverse. Each route rests, captures `<route-id>-ready`,
travels, applies its encounter build, clears the nine guardians and makes one
ordinary boss attempt. `maxAttempts=1`, first-death stop, boss-step cap12minutes,
travel-hop cap3minutes, whole-case cap60minutes. A victory is followed by reverse
travel, rest and `<route-id>-returned`. The total batch ceiling is four hours;
the previous comparable route ended in about five minutes. Caps are ceilings,
not durations to pad or extend.

## Execute

From the existing repository directory, use the explicit revision archive.
Do not check out/reset the shared working tree. Do not add
`--requireTierEntrySnapshot=true`; this is a named progression continuation.

```powershell
$finishRevision = '67a7722559c4e7b4063032bda179ed1e8796aa4d'
$finishInput = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260914t221002z-night3-mountain-control-r1-nig/runs/001-night3-mountain-control-r1-intended-r01/artifacts/night3-mountain-control-r1-intended-2026-09-14T22-12-28-393Z-15aeb7e3/checkpoint-night3-mountain-control-r1-returned.json'
$finishRoutes = 't4-volcano-finish-reference-empty,t4-volcano-finish-expose-empty,t4-volcano-finish-reference-colossus,t4-volcano-finish-expose-colossus'
pnpm experiment:create --revision=$finishRevision "--routes=$finishRoutes" --tierEntrySnapshot=$finishInput --mode=smoke-isolated --rewardMultiplier=1 --workers=1 --count=1 --policies=intended --maxRunMs=3600000
```

Inspect the created manifest: exact revision/tree/input SHA, four ordered routes,
worker1/count1/reward1/intended/no retries, dirtyWorkingTreeIncluded=false.
Record image/build identity. Then use the returned experiment ID:

```powershell
pnpm experiment:launch --id=<id>
pnpm experiment:status --id=<id>
pnpm experiment:report --id=<id>
# After every case is terminal and evidence is retained:
pnpm experiment:release --id=<id>
```

Continue the predeclared cases after gameplay death/timeout, even if another
case wins. Stop on invalid shared setup, source/definition mismatch, failed
craft/build or infrastructure failure; preserve evidence and report, do not
repair/relaunch. Do not create any follow-on experiment.

## Measurements and reporting

The existing two-second `concurrency-sample` events now optionally contain
`bossState` during boss activity: boss identity/HP/maxHP/position/state and
networked status, player HP/barrier/position/movement target/attack target,
lastAttackAt and auto intent. This is a backward-compatible optional field in
schema6. Sampling is not an exact hit log or a guaranteed named cast stream.
`lastAttackAt` is a server timestamp; compare successive values, not directly
against run-relative atMs. Changed timestamps demonstrate attack beats, not
exact attack counts or successful hits. In-range samples alone do not prove DPS.

Report for each case:

- Restore, paid purchase if applicable, verified build, approach, guardian clear,
  named boss fight, named kill, victorious attempt, Volcano4 seal and return.
- Guardian and boss timings separately. Boss HP when first observed, first
  sample at/below25%, subsequent two-second HP and lastAttackAt changes through
  death or kill, plus player position/intent and barrier during that interval.
- Available cast/status/telegraph evidence. Label the below25% interval as a
  sampled final-phase proxy unless an explicit cast event establishes its start.
- Expose/Frenzy activation evidence, vent contacts/durations/damage, HP/barrier
  before the final event, and both top-level death cause and death trace.
  A nonfatal last recorded damage event must not be called the killing blow.
- Exact input/output hashes, artifacts, source/tree/image and world-seed/occupancy
  differences. Missing boss samples are a telemetry limitation, not proof that
  the boss or its mechanic never occurred.

One named kill + victorious attempt + authoritative Volcano4 seal establishes
sampled viability for that treatment. A failed return does not erase a verified
boss win but yields no reusable returned checkpoint. Four independent cells
cannot establish statistical superiority; do not pool seals or declare global
relic balance. Retain RESTORED_PROGRESSION_CHECKPOINT, SYNTHETIC_TIER_ENTRY and
NON_CANONICAL_REWARD_MULTIPLIER ancestry; no canonical economy/pacing claims.

Write `docs/briefs/bot-balance-volcano-finish-report.md`, index it in
`docs/README.md`, and update the campaign state with results only. If a case
wins, recommend closing Volcano's sampled viability gap; Swamp T3 and farming
inactivity remain separate. If all fail, report remaining boss HP and final
mechanic evidence for the planner rather than proposing an automatic nerf.

Record free disk, UTC, scoped container memory and Docker/vmmemWSL working sets
before and after. Keep one worker and the existing768m limit. Release only
this experiment's services/network after reporting; retain artifacts. No global
prune, Docker restart, shared-service changes or artifact deletion.

Preparation checks passed: actual-input zero-tick qualification, bot and server
diagnostic typechecks, boss-timeline cadence/snapshot test, productive-activity
regression and existing validation-exit route test. No combat was run during
preparation; full game suite and live visuals were not tested.
