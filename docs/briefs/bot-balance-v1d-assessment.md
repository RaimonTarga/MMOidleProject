# V1d assessment and transition to encounter evidence

2026-09-13. Astra accepts [V1d](bot-balance-v1d-report.md) as one successful
earned preparation and natural transit-recovery qualification. The manifest
hash, terminal state and final readiness events agree. All 105 steps completed
in 18m42s, including GM30, the four +5 pieces, and the exact build. A Forest
death recovered through Clearing/Swamp to the Plains supplier. This closes the
observed preparation boundary; it does not establish universal travel safety.

## What should have been inherited earlier

| Historical finding | Current check / consequence |
|---|---|
| September 5 postmortem explicitly deferred Clearing arrival/death-replanning investigation | This should have been a prerequisite regression before V1a. V1d now supplies runtime recovery evidence; executor corpse/live/attacker regressions remain in preflight. The older leased-path defect is not asserted to be identical. |
| August 26 handover documented lost altar activation after death | Current `doAttemptBoss` retains bounded `emitUntil`, checking dungeon status or authoritative clear. Do not replace it with a fire-and-forget intent. |
| Prior guardian deaths and boss counters were confounded | V1e requires separate approach, guardian, activation and actual boss-engagement evidence. One authored cycle is not necessarily one boss fight. |
| Prior wrong-build and invalid-checkpoint runs | Exact snapshot hash, root-only T1 conversion, offline legality, live spawn validation and final equipped/build assertions precede the encounter. |
| Prior repeated preparation exhausted encounter budgets | Reuse V1d's final earned state; no fresh Clearing-to-GM30 route. The new 15-minute ceiling is for import validation, one affordable charm swap and the dungeon cycle. |
| Prior toxic-pool avoidance gap | Dynamic ground-zone avoidance exists in current server path motion. This is not a fresh Swamp validation and is not evidence about the Plains encounter. |

Sources: [September 5 postmortem](t1-economy-cohort-postmortem-2026-09-05.md),
[August 26 handover](bot-t1-testing-handover-2026-08-26.md), current executor and
server path-motion source. Historical results guide tests; they are not silently
pooled with the current campaign. No further preparation-only run is planned.

## Earned entry and boss candidate

V1d's final `snapshot-b.json` retains its legacy `tier2-handoff` label. Its actual
state is T1/root-only and was previously rejected by the T2 importer. The new
explicit T1 path accepts only final, root-only, pre-boss state, preserves earned
progression/items/build/wallet, and spawns at Clearing with reset transient combat
state. T2 behavior remains the default. This is an isolated reconstructed
character, not continuation of V1d's live world or an exact combat replay.

V1e uses Chaotic Axe +5, Plains Vest +5, Plains Stone +5, Fleet Boots +5,
Sweep and Second Wind, and the existing five movement/hazard/recovery rules
(19/22 RP at GM30). No frame, stance, Rite, Core or Relic.

The charm choice was reviewed after the user's question. Plains Stone +5 has
2 Recovery and activates 30% of total Recovery for four seconds on a player
kill; subsequent kills refresh rather than stack. Murk Eye +5 has 3 Recovery
and activates 30% for four seconds every eight seconds. Plains Stone is a
plausible add-pressure alternative, not a proven winner: add kills must sustain
its window. Razorback repeatedly summons slimes and adds a larger wave at 50%
HP. Sweep is intended to clear these while Plains Vest's plating addresses
multiple small hits. Second Wind supports gaps between kill windows.

V1d already owns Plains Stone +2 and 10,601 yellow essence. V1e upgrades it
through ordinary acknowledged intents to +5 and equips it before the final
build marker. No injected resources or acquisition route is needed. Report
actual costs and final stats. Preserve Murk Eye as an available future candidate;
do not run an automatic A/B or claim the charm improved outcomes without data.

## Validation boundary

Frozen implementation: `40f0ebb7dd0f4c557a640f974388823d8ef713f1`.
The actual V1d final snapshot passes 112 offline profile checks. A permanent
fixture verifies authoritative server reconstruction of its 164 max HP, earned
equipment, wallet and ordered rules. Tests reject an early Snapshot A, frame
injection, post-boss state and non-Clearing T1 spawn. Live network restoration
is the first gate of V1e; failure there invalidates entry and stops the run.

Final validation: `pnpm typecheck` passed, including benchmark typechecking;
`pnpm test` passed 192/192; `pnpm bot:preflight` passed in a clean detached
checkout of `40f0ebb7`. The one-run/900,000 ms creation options also passed a
pure run-plan check without creating Docker resources or characters. Preflight
initially exposed the synthetic-T2-only route-test assumption and then a
CommonJS fixture-path mismatch; both were repaired before the final passing
checks. No runtime boss result is implied by these checks.

See [V1e's operator packet](bot-balance-v1e-operator-packet.md) for the exact input,
execution limits and encounter evidence. No experiment is launched by Astra.

## Preserved infrastructure

After verifying V1d's terminal state and exact Docker ownership, Astra stopped
and disconnected only its PostgreSQL/Redis services and removed the empty
experiment network. Containers, database volumes and artifacts remain preserved.
Receipt: `v1e-network-preparation.json` in V1d's experiment directory. A temporary
network create/remove verified capacity. Restore those old services only with a
new isolated network and their original `postgres`/`redis` aliases; V1e instead
imports the sealed snapshot file into a new isolated experiment.
