# V1b — Revised preparation and supervised Plains boss probe

2026-09-12. Astra prepares/interprets; Luna executes this bounded packet.
Frozen source: `cf562ecee118fece0e4a0311da03ca0d4f18ee30`.
Route: `striker-campaign-plains-boss-v1b-t1`, version 1.0.0.

## Question and unchanged target

Can revised preparation reach the same GM30/+5 Striker boss state within the
existing ceiling, and, if reached, clear T1 Plains? This also checks successful
supervisor finalization after the atomic-writer repair. Report these separately.

Fresh character, no snapshot or synthetic tier-entry profile, intended policy,
25x rewards, smoke-isolated, one worker, one run, 900,000 ms overall. Preparation,
travel, guardians and boss all share that ceiling; setup/build is separate.
One authored dungeon attempt cycle, ordinary guard clearing/altar activation,
fastBossRetry=false. No additional class or boss, gameplay retry or limit extension.

Earn GM30 and Chaotic Axe +5, Plains Vest T1 +5, Swamp Charm T1 +5, Plains Boots
T1 +5. The final assertions and exact Sweep/Second Wind build are unchanged:
19 RP against GM30 budget 22, five movement/hazard/recovery Rune rules, no
stance/Rite/frame/Core/Relic. Do not weaken gates or inject resources.

The new route retains Sweep during late preparation, suppresses farming while
traveling and skips the unused spare Mountain Vest +5. Expose is still learned,
without attuning it. Look for `v1b:verified-plains-build`, then
`v1b:preparation-complete`, then `v1b:plains-attempt`. Earlier build verifications
are preparation evidence, not substitutes for these markers.

## Creation and execution

```powershell
pnpm experiment:create --revision=cf562ecee118fece0e4a0311da03ca0d4f18ee30 --routes="striker-campaign-plains-boss-v1b-t1" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=900000
```

Before launch verify manifest/source/tree/image, one run, fresh entry, no snapshot,
and fastBossRetry=false. The runner copies host tooling from the invoking checkout:
verify the generated `runtime/lib.mjs` contains the bounded rename retry and unique
temporary filename implementation from the prepared revision; record its hash
and the manifest runtime/tooling hashes. If absent or changed unexpectedly, stop
and report; do not edit the copied runtime or substitute a source revision.

Use the returned exact ID for experiment:launch, status and report. No replacement
manifest or second launch. Never resume the stale V1a experiment. Preserve V1a's
worker timeout and supervisor failure as historical records.

## Stops and supervisor-failure contingency

Normal gameplay follows the bounded route. Guardian deaths can occur inside the
single authored attempt cycle and are not automatically separate boss attempts.
On treatment drift, failed assertions, infrastructure failure or lost evidence,
stop/report. If the ceiling expires before preparation/activation, boss remains
untested. No automatic downstream work after success.

Use experiment:stop for the exact ID while its supervisor is alive. If a durable
`supervisor-fatal` event confirms the supervisor died and cannot service stop,
Luna is explicitly authorized to inspect the run's recorded worker container,
verify its `mmo.experiment.id` label matches this exact experiment and that it is
the worker (not DB/Redis), then issue ONE `docker stop --timeout 20 <verified-worker>`
if it remains running. Preserve logs, worker result/heartbeat, stale state and
artifacts; report infrastructure-invalid. Do not stop any other container, remove
volumes/networks, rewrite state, reconcile the old run or relaunch. An already
exited worker needs no stop. If ownership is uncertain, report instead of guessing.

## Report

Write/index `docs/briefs/bot-balance-v1b-report.md`. Use the V1a packet's encounter
evidence requirements, with these additional preparation/lifecycle checks:

- Actual selected Technique during late farming, upgrade order, catalyst/essence
  blocks, node arrivals and travel versus supplier-farming time. Missing catalyst
  alone does not establish a routing error or economic imbalance.
- All required equipment/+5/GM/tier assertions and final verified build event.
- Durable supervisor terminal state agreeing with worker-result and run summary;
  otherwise state exactly which records are stale and which are authoritative.
- Actual guardian clearing, altar activation, boss engagement/HP progress and
  authoritative Tusked Razorback kill/clear if present. No boss claim without it.

Separate preparation, transit, guardian and boss outcomes. Preserve all eligibility
flags, missing telemetry and deaths. No DPS, natural economy or class-wide balance
claim from this accelerated probe. Return to Astra after this one run.
