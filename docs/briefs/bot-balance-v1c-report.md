# V1c execution report — Striker preparation acquisition only

2026-09-12. Operator report for the [V1c operator packet](bot-balance-v1c-operator-packet.md).
This records the one exact frozen execution. No source, route, manifest, runtime,
economy, or assertion changes were made. There was no resource injection, gate
weakening, retry, ceiling extension, tactical intervention, snapshot import,
boss attempt, cleanup, relaunch, or automatic retry.

`pnpm bot:preflight` passed before creation. That is harness and semantic
validation, not balance evidence.

## Result

**Disposition: preparation/travel timeout; V1c readiness not achieved; no encounter.**
The fresh intended run reached Tier 1, GM30, all five Tier-1 biome level-6
milestones, the requested Sweep/Second Wind Rune build, and Chaotic Axe +5. It
then entered the Plains Vest +5 objective, died once during the attempted return
to Plains, and never arrived at the required `node-t1-plains-01` supplier. The
route ended after 88 of 105 steps with the Plains Vest, Swamp Charm, and Plains
Boots still at +4. None of the required `v1c:verified-plains-build`,
`v1c:preparation-complete`, or `v1c:final-readiness` markers was emitted.

The configured experiment ceiling was 1,800,000 ms, but the route's bounded
arrival wait ended the run at 1,365,341 ms (22m45.341s) with the terminal reason
`timed out waiting for arrive at node-t1-plains-01`. This is an observed route
boundary, not evidence that more time after the travel stall would have
completed the kit.

Setup/run timing was: experiment created at 21:04:28.318Z; supervisor started
at 21:05:31.432Z; the worker run started at 21:05:41.280Z; the worker summary
ended at 21:28:26.621Z; and supervisor finalization completed at 21:28:38.314Z.

| Field | Recorded value |
|---|---|
| Experiment ID | `20260912t210230z-striker-campaign-preparation-t` |
| Route / version | `striker-campaign-preparation-t1` / `1.0.0` |
| Run | `001-striker-campaign-preparation-t1-intended-r01` |
| Requested / executed revision | `3ad6dbdab621d6ffc1979ac25ffe7000dbab765e` |
| Exported source tree | `fe5acbb267893584ab0a31c88d4d6b58914f2af7` |
| Immutable image | `sha256:5dcc76f648b135f262a607a7e3e4983bd6c6198aa1fdb8115823e3c967ba1efe` |
| Image tag / build identity | `mmo-idle-experiment:3ad6dbdab621-d90e6996` / `5d32b4ee0e94675f6e77d921` |
| Manifest SHA-256 | `6f05db26f8c3af8adab18192b55facb6d72090628a81b848a46fc1c7a75b77a4` |
| Tooling / copied-runtime tree hashes | `d90e699634554f55e1d22fd22652fa1c4cee5fa67250f05b6e5ae47419815db1` / `8e48ec4278c22f820a90de56886aafeb25e34f0e780411d763bb38ae60259c40` |
| Invocation | `develop`, clean; dirty changes excluded from the image |
| Class / root / final frame | Striker / `cadence-root` / `null` |
| Config | `smoke-isolated`, one worker/run, `intended`, `rewardMultiplier=25`, clean entry |
| Inputs | fresh Clearing entry; `tierEntrySnapshot=null`; `fastBossRetry=false` |
| Limit / retries | `maxRunMs=1800000`; automatic retries `0`; manual retries `0` |
| Worker terminal | `failed` — arrival timeout at 1,365,341 ms |
| Supervisor terminal | `completed`; final state agrees with worker result and cohort summary |
| Evidence flags | `canonical=false`, `soloBaselineEligible=false`, `combatEvidenceEligible=false`, `economyEvidenceEligible=false`, `treatmentValidity=not-asserted` |

The [sealed manifest](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/experiment.json>)
and [manifest hash](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/experiment.sha256>)
were checked before launch. They record the requested revision, source tree,
image, clean entry, null tier-entry snapshot, `25x` multiplier, and zero retry
settings. The copied [runtime](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runtime/lib.mjs:70>)
contains the unique temporary filename and bounded rename retry from the frozen
revision; its tree hash matches the manifest.

## Preparation progression

The run began with no inventory, recipes, essences, known abilities, or tier
entry snapshot. It remained Tier 1 and never acquired a frame. The authoritative
[run summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/summary.json>)
reports the final progression and route boundary.

| Run-relative time | Observed progression |
|---:|---|
| 130,652 ms | Tier 1 entered |
| 131,431 ms | Tier-0 quest complete |
| 139,455 ms | Clearing set complete |
| 172,509 ms | Plains level 6 / GM6 |
| 217,578 ms | Forest level 6 / GM12 |
| 244,625 ms | Swamp level 6 / GM18 |
| 430,323 ms | Mountain level 6 / GM30 |
| 446,853 ms | Cave level 6 / `all-biomes-maxed`; Snapshot A captured |

The [milestone sequence](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1047>)
is authoritative. [Snapshot A](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/snapshot-a.json>)
and its [index](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/snapshot-index.json>)
are non-canonical GM30 captures, not inputs or ready-state exports.

### Build and final kit boundary

The exact requested build was authoritatively observed at 443,343 ms:
Sweep / Second Wind, five ordered Runes (`auto-path-enemy`, `step-back`,
`chase-enemy`, `avoid-hazards`, `wait-for-regen`), and 19/22 RP. The
[verified build-change event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1021>)
is an earlier route build verification; it is not the required labeled
`v1c:verified-plains-build` step. Expose Weakness was learned but was not
selected for the observed build ([learn step](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1025>)).

| Required assertion | Observation |
|---|---|
| Player tier / frame | Tier 1; no frame (`frameId=null`) |
| Global mastery / biome levels | GM30; Clearing 4; Plains, Forest, Swamp, Cave, Mountain 6 |
| Chaotic Axe +5 | Reached at 764,674 ms |
| Plains Vest T1 +5 | Not reached; remained +4 |
| Swamp Charm T1 +5 | Not reached; remained +4 |
| Plains Boots T1 +5 | Not reached; remained +4 |
| Technique / Guard | Sweep / Second Wind |
| Runes / RP | `auto-path-enemy`, `step-back`, `chase-enemy`, `avoid-hazards`, `wait-for-regen`; 19 / 22 |
| Stance / Rite / Core / Relic | None observed or equipped |
| Required V1c markers | None: `v1c:verified-plains-build`, `v1c:preparation-complete`, `v1c:final-readiness` |

The final equipped state was Chaotic Axe, Mountain Vest T1, Swamp Charm T1,
and Plains Boots T1, with no Core or Relic. Final upgrade levels were Iron
Broadsword +1, Plains Vest +4, Plains Charm +2, Plains Boots +4, Flash Rapier
+4, Swamp Charm +4, Mountain Vest +4, and Chaotic Axe +5. The [final equipment
and build summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/summary.json>)
is authoritative.

## Resource blocks, supplier arrivals, and travel

The run records three completed/attempted upgrade resource blocks plus the
earlier Rune and +4 preparation blocks. Route-level durations include travel
while the objective remained active; `purpose=travel` samples are not supplier
farming.

| Objective | Block boundary | Missing at start | Supplier / result |
|---|---:|---|---|
| `avoid-hazards` Rune | 227,587–235,094 ms (7,507 ms) | 25 Purple essence and Swamp level 2 | Swamp supplier farming completed; Rune forged and build continued ([start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:540>), [end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:556>)) |
| Plains Boots +4 | 420,812–429,822 ms (9,010 ms) | 31 Might essence | Plains fortified node supplied the resource; +4 completed ([start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:954>), [end](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:972>)) |
| Chaotic Axe +5 | 446,866–764,672 ms (317,807 ms recorded) | 11 Deep essence and 1 Swarming catalyst | Cave 03 Swarming farming supplied both; catalyst at 764,449 ms and +5 at 764,674 ms ([catalyst](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1643>), [upgrade](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1647>)) |
| Plains Vest +5 | 765,174–1,365,331 ms (600,161 ms recorded) | 45 Might essence and 1 Alacrity catalyst | Target was Plains 01, but no arrival occurred; travel remained active through Cave 06, Forest 04, and Clearing, with no Alacrity supplier farming ([start](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1650>), [terminal block](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:2546>)) |

After the Axe upgrade, the run entered [Cave 06](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1668>),
then [Forest 04](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1716>),
and after the second death returned to [Clearing](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1755>).
The event stream continued to label the samples `purpose=travel` through the
terminal boundary. The route therefore demonstrates a travel/arrival stall,
not a completed Alacrity supplier-farming result. The terminal [route step](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:2548>)
records the same reason.

At the final boundary, the wallet held 11,896 Red, 124 Blue, 1,397 Green, 75
Yellow, and 45 Purple essence. The only catalyst in the wallet was no longer
present: one Swarming catalyst had been gained and spent on the Axe. Alacrity
was still missing. The run summary reports 268,049 ms of direct resource-block
accounting; this excludes the travel samples that kept the Plains Vest
objective active.

## Combat, deaths, and recovery

The run recorded 49 ordinary kills, 3,426 damage taken, 8,324 player damage
dealt, and 3,093 healing. It recorded two ordinary deaths and about 4,000 ms of
dead time:

| Time | Boundary | Evidence |
|---:|---|---|
| 306,193 ms | Cave Lurker melee death during `travel mountain T1`; one attacker | [death record](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:728>) |
| 825,515 ms | Wolf/Young Wolf melee death in Forest 04 while Plains Vest +5 was active; up to eight attackers | [death record](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/events.jsonl:1751>) |

Sweep activated 34 times and Second Wind 12 times. Step Back activated 11
times, with 11 successful attempts and zero damage received. The deaths are
ordinary travel/combat evidence and are not a boss failure. The [deaths stream](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/artifacts/striker-campaign-preparation-t1-intended-2026-09-12T21-05-41-270Z-46982a34/deaths.jsonl>)
and [resource samples](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/resource-samples.jsonl>)
preserve the recovery and runtime boundaries.

## Encounter evidence

No encounter was reached, as required by the V1c packet. There was no dungeon,
guardian, altar, boss, boss HP, phase, boss death, or boss victory event. The
authoritative summary records `bosses.attempts=0`, `bosses.victories=0`, and
`bossesCleared=[]`. This run is not evidence for or against Striker Plains boss
viability.

## Supervisor and preserved artifacts

The [worker result](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/worker-result.json>)
and final [worker heartbeat](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/runs/001-striker-campaign-preparation-t1-intended-r01/worker-heartbeat.json>)
agree on the failed arrival timeout, and the last heartbeat health status was
`ok` with zero consecutive health failures. The [supervisor event log](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/supervisor-events.jsonl:4>)
records the terminal run; its [completion event](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/supervisor-events.jsonl:5>)
records normal supervisor finalization. The [cohort summary](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/cohort-summary.json>)
reports maximum memory 175 MiB, container CPU 49.5%, event-loop p99 37.8 ms,
and 274 resource samples.

The run's persistent database identifiers and artifact root remain in the
[experiment state](</C:/Users/osaif/AppData/Local/mmo-idle/experiments/20260912t210230z-striker-campaign-preparation-t/state.json>).
The PostgreSQL volume `mmoexp-30d44899fd03-postgres-data`, PostgreSQL/Redis
containers, network, run summary, event stream, snapshots, and logs were
preserved. `runtime-secrets.json` and `run-config.json` are intentionally not
linked.

## Evidence disposition

| Evidence class | Disposition |
|---|---|
| Preparation | Partial: GM30/all five biome level-6 milestones and Chaotic Axe +5 reached; final three required +5 pieces and all V1c markers did not. |
| Travel / acquisition | Valid observation of a post-death arrival stall while targeting Plains 01; no Alacrity supplier arrival or farming result. |
| Gameplay / boss balance | Untested; V1c has no encounter step and recorded zero boss attempts. |
| Economy | Inadmissible for 1x balance: `rewardMultiplier=25` and `NON_CANONICAL_REWARD_MULTIPLIER`; no economy conclusion. |
| Infrastructure | Valid finalization; worker health remained good and supervisor records agree. |

Do not restore Snapshot A, resume this character, attempt a boss, or create a
follow-on experiment from this run. The narrow result is a partial acquisition
path with an observed travel/fight-back stall and one transit death, not a boss
failure or a class-wide tuning result. Return to Astra for the next decision on
the remaining kit and travel boundary.
