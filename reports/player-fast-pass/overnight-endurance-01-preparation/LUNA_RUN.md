# Luna run handoff — overnight endurance 01

Preparation only. Main campaign NOT launched. Execute only when assigned the overnight run. The attached brief supplies the experiment design; its instruction to Luna to run and publish is the later execution task, not an action already performed during preparation.

Execution SHA: **e26fdccd3baaa96fe1d19263349d57d9c5abc626**.
Fixed checkout: `D:/mmo-idle/overnight-endurance-01/source`.
Authoritative packet: `D:/mmo-idle/overnight-endurance-01/packet`.
Qualified receipt root: `D:/mmo-idle/overnight-endurance-01/qualification`.
Reserved NEW main output: `D:/mmo-idle/overnight-endurance-01/run-01`.
Publication checkout: `C:/Users/osaif/Documents/Claude/Projects/MMO idle`.
Publication directory: `reports/player-fast-pass/overnight-endurance-01/run-01/`.

Read README.md, CONDUIT_DIAGNOSIS.md and BRIEF.md. The authoritative packet files are mirrored under packet/ for review. Use the D: packet for commands. Do not prepare/reseal, repeat qualification, move the fixed checkout, install new dependencies, switch HEAD, or substitute the publication checkout. Verification must pass before run. Existing launch marker or output means stop and inspect, never retry.

## Exact verify and run commands

```powershell
Set-Location 'D:/mmo-idle/overnight-endurance-01/source'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --mode=verify --packet=D:/mmo-idle/overnight-endurance-01/packet
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; preserve evidence and stop.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/overnight-endurance.mjs --mode=run --packet=D:/mmo-idle/overnight-endurance-01/packet --out=D:/mmo-idle/overnight-endurance-01/run-01
```

The second command is the only campaign launch. Allow the dispatcher to finish; a shell-tool session still running is not a failed command. Do not launch it again. Use the shell session to await completion with bounded waits; inspect compact PARTIAL.md/results-summary.json at seed-block boundaries or operational exceptions, not every tick or case. No model reasoning per observation. There is no overnight clock target to fill.

The dispatcher starts one direct Node child at a time with a file-URL tsx loader, production development-condition imports, exact revision/source contract/hitboxes, one sealed cell, and the cell's real seed. It uses the existing ttkSurvey farm World. Cases are ordered in manifest.json and ORDERED_CASES.tsv: 288 A + 48 B = 336. No optional C combat. Each life runs continuously to first death or 1,800,000 ms at 100 ms steps, with 300,000/900,000/1,800,000 ms cumulative checkpoints. No replenishment, reset, forced rest, refills, R2 overlay, retuning, extra seeds, or retries.

Watchdogs: one child; 5 GiB minimum free on the output disk; 1 GiB minimum host free RAM; 2 GiB maximum child RSS; 5-second polls/child heartbeat; stop after 120 seconds without advancing simulation heartbeat. There is no per-observation absolute wall ceiling for an advancing simulation. Qualification updates its zero-tick index instead. A shared operational/source/readback failure stops this entire ordinary-farm family, preserving partial output. Deaths and caps continue. A watchdog/process failure is operationally censored, never a player death. Do not repair or reseal while unattended.

## Evidence and report

The dispatcher writes results-summary.json (one row per planned observation), resolved-builds.json after every case, the full manifest/source identity, a compact PARTIAL.md table, a hashed raw-inventory.json and complete.json or partial.json. Each case records process argv/status/log; child artifacts are under `<case>/artifacts/`, with ready/summary/checkpoints and streams under `<case>/artifacts/<case>-s<seed>/`.

Raw events, samples, Conduit events/snapshots, and sustain transitions are streamed externally. Conduit summary events/snapshots arrays are empty by design; use the named JSONL files, not empty arrays as evidence of no attacks. Original synchronous damage-delivery, lives and recovery episodes remain in the external conduit.json. Full target histories and recovery episodes remain in external summary.json. No raw per-tick arrays belong in the compact publication.

Use endpoints and intervals to report 5/15/30-minute survival/work by identity, fixture and seed. Missing later windows after death are null, not measured zero combat. Endpoints are repeated measurements from the same life, not replications. Existing event/death times label the 100ms tick start; endpoint snapshots follow completed steps. Late-window rates require their surviving denominator. Preserve both seeds and ranges, no pooled tier list or rare-death probability. A surviving row with no useful HP progress is a stall, not productive farming. Absorption-only target contact is not HP damage. Explain initial-roster hash coincidences if present; do not reseed them.

For each of the 48 matched charm pairs show both outcomes, total completed work, 0–5/5–15/15–30-minute intervals, including Mountain wins. Keep all equipment/stat/mechanic differences in the interpretation: lost barrier, flat Recovery and continuous/on-kill access. Use actual used/free RP and mature mastery gates from receipts; this is not an acquisition/economy claim. Source-specific effective healing, overheal and hypothetical damage lost remain unavailable. Do not reinterpret alive Conduit offense weights as delivered DPS or paid reconstruction as harmless.

Write REPORT.md beginning with a short answer, at most five prioritized findings and three actionable decisions. Include coverage/omissions, substantial attrition/delivery/owner/encounter failures, Conduit diagnosis-only disposition, exact planned/completed/failed/not-run counts and proposed adoption/build-reference decisions. No automatic adoption or next experiment. PARTIAL.md is an operational table, not the required morning report. If a process stops before a terminal receipt, reconcile that started case from process/heartbeat/failure files and record the intervention; never silently call it unstarted or complete.

## Scoped publication after execution

Use the publication checkout, leaving execution HEAD untouched. Preserve unrelated worktree edits. Copy only compact manifest/identity/seal/qualification references, results-summary.json, resolved-builds.json, completion or partial receipt, raw-inventory.json and the written REPORT.md into the publication directory. Inventory paths must point to the retained D: raw files; recompute hashes before publishing and include a publication receipt recording measured SHA and source digest. The prep packet, ORDERED_CASES.tsv and CATALOGUE.md provide build/identity references.

The prior sustain report is still external at `C:/Users/osaif/AppData/Local/mmo-idle/fu01-data/run-01/REPORT.md`, with compact evidence alongside it. If still unpublished, copy its report and compact evidence to the separate `reports/player-fast-pass/farming-sustain-01/run-01/` path and label it as prior 300-second/seed-101003 evidence. Its historical raw files were rehashed during preparation; it does not gate this run. Do not copy the old raw streams or untracked stance run wholesale.

Commit AND push the explicitly staged report/publication files under the execution assignment. No force push, history rewrite, unrelated staging or deployment. Preparation commits are local ancestors; retain their R2 lineage instead of substituting an older remote checkout. Inspect current branch/upstream before the normal push. Verify the remote branch SHA contains the publication commit and REPORT.md exists there. Return the branch, publication SHA, repository report path/link, measured SHA and actual counts, plus the report's substantive answer. A push error must be quoted with the readable local report linked; local-only is not successful publication.
