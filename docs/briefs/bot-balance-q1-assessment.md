# Astra assessment of Q1

2026-09-12. Accepted: configuration/acquisition readiness succeeded for all six
cases. No balance change warranted. Evidence: operator report plus direct inspection
of six raw `events.jsonl` streams and matching experiment.json SHA256
`ca4ac44c2de103cf5329e1ffeab3dc493d429380df2017605afa557cedcb560e`.

Each stream has three `build-change` events whose `detail.phase` is `verified`.
The post-Sweep farm durations are Striker 1 ms, Squire 1 ms, Apprentice 0 ms,
Slinger 1 ms, Spirit 1 ms, Conduit 1 ms. This confirms the report's evidence
boundary: no post-configuration farming sample, and no boss attempt.
Conduit's zero ability activations in its short preparation is not a defect verdict.

Next decision: Q2, same six profiles and Q1 gameplay with two post-build observed
windows. Increasing the level goal would not solve the problem robustly because
reward acceleration can overshoot another goal or reach the cap during acquisition.
Added an opt-in farm observation duration using ordinary networked state, leaving
existing farm conditions unchanged. It counts alive Auto-enabled time in the
target area and excludes large observation gaps. It does not equate Auto with
engaged combat. Existing deadlines, drift checks and no-progress guards remain.

Regression checks cover preparation overshoot, Auto-off time, death/missing gaps,
actual executor predicate wiring, and terminal assertion ordering. The frozen
revision is `06c0818ae1554c00ed9ab7e5b1cf96e87f000f31`; its server/shared gameplay
matches Q1. Concurrent workspace gameplay changes were not included. Frozen-source
pnpm bot:preflight PASSED in an independent detached checkout, including bot/server
typechecks, socket smoke, 18 entry validations, all configured preflight route tests,
new observation/executor regression and experiment tooling. Command-plan validation
resolved six runs, one worker and 300000 ms ceilings. No Q2 experiment was launched.

[Q1 report](bot-balance-q1-report.md) · [Q2 operator packet](bot-balance-q2-operator-packet.md)
