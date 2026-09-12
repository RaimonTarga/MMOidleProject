# Q2b assessment — Striker local observation accepted

2026-09-12, Astra. Accept Q2b as one successful Striker readiness case on
`755b2a3642a3a417f364f5fb8486e661bfc351b0`. This is functional observation,
not boss viability, class balance, reliability or natural progression evidence.

## Evidence checked

Experiment `20260912t170727z-striker-campaign-local-behavio`; raw artifacts under
`C:\Users\osaif\AppData\Local\mmo-idle\experiments\20260912t170727z-striker-campaign-local-behavio\runs\001-striker-campaign-local-behavior-t2-intended-r01\artifacts\striker-campaign-local-behavior-t2-intended-2026-09-12T17-10-12-409Z-aeedc982`.

Recomputed the manifest SHA256 and compared it with `experiment.sha256`:
`e44d88401a2f0dc0803dfc7876050333f2deec239f1378393537ac5d209e02a8`.
Recounted kills and activations inside raw route-step boundaries, inspected
verified builds and the final assertion, and checked node entries and deaths.

| Window | Start / end ms | Kills | Expected Technique | Second Wind |
|---|---|---:|---:|---:|
| Sweep / Offensive | 10,161 / 71,217 | 8 | 8 Sweep | 1 |
| Expose / Defensive | 74,229 / 135,306 | 5 | 6 Expose | 2 |

The only node entry was Plains-04 at 1,609 ms during preparation. There were
zero deaths. Both observation steps completed in place; the final assertion
passed. The operator records 668 ms of unsampled time at the Expose window's
tail; retain that limitation rather than calling the whole interval sampled.
Do not compare the two builds' kill counts as a controlled performance test.

Two corrections to the preserved [operator report](bot-balance-q2b-report.md):

- Its printed manifest hash omitted the final `8`; the actual manifest and
  sidecar match the complete hash above.
- Entry and Sweep have five Rune rules. Defensive has four, intentionally
  omitting Avoid Hazards, as both requested and observed in the verified event.
  RP totals 20/22, 20/22 and 19/23 remain correct. The report's statement that
  all three builds have five rules is inaccurate; there was no treatment mismatch.

## Decision

No bot or gameplay repair is indicated by this run. Keep the exact source and
templates, and qualify the other five class roots with one local case each.
Start with Conduit because its formation behavior has the largest remaining
observation gap, then Slinger, Spirit, Apprentice and Squire. Each is a separate
single-run experiment, created only after the previous case passes the packet's
explicit gate. A failure or unresolved result stops this sequence for Astra.

This is Q2c, a bounded expansion authorized by Astra's planning role; it does not
retroactively expand Q2b. No Striker repeat, boss attempt, automatic retry or
balance adjustment. All five routes already exist in the frozen revision.
The newer Bog Lurker work in `28090ede` is excluded; these results qualify only
the pinned source. Affected future encounters need review on their chosen source.

Fresh preparation checks: pure run-plan validation on the clean frozen checkout
confirmed five independent one-case plans, each one worker and 300,000 ms.
`campaignBehavior.test.ts` passed there, including the executor node regression.
Full `bot:preflight` passed for this exact revision during Q2b preparation and
is also reported by Luna; it was not rerun for this documentation-only expansion.
No experiment was created or launched by Astra.

Next: [Q2c operator packet](bot-balance-q2c-operator-packet.md). If all pass,
review first local boss candidates and their hazards before preparing V1.
