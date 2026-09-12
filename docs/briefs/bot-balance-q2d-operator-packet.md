# Q2d — Resume remaining readiness after network repair

2026-09-12. Astra selects this continuation; Luna operates and reports.
Frozen source: `755b2a3642a3a417f364f5fb8486e661bfc351b0`.
See [Q2c assessment](bot-balance-q2c-assessment.md) for the infrastructure repair.

## Scope and authorization

One launch attempt of the existing Spirit experiment, followed by one Apprentice
and one Squire case only if each preceding case passes. No repeated Conduit,
Slinger or Striker runs. Q2c's failed Spirit launch remains recorded as a
pre-worker infrastructure failure; it is not a failed gameplay attempt.

Use the [Q2c packet](bot-balance-q2c-operator-packet.md)'s exact treatments,
sequential pass gate and evidence contract. All routes are version 1.0.0 and use
the existing `q2b:sweep:observe` / `q2b:expose:observe` labels. Synthetic
catalyst-primed entry, smoke-isolated, 25x rewards, intended policy, one worker,
one run, 300,000 ms ceiling each; two cumulative 60-second local windows,
120,000 ms farm timeout after arrival and 90,000 ms no-progress watchdog.
Maximum remaining run time is 15 minutes, excluding setup and reporting.

Require normal completion, all entry/final assertions, three exact build
verifications within observed RP budgets, both completed windows, non-boss kills
and expected Technique activations in each window, and no unwanted initial
transit. Death/return is recorded separately and can coexist with a pass.
No expected activation without adequate opportunity means unresolved, not proof
of a defect. Stop on any failure, timeout, invalidity or unresolved evidence.

## Spirit: verify before the one authorized launch

Existing ID: `20260912t182552z-spirit-campaign-local-behavior`.
Expected manifest SHA256:
`391803708f566dfa0b5201c5ef8c982d0c527b4a88a4a00e3e981d0882a58a33`.
Expected source tree: `46bafaf54dc5016010fb4e30605813dd3f043dba`.
Expected image:
`sha256:73f633e15d9903321d610ed5e85b4dd74c152d85b9281127e93126f108adfb6e`.

Check the manifest/source/image and state before launch: supervisor not-started,
one queued run, attempt 1, no worker or gameplay artifacts. Astra prepared the
expected empty network `mmoexp-6c5539466337-network`; no Spirit services started.
If state has changed, inspect/report it rather than launching a duplicate.
Do not create a replacement Spirit manifest or reset/edit its state.

```powershell
pnpm experiment:status --id=20260912t182552z-spirit-campaign-local-behavior
pnpm experiment:launch --id=20260912t182552z-spirit-campaign-local-behavior
```

Monitor the exact ID and use experiment:report after terminal completion.
If this launch fails again, stop and report; no further repair/retry is delegated.

## After Spirit passes: Apprentice

```powershell
pnpm experiment:create --revision=755b2a3642a3a417f364f5fb8486e661bfc351b0 --routes="apprentice-campaign-local-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

Launch/monitor/report only the returned ID; apply the full pass gate before Squire.

## After Apprentice passes: Squire

```powershell
pnpm experiment:create --revision=755b2a3642a3a417f364f5fb8486e661bfc351b0 --routes="squire-campaign-local-behavior-t2" --mode=smoke-isolated --entryEconomy=catalyst-primed --rewardMultiplier=25 --workers=1 --count=1 --policies=intended --maxRunMs=300000
```

Launch/monitor/report only the returned ID. Do not queue future cases early.
Use experiment:stop for the exact active ID when needed. No automatic or manual
reruns, source/build edits, limit extensions, Docker cleanup, boss attempts or
further experiments are delegated by this packet.

## Deliverable

Write and index `docs/briefs/bot-balance-q2d-report.md`, including all three
dispositions even if later cases are not created. Keep the original Q2c stop
and this renewed launch as separate lifecycle events under the same Spirit ID.
Capture manifest hashes, revision/tree/image, eligibility flags, terminal reasons,
artifact paths, requested/observed builds and RP budgets, node/modifier, deaths,
return trips and per-window boundaries, kills, activations, clipped activity and
unsampled time. Exclude preparation and avoid overlapping timing categories.

No functional pass establishes boss viability, natural progression/economy, DPS
ranking or balance. Return to Astra after the last pass or first stop.
