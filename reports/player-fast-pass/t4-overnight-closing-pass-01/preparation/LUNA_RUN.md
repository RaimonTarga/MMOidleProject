# Luna runbook — T4 overnight closing pass 01

Preparation only; no combat has run. Execute once only when the user assigns overnight execution. Read BRIEF.md for the complete reporting and decision contract, CATALOGUE.md for package choices, and SOURCE_COMPARISON.md for provenance. The run command below has not been exercised with combat during preparation.

## Frozen paths

- Execution checkout: `D:/mmo-idle/t4-overnight-closing-pass-01/source`
- Execution SHA: `056b5cd66c2f6aeccca840265a0cbce30a2a77f3`
- Gameplay baseline: `5b81ddf5f5ed1099ea9e282ed4b9eb9946fc20eb`
- Packet: `D:/mmo-idle/t4-overnight-closing-pass-01/packet`
- Qualification: `D:/mmo-idle/t4-overnight-closing-pass-01/qualification`
- Receipt replay: `D:/mmo-idle/t4-overnight-closing-pass-01/receipt-check`
- Reserved fresh combat output: `D:/mmo-idle/t4-overnight-closing-pass-01/run-01`
- Hitboxes: `D:/mmo-idle/t4-overnight-closing-pass-01/hitboxes.json`
- Node: `v22.16.0`
- Publication checkout: `D:/t4c1pub`
- Publication branch: `codex/t4-overnight-closing-pass-01-packet`
- Morning destination: `reports/player-fast-pass/t4-overnight-closing-pass-01/run-01/`

Do not install, build, edit, normalize, checkout, reseal or publish inside the execution checkout. Receipt identity includes its absolute path. A new host/path is a new preparation decision. Control/candidate are inherited aliases for the same source, not numerical treatments.

## Verified preparation commands — already executed, do not repeat

```powershell
Set-Location D:/mmo-idle/t4-overnight-closing-pass-01/source
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/t4-overnight-closing-pass.mjs --mode=prepare --packet=D:/mmo-idle/t4-overnight-closing-pass-01/packet --control=D:/mmo-idle/t4-overnight-closing-pass-01/source --candidate=D:/mmo-idle/t4-overnight-closing-pass-01/source --hitboxes=D:/mmo-idle/t4-overnight-closing-pass-01/hitboxes.json
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/t4-overnight-closing-pass.mjs --mode=qualify --packet=D:/mmo-idle/t4-overnight-closing-pass-01/packet --out=D:/mmo-idle/t4-overnight-closing-pass-01/qualification
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/t4-overnight-closing-pass.mjs --mode=receipt-check --packet=D:/mmo-idle/t4-overnight-closing-pass-01/packet --out=D:/mmo-idle/t4-overnight-closing-pass-01/receipt-check
```

## Execute once after assignment

Read-only verify may be repeated. Stop if it fails. The actual supported run branch uses the same source, child argv and receipts checked by qualification; no combat pilot was allocated.

```powershell
Set-Location D:/mmo-idle/t4-overnight-closing-pass-01/source
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/t4-overnight-closing-pass.mjs --mode=verify --packet=D:/mmo-idle/t4-overnight-closing-pass-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/t4-overnight-closing-pass.mjs --mode=run --packet=D:/mmo-idle/t4-overnight-closing-pass-01/packet --out=D:/mmo-idle/t4-overnight-closing-pass-01/run-01
```

Run in one durable supervised terminal. Do not launch a second dispatcher or clear launch markers. Each child has a process.json and process.log; the output root refreshes results-summary.json, resolved-builds.json, raw-inventory.json and PARTIAL.md after observations. At termination read complete.json or partial.json and reconcile all counts. No automatic reruns or repairs.

## Queue and limits

460 planned lives = 432 primary + 28 optional. Primary rows are first. Seed 101009 covers all four contexts before 101033; within each seed, each 54-case pass reaches every path once, rotating context/root/frame/path offsets. Optional one-field contrasts form a fixed tail. ORDERED_CASES.tsv and manifest.json are authoritative. There are seven alternatives; Idolwright's optional contrast is omitted, not reassigned.

100 ms World steps. V/T/D run one continuous life to 1,200,000 ms with 300,000/600,000/1,200,000 ms endpoints; M uses the native T4 Titan script with a 300,000 ms cap. First owner death ends a life. Boss authoritative kill and simultaneous outcomes are preserved. No revival, refill, precharge, target reset, shopping, level-up package, reseed, extended cap, replacement fight or Wasteland/Trench observation.

The manifest seals an eight-wall-hour soft scheduling deadline. The dispatcher checks it before starting each observation, finishes the current observation, and records an honest partial if the next would start after the deadline. There is no deadline CLI flag. Startup verification precedes the saved launchAt; wallElapsedMs includes supervised execution and artifact work after launchAt. Stop early if the queue finishes; do not pad the night.

One child; 5 GiB disk floor; 1 GiB host free RAM; 2 GiB child RSS; 5-second polling; 120-second advancing-heartbeat bound; zero retries. Valid gameplay death continues. A family operational failure blocks its affected family; source/runtime integrity failure stops shared work. Report failed and not-run rows. A partial exit is not authorization to replay.

## Morning decision bundle

Publish one REPORT.md, compact results-summary.json, PATCH_PROPOSALS.md, source/manifest/applied-build/completion receipts, and external raw inventory. Include a 54-path × four-context map and per-seed outcomes. All 54 paths receive one provisional disposition: leave unchanged, credible niche/tradeoff, buff candidate, nerf candidate, setup advice needed, or implementation issue. For not-run rows, record the operational reason and a bounded disposition without inventing combat evidence.

Separate survival from useful work. Use cumulative endpoint kills and per-life 0–5/5–10/10–20-minute rates; post-death endpoints are null. Partial lives retain lifetime duration/work and must not be ranked as sustainable winners. Do not pool fixtures or survivor-only rates. HP damage and absorption stay separate; include first kill, unfinished targets and progress gaps. See HISTORICAL_STALL.md before interpreting survival with negligible output.

Boss results need authoritative kill/time, remaining HP if unsuccessful, owner danger and actual response opportunity/delivery. Identical seed-labelled boss outcomes are duplicate scenario evidence. Conduit evidence should separate owner/summon casts, defaults/Runes, interruptions, formation availability, loss of only body, replacement affordability and owner HP payments. Do not multiply useful damage by body count or infer numerical causality from payments alone.

Read existing farm summaries, target histories, samples, sustain transitions, Conduit events and Desert/Guard records for selected outliers. These are bounded observations, not exact causal Heat attribution. Heat and engagement trajectories do not prove why a changed route helped. Missing stack-loss telemetry narrows inference. No per-tick model narration or new telemetry project.

Use historical-context.json and LOADOUT_CHANGES.md; changed kits are whole-package comparisons, not class-coefficient ablations. Compare equal windows. The original reports remain on their original publication branches. Missing historical totals must stay unavailable or be read from the referenced existing raw summary, not converted to zero.

At most eight priority numerical proposals, fewer if supported. Each needs stable path ID, actual production file/key and consumer, current/proposed value, inheritance scope, evidence/counterexamples, why the cause is class balance rather than setup/implementation/exceptional content, expected tradeoff/risk and focused regression. Label new numerical candidate untested, previously tested, or already adopted. Never adopt a patch or edit the measured checkout. Any unmerged proposed diff belongs outside it and must be selective.

Volcano is a shared-pressure watch item. Broad failures call for a bounded encounter/designer decision, not dozens of unrelated class buffs or mandatory Wait It Out. Wasteland stays excluded. T2 Plains opening, T3 Jungle/Volcano entry and T3 Apprentice Volcano finisher remain held over, neither tested nor cleared tonight. A future 24–48-life focused confirmation is a proposal for separate assignment, not tonight's second run.

New unexplained weak setups require exact loadout/rules/RP/symptom advice in the morning; do not start an autonomous rescue search. Idolwright's revised direction was already approved in preparation. No full-suite repair, automatic patch merge, deployment, release or force-push.

## Publish and stop

Work in D:/t4c1pub and preserve unrelated changes. Add only the new morning report folder. Keep bulky JSONL external. Include .gitattributes with `* -text`, hash/JSON-check compact artifacts, and validate the staged allowlist with `git -c core.whitespace=cr-at-eol diff --cached --check`. Commit and push to the existing publication branch. Verify remote SHA with git ls-remote and retrieve REPORT.md from the fetched remote ref to check its content/hash.

Publication failure never authorizes combat replay. Return measured SHA, publication SHA, branch, report path, planned/primary/alternative/completed/gameplay-dead/failed/omitted/not-run counts and actual wall time. Stop after this decision bundle.
