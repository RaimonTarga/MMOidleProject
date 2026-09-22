# T3 Tundra class/frame 01 — run 01

## Scope and terminal status

The sealed run was launched once, in the prescribed order, with one worker and zero retries. Frozen verification passed. The dispatcher stopped on the first observation after a readback assertion; it preserved the attempted child artifacts and left the remaining 51 rows not-run. No repair, replay, skip-ahead, reseal, extra seed, or follow-on run was performed.

This is a partial operational record, not a completed gameplay experiment. The only attempted child reached its 600,000 ms window, but the dispatcher rejected the row before recording it as completed because the applied qualification readback differed in an absolute source path. Therefore the attempted child’s 42 kills are preserved evidence of what ran, not an accepted observation for comparison or balance conclusions.

## Frozen execution identity

| Field | Value |
| --- | --- |
| Experiment | `t3-tundra-class-frame-01` |
| Frozen source commit | `ce9ae8d14da009034996c055e3bfa5d96422e80d` |
| Source tree SHA-256 | `652607c303d600a4339eefef37c91d4ff72f857d614de69c3968fbe9faeaf132` |
| Hitboxes SHA-256 | `08bcc55633efe444d303c71977f7dcf87402157753af543e975e6c0c493afa83` |
| Packet manifest SHA-256 | `5615531632c9604c8fb8d3be41a13fa3e852d80ebea5ef1cd4277dd62af34aef` |
| Packet identity SHA-256 | `469ee9f90dd03caf160a99a2c91fb98ce6560b80f4a5ca37adc8f8dc889d9b5a` |
| Execution checkout | `D:/mmo-idle/t3-tundra-class-frame-01/source` |
| Packet | `D:/mmo-idle/t3-tundra-class-frame-01/packet` |
| Run root | `D:/mmo-idle/t3-tundra-class-frame-01/run-01` |
| Launch receipt | `D:/mmo-idle/t3-tundra-class-frame-01/packet/run-launched.json` |
| Fixture | `node-t3-tundra-03` |
| Seeds | `101009`, `101021` |
| Step / endpoints / cap | `100 ms / 300,000 and 600,000 ms / 600,000 ms` |
| Worker / retries | `1 / 0` |
| Synthetic / economy eligible | `true / false` |
| Launch receipt time | `2026-09-22T12:04:30.764Z` |

Squire Slam remained excluded. No A1 or substitute arm exists in the packet.

## Coverage reconciliation

| Count | Value |
| --- | ---: |
| Planned | 52 |
| Primary | 36 |
| Alternative | 16 |
| New completed | 0 |
| Reused | 0 |
| Failed | 1 |
| Omitted | 0 |
| Not run | 51 |
| Accepted combat observations | 0 |

`partial.json` is the terminal receipt. The failure row is the first ordered case, `t3-tundra-class-frame-01-striker-light-s101009-primary`; every later row remains explicitly `not-run`.

## Stopping failure and preserved evidence

The child process itself exited with status 0 and wrote a complete 600,000 ms artifact. Its raw summary reports `window-ended`, 42 kills, and no player death. The dispatcher then failed its qualification comparison with `Applied package drift`: the frozen run reported `sharedEntry` as `D:\mmo-idle\t3-tundra-class-frame-01\source\shared\src\index.ts`, while the zero-tick qualification receipt recorded the main-checkout path `C:\Users\osaif\Documents\Claude\Projects\MMO idle\shared\src\index.ts`. The live/base definition hashes and measured source commit remained equal; the absolute-path mismatch is nevertheless a failed readback under the sealed contract.

The exact external evidence directory is:

```text
D:\mmo-idle\t3-tundra-class-frame-01\run-01\t3-tundra-class-frame-01-striker-light-s101009-primary\artifacts\t3-tundra-class-frame-01-striker-light-s101009-primary-s101009
```

The enclosing PowerShell session exited nonzero after the dispatcher stopped. Its terminal output also included a pnpm `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` message; no second invocation was made. The durable `partial.json`, `results-summary.json`, child `process.json`, and `raw-inventory.json` are the authoritative preserved records.

## Findings

1. The sealed family stopped correctly at the first operational/readback failure: 1 failed row, 51 not-run rows, and no accepted gameplay observations.
2. The attempted child’s cap-length combat output cannot be promoted to a measured row because the required applied-package readback failed; it must not be used as a class, frame, weapon, or sustain comparison.
3. Two fixed seeds, synthetic mature ownership, and an unstarted matrix provide no basis for acquisition, economy, live-player, probability, or universal-balance claims.

## Decisions

1. Preserve this partial publication and the external raw artifacts as the terminal result of this packet.
2. Do not rank or tune any class, frame, weapon, ability, charm, or Guard from this run; the excluded Squire Slam question remains excluded.
3. Do not repair or replay this packet. Any future investigation of the path-sensitive readback requires separate authorization and a newly sealed execution packet/root.

## Evidence limits

- No primary or alternative pair completed, so no matched comparison is available.
- Death-shortened rates, caps, no-contact intervals, and post-death endpoints are not present in accepted rows.
- The run is synthetic and `economyEligible=false`; it is not acquisition, economy, or live-play evidence.
- Full-suite validation, browser/live playtesting, deployment, and automatic follow-on work were not performed.
- Raw event/sample histories remain external. This repository directory contains only the required compact publication files.
