# Q2 — Actual build behavior after Q1 configuration success

Owner: Astra prepares/diagnoses; Luna operates/reports only.
Frozen source: `06c0818ae1554c00ed9ab7e5b1cf96e87f000f31`.
Question: do the configured Sweep/Offensive and Expose Weakness/Defensive builds
actually fight during a meaningful post-configuration observation window?

## Evidence and hypothesis

[Q1](bot-balance-q1-report.md) qualified acquisition and exact builds: 6/6
completed, 18 verified stage events, no deaths or failures. Astra checked the
manifest SHA256 against the report and all six raw event streams: the second farm
step was 0–1 ms in every run. Preparation had already reached its mastery endpoint.
Thus Q1 is a configuration success; neither configured combat kit was tested.
This is an observation-design gap, not evidence of bad abilities or a failed Q1.

Hypothesis: the same legal builds perform ordinary auto combat when given real
time after configuration. Q2 changes only the observation method, retaining Q1
gear, profile, acquisition and reward mode. Concurrent uncommitted monster/combat
changes in the main workspace are deliberately excluded from this frozen source.
Results apply to this source, not those newer working-tree mechanics.

## Exact treatments and entry

Routes: `striker-campaign-behavior-t2`, `squire-campaign-behavior-t2`,
`apprentice-campaign-behavior-t2`, `slinger-campaign-behavior-t2`,
`spirit-campaign-behavior-t2`, `conduit-campaign-behavior-t2`.
Same class frames, entry equipment/upgrades and three builds as Q1, authored in
`bot/src/loadout/campaignProfiles.ts`. No new gear, Core, Rite, custom ability Rune,
boss attempts or range unlock. The named boss candidate fights ordinary Plains
mobs here: this does not qualify a boss encounter or its hazard requirements.

After acquiring both stances:

1. Verify Sweep + Second Wind, Offensive only, original safe movement rules.
2. Observe 60,000 ms alive with Auto enabled at the first normal T2 Plains node.
3. Verify Expose Weakness + Second Wind, Defensive only, Avoid Hazards removed
   as in Q1 (other movement/recovery rules retained).
4. Observe another 60,000 ms at that same authored node.
5. Complete the final assertion. Do not count preparation combat in either window.

`observeForMs` is a bot observation duration, not a combat timer or artificial
sleep. The executor polls normal network-backed player state. Dead, Auto-off,
off-node and long missing sample intervals do not count. It requires both the
authored objective and the observation duration. Q2's objective is deliberately
already true; mastery caps therefore cannot terminate or invalidate the window.
Auto-enabled time can include recovery or lack of targets; it is not a claim of
60 seconds of engaged combat. The report must distinguish these states.

## Replication, reward mode and stops

One case per class, one worker, no automatic replicates or reruns. Maximum six
runs. Synthetic catalyst-primed T2 entry, 25× rewards, smoke-isolated. These remove
irrelevant acquisition delays; neither rate comparisons nor natural economy
conclusions are admissible. Preserve the tool's eligibility flags unchanged.

300,000 ms total per run; each behavior farm has 120,000 ms timeout and a
90,000 ms no-progress watchdog. The 60-second eligible duration is independent of
setup time, travel and death. Normal progression can continue during the windows;
record actual mastery and ability rank context, not a fabricated fixed-power state.

Stop the family promptly on invalid treatment, drift, disconnection, assertion
failure or timeout; retain completed and queued/cancelled records distinctly.
Deaths are observations, not automatic treatment invalidity. No cap extensions,
route fixes, balance changes, retries or downstream queue. Return problems to Astra.

## Commands

```powershell
pnpm experiment:create --revision=06c0818ae1554c00ed9ab7e5b1cf96e87f000f31 --routes="striker-campaign-behavior-t2,squire-campaign-behavior-t2,apprentice-campaign-behavior-t2,slinger-campaign-behavior-t2,spirit-campaign-behavior-t2,conduit-campaign-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

Use the returned exact experiment ID for `experiment:launch`, `experiment:status`,
`experiment:stop` if needed, and `experiment:report`. Do not substitute HEAD.
Container setup is outside the run ceiling. Preserve manifest, state, supervisor
events and all per-run artifacts. Luna must not modify the source or treatments.

## Required report and interpretation

Write `docs/briefs/bot-balance-q2-report.md` and add it to the docs index.
Report every scheduled run, revision, artifact path, terminal cause, death count,
isolation, reward/economy mode, three verified build stages and their RP/budget.

For each exact `q2:sweep:observe` and `q2:expose:observe` route-step interval:

- Boundaries, duration and completion/timeout; a completed window must last at
  least 60 seconds. Verify the correct build was installed before its start and
  did not drift. Do not combine preparation activations with this interval.
- Counts of kills and `ability-activation` events by ability ID, with event links;
  Sweep and Expose Weakness are separate expected behaviors in their own windows.
- Available combat, movement, recovery, death and unavailable observations;
  observed stance information and mastery at start/end. Do not add overlapping
  activity/purpose totals. Missing telemetry is unavailable, not zero activity.
- If an expected activation is absent, report observed target/attack opportunities
  and cooldown/trigger evidence where available. Do not invent opportunity counts
  or declare an engine bug from absence alone.

A completed window with kills and expected activation demonstrates basic runtime
function for that build on this content. A completed window without sufficient
opportunity remains unresolved. A missing activation despite repeated eligible
opportunities is a focused diagnostic lead. No result establishes optimized class
balance, exact DPS, boss viability, Step Back/hazard correctness, custom firing,
or Conduit reconstruction without corresponding evidence.

After the report, Astra selects a prepared boss-local experiment if basic behavior
is established, or a focused ability/targeting diagnosis if it is not. Do not
materialize either follow-on automatically.
