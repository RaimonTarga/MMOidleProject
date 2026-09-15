# Durability 1 — broad T3 HP response trial

Prepared 2026-09-15. READY; full experiment NOT executed. Luna operates the fixed
batch and reports. No subagents, build edits, live balance changes, retries or
automatic follow-on experiments.

## Question and boundary

How does extending enemy life change TTK, mechanic exposure, pressure and build
performance across T3? This is the HP-only stage of the agreed durability work.
Defense profiles (plating, DR, DoT resistance) follow AFTER review, with their
actual mitigation semantics audited first. The new slam remains deferred.

Use the existing real-World in-process survey with normal AI, combat, ecology,
repopulation and 100ms ticks. Synthetic fully prepared characters, no earned
progression, travel, economy, persistence or client validation. HP treatments
are experimental and cannot be presented as current live balance. Live monster
definitions, damage, defenses, rewards, population and mechanics remain unedited.
The process temporarily overlays definition HP before spawning and restores it
after each world; normal repopulation inherits the same treatment. No Docker.

## Fixed matrix

Six baseline families retain the prior survey builds, medium frame and normal
range. Conduit axe/on-hit and Slinger on-hit/DoT alternatives are also included
throughout T3; nothing besides that weapon differs within those comparisons.
Matching-biome armor/charm, Mountain boots, Tempered Core, +5 legal gear, no relic,
Offensive stance, Frenzy/Sweep/Second Wind/Cleanse and the existing automatic
rules are unchanged. Exact builds: `server/bench/balance/ttkSurveySpec.ts` and
`server/bench/balance/durabilityTrialSpec.ts`.

| T3 node | Control | HP-low | HP-high |
|---|---|---|---|
| `node-t3-cave-02` | Current | +25% | +50% |
| `node-t3-mountain-04` | Current | +25% | +50% |
| `node-t3-swamp-03` | Current | +25% | +50% |
| `node-t3-tundra-03` | Current | +25% | +50% |
| `node-t3-desert-03` | Current | Controllers +25% | Controllers +50% |
| `node-t3-jungle-03` | Current | +10% | +20% |
| `node-t3-volcanic-03` | Current | +10% | +20% |

Desert controllers are Dune Stalker (`dune-stalker`) and Desert Basilisk
(`desert-basilisk`); Sandweaver dealer HP stays unchanged. Jungle/Volcano receive
modest across-population increases in this first screen. Differentiating their
swarm bodies and supporting enemies is a subsequent tuning option, not an
operator decision. HP rounds to the nearest integer before normal spawn scaling.

T1 and T2 Cave02/Mountain04 controls retain all six original baseline classes
without HP treatments or alternate weapons. These 24 reference cells anchor
tier comparisons; they do not test T2 buffs. Forest and Plains have no T3 nodes.
One natural node per each of seven T3 biomes gives breadth, not exhaustive
node/modifier/elite coverage. No bosses in this trial.

168 T3 cells (7 nodes x 8 builds x 3 treatments) + 24 reference cells = 192.
Seeds173,947,2027 for every cell = 576 observations. Each lasts at most300
simulated seconds, stops on first death. Maximum48 simulated hours. Previous
survey throughput suggests roughly an hour wall time, but this is an estimate;
longer fights/pathfinding may increase it. Four-hour batch/two-minute replicate
wall ceilings and2GiB RSS ceiling remain enforced. Wall limits are censored
tooling outcomes, not combat failures. One process, sequential observations.

## Frozen identity and qualification

- Revision: `bc559b0228ed4a2d08b1f0f721d99ed873d6056a`
- Tree: `705adbc5661fd99b507685e296ecd5965db0db15`
- Untreated definitions hash: `40158eea807ae06a5b531fe40d7ad05fb74eed79900a26503f7ee58f394f3ab1`
- Hitboxes: `C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json`
- Hitbox SHA256: `08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83`
- Zero-tick qualification: `C:/Users/osaif/AppData/Local/mmo-idle/validation/durability-trial/frozen-qualification`
- Qualification index SHA256: `700C133C65FCC26EBEF55C137257810CB9CBC841061AA5078AD7A16C7008FFA6`

All192 cells qualified: node population, legal gear/abilities/runes, frame/range.
The preparation check compared112 treatment/control pairs: identical initial
identities/positions and actual increased HP only for listed treated types.
Three30-second instrumentation pilots exercised Desert controller HP, Jungle
alternate Conduit and Volcano control; artifacts are in the sibling `pilot`
directory. Pilot ran immediately before committing the same tooling, so its
manifest names the parent revision; it is instrumentation evidence only.
An initial qualification attempt caught a nonexistent Forest T3 node and was
retained separately; corrected frozen qualification is the authoritative input.
Focused overlay/restoration/world-spawn test and server diagnostic/bench
typechecks passed. Full game suite and live playtests were not run.

## Execute exactly once

From the shared repository, create an isolated checkout. Preserve dirty files.

```powershell
$durRevision = 'bc559b0228ed4a2d08b1f0f721d99ed873d6056a'
$durRoot = 'C:/Users/osaif/AppData/Local/mmo-idle/experiments/durability1-20260915'
$durCheckout = "$durRoot/source"
$durHitboxes = 'C:/Users/osaif/AppData/Local/mmo-idle/validation/ttk-survey/hitboxes.json'
if (Test-Path -LiteralPath $durRoot) { throw 'Output exists; inspect and report, never overwrite or relaunch.' }
if ((Get-FileHash -LiteralPath $durHitboxes).Hash -ne '08BCC55633EFE444D303C71977F7DCF87402157753AF543E975E6C0C493AFA83') { throw 'Hitbox mismatch' }
New-Item -ItemType Directory -Path $durRoot | Out-Null
git worktree add --detach "$durCheckout" $durRevision
if ($LASTEXITCODE -ne 0) { throw 'Worktree setup failed' }
pnpm --dir "$durCheckout" install --offline --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed' }
git -C "$durCheckout" rev-parse HEAD 'HEAD^{tree}'
git -C "$durCheckout" status --short
```

Verify exact revision/tree and clean tracked source, then run once:

```powershell
pnpm --dir "$durCheckout" --filter @mmo-idle/server exec tsx --conditions=development scripts/ttkSurvey.ts --trial=durability --mode=run "--revision=$durRevision" "--hitboxes=$durHitboxes" "--out=$durRoot/results"
```

Record exit status. Deaths continue to the next declared cell. Interruption or
failed.json ends the packet; preserve partial artifacts, no replacement batch.
If index.json exists, generate descriptive tables even for a partial batch:

```powershell
node "$durCheckout/scripts/ttk-survey-report.mjs" "$durRoot/results"
```

Check complete.json:192 cells/576 runs, correct trial/mode, no failed.json;
verify manifest hashes. Preserve checkout/results. No services to stop, Docker
cleanup, database writes or live server changes are required.

## Required report

Write `docs/briefs/bot-balance-durability1-report.md` in the shared repository,
index it in docs/README.md. Include UTC/wall duration, completion, memory/disk
observations, exact artifact paths/hashes and all censored/failed slots.

1. Compare each treatment to its SAME class/weapon/node/seed control. Initial
   `geometryRosterHash` must match: HP-inclusive hashes intentionally differ.
   Confirm ready.hpTreatment matches actual initial HP and Desert dealer is
   unchanged. Later pulls/random choices may diverge; seeds are not identical
   combat traces. Report enemy-type results before node-wide aggregate claims.
2. Report seed-level first-damage-to-kill TTK, clean/censored/HP-regain counts,
   same-tick kills, deaths, minHP, peak hit/one-second damage, recovery and casts
   started/fired. Use medians of seed medians, not hundreds of independent kills.
   Retain enemy-type counts and actual spawned HP. No numerical target TTK or
   automatic winner selection has been approved.
3. Show engagement durations with initial/late participants. They may combine
   repopulation and successive pulls: NOT authored-pack clears. Show pressure
   alongside TTK; extra mechanic exposure may require future damage reductions.
4. Compare Slinger and Conduit alternatives within the SAME HP treatment. Report
   survival and censoring beside speed. Test whether longer enemy life changes
   weapon tradeoffs, without claiming that HP alone identifies a defense profile.
5. Audit inactivity independently: report longest gaps without outgoing player
   OR owned-summon damage, last kill, remaining enemies, movement and recovery.
   Conduit player attack count alone is not activity evidence. For Volcano
   outliers inspect samples.staticDamageContacts (actual authoritative terrain
   damage contact, including lava), movement paths, autoIntent/target, position,
   and hazard-escape events in events.jsonl. One-second sampling can miss brief
   contact. No contact does not rule out hazard-aware path blockage. A movement
   stall is a contaminated pacing result, not proof that higher HP is safe.
6. Conclude by biome/enemy role: useful extra lifetime, excessive pressure,
   sparse/confounded, or little effect. Distinguish candidate HP changes from
   future defense/damage work. Flag Tundra's control/kiting and Swamp hazards
   without changing the builds during execution.

Return for Astra/user review before any defense treatment, new ability, live
balance patch, build adaptation or extra attempt. The proposed later defense
stage will compare selected plating/DR/DoT-resistance profiles against an
HP-only reference after auditing which damage paths each layer actually affects.
