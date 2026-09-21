# Player breadth 01 — partial run

This is the preserved publication for the sealed player-breadth-01 packet. The exact 204-case run completed sequentially once and returned exit code 1 because every farm child hit a local frozen-checkout assertion. No retry, source change, reseal, extra seed, or adaptive treatment was performed.

## Execution status

- Scheduled: 204 cases.
- Valid completed boss cases: 102.
- Farm local failures: 102 (T2: 18, T3: 21, T4: 54).
- Unrun cases: 0.
- Boss outcomes among completed cases: 83 boss kills, 10 bot deaths, and 9 censored caps.
- Boss kills by tier: T2 15/18, T3 10/21, T4 50/54.

The packet-level verify passed. The sealed execution source identity is commit `5024be692d8a1854b7f61e007d371f2ee9aab46b`; the publication checkout is its publication-only descendant `c157f5ed2b1d865d65177cbf611f872151e81213`, with matching sealed source bytes, runtime, and hitboxes. Farm children run through `server/scripts/ttkSurvey.ts`, which requires the exact sealed revision and rejected the descendant (`actual c157f5ed2b1d865d65177cbf611f872151e81213`, `expected 5024be692d8a1854b7f61e007d371f2ee9aab46b`). The failure is retained as local process evidence; the source was not altered to bypass it.

## Reconstruction-r1 screening

The nine matched Conduit reconstruction-r1 boss pairs used the packet seed and completed normally. Candidates produced 8/9 boss kills versus 3/9 controls. This is a single-seed matched screening result, not probability evidence or treatment adoption; the farm arm was unavailable, so no farming conclusion is drawn.

## Evidence map

- [results.json](results.json) — publication contract result rows, terminal status, findings, and alternative ledger.
- [diagnostics/outcome-summary.json](diagnostics/outcome-summary.json) — outcome and failure counts.
- [diagnostics/farm-failure-excerpts.jsonl](diagnostics/farm-failure-excerpts.jsonl) — representative preserved farm assertion excerpts.
- [diagnostics/boss-terminal-excerpts.jsonl](diagnostics/boss-terminal-excerpts.jsonl) — representative boss terminal evidence.
- [diagnostics/conduit-summary.json](diagnostics/conduit-summary.json) — Conduit control/candidate screening summary.
- [diagnostics/pair-comparison.json](diagnostics/pair-comparison.json) — matched reconstruction pair comparison.
- [diagnostics/source-policy.json](diagnostics/source-policy.json) — source identity and exact-revision boundary.
- [packet/identity.json](packet/identity.json), [packet/manifest.json](packet/manifest.json), [packet/seal.json](packet/seal.json) — sealed packet identity and seals.
- [launcher-results.json](launcher-results.json), [launcher-partial.json](launcher-partial.json) — launcher-level completion and failure accounting.
- [raw-artifact-inventory.json](raw-artifact-inventory.json) — complete inventory and hashes for all 1,153 local raw artifacts.

Caps are censored at the packet duration and are not kills. This run does not establish treatment adoption, full player breadth viability, average-player accessibility, farming throughput, or browser/live-playtest behavior. No follow-up packet is proposed by this publication.
