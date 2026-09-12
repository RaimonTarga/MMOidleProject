# Q0 preparation report

2026-09-12. Astra prepared the bots; Luna is operator only.
Base audit SHA: `353d5eceeea31bd14de9eb38dbeb70dca85abc95`.
Prepared source is frozen in the scoped bot preparation commit; see Q1 for the exact execution SHA.

Implemented six named profiles and six registered Plains-local readiness routes.
They reuse the existing entry state, authoritative build reconciliation, recipe
acquisition and telemetry. Historical baselines and gameplay code are unchanged.
The current candidates deliberately use default ability firing, preserving the
smallest useful test of acquisition, RP and exact stance-pool replacement.

All seed profiles fit 22 RP. Farm builds cost 20 melee / 22 ranged; boss candidates
cost 19 / 21. Both stance acquisition gates are reachable at Plains 7. Tests walk
the authored acquisition order, check actual learned abilities and owned Rune
fragments, reject unlearned stances and insufficient RP, and protect the final
assertion boundary. See [Q1](bot-balance-q1-operator-packet.md) for exact treatments.

Current checks: initial preflight passed all 18 template validations, socket/build
smoke, route/harness suites and experiment tooling. New campaign test passed all
six profiles. Final post-edit pnpm bot:preflight passed, including bot/server typechecks, socket smoke, all 18 templates, registered route checks, the new campaign tests and experiment tests. Pure command-plan validation resolved exactly six runs without launching infrastructure.
No live campaign run or gameplay balance evidence is claimed. No custom firing
instrumentation was added because this first packet has no custom firing treatment.

The farming and boss profiles are readiness candidates, not expert-optimal builds.
Boss equipment/encounter preparation follows after qualification; the configuration
candidate is explicitly not admitted to a specific boss yet. Apprentice DoT
targeting, Conduit formation variants and Slinger weapon alternatives remain
subsequent focused questions, not extra arms in this first readiness cohort.

The new registered configureBuild routes exposed a test-only initialization-order
bug: ARCHETYPE_FOR_ROOT was declared after its first use in harness.test.ts.
Moved the mapping before the test blocks. No server gameplay change was required.
