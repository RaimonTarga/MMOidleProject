# Luna handoff - class balance candidate 01

Prepared for a later assigned run: **56 fresh observations, 28 adjacent pairs, zero combat launched**. Read `BRIEF.md`, `README.md`, and `ENCOUNTER_REVIEW.md`. Do not create new builds, change values, or treat the review as authorization for strategy runs.

Control SHA `dd2c06f2bca8380323bdcfe2f65add2d7d51989d`; candidate SHA `5ffbfb414b62d3addc8cb485d5b149b14e7de7ca`. Execution roots are `D:/mmo-idle/class-balance-candidate-01/control` and `/candidate`. Keep both HEADs fixed. Final packet is `D:/mmo-idle/class-balance-candidate-01/packet-r2`; qualification is `D:/mmo-idle/class-balance-candidate-01/qualification-r2`. Publication checkout is `D:/cbc1pub`, branch `codex/class-balance-candidate-01`. Do not execute from publication.

The actual child launcher already qualified all 56 cases with zero World ticks, using each arm's final checkout. Qualification is not a combat run; do not repeat it or use the superseded original packet. `verification.json` checks the intended cross-arm differences while preserving full within-arm receipt equality. The single-source `sourceCommit` compatibility field in dispatcher lifecycle files names its last active source; use the two sealed identity contracts and each case's sourceCommit for treatment provenance.

Verified read-only preflight and the **unexecuted** one-shot run command:

```powershell
Set-Location 'D:/mmo-idle/class-balance-candidate-01/control'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/class-balance-candidate.mjs --mode=verify --packet=D:/mmo-idle/class-balance-candidate-01/packet-r2
if ($LASTEXITCODE -ne 0) { throw 'Frozen verification failed; stop and preserve evidence.' }
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/class-balance-candidate.mjs --mode=run --packet=D:/mmo-idle/class-balance-candidate-01/packet-r2 --out=D:/mmo-idle/class-balance-candidate-01/run-01
```

One child at a time. The command dispatches both sources in sealed ledger order. Normal 100ms steps; first player death or authoritative boss kill ends the life. No retry, pilot, extra seed, cap extension, loadout adaptation or altered candidate. An existing output/run marker forbids relaunch. Gameplay deaths are results and the ledger continues. An operational failure stops the affected common farming family or boss species; source/receipt drift stops rather than being repaired. Preserve partial data and not-run rows. Retain null post-terminal windows.

Inherited watchdogs: 5GiB disk minimum, 1GiB free host RAM, 2GiB child RSS, 5s checks, 120s advancing-heartbeat limit. Boss runner also has its existing wall ceiling. Watch compact `PARTIAL.md` and `results-summary.json` at milestones/exceptions. Save each completed case; raw event streams remain external. Publication failure never permits replay.

## Required publication

Write `reports/player-fast-pass/class-balance-candidate-01/run-01/REPORT.md`, compact per-case and paired tables, source/build/initial-state receipts, completion counts and verified raw-inventory references. Report control/candidate and publication full SHAs. Commit **and push** only scoped compact artifacts to the publication branch; verify remote ref and intended file availability. No merge, force-push, release or deployment.

Spirit: pair useful work, 0-5 and 5-10 minute farm intervals from endpoint `work.kills`, lifetime kills separately, owner HP/barrier, death time, boss kill/time/progress and plate/charge counterexamples. Missing overkill attribution stays missing. Do not interpret the authored percentage-point decrease as the same percentage final DPS decrease.

Conduit: retain `conduit.json` plus formation/replacement/payment streams. Compare no-summon and at/below-half-authored-offense time, actual landed HP progress, completed and late-window work, replacements/HP payment, safety-floor stalls and owner deaths. Normalize unequal exposure; more replacements alone are not success. HP, authored offense and payment ratio are unchanged.

Check N1/N2 for identical deterministic matched outcomes after ignoring declared provenance/name changes. Investigate unexplained divergence narrowly; do not run more fights. T1 Spirit and framed Conduit are supported by readbacks, not a universal combat census. T4 gameplay remains unmeasured. Do not pool heterogeneous fixtures into a class ranking or treat two seed labels as guaranteed independent boss realizations.

End with separate S/C proposed patches: exact old -> tested values, paired effects and counterexamples, adopt tested value / revise once / reject, affected scope and remaining risk, and **tested candidate only; awaiting designer approval**. Any new suggested number is untested and must not be auto-run. Do not postpone the two decisions for a follow-on encounter campaign.
