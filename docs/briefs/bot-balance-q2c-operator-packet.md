# Q2c — Remaining class local behavior qualification

2026-09-12. Astra prepares and interprets; Luna executes this packet and reports.
Frozen source: `755b2a3642a3a417f364f5fb8486e661bfc351b0`.
Use the committed source even if the invoking checkout has advanced. No source,
template, profile, assertion or gameplay edits are authorized to the operator.

## Question and scope

Can each remaining class complete both local post-build observation windows
with its declared build, kills and expected Technique activations? Q2b already
qualified one Striker case. The smallest remaining coverage is one case per
unobserved class root; these are different treatments, not five replicates.

Up to five cases in this order: Conduit, Slinger, Spirit, Apprentice, Squire.
Use the existing `<class>-campaign-local-behavior-t2` routes, version 1.0.0.
Their step labels remain `q2b:sweep:observe` and `q2b:expose:observe`; Q2c is the
packet name, not a new route revision. No Striker rerun or boss attempt.

## Treatment and limits

Keep each class's generated T2 catalyst-primed entry, equipment/upgrades,
class/frame and entry/farm/bossCandidate builds from `campaignReadiness.ts`,
`campaignProfiles.ts` and `campaignBehavior.ts` at the pinned source. The
bossCandidate name does not admit the build to a boss encounter.

Entry and Sweep retain Avoid Hazards; Defensive intentionally omits it. Movement
rules differ by class. Verify the actual requested and observed ordered builds;
do not copy Striker's Rune count or observed budget into other class reports.
Both stances are acquired through the existing ordinary-intent preparation.

Smoke-isolated, synthetic entry, 25x rewards, intended policy. One worker and one
run per experiment, 300,000 ms overall ceiling. Each observation accumulates
60,000 ms eligible sampled time alive with Auto on in its selected normal T2
Plains node. Idle/recovery can count; this is not continuous combat time.
Each farm timeout is 120,000 ms after arrival, with a 90,000 ms no-progress
watchdog. Transit is bounded by the overall ceiling. No limit extensions.
Maximum authorized run time across five cases is 25 minutes, excluding setup
and reporting; stop earlier on the gate below.

## Sequential gate

Create only the first case initially. Use its returned ID with experiment:launch,
experiment:status and experiment:report; preserve all artifacts. Inspect its
terminal result and window evidence before creating the next case. Do not queue
all five or use a loop that launches the next case merely on process success.

A case passes only when all of the following are observed:

- Normal terminal completion, entry/final assertions passed, and three exact
  build verifications within the recorded RP budgets.
- Both named windows have start/end events and satisfy the existing observation
  contract; no initial transit away from a qualifying preparation node.
- Each window has non-boss kills and its expected Technique activation: Sweep
  in the first, Expose Weakness in the second. Report Second Wind separately;
  lack of an eligible Guard opportunity is not a failure.
- No treatment drift, artifact/provenance failure or unexplained contradictory
  evidence. Record actual node/modifier, deaths and ordinary return trips.

On a pass, Luna is authorized to create the next listed case without another
Astra review. On failure, timeout, disconnection, invalid treatment or unresolved
activation/opportunity evidence, stop the sequence and return the partial report
to Astra. If a run is still active and must be stopped, use experiment:stop for
that exact ID. Preserve later cases as not created, not cancelled runs. Death
alone is an observation; it does not invalidate an otherwise completed case.
No retry, substitution, build adjustment, cap extension or expansion past Squire.

## Creation commands

Execute each command only when its sequential gate is open.

```powershell
pnpm experiment:create --revision=755b2a3642a3a417f364f5fb8486e661bfc351b0 --routes="conduit-campaign-local-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

```powershell
pnpm experiment:create --revision=755b2a3642a3a417f364f5fb8486e661bfc351b0 --routes="slinger-campaign-local-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

```powershell
pnpm experiment:create --revision=755b2a3642a3a417f364f5fb8486e661bfc351b0 --routes="spirit-campaign-local-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

```powershell
pnpm experiment:create --revision=755b2a3642a3a417f364f5fb8486e661bfc351b0 --routes="apprentice-campaign-local-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

```powershell
pnpm experiment:create --revision=755b2a3642a3a417f364f5fb8486e661bfc351b0 --routes="squire-campaign-local-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

## Evidence and deliverable

Write `docs/briefs/bot-balance-q2c-report.md` and index it. Include a five-class
disposition table even if later cases were never created. For each executed case,
record exact experiment/revision/tree/image identities, complete manifest hash,
artifact paths, terminal reason, treatment and eligibility flags, frame/equipment,
three verified builds and RP/budgets, actual nodes/modifiers, deaths and transit.

For each window record exact start/end bounds, duration, kills, Sweep/Expose/
Second Wind counts and timestamps, activity durations and unsampled time. Clip
samples at window boundaries, exclude preparation, and do not add overlapping
activity and purpose categories. Preserve telemetry flags unchanged.

For Conduit describe observed formation/summon activity using available evidence.
For the other classes record available class-specific behavior observations too.
Do not invent unavailable targeting/resource/formation telemetry or turn its
absence into a new pass requirement. Missing expected Technique activation is
unresolved until opportunity, cooldown, targeting and interruption are assessed.

This packet qualifies functional behavior on the pinned source only. No DPS,
class ranking, balance, natural economy/progression or boss conclusions. Do not
pool Q2's incomplete run, or treat Q2b Striker as a simultaneous matched control.
After the last passing case or first stop, return to Astra for the next decision.
