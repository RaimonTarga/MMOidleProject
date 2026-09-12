# V1a assessment — preparation timeout and supervisor failure

2026-09-12, Astra. No boss was reached. Keep two independent findings:
preparation exhausted 900 seconds, and the host supervisor failed to publish
state after a Windows `EPERM` rename error. Six-class local readiness still
stands; campaign boss coverage remains zero.

## Evidence and interpretation

Experiment `20260912t194203z-striker-campaign-plains-boss-t`, source
`53769682648bf66f8e265ebbf05c924bc4373c3c`. Manifest hash recomputed and matched
the sidecar: `b07042b0de444801b0a53a62ae43bcdad7df58c4e8e9d2c70c13a33653ae7bd8`.
Reviewed the [operator report](bot-balance-v1a-report.md), raw late-preparation
events, supervisor fatal event and durable worker result. Docker inspection
confirmed the worker exited. No old state or manifest was repaired or relabelled.

GM30 was reached at 423,337 ms. Chaotic Axe +5 then cost 293,734 ms of route-step
time, including the Swarming resource block. Plains Vest +5 began at 717,086 ms;
the bot reached Plains-01 Alacrity only at 871,460 ms and timed out at 900,309 ms,
still missing one Alacrity catalyst. The earlier 25x reward setting does not
justify assuming catalyst preparation completes 25 times faster.

The upgrade resolver did select the correct catalyst nodes. Raw events show Cave-03
Swarming kills and eventual arrival at Plains-01 Alacrity. Travel also included
ordinary combat across intermediate nodes. This is not evidence of a wrong
catalyst-family resolver or an impossible upgrade. The ceiling left only about
29 seconds at the final supplier. Actual catalyst-farming speed remains uncertain.

The report's phrase "route-state mismatch" should not imply a failed final-build
verification: no final prep assertion, `v1a:verified-plains-build` or preparation
marker was reached. Sweep at 417,821 ms and then Expose were intermediate
preparation states. The final verified Sweep build is correctly authored later.
The incomplete gear state is evidence that preparation did not finish, not that
the bot entered a boss fight with an invalid treatment.

The supervisor failed at 19:44:42.147Z while replacing `state.json`, before the
worker's character run began. An operator stop request could not be serviced by
that dead supervisor. The worker independently hit its own limit and wrote
`timed_out`; stale state/cohort files still say running. This remains an invalid
supervisor lifecycle with preserved worker evidence, not a normal terminal run.
The exact cause of the file-access conflict is unknown; brief Windows sharing
conflicts are a plausible explanation, not a proven culprit.

## Repairs and next experiment

The shared host atomic JSON writer now uses unique temporary files and retries
only EPERM/EACCES/EBUSY rename failures for at most two seconds. It never deletes
the previous destination to force replacement. Permanent failures still throw;
temporary cleanup does not mask the original error. Deterministic real-file tests
cover recovery after injected EPERM, bounded persistent failure, immediate EIO,
preservation of the old complete JSON and temporary cleanup. This is infrastructure
retry, not retrying a gameplay experiment. It cannot guarantee all future write
failures disappear; the next packet includes an owned-worker stop contingency.

New V1b route preserves V1a and keeps the SAME required boss kit, GM/tier gates,
final verified build, one dungeon cycle and 900-second ceiling. It:

- Learns Expose normally without attuning it, retaining Sweep for late farming.
- Suppresses farming during travel using the existing ordinary-intent transit mode.
- Omits Mountain Vest +5, which is spare armor not worn against this boss; the
  four required +5 items and their assertions remain unchanged.

These are preparation improvements, not a claim that the 15-minute budget now
guarantees readiness. V1b is one explicit repair probe, not an automatic V1a retry
or a controlled single-variable comparison. If it still runs out of prep time,
separate preparation/checkpoint work from encounter timing before another probe.
No gameplay tuning is indicated by V1a.

Frozen next source: `cf562ecee118fece0e4a0311da03ca0d4f18ee30`. It includes the
independent committed HUD/buff work since V1a; do not claim identical gameplay
revision. Runtime tooling is copied from the invoking checkout by experiment:create,
so the operator must verify the new atomic writer is present in the copied runtime.
See [V1b packet](bot-balance-v1b-operator-packet.md).

Capacity: stopped and detached completed Q2d Squire's owned DB/Redis containers,
removed only its network, and retained containers, PostgreSQL volume and artifacts.
Receipt: `v1b-network-preparation.json` under experiment
`20260912t190003z-squire-campaign-local-behavior`. Temporary network creation/removal
passed. Future service restoration requires recreating an isolated network and
reattaching service aliases. V1a's invalid run was left intact; no new run launched.

Validation: `pnpm bot:preflight` passed on the exact frozen revision in a clean
detached checkout, including bot/server typechecks, socket preflight, route and
loadout tests, atomic-write failure regressions and experiment tooling. Pure plan
validation confirmed one run, 900,000 ms and no fast retry. The full repository
test suite was not rerun; runtime repair effectiveness remains for V1b to observe.
