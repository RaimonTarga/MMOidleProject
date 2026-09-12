# V1a — First prepared Tier 1 Plains boss probe

2026-09-12. Astra prepares/interprets; Luna operates this exact packet.
Frozen source: `53769682648bf66f8e265ebbf05c924bc4373c3c`.
Route: `striker-campaign-plains-boss-t1`, version 1.0.0.

## Question and treatment

Can the declared end-of-T1 Striker build clear the Plains dungeon and kill Tusked
Razorback using ordinary player tools? One case is the smallest useful encounter
probe. This is a reasoned candidate, not a proven globally optimal build.

Fresh character: no synthetic tier-entry profile or imported snapshot. Earn the
tutorial class root and T1 preparation through the existing Striker route:
Clearing -> Plains -> Forest -> Swamp -> Mountain -> Cave, GM30 and +5 gear.
Then wear Chaotic Axe, Plains Vest T1, Swamp Charm T1 and Plains Boots T1.
Verify Sweep + Second Wind; Auto Path Enemy, Step Back, Chase Enemy, Avoid Hazards
and Wait for Regen; no stances/Rites. The expected build cost is 19 RP against
22 at GM30. No frame, Core or Relic. Preparation assertions must pass before
the verified-build event and `v1a:preparation-complete` marker.

Plains is a swarm encounter. Sweep addresses adds and Second Wind sustains the
player; retain the ordinary movement/hazard/recovery behavior. Do not substitute
the T2 Defensive/Expose readiness build. Guardians are cleared normally before
walking to and activating the altar. No guardian bypass, teleport, fast boss
retry, manual tactical intervention or build change is authorized.

## Limits and stops

One experiment, one worker, one run, intended policy, smoke-isolated, rewards
25x, overall limit 900,000 ms (15 minutes), including preparation and transit.
Build/setup time is separate. This uses the campaign's local-viability ceiling;
it does not extend a failed readiness run. No live extension or rerun.

The route permits ONE authored `attemptBoss` cycle and stops after it or the first
verified boss clear. The counter includes dungeon approach/guard preparation;
it is not necessarily one actual boss engagement. Existing guardian-clear logic
can recover from guardian deaths within that cycle. Report those separately and
do not present the counter as a count of boss fights. Internal waits retain their
existing limits; the overall 15-minute ceiling bounds the whole run.

On source/treatment drift, failed assertion, lost artifacts or disconnection,
stop/report the exact run. Let ordinary gameplay death/recovery follow the bounded
route. No operator retries, new cases or balance/engine changes. If the overall
ceiling expires during preparation, report boss untested. If guardians prevent
activation, report dungeon-entry/guardian evidence separately from boss difficulty.

## Command

```powershell
pnpm experiment:create --revision=53769682648bf66f8e265ebbf05c924bc4373c3c --routes="striker-campaign-plains-boss-t1" --mode=smoke-isolated --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=900000
```

Use only the returned ID with experiment:launch, experiment:status,
experiment:stop if required, and experiment:report. Never substitute HEAD.
Confirm fresh entry and fastBossRetry=false in the manifest before launch.
Network capacity was checked during preparation but can be consumed by other
activity. On infrastructure failure stop/report; no cleanup or retry delegated.

## Evidence and deliverable

Write and index `docs/briefs/bot-balance-v1a-report.md`. Preserve exact manifest
hash, revision/tree/image, runtime flags, terminal reason and artifact paths.
Include:

- Preparation milestones, elapsed time, deaths/stalls, class/tier/GM, equipment
  and upgrades, actual RP budget and exact verified build. Separate any inability
  to acquire the proposed preparation from encounter performance.
- Dungeon arrival, guardian-clear events/deaths, altar activation, boss appearance
  and actual boss engagement start/end. Separate transit, guard clearing, recovery
  and boss combat instead of assigning the whole attempt to the boss.
- Boss HP/phase progress where available, adds and target behavior, Technique/Guard
  activation, damage/recovery/death evidence and missing telemetry. Do not infer
  unobserved detailed mechanics from a final HP number.
- Authoritative boss kill/clear evidence with matching boss ID and final progression
  state. Route completion alone is not sufficient proof of the intended boss kill.

A verified kill establishes possibility for this declared prepared state under
the accelerated run, not repeatability, class-wide balance or natural pacing.
Rewards can affect wallets/progression and possibly combat through progression;
preserve eligibility flags and record actual state at engagement. A loss is one
candidate result, not proof the boss is impossible or needs a nerf. Report observed
facts and uncertainties; return to Astra for the next targeted decision.
