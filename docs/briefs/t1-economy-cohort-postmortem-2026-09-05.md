# T1 Economy Cohort Postmortem — 2026-09-05

## Status

The session is closed. Replicate 03 was not launched. No bot, gameplay, server, or balance fixes were made during the final batch. All run artifacts were preserved.

## Executive summary

The session required several iterations because live preflight exposed over-locking, stale combat state, transit watchdog timing, permit cancellation/lifetime issues, and telemetry classification gaps. The bot-side changes passed deterministic validation and improved isolation, but live validation still exposed a transit-liveness failure around `node-clearing`.

## Final run disposition

| Run | Outcome |
|---|---|
| Replicate 01 | Apprentice, Spirit, and Striker completed cleanly. Squire completed with contamination. Conduit stalled with contamination. Slinger stalled cleanly. |
| Replicate 02 | Spirit completed A/B but was contaminated. Conduit and Striker stalled in protected transit. Apprentice, Slinger, and Squire were interrupted after progress froze during the server restart/stop. |
| Replicate 03–05 | Not launched. |

Overall, 12 of 30 planned route slots were attempted. No complete clean six-route replicate was achieved.

## Remaining transit stalls

| Route | Stall record | Isolation evidence |
|---|---|---|
| Striker | Forest-04 → Forest-05; `reserved transit blocked`; timed out waiting to arrive at `node-clearing`; 27 acquisitions / 27 releases | 0 shared admissions; 0 contaminating overlaps |
| Conduit | Forest-04 → Forest-01; `reserved transit blocked`; timed out waiting to arrive at `node-clearing`; 18 acquisitions / 18 releases | 0 shared admissions; 0 contaminating overlaps |

Both routes had repeated death and unsafe-transit replans, followed by substantial lease wait time. Balanced acquisition/release counts and the absence of shared combat rule out an obvious lease leak or unsafe fallback. The remaining failure is best classified as a transit-liveness or arrival-acknowledgement problem at the clearing handoff; this is an evidence-based assessment, not a proven root cause.

## Stop condition and server state

The server briefly lost its health connection and then nodemon restarted it. After the restart, the active route event streams stopped advancing, so continuing would not have met the requirement that bots be genuinely progressing. The batch was stopped at that point.

Final verification: server healthy with `status=ok`, `players=0`, `monsters=8`; no cohort bot processes remained.

## Deferred follow-up

Any future work should first isolate the clearing arrival handshake and its interaction with death replanning/transit-death budgets, then inspect the restart trigger before another live cohort. No follow-up execution was performed in this session.

Evidence: [T1 economy cohort artifacts](../../bot/runs/t1-economy-final-2026-09-05-clean-cohort-r2/).
