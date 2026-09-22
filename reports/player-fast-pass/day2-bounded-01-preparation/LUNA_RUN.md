# Luna handoff — Day 2 bounded comparison

**Prepared, zero-tick qualified, NOT launched. Run only when assigned execution.** The attached BRIEF.md is preparation input; its execution/publication instructions have not been performed. Allocation: **24 new observations + 16 reused controls = 40 cells**. No extra pilots, seeds, retries or extensions.

Control/B source: `61c12e67cc023c61cff6498fd2e799b3f6b55d50`, checkout `D:/mmo-idle/day2-bounded-01/control`.
Candidate source: `f021845bd18f43c032e8044a60af071868000e80`, checkout `D:/mmo-idle/day2-bounded-01/candidate`, branch `codex/day2-session-candidate`.
Historical B controls retain measured source `e26fdccd3baaa96fe1d19263349d57d9c5abc626`; never relabel these as new measurements.

Read README.md, CANDIDATE.md, ORDERED_CASES.tsv and the qualification receipts. Only the three packets under `D:/mmo-idle/day2-bounded-01/sealed/` named below are authoritative. Earlier preparation packets/qualifications outside these paths are superseded and unrun. Do not reseal, requalify, change either checkout, install dependencies, or apply R2 again.

## Exact commands

Run B first. A blocker must not prevent B. Each `run` command is issued **once**; a live shell session means await that session, not launch again. Existing run marker/output means stop and inspect. These verify/qualify paths have passed; combat commands are intentionally unexecuted.

```powershell
Set-Location 'D:/mmo-idle/day2-bounded-01/control'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=day2-bounded-01 --family=B --mode=verify --packet=D:/mmo-idle/day2-bounded-01/sealed/packet-B
if ($LASTEXITCODE -ne 0) { throw 'B verification failed; stop B.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=day2-bounded-01 --family=B --mode=run --packet=D:/mmo-idle/day2-bounded-01/sealed/packet-B --out=D:/mmo-idle/day2-bounded-01/run-01/B
```

Record B's exit and terminal receipt. Operational failures stop B; gameplay deaths continue. Then execute A independently. A-control failure stops both A arms, but does not invalidate B.

```powershell
Set-Location 'D:/mmo-idle/day2-bounded-01/control'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=day2-bounded-01 --family=A-control --mode=verify --packet=D:/mmo-idle/day2-bounded-01/sealed/packet-A-control
if ($LASTEXITCODE -ne 0) { throw 'A verification failed; stop A.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=day2-bounded-01 --family=A-control --mode=run --packet=D:/mmo-idle/day2-bounded-01/sealed/packet-A-control --out=D:/mmo-idle/day2-bounded-01/run-01/A-control
if ($LASTEXITCODE -ne 0) { throw 'A control failed operationally; omit A candidate.' }
Set-Location 'D:/mmo-idle/day2-bounded-01/candidate'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=day2-bounded-01 --family=A-candidate --mode=verify --packet=D:/mmo-idle/day2-bounded-01/sealed/packet-A-candidate-final
if ($LASTEXITCODE -ne 0) { throw 'A candidate verification failed; stop A.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --trial=day2-bounded-01 --family=A-candidate --mode=run --packet=D:/mmo-idle/day2-bounded-01/sealed/packet-A-candidate-final --out=D:/mmo-idle/day2-bounded-01/run-01/A-candidate
```

The existing dispatcher runs one production-backed ttkSurvey child per new observation. A: four matched pairs, 100 ms steps, 300,000 ms cap, seeds 101003/101009, original Defensive Conduit and Offensive Slinger, Tundra-03. B: sixteen matched pairs, 100 ms steps, 1,800,000 ms cap, seeds 101009/101021, same-life 5/15/30-minute endpoints. All stop at first death. Sixteen sealed B controls are copied with status `reused`, their original evidence directories and measured source; no control child runs. A correction is absent from both B arms.

Watchdogs: one child, at least 5 GiB disk and 1 GiB host RAM, at most 2 GiB child RSS, 120 seconds without advancing heartbeat. No advancing-run wall cap. Source/manifest/child/readback failure stops the affected family; preserve partials and do not repair/retry.

## Evidence and publication

Each family writes `results-summary.json`, `resolved-builds.json`, `raw-inventory.json`, `PARTIAL.md`, and `complete.json` or `partial.json`. New detail lives at `<output>/<case>/artifacts/<case>-s<seed>/`. A adds `session-events.jsonl` and compact `summary.json.sessions`; B reuse points to the retained overnight raw root. Keep all histories external.

Write one readable `reports/player-fast-pass/day2-bounded-01/run-01/REPORT.md`, at most five findings and three decisions. Include all 20 matched comparisons and serious counterexamples; new/reused/failed/omitted/not-run counts separately; each row's source, package, arm, seed, fixture and artifact reference. Missing post-death endpoints are null. Distinguish HP progress from absorption, shield reinitialization from ordinary cadence, and genuine target-ID changes from repeated setter calls. Mark no relevant shield engagement as unexposed. Lifetime kills do not establish late-window progress; show gaps and intervals. Source-specific effective healing/overheal remain unavailable.

A success requires eliminating the demonstrated false refresh while retaining real resets, with restored supported HP progress. A need not match Slinger throughput. Hold A adoption for command-center review. For each B comparison, recommend only the named package for tested settings if work and survival improve without serious opposing regression; otherwise identify the remaining mechanism and at most one prospective correction. No automatic third variant, class multiplier, deployment or new campaign.

Under the execution assignment, publish from `C:/Users/osaif/Documents/Claude/Projects/MMO idle`. Explicitly stage only the compact result/report directory and this preparation directory if needed. Preserve historical report bytes and unrelated untracked stance/sustain files. Commit **and push** through the current normal branch/upstream; also push `codex/day2-session-candidate` to retain the measured candidate commit, without merging it into production. Verify remote branch SHAs contain the publications and fetch/read the report from the remote ref. Return branch(es), publication SHA, all measured SHAs, report path and counts. Publication failure never authorizes combat reruns. Finish and stop.
