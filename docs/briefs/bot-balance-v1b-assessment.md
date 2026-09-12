# V1b assessment — qualify acquisition separately

2026-09-12. Astra review of [Luna's report](bot-balance-v1b-report.md).

V1b is a validly finalized preparation timeout, with no encounter evidence.
The sealed manifest hash matches the report. Durable state and supervisor events
agree: the worker timed out and the supervisor completed normally. This validates
finalization on this run; it does not establish that rename contention occurred.

GM30 took 424 seconds. Chaotic Axe +5 then took about 300 seconds, including
56 seconds of travel and roughly 244 seconds at the Swarming supplier. The next
upgrade spent about 170 seconds traveling to Alacrity and arrived with only five
seconds left. Missing Alacrity is therefore not a demonstrated farming stall.
Sweep remained selected during late preparation. Zero deaths and zero boss
attempts do not establish encounter viability or a need for tuning.

The full required kit was not reached: Axe +5, remaining target pieces +4, with
Mountain Vest still equipped. The earlier verified ability build is not the final
`v1b:verified-plains-build` gate. Snapshot A was captured at GM30 before the final
upgrades; it is not a ready encounter checkpoint.

## Decision

[V1c](bot-balance-v1c-operator-packet.md) isolates fresh acquisition with a fixed
30-minute ceiling and no boss step. Keep the same GM30, four +5 items, build,
reward multiplier and revised farming/transit behavior. This is a new phase with
a declared budget, not an extension or retry of V1b. Seven minutes to GM30 plus
five for the Axe and almost three for the next supplier already consumed V1b's
ceiling; extra acquisition budget is justified, but success within 30 minutes is
not guaranteed. No gameplay or economy tuning follows from this evidence.

If preparation succeeds, review its verified final state and implement/qualify a
separate encounter entry before authorizing a boss probe. Existing J0/J3/D0
checkpoint support does not constitute a T1 ready-state importer. Preserve the
database and artifacts; do not relabel Snapshot A or promise an exact replay.
If it fails, diagnose the remaining objective and return for a new decision.

Six-profile local behavior qualification remains complete. We are still qualifying
the first campaign preparation path; no campaign boss has yet been tested.

## Preparation and validation

V1c route commit: `3ad6dbdab621d6ffc1979ac25ffe7000dbab765e`.
`pnpm bot:preflight` passed on that exact revision in a clean detached validation
checkout, including bot/server typechecks, route semantics, loadouts, executor
regressions and experiment tooling tests. Full repository tests were not run;
this is harness validation, not gameplay evidence.

After checking V1b's terminal state and exact Docker ownership, Astra stopped and
disconnected only its PostgreSQL/Redis services and removed their empty network.
Containers, volumes and experiment artifacts remain intact. A temporary network
create/remove verified capacity. Receipt: `v1c-network-preparation.json` in V1b's
experiment directory. Restoring those services requires a new isolated network
with their original `postgres` / `redis` aliases; do not simply restart them.
No V1c experiment has been created or launched by Astra.
