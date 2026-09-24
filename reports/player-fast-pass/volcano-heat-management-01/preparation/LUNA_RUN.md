# Luna operator handoff — Volcano Heat management 01

Status: preparation; execute only after assignment. Exactly 26 fresh lives maximum. One worker, fixed order, zero retries, no additional pilots, seeds, equipment, thresholds, classes, Wasteland/Desert rows or rescue arms. No deployment, merge to develop, or force-push. A valid death continues the queue; an operational fault stops it and preserves all remaining not-run rows.

## Frozen execution locations

- Candidate: D:/mmo-idle/volcano-heat-management-01/candidate at 25289e490d4bfb53dd440ba436a67f596e5b91c4.
- Baseline: D:/mmo-idle/volcano-heat-management-01/baseline at 268148d269b87311eaa1ae4b053baeb6571c747a.
- Both descend from current develop ce0d580f8be04683dd7c0ea23319c09ecf6d858f. Both carry identical observation support. Candidate alone carries the Manage Heat mode, UI, acquisition vetoes and focused tests.
- Packet: D:/mmo-idle/volcano-heat-management-01/packet.
- Fresh combat output: D:/mmo-idle/volcano-heat-management-01/run-01.
- Hitboxes: D:/mmo-idle/volcano-heat-management-01/hitboxes.json, hash in identity.json.

Do not move or reconstruct the checkouts: absolute shared-entry provenance is sealed in the readbacks. Do not build, install, fetch/reset source, edit files or reseal during execution. The repository preparation mirror is review material; the external packet is executable authority.

## Verify, then assigned one-shot launch

From PowerShell:

~~~powershell
Set-Location 'D:/mmo-idle/volcano-heat-management-01/candidate'
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/volcano-heat-management.mjs --mode=verify --packet=D:/mmo-idle/volcano-heat-management-01/packet
~~~

The verify command is tested during preparation. Actual child entrypoints are tested with zero World ticks by qualification and receipt replay. The run command below is deliberately not launched during preparation:

~~~powershell
pnpm --filter @mmo-idle/server exec tsx --conditions=development ../scripts/volcano-heat-management.mjs --mode=run --packet=D:/mmo-idle/volcano-heat-management-01/packet --out=D:/mmo-idle/volcano-heat-management-01/run-01
~~~

The filtered command runs from candidate/server; ../scripts is intentional. Keep process output and terminal complete.json or partial.json. Never remove launch markers. Source/readback/process faults are operational failures, not class losses. A publication fault does not authorize another combat run. Watchdogs enforce one child, zero retries, 5 GiB disk, 1 GiB free host RAM, 2 GiB child RSS, and 120 seconds without progress. The inherited 8-hour soft scheduling deadline finishes the active observation and preserves the rest as not run.

## Queue and interpretation

Manifest order is authoritative: H uses seeds 101009 then 101033; each seed uses Wavecrest, Pyromancer, Duelist, each H0/H1/H2. N follows, then B; each seed runs baseline then candidate. All steps are 100 ms and first owner death stops the life.

- H: 18 lives, 40 minutes, clean native Heat and ecology. All three arms use candidate source. H0 no status wait; H1 adds ordinary Always → Wait It Out; H2 adds Always → Wait It Out / Manage Heat. Other package fields stay identical. H0 costs Wavecrest 40, Pyromancer 40, Duelist 43 out of 45 RP; H1/H2 add exactly 1 RP. Ordinary gear +4, supports +0, GM148 and exact mastery unchanged.
- N: 4 ten-minute Ritualist primary Tundra lives; mode unequipped on both sources.
- B: 4 five-minute archived T3 Heavy Slinger Volcano boss lives; exact +4 snapshot, mode unequipped. Preserve boss kill, first death and simultaneous terminals. This is current-source regression, not historical time reproduction.

Read final qualified package receipts. The source manifest was copied from the completed runs and is checked against their actual final readbacks (equipment/upgrades, mastery, skills, ownership/purchases, abilities, rites and RP). No package was regenerated from the older all-Mountain catalogue.

## Report and publication

Publish REPORT.md, compact results-summary.json, candidate.diff, resolved-builds.json, source/runtime/hitbox/initial-state receipts, completion counts and hashed raw inventory. Keep event/sample streams external. Carry CLASS_CLOSEOUT.md forward. Update the documentation index when publishing the final report. Commit and push scoped publication on codex/volcano-heat-management-01-packet, then verify the remote ref and readable report blob. Return full measured SHAs, publication SHA, report path and planned/completed/dead/failed/not-run counts.

Report H cumulative work at 5/10/20/30/40 minutes and 0–10/10–20/20–30/30–40 intervals. Missing post-death endpoints stay null. Report completed kills and HP damage separately, lifetime work, time-to-death, early deaths, late progress, Heat peaks per cycle, wait/request/resume counts, interruptions, native combat grace, owner/summon threats, owner HP/barrier, blocked resumption and native recovery overlap. The runner stores Heat observations in samples.jsonl and transition/timing summaries in each summary.json; no exclusive healing/damage attribution is implied. Native phase and explicit summon counts are separate observations. Hold time is decision-state occupancy, which includes post-combat grace and may overlap native HP recovery.

Main comparison H2 versus H0 is within identity, seed and common observed checkpoint. H2 versus H1 is a whole-policy comparison because ordinary Wait It Out waits for other afflictions. Later routes/packs can diverge. A survivor with no recent useful work is not success; an arm never reaching 25 has not exercised Heat management. Persistent real aggression blocking a break is an observed limitation, never permission to force cooling or retune.

The proposed practical targets are roughly <=25% time holding and >=80% same-window H0 work where both survive. They are review targets, not automatic significance/pass rules. Also compare H1 efficiency directly. Forty minutes supports bounded repeated-cycle evidence, not indefinite farming safety or clearance of early failures.

Return exactly one evidence-backed disposition after execution: adopt tested behavior; revise a named aspect for designer approval; or reject/defer. No automatic follow-on. Designer approval governs adoption and remaining release risks.
