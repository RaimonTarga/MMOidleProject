# Q2b — Single Striker local observation repair check

Astra prepares and diagnoses. Luna operates this exact packet and reports; no
route/build changes, retries or automatic follow-on work.
Frozen source: `755b2a3642a3a417f364f5fb8486e661bfc351b0`.

## Question / hypothesis / smallest useful test

Can Striker complete both post-build observation windows without the unnecessary
Plains-04 → Plains-01 journey that consumed Q2? One case is enough to qualify the
route repair before spending on the remaining five classes. Q2 had two observed
Sweep activations but no completed window; retain that evidence separately.

## Entry / treatment / reward

Route: `striker-campaign-local-behavior-t2`, version 1.0.0.
Same generated Striker T2 catalyst-primed profile, cadence-balanced, Q1 gear and
upgrade levels, entry/Sweep/Defensive builds, no Core/Rite or new gear. Exact source
definitions: `campaignProfiles.ts`, `campaignReadiness.ts`, `campaignBehavior.ts`.
No boss attempts. Synthetic entry, 25× rewards, smoke-isolated; no economy, DPS,
class-balance or boss conclusions. Current source includes the independent
`b1123804` monster animation/combat presentation pass; do not pool Q2/Q2b results
as a same-gameplay controlled comparison.

## Procedure and assertions

Preparation acquires both stances through normal intents. Following verified
Sweep/Offensive configuration, `q2b:sweep:observe` selects the player's CURRENT
normal T2 Plains node and accumulates 60 seconds alive with Auto enabled there.
After verified Expose Weakness/Defensive configuration, `q2b:expose:observe` does
the same. Each window excludes dead/Auto-off/off-node intervals and long sampling
gaps, but may include idle/recovery time. It does not imply continuous engagement.
Current-node selection must fail outside normal Plains T2; no fallback location.
Record the actual node for each window. No assertion that all runs use Plains-01.

Require all three verified exact builds and RP legality, entry assertions, final
assertion and both completed windows. Check no unwanted transit begins between
the verified build and the window's initial farming activity. Death/return during
a window remains separately recorded and must not be mistaken for initial transit.
Existing windows are fixed to their selected node, not moved after a death.

## Replication / limits / stops

Exactly ONE Striker run, one worker. Overall ceiling 300,000 ms; each farm waits
up to 120,000 ms after arrival and has a 90,000 ms no-progress watchdog. The farm
timeout does not cover transit; the overall ceiling always applies. Keep these
limits unchanged. No other cases start automatically, so a failure cannot race
the launch of a second class.

Stop/report invalid state, drift, timeout or disconnection. Death is an observation,
not automatic treatment invalidity. No reruns or budget extensions. If a full
window lacks activation evidence, report opportunities or missing evidence rather
than modifying the loadout. No engine or balance changes are authorized to Luna.

## Commands

```powershell
pnpm experiment:create --revision=755b2a3642a3a417f364f5fb8486e661bfc351b0 --routes="striker-campaign-local-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

Use the returned exact ID with experiment:launch, experiment:status,
experiment:stop if necessary, and experiment:report. Never substitute HEAD/latest.
Preserve all artifacts and source/manifest identities. Build time is outside run time.

## Metrics / interpretation / deliverable

Write `docs/briefs/bot-balance-q2b-report.md` and index it. Include exact revision,
manifest and artifact paths, terminal result, all build verification timestamps,
RP/budget, initial and per-window nodes, node-enter events, deaths and return trips.
For each named interval: start/end/duration, kills, Sweep/Expose/Second Wind
activations, observed activity and unavailable time. Exclude preparation events.
Preserve existing eligibility flags, and do not add overlapping timing categories.

A pass requires completed windows with the declared build and evidence of kills
and expected Technique activations in their respective windows. If observation
completes but opportunity/activation evidence is missing, mark behavior unresolved.
If the player travels at initial selection despite starting in a qualifying node,
report the route repair as failed. No missing activation alone establishes a bug.
Return to Astra; success does not authorize additional classes or a boss campaign.
