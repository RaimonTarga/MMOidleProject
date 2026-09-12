# Q1 — Plains build-transition readiness (Luna operator packet)

Status: ready for Luna operation. Frozen execution revision: `1d3c710feacb530b731af33d33af63616a49dd25`.
Astra owns route/profile/assertion changes. Luna launches, observes, preserves
artifacts and reports. Stop and return unexpected problems; do not improvise fixes.

## Question / hypothesis

Can the six existing T2 entry builds acquire introductory stances and transition
exactly into an RP-legal Plains farming build and boss candidate?
Hypothesis: explicit full-build reconciliation avoids unwanted retained stance
reservations. This is readiness, not a class comparison or boss viability study.

## Entry and treatments

One run each: `striker-campaign-readiness-t2`, `squire-campaign-readiness-t2`,
`apprentice-campaign-readiness-t2`, `slinger-campaign-readiness-t2`,
`spirit-campaign-readiness-t2`, `conduit-campaign-readiness-t2`.

Use generated T2 entries, `catalyst-primed` economy. Permanent state equals the
corresponding clean profile; catalyst stock is explicitly synthetic. No historical
snapshot directory, future-tier gear, range branch, boss retries or gear upgrades.
Exact builds are authored in `bot/src/loadout/campaignProfiles.ts`:

| Stage | Abilities | Stance | Melee RP | Ranged RP |
|---|---|---|---:|---:|
| Entry | Expose Weakness, Second Wind | none | 20 | 22 |
| Plains farm | Sweep, Second Wind | Offensive only | 20 | 22 |
| Boss configuration | Expose Weakness, Second Wind | Defensive only | 19 | 21 |

Budget starts at 22 and is recalculated live as mastery increases. Boss candidate
drops Avoid Hazards to fund the stance while preserving movement/telegraph/recovery
logic. This is only configuration qualification: that candidate must be reviewed
against a particular boss's hazards before being used in combat. All ability rules
use authored default triggers. No Rites. Historical controls remain unchanged.

## Reward mode and limits

`smoke-isolated`, reward multiplier 25, one worker, one replicate per route.
Catalyst-primed avoids a long catalyst wait that XP acceleration cannot remove.
No pacing, natural acquisition-time or reward-balance interpretation is allowed.
Each run: 300,000 ms total. Farm steps: 120,000 ms limit and 60,000 ms no-progress
guard. Setup/container build time is separate. Stop the family on any first
invalid state, disconnect, unexplained build drift or failed readiness run;
preserve queued cancellations separately. Monitor each completion before allowing
the next case if a shared defect is suspected. No retries or replica expansion.

## Execution

Run the following command using the frozen prepared revision. Do not substitute HEAD,
which may contain unrelated later work. The working copy need not be clean because
the runner exports only this commit.

```powershell
pnpm experiment:create --revision=1d3c710feacb530b731af33d33af63616a49dd25 --routes="striker-campaign-readiness-t2,squire-campaign-readiness-t2,apprentice-campaign-readiness-t2,slinger-campaign-readiness-t2,spirit-campaign-readiness-t2,conduit-campaign-readiness-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

Use the returned exact ID with `experiment:launch`, `experiment:status`,
`experiment:stop` when required and `experiment:report`. Do not use `latest`,
cross-cohort queueing or modify limits during execution. Preserve all artifacts.

## Assertions, observations and interpretation

Existing entry validator checks exact imported state; explicit route assertions
check frame/equipment and reject tier 3. `configureBuild` verifies ownership,
budget and complete ordered authoritative loadout after each edit. A terminal
assertion prevents the level-8 endpoint from skipping final build configuration.
Require all three named stages to emit verified build events in the correct order.
Record actual revision, profile, start state, reward/economy mode and isolation.

Completion proves the acquisition/configuration route completed. Separately inspect
ability-activation, stance-switch and movement/recovery evidence. If accelerated
acquisition reaches level 8 before the farm build is installed, its farm leg can
be skipped: classify its combat behavior as untested, not a pass. If a condition
or combat opportunity never occurs, record untested. These cases do not qualify
custom conditional firing, telegraph avoidance, reconstruction or boss success
merely because the corresponding configuration is present.

Report preparation, transit, farming/recovery and build-mutation time separately;
include endpoint, deaths, rejected edits, timeouts and observed activations. No
progress is a diagnostic trigger, not proof that the encounter is overtuned.

## Deliverable and next decision

Write `docs/briefs/bot-balance-q1-report.md`: exact manifest/revision/artifact paths,
one row per scheduled run including queued cancellations, three-stage verification,
RP totals, attained mastery, behavior evidence versus untested behavior, and links
to failure events. No fixes, reruns, automatic winners or balance proposals from
the operator. Astra reads the results before preparing the next local experiment.
